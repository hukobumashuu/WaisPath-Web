// src/lib/services/auditLogger.ts
// Audit logging service for tracking all admin actions

import { getAdminDb } from "../firebase/admin";
import type { Firestore } from "firebase-admin/firestore";

// Audit log entry interface
export interface AuditLogEntry {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: AuditActionType;
  targetType: "obstacle" | "user" | "admin" | "system";
  targetId: string;
  targetDescription?: string;
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Audit action types
export type AuditActionType =
  // Obstacle actions
  | "obstacle_verified"
  | "obstacle_rejected"
  | "obstacle_resolved"
  | "obstacle_bulk_action"
  | "obstacle_false_report"

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

// Quick action descriptions
const ACTION_DESCRIPTIONS: Record<AuditActionType, string> = {
  // Obstacle actions
  obstacle_verified: "Verified obstacle report",
  obstacle_rejected: "Rejected obstacle report as false",
  obstacle_resolved: "Marked obstacle as resolved/fixed",
  obstacle_bulk_action: "Performed bulk action on obstacles",
  obstacle_false_report: "Flagged obstacle as false report",

  // User actions
  user_suspended: "Suspended user account",
  user_unsuspended: "Unsuspended user account",
  user_profile_viewed: "Viewed user profile details",
  user_reports_reviewed: "Reviewed user's obstacle reports",

  // Admin actions
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
};

class AuditLogger {
  private db: Firestore;

  constructor() {
    this.db = getAdminDb();
  }

  /**
   * Log an admin action to the audit trail
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
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    options: {
      adminId?: string;
      action?: AuditActionType;
      targetType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      let query = this.db.collection("audit_logs").orderBy("timestamp", "desc");

      // Apply filters
      if (options.adminId) {
        query = query.where("adminId", "==", options.adminId);
      }
      if (options.action) {
        query = query.where("action", "==", options.action);
      }
      if (options.targetType) {
        query = query.where("targetType", "==", options.targetType);
      }
      if (options.startDate) {
        query = query.where("timestamp", ">=", options.startDate);
      }
      if (options.endDate) {
        query = query.where("timestamp", "<=", options.endDate);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as AuditLogEntry;
      });
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      throw error;
    }
  }

  /**
   * Get audit statistics for dashboard
   */
  async getAuditStats(timeframe: "24h" | "7d" | "30d" = "7d"): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    topAdmins: Array<{ adminEmail: string; actionCount: number }>;
    recentActions: AuditLogEntry[];
  }> {
    try {
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

      logs.forEach((log) => {
        // Count by action type
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;

        // Count by admin
        adminActionCounts[log.adminEmail] =
          (adminActionCounts[log.adminEmail] || 0) + 1;
      });

      // Get top admins
      const topAdmins = Object.entries(adminActionCounts)
        .map(([email, count]) => ({ adminEmail: email, actionCount: count }))
        .sort((a, b) => b.actionCount - a.actionCount)
        .slice(0, 5);

      return {
        totalActions: logs.length,
        actionsByType,
        topAdmins,
        recentActions: logs.slice(0, 10),
      };
    } catch (error) {
      console.error("Failed to get audit stats:", error);
      throw error;
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
      details,
      metadata,
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Helper function to get user-friendly action description
export function getActionDescription(action: AuditActionType): string {
  return ACTION_DESCRIPTIONS[action] || action;
}

// Helper function to get action color for UI
export function getActionColor(action: AuditActionType): string {
  if (action.startsWith("obstacle_")) {
    return "bg-blue-100 text-blue-800";
  }
  if (action.startsWith("user_")) {
    return "bg-green-100 text-green-800";
  }
  if (action.startsWith("admin_")) {
    return "bg-red-100 text-red-800";
  }
  if (action.startsWith("system_")) {
    return "bg-purple-100 text-purple-800";
  }
  return "bg-gray-100 text-gray-800";
}
