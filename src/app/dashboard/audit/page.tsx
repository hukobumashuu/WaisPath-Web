// src/app/dashboard/audit/page.tsx
// Complete Audit Logs Dashboard with filtering, search, and export

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
  metadata?: Record<string, unknown>;
}

interface AuditStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  topAdmins: Array<{ adminEmail: string; actionCount: number }>;
  recentActions: AuditLogEntry[];
}

interface FilterState {
  adminEmail: string;
  action: string;
  targetType: string;
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

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    adminEmail: "",
    action: "",
    targetType: "",
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

  // Load audit logs with filters
  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);

      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "25",
      });

      if (filters.adminEmail) params.append("adminId", filters.adminEmail);
      if (filters.action) params.append("action", filters.action);
      if (filters.targetType) params.append("targetType", filters.targetType);
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
        setAuditStats(result.data);
      }
    } catch (error) {
      console.error("Failed to load audit stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Get action color for badges
  const getActionColor = (action: string): string => {
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

  // Export audit logs
  const handleExport = async () => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      // Create CSV content
      const csvHeaders = [
        "Timestamp",
        "Admin Email",
        "Action",
        "Target Type",
        "Target Description",
        "Details",
      ];

      const csvRows = auditLogs.map((log) => [
        log.timestamp.toISOString(),
        log.adminEmail,
        log.action,
        log.targetType,
        log.targetDescription || log.targetId,
        log.details,
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
      ].join("\n");

      // Download CSV
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
      startDate: "",
      endDate: "",
      search: "",
    });
    setCurrentPage(1);
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
              Loading audit logs...
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
              You don&apos;t have permission to view audit logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PASIG.bg, minHeight: "100vh" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <header
        style={{
          backgroundColor: PASIG.card,
          borderBottomColor: PASIG.subtleBorder,
        }}
        className="shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: PASIG.slate }}>
                Audit Logs
              </h1>
              <p className="text-sm" style={{ color: PASIG.muted }}>
                Track all administrative actions and system activities
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow"
                style={{
                  backgroundColor: PASIG.primaryNavy,
                  color: "#fff",
                  border: "1px solid rgba(11, 50, 82, 0.08)",
                }}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>

              <button
                onClick={handleExport}
                disabled={auditLogs.length === 0}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow"
                style={{
                  backgroundColor: PASIG.success,
                  color: "#fff",
                  opacity: auditLogs.length === 0 ? 0.6 : 1,
                }}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {auditStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div
              className="bg-white overflow-hidden rounded-lg"
              style={{ boxShadow: "0 6px 18px rgba(8,52,90,0.04)" }}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon
                      className="h-6 w-6"
                      style={{ color: PASIG.muted }}
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt
                        className="text-sm font-medium truncate"
                        style={{ color: PASIG.muted }}
                      >
                        Total Actions
                      </dt>
                      <dd
                        className="text-lg font-medium"
                        style={{ color: PASIG.slate }}
                      >
                        {auditStats.totalActions}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="bg-white overflow-hidden rounded-lg"
              style={{ boxShadow: "0 6px 18px rgba(11,165,255,0.04)" }}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheckIcon
                      className="h-6 w-6"
                      style={{ color: PASIG.softBlue }}
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt
                        className="text-sm font-medium truncate"
                        style={{ color: PASIG.muted }}
                      >
                        Admin Actions
                      </dt>
                      <dd
                        className="text-lg font-medium"
                        style={{ color: PASIG.slate }}
                      >
                        {Object.entries(auditStats.actionsByType)
                          .filter(([key]) => key.startsWith("admin_"))
                          .reduce((sum, [, count]) => sum + count, 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="bg-white overflow-hidden rounded-lg"
              style={{ boxShadow: "0 6px 18px rgba(8,52,90,0.04)" }}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserIcon
                      className="h-6 w-6"
                      style={{ color: PASIG.success }}
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt
                        className="text-sm font-medium truncate"
                        style={{ color: PASIG.muted }}
                      >
                        Active Admins
                      </dt>
                      <dd
                        className="text-lg font-medium"
                        style={{ color: PASIG.slate }}
                      >
                        {auditStats.topAdmins.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="bg-white overflow-hidden rounded-lg"
              style={{ boxShadow: "0 6px 18px rgba(8,52,90,0.04)" }}
            >
              <div className="p-5">
                <div className="flex items-center space-x-2">
                  <select
                    value={statsTimeframe}
                    onChange={(e) =>
                      setStatsTimeframe(e.target.value as "24h" | "7d" | "30d")
                    }
                    className="text-sm border rounded"
                    style={{
                      borderColor: PASIG.subtleBorder,
                      color: PASIG.slate,
                    }}
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <form onSubmit={handleFilterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={filters.adminEmail}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        adminEmail: e.target.value,
                      }))
                    }
                    className="w-full rounded-md px-3 py-2"
                    placeholder="Filter by admin email"
                    style={{
                      border: `1px solid ${PASIG.subtleBorder}`,
                      backgroundColor: PASIG.bg,
                      color: PASIG.slate,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Action Type
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        action: e.target.value,
                      }))
                    }
                    className="w-full rounded-md px-3 py-2"
                    style={{
                      border: `1px solid ${PASIG.subtleBorder}`,
                      backgroundColor: PASIG.bg,
                      color: PASIG.slate,
                    }}
                  >
                    <option value="">All Actions</option>
                    <option value="admin_created">Admin Created</option>
                    <option value="admin_deactivated">Admin Deactivated</option>
                    <option value="admin_reactivated">Admin Reactivated</option>
                    <option value="obstacle_verified">Obstacle Verified</option>
                    <option value="obstacle_rejected">Obstacle Rejected</option>
                    <option value="obstacle_resolved">Obstacle Resolved</option>
                    <option value="user_suspended">User Suspended</option>
                    <option value="user_unsuspended">User Unsuspended</option>
                    <option value="system_settings_changed">
                      System Settings Changed
                    </option>
                    <option value="report_generated">Report Generated</option>
                    <option value="data_exported">Data Exported</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
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
                    className="w-full rounded-md px-3 py-2"
                    style={{
                      border: `1px solid ${PASIG.subtleBorder}`,
                      backgroundColor: PASIG.bg,
                      color: PASIG.slate,
                    }}
                  >
                    <option value="">All Targets</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="obstacle">Obstacle</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-md px-3 py-2"
                    style={{
                      border: `1px solid ${PASIG.subtleBorder}`,
                      backgroundColor: PASIG.bg,
                      color: PASIG.slate,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-md px-3 py-2"
                    style={{
                      border: `1px solid ${PASIG.subtleBorder}`,
                      backgroundColor: PASIG.bg,
                      color: PASIG.slate,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    border: `1px solid ${PASIG.subtleBorder}`,
                    backgroundColor: PASIG.card,
                    color: PASIG.slate,
                  }}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: PASIG.softBlue,
                    color: "#fff",
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Audit Logs Table */}
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          {auditLogs.length === 0 && !loadingLogs ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
              {Object.values(filters).some((f) => f) && (
                <button
                  onClick={handleResetFilters}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Clear filters to see all logs
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead style={{ backgroundColor: PASIG.bg }}>
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: PASIG.muted }}
                      >
                        Timestamp
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: PASIG.muted }}
                      >
                        Admin
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: PASIG.muted }}
                      >
                        Action
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: PASIG.muted }}
                      >
                        Target
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: PASIG.muted }}
                      >
                        Details
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: PASIG.muted }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => {
                      const TargetIcon = getTargetTypeIcon(log.targetType);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm"
                            style={{ color: PASIG.muted }}
                          >
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-2" />
                              <div>
                                <div>{log.timestamp.toLocaleDateString()}</div>
                                <div className="text-xs">
                                  {log.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <UserIcon
                                className="h-4 w-4 mr-2"
                                style={{ color: PASIG.muted }}
                              />
                              <div
                                className="text-sm font-medium"
                                style={{ color: PASIG.slate }}
                              >
                                {log.adminEmail}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                                log.action
                              )}`}
                            >
                              {log.action.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <TargetIcon
                                className="h-4 w-4 mr-2"
                                style={{ color: PASIG.muted }}
                              />
                              <div>
                                <div
                                  className="text-sm font-medium"
                                  style={{ color: PASIG.slate }}
                                >
                                  {log.targetType.toUpperCase()}
                                </div>
                                <div
                                  className="text-xs"
                                  style={{ color: PASIG.muted }}
                                >
                                  {log.targetDescription || log.targetId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="text-sm"
                              style={{ color: PASIG.slate }}
                            >
                              {log.details.length > 60
                                ? `${log.details.substring(0, 60)}...`
                                : log.details}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium"
                              style={{
                                border: "1px solid rgba(15,23,42,0.06)",
                                backgroundColor: PASIG.card,
                                color: PASIG.primaryNavy,
                                boxShadow: "0 1px 2px rgba(8,52,90,0.03)",
                              }}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!hasPreviousPage}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!hasNextPage}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page{" "}
                        <span className="font-medium">{currentPage}</span> of{" "}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!hasPreviousPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          {currentPage}
                        </span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!hasNextPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(2,6,23,0.45)" }}
        >
          <div
            className="rounded-lg max-w-2xl w-full p-6"
            style={{
              backgroundColor: PASIG.card,
              boxShadow: "0 20px 50px rgba(8,52,90,0.12)",
              border: `1px solid ${PASIG.subtleBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: PASIG.slate }}
              >
                Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Timestamp
                  </label>
                  <p className="text-sm" style={{ color: PASIG.slate }}>
                    {selectedLog.timestamp.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Admin
                  </label>
                  <p className="text-sm" style={{ color: PASIG.slate }}>
                    {selectedLog.adminEmail}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Action
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                      selectedLog.action
                    )}`}
                  >
                    {selectedLog.action.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Target Type
                  </label>
                  <p className="text-sm" style={{ color: PASIG.slate }}>
                    {selectedLog.targetType.toUpperCase()}
                  </p>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: PASIG.primaryNavy }}
                >
                  Target Description
                </label>
                <p className="text-sm" style={{ color: PASIG.slate }}>
                  {selectedLog.targetDescription || selectedLog.targetId}
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: PASIG.primaryNavy }}
                >
                  Details
                </label>
                <p className="text-sm" style={{ color: PASIG.slate }}>
                  {selectedLog.details}
                </p>
              </div>

              {selectedLog.metadata &&
                Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: PASIG.primaryNavy }}
                    >
                      Additional Metadata
                    </label>
                    <pre
                      className="text-xs bg-gray-100 p-3 rounded"
                      style={{ color: PASIG.slate }}
                    >
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{
                  backgroundColor: PASIG.softBlue,
                  color: "#fff",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
