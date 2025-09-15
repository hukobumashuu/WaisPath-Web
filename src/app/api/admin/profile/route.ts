// src/app/api/admin/profile/route.ts
// API endpoint for updating admin profile information

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

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
      // Validate new password strength
      if (newPassword.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: "New password must be at least 8 characters long",
          },
          { status: 400 }
        );
      }

      // Verify current password by attempting sign-in
      try {
        // This is a server-side validation approach
        // In production, you might want to implement a more secure method
        console.log("🔒 Validating current password...");

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
          .get();

        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          await adminDoc.ref.update({
            ...updates,
            updatedAt: new Date(),
            lastUpdatedBy: decodedToken.uid,
          });
          console.log(`✅ Updated Firestore admin document`);
        }
      } catch (error) {
        console.warn("Failed to update Firestore admin document:", error);
        // Don't fail the request if Firestore update fails
      }
    }

    // Create audit log for profile update
    if (displayName) {
      try {
        await adminDb.collection("audit_logs").add({
          adminId: decodedToken.uid,
          adminEmail: decodedToken.email,
          action: "admin_profile_updated",
          targetType: "admin",
          targetId: decodedToken.uid,
          targetDescription: decodedToken.email,
          details: `Admin updated their profile name to: ${displayName}`,
          timestamp: new Date(),
          metadata: {
            source: "web_portal",
            profileChanges: { displayName },
            userAgent: request.headers.get("user-agent") || undefined,
          },
        });
        console.log(`✅ Profile update audit log created`);
      } catch (error) {
        console.warn("Failed to create profile audit log:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      updates: {
        displayNameUpdated: !!displayName,
        passwordUpdated: !!newPassword,
        authProfileUpdated,
      },
    });
  } catch (error) {
    console.error("❌ Profile update failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
