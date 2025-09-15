// src/lib/services/auditLogger.ts
// COMPLETE FIX: Ensures both web and mobile logs are visible by default

import { getAdminDb } from "../firebase/admin";
import type { Firestore } from "firebase-admin/firestore";

// ENHANCED: Extended audit log entry interface with mobile support
export interface AuditLogEntry {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: AuditActionType | MobileAdminActionType;
  targetType: "obstacle" | "user" | "admin" | "system";
  targetId: string;
  targetDescription?: string;
  details: string;
  metadata?: {
    source?: "web_portal" | "mobile_app";
    deviceInfo?: {
      platform: string;
      appVersion: string;
      deviceModel: string;
      deviceBrand?: string;
      osVersion: string;
    };
    location?: {
      latitude: number;
      longitude: number;
    };
    obstacleId?: string;
    obstacleType?: string;
    obstacleSeverity?: string;
    mobileAction?: boolean;
    [key: string]: unknown;
  };
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ENHANCED: Combined audit action types (web + mobile + priority)
export type AuditActionType =
  // Obstacle actions
  | "obstacle_verified"
  | "obstacle_rejected"
  | "obstacle_resolved"
  | "obstacle_bulk_action"
  | "obstacle_false_report"

  // Priority Dashboard actions
  | "priority_obstacle_verified"
  | "priority_obstacle_rejected"
  | "priority_obstacle_resolved"
  | "priority_dashboard_accessed"

  // Authentication actions
  | "admin_signin_web"
  | "admin_signout_web"
  | "admin_signin_failed"
  | "admin_profile_updated"
  | "admin_password_changed"

  // User actions
  | "user_suspended"
  | "user_unsuspended"
  | "user_profile_viewed"
  | "user_reports_reviewed"

  // Admin actions
  | "admin_created"
  | "admin_deactivated"
  | "admin_reactivated"
  | "admin_role_changed"
  | "admin_permissions_updated"

