// scripts/setup-admin.ts
// Final Fixed - One-time script to set up admin custom claims in Firebase

import { adminAuth, adminDb } from "../src/lib/firebase/admin";
import type {
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase-admin/firestore";

interface AdminSetupConfig {
  email: string;
  role: "super_admin" | "moderator" | "viewer";
  permissions: string[];
}

// Admin permissions system
const ADMIN_PERMISSIONS = {
  // Obstacle management
  "obstacles:read": "View all obstacles",
  "obstacles:approve": "Approve/reject obstacles",
  "obstacles:delete": "Delete obstacles",
  "obstacles:bulk_actions": "Perform bulk actions",

  // User management
  "users:read": "View user profiles",
  "users:manage": "Manage user accounts",
  "users:ban": "Ban/unban users",

  // Analytics
  "analytics:read": "View analytics dashboard",
  "analytics:export": "Export analytics data",

  // System settings
  "settings:read": "View system settings",
  "settings:write": "Modify system settings",
};

// Role definitions
const ADMIN_ROLES = {
  super_admin: {
    name: "Super Administrator",
    permissions: Object.keys(ADMIN_PERMISSIONS), // All permissions
  },
  moderator: {
    name: "Content Moderator",
    permissions: [
      "obstacles:read",
      "obstacles:approve",
      "users:read",
      "analytics:read",
    ],
  },
  viewer: {
    name: "Read-Only Viewer",
    permissions: ["obstacles:read", "users:read", "analytics:read"],
  },
};

class AdminSetup {
  // Set up admin user with custom claims
  async setupAdmin(config: AdminSetupConfig): Promise<void> {
    try {
      console.log(`🔑 Setting up admin user: ${config.email}`);

      // Get user by email
      const userRecord = await adminAuth.getUserByEmail(config.email);
      console.log(`✅ Found user: ${userRecord.uid}`);

      // Set custom claims
      const customClaims = {
        admin: true,
        role: config.role,
        permissions: config.permissions,
        setupAt: new Date().toISOString(),
      };

      await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);
      console.log(`✅ Admin claims set for ${config.email}`);

      // Also save admin info to Firestore for easy management
      await adminDb.collection("admins").doc(userRecord.uid).set({
        email: config.email,
        role: config.role,
        permissions: config.permissions,
        setupAt: new Date(),
        setupBy: "initial_setup",
        active: true,
      });

      console.log(`✅ Admin record saved to Firestore`);
      console.log(`🎉 Admin setup complete for ${config.email}!`);
      console.log("");
      console.log("🚀 Next steps:");
      console.log("1. Run: npm run dev");
      console.log("2. Go to: http://localhost:3000/auth/login");
      console.log(`3. Sign in with: ${config.email}`);
      console.log("4. Use the password you set in Firebase Console");
    } catch (error) {
      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code === "auth/user-not-found") {
        console.error(`❌ User not found: ${config.email}`);
        console.error(`   Please create a Firebase Auth account first:`);
        console.error(`   1. Go to Firebase Console → Authentication → Users`);
        console.error(`   2. Click "Add user"`);
        console.error(`   3. Enter email: ${config.email}`);
        console.error(`   4. Set a strong password`);
        console.error(`   5. Run this script again`);
      } else {
        console.error(
          "❌ Admin setup failed:",
          firebaseError.message || "Unknown error"
        );
      }
      throw error;
    }
  }

  // List current admin users
  async listAdmins(): Promise<void> {
    try {
      console.log("📋 Current admin users:");
      console.log("");

      const adminsSnapshot = await adminDb
        .collection("admins")
        .where("active", "==", true)
        .get();

      if (adminsSnapshot.empty) {
        console.log("No admin users found.");
        return;
      }

      // Fixed: Properly typed parameters
      adminsSnapshot.docs.forEach(
        (doc: QueryDocumentSnapshot<DocumentData>, index: number) => {
          const data = doc.data();
          console.log(`${index + 1}. ${data.email}`);
          console.log(`   Role: ${data.role}`);
          console.log(`   Permissions: ${data.permissions.length} total`);
          console.log(
            `   Setup: ${
              data.setupAt?.toDate?.()?.toLocaleDateString() || "Unknown"
            }`
          );
          console.log("");
        }
      );
    } catch (error) {
      console.error("❌ Failed to list admins:", error);
    }
  }
}

// Export for use in setup scripts
export const adminSetup = new AdminSetup();

// Example usage function - CHANGE THE EMAIL TO YOURS
export async function runInitialSetup(): Promise<void> {
  try {
    // 🚨 REPLACE WITH YOUR ACTUAL EMAIL ADDRESS
    const initialAdmin: AdminSetupConfig = {
      email: "your-email@gmail.com", // 👈 PUT YOUR EMAIL HERE
      role: "super_admin",
      permissions: ADMIN_ROLES.super_admin.permissions,
    };

    await adminSetup.setupAdmin(initialAdmin);
  } catch (error) {
    console.error("Initial setup failed:", error);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  const email = process.argv[3];

  switch (command) {
    case "setup":
      if (!email) {
        console.error("Usage: npm run setup-admin setup your-email@gmail.com");
        process.exit(1);
      }
      // Update the email in the initial admin config and run setup
      runInitialSetup();
      break;

    case "list":
      adminSetup.listAdmins();
      break;

    default:
      console.log("🔧 WAISPATH Admin Setup");
      console.log("");
      console.log("Available commands:");
      console.log("  npm run setup-admin setup your-email@gmail.com");
      console.log("  npm run setup-admin list");
      console.log("");
      console.log("📝 First time setup:");
      console.log(
        "1. Create user in Firebase Console → Authentication → Users"
      );
      console.log("2. Run: npm run setup-admin setup your-email@gmail.com");
      console.log("3. Test login at: http://localhost:3000/auth/login");
  }
}
