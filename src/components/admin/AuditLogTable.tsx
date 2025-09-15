// src/components/admin/AuditLogTable.tsx
// Enhanced audit log table with name display and modern UI

"use client";

import React from "react";
import {
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  UserIcon,
  ShieldCheckIcon,
  MapPinIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const PASIG = {
  primaryNavy: "#08345A",
  softBlue: "#2BA4FF",
  slate: "#0F172A",
  muted: "#6B7280",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  subtleBorder: "#E6EEF8",
};

interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: "obstacle" | "user" | "admin" | "system";
  targetId: string;
  targetDescription?: string;
  details: string;
  timestamp: Date;
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
}

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  loading?: boolean;
  adminNames?: Record<string, string>; // adminId/email -> displayName
}

export default function AuditLogTable({
  logs,
  loading = false,
  adminNames = {},
}: AuditLogTableProps) {
  // Safe name display with fallback
  const formatAdminDisplay = (adminEmail: string, adminId?: string) => {
    const displayName = adminNames[adminId || ""] || adminNames[adminEmail];

    if (displayName) {
      return `${displayName} (${adminEmail})`;
    }

    return adminEmail;
  };

  // Format action text for display
  const formatActionText = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    if (action.includes("priority")) return "bg-purple-100 text-purple-800";
    if (action.includes("verified") || action.includes("approved"))
      return "bg-green-100 text-green-800";
    if (action.includes("rejected") || action.includes("failed"))
      return "bg-red-100 text-red-800";
    if (action.includes("signin") || action.includes("signout"))
      return "bg-blue-100 text-blue-800";
    if (action.includes("mobile")) return "bg-indigo-100 text-indigo-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get action icon
  const getActionIcon = (action: string, source?: string) => {
    if (source === "mobile_app") return DevicePhoneMobileIcon;

    switch (action) {
      case "mobile_admin_signin":
      case "mobile_admin_signout":
      case "admin_signin_web":
      case "admin_signout_web":
        return UserIcon;
      case "mobile_obstacle_report":
        return MapPinIcon;
      case "obstacle_verified":
      case "obstacle_rejected":
        return ShieldCheckIcon;
      case "admin_created":
      case "admin_deactivated":
        return UserIcon;
      default:
        return DocumentTextIcon;
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-2xl shadow-sm border overflow-hidden"
        style={{
          backgroundColor: PASIG.card,
          borderColor: PASIG.subtleBorder,
        }}
      >
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div
        className="rounded-2xl shadow-sm border"
        style={{
          backgroundColor: PASIG.card,
          borderColor: PASIG.subtleBorder,
        }}
      >
        <div className="text-center py-16">
          <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No audit logs found
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Admin activities will appear here when they occur. Try adjusting
            your filters or date range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl shadow-sm border overflow-hidden"
      style={{
        backgroundColor: PASIG.card,
        borderColor: PASIG.subtleBorder,
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead style={{ backgroundColor: PASIG.bg }}>
            <tr>
              <th
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: PASIG.muted }}
              >
                Admin & Action
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: PASIG.muted }}
              >
                Source & Target
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: PASIG.muted }}
              >
                Details
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: PASIG.muted }}
              >
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => {
              const ActionIcon = getActionIcon(
                log.action,
                log.metadata?.source
              );
              const actionBadgeColor = getActionBadgeColor(log.action);

              return (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  {/* Admin & Action */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                        style={{ backgroundColor: `${PASIG.softBlue}15` }}
                      >
                        <UserCircleIcon
                          className="h-6 w-6"
                          style={{ color: PASIG.softBlue }}
                        />
                      </div>
                      <div>
                        <div
                          className="text-sm font-medium"
                          style={{ color: PASIG.slate }}
                        >
                          {formatAdminDisplay(log.adminEmail, log.adminId)}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${actionBadgeColor}`}
                          >
                            {formatActionText(log.action)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Source & Target */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      {/* Source Badge */}
                      <div className="flex items-center">
                        {log.metadata?.source === "mobile_app" ? (
                          <DevicePhoneMobileIcon className="h-4 w-4 mr-2 text-blue-500" />
                        ) : (
                          <ComputerDesktopIcon className="h-4 w-4 mr-2 text-gray-500" />
                        )}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.metadata?.source === "mobile_app"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {log.metadata?.source === "mobile_app"
                            ? "Mobile"
                            : "Web"}
                        </span>
                      </div>

                      {/* Target Info */}
                      <div className="text-sm" style={{ color: PASIG.muted }}>
                        <span className="font-medium">{log.targetType}:</span>{" "}
                        {log.targetDescription || log.targetId}
                      </div>
                    </div>
                  </td>

                  {/* Details */}
                  <td className="px-6 py-4">
                    <div
                      className="text-sm mb-2"
                      style={{ color: PASIG.slate }}
                    >
                      {log.details}
                    </div>

                    {/* Mobile-specific details */}
                    {log.metadata?.source === "mobile_app" && (
                      <div
                        className="text-xs space-y-1"
                        style={{ color: PASIG.muted }}
                      >
                        {log.metadata.deviceInfo && (
                          <div className="flex items-center">
                            <DevicePhoneMobileIcon className="h-3 w-3 mr-1" />
                            {log.metadata.deviceInfo.platform} -{" "}
                            {log.metadata.deviceInfo.deviceModel}
                          </div>
                        )}
                        {log.metadata.obstacleType && (
                          <div className="flex items-center">
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            {log.metadata.obstacleType} (
                            {log.metadata.obstacleSeverity})
                          </div>
                        )}
                        {log.metadata.location && (
                          <div className="flex items-center">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {log.metadata.location.latitude.toFixed(6)},{" "}
                            {log.metadata.location.longitude.toFixed(6)}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Timestamp */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium"
                      style={{ color: PASIG.slate }}
                    >
                      {log.timestamp.toLocaleDateString()}
                    </div>
                    <div className="text-sm" style={{ color: PASIG.muted }}>
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
