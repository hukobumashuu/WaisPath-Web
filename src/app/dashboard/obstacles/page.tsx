// src/app/dashboard/obstacles/page.tsx
// ENHANCED: Modern UI/UX matching Priority Analysis style

"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";
import {
  CheckCircleIcon,
  MapPinIcon,
  FunnelIcon,
  ArrowLeftIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import {
  AdminObstacle,
  ObstacleType,
  ObstacleStatus,
  ObstacleSeverity,
} from "@/types/admin";

// Enhanced Obstacle Card Component with modern styling
interface ObstacleCardProps {
  obstacle: AdminObstacle;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  onSelect: (obstacle: AdminObstacle) => void;
  processing: boolean;
}

function EnhancedObstacleCard({
  obstacle,
  onVerify,
  onReject,
  onSelect,
  processing,
}: ObstacleCardProps) {
  const getStatusBadge = (status: ObstacleStatus) => {
    const badges = {
      pending:
        "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300",
      verified:
        "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300",
      resolved:
        "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300",
      false_report:
        "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
    };
    return badges[status];
  };

  const getSeverityBadge = (severity: ObstacleSeverity) => {
    const badges = {
      blocking:
        "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
      high: "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300",
      medium:
        "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300",
      low: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300",
    };
    return badges[severity];
  };

  const getObstacleIcon = (type: ObstacleType) => {
    const iconMap: Record<ObstacleType, string> = {
      vendor_blocking: "🏪",
      parked_vehicles: "🚗",
      construction: "🚧",
      electrical_post: "⚡",
      debris: "🗑️",
      no_sidewalk: "⚠️",
      flooding: "💧",
      stairs_no_ramp: "🔺",
      narrow_passage: "↔️",
      broken_infrastructure: "⚠️",
      steep_slope: "⛰️",
      other: "❓",
    };
    return iconMap[type] || "❓";
  };

  const getValidationStatus = () => {
    const totalVotes = obstacle.upvotes + obstacle.downvotes;
    if (totalVotes === 0) return "No community validation yet";
    if (obstacle.upvotes > obstacle.downvotes) return "Community confirmed";
    if (obstacle.downvotes > obstacle.upvotes) return "Community disputed";
    return "Mixed community feedback";
  };

  const renderActionButtons = () => {
    if (obstacle.status === "verified") {
      return (
        <div className="flex flex-col space-y-3">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-xl border-2 border-blue-200 text-sm font-medium text-center">
            <div className="flex items-center justify-center space-x-2">
              <ShieldCheckIcon className="h-5 w-5" />
              <span>Verified</span>
            </div>
          </div>
        </div>
      );
    }

    if (obstacle.status === "false_report") {
      return (
        <div className="flex flex-col space-y-3">
          <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-800 rounded-xl border-2 border-red-200 text-sm font-medium text-center">
            <div className="flex items-center justify-center space-x-2">
              <XMarkIcon className="h-5 w-5" />
              <span>False Report</span>
            </div>
          </div>
        </div>
      );
    }

    // Pending status - show verify/reject buttons
    return (
      <div className="flex flex-col space-y-3">
        <button
          onClick={() => onVerify(obstacle.id)}
          disabled={processing}
          className="group relative px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm font-medium disabled:opacity-50"
        >
          <div className="flex items-center justify-center space-x-2">
            <CheckIcon className="h-5 w-5" />
            <span>Verify Report</span>
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
        </button>

        <button
          onClick={() => onReject(obstacle.id)}
          disabled={processing}
          className="group relative px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm font-medium disabled:opacity-50"
        >
          <div className="flex items-center justify-center space-x-2">
            <XMarkIcon className="h-5 w-5" />
            <span>Reject Report</span>
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        {/* Obstacle Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-4">
            {/* Enhanced icon with gradient */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              {getObstacleIcon(obstacle.type)}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {obstacle.type.replace("_", " ").toUpperCase()}
              </h3>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getStatusBadge(
                    obstacle.status
                  )}`}
                >
                  {obstacle.status.replace("_", " ").toUpperCase()}
                </span>
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getSeverityBadge(
                    obstacle.severity
                  )}`}
                >
                  {obstacle.severity.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 mb-6 text-lg leading-relaxed">
            {obstacle.description}
          </p>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <span>{obstacle.reportedAt.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-blue-600" />
              <span>User #{obstacle.reportedBy.slice(-4)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5 text-blue-600" />
              <span>
                {obstacle.location.latitude.toFixed(4)},{" "}
                {obstacle.location.longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <HandThumbUpIcon className="h-5 w-5 text-green-600" />
              <span>{obstacle.upvotes}</span>
              <HandThumbDownIcon className="h-5 w-5 text-red-600" />
              <span>{obstacle.downvotes}</span>
            </div>
          </div>

          {/* Community Validation Status */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div className="font-bold text-blue-900 flex items-center space-x-2">
                <span>🏘️</span>
                <span>Community Status:</span>
              </div>
              <span className="text-blue-800 text-sm font-medium">
                {getValidationStatus()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-8">
          {renderActionButtons()}

          {/* Details button */}
          <div className="mt-3">
            <button
              onClick={() => onSelect(obstacle)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
            >
              <div className="flex items-center justify-center space-x-2">
                <EyeIcon className="h-4 w-4" />
                <span>View Details</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ObstacleManagement() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  // State management (same logic, no changes)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Filter states
  const [statusFilter, setStatusFilter] = useState<ObstacleStatus | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<ObstacleType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<
    ObstacleSeverity | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Firebase hook (unchanged)
  const {
    obstacles: firebaseObstacles,
    loading: obstaclesLoading,
    error: obstaclesError,
    updateObstacleStatus,
  } = useFirebaseObstacles({ autoLoad: true }, user?.uid || "");

  const [filteredObstacles, setFilteredObstacles] = useState<AdminObstacle[]>(
    []
  );

  // All useEffect hooks remain the same
  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    let filtered = [...firebaseObstacles];

    if (statusFilter !== "all") {
      filtered = filtered.filter((obs) => obs.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((obs) => obs.type === typeFilter);
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter((obs) => obs.severity === severityFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (obs) =>
          obs.description.toLowerCase().includes(query) ||
          obs.type.toLowerCase().includes(query)
      );
    }

    setFilteredObstacles(filtered);
  }, [
    firebaseObstacles,
    statusFilter,
    typeFilter,
    severityFilter,
    searchQuery,
  ]);

  // All handler functions remain unchanged
  const handleVerify = async (obstacleId: string) => {
    if (processingIds.has(obstacleId)) return;

    setProcessingIds((prev) => new Set(prev).add(obstacleId));
    try {
      await updateObstacleStatus(obstacleId, "verified", user?.uid || "");
      console.log(`✅ Obstacle ${obstacleId} verified`);
    } catch (error) {
      console.error("❌ Error verifying obstacle:", error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(obstacleId);
        return newSet;
      });
    }
  };

  const handleReject = async (obstacleId: string) => {
    if (processingIds.has(obstacleId)) return;

    setProcessingIds((prev) => new Set(prev).add(obstacleId));
    try {
      await updateObstacleStatus(obstacleId, "false_report", user?.uid || "");
      console.log(`✅ Obstacle ${obstacleId} marked as false report`);
    } catch (error) {
      console.error("❌ Error rejecting obstacle:", error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(obstacleId);
        return newSet;
      });
    }
  };

  const handleBulkAction = async (action: ObstacleStatus) => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    setProcessingIds((prev) => new Set([...prev, ...ids]));

    try {
      await Promise.all(
        ids.map((id) => updateObstacleStatus(id, action, user?.uid || ""))
      );
      console.log(
        `✅ Bulk action ${action} completed for ${ids.length} obstacles`
      );
      setSelectedIds(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error("❌ Error performing bulk action:", error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        ids.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  // Statistics (removed resolved)
  const stats = {
    total: firebaseObstacles.length,
    pending: firebaseObstacles.filter((o) => o.status === "pending").length,
    verified: firebaseObstacles.filter((o) => o.status === "verified").length,
    falseReports: firebaseObstacles.filter((o) => o.status === "false_report")
      .length,
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <div className="text-2xl font-bold text-gray-900">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  🛡️ Obstacle Management
                </h1>
                <p className="text-lg text-gray-600">
                  Review and manage community reports •{" "}
                  {filteredObstacles.length} of {stats.total} obstacles shown
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>
              {filteredObstacles.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Bulk Actions
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total",
              count: stats.total,
              icon: MapPinIcon,
              color: "blue",
            },
            {
              label: "Pending",
              count: stats.pending,
              icon: ClockIcon,
              color: "yellow",
            },
            {
              label: "Verified",
              count: stats.verified,
              icon: ShieldCheckIcon,
              color: "blue",
            },
            {
              label: "False Reports",
              count: stats.falseReports,
              icon: XMarkIcon,
              color: "red",
            },
          ].map(({ label, count, icon: Icon, color }) => (
            <div
              key={label}
              className={`bg-gradient-to-br from-${color}-50 to-${color}-100 border-2 border-${color}-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className={`h-8 w-8 text-${color}-600`} />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {label}
                      </p>
                      <p className={`text-2xl font-bold text-${color}-900`}>
                        {count}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              🔍 Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  label: "Search",
                  type: "input" as const,
                  value: searchQuery,
                  onChange: (value: string) => setSearchQuery(value),
                  placeholder: "Search obstacles...",
                },
                {
                  label: "Status",
                  type: "select" as const,
                  value: statusFilter,
                  onChange: (value: string) =>
                    setStatusFilter(value as ObstacleStatus | "all"),
                  options: [
                    { value: "all", label: "All Statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "verified", label: "Verified" },
                    { value: "false_report", label: "False Report" },
                  ],
                },
                {
                  label: "Severity",
                  type: "select" as const,
                  value: severityFilter,
                  onChange: (value: string) =>
                    setSeverityFilter(value as ObstacleSeverity | "all"),
                  options: [
                    { value: "all", label: "All Severities" },
                    { value: "blocking", label: "Blocking" },
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ],
                },
                {
                  label: "Type",
                  type: "select" as const,
                  value: typeFilter,
                  onChange: (value: string) =>
                    setTypeFilter(value as ObstacleType | "all"),
                  options: [
                    { value: "all", label: "All Types" },
                    { value: "vendor_blocking", label: "Vendor Blocking" },
                    { value: "parked_vehicles", label: "Parked Vehicles" },
                    { value: "construction", label: "Construction" },
                    { value: "broken_pavement", label: "Broken Pavement" },
                    { value: "flooding", label: "Flooding" },
                    { value: "stairs_no_ramp", label: "Stairs (No Ramp)" },
                    { value: "narrow_passage", label: "Narrow Passage" },
                    { value: "electrical_post", label: "Electrical Post" },
                    { value: "tree_roots", label: "Tree Roots" },
                    { value: "no_sidewalk", label: "No Sidewalk" },
                    { value: "steep_slope", label: "Steep Slope" },
                    { value: "other", label: "Other" },
                  ],
                },
              ].map((filter) => (
                <div key={filter.label}>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  {filter.type === "input" ? (
                    <input
                      type="text"
                      value={filter.value as string}
                      onChange={(e) => filter.onChange(e.target.value)}
                      placeholder={filter.placeholder}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  ) : (
                    <select
                      value={filter.value as string}
                      onChange={(e) => filter.onChange(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Bulk Actions */}
        {showBulkActions && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-purple-900">
                {selectedIds.size} obstacle{selectedIds.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleBulkAction("verified")}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Verify All
                </button>
                <button
                  onClick={() => handleBulkAction("false_report")}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Mark as False
                </button>
                <button
                  onClick={() => {
                    setSelectedIds(new Set());
                    setShowBulkActions(false);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Loading & Error States */}
        {obstaclesLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Loading obstacles from Firebase...
            </p>
            <p className="text-gray-600">
              Please wait while we fetch the latest data
            </p>
          </div>
        )}

        {obstaclesError && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-bold text-red-900">
                  Error Loading Obstacles
                </h3>
                <span className="text-red-800">{obstaclesError}</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Obstacles List */}
        {!obstaclesLoading && !obstaclesError && (
          <div className="space-y-6">
            {filteredObstacles.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-8xl mb-6">🔍</div>
                <p className="text-2xl font-bold text-gray-900 mb-4">
                  No obstacles found
                </p>
                <p className="text-lg text-gray-600">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              filteredObstacles.map((obstacle) => (
                <EnhancedObstacleCard
                  key={obstacle.id}
                  obstacle={obstacle}
                  onVerify={handleVerify}
                  onReject={handleReject}
                  onSelect={(obstacle) =>
                    console.log("Obstacle selected:", obstacle.id)
                  }
                  processing={processingIds.has(obstacle.id)}
                />
              ))
            )}
          </div>
        )}

        {/* Enhanced Firebase Connection Status */}
        <div className="mt-12 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-bold text-gray-900">
                🔥 Connected to Firebase
              </span>
            </div>
            <p className="text-gray-600">
              {firebaseObstacles.length} obstacles loaded • Real-time sync
              active • Data validation and quality control system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
