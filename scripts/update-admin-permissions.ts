// scripts/update-admin-permissions.ts
// Update both Firestore document and Firebase Auth claims for your admin account

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { getAdminAuth, getAdminDb } from "../src/lib/firebase/admin";

const COMPLETE_SUPER_ADMIN_PERMISSIONS = [
  "obstacles:read",
  "obstacles:approve",
  "obstacles:delete",
  "obstacles:bulk_actions",
  "users:read",
  "users:manage",
  "users:ban",
  "admins:read", // Missing - needed to view admin list
  "admins:create", // Missing - needed to create admins
  "admins:manage", // Missing - needed for activate/deactivate buttons
  "admins:delete", // Missing - needed to delete admins
  "analytics:read",
  "analytics:export",
  "settings:read",
  "settings:write",
  "audit:read", // Missing - needed to view audit logs
];

async function updateAdminPermissions() {
  try {
    const email = "aacchhuu.2025@gmail.com";

    console.log(`🔧 Updating admin permissions for: ${email}`);

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Get user record
    const userRecord = await adminAuth.getUserByEmail(email);
    console.log(`✅ Found Firebase Auth user: ${userRecord.uid}`);

    // Update Firebase Auth custom claims
    const customClaims = {
      admin: true,
      role: "super_admin",
      permissions: COMPLETE_SUPER_ADMIN_PERMISSIONS,
      updatedAt: new Date().toISOString(),
    };

    await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);
    console.log(`✅ Updated Firebase Auth custom claims`);

    // Find and update Firestore document
    const adminSnapshot = await adminDb
      .collection("admins")
      .where("email", "==", email)
      .get();

    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      await adminDoc.ref.update({
        permissions: COMPLETE_SUPER_ADMIN_PERMISSIONS,
        updatedAt: new Date(),
        updatedBy: "permission_fix_script",
      });
      console.log(`✅ Updated Firestore admin document: ${adminDoc.id}`);
    } else {
      // Create Firestore document if it doesn't exist
      await adminDb.collection("admins").add({
        email: email,
        role: "super_admin",
        status: "active",
        permissions: COMPLETE_SUPER_ADMIN_PERMISSIONS,
        createdAt: new Date(),
        createdBy: "permission_fix_script",
        createdByEmail: "system",
        active: true,
        setupAt: new Date(),
        setupBy: "permission_fix_script",
      });
      console.log(`✅ Created new Firestore admin document`);
    }

    console.log(`\n📋 Complete permissions list:`);
    COMPLETE_SUPER_ADMIN_PERMISSIONS.forEach((perm, index) => {
      console.log(`  ${index + 1}. ${perm}`);
    });

    console.log(`\n🎉 Permission update complete!`);
    console.log(`\n🔄 Next steps:`);
    console.log(`   1. Sign out of the admin dashboard`);
    console.log(`   2. Sign back in`);
    console.log(`   3. Go to /dashboard/admins`);
    console.log(`   4. You should now see activate/deactivate buttons`);
  } catch (error) {
    console.error("❌ Failed to update admin permissions:", error);
  }
}

updateAdminPermissions();
