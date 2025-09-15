// src/app/api/audit/logs/route.ts
// FIXED: Simplified query logic to avoid complex composite index requirements

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
      // CLEANED: Valid action types matching the cleaned audit logger
      const validActions: (AuditActionType | MobileAdminActionType)[] = [
        // Priority Dashboard actions (main obstacle management)
        "priority_obstacle_verified",
        "priority_obstacle_rejected",
        "priority_obstacle_resolved",
        "priority_dashboard_accessed",

        // Authentication actions
        "admin_signin_web",
        "admin_signout_web",
        "admin_signin_failed",
        "admin_profile_updated",
        "admin_password_changed",

        // User management actions
        "user_suspended",
        "user_unsuspended",
        "user_profile_viewed",
        "user_reports_reviewed",

        // Admin management actions
        "admin_created",
        "admin_deactivated",
        "admin_reactivated",
        "admin_role_changed",
        "admin_permissions_updated",

        // System actions
        "system_settings_changed",
        "report_generated",
        "data_exported",
        "bulk_import_performed",

        // Mobile actions
        "mobile_admin_signin",
        "mobile_admin_signout",
        "mobile_obstacle_report",
        "mobile_obstacle_verify",
        "mobile_app_launch",
        "mobile_location_access",
      ];

      // Only set action if it's a valid type
      if (
        validActions.includes(
          actionParam as AuditActionType | MobileAdminActionType
        )
      ) {
        action = actionParam as AuditActionType | MobileAdminActionType;
      }
    }

    console.log("📋 Fetching audit logs with simplified approach:", {
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

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // STRATEGY 1: Try the simplified query first
    try {
      console.log("🔍 Attempting simplified query...");

      // Get logs with simplified filters to avoid complex composite indexes
      const auditLogs = await auditLogger.getAuditLogs({
        adminId,
        action,
        targetType,
        source,
        startDate,
        endDate,
        limit: limit * 10, // Get more records to handle client-side pagination temporarily
      });

      console.log(`📄 Retrieved ${auditLogs.length} total logs`);

      // Apply client-side pagination temporarily until indexes are created
      const totalLogs = auditLogs.length;
      const startIndex = offset;
      const endIndex = startIndex + limit;
      const paginatedLogs = auditLogs.slice(startIndex, endIndex);

      // Calculate pagination info
      const totalPages = Math.ceil(totalLogs / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      // Format response data with mobile-specific fields
      const safeAuditData = paginatedLogs.map((log) => ({
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

      console.log(`📊 Returning ${safeAuditData.length} logs (page ${page})`);

      return NextResponse.json({
        success: true,
        data: safeAuditData,
        pagination: {
          page,
          limit,
          total: totalLogs,
          hasNextPage,
          hasPreviousPage,
          totalPages,
        },
      });
    } catch (indexError) {
      console.warn(
        "⚠️ Complex query failed, falling back to basic query:",
        indexError
      );

      // FALLBACK: Get basic logs without complex filters
      const basicLogs = await auditLogger.getAuditLogs({
        limit: limit * 2, // Get a reasonable amount
      });

      // Apply basic client-side filtering
      let filteredLogs = basicLogs;

      if (adminId) {
        filteredLogs = filteredLogs.filter(
          (log) => log.adminId === adminId || log.adminEmail === adminId
        );
      }

      if (action) {
        filteredLogs = filteredLogs.filter((log) => log.action === action);
      }

      if (targetType) {
        filteredLogs = filteredLogs.filter(
          (log) => log.targetType === targetType
        );
      }

      if (source) {
        filteredLogs = filteredLogs.filter(
          (log) => log.metadata?.source === source
        );
      }

      if (startDate || endDate) {
        filteredLogs = filteredLogs.filter((log) => {
          const logDate = log.timestamp;
          if (startDate && logDate < startDate) return false;
          if (endDate && logDate > endDate) return false;
          return true;
        });
      }

      // Apply pagination
      const totalLogs = filteredLogs.length;
      const startIndex = offset;
      const endIndex = startIndex + limit;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      const totalPages = Math.ceil(totalLogs / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const safeAuditData = paginatedLogs.map((log) => ({
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

      console.log(
        `📊 Fallback: Returning ${safeAuditData.length} filtered logs`
      );

      return NextResponse.json({
        success: true,
        data: safeAuditData,
        pagination: {
          page,
          limit,
          total: totalLogs,
          hasNextPage,
          hasPreviousPage,
          totalPages,
        },
        warning:
          "Using fallback filtering. Please create the required Firestore indexes for better performance.",
      });
    }
  } catch (error) {
    console.error("Audit logs API error:", error);

    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes("auth/invalid-id-token")) {
        return NextResponse.json(
          { success: false, error: "Invalid authentication token" },
          { status: 401 }
        );
      }

      if (error.message.includes("index")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Database index required. Please create the required Firestore composite index and try again.",
            indexUrl:
              "https://console.firebase.google.com/project/waispath-4dbf1/firestore/indexes",
          },
          { status: 500 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to fetch audit logs. Please try again or contact support.",
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
