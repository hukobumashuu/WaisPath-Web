// src/lib/constants/auditActionCategories.ts
// Action categories for grouped filtering in Activity Logs

import type {
  AuditActionType,
  MobileAdminActionType,
} from "@/lib/services/auditLogger";

/**
 * Category definition for audit actions
 * Each category groups related actions together for easier filtering
 */
export interface ActionCategory {
  id: string;
  label: string;
  icon: string;
  actions: (AuditActionType | MobileAdminActionType)[];
  description?: string;
}

/**
 * All action categories for the audit log filter
 * These categories match the actual audit action types in the system
 */
export const ACTION_CATEGORIES: ActionCategory[] = [
  {
    id: "obstacle_management",
    label: "Obstacle Management",
    icon: "🛡️",
    description: "Actions related to obstacle verification and resolution",
    actions: [
      "priority_obstacle_verified",
      "priority_obstacle_rejected",
      "priority_obstacle_resolved",
      "priority_dashboard_accessed",
    ],
  },
  {
    id: "authentication",
    label: "Authentication",
    icon: "🔐",
    description: "Sign in and sign out actions",
    actions: ["admin_signin_web", "admin_signout_web"],
  },
  {
    id: "admin_management",
    label: "Admin Management",
    icon: "👥",
    description: "Admin account creation and management",
    actions: ["admin_created", "admin_deactivated", "admin_reactivated"],
  },
  {
    id: "mobile_actions",
    label: "Mobile Actions",
    icon: "📱",
    description: "Actions performed via mobile app",
    actions: [
      "mobile_admin_signin",
      "mobile_admin_signout",
      "mobile_obstacle_report",
      "mobile_obstacle_verify",
      "mobile_app_launch",
      "mobile_location_access",
    ],
  },
];

/**
 * Helper function to get all action options with categories
 * Returns a flat array suitable for dropdown rendering
 */
export function getGroupedActionOptions() {
  return ACTION_CATEGORIES.flatMap((category) =>
    category.actions.map((action) => ({
      value: action,
      label: action
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      category: category.id,
      categoryLabel: category.label,
      categoryIcon: category.icon,
    }))
  );
}

/**
 * Get human-readable label for an action
 */
export function getActionLabel(action: string): string {
  const actionLabels: Record<string, string> = {
    // Obstacle Management
    priority_obstacle_verified: "Obstacle Verified",
    priority_obstacle_rejected: "Obstacle Rejected",
    priority_obstacle_resolved: "Obstacle Resolved",
    priority_dashboard_accessed: "Priority Dashboard Accessed",

    // Mobile Actions
    mobile_admin_signin: "Mobile Sign In",
    mobile_admin_signout: "Mobile Sign Out",
    mobile_obstacle_report: "Mobile Obstacle Report",
    mobile_obstacle_verify: "Mobile Obstacle Verify",
    mobile_app_launch: "Mobile App Launch",
    mobile_location_access: "Mobile Location Access",

    // Authentication
    admin_signin_web: "Web Sign In",
    admin_signout_web: "Web Sign Out",
    admin_signin_failed: "Sign In Failed",
    admin_profile_updated: "Profile Updated",
    admin_password_changed: "Password Changed",

    // Admin Management
    admin_created: "Admin Created",
    admin_deactivated: "Admin Deactivated",
    admin_reactivated: "Admin Reactivated",
    admin_role_changed: "Admin Role Changed",
    admin_permissions_updated: "Admin Permissions Updated",

    // User Management
    user_suspended: "User Suspended",
    user_unsuspended: "User Unsuspended",
    user_profile_viewed: "User Profile Viewed",
    user_reports_reviewed: "User Reports Reviewed",

    // System Actions
    system_settings_changed: "System Settings Changed",
    report_generated: "Report Generated",
    data_exported: "Data Exported",
    bulk_import_performed: "Bulk Import Performed",
  };

  return actionLabels[action] || action;
}
