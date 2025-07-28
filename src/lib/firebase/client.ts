// src/lib/firebase/client.ts
// Secure Firebase Client Configuration - No Hardcoded Keys

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

// Wait for environment variables to be available
function waitForEnvVars(): Promise<boolean> {
  return new Promise((resolve) => {
    const checkEnvVars = () => {
      // Check if all required env vars are available
      const hasAll = !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      );

      if (hasAll) {
        resolve(true);
      } else {
        // Wait a bit and check again (for hydration issues)
        setTimeout(checkEnvVars, 100);
      }
    };

    checkEnvVars();
  });
}

// Get Firebase configuration from environment variables
async function getFirebaseConfig() {
  // Wait for environment variables to be ready
  await waitForEnvVars();

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  // Validate configuration
  const requiredKeys = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const missingKeys = requiredKeys.filter(
    (key) => !config[key as keyof typeof config]
  );

  if (missingKeys.length > 0) {
    console.error("❌ Missing Firebase configuration keys:", missingKeys);
    throw new Error(
      `Missing Firebase configuration: ${missingKeys.join(", ")}`
    );
  }

  console.log("✅ Firebase config loaded securely from environment variables");
  return config;
}

// Initialize Firebase with proper async handling
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initPromise: Promise<FirebaseApp | null> | null = null;

async function initializeFirebase(): Promise<FirebaseApp | null> {
  try {
    if (typeof window === "undefined") {
      // Server-side rendering - don't initialize
      return null;
    }

    if (app) {
      // Already initialized
      return app;
    }

    // If already initializing, wait for that
    if (initPromise) {
      return initPromise;
    }

    // Start initialization
    initPromise = (async () => {
      try {
        const config = await getFirebaseConfig();

        // Initialize Firebase (only once)
        if (getApps().length === 0) {
          app = initializeApp(config);
          console.log("🔥 Firebase app initialized securely");
        } else {
          app = getApps()[0];
          console.log("🔥 Firebase app already exists");
        }

        // Initialize services
        auth = getAuth(app);
        db = getFirestore(app);

        return app;
      } catch (error) {
        console.error("🔥 Firebase initialization failed:", error);
        initPromise = null; // Reset so we can try again
        return null;
      }
    })();

    return initPromise;
  } catch (error) {
    console.error("🔥 Firebase initialization error:", error);
    initPromise = null;
    return null;
  }
}

// Async getters that wait for initialization
export async function getFirebaseAuth(): Promise<Auth | null> {
  if (!auth) {
    await initializeFirebase();
  }
  return auth;
}

export async function getFirebaseDb(): Promise<Firestore | null> {
  if (!db) {
    await initializeFirebase();
  }
  return db;
}

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (!app) {
    return await initializeFirebase();
  }
  return app;
}

// Synchronous getters for backward compatibility (may return null during initialization)
export function getFirebaseAuthSync(): Auth | null {
  return auth;
}

export function getFirebaseDbSync(): Firestore | null {
  return db;
}

// Export aliases
export { getFirebaseAuthSync as auth, getFirebaseDbSync as db };

// Default export
export default getFirebaseApp;
