// src/lib/auth/firebase-auth.ts
// FIXED: Prevents infinite re-render loops

"use client";

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase/client";
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
  };
}

// Custom claims interface with updated roles
interface FirebaseCustomClaims {
  admin?: boolean;
  role?: "super_admin" | "lgu_admin" | "field_admin" | "moderator" | "viewer";
  permissions?: string[];
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
let initializationPromise: Promise<void> | null = null;

// Initialize auth once globally
async function initializeGlobalAuth(): Promise<void> {
  // Prevent multiple initializations
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (globalAuthState.initialized) return;

    try {
      console.log("🔐 Initializing global Firebase Auth...");
      const auth = await getFirebaseAuth();

      if (!auth) {
        console.error("❌ Firebase Auth not available");
        globalAuthState.loading = false;
        globalAuthState.initialized = true;
        notifyGlobalListeners();
        return;
      }

      // Single auth state listener
      authUnsubscribe = onAuthStateChanged(
        auth,
        async (user: User | null) => {
          console.log(
            "🔄 Global auth state changed:",
            user?.email || "no user"
          );

          if (user) {
            try {
              const tokenResult = await user.getIdTokenResult();
              const customClaims = tokenResult.claims as FirebaseCustomClaims;

              globalAuthState.user = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                isAdmin: customClaims.admin === true,
                customClaims: {
                  admin: customClaims.admin,
                  role: customClaims.role,
                  permissions: customClaims.permissions,
                },
              };

              console.log("✅ User authenticated globally:", {
                email: user.email,
                isAdmin: globalAuthState.user.isAdmin,
                role: customClaims.role,
              });
            } catch (error) {
              console.error("❌ Error processing user token:", error);
              globalAuthState.user = null;
            }
          } else {
            console.log("👤 No user signed in globally");
            globalAuthState.user = null;
          }

          globalAuthState.loading = false;
          notifyGlobalListeners();
        },
        (error) => {
          console.error("❌ Global auth state change error:", error);
          globalAuthState.user = null;
          globalAuthState.loading = false;
          notifyGlobalListeners();
        }
      );

      globalAuthState.initialized = true;
      console.log("✅ Global Firebase Auth initialized");
    } catch (error) {
      console.error("❌ Global auth initialization failed:", error);
      globalAuthState.loading = false;
      globalAuthState.initialized = true;
      notifyGlobalListeners();
    }
  })();

  return initializationPromise;
}

function notifyGlobalListeners() {
  globalListeners.forEach((listener) => {
    try {
      listener({ ...globalAuthState });
    } catch (error) {
      console.error("❌ Error in global auth listener:", error);
    }
  });
}

// Sign in function
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
          "Firebase Auth not ready. Please refresh the page and try again.",
      };
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Check if user has admin claims
    const tokenResult = await user.getIdTokenResult();
    const claims = tokenResult.claims as FirebaseCustomClaims;
    const isAdmin = claims.admin === true;

    if (!isAdmin) {
      await signOut();
      return {
        success: false,
        error: "Access denied. Admin privileges required.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Admin sign in error:", error);
    return {
      success: false,
      error: getErrorMessage(error as { code: string }),
    };
  }
}

// Sign out function
async function signOut(): Promise<void> {
  try {
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

// FIXED: React hook for authentication - prevents infinite loops
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

    // Cleanup on unmount
    return () => {
      if (listenerRef.current) {
        globalListeners.delete(listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, []); // Empty dependency array is safe now

  return {
    user: authState.user,
    loading: authState.loading,
    isAdmin: authState.user?.isAdmin || false,
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
  globalListeners.clear();
  globalAuthState = {
    user: null,
    loading: true,
    initialized: false,
  };
  initializationPromise = null;
}
