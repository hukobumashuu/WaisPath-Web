// src/app/api/admin/change-password/[id]/route.ts
// API endpoint for changing another admin's password (super admin only)
// UPDATED: Now enforces strong password requirements (8+ chars, uppercase, number, special char)

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { auditLogger } from "@/lib/services/auditLogger";
import {
  validatePassword,
  getPasswordErrorMessage,
} from "@/lib/utils/passwordValidator";

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

    // ✅ UPDATED: Validate new password strength using centralized validator
    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New password is required",
        },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(newPassword);

    if (!passwordValidation.isValid) {
      // Get user-friendly error message
      const errorMessage = getPasswordErrorMessage(newPassword);
      console.error(
        "❌ Password validation failed:",
        passwordValidation.errors
      );

      return NextResponse.json(
        {
          success: false,
          error: errorMessage || "Password does not meet security requirements",
          details: passwordValidation.errors, // Send all validation errors
          requirements: [
            "At least 8 characters long",
            "At least one uppercase letter (A-Z)",
            "At least one lowercase letter (a-z)",
            "At least one number (0-9)",
            "At least one special character (!@#$%^&*_+)",
          ],
        },
        { status: 400 }
      );
    }

    console.log(
      "✅ Password validation passed - strength:",
      passwordValidation.strength
    );

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

    // Get Firebase Auth UID from admin data
    const firebaseAuthUid = targetAdminData.uid || targetAdminData.firebaseUid;
    if (!firebaseAuthUid) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase Auth UID not found for this admin",
        },
        { status: 400 }
      );
    }

    // Prevent self-password change through this endpoint
    if (firebaseAuthUid === decodedToken.uid) {
      return NextResponse.json(
        {
          success: false,
          error: "Use the profile settings to change your own password",
        },
        { status: 400 }
      );
    }

    console.log("🔍 Using Firebase Auth UID:", firebaseAuthUid);

    // Update password in Firebase Auth using the correct UID
    try {
      await adminAuth.updateUser(firebaseAuthUid, {
        password: newPassword,
      });

      console.log(`✅ Password updated for ${targetAdminData.email}`);
    } catch (error) {
      console.error("Password update failed:", error);
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to update password. Admin may not exist in Firebase Auth.",
        },
        { status: 500 }
      );
    }

    // Log password change in audit trail
    await auditLogger.logAction({
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email || "unknown@unknown.com",
      action: "admin_password_changed",
      targetType: "admin",
      targetId: firebaseAuthUid,
      targetDescription: targetAdminData.email,
      details: `Super admin changed password for admin: ${targetAdminData.email}`,
      metadata: {
        source: "web_portal",
        userAgent: request.headers.get("user-agent") || undefined,
        passwordChangeType: "admin_reset",
        firestoreAdminId: targetAdminId,
        passwordStrength: passwordValidation.strength, // Log password strength for audit
      },
    });

    console.log(
      `✅ Admin password changed successfully: ${targetAdminData.email}`
    );

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
      passwordStrength: passwordValidation.strength, // Inform admin of password strength
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
