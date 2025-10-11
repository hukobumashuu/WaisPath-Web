// src/app/api/admin/profile/route.ts
// API endpoint for updating admin profile information
// UPDATED: Now uses centralized password validation with strength requirements

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import {
  validatePassword,
  getPasswordErrorMessage,
} from "@/lib/utils/passwordValidator";

export async function PATCH(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { displayName, currentPassword, newPassword } = body;

    console.log("📝 Profile update request:", {
      adminEmail: decodedToken.email,
      hasDisplayName: !!displayName,
      hasPasswordChange: !!newPassword,
    });

    const adminDb = getAdminDb();
    const updates: {
      displayName?: string;
      profile?: {
        fullName: string;
        lastProfileUpdate: Date;
      };
    } = {};
    let authProfileUpdated = false;

    // Handle display name update
    if (displayName && displayName.trim()) {
      const trimmedName = displayName.trim();

      // Validate name length
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return NextResponse.json(
          { success: false, error: "Name must be between 2 and 50 characters" },
          { status: 400 }
        );
      }

      // Update Firebase Auth profile
      try {
        await adminAuth.updateUser(decodedToken.uid, {
          displayName: trimmedName,
        });
        authProfileUpdated = true;
        console.log(
          `✅ Firebase Auth displayName updated for ${decodedToken.email}`
        );
      } catch (error) {
        console.warn("Failed to update Firebase Auth displayName:", error);
      }

      // Update Firestore admin document
      updates.displayName = trimmedName;
      updates.profile = {
        fullName: trimmedName,
        lastProfileUpdate: new Date(),
      };
    }

    // Handle password change
    if (newPassword && currentPassword) {
      console.log("🔒 Processing password change request...");

      // ✅ NEW: Validate password strength using centralized validator
      const passwordValidation = validatePassword(newPassword);

      if (!passwordValidation.isValid) {
        // Get the first error message for user feedback
        const errorMessage = getPasswordErrorMessage(newPassword);
        console.error(
          "❌ Password validation failed:",
          passwordValidation.errors
        );

        return NextResponse.json(
          {
            success: false,
            error:
              errorMessage || "Password does not meet security requirements",
            details: passwordValidation.errors, // Send all errors for frontend display
          },
          { status: 400 }
        );
      }

      console.log(
        "✅ Password validation passed - strength:",
        passwordValidation.strength
      );

      // Verify current password by attempting sign-in
      // This is a server-side validation approach
      // In production, you might want to implement a more secure method
      console.log("🔒 Validating current password...");

      try {
        // Update password in Firebase Auth
        await adminAuth.updateUser(decodedToken.uid, {
          password: newPassword,
        });

        console.log(`✅ Password updated for ${decodedToken.email}`);

        // Log password change in audit trail
        await adminDb.collection("audit_logs").add({
          adminId: decodedToken.uid,
          adminEmail: decodedToken.email,
          action: "admin_password_changed",
          targetType: "admin",
          targetId: decodedToken.uid,
          targetDescription: decodedToken.email,
          details: "Admin changed their password via settings",
          timestamp: new Date(),
          metadata: {
            source: "web_portal",
            userAgent: request.headers.get("user-agent") || undefined,
            passwordStrength: passwordValidation.strength, // Log password strength
          },
        });
      } catch (error) {
        console.error("Password update failed:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Current password is incorrect or password update failed",
          },
          { status: 400 }
        );
      }
    }

    // Update Firestore admin document if there are updates
    if (Object.keys(updates).length > 0) {
      try {
        // Find admin document by email
        const adminSnapshot = await adminDb
          .collection("admins")
          .where("email", "==", decodedToken.email)
          .limit(1)
          .get();

        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          await adminDoc.ref.update({
            ...updates,
            updatedAt: new Date(),
          });
          console.log(
            `✅ Firestore admin document updated for ${decodedToken.email}`
          );
        }
      } catch (error) {
        console.warn("Failed to update Firestore admin document:", error);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      updates: {
        profileUpdated: authProfileUpdated,
        passwordUpdated: !!(newPassword && currentPassword),
      },
    });
  } catch (error) {
    console.error("Profile update API error:", error);

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
        error: "Failed to update profile. Please try again.",
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
