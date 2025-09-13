// src/app/api/admin/status/route.ts
// FIXED: API endpoint for updating admin account status without problematic logging

import { NextRequest, NextResponse } from "next/server";
import { enhancedAdminService } from "@/lib/firebase/enhanced-admin";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function PATCH(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { adminId, newStatus, reason } = body;

    // Validate required fields
    if (!adminId || !newStatus) {
      return NextResponse.json(
        { success: false, error: "Admin ID and new status are required" },
        { status: 400 }
      );
    }

    // Validate status value
    if (!["active", "deactivated", "suspended"].includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status. Must be active, deactivated, or suspended",
        },
        { status: 400 }
      );
    }

    // Get the requesting user's info from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization token required" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split(" ")[1];

    // Verify the ID token and get user info
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check if user has admin privileges
    if (!decodedToken.admin) {
      return NextResponse.json(
        { success: false, error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Check if user has permission to manage admin accounts
    const hasManagePermission =
      decodedToken.permissions?.includes("admins:manage") ||
      decodedToken.role === "super_admin";

    if (!hasManagePermission) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to manage admin accounts",
        },
        { status: 403 }
      );
    }

    // Get admin details before update
    const adminDb = getAdminDb();
    const adminDoc = await adminDb.collection("admins").doc(adminId).get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    const adminData = adminDoc.data();
    if (!adminData) {
      return NextResponse.json(
        { success: false, error: "Admin data not found" },
        { status: 404 }
      );
    }

    // Prevent self-deactivation/suspension
    if (
      adminData.email === decodedToken.email &&
      (newStatus === "deactivated" || newStatus === "suspended")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot deactivate or suspend your own account",
        },
        { status: 400 }
      );
    }

    // Check if this is the last super admin
    if (adminData.role === "super_admin" && newStatus !== "active") {
      const activeSuperAdminsSnapshot = await adminDb
        .collection("admins")
        .where("role", "==", "super_admin")
        .where("status", "==", "active")
        .get();

      const activeSuperAdmins = activeSuperAdminsSnapshot.docs.filter(
        (doc) => doc.id !== adminId
      );

      if (activeSuperAdmins.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot deactivate the last active super admin",
          },
          { status: 400 }
        );
      }
    }

    console.log(`🔧 Updating admin status: ${adminData.email} -> ${newStatus}`);

    // Update admin status using enhanced service
    await enhancedAdminService.updateAdminStatus(
      adminId,
      newStatus,
      {
        id: decodedToken.uid,
        email: decodedToken.email!,
      },
      reason
    );

    // Additional session invalidation for deactivated/suspended accounts
    if (newStatus === "deactivated" || newStatus === "suspended") {
      try {
        // Get the target admin's user record
        const targetUserRecord = await adminAuth.getUserByEmail(
          adminData.email
        );

        // Revoke all refresh tokens to force immediate logout
        await adminAuth.revokeRefreshTokens(targetUserRecord.uid);

        console.log(`✅ Revoked refresh tokens for ${adminData.email}`);

        // Update custom claims to remove admin access
        await adminAuth.setCustomUserClaims(targetUserRecord.uid, {
          admin: false,
          deactivated: newStatus === "deactivated",
          suspended: newStatus === "suspended",
          statusChangedAt: new Date().toISOString(),
          statusChangedBy: decodedToken.email,
        });

        console.log(`✅ Updated custom claims for ${adminData.email}`);
      } catch (error) {
        console.warn("Failed to revoke tokens or update claims:", error);
        // Don't fail the whole operation if this fails
      }
    } else if (newStatus === "active" && adminData.status !== "active") {
      // Reactivating account - restore admin privileges
      try {
        const targetUserRecord = await adminAuth.getUserByEmail(
          adminData.email
        );

        // Restore admin custom claims
        const permissions = getPermissionsForRole(adminData.role);
        await adminAuth.setCustomUserClaims(targetUserRecord.uid, {
          admin: true,
          role: adminData.role,
          permissions,
          reactivatedAt: new Date().toISOString(),
          reactivatedBy: decodedToken.email,
        });

        console.log(`✅ Restored admin claims for ${adminData.email}`);
      } catch (error) {
        console.warn("Failed to restore admin claims:", error);
      }
    }

    // Simple manual audit log entry (without using the audit logger service)
    try {
      await adminDb.collection("audit_logs").add({
        adminId: decodedToken.uid,
        adminEmail: decodedToken.email,
        action:
          newStatus === "active"
            ? "admin_reactivated"
            : newStatus === "deactivated"
            ? "admin_deactivated"
            : "admin_suspended",
        targetType: "admin",
        targetId: adminId,
        targetDescription: adminData.email,
        details: `Admin account ${newStatus}${
          reason ? `. Reason: ${reason}` : ""
        }`,
        timestamp: new Date(),
        metadata: {
          source: "web_portal",
          previousStatus: adminData.status,
          newStatus,
          reason: reason || null,
        },
      });
      console.log(`✅ Audit log entry created`);
    } catch (error) {
      console.warn("Failed to create audit log:", error);
      // Don't fail the operation if audit logging fails
    }

    console.log(
      `✅ Admin status updated successfully: ${adminData.email} -> ${newStatus}`
    );

    return NextResponse.json({
      success: true,
      message: `Admin account ${newStatus} successfully`,
      data: {
        adminId,
        email: adminData.email,
        previousStatus: adminData.status,
        newStatus,
        updatedBy: decodedToken.email,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin status update error:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to get permissions for a role
function getPermissionsForRole(role: string): string[] {
  const rolePermissions = {
    super_admin: [
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
    ],
    lgu_admin: [
      "obstacles:read",
      "obstacles:approve",
      "obstacles:delete",
      "obstacles:bulk_actions",
      "users:read",
      "users:manage",
      "admins:read",
      "admins:create_field",
      "analytics:read",
      "analytics:export",
      "audit:read",
    ],
    field_admin: ["obstacles:read", "obstacles:approve", "users:read"],
  };

  return rolePermissions[role as keyof typeof rolePermissions] || [];
}
