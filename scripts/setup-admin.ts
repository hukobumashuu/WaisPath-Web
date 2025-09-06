// scripts/setup-admin.ts
// Fixed admin setup script for WAISPATH Admin Dashboard

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

// Import after env vars are loaded
import { getAdminAuth, getAdminDb } from "../src/lib/firebase/admin";

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
    permissions: Object.keys(ADMIN_PERMISSIONS),
  },
  lgu_admin: {
    name: "LGU Administrator",
    permissions: [
      "obstacles:read",
      "obstacles:approve",
      "obstacles:delete",
      "users:read",
      "users:manage",
      "admins:create_field",
    ],
  },
  field_admin: {
    name: "Field Administrator",
    permissions: ["obstacles:read", "obstacles:approve", "users:read"],
  },
};

class AdminSetup {
  // Set up admin user with custom claims
  async setupAdmin(config: AdminSetupConfig): Promise<void> {
    try {
      console.log(`🔑 Setting up admin user: ${config.email}`);

      // Get user by email
      const adminAuth = getAdminAuth();
      const adminDb = getAdminDb();
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

      const adminDb = getAdminDb();
      const adminsSnapshot = await adminDb
        .collection("admins")
        .where("active", "==", true)
        .get();

      if (adminsSnapshot.empty) {
        console.log("No admin users found.");
        return;
      }

      adminsSnapshot.docs.forEach((doc, index: number) => {
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
      });
    } catch (error) {
      console.error("❌ Failed to list admins:", error);
    }
  }
}

// Export for use in setup scripts
const adminSetup = new AdminSetup();

// CLI usage with the provided email
async function runInitialSetup(email: string): Promise<void> {
  try {
    const initialAdmin: AdminSetupConfig = {
      email: email,
      role: "super_admin",
      permissions: ADMIN_ROLES.super_admin.permissions,
    };

    await adminSetup.setupAdmin(initialAdmin);
  } catch (error) {
    console.error("Initial setup failed:", error);
    process.exit(1);
  }
}

// Main execution logic
async function main() {
  const command = process.argv[2];
  const email = process.argv[3];

  switch (command) {
    case "setup":
      if (!email) {
        console.error(
          "❌ Usage: npm run setup-admin setup your-email@gmail.com"
        );
        process.exit(1);
      }
      await runInitialSetup(email);
      break;

    case "list":
      await adminSetup.listAdmins();
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

// Run if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
}
