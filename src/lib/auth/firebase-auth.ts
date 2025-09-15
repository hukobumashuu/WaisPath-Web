// src/lib/auth/firebase-auth.ts
// FIXED: Authentication system with audit logging using client-side Firestore

"use client";

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  limit,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseAuth } from "../firebase/client";
import { getFirebaseDb } from "../firebase/client";
import { useState, useEffect, useCallback, useRef } from "react";

// Admin user interface with updated roles
export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  customClaims: {
    admin?: boolean;
    role?: "super_admin" | "lgu_admin" | "field_admin" | "moderator" | "viewer";
    permissions?: string[];
    deactivated?: boolean;
  };
  accountStatus?: "active" | "deactivated" | "suspended";
}

// Custom claims interface with updated roles
interface FirebaseCustomClaims {
  admin?: boolean;
  role?: "super_admin" | "lgu_admin" | "field_admin" | "moderator" | "viewer";
  permissions?: string[];
  deactivated?: boolean;
  suspended?: boolean;
}

// Global auth state
let globalAuthState: {
  user: AdminUser | null;
  loading: boolean;
  initialized: boolean;
} = {
  user: null,
  loading: true,
  initialized: false,
};

// Global listeners for auth state changes
const globalListeners = new Set<(state: typeof globalAuthState) => void>();

// Global auth unsubscribe function
let authUnsubscribe: (() => void) | null = null;
let statusUnsubscribe: (() => void) | null = null;
let initializationPromise: Promise<void> | null = null;

// Helper function to log authentication actions
const logAuthAction = async (
  action: "signin_success" | "signin_failed" | "signout",
  email?: string,
  error?: string
) => {
  try {
    // Get auth token for successful actions
    let authToken = null;
    if (action === "signin_success" || action === "signout") {
      try {
        const auth = await getFirebaseAuth();
        const currentUser = auth?.currentUser;
        if (currentUser) {
          authToken = await currentUser.getIdToken();
        }
      } catch (tokenError) {
        console.warn("Failed to get auth token for logging:", tokenError);
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch("/api/audit/auth", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action,
        email,
        error,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("📝 Auth audit log created:", result);
    } else {
      const error = await response.json();
      console.warn("Failed to create auth audit log:", error);
    }
  } catch (error) {
    console.warn("Auth audit logging failed:", error);
    // Don't break the app if audit logging fails
  }
};

// Check account status in Firestore (client-side)
async function checkAccountStatus(
  email: string
): Promise<"active" | "deactivated" | "suspended" | null> {
  try {
    const db = await getFirebaseDb();
    if (!db) return null;

    const adminsRef = collection(db, "admins");
    const q = query(adminsRef, where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const adminDoc = querySnapshot.docs[0];
      const adminData = adminDoc.data();
      const status = adminData.status;

      // Type check to ensure it's a valid status
      if (
        status === "active" ||
        status === "deactivated" ||
        status === "suspended"
      ) {
        return status;
      }
      return "active"; // Default to active if status is invalid
    }

    return null;
  } catch (error) {
    console.error("Error checking account status:", error);
    return null;
  }
}

// Setup status monitoring for real-time account status changes (client-side)
async function setupStatusMonitoring(
  email: string
): Promise<(() => void) | null> {
  try {
    const db = await getFirebaseDb();
    if (!db) return null;

    console.log(`👁️ Setting up status monitoring for ${email}`);

    const adminsRef = collection(db, "admins");
    const q = query(adminsRef, where("email", "==", email));

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!snapshot.empty) {
          const adminDoc = snapshot.docs[0];
          const adminData = adminDoc.data();
          const status = adminData.status;

          console.log(`📊 Status check for ${email}: ${status}`);

          if (status === "deactivated" || status === "suspended") {
            console.warn(
              `🚨 Account ${status} detected for ${email}. Signing out...`
            );
            handleAccountDeactivation(status);
          }

          notifyGlobalListeners();
        }
      },
      (error) => {
        console.error("Status monitoring error:", error);
      }
    );
  } catch (error) {
    console.error("Failed to setup status monitoring:", error);
    return null;
  }
}

