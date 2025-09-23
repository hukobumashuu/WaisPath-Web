// src/app/api/admin/update/[id]/route.ts
// API endpoint for updating admin information with audit logging
// Fixed for Next.js 15 async params

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { auditLogger } from "@/lib/services/auditLogger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 🔧 FIX: params is now Promise<{ id: string }>
) {
  try {
    // 🔧 FIX: Await the params Promise
    const { id: adminId } = await params;

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization token required" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split(" ")[1];

    // Verify the ID token
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check admin privileges
    if (!decodedToken.admin) {
      return NextResponse.json(
        { success: false, error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Check if user has permission to manage admins
    const hasManagePermission =
      decodedToken.permissions?.includes("admins:manage") ||
      decodedToken.role === "super_admin";

    if (!hasManagePermission) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to update admin accounts",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { displayName, role, metadata } = body;
    // 🔧 FIX: adminId is now from awaited params above

    console.log("📝 Admin update request:", {
      adminId,
      hasDisplayName: !!displayName,
      hasRole: !!role,
      hasMetadata: !!metadata,
      requestedBy: decodedToken.email,
    });

    const adminDb = getAdminDb();

    // Get current admin data
    const adminDoc = await adminDb.collection("admins").doc(adminId).get();
    if (!adminDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    const currentAdminData = adminDoc.data();
    if (!currentAdminData) {
      return NextResponse.json(
        { success: false, error: "Admin data not found" },
        { status: 404 }
      );
    }

    // Validate role change permissions
    if (role && role !== currentAdminData.role) {
      // Only super_admin can change roles
      if (decodedToken.role !== "super_admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Only super administrators can change admin roles",
          },
          { status: 403 }
        );
      }

      // Prevent downgrading the last super admin
      if (currentAdminData.role === "super_admin" && role !== "super_admin") {
        const superAdminsSnapshot = await adminDb
          .collection("admins")
          .where("role", "==", "super_admin")
          .where("status", "==", "active")
          .get();

        const activeSuperAdmins = superAdminsSnapshot.docs.filter(
          (doc) => doc.id !== adminId
        );

        if (activeSuperAdmins.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Cannot change role of the last active super admin",
            },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data
    const updateData: {
      updatedAt: Date;
      updatedBy: string;
      updatedByEmail: string;
      displayName?: string;
      role?: string;
      permissions?: string[];
      metadata?: {
        phoneNumber?: string;
        department?: string;
        notes?: string;
        [key: string]: unknown;
      };
    } = {
      updatedAt: new Date(),
      updatedBy: decodedToken.uid,
      updatedByEmail: decodedToken.email || "unknown@unknown.com",
    };

    if (displayName !== undefined) {
      updateData.displayName = displayName.trim();
    }

    if (role && role !== currentAdminData.role) {
      updateData.role = role;

      // Update permissions based on new role
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

      updateData.permissions =
        rolePermissions[role as keyof typeof rolePermissions] || [];
    }

    if (metadata) {
      updateData.metadata = {
        ...currentAdminData.metadata,
        ...metadata,
      };
    }

    // Update Firestore document
    await adminDoc.ref.update(updateData);

    // Update Firebase Auth displayName if provided
    if (displayName !== undefined && displayName.trim()) {
      try {
        await adminAuth.updateUser(adminId, {
          displayName: displayName.trim(),
        });
        console.log(
          `✅ Firebase Auth displayName updated for ${currentAdminData.email}`
        );
      } catch (error) {
        console.warn("Failed to update Firebase Auth displayName:", error);
      }
    }

    // Update Firebase Auth custom claims if role changed
    if (role && role !== currentAdminData.role) {
      try {
        const currentClaims =
          (await adminAuth.getUser(adminId)).customClaims || {};
        await adminAuth.setCustomUserClaims(adminId, {
          ...currentClaims,
          role: role,
          permissions: updateData.permissions,
          updatedAt: new Date().toISOString(),
        });
        console.log(
          `✅ Firebase Auth claims updated for ${currentAdminData.email}`
        );
      } catch (error) {
        console.warn("Failed to update Firebase Auth claims:", error);
      }
    }

    // Log the admin update action
    const changedFields = [];
    if (
      displayName !== undefined &&
      displayName !== currentAdminData.displayName
    ) {
      changedFields.push("display name");
    }
    if (role && role !== currentAdminData.role) {
      changedFields.push(`role (${currentAdminData.role} → ${role})`);
    }
    if (metadata) {
      if (metadata.phoneNumber !== currentAdminData.metadata?.phoneNumber) {
        changedFields.push("phone number");
      }
      if (metadata.department !== currentAdminData.metadata?.department) {
        changedFields.push("department");
      }
      if (metadata.notes !== currentAdminData.metadata?.notes) {
        changedFields.push("notes");
      }
    }

    await auditLogger.logAction({
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email || "unknown@unknown.com",
      action: "admin_profile_updated",
      targetType: "admin",
      targetId: adminId,
      targetDescription: currentAdminData.email,
      details: `Updated admin information: ${changedFields.join(", ")}`,
      metadata: {
        source: "web_portal",
        changedFields,
        previousRole: currentAdminData.role,
        newRole: role,
      },
    });

    console.log(`✅ Admin updated successfully: ${currentAdminData.email}`);

    return NextResponse.json({
      success: true,
      message: "Admin information updated successfully",
      data: {
        id: adminId,
        email: currentAdminData.email,
        displayName: updateData.displayName || currentAdminData.displayName,
        role: updateData.role || currentAdminData.role,
        metadata: updateData.metadata || currentAdminData.metadata,
        updatedAt: updateData.updatedAt,
      },
    });
  } catch (error) {
    console.error("Admin update API error:", error);

    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes("auth/invalid-id-token")) {
        return NextResponse.json(
          { success: false, error: "Invalid authentication token" },
          { status: 401 }
        );
      }

      if (error.message.includes("auth/user-not-found")) {
        return NextResponse.json(
          { success: false, error: "Admin account not found" },
          { status: 404 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update admin information. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods - these also need the async params fix
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // We don't need the id for method not allowed responses
  await params; // Just await to satisfy Next.js 15 requirements
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
