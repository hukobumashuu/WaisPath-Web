// src/app/dashboard/audit/page.tsx
// ENHANCED: Existing audit dashboard with mobile admin logging support

"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import {
  DocumentTextIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  ShieldCheckIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon, // NEW: Mobile icon
  ComputerDesktopIcon, // NEW: Desktop icon
  MapPinIcon, // NEW: Location icon
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "firebase/auth";

/* ---------- Pasig color scheme ---------- */
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

// ENHANCED: Interface with mobile metadata support
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
    source?: "web_portal" | "mobile_app"; // NEW: Source tracking
    deviceInfo?: {
      // NEW: Mobile device info
      platform: string;
      appVersion: string;
      deviceModel: string;
      deviceBrand?: string;
      osVersion: string;
    };
    location?: {
      // NEW: GPS coordinates
      latitude: number;
      longitude: number;
    };
    obstacleId?: string; // NEW: For obstacle reports
    obstacleType?: string;
    obstacleSeverity?: string;
    mobileAction?: boolean;
    [key: string]: unknown;
  };
}

// ENHANCED: Stats interface with mobile support
interface AuditStats {
  totalActions: number;
  webActions?: number; // NEW: Web action count
  mobileActions?: number; // NEW: Mobile action count
  actionsByType: Record<string, number>;
  actionsBySource?: {
    // NEW: Source breakdown
    web_portal: number;
    mobile_app: number;
  };
  topAdmins: Array<{ adminEmail: string; actionCount: number }>;
  recentActions: AuditLogEntry[];
}

// ENHANCED: Filter interface with source filtering
interface FilterState {
  adminEmail: string;
  action: string;
  targetType: string;
  source: string; // NEW: Source filter
  startDate: string;
  endDate: string;
  search: string;
}

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }
    const idToken = await user.getIdToken();
    return idToken;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
};

