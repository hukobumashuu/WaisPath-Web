// src/app/api/admin/reset-password/[id]/route.ts
// API endpoint for super admin to reset another admin's password (admin management feature)

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { auditLogger } from "@/lib/services/auditLogger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js dynamic routes
    const { id: targetAdminId } = await params;
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

    // Only super admins can change other admin passwords
    if (decodedToken.role !== "super_admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Only super administrators can change admin passwords",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { newPassword } = body;

    console.log("🔒 Admin password change request:", {
      targetAdminId,
      requestedBy: decodedToken.email,
    });

    // Validate new password strength
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be at least 6 characters long",
        },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();

    // Get target admin data from Firestore
    const targetAdminDoc = await adminDb
      .collection("admins")
      .doc(targetAdminId)
      .get();
    if (!targetAdminDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    const targetAdminData = targetAdminDoc.data();
    if (!targetAdminData) {
      return NextResponse.json(
        { success: false, error: "Admin data not found" },
        { status: 404 }
      );
    }

    // Get Firebase Auth UID - need to find it in the admin document
    // Since your admin documents don't store the Firebase UID separately,
    // we'll need to find the Firebase user by email
    const targetAdminEmail = targetAdminData.email;

    console.log("🔍 Looking up Firebase user by email:", targetAdminEmail);

    let firebaseUser;
    try {
      // Get Firebase user by email to find their UID
      firebaseUser = await adminAuth.getUserByEmail(targetAdminEmail);
      console.log("✅ Found Firebase user:", firebaseUser.uid);
    } catch (error) {
      console.error("Failed to find Firebase user:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Could not find Firebase Auth user for this admin",
        },
        { status: 404 }
      );
    }

    // Prevent self-password change through this endpoint
    if (firebaseUser.uid === decodedToken.uid) {
      return NextResponse.json(
        {
          success: false,
          error: "Use the profile settings to change your own password",
        },
        { status: 400 }
      );
    }

    // Update password in Firebase Auth using the correct UID
    try {
      await adminAuth.updateUser(firebaseUser.uid, {
        password: newPassword,
      });

      console.log(`✅ Password reset for ${targetAdminData.email}`);
    } catch (error) {
      console.error("Password reset failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to reset password. Please try again.",
        },
        { status: 500 }
      );
    }

    // Log password reset in audit trail
    await auditLogger.logAction({
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email || "unknown@unknown.com",
      action: "admin_password_changed",
      targetType: "admin",
      targetId: firebaseUser.uid,
      targetDescription: targetAdminData.email,
      details: `Super admin reset password for admin: ${targetAdminData.email}`,
      metadata: {
        source: "web_portal",
        userAgent: request.headers.get("user-agent") || undefined,
        passwordChangeType: "admin_reset",
        firestoreAdminId: targetAdminId,
      },
    });

    console.log(
      `✅ Admin password reset successfully: ${targetAdminData.email}`
    );

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Admin password change API error:", error);

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
        error: "Failed to change password. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