// Handle account deactivation
async function handleAccountDeactivation(
  status: "deactivated" | "suspended"
): Promise<void> {
  try {
    // Clear auth state
    globalAuthState.user = null;
    notifyGlobalListeners();

    // Sign out from Firebase
    const auth = await getFirebaseAuth();
    if (auth) {
      await firebaseSignOut(auth);
    }

    // Clean up listeners
    if (statusUnsubscribe) {
      statusUnsubscribe();
      statusUnsubscribe = null;
    }

    // Show appropriate message
    const message =
      status === "deactivated"
        ? "Your account has been deactivated. Please contact your administrator."
        : "Your account has been suspended. Please contact your administrator.";

    // Use a custom event to notify the UI
    window.dispatchEvent(
      new CustomEvent("accountStatusChanged", {
        detail: { status, message },
      })
    );
  } catch (error) {
    console.error("Error handling account deactivation:", error);
  }
}

// Initialize auth once globally
async function initializeGlobalAuth(): Promise<void> {
  // Prevent multiple initializations
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (globalAuthState.initialized) return;

    try {
      console.log(
        "🔐 Initializing enhanced Firebase Auth with audit logging..."
      );
      const auth = await getFirebaseAuth();

      if (!auth) {
        console.error("❌ Firebase Auth not available");
        globalAuthState.loading = false;
        globalAuthState.initialized = true;
        notifyGlobalListeners();
        return;
      }

      // Single auth state listener with enhanced status checking
      authUnsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser: User | null) => {
          try {
            console.log(
              "🔄 Auth state changed:",
              firebaseUser?.email || "signed out"
            );

            if (firebaseUser) {
              // Get fresh token with claims
              const tokenResult = await firebaseUser.getIdTokenResult(true);
              const claims = tokenResult.claims as FirebaseCustomClaims;

              // Check if user has admin privileges
              const isAdmin = claims.admin === true && !claims.deactivated;

              if (isAdmin) {
                // Check account status in Firestore
                const accountStatus = await checkAccountStatus(
                  firebaseUser.email!
                );

                if (
                  accountStatus &&
                  accountStatus !== "deactivated" &&
                  accountStatus !== "suspended"
                ) {
                  // Setup status monitoring
                  statusUnsubscribe = await setupStatusMonitoring(
                    firebaseUser.email!
                  );

                  // Create admin user object with status
                  const adminUser: AdminUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    isAdmin: true,
                    customClaims: claims,
                    accountStatus: accountStatus,
                  };

                  globalAuthState.user = adminUser;
                  console.log(
                    "✅ Admin authenticated:",
                    adminUser.email,
                    `(${adminUser.accountStatus})`
                  );
                } else {
                  // Account is deactivated or suspended
                  globalAuthState.user = null;
                  if (claims.deactivated) {
                    console.warn("🚨 Deactivated account attempted login");
                  }
                }
              } else {
                // Not an admin or deactivated
                globalAuthState.user = null;
                if (claims.deactivated) {
                  console.warn("🚨 Deactivated account attempted login");
                }
              }
            } else {
              // User signed out
              globalAuthState.user = null;

              // Clean up status monitoring
              if (statusUnsubscribe) {
                statusUnsubscribe();
                statusUnsubscribe = null;
              }
            }

            globalAuthState.loading = false;
            notifyGlobalListeners();
          } catch (error) {
            console.error("Auth state change error:", error);
            globalAuthState.user = null;
            globalAuthState.loading = false;
            notifyGlobalListeners();
          }
        },
        (error) => {
          console.error("Auth state listener error:", error);
          globalAuthState.loading = false;
          notifyGlobalListeners();
        }
      );

      globalAuthState.initialized = true;
      console.log("✅ Enhanced auth initialization complete");
    } catch (error) {
      console.error("❌ Auth initialization failed:", error);
      globalAuthState.loading = false;
      globalAuthState.initialized = true;
      notifyGlobalListeners();
    }
  })();

  return initializationPromise;
}

// Notify all listeners about auth state changes
function notifyGlobalListeners(): void {
  globalListeners.forEach((listener) => listener({ ...globalAuthState }));
}