  // System actions
  | "system_settings_changed"
  | "report_generated"
  | "data_exported"
  | "bulk_import_performed";

// Mobile admin action types
export type MobileAdminActionType =
  | "mobile_admin_signin"
  | "mobile_admin_signout"
  | "mobile_obstacle_report"
  | "mobile_obstacle_verify"
  | "mobile_app_launch"
  | "mobile_location_access";

// ENHANCED: Combined action descriptions
const ACTION_DESCRIPTIONS: Record<
  AuditActionType | MobileAdminActionType,
  string
> = {
  // Web obstacle actions
  obstacle_verified: "Verified obstacle report",
  obstacle_rejected: "Rejected obstacle report as false",
  obstacle_resolved: "Marked obstacle as resolved/fixed",
  obstacle_bulk_action: "Performed bulk action on obstacles",
  obstacle_false_report: "Flagged obstacle as false report",

  // Priority Dashboard actions
  priority_obstacle_verified: "Verified obstacle via Priority Dashboard",
  priority_obstacle_rejected: "Rejected obstacle via Priority Dashboard",
  priority_obstacle_resolved: "Resolved obstacle via Priority Dashboard",
  priority_dashboard_accessed: "Accessed Priority Analysis Dashboard",

  // Authentication actions
  admin_signin_web: "Admin signed in to web portal",
  admin_signout_web: "Admin signed out from web portal",
  admin_signin_failed: "Failed admin sign-in attempt",
  admin_profile_updated: "Updated admin profile information",
  admin_password_changed: "Changed admin password",

  // Web user actions
  user_suspended: "Suspended user account",
  user_unsuspended: "Unsuspended user account",
  user_profile_viewed: "Viewed user profile details",
  user_reports_reviewed: "Reviewed user's obstacle reports",

  // Web admin actions
  admin_created: "Created new admin account",
  admin_deactivated: "Deactivated admin account",
  admin_reactivated: "Reactivated admin account",
  admin_role_changed: "Changed admin role/permissions",
  admin_permissions_updated: "Updated admin permissions",

  // Web system actions
  system_settings_changed: "Modified system settings",
  report_generated: "Generated analytics report",
  data_exported: "Exported system data",
  bulk_import_performed: "Performed bulk data import",

  // Mobile admin actions
  mobile_admin_signin: "Admin signed in to mobile app",
  mobile_admin_signout: "Admin signed out from mobile app",
  mobile_obstacle_report: "Reported obstacle via mobile app",
  mobile_obstacle_verify: "Verified obstacle report via mobile app",
  mobile_app_launch: "Launched mobile app",
  mobile_location_access: "Granted location access permission",
};

// Filter options for UI (including mobile + priority actions)
export const AUDIT_FILTER_OPTIONS = {
  actions: [
    { value: "", label: "All Actions" },
    // Web actions
    { value: "obstacle_verified", label: "Obstacle Verified" },
    { value: "obstacle_rejected", label: "Obstacle Rejected" },
    { value: "obstacle_resolved", label: "Obstacle Resolved" },
    { value: "admin_created", label: "Admin Created" },
    // Priority Dashboard actions
    {
      value: "priority_obstacle_verified",
      label: "Priority: Obstacle Verified",
    },
    {
      value: "priority_obstacle_rejected",
      label: "Priority: Obstacle Rejected",
    },
    {
      value: "priority_obstacle_resolved",
      label: "Priority: Obstacle Resolved",
    },
    {
      value: "priority_dashboard_accessed",
      label: "Priority: Dashboard Accessed",
    },
    // Authentication actions
    { value: "admin_signin_web", label: "Web Sign In" },
    { value: "admin_signout_web", label: "Web Sign Out" },
    { value: "admin_signin_failed", label: "Web Sign In Failed" },
    { value: "admin_profile_updated", label: "Profile Updated" },
    { value: "admin_password_changed", label: "Password Changed" },
    // Mobile actions
    { value: "mobile_admin_signin", label: "Mobile Sign In" },
    { value: "mobile_admin_signout", label: "Mobile Sign Out" },
    { value: "mobile_obstacle_report", label: "Mobile Obstacle Report" },
  ],
  targetTypes: [
    { value: "", label: "All Targets" },
    { value: "obstacle", label: "Obstacle" },
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
    { value: "system", label: "System" },
  ],
  sources: [
    { value: "", label: "All Sources" },
    { value: "web_portal", label: "Web Portal" },
    { value: "mobile_app", label: "Mobile App" },
  ],
};

interface AuditLogOptions {
  adminId?: string;
  action?: AuditActionType | MobileAdminActionType;
  targetType?: string;
  source?: "web_portal" | "mobile_app";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

class AuditLogger {
  private db: Firestore;

  constructor() {
    this.db = getAdminDb();
  }

  /**
   * Log an admin action to the audit trail (supports mobile actions)
   */
  async logAction(
    entry: Omit<AuditLogEntry, "timestamp" | "id">
  ): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
        details:
          entry.details ||
          ACTION_DESCRIPTIONS[entry.action] ||
          "Admin action performed",
        metadata: {
          source: entry.metadata?.source || "web_portal",
          ...entry.metadata,
        },
      };

      // Save to Firestore
      await this.db.collection("audit_logs").add(auditEntry);

