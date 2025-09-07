// scripts/create-new-super-admin.ts
// Create a new super admin account using the enhanced admin system

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { getAdminAuth, getAdminDb } from "../src/lib/firebase/admin";

async function createSuperAdmin() {
  try {
    const email = "aacchhuu.2025@gmail.com";

    console.log(`🔨 Creating new super admin account for: ${email}`);

    // First, create the Firebase Auth user and set super admin claims directly
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Generate temporary password
    const chars =
      "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789@#$%";
    let temporaryPassword = "";
    for (let i = 0; i < 12; i++) {
      temporaryPassword += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    console.log(`🔑 Generated temporary password: ${temporaryPassword}`);

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email: email,
      password: temporaryPassword,
      emailVerified: false,
      disabled: false,
    });

    console.log(`✅ Created Firebase Auth user: ${userRecord.uid}`);

    // Set super admin custom claims
    const superAdminPermissions = [
      "obstacles:read",
      "obstacles:approve",
      "obstacles:delete",
      "obstacles:bulk_actions",
      "users:read",
      "users:manage",
      "users:ban",
      "admins:read",
      "admins:create",
      "admins:manage",
      "admins:delete",
      "analytics:read",
      "analytics:export",
      "settings:read",
      "settings:write",
      "audit:read",
    ];

    const customClaims = {
      admin: true,
      role: "super_admin",
      permissions: superAdminPermissions,
      createdAt: new Date().toISOString(),
    };

    await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);
    console.log(`✅ Set super admin custom claims`);

    // Create Firestore admin record
    const adminData = {
      email: email,
      role: "super_admin",
      status: "active",
      createdBy: "system",
      createdByEmail: "system",
      createdAt: new Date(),
      permissions: superAdminPermissions,
      metadata: {
        createdFrom: "super_admin_setup_script",
        timestamp: new Date().toISOString(),
      },
    };

    const docRef = await adminDb.collection("admins").add(adminData);
    console.log(`✅ Created Firestore admin record: ${docRef.id}`);

    console.log(`\n🎉 Super admin account created successfully!`);
    console.log(`\n📋 Account Details:`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: super_admin`);
    console.log(`   Temporary Password: ${temporaryPassword}`);
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   Firestore Doc ID: ${docRef.id}`);

    console.log(`\n🔄 Next Steps:`);
    console.log(`   1. Sign out from your current session`);
    console.log(`   2. Go to: http://localhost:3000/auth/login`);
    console.log(`   3. Sign in with:`);
    console.log(`      Email: ${email}`);
    console.log(`      Password: ${temporaryPassword}`);
    console.log(`   4. Go to /dashboard/admins`);
    console.log(
      `   5. You should see both admin accounts (super admin + field admin)`
    );
  } catch (error) {
    console.error("❌ Failed to create super admin:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        console.log(
          "\n💡 User already exists. Trying to update existing user..."
        );

        try {
          const adminAuth = getAdminAuth();

          // Generate new temporary password for existing user
          const chars =
            "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789@#$%";
          let newTempPassword = "";
          for (let i = 0; i < 12; i++) {
            newTempPassword += chars.charAt(
              Math.floor(Math.random() * chars.length)
            );
          }

          const existingUser = await adminAuth.getUserByEmail(
            "aacchhuu.2025@gmail.com"
          );

          // Just update the password and claims
          await adminAuth.updateUser(existingUser.uid, {
            password: newTempPassword,
          });

          const superAdminPermissions = [
            "obstacles:read",
            "obstacles:approve",
            "obstacles:delete",
            "obstacles:bulk_actions",
            "users:read",
            "users:manage",
            "users:ban",
            "admins:read",
            "admins:create",
            "admins:manage",
            "admins:delete",
            "analytics:read",
            "analytics:export",
            "settings:read",
            "settings:write",
            "audit:read",
          ];

          await adminAuth.setCustomUserClaims(existingUser.uid, {
            admin: true,
            role: "super_admin",
            permissions: superAdminPermissions,
            updatedAt: new Date().toISOString(),
          });

          console.log(
            `✅ Updated existing user with new password: ${newTempPassword}`
          );
        } catch (updateError) {
          console.error("❌ Failed to update existing user:", updateError);
        }
      }
    }
  }
}

createSuperAdmin();
