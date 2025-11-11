// src/app/dashboard/audit/page.tsx
// UPDATED: Instant filtering, date presets at top, grouped actions

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

// Helper to calculate date ranges for presets
const getDateRange = (preset: "24h" | "7d" | "30d" | "all") => {
  const now = new Date();
  const start = new Date();

  switch (preset) {
    case "24h":
      start.setHours(start.getHours() - 24);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    case "7d":
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    case "30d":
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    case "all":
      return { startDate: "", endDate: "" };
    default:
      return { startDate: "", endDate: "" };
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

  // UPDATED: Single filter state for instant filtering (REMOVED source and targetType from active use)
  const [filters, setFilters] = useState<FilterState>({
    adminEmail: "",
    action: "",
    targetType: "", // Kept for compatibility but not used in UI
    source: "", // Kept for compatibility but not used in UI
    startDate: "",
    endDate: "",
    search: "",
  });

  // NEW: Date preset state
  const [datePreset, setDatePreset] = useState<"24h" | "7d" | "30d" | "all">(
    "7d"
  );

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

  // UPDATED: Instant filter change handler with debouncing for email
  const [emailDebounceTimer, setEmailDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      if (key === "adminEmail") {
        // Debounce admin email input (500ms delay)
        if (emailDebounceTimer) {
          clearTimeout(emailDebounceTimer);
        }

        const timer = setTimeout(() => {
          setFilters((prev) => ({ ...prev, [key]: value }));
          setCurrentPage(1); // Reset to page 1 when filter changes
        }, 500);

        setEmailDebounceTimer(timer);
      } else {
        // Instant filter for dropdowns
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to page 1 when filter changes
      }
    },
    [emailDebounceTimer]
  );

  // NEW: Handle date preset changes
  const handleDatePresetChange = useCallback(
    (preset: "24h" | "7d" | "30d" | "all") => {
      setDatePreset(preset);
      const dateRange = getDateRange(preset);
      setFilters((prev) => ({
        ...prev,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }));
      setCurrentPage(1);
      toast.success(
        `Showing logs from last ${preset === "all" ? "all time" : preset}`
      );
    },
    []
  );

  // Load audit logs - triggers automatically when filters change
  const loadAuditLogs = useCallback(async () => {
    if (!canViewAuditLogs) return;

    try {
      setLoadingLogs(true);

      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please sign in again.");
        return;
      }

      // Build query parameters using filters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "25",
      });

      if (filters.adminEmail) {
        params.append("adminId", filters.adminEmail);
      }
      if (filters.action) {
        params.append("action", filters.action);
      }

      if (filters.targetType) {
        params.append("targetType", filters.targetType);
      }

      if (filters.source) {
        params.append("source", filters.source);
      }
      // REMOVED: targetType and source filters (not in UI anymore)
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
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
  }, [currentPage, filters, canViewAuditLogs]);

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

  // UPDATED: Reset filters handler
  const handleResetFilters = () => {
    const emptyFilters = {
      adminEmail: "",
      action: "",
      targetType: "", // Kept for compatibility
      source: "", // Kept for compatibility
      startDate: "",
      endDate: "",
      search: "",
    };

    setFilters(emptyFilters);
    setDatePreset("all");
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

  // Set initial date filter on mount
  useEffect(() => {
    const initialDateRange = getDateRange("7d");
    setFilters((prev) => ({
      ...prev,
      startDate: initialDateRange.startDate,
      endDate: initialDateRange.endDate,
    }));
  }, []);

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

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.csv`;
      a.click();

      toast.success("Audit logs exported successfully");
    } catch (error) {
      console.error("Failed to export audit logs:", error);
      toast.error("Failed to export audit logs");
    }
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Loading states
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: PASIG.bg }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: PASIG.softBlue }}
          ></div>
          <p style={{ color: PASIG.muted }}>Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin || !canViewAuditLogs) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: PASIG.bg }}
      >
        <div className="text-center">
          <ShieldCheckIcon
            className="h-16 w-16 mx-auto mb-4"
            style={{ color: PASIG.muted }}
          />
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: PASIG.slate }}
          >
            Access Denied
          </h2>
          <p style={{ color: PASIG.muted }}>
            You don&apos;t have permission to view audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toaster position="top-right" />
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
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

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={auditLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: PASIG.softBlue }}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
        {/* NEW: Date Filter Presets at Top */}
        <div
          className="rounded-2xl p-4 mb-6 shadow-sm border"
          style={{
            backgroundColor: PASIG.card,
            borderColor: PASIG.subtleBorder,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: PASIG.slate }}
              >
                📅 Time Range:
              </span>
            </div>

            {/* Date Preset Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: "24h" as const, label: "Last 24 Hours" },
                { value: "7d" as const, label: "Last 7 Days" },
                { value: "30d" as const, label: "Last 30 Days" },
                { value: "all" as const, label: "All Time" },
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleDatePresetChange(preset.value)}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
                  style={{
                    backgroundColor:
                      datePreset === preset.value ? PASIG.softBlue : PASIG.card,
                    color: datePreset === preset.value ? "white" : PASIG.slate,
                    border: `2px solid ${
                      datePreset === preset.value
                        ? PASIG.softBlue
                        : PASIG.subtleBorder
                    }`,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Stats Timeframe Selector (for stats cards) */}
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: PASIG.muted }}
              >
                Stats:
              </span>
              <select
                value={statsTimeframe}
                onChange={(e) =>
                  setStatsTimeframe(e.target.value as "24h" | "7d" | "30d")
                }
                className="px-3 py-2 border rounded-lg text-sm"
                style={{
                  borderColor: PASIG.subtleBorder,
                  backgroundColor: PASIG.card,
                  color: PASIG.slate,
                }}
              >
                <option value="24h">24h</option>
                <option value="7d">7d</option>
                <option value="30d">30d</option>
              </select>
            </div>
          </div>
        </div>
        {/* Stats Cards - FIXED: Only pass stats and loading props */}{" "}
        {auditStats && (
          <AuditStatsCards stats={auditStats} loading={loadingStats} />
        )}
        {/* UPDATED: Filters Panel with instant filtering */}
        <AuditFiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          show={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />
        {/* Audit Logs Table */}
        <AuditLogTable
          logs={auditLogs}
          loading={loadingLogs}
          adminNames={adminNames}
        />
        {/* Pagination */}
        {!loadingLogs && auditLogs.length > 0 && (
          <div
            className="mt-6 rounded-2xl p-4 shadow-sm border"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm" style={{ color: PASIG.muted }}>
                Page {currentPage} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={!hasPreviousPage}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                  style={{
                    borderColor: PASIG.subtleBorder,
                    color: PASIG.slate,
                    backgroundColor: PASIG.card,
                  }}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </button>

                <button
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                  style={{
                    borderColor: PASIG.subtleBorder,
                    color: PASIG.slate,
                    backgroundColor: PASIG.card,
                  }}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Empty State - SINGLE MESSAGE ONLY */}
        {!loadingLogs && auditLogs.length === 0 && (
          <div
            className="rounded-2xl p-12 text-center shadow-sm border"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <ShieldCheckIcon
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: PASIG.muted }}
            />
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: PASIG.slate }}
            >
              No Activity Logs Found
            </h3>
            <p style={{ color: PASIG.muted }}>
              No activity logs match your current filters. Try adjusting the
              date range or clearing filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
