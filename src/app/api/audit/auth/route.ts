// src/app/api/audit/auth/route.ts
// Simple API route for authentication audit logging (copying the successful pattern)

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { action, email, error } = body;

    console.log("📝 Authentication audit log request:", {
      action,
      email,
      hasError: !!error,
    });

    // Simple manual audit log entry (copying admin status pattern)
    const adminDb = getAdminDb();

    if (action === "signin_success") {
      // For successful sign-ins, we need to verify the user token
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          {
            success: false,
            error: "Authorization token required for successful login logging",
          },
          { status: 401 }
        );
      }

      const idToken = authHeader.split(" ")[1];
      const adminAuth = getAdminAuth();
      const decodedToken = await adminAuth.verifyIdToken(idToken);

      try {
        await adminDb.collection("audit_logs").add({
          adminId: decodedToken.uid,
          adminEmail: decodedToken.email,
          action: "admin_signin_web",
          targetType: "admin",
          targetId: decodedToken.uid,
          targetDescription: decodedToken.email,
          details: "Admin signed in to web portal successfully",
          timestamp: new Date(),
          metadata: {
            source: "web_portal",
            userAgent: request.headers.get("user-agent") || undefined,
          },
        });
        console.log(
          `✅ Sign-in success audit log created for ${decodedToken.email}`
        );
      } catch (error) {
        console.warn("Failed to create sign-in audit log:", error);
        // Don't fail the operation if audit logging fails
      }
    } else if (action === "signin_failed") {
      // For failed sign-ins, we don't have a valid token
      try {
        await adminDb.collection("audit_logs").add({
          adminId: "unknown",
          adminEmail: email || "unknown",
          action: "admin_signin_failed",
          targetType: "admin",
          targetId: "unknown",
          targetDescription: email || "unknown email",
          details: `Admin sign-in failed: ${error || "Invalid credentials"}`,
          timestamp: new Date(),
          metadata: {
            source: "web_portal",
            failureReason: error || "Invalid credentials",
            userAgent: request.headers.get("user-agent") || undefined,
          },
        });
        console.log(
          `✅ Sign-in failure audit log created for ${email || "unknown"}`
        );
      } catch (error) {
        console.warn("Failed to create sign-in failure audit log:", error);
        // Don't fail the operation if audit logging fails
      }
    } else if (action === "signout") {
      // For sign-outs, we need to verify the user token
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          {
            success: false,
            error: "Authorization token required for signout logging",
          },
          { status: 401 }
        );
      }

      const idToken = authHeader.split(" ")[1];
      const adminAuth = getAdminAuth();
      const decodedToken = await adminAuth.verifyIdToken(idToken);

      try {
        await adminDb.collection("audit_logs").add({
          adminId: decodedToken.uid,
          adminEmail: decodedToken.email,
          action: "admin_signout_web",
          targetType: "admin",
          targetId: decodedToken.uid,
          targetDescription: decodedToken.email,
          details: "Admin signed out from web portal",
          timestamp: new Date(),
          metadata: {
            source: "web_portal",
            userAgent: request.headers.get("user-agent") || undefined,
          },
        });
        console.log(`✅ Sign-out audit log created for ${decodedToken.email}`);
      } catch (error) {
        console.warn("Failed to create sign-out audit log:", error);
        // Don't fail the operation if audit logging fails
      }
    }

    console.log("✅ Authentication audit log created successfully");

    return NextResponse.json({
      success: true,
      message: "Authentication audit log created successfully",
    });
  } catch (error) {
    console.error("❌ Authentication audit logging failed:", error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create audit log",
      },
      { status: 500 }
    );
  }
}
