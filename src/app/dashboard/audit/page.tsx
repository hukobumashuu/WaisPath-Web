// src/app/dashboard/audit/page.tsx
// UPDATED: Responsive design matching current version with fixed filters and pagination

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "firebase/auth";

// Import our components
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // FIXED: Separate form filters from applied filters
  const [filters, setFilters] = useState<FilterState>({
    adminEmail: "",
    action: "",
    targetType: "",
    source: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    adminEmail: "",
    action: "",
    targetType: "",
    source: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Admin names for display
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});

  // Stats timeframe
  const [statsTimeframe, setStatsTimeframe] = useState<"24h" | "7d" | "30d">(
    "7d"
  );

  // Check permissions
  const canViewAuditLogs =
    hasPermission("audit:read") ||
    hasRole("super_admin") ||
    hasRole("lgu_admin");

  // Load audit logs using appliedFilters
  const loadAuditLogs = useCallback(async () => {
    if (!canViewAuditLogs) return;

    try {
      setLoadingLogs(true);

      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please sign in again.");
        return;
      }

      // Build query parameters using appliedFilters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "25",
      });

      if (appliedFilters.adminEmail) {
        params.append("adminId", appliedFilters.adminEmail);
      }
      if (appliedFilters.action) {
        params.append("action", appliedFilters.action);
      }
      if (appliedFilters.targetType) {
        params.append("targetType", appliedFilters.targetType);
      }
      if (appliedFilters.source) {
        params.append("source", appliedFilters.source);
      }
      if (appliedFilters.startDate) {
        params.append("startDate", appliedFilters.startDate);
      }
      if (appliedFilters.endDate) {
        params.append("endDate", appliedFilters.endDate);
      }

      const response = await fetch(`/api/audit/logs?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const logs = result.data.map(
          (log: {
            id: string;
            adminId: string;
            adminEmail: string;
            action: string;
            targetType: string;
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
      } else {
        console.error("Failed to load audit logs:", result.error);
        toast.error(result.error || "Failed to load audit logs");
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoadingLogs(false);
    }
  }, [currentPage, appliedFilters, canViewAuditLogs]);

  // Load audit statistics
  const loadAuditStats = useCallback(async () => {
    if (!canViewAuditLogs) return;

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
  }, [statsTimeframe, canViewAuditLogs]);

  // Load admin names for display
  const loadAdminNames = useCallback(async () => {
    if (auditLogs.length === 0) return;

    try {
      const uniqueAdmins = Array.from(
        new Set([
          ...auditLogs.map((log) => log.adminEmail),
          ...auditLogs.map((log) => log.adminId),
        ])
      );

      const names: Record<string, string> = {};
      uniqueAdmins.forEach((identifier) => {
        if (identifier && identifier.includes("@")) {
          names[identifier] = identifier;
        }
      });

      setAdminNames(names);
    } catch (error) {
      console.error("Failed to load admin names:", error);
    }
  }, [auditLogs]);

  // FIXED: Handle filter submission (apply only when form submitted)
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
    toast.success("Filters applied");
  };

  // FIXED: Handle filter reset
  const handleResetFilters = () => {
    const emptyFilters = {
      adminEmail: "",
      action: "",
      targetType: "",
      source: "",
      startDate: "",
      endDate: "",
      search: "",
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
    toast.success("Filters cleared");
  };

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
          ? `${log.metadata.deviceInfo.platform} ${log.metadata.deviceInfo.deviceModel}`
          : "",
        log.metadata?.location
          ? `${log.metadata.location.latitude}, ${log.metadata.location.longitude}`
          : "",
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Audit logs exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export audit logs");
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin || !canViewAuditLogs) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600">
          You don&apos;t have permission to view audit logs.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toaster position="top-right" />

        {/* Responsive Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-8">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: PASIG.slate }}
            >
              Activity Logs
            </h1>
            <p
              className="mt-1 text-sm sm:text-base"
              style={{ color: PASIG.muted }}
            >
              Monitor admin actions and system activity
            </p>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            {/* Stats Timeframe Selector */}
            <select
              value={statsTimeframe}
              onChange={(e) =>
                setStatsTimeframe(e.target.value as "24h" | "7d" | "30d")
              }
              className="w-full sm:w-auto px-3 py-2 border rounded-lg text-sm"
              style={{
                borderColor: PASIG.subtleBorder,
                backgroundColor: PASIG.card,
                color: PASIG.slate,
              }}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={auditLogs.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-white rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: PASIG.primaryNavy }}
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {auditStats && (
          <div className="mb-8">
            <AuditStatsCards stats={auditStats} loading={loadingStats} />
          </div>
        )}

        {/* Filters Panel */}
        <div className="mb-8">
          <AuditFiltersPanel
            filters={filters}
            setFilters={setFilters}
            onSubmit={handleFilterSubmit}
            onReset={handleResetFilters}
            show={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />
        </div>

        {/* Audit Log Table */}
        <div className="mb-8">
          <AuditLogTable
            logs={auditLogs}
            loading={loadingLogs}
            adminNames={adminNames}
          />
        </div>

        {/* RESPONSIVE: Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div
              className="text-sm text-center sm:text-left"
              style={{ color: PASIG.muted }}
            >
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center justify-center space-x-1">
              {/* Previous Button */}
              <button
                onClick={handlePreviousPage}
                disabled={!hasPreviousPage}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{
                  borderColor: PASIG.subtleBorder,
                  backgroundColor: PASIG.card,
                  color: PASIG.slate,
                }}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Page Numbers - Responsive */}
              <div className="hidden sm:flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    // Smart pagination for large page counts
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                  }

                  const isActive = pageNum === currentPage;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: isActive ? PASIG.softBlue : PASIG.card,
                        color: isActive ? "white" : PASIG.slate,
                        border: `1px solid ${PASIG.subtleBorder}`,
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Page Info */}
              <div
                className="sm:hidden px-3 py-2 text-sm font-medium"
                style={{ color: PASIG.slate }}
              >
                {currentPage} / {totalPages}
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{
                  borderColor: PASIG.subtleBorder,
                  backgroundColor: PASIG.card,
                  color: PASIG.slate,
                }}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
