// src/app/api/audit/priority/route.ts
// SIMPLE: API route copying the exact pattern from admin status route

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { action, obstacleData, statusChange } = body;

    console.log("📝 Priority Dashboard audit log request:", {
      action,
      adminEmail: decodedToken.email,
      obstacleId: obstacleData?.id,
    });

    // Simple manual audit log entry (copying admin status pattern)
    const adminDb = getAdminDb();

    if (action === "dashboard_access") {
      try {
        await adminDb.collection("audit_logs").add({
          adminId: decodedToken.uid,
          adminEmail: decodedToken.email,
          action: "priority_dashboard_accessed",
          targetType: "system",
          targetId: "priority_dashboard",
          targetDescription: "Priority Analysis Dashboard",
          details: "Admin accessed Priority Analysis Dashboard",
          timestamp: new Date(),
          metadata: {
            source: "web_portal",
          },
        });
        console.log(`✅ Dashboard access audit log created`);
      } catch (error) {
        console.warn("Failed to create dashboard access audit log:", error);
        // Don't fail the operation if audit logging fails
      }
    } else if (action === "status_change" && obstacleData && statusChange) {
      try {
        // Determine the audit action based on new status
        const priorityAuditAction =
          statusChange.to === "verified"
            ? "priority_obstacle_verified"
            : statusChange.to === "false_report"
            ? "priority_obstacle_rejected"
            : statusChange.to === "resolved"
            ? "priority_obstacle_resolved"
            : "priority_obstacle_verified"; // fallback

        await adminDb.collection("audit_logs").add({
          adminId: decodedToken.uid,
          adminEmail: decodedToken.email,
          action: priorityAuditAction,
          targetType: "obstacle",
          targetId: obstacleData.id,
          targetDescription: `${obstacleData.type} obstacle (Priority Score: ${obstacleData.priorityScore})`,
          details: `${statusChange.notes} | Status changed from ${statusChange.from} to ${statusChange.to} via Priority Dashboard`,
          timestamp: new Date(),
          metadata: {
            source: "web_portal",
            obstacleType: obstacleData.type,
            obstacleSeverity: obstacleData.severity,
            priorityScore: obstacleData.priorityScore,
            priorityCategory: obstacleData.priorityCategory,
            previousStatus: statusChange.from,
            newStatus: statusChange.to,
            adminNotes: statusChange.notes,
            // Only include location if it exists
            ...(obstacleData.location && { location: obstacleData.location }),
            // Only include barangay if it exists
            ...(obstacleData.barangay && { barangay: obstacleData.barangay }),
          },
        });
        console.log(`✅ Status change audit log created`);
      } catch (error) {
        console.warn("Failed to create status change audit log:", error);
        // Don't fail the operation if audit logging fails
      }
    }

    console.log("✅ Priority Dashboard audit log created successfully");

    return NextResponse.json({
      success: true,
      message: "Audit log created successfully",
    });
  } catch (error) {
    console.error("❌ Priority Dashboard audit logging failed:", error);

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
