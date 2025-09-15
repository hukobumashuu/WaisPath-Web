// src/app/api/audit/logs/route.ts
// FIXED: Proper pagination at database level, not client-side slicing

import { NextRequest, NextResponse } from "next/server";
import {
  auditLogger,
  type AuditActionType,
  type MobileAdminActionType,
} from "@/lib/services/auditLogger";
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

    // Check if user has permission to read audit logs
    const hasAuditPermission =
      decodedToken.permissions?.includes("audit:read") ||
      decodedToken.role === "super_admin" ||
      decodedToken.role === "lgu_admin";

    if (!hasAuditPermission) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to view audit logs",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const adminId = searchParams.get("adminId") || undefined;
    const actionParam = searchParams.get("action");
    const targetType = searchParams.get("targetType") || undefined;
    const source = searchParams.get("source") as
      | "web_portal"
      | "mobile_app"
      | undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    // Validate and convert action parameter to proper type
    let action: AuditActionType | MobileAdminActionType | undefined = undefined;
    if (actionParam) {
      const validActions: (AuditActionType | MobileAdminActionType)[] = [
        // Web actions
        "obstacle_verified",
        "obstacle_rejected",
        "obstacle_resolved",
        "obstacle_bulk_action",
        "obstacle_false_report",
        "user_suspended",
        "user_unsuspended",
        "user_profile_viewed",
        "user_reports_reviewed",
        "admin_created",
        "admin_deactivated",
        "admin_reactivated",
        "admin_role_changed",
        "admin_permissions_updated",
        "system_settings_changed",
        "report_generated",
        "data_exported",
        "bulk_import_performed",
        "priority_obstacle_verified",
        "priority_obstacle_rejected",
        "priority_obstacle_resolved",
        "priority_dashboard_accessed",
        "admin_signin_web",
        "admin_signout_web",
        "admin_signin_failed",
        "admin_profile_updated",
        "admin_password_changed",
        // Mobile actions
        "mobile_admin_signin",
        "mobile_admin_signout",
        "mobile_obstacle_report",
        "mobile_obstacle_verify",
        "mobile_app_launch",
        "mobile_location_access",
      ];

      if (
        validActions.includes(
          actionParam as AuditActionType | MobileAdminActionType
        )
      ) {
        action = actionParam as AuditActionType | MobileAdminActionType;
      }
    }

    console.log("📋 Fetching audit logs with proper pagination:", {
      page,
      limit,
      adminId,
      action,
      targetType,
      source,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      requestedBy: decodedToken.email,
    });

    // FIXED: Calculate proper offset for database pagination
    const offset = (page - 1) * limit;

    // First, get total count for pagination info (without limit)
    const totalLogs = await auditLogger.getAuditLogs({
      adminId,
      action,
      targetType,
      source,
      startDate,
      endDate,
      // No limit for count query
    });

    console.log(`📊 Total logs matching filters: ${totalLogs.length}`);

    // Then get the actual page of logs with proper database-level pagination
    const auditLogs = await auditLogger.getAuditLogs({
      adminId,
      action,
      targetType,
      source,
      startDate,
      endDate,
      limit,
      offset, // FIXED: Pass offset to database query
    });

    console.log(`📄 Retrieved ${auditLogs.length} logs for page ${page}`);

    // Calculate pagination info based on total count
    const totalPages = Math.ceil(totalLogs.length / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Format response data with mobile-specific fields
    const safeAuditData = auditLogs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      adminEmail: log.adminEmail,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      targetDescription: log.targetDescription,
      details: log.details,
      timestamp: log.timestamp,
      metadata: {
        source: log.metadata?.source || "web_portal",
        deviceInfo: log.metadata?.deviceInfo,
        location: log.metadata?.location,
        obstacleId: log.metadata?.obstacleId,
        obstacleType: log.metadata?.obstacleType,
        obstacleSeverity: log.metadata?.obstacleSeverity,
        mobileAction: log.metadata?.mobileAction,
      },
    }));

    // Log source distribution for the current page
    const pageSourceCount = safeAuditData.reduce((acc, log) => {
      const source = log.metadata.source || "web_portal";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📊 Page ${page} source distribution:`, pageSourceCount);

    return NextResponse.json({
      success: true,
      data: safeAuditData,
      pagination: {
        page,
        limit,
        total: totalLogs.length,
        hasNextPage,
        hasPreviousPage,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Enhanced audit logs API error:", error);

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
        error: "Failed to fetch enhanced audit logs. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