      console.log(`📝 Audit log: ${entry.action} by ${entry.adminEmail}`);
    } catch (error) {
      console.error("Failed to log audit entry:", error);
      // Don't throw error - audit logging shouldn't break app functionality
    }
  }

  /**
   * Get audit logs with filtering and pagination - FIXED to properly handle offset
   */
  async getAuditLogs(options: AuditLogOptions = {}): Promise<AuditLogEntry[]> {
    try {
      // Start with basic query ordering by timestamp
      let query = this.db.collection("audit_logs").orderBy("timestamp", "desc");

      console.log("🔍 Building audit query with options:", {
        adminId: options.adminId,
        action: options.action,
        targetType: options.targetType,
        source: options.source,
        hasDateRange: !!(options.startDate || options.endDate),
        limit: options.limit,
        offset: options.offset,
      });

      // Apply server-side filters
      if (options.adminId) {
        query = query.where("adminId", "==", options.adminId);
        console.log(`  ➡️ Filtering by adminId: ${options.adminId}`);
      }

      if (options.action) {
        query = query.where("action", "==", options.action);
        console.log(`  ➡️ Filtering by action: ${options.action}`);
      }

      if (options.targetType) {
        query = query.where("targetType", "==", options.targetType);
        console.log(`  ➡️ Filtering by targetType: ${options.targetType}`);
      }

      if (options.startDate) {
        query = query.where("timestamp", ">=", options.startDate);
        console.log(
          `  ➡️ Filtering by startDate: ${options.startDate.toISOString()}`
        );
      }

      if (options.endDate) {
        query = query.where("timestamp", "<=", options.endDate);
        console.log(
          `  ➡️ Filtering by endDate: ${options.endDate.toISOString()}`
        );
      }

      // Handle source filtering with composite index
      if (options.source) {
        console.log(`  ➡️ Filtering by source: ${options.source}`);
        query = query.where("metadata.source", "==", options.source);
      }

      // Apply offset for pagination (skip documents)
      if (options.offset && options.offset > 0) {
        query = query.offset(options.offset);
        console.log(`  ➡️ Skipping first ${options.offset} documents`);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
        console.log(`  ➡️ Limiting to: ${options.limit} documents`);
      }

      console.log("🔍 Executing Firestore query...");
      const snapshot = await query.get();

      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        };
      }) as AuditLogEntry[];

      console.log(`✅ Retrieved ${logs.length} audit logs`);

      // Log source distribution for debugging
      const sourceCount = logs.reduce((acc, log) => {
        const source = log.metadata?.source || "web_portal";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("📊 Source distribution:", sourceCount);

      return logs;
    } catch (error) {
      console.error("❌ Failed to get audit logs:", error);
      throw error;
    }
  }

  /**
   * Get audit logs for mobile admins only
   */
  async getMobileAuditLogs(
    options: AuditLogOptions = {}
  ): Promise<AuditLogEntry[]> {
    const mobileOptions = {
      ...options,
      source: "mobile_app" as const,
    };

    return this.getAuditLogs(mobileOptions);
  }

  /**
   * Get audit statistics (includes mobile stats)
   */
  async getAuditStats(timeframe: "24h" | "7d" | "30d" = "7d"): Promise<{
    totalActions: number;
    webActions: number;
    mobileActions: number;
    actionsByType: Record<string, number>;
    actionsBySource: { web_portal: number; mobile_app: number };
    topAdmins: Array<{ adminEmail: string; actionCount: number }>;
    recentActions: AuditLogEntry[];
  }> {
    try {
      // Set timeframe
      const now = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case "24h":
          startDate.setHours(now.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const logs = await this.getAuditLogs({
        startDate,
        endDate: now,
        limit: 1000,
      });

      // Calculate statistics
      const actionsByType: Record<string, number> = {};
      const adminActionCounts: Record<string, number> = {};
      let webActions = 0;
      let mobileActions = 0;

      logs.forEach((log) => {
        // Count by action type
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;

        // Count by admin
        adminActionCounts[log.adminEmail] =
          (adminActionCounts[log.adminEmail] || 0) + 1;

        // Count by source
        const source = log.metadata?.source || "web_portal";
        if (source === "mobile_app") {
          mobileActions++;
        } else {
          webActions++;
        }
      });

      // Get top admins
      const topAdmins = Object.entries(adminActionCounts)
        .map(([email, count]) => ({ adminEmail: email, actionCount: count }))
        .sort((a, b) => b.actionCount - a.actionCount)
        .slice(0, 5);

      const stats = {
        totalActions: logs.length,
        webActions,
        mobileActions,
        actionsByType,
        actionsBySource: {
          web_portal: webActions,
          mobile_app: mobileActions,
        },
        topAdmins,
        recentActions: logs.slice(0, 10),
      };

      console.log("📊 Generated audit stats:", {
        totalActions: stats.totalActions,
        webActions: stats.webActions,
        mobileActions: stats.mobileActions,
        sourceBreakdown: stats.actionsBySource,
      });

      return stats;
    } catch (error) {
      console.error("Failed to get audit stats:", error);
      throw error;
    }
  }

  /**
   * Get mobile admin activity summary
   */
  async getMobileAdminSummary(
    adminEmail?: string,
    timeframe: "24h" | "7d" | "30d" = "7d"
  ): Promise<{
    totalMobileActions: number;
    signIns: number;
    signOuts: number;
    obstacleReports: number;
    lastActivity?: Date;
    deviceInfo?: {
      platform: string;
      deviceModel: string;
      appVersion: string;
    };
  }> {
    try {
      // Set timeframe
      const now = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case "24h":
          startDate.setHours(now.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const logs = await this.getMobileAuditLogs({
        startDate,
        endDate: now,
      });

      // Filter by admin email if provided
      const filteredLogs = adminEmail
        ? logs.filter((log) => log.adminEmail === adminEmail)
        : logs;

      const summary = {
        totalMobileActions: filteredLogs.length,
        signIns: filteredLogs.filter(
          (log) => log.action === "mobile_admin_signin"
        ).length,
        signOuts: filteredLogs.filter(
          (log) => log.action === "mobile_admin_signout"
        ).length,
        obstacleReports: filteredLogs.filter(
          (log) => log.action === "mobile_obstacle_report"
        ).length,
        lastActivity:
          filteredLogs.length > 0 ? filteredLogs[0].timestamp : undefined,
        deviceInfo:
          filteredLogs.length > 0
            ? filteredLogs[0].metadata?.deviceInfo
            : undefined,
      };

      return summary;
    } catch (error) {
      console.error("Failed to get mobile admin summary:", error);
      return {
        totalMobileActions: 0,
        signIns: 0,
        signOuts: 0,
        obstacleReports: 0,
      };
    }
  }

  /**
   * Helper methods for common audit actions
   */
  async logObstacleAction(
    adminId: string,
    adminEmail: string,
    action: "obstacle_verified" | "obstacle_rejected" | "obstacle_resolved",
    obstacleId: string,
    obstacleType: string,
    details?: string
  ): Promise<void> {
    await this.logAction({
      adminId,
      adminEmail,
      action,
      targetType: "obstacle",
      targetId: obstacleId,
      targetDescription: `${obstacleType} obstacle`,
      details:
        details ||
        `${ACTION_DESCRIPTIONS[action]} for ${obstacleType} obstacle`,
    });
  }

  async logAdminAction(
    performedBy: { id: string; email: string },
    action: "admin_created" | "admin_deactivated" | "admin_reactivated",
    targetAdminId: string,
    targetAdminEmail: string,
    details?: string
  ): Promise<void> {
    await this.logAction({
      adminId: performedBy.id,
      adminEmail: performedBy.email,
      action,
      targetType: "admin",
      targetId: targetAdminId,
      targetDescription: targetAdminEmail,
      details:
        details || `${ACTION_DESCRIPTIONS[action]} for ${targetAdminEmail}`,
    });
  }

  async logUserAction(
    adminId: string,
    adminEmail: string,
    action: "user_suspended" | "user_unsuspended" | "user_profile_viewed",
    userId: string,
    userEmail: string,
    details?: string
  ): Promise<void> {
    await this.logAction({
      adminId,
      adminEmail,
      action,
      targetType: "user",
      targetId: userId,
      targetDescription: userEmail,
      details: details || `${ACTION_DESCRIPTIONS[action]} for ${userEmail}`,
    });
  }

  async logSystemAction(
    adminId: string,
    adminEmail: string,
    action: "system_settings_changed" | "report_generated" | "data_exported",
    details: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logAction({
      adminId,
      adminEmail,
      action,
      targetType: "system",
      targetId: "system",
      targetDescription: "System operation",
      details,
      metadata,
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Export the class for potential direct instantiation
export default AuditLogger;
