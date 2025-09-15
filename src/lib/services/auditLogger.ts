// src/lib/services/auditLogger.ts
// CLEANED: Removed redundant actions, kept only functional ones

import { getAdminDb } from "../firebase/admin";
import type { Firestore } from "firebase-admin/firestore";

// CLEANED: Extended audit log entry interface with mobile support
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

// CLEANED: Main audit action types - removed redundant obstacle actions
export type AuditActionType =
  // Priority Dashboard actions (these are the MAIN obstacle actions)
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

  // User management actions
  | "user_suspended"
  | "user_unsuspended"
  | "user_profile_viewed"
  | "user_reports_reviewed"

  // Admin management actions
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

// CLEANED: Action descriptions - removed redundant descriptions
const ACTION_DESCRIPTIONS: Record<
  AuditActionType | MobileAdminActionType,
  string
> = {
  // Priority Dashboard actions (main obstacle management)
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

  // User management actions
  user_suspended: "Suspended user account",
  user_unsuspended: "Unsuspended user account",
  user_profile_viewed: "Viewed user profile details",
  user_reports_reviewed: "Reviewed user's obstacle reports",

  // Admin management actions
  admin_created: "Created new admin account",
  admin_deactivated: "Deactivated admin account",
  admin_reactivated: "Reactivated admin account",
  admin_role_changed: "Changed admin role/permissions",
  admin_permissions_updated: "Updated admin permissions",

  // System actions
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

// CLEANED: Filter options matching actual system actions
export const AUDIT_FILTER_OPTIONS = {
  actions: [
    { value: "", label: "All Actions" },

    // Priority Dashboard Actions (main obstacle management)
    { value: "priority_obstacle_verified", label: "Obstacle Verified" },
    { value: "priority_obstacle_rejected", label: "Obstacle Rejected" },
    { value: "priority_obstacle_resolved", label: "Obstacle Resolved" },
    {
      value: "priority_dashboard_accessed",
      label: "Priority Dashboard Accessed",
    },

    // Admin Management Actions
    { value: "admin_created", label: "Admin Created" },
    { value: "admin_deactivated", label: "Admin Deactivated" },
    { value: "admin_reactivated", label: "Admin Reactivated" },
    { value: "admin_role_changed", label: "Admin Role Changed" },
    { value: "admin_permissions_updated", label: "Admin Permissions Updated" },

    // Authentication Actions
    { value: "admin_signin_web", label: "Web Sign In" },
    { value: "admin_signout_web", label: "Web Sign Out" },
    { value: "admin_signin_failed", label: "Sign In Failed" },
    { value: "admin_profile_updated", label: "Profile Updated" },
    { value: "admin_password_changed", label: "Password Changed" },

    // User Management Actions
    { value: "user_suspended", label: "User Suspended" },
    { value: "user_unsuspended", label: "User Unsuspended" },
    { value: "user_profile_viewed", label: "User Profile Viewed" },
    { value: "user_reports_reviewed", label: "User Reports Reviewed" },

    // System Actions
    { value: "system_settings_changed", label: "System Settings Changed" },
    { value: "report_generated", label: "Report Generated" },
    { value: "data_exported", label: "Data Exported" },
    { value: "bulk_import_performed", label: "Bulk Import Performed" },

    // Mobile Actions
    { value: "mobile_admin_signin", label: "Mobile Sign In" },
    { value: "mobile_admin_signout", label: "Mobile Sign Out" },
    { value: "mobile_obstacle_report", label: "Mobile Obstacle Report" },
    { value: "mobile_obstacle_verify", label: "Mobile Obstacle Verify" },
    { value: "mobile_app_launch", label: "Mobile App Launch" },
    { value: "mobile_location_access", label: "Mobile Location Access" },
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
   * Get audit logs with simplified query building to avoid complex index requirements
   */
  async getAuditLogs(options: AuditLogOptions = {}): Promise<AuditLogEntry[]> {
    try {
      console.log("🔍 Building simplified audit query with options:", {
        adminId: options.adminId,
        action: options.action,
        targetType: options.targetType,
        source: options.source,
        hasDateRange: !!(options.startDate || options.endDate),
        limit: options.limit,
        offset: options.offset,
      });

      // Start with basic query ordering by timestamp
      let query = this.db.collection("audit_logs").orderBy("timestamp", "desc");

      // Apply filters one at a time to avoid complex composite index requirements
      if (options.adminId) {
        query = query.where("adminId", "==", options.adminId);
      }

      if (options.action) {
        query = query.where("action", "==", options.action);
      }

      if (options.targetType) {
        query = query.where("targetType", "==", options.targetType);
      }

      // Handle source filtering separately to avoid complex composite indexes
      if (options.source) {
        query = query.where("metadata.source", "==", options.source);
      }

      // Handle date range filtering
      if (options.startDate) {
        query = query.where("timestamp", ">=", options.startDate);
      }

      if (options.endDate) {
        query = query.where("timestamp", "<=", options.endDate);
      }

      // Apply limit if specified
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Apply offset if specified (for pagination)
      if (options.offset && options.offset > 0) {
        query = query.offset(options.offset);
      }

      console.log("🔍 Executing simplified Firestore query...");
      const snapshot = await query.get();

      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          adminId: data.adminId,
          adminEmail: data.adminEmail,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          targetDescription: data.targetDescription,
          details: data.details,
          timestamp: data.timestamp.toDate(),
          metadata: data.metadata || {},
        } as AuditLogEntry;
      });

      console.log(`📄 Retrieved ${logs.length} audit logs`);

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
   * Get audit statistics with mobile analytics
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
      // Calculate date range
      const now = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case "24h":
          startDate.setHours(startDate.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      // Get all logs within timeframe
      const logs = await this.getAuditLogs({
        startDate,
        endDate: now,
        limit: 1000, // Reasonable limit for stats
      });

      // Calculate statistics
      const totalActions = logs.length;
      const mobileActions = logs.filter(
        (log) => log.metadata?.source === "mobile_app"
      ).length;
      const webActions = totalActions - mobileActions;

      // Actions by type
      const actionsByType = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Actions by source
      const actionsBySource = {
        web_portal: webActions,
        mobile_app: mobileActions,
      };

      // Top admins
      const adminCounts = logs.reduce((acc, log) => {
        acc[log.adminEmail] = (acc[log.adminEmail] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topAdmins = Object.entries(adminCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([adminEmail, actionCount]) => ({ adminEmail, actionCount }));

      // Recent actions (last 10)
      const recentActions = logs.slice(0, 10);

      const stats = {
        totalActions,
        webActions,
        mobileActions,
        actionsByType,
        actionsBySource,
        topAdmins,
        recentActions,
      };

      console.log("📊 Generated audit stats:", {
        totalActions,
        webActions,
        mobileActions,
        sourceBreakdown: actionsBySource,
      });

      return stats;
    } catch (error) {
      console.error("Failed to get audit stats:", error);
      throw error;
    }
  }

  /**
   * Helper methods for priority dashboard actions (main obstacle management)
   */
  async logPriorityAction(
    adminId: string,
    adminEmail: string,
    action:
      | "priority_obstacle_verified"
      | "priority_obstacle_rejected"
      | "priority_obstacle_resolved",
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

  async logAuthAction(
    adminId: string,
    adminEmail: string,
    action: "admin_signin_web" | "admin_signout_web",
    details?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logAction({
      adminId,
      adminEmail,
      action,
      targetType: "admin",
      targetId: adminId,
      targetDescription: adminEmail,
      details: details || ACTION_DESCRIPTIONS[action],
      metadata: {
        source: "web_portal",
        ...metadata,
      },
    });
  }

  /**
   * Get mobile admin summary
   */
  async getMobileAdminSummary(
    adminEmail: string,
    timeframe: "24h" | "7d" | "30d" = "7d"
  ): Promise<{
    totalMobileActions: number;
    lastMobileActivity: Date | null;
    mobileActionBreakdown: Record<string, number>;
  }> {
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case "24h":
          startDate.setHours(startDate.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      // Get mobile logs for specific admin
      const logs = await this.getAuditLogs({
        source: "mobile_app",
        startDate,
        endDate: now,
      });

      // Filter by admin email
      const adminLogs = logs.filter((log) => log.adminEmail === adminEmail);

      const totalMobileActions = adminLogs.length;
      const lastMobileActivity =
        adminLogs.length > 0 ? adminLogs[0].timestamp : null;

      // Mobile action breakdown
      const mobileActionBreakdown = adminLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalMobileActions,
        lastMobileActivity,
        mobileActionBreakdown,
      };
    } catch (error) {
      console.error("Failed to get mobile admin summary:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
