// src/lib/auth/firebase-auth.ts
// Secure Firebase Authentication with Custom Claims - No Hardcoded Keys

"use client";

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase/client";

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

// Firebase custom claims interface
interface FirebaseCustomClaims {
  admin?: boolean;
  role?: "super_admin" | "moderator" | "viewer";
  permissions?: string[];
  [key: string]: unknown;
}

class AdminAuthService {
  private currentUser: AdminUser | null = null;
  private authStateListeners: ((user: AdminUser | null) => void)[] = [];
  private initialized = false;

  constructor() {
    // Initialize auth when client is ready
    if (typeof window !== "undefined") {
      this.initializeAuth();
    }
  }

  private async initializeAuth() {
    try {
      if (this.initialized) return;

      // Wait for Firebase to be ready
      const auth = await getFirebaseAuth();
      if (!auth) {
        console.warn("⚠️ Firebase Auth not available, retrying...");
        // Retry after a short delay
        setTimeout(() => this.initializeAuth(), 1000);
        return;
      }

      // Listen to auth state changes
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            // Get custom claims to verify admin access
            const tokenResult = await user.getIdTokenResult();
            const customClaims = tokenResult.claims as FirebaseCustomClaims;

            this.currentUser = {
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
          } catch (error) {
            console.error("Error getting custom claims:", error);
            this.currentUser = null;
          }
        } else {
          this.currentUser = null;
        }

        // Notify listeners
        this.authStateListeners.forEach((listener) =>
          listener(this.currentUser)
        );
      });

      this.initialized = true;
      console.log("✅ Admin Auth initialized securely");
    } catch (error) {
      console.error("Auth initialization error:", error);
    }
  }

  // Sign in with email and password
  async signIn(
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
        await this.signOut();
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
        error: this.getErrorMessage(error as { code: string }),
      };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      const auth = await getFirebaseAuth();
      if (auth) {
        await firebaseSignOut(auth);
      }
      this.currentUser = null;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  // Get current admin user
  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  // Check if current user is admin
  isAdmin(): boolean {
    return this.currentUser?.isAdmin || false;
  }

  // Check specific admin role
  hasRole(role: "super_admin" | "moderator" | "viewer"): boolean {
    return this.currentUser?.customClaims.role === role;
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const permissions = this.currentUser?.customClaims.permissions || [];
    return permissions.includes(permission);
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: AdminUser | null) => void): () => void {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Convert Firebase error codes to user-friendly messages
  private getErrorMessage(error: { code: string }): string {
    switch (error.code) {
      case "auth/user-not-found":
        return "No admin account found with this email address.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-email":
        return "Invalid email address format.";
      case "auth/user-disabled":
        return "This admin account has been disabled.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      default:
        return "Authentication failed. Please check your credentials.";
    }
  }

  // Force refresh ID token to get latest custom claims
  async refreshToken(): Promise<void> {
    const auth = await getFirebaseAuth();
    if (auth && auth.currentUser) {
      await auth.currentUser.getIdToken(true); // Force refresh
    }
  }
}

// Export singleton instance
export const adminAuth = new AdminAuthService();

// React Hook for using admin auth in components
import { useState, useEffect } from "react";

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = adminAuth.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    isAdmin: user?.isAdmin || false,
    hasRole: (role: "super_admin" | "moderator" | "viewer") =>
      user?.customClaims.role === role,
    hasPermission: (permission: string) =>
      user?.customClaims.permissions?.includes(permission) || false,
    signIn: adminAuth.signIn.bind(adminAuth),
    signOut: adminAuth.signOut.bind(adminAuth),
    refreshToken: adminAuth.refreshToken.bind(adminAuth),
  };
}
