// src/app/dashboard/audit/page.tsx
// REFACTORED: Clean, modular audit page with enhanced UI/UX - Fixed TypeScript errors

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "firebase/auth";

// Import our new components
import AuditStatsCards from "@/components/admin/AuditStatsCards";
import AuditFiltersPanel from "@/components/admin/AuditFiltersPanel";
import AuditLogTable from "@/components/admin/AuditLogTable";

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

// Interfaces
interface DeviceInfo {
  platform: string;
  appVersion: string;
  deviceModel: string;
  deviceBrand?: string;
  osVersion: string;
}

interface LocationInfo {
  latitude: number;
  longitude: number;
}

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
    deviceInfo?: DeviceInfo;
    location?: LocationInfo;
    obstacleId?: string;
    obstacleType?: string;
    obstacleSeverity?: string;
    mobileAction?: boolean;
    [key: string]: unknown;
  };
}

interface AuditStats {
  totalActions: number;
  webActions?: number;
  mobileActions?: number;
  actionsByType: Record<string, number>;
  actionsBySource?: {
    web_portal: number;
    mobile_app: number;
  };
  topAdmins: Array<{ adminEmail: string; actionCount: number }>;
  recentActions: AuditLogEntry[];
}

interface FilterState {
  adminEmail: string;
  action: string;
  targetType: string;
  source: string;
  startDate: string;
  endDate: string;
  search: string;
}

// Helper functions
const getAuthToken = async (): Promise<string | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");
    return await user.getIdToken();
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
};

export default function AuditLogsPage() {
  const { user, loading, hasPermission, hasRole } = useAdminAuth();
  const router = useRouter();

  // State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    adminEmail: "",
    action: "",
    targetType: "",
    source: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  const [statsTimeframe, setStatsTimeframe] = useState<"24h" | "7d" | "30d">(
    "7d"
  );

  // Permission check
  const canViewAuditLogs =
    hasPermission("audit:read") ||
    hasRole("super_admin") ||
    hasRole("lgu_admin");

  // Load admin names for enhanced display
  const loadAdminNames = useCallback(async () => {
    try {
      if (user?.displayName && user?.email && user?.uid) {
        setAdminNames((prev) => ({
          ...prev,
          [user.uid]: user.displayName!,
          [user.email!]: user.displayName!,
        }));
      }
    } catch (error) {
      console.warn("Failed to load admin names:", error);
    }
  }, [user?.displayName, user?.email, user?.uid]);

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "25",
      });

      if (filters.adminEmail) params.append("adminId", filters.adminEmail);
      if (filters.action) params.append("action", filters.action);
      if (filters.targetType) params.append("targetType", filters.targetType);
      if (filters.source) params.append("source", filters.source);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/audit/logs?${params}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to fetch audit logs");

      if (result.success) {
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
            metadata?: {
              source?: "web_portal" | "mobile_app";
              deviceInfo?: DeviceInfo;
              location?: LocationInfo;
              [key: string]: unknown;
            };
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
  }, [currentPage, filters]);

  // Load audit statistics
  const loadAuditStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const authToken = await getAuthToken();
      if (!authToken) return;

      const response = await fetch(
        `/api/audit/stats?timeframe=${statsTimeframe}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const result = await response.json();
      if (response.ok && result.success) {
        setAuditStats(result.data.stats || result.data);
      }
    } catch (error) {
      console.error("Failed to load audit stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, [statsTimeframe]);

  // Effects
  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied: Audit log access requires admin privileges");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.isAdmin && canViewAuditLogs) {
      loadAuditLogs();
      loadAuditStats();
    }
  }, [user, canViewAuditLogs, loadAuditLogs, loadAuditStats]);

  useEffect(() => {
    if (auditLogs.length > 0) {
      loadAdminNames();
    }
  }, [auditLogs, loadAdminNames]);

  // Export functionality
  const handleExport = async () => {
    try {
      const authToken = await getAuthToken();
      if (!authToken || auditLogs.length === 0) {
        toast.error("No data to export or authentication error");
        return;
      }

      const csvHeaders = [
        "Timestamp",
        "Admin",
        "Action",
        "Source",
        "Target Type",
        "Target Description",
        "Details",
        "Device Info",
        "Location",
      ];

      const csvRows = auditLogs.map((log) => [
        log.timestamp.toISOString(),
        adminNames[log.adminId] || adminNames[log.adminEmail] || log.adminEmail,
        log.action,
        log.metadata?.source || "web_portal",
        log.targetType,
        log.targetDescription || log.targetId,
        log.details,
        log.metadata?.deviceInfo
          ? `${log.metadata.deviceInfo.platform} - ${log.metadata.deviceInfo.deviceModel}`
          : "N/A",
        log.metadata?.location
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

  // Filter handlers
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAuditLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      adminEmail: "",
      action: "",
      targetType: "",
      source: "",
      startDate: "",
      endDate: "",
      search: "",
    });
    setCurrentPage(1);
  };

  // Loading states
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PASIG.bg }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: PASIG.softBlue }}
          />
          <p style={{ color: PASIG.muted }}>Loading audit dashboard...</p>
        </div>
      </div>
    );
  }

  // Permission check
  if (!canViewAuditLogs) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PASIG.bg }}
      >
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
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: PASIG.primaryNavy }}
              >
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1
                  className="text-3xl font-bold"
                  style={{ color: PASIG.slate }}
                >
                  Activity Logs
                </h1>
                <p className="text-lg" style={{ color: PASIG.muted }}>
                  Monitor admin activities across web portal and mobile app
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Timeframe Selector */}
              <select
                value={statsTimeframe}
                onChange={(e) =>
                  setStatsTimeframe(e.target.value as "24h" | "7d" | "30d")
                }
                className="px-4 py-2 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-900 bg-white"
                style={{ borderColor: PASIG.subtleBorder }}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={auditLogs.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: PASIG.primaryNavy }}
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {auditStats && (
          <AuditStatsCards stats={auditStats} loading={loadingStats} />
        )}

        {/* Filters Panel */}
        <AuditFiltersPanel
          filters={filters}
          setFilters={setFilters}
          onSubmit={handleFilterSubmit}
          onReset={handleResetFilters}
          show={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        {/* Audit Log Table */}
        <AuditLogTable
          logs={auditLogs}
          loading={loadingLogs}
          adminNames={adminNames}
        />

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm" style={{ color: PASIG.muted }}>
              Showing {(currentPage - 1) * 25 + 1} to{" "}
              {Math.min(currentPage * 25, auditLogs.length)} of{" "}
              {auditLogs.length} results
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!hasPreviousPage}
                className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: PASIG.subtleBorder }}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-1">
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
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        pageNum === currentPage
                          ? "text-white"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                      style={{
                        backgroundColor:
                          pageNum === currentPage
                            ? PASIG.softBlue
                            : "transparent",
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={!hasNextPage}
                className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: PASIG.subtleBorder }}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
