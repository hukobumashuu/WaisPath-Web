// src/lib/firebase/admin.ts
// Firebase Admin SDK Configuration for WAISPATH Admin Dashboard - Properly Typed

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

// Validate environment variables - Only validate when needed, not on import
function validateAdminConfig(): void {
  const required = [
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing Firebase Admin environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    throw new Error(
      `Missing Firebase Admin configuration: ${missing.join(", ")}`
    );
  }
}

// Lazy initialization - only initialize when first accessed
let adminAppInstance: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

function initializeAdminApp(): App {
  if (adminAppInstance) return adminAppInstance;

  // Validate config before proceeding
  validateAdminConfig();

  // Initialize Firebase Admin SDK
  const firebaseAdminConfig = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  };

  // Initialize admin app if not already initialized
  if (!getApps().length) {
    adminAppInstance = initializeApp({
      credential: cert(firebaseAdminConfig),
      projectId: firebaseAdminConfig.projectId,
    });
  } else {
    adminAppInstance = getApps()[0];
  }

  return adminAppInstance;
}

// Lazy getters for admin services
export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    const app = initializeAdminApp();
    adminDbInstance = getFirestore(app);
  }
  return adminDbInstance;
}

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    const app = initializeAdminApp();
    adminAuthInstance = getAuth(app);
  }
  return adminAuthInstance;
}

// Export lazy-loaded services with proper typing
export const adminDb = new Proxy({} as Firestore, {
  get(target, prop) {
    const db = getAdminDb();
    const value = (db as unknown as Record<string, unknown>)[prop as string];
    return typeof value === "function" ? value.bind(db) : value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(target, prop) {
    const auth = getAdminAuth();
    const value = (auth as unknown as Record<string, unknown>)[prop as string];
    return typeof value === "function" ? value.bind(auth) : value;
  },
});

// Interface for obstacle data
interface ObstacleData {
  id: string;
  type: string;
  severity: string;
  status: string;
  reportedAt: Date;
  reportedBy: string;
  upvotes: number;
  downvotes: number;
  verified: boolean;
  createdAt: Date;
  [key: string]: unknown;
}

// Interface for user data
interface UserData {
  id: string;
  type: string;
  createdAt: Date;
  lastUpdated: Date;
  [key: string]: unknown;
}

// Admin-specific database operations
export const adminFirebaseServices = {
  // Obstacle Management
  obstacles: {
    // Get all obstacles with admin metadata
    getAll: async (): Promise<ObstacleData[]> => {
      try {
        const db = getAdminDb();
        const snapshot = await db.collection("obstacles").get();
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().reportedAt?.toDate() || new Date(),
        })) as ObstacleData[];
      } catch (error) {
        console.error("Admin: Failed to fetch obstacles:", error);
        throw error;
      }
    },

    // Get obstacles by status
    getByStatus: async (
      status: "pending" | "verified" | "resolved" | "false_report"
    ): Promise<ObstacleData[]> => {
      try {
        const db = getAdminDb();
        const snapshot = await db
          .collection("obstacles")
          .where("status", "==", status)
          .orderBy("reportedAt", "desc")
          .get();

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().reportedAt?.toDate() || new Date(),
        })) as ObstacleData[];
      } catch (error) {
        console.error(`Admin: Failed to fetch ${status} obstacles:`, error);
        throw error;
      }
    },

    // Update obstacle status (admin action)
    updateStatus: async (
      obstacleId: string,
      status: "verified" | "resolved" | "false_report",
      adminId: string,
      adminNotes?: string
    ): Promise<void> => {
      try {
        const db = getAdminDb();
        await db.collection("obstacles").doc(obstacleId).update({
          status,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNotes,
          lastUpdated: new Date(),
        });

        console.log(`Admin: Updated obstacle ${obstacleId} to ${status}`);
      } catch (error) {
        console.error("Admin: Failed to update obstacle:", error);
        throw error;
      }
    },

    // Get statistics
    getStats: async (): Promise<{
      total: number;
      pending: number;
      verified: number;
      resolved: number;
      falseReports: number;
    }> => {
      try {
        const db = getAdminDb();
        const [all, pending, verified, resolved] = await Promise.all([
          db.collection("obstacles").get(),
          db.collection("obstacles").where("status", "==", "pending").get(),
          db.collection("obstacles").where("status", "==", "verified").get(),
          db.collection("obstacles").where("status", "==", "resolved").get(),
        ]);

        return {
          total: all.size,
          pending: pending.size,
          verified: verified.size,
          resolved: resolved.size,
          falseReports: all.size - pending.size - verified.size - resolved.size,
        };
      } catch (error) {
        console.error("Admin: Failed to fetch obstacle stats:", error);
        throw error;
      }
    },
  },

  // User Management
  users: {
    getAll: async (): Promise<UserData[]> => {
      try {
        const db = getAdminDb();
        const snapshot = await db.collection("userProfiles").get();
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserData[];
      } catch (error) {
        console.error("Admin: Failed to fetch users:", error);
        throw error;
      }
    },

    getUserStats: async (
      userId: string
    ): Promise<{
      profile: UserData | null;
      obstaclesReported: number;
      contributions: ObstacleData[];
    }> => {
      try {
        const db = getAdminDb();
        const [profile, obstacles] = await Promise.all([
          db.collection("userProfiles").doc(userId).get(),
          db.collection("obstacles").where("reportedBy", "==", userId).get(),
        ]);

        return {
          profile: profile.exists ? (profile.data() as UserData) : null,
          obstaclesReported: obstacles.size,
          contributions: obstacles.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ObstacleData[],
        };
      } catch (error) {
        console.error("Admin: Failed to fetch user stats:", error);
        throw error;
      }
    },
  },
};

// Utility function to verify admin permissions
export const verifyAdminUser = async (email: string): Promise<boolean> => {
  try {
    const auth = getAdminAuth();
    const user = await auth.getUserByEmail(email);

    // Check if user has admin custom claims
    const userRecord = await auth.getUser(user.uid);
    return userRecord.customClaims?.admin === true;
  } catch (error) {
    console.error("Admin verification failed:", error);
    return false;
  }
};

// Set admin custom claims
export const setAdminClaims = async (uid: string): Promise<void> => {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log(`Admin claims set for user: ${uid}`);
  } catch (error) {
    console.error("Failed to set admin claims:", error);
    throw error;
  }
};
