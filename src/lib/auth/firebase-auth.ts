// src/lib/auth/firebase-auth.ts
// FIXED: Single global auth state, no multiple listeners

"use client";

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase/client";
import { useState, useEffect, useCallback } from "react";

// Admin user interface
export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  customClaims: {
    admin?: boolean;
    role?: "super_admin" | "moderator" | "viewer";
    permissions?: string[];
  };
}

// Custom claims interface
interface FirebaseCustomClaims {
  admin?: boolean;
  role?: "super_admin" | "moderator" | "viewer";
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

let globalListeners: ((state: typeof globalAuthState) => void)[] = [];
let authUnsubscribe: (() => void) | null = null;

// Initialize auth once globally
async function initializeGlobalAuth() {
  if (globalAuthState.initialized) return;

  try {
    console.log("🔐 Initializing global Firebase Auth...");
    const auth = await getFirebaseAuth();

    if (!auth) {
      console.error("❌ Firebase Auth not available");
      globalAuthState.loading = false;
      notifyGlobalListeners();
      return;
    }

    // Single auth state listener
    authUnsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        console.log("🔄 Global auth state changed:", user?.email || "no user");

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
    notifyGlobalListeners();
  }
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
    console.log("🔐 Attempting sign in for:", email);
    const auth = await getFirebaseAuth();

    if (!auth) {
      return {
        success: false,
        error:
          "Authentication service not available. Please refresh and try again.",
      };
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Check if user has admin privileges
    const tokenResult = await user.getIdTokenResult();
    const claims = tokenResult.claims as FirebaseCustomClaims;
    const isAdmin = claims.admin === true;

    if (!isAdmin) {
      await signOut();
      return {
        success: false,
        error: "Access denied. This account does not have admin privileges.",
      };
    }

    console.log("✅ Sign in successful");
    return { success: true };
  } catch (error: unknown) {
    console.error("❌ Sign in error:", error);
    return {
      success: false,
      error: getErrorMessage(error as { code?: string; message?: string }),
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
    console.log("👋 User signed out");
  } catch (error) {
    console.error("❌ Sign out error:", error);
  }
}

// Error message helper
function getErrorMessage(error: { code?: string; message?: string }): string {
  if (!error.code) return error.message || "Unknown error occurred";

  switch (error.code) {
    case "auth/user-not-found":
      return "No account found with this email address.";
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

// React hook for authentication
export function useAdminAuth() {
  const [authState, setAuthState] = useState(globalAuthState);

  useEffect(() => {
    // Initialize global auth on first hook usage
    if (!globalAuthState.initialized) {
      initializeGlobalAuth();
    }

    // Subscribe to global auth state
    const listener = (newState: typeof globalAuthState) => {
      setAuthState(newState);
    };

    globalListeners.push(listener);

    // Set initial state
    setAuthState({ ...globalAuthState });

    // Cleanup
    return () => {
      const index = globalListeners.indexOf(listener);
      if (index > -1) {
        globalListeners.splice(index, 1);
      }
    };
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    isAdmin: authState.user?.isAdmin || false,
    hasRole: (role: "super_admin" | "moderator" | "viewer") =>
      authState.user?.customClaims.role === role,
    hasPermission: (permission: string) =>
      authState.user?.customClaims.permissions?.includes(permission) || false,
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
  globalListeners = [];
  globalAuthState = {
    user: null,
    loading: true,
    initialized: false,
  };
}
