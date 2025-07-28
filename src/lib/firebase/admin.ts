// src/lib/firebase/admin.ts
// Firebase Admin SDK Configuration for WAISPATH Admin Dashboard

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Validate environment variables
function validateAdminConfig() {
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

// Validate config before proceeding
validateAdminConfig();

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
};

// Initialize admin app if not already initialized
let adminApp;
if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(firebaseAdminConfig),
    projectId: firebaseAdminConfig.projectId,
  });
} else {
  adminApp = getApps()[0];
}

// Export admin services - THESE ARE THE MISSING EXPORTS
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);

// Admin-specific database operations
export const adminFirebaseServices = {
  // Obstacle Management
  obstacles: {
    // Get all obstacles with admin metadata
    getAll: async () => {
      try {
        const snapshot = await adminDb.collection("obstacles").get();
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().reportedAt?.toDate() || new Date(),
        }));
      } catch (error) {
        console.error("Admin: Failed to fetch obstacles:", error);
        throw error;
      }
    },

    // Get obstacles by status
    getByStatus: async (
      status: "pending" | "verified" | "resolved" | "false_report"
    ) => {
      try {
        const snapshot = await adminDb
          .collection("obstacles")
          .where("status", "==", status)
          .orderBy("reportedAt", "desc")
          .get();

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().reportedAt?.toDate() || new Date(),
        }));
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
    ) => {
      try {
        await adminDb
          .collection("obstacles")
          .doc(obstacleId)
          .update({
            status,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            adminNotes: adminNotes || null,
          });
        console.log(`Admin: Obstacle ${obstacleId} updated to ${status}`);
      } catch (error) {
        console.error("Admin: Failed to update obstacle status:", error);
        throw error;
      }
    },

    // Bulk status update
    bulkUpdateStatus: async (
      obstacleIds: string[],
      status: "verified" | "resolved" | "false_report",
      adminId: string
    ) => {
      try {
        const batch = adminDb.batch();
        const updateData = {
          status,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        };

        obstacleIds.forEach((id) => {
          const ref = adminDb.collection("obstacles").doc(id);
          batch.update(ref, updateData);
        });

        await batch.commit();
        console.log(
          `Admin: Bulk updated ${obstacleIds.length} obstacles to ${status}`
        );
      } catch (error) {
        console.error("Admin: Failed to bulk update obstacles:", error);
        throw error;
      }
    },
  },

  // Analytics
  analytics: {
    // Get obstacle statistics
    getObstacleStats: async () => {
      try {
        const all = await adminDb.collection("obstacles").get();
        const pending = await adminDb
          .collection("obstacles")
          .where("status", "==", "pending")
          .get();
        const verified = await adminDb
          .collection("obstacles")
          .where("status", "==", "verified")
          .get();
        const resolved = await adminDb
          .collection("obstacles")
          .where("status", "==", "resolved")
          .get();

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
};

// Utility function to verify admin permissions
export const verifyAdminUser = async (email: string): Promise<boolean> => {
  try {
    const user = await adminAuth.getUserByEmail(email);

    // Check if user has admin custom claims
    const userRecord = await adminAuth.getUser(user.uid);
    return userRecord.customClaims?.admin === true;
  } catch (error) {
    console.error("Admin verification failed:", error);
    return false;
  }
};

// Set admin custom claims
export const setAdminClaims = async (uid: string): Promise<void> => {
  try {
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    console.log(`Admin claims set for user: ${uid}`);
  } catch (error) {
    console.error("Failed to set admin claims:", error);
    throw error;
  }
};