export default function AuditLogsPage() {
  const { user, loading, hasPermission, hasRole } = useAdminAuth();
  const router = useRouter();

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // ENHANCED: Filter state with source filtering
  const [filters, setFilters] = useState<FilterState>({
    adminEmail: "",
    action: "",
    targetType: "",
    source: "", // NEW: Source filter
    startDate: "",
    endDate: "",
    search: "",
  });

  // Stats timeframe
  const [statsTimeframe, setStatsTimeframe] = useState<"24h" | "7d" | "30d">(
    "7d"
  );

  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied: Audit log access requires admin privileges");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      loadAuditLogs();
      loadAuditStats();
    }
  }, [user, currentPage, filters, statsTimeframe]);

  // ENHANCED: Load audit logs with mobile support
  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);

      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      // ENHANCED: Build query parameters with source filter
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "25",
      });

      if (filters.adminEmail) params.append("adminId", filters.adminEmail);
      if (filters.action) params.append("action", filters.action);
      if (filters.targetType) params.append("targetType", filters.targetType);
      if (filters.source) params.append("source", filters.source); // NEW: Source filter
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/audit/logs?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch audit logs");
      }

      if (result.success) {
        // Convert date strings back to Date objects
        const logs = result.data.map(
          (log: {
            id: string;
            adminId: string;
            adminEmail: string;
            action: string;
            targetType: "obstacle" | "user" | "admin" | "system";
            targetId: string;
            targetDescription?: string;
            details: string;
            timestamp: string;
            metadata?: Record<string, unknown>;
          }) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          })
        );

        setAuditLogs(logs);
        setTotalPages(result.pagination.totalPages);
        setHasNextPage(result.pagination.hasNextPage);
        setHasPreviousPage(result.pagination.hasPreviousPage);
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Load audit statistics
  const loadAuditStats = async () => {
    try {
      setLoadingStats(true);

      const authToken = await getAuthToken();
      if (!authToken) return;

      const response = await fetch(
        `/api/audit/stats?timeframe=${statsTimeframe}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setAuditStats(result.data.stats || result.data); // Handle both old and new API formats
      }
    } catch (error) {
      console.error("Failed to load audit stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // ENHANCED: Get action color with mobile support
  const getActionColor = (action: string): string => {
    // Mobile actions get special treatment
    if (action.startsWith("mobile_")) {
      return "bg-blue-100 text-blue-800";
    }

    // Original logic
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
  };

  // ENHANCED: Get action icon with mobile support
  const getActionIcon = (action: string, source?: string) => {
    // Mobile-specific icons
    if (source === "mobile_app") {
      return DevicePhoneMobileIcon;
    }

    // Action-specific icons
    switch (action) {
      case "mobile_admin_signin":
      case "mobile_admin_signout":
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

  // Get target type icon
  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case "admin":
        return ShieldCheckIcon;
      case "user":
        return UserIcon;
      case "obstacle":
        return MagnifyingGlassIcon;
      case "system":
        return DocumentTextIcon;
      default:
        return DocumentTextIcon;
    }
  };

  // ENHANCED: Export audit logs with mobile data
  const handleExport = async () => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      if (auditLogs.length === 0) {
        toast.error("No audit logs to export. Please refresh and try again.");
        return;
      }

      // ENHANCED: CSV headers with mobile data
      const csvHeaders = [
        "Timestamp",
        "Admin Email",
        "Action",
        "Source", // NEW
        "Target Type",
        "Target Description",
        "Details",
        "Device Info", // NEW
        "Location", // NEW
      ];

      // ENHANCED: CSV rows with mobile metadata
      const csvRows = auditLogs.map((log) => [
        log.timestamp.toISOString(),
        log.adminEmail,
        log.action,
        log.metadata?.source || "web_portal", // NEW
        log.targetType,
        log.targetDescription || log.targetId,
        log.details,
        log.metadata?.deviceInfo // NEW
          ? `${log.metadata.deviceInfo.platform} - ${log.metadata.deviceInfo.deviceModel}`
          : "N/A",
        log.metadata?.location // NEW
          ? `${log.metadata.location.latitude}, ${log.metadata.location.longitude}`
          : "N/A",
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `waispath-audit-logs-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Audit logs exported successfully");
    } catch (error) {
      console.error("Failed to export audit logs:", error);
      toast.error("Failed to export audit logs");
    }
  };

  // Apply filters
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    loadAuditLogs();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      adminEmail: "",
      action: "",
      targetType: "",
      source: "", // NEW
      startDate: "",
      endDate: "",
      search: "",
    });
    setCurrentPage(1);
  };

  // Format action text for display
  const formatActionText = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Check permissions
  const canViewAuditLogs =
    hasPermission("audit:read") ||
    hasRole("super_admin") ||
    hasRole("lgu_admin");

  if (loading || loadingLogs || loadingStats) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div
              style={{ borderTopColor: PASIG.softBlue }}
              className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto"
            />
            <p className="mt-4 text-sm" style={{ color: PASIG.muted }}>
              Loading activity logs...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!canViewAuditLogs) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don&apos;t have permission to view activity logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: PASIG.slate }}>
                Admin Activity Logs
              </h1>
              <p className="mt-2 text-sm" style={{ color: PASIG.muted }}>
                Monitor admin activities across web portal and mobile app
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FunnelIcon className="h-4 w-4" />
                {showFilters ? "Hide" : "Show"} Filters
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: PASIG.primaryNavy }}
                disabled={auditLogs.length === 0}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* ENHANCED: Statistics Cards with Mobile/Web Breakdown */}
        {auditStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Total Actions
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {auditStats.totalActions.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* NEW: Mobile Actions Card */}
            {auditStats.mobileActions !== undefined && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <DevicePhoneMobileIcon
                    className="h-8 w-8"
                    style={{ color: PASIG.softBlue }}
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">
                      Mobile Actions
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {auditStats.mobileActions.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NEW: Web Actions Card */}
            {auditStats.webActions !== undefined && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <ComputerDesktopIcon className="h-8 w-8 text-gray-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">
                      Web Actions
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {auditStats.webActions.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <UserIcon
                  className="h-8 w-8"
                  style={{ color: PASIG.success }}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Active Admins
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {auditStats.topAdmins.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ENHANCED: Filter Panel with Source Filter */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <form onSubmit={handleFilterSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="text"
                    value={filters.adminEmail}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        adminEmail: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Filter by admin email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        action: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Actions</option>
                    <option value="obstacle_verified">Obstacle Verified</option>
                    <option value="obstacle_rejected">Obstacle Rejected</option>
                    <option value="obstacle_resolved">Obstacle Resolved</option>
                    <option value="admin_created">Admin Created</option>
                    <option value="mobile_admin_signin">Mobile Sign In</option>
                    <option value="mobile_admin_signout">
                      Mobile Sign Out
                    </option>
                    <option value="mobile_obstacle_report">
                      Mobile Report
                    </option>
                  </select>
                </div>

                {/* NEW: Source Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <select
                    value={filters.source}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        source: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Sources</option>
                    <option value="web_portal">Web Portal</option>
                    <option value="mobile_app">Mobile App</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Type
                  </label>
                  <select
                    value={filters.targetType}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        targetType: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Targets</option>
                    <option value="obstacle">Obstacle</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Reset Filters
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white"
                  style={{ backgroundColor: PASIG.softBlue }}
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ENHANCED: Audit Logs Table with Mobile Data */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {auditLogs.length === 0 && !loadingLogs ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No audit logs found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Admin activities will appear here when they occur.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead style={{ backgroundColor: PASIG.bg }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin / Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source / Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => {
                    const ActionIcon = getActionIcon(
                      log.action,
                      log.metadata?.source
                    );
                    const actionColor = getActionColor(log.action);

                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ActionIcon
                              className="h-5 w-5 mr-3"
                              style={{
                                color:
                                  log.metadata?.source === "mobile_app"
                                    ? PASIG.softBlue
                                    : PASIG.muted,
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {log.adminEmail}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatActionText(log.action)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            {/* NEW: Source Badge */}
                            <div className="flex items-center mb-1">
                              {log.metadata?.source === "mobile_app" ? (
                                <DevicePhoneMobileIcon className="h-4 w-4 mr-1 text-blue-500" />
                              ) : (
                                <ComputerDesktopIcon className="h-4 w-4 mr-1 text-gray-500" />
                              )}
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  log.metadata?.source === "mobile_app"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {log.metadata?.source === "mobile_app"
                                  ? "Mobile App"
                                  : "Web Portal"}
                              </span>
                            </div>

                            {/* Target Info */}
                            <div className="text-sm text-gray-500">
                              {log.targetType}:{" "}
                              {log.targetDescription || log.targetId}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 mb-1">
                            {log.details}
                          </div>

                          {/* NEW: Mobile-specific details */}
                          {log.metadata?.source === "mobile_app" && (
                            <div className="text-xs text-gray-500 space-y-1">
                              {log.metadata.deviceInfo && (
                                <div>
                                  📱 {log.metadata.deviceInfo.platform} -{" "}
                                  {log.metadata.deviceInfo.deviceModel}
                                </div>
                              )}
                              {log.metadata.obstacleType && (
                                <div>
                                  🚧 {log.metadata.obstacleType} (
                                  {log.metadata.obstacleSeverity})
                                </div>
                              )}
                              {log.metadata.location && (
                                <div>
                                  📍 {log.metadata.location.latitude.toFixed(6)}
                                  , {log.metadata.location.longitude.toFixed(6)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {log.timestamp.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex justify-between flex-1 sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * 25 + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * 25, auditLogs.length)}
                    </span>{" "}
                    of <span className="font-medium">{auditLogs.length}</span>{" "}
                    results
                  </p>
                </div>

                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={!hasPreviousPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={!hasNextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast container */}
      <Toaster position="top-right" />
    </div>
  );
}
