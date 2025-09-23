// src/lib/firebase/client.ts
// Fixed Firebase Client Configuration for Next.js

"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Get Firebase configuration from environment variables
 * Works with Next.js environment variables
 */
function getFirebaseConfig(): FirebaseConfig {
  // Use Next.js environment variables (NEXT_PUBLIC_*)
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  // Validate that all required config is present
  const missingKeys = Object.entries(config)
    .filter(([value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error("❌ Missing Firebase configuration:", missingKeys);
    throw new Error(`Missing Firebase config: ${missingKeys.join(", ")}`);
  }

  return config;
}

// Global Firebase instances
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;

/**
 * Initialize Firebase app (singleton pattern)
 */
function initializeFirebaseApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
      console.log("🔥 Using existing Firebase app");
      return firebaseApp;
    }

    // Initialize new Firebase app
    const config = getFirebaseConfig();
    firebaseApp = initializeApp(config);
    console.log("🔥 Firebase app initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    throw error;
  }
}

/**
 * Get Firebase Auth instance
 */
export async function getFirebaseAuth(): Promise<Auth | null> {
  try {
    if (typeof window === "undefined") {
      console.warn("⚠️ Firebase Auth not available on server side");
      return null;
    }

    if (!firebaseAuth) {
      const app = initializeFirebaseApp();
      firebaseAuth = getAuth(app);
      console.log("🔐 Firebase Auth initialized");
    }

    return firebaseAuth;
  } catch (error) {
    console.error("❌ Firebase Auth initialization failed:", error);
    return null;
  }
}

/**
 * Get Firestore instance
 */
export async function getFirebaseDb(): Promise<Firestore | null> {
  try {
    if (typeof window === "undefined") {
      console.warn("⚠️ Firestore not available on server side");
      return null;
    }

    if (!firebaseDb) {
      const app = initializeFirebaseApp();
      firebaseDb = getFirestore(app);
      console.log("🗃️ Firestore initialized");
    }

    return firebaseDb;
  } catch (error) {
    console.error("❌ Firestore initialization failed:", error);
    return null;
  }
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  try {
    getFirebaseConfig();
    return true;
  } catch {
    return false;
  }
}

// Export the config getter for compatibility
export { getFirebaseConfig };
