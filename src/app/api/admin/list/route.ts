// src/app/api/admin/list/route.ts
// API endpoint for listing all admin accounts

import { NextRequest, NextResponse } from "next/server";
import { enhancedAdminService } from "@/lib/firebase/enhanced-admin";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
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

    // Check if user has permission to read admin accounts
    // More flexible permission check - allow any admin to read admin list
    const hasReadPermission =
      decodedToken.permissions?.includes("admins:read") ||
      decodedToken.role === "super_admin" ||
      decodedToken.role === "lgu_admin" ||
      decodedToken.role === "field_admin"; // Field admins can at least see the list

    if (!hasReadPermission) {
      console.log("Permission denied for user:", {
        email: decodedToken.email,
        role: decodedToken.role,
        permissions: decodedToken.permissions,
        admin: decodedToken.admin,
      });

      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to view admin accounts",
        },
        { status: 403 }
      );
    }

    console.log("✅ Admin list access granted for:", {
      email: decodedToken.email,
      role: decodedToken.role,
      permissions: decodedToken.permissions,
    });

    // Get all admin accounts from Firebase
    const adminAccounts = await enhancedAdminService.getAllAdmins();

    console.log(
      `📋 Raw admin accounts from Firestore: ${adminAccounts.length}`
    );
    adminAccounts.forEach((admin, index) => {
      console.log(
        `  ${index + 1}. ${admin.email} (${admin.role}) - ${admin.status}`
      );
    });

    // Filter sensitive information and format response
    const safeAdminData = adminAccounts.map((admin) => ({
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName || null,
      role: admin.role,
      status: admin.status,
      createdBy: admin.createdBy,
      createdByEmail: admin.createdByEmail,
      createdAt: admin.createdAt,
      lastActiveAt: admin.lastActiveAt,
      permissions: admin.permissions,
      metadata: admin.metadata,
    }));

    console.log(`📋 Returning ${safeAdminData.length} admin accounts to UI`);

    return NextResponse.json({
      success: true,
      data: safeAdminData,
      count: safeAdminData.length,
    });
  } catch (error) {
    console.error("Admin list API error:", error);

    // Handle specific Firebase errors
    if (error instanceof Error) {
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
        error: "Failed to fetch admin accounts. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed. Use /api/admin/create for creating admins." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
