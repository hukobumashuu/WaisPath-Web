// src/lib/auth/firebase-auth.ts
// ENHANCED: Authentication system with real-time account status checking and automatic signout

"use client";

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase/client";
import { getFirebaseDb } from "../firebase/client"; // Import Firestore
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
    deactivated?: boolean; // NEW: Track deactivated state
  };
  accountStatus?: "active" | "deactivated" | "suspended"; // NEW: Real-time status
}

// Custom claims interface with updated roles
interface FirebaseCustomClaims {
  admin?: boolean;
  role?: "super_admin" | "lgu_admin" | "field_admin" | "moderator" | "viewer";
  permissions?: string[];
  deactivated?: boolean; // NEW: Track deactivated state
  [key: string]: unknown;
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

const globalListeners: Set<(state: typeof globalAuthState) => void> = new Set();
let authUnsubscribe: (() => void) | null = null;
let statusUnsubscribe: (() => void) | null = null; // NEW: Status listener
let initializationPromise: Promise<void> | null = null;

// NEW: Function to check account status in Firestore
async function checkAccountStatus(
  email: string
): Promise<"active" | "deactivated" | "suspended" | null> {
  try {
    const db = await getFirebaseDb();
    if (!db) return null;

    // Query admins collection by email
    const { collection, query, where, getDocs } = await import(
      "firebase/firestore"
    );
    const adminsRef = collection(db, "admins");
    const q = query(adminsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const adminDoc = querySnapshot.docs[0];
      return adminDoc.data().status || "active";
    }

    return null;
  } catch (error) {
    console.error("Failed to check account status:", error);
    return null;
  }
}

// NEW: Set up real-time status monitoring
async function setupStatusMonitoring(email: string): Promise<() => void> {
  try {
    const db = await getFirebaseDb();
    if (!db) return () => {};

    const { collection, query, where, onSnapshot } = await import(
      "firebase/firestore"
    );
    const adminsRef = collection(db, "admins");
    const q = query(adminsRef, where("email", "==", email));

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const adminDoc = snapshot.docs[0];
          const status = adminDoc.data().status || "active";

          // Update global auth state with new status
          if (globalAuthState.user) {
            globalAuthState.user.accountStatus = status;

            // NEW: Automatic signout for deactivated accounts
            if (status === "deactivated" || status === "suspended") {
              console.warn(`🚨 Account ${status}. Signing out...`);
              handleAccountDeactivation(status);
            }

            notifyGlobalListeners();
          }
        }
      },
      (error) => {
        console.error("Status monitoring error:", error);
      }
    );
  } catch (error) {
    console.error("Failed to setup status monitoring:", error);
    return () => {};
  }
}

// NEW: Handle account deactivation
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
        "🔐 Initializing enhanced Firebase Auth with status monitoring..."
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
                // NEW: Check account status in Firestore
                const accountStatus = await checkAccountStatus(
                  firebaseUser.email!
                );

                // Verify account is still active
                if (
                  accountStatus === "deactivated" ||
                  accountStatus === "suspended"
                ) {
                  console.warn(
                    `🚨 Account ${accountStatus} detected during auth check`
                  );
                  await handleAccountDeactivation(accountStatus);
                  return;
                }

                // Set up real-time status monitoring
                if (statusUnsubscribe) {
                  statusUnsubscribe();
                }
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
                  accountStatus: accountStatus || "active", // NEW: Include status
                };

                globalAuthState.user = adminUser;
                console.log(
                  "✅ Admin authenticated:",
                  adminUser.email,
                  `(${adminUser.accountStatus})`
                );
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

// ENHANCED: Sign in function with status validation
async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getFirebaseAuth();
    if (!auth) {
      return {
        success: false,
        error:
          "Authentication service unavailable. Please refresh the page and try again.",
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
      return {
        success: false,
        error:
          "Your account has been deactivated. Please contact your administrator.",
      };
    }

    // Check admin privileges
    const isAdmin = claims.admin === true;
    if (!isAdmin) {
      await signOut();
      return {
        success: false,
        error: "Access denied. Admin privileges required.",
      };
    }

    // NEW: Additional Firestore status check
    const accountStatus = await checkAccountStatus(email);
    if (accountStatus === "deactivated" || accountStatus === "suspended") {
      await signOut();
      const statusText =
        accountStatus === "deactivated" ? "deactivated" : "suspended";
      return {
        success: false,
        error: `Your account has been ${statusText}. Please contact your administrator.`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Enhanced sign in error:", error);
    return {
      success: false,
      error: getErrorMessage(error as { code: string }),
    };
  }
}

// Sign out function with cleanup
async function signOut(): Promise<void> {
  try {
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

// ENHANCED: React hook for authentication with status monitoring
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

    // NEW: Listen for account status changes
    const handleAccountStatusChange = (event: CustomEvent) => {
      const { status, message } = event.detail;
      console.warn(`🚨 Account status changed to ${status}: ${message}`);

      // You can show a toast notification here
      // toast.error(message);
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
  }, []); // Empty dependency array is safe now

  return {
    user: authState.user,
    loading: authState.loading,
    isAdmin: authState.user?.isAdmin || false,
    accountStatus: authState.user?.accountStatus, // NEW: Expose account status
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

// NEW: Force refresh auth state (useful for testing)
export async function refreshAuthState(): Promise<void> {
  const auth = await getFirebaseAuth();
  if (auth?.currentUser) {
    // Force token refresh
    await auth.currentUser.getIdToken(true);
  }
}
