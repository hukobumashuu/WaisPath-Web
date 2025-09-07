// src/app/api/admin/create/route.ts
// API endpoint for creating admin accounts with Firebase Auth user creation

import { NextRequest, NextResponse } from "next/server";
import { enhancedAdminService } from "@/lib/firebase/enhanced-admin";
import type { CreateAdminRequest } from "@/lib/firebase/enhanced-admin";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { email, role, sendInvite, metadata } = body;

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["lgu_admin", "field_admin"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid role. Must be lgu_admin or field_admin",
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

    // Validate role creation permissions
    const canCreate = enhancedAdminService.canCreateRole(
      decodedToken.role,
      role
    );
    if (!canCreate) {
      return NextResponse.json(
        {
          success: false,
          error: `You don't have permission to create ${role} accounts`,
        },
        { status: 403 }
      );
    }

    // Create the admin account
    const createRequest: CreateAdminRequest = {
      email: email.toLowerCase().trim(),
      role: role,
      createdBy: decodedToken.uid,
      createdByEmail: decodedToken.email || "unknown@unknown.com",
      sendInvite: sendInvite || false,
      metadata: metadata || {},
    };

    const result = await enhancedAdminService.createAdminWithAuth(
      createRequest
    );

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        admin: {
          id: result.admin.id,
          email: result.admin.email,
          role: result.admin.role,
          status: result.admin.status,
          createdAt: result.admin.createdAt,
          permissions: result.admin.permissions,
        },
        temporaryPassword: result.temporaryPassword,
        message: result.message,
      },
    });
  } catch (error) {
    console.error("Admin creation API error:", error);

    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json(
          { success: false, error: "User with this email already exists" },
          { status: 409 }
        );
      }

      if (error.message.includes("Invalid email")) {
        return NextResponse.json(
          { success: false, error: "Invalid email address" },
          { status: 400 }
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
        error: "Failed to create admin account. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
