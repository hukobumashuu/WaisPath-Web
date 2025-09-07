// src/app/api/admin/status/route.ts
// API endpoint for updating admin account status

import { NextRequest, NextResponse } from "next/server";
import { enhancedAdminService } from "@/lib/firebase/enhanced-admin";
import { getAdminAuth } from "@/lib/firebase/admin";

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
      decodedToken.permissions?.includes("admins:manage");
    if (!hasManagePermission) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to manage admin accounts",
        },
        { status: 403 }
      );
    }

    // Get the admin being updated to perform additional checks
    const targetAdmin = await enhancedAdminService.getAdminById(adminId);
    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin account not found" },
        { status: 404 }
      );
    }

    // Prevent self-deactivation
    if (targetAdmin.email === decodedToken.email && newStatus !== "active") {
      return NextResponse.json(
        { success: false, error: "You cannot deactivate your own account" },
        { status: 403 }
      );
    }

    // Prevent non-super-admins from modifying super-admin accounts
    if (
      targetAdmin.role === "super_admin" &&
      decodedToken.role !== "super_admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Only Super Admins can modify Super Admin accounts",
        },
        { status: 403 }
      );
    }

    // Update the admin status
    await enhancedAdminService.updateAdminStatus(
      adminId,
      newStatus,
      {
        id: decodedToken.uid,
        email: decodedToken.email || "unknown@unknown.com",
      },
      reason
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Admin account status updated to ${newStatus}`,
      data: {
        adminId,
        newStatus,
        updatedBy: decodedToken.email,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin status update API error:", error);

    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes("Admin not found")) {
        return NextResponse.json(
          { success: false, error: "Admin account not found" },
          { status: 404 }
        );
      }

      if (error.message.includes("auth/invalid-id-token")) {
        return NextResponse.json(
          { success: false, error: "Invalid authentication token" },
          { status: 401 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update admin status. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use GET /api/admin/list to fetch admins." },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Method not allowed. Use POST /api/admin/create to create admins.",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