// ENHANCED: Sign in function with audit logging
async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getFirebaseAuth();
    if (!auth) {
      const error =
        "Authentication service unavailable. Please refresh the page and try again.";
      await logAuthAction("signin_failed", email, error);
      return {
        success: false,
        error,
      };
    }

    // Attempt sign in
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Get token with claims
    const tokenResult = await user.getIdTokenResult();
    const claims = tokenResult.claims as FirebaseCustomClaims;

    // Check for deactivated accounts first
    if (claims.deactivated) {
      await signOut();
      const error =
        "Your account has been deactivated. Please contact your administrator.";
      await logAuthAction("signin_failed", email, error);
      return {
        success: false,
        error,
      };
    }

    // Check admin privileges
    const isAdmin = claims.admin === true;
    if (!isAdmin) {
      await signOut();
      const error = "Access denied. Admin privileges required.";
      await logAuthAction("signin_failed", email, error);
      return {
        success: false,
        error,
      };
    }

    // Additional Firestore status check
    const accountStatus = await checkAccountStatus(email);
    if (accountStatus === "deactivated" || accountStatus === "suspended") {
      await signOut();
      const statusText =
        accountStatus === "deactivated" ? "deactivated" : "suspended";
      const error = `Your account has been ${statusText}. Please contact your administrator.`;
      await logAuthAction("signin_failed", email, error);
      return {
        success: false,
        error,
      };
    }

    // SUCCESS: Log successful sign-in
    await logAuthAction("signin_success", email);

    return { success: true };
  } catch (error) {
    console.error("Enhanced sign in error:", error);
    const errorMessage = getErrorMessage(error as { code: string });
    await logAuthAction("signin_failed", email, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ENHANCED: Sign out function with audit logging
async function signOut(): Promise<void> {
  try {
    // Log sign-out before actually signing out
    if (globalAuthState.user?.email) {
      await logAuthAction("signout", globalAuthState.user.email);
    }

    // Clean up status monitoring
    if (statusUnsubscribe) {
      statusUnsubscribe();
      statusUnsubscribe = null;
    }

    const auth = await getFirebaseAuth();
    if (auth) {
      await firebaseSignOut(auth);
    }

    globalAuthState.user = null;
    notifyGlobalListeners();
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

// Error message helper
function getErrorMessage(error: { code: string }): string {
  switch (error.code) {
    case "auth/user-not-found":
      return "No admin account found with this email address.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    case "auth/invalid-email":
      return "Invalid email address format.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return "Authentication failed. Please try again.";
  }
}

// React hook for authentication with status monitoring
export function useAdminAuth() {
  const [authState, setAuthState] = useState(globalAuthState);
  const listenerRef = useRef<((state: typeof globalAuthState) => void) | null>(
    null
  );

  useEffect(() => {
    // Initialize auth if not already done
    if (!globalAuthState.initialized) {
      initializeGlobalAuth();
    }

    // Create stable listener function
    if (!listenerRef.current) {
      listenerRef.current = (newState: typeof globalAuthState) => {
        setAuthState(newState);
      };
    }

    // Add listener if not already added
    if (!globalListeners.has(listenerRef.current)) {
      globalListeners.add(listenerRef.current);
    }

    // Set initial state only once
    setAuthState({ ...globalAuthState });

    // Listen for account status changes
    const handleAccountStatusChange = (event: CustomEvent) => {
      const { status, message } = event.detail;
      console.warn(`🚨 Account status changed to ${status}: ${message}`);
    };

    window.addEventListener(
      "accountStatusChanged",
      handleAccountStatusChange as EventListener
    );

    // Cleanup on unmount
    return () => {
      if (listenerRef.current) {
        globalListeners.delete(listenerRef.current);
        listenerRef.current = null;
      }
      window.removeEventListener(
        "accountStatusChanged",
        handleAccountStatusChange as EventListener
      );
    };
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    isAdmin: authState.user?.isAdmin || false,
    accountStatus: authState.user?.accountStatus,
    hasRole: useCallback(
      (
        role:
          | "super_admin"
          | "lgu_admin"
          | "field_admin"
          | "moderator"
          | "viewer"
      ) => authState.user?.customClaims.role === role,
      [authState.user]
    ),
    hasPermission: useCallback(
      (permission: string) =>
        authState.user?.customClaims.permissions?.includes(permission) || false,
      [authState.user]
    ),
    signIn: useCallback(signIn, []),
    signOut: useCallback(signOut, []),
  };
}

// Cleanup function for app unmount
export function cleanupAuth() {
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }

  if (statusUnsubscribe) {
    statusUnsubscribe();
    statusUnsubscribe = null;
  }

  globalListeners.clear();
  globalAuthState = {
    user: null,
    loading: true,
    initialized: false,
  };
  initializationPromise = null;
}

// Force refresh auth state (useful for testing)
export async function refreshAuthState(): Promise<void> {
  const auth = await getFirebaseAuth();
  if (auth?.currentUser) {
    // Force token refresh
    await auth.currentUser.getIdToken(true);
  }
}
