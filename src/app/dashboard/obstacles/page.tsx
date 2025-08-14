// src/app/dashboard/obstacles/page.tsx
// FIXED: All TypeScript errors defeated! 🔥💪

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

// 🔥 Enhanced Obstacle Card Component (inspired by mobile app)
interface ObstacleCardProps {
  obstacle: AdminObstacle;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  onResolve: (id: string) => void;
  onSelect: (obstacle: AdminObstacle) => void;
  processing: boolean;
}

function EnhancedObstacleCard({
  obstacle,
  onVerify,
  onReject,
  onResolve,
  onSelect,
  processing,
}: ObstacleCardProps) {
  const getStatusBadge = (status: ObstacleStatus) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      verified: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      false_report: "bg-red-100 text-red-800",
    };
    return badges[status];
  };

  const getSeverityBadge = (severity: ObstacleSeverity) => {
    const badges = {
      blocking: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-gray-100 text-gray-800",
    };
    return badges[severity];
  };

  const getObstacleIcon = (type: ObstacleType) => {
    const iconMap: Record<ObstacleType, string> = {
      vendor_blocking: "🏪",
      parked_vehicles: "🚗",
      construction: "🚧",
      electrical_post: "⚡",
      tree_roots: "🌳",
      no_sidewalk: "⚠️",
      flooding: "💧",
      stairs_no_ramp: "🔺",
      narrow_passage: "↔️",
      broken_pavement: "🕳️",
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        {/* Obstacle Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            {/* Mobile App Style Icon */}
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
              {getObstacleIcon(obstacle.type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {obstacle.type.replace("_", " ").toUpperCase()}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                    obstacle.status
                  )}`}
                >
                  {obstacle.status.replace("_", " ").toUpperCase()}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(
                    obstacle.severity
                  )}`}
                >
                  {obstacle.severity.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 mb-4 leading-relaxed">
            {obstacle.description}
          </p>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {obstacle.reportedAt.toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              User #{obstacle.reportedBy.slice(-4)}
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {obstacle.location.latitude.toFixed(4)},{" "}
              {obstacle.location.longitude.toFixed(4)}
            </div>
            <div className="flex items-center">
              <HandThumbUpIcon className="h-4 w-4 mr-1 text-green-600" />
              {obstacle.upvotes}
              <HandThumbDownIcon className="h-4 w-4 ml-2 mr-1 text-red-600" />
              {obstacle.downvotes}
            </div>
          </div>

          {/* Community Validation Status */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                🏘️ Community Status:
              </span>
              <span className="text-sm text-gray-600">
                {getValidationStatus()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-6 flex flex-col space-y-2">
          {obstacle.status === "pending" && (
            <>
              <button
                onClick={() => onVerify(obstacle.id)}
                disabled={processing}
                className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Verify
              </button>
              <button
                onClick={() => onReject(obstacle.id)}
                disabled={processing}
                className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Reject
              </button>
            </>
          )}

          {obstacle.status === "verified" && (
            <button
              onClick={() => onResolve(obstacle.id)}
              disabled={processing}
              className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Mark Resolved
            </button>
          )}

          <button
            onClick={() => onSelect(obstacle)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ObstacleManagement() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  // State management (removed unused states)
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

  // 🔥 FIXED: Proper hook usage with adminUserId
  const {
    obstacles: firebaseObstacles,
    loading: obstaclesLoading,
    error: obstaclesError,
    updateObstacleStatus,
  } = useFirebaseObstacles({ autoLoad: true }, user?.uid || "");

  const [filteredObstacles, setFilteredObstacles] = useState<AdminObstacle[]>(
    []
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...firebaseObstacles];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((obs) => obs.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((obs) => obs.type === typeFilter);
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((obs) => obs.severity === severityFilter);
    }

    // Search query
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

  // Handle admin actions - 🔥 FIXED: Added adminUserId parameter
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

  const handleResolve = async (obstacleId: string) => {
    if (processingIds.has(obstacleId)) return;

    setProcessingIds((prev) => new Set(prev).add(obstacleId));
    try {
      await updateObstacleStatus(obstacleId, "resolved", user?.uid || "");
      console.log(`✅ Obstacle ${obstacleId} resolved`);
    } catch (error) {
      console.error("❌ Error resolving obstacle:", error);
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

  // Statistics
  const stats = {
    total: firebaseObstacles.length,
    pending: firebaseObstacles.filter((o) => o.status === "pending").length,
    verified: firebaseObstacles.filter((o) => o.status === "verified").length,
    resolved: firebaseObstacles.filter((o) => o.status === "resolved").length,
    falseReports: firebaseObstacles.filter((o) => o.status === "false_report")
      .length,
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🛡️ Obstacle Management
                </h1>
                <p className="text-sm text-gray-500">
                  Review and manage community reports •{" "}
                  {filteredObstacles.length} of {stats.total} obstacles shown
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
              {filteredObstacles.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Bulk Actions
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-yellow-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Verified</p>
                <p className="text-2xl font-semibold text-blue-900">
                  {stats.verified}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-semibold text-green-900">
                  {stats.resolved}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  False Reports
                </p>
                <p className="text-2xl font-semibold text-red-900">
                  {stats.falseReports}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search obstacles..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ObstacleStatus | "all")
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="resolved">Resolved</option>
                  <option value="false_report">False Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) =>
                    setSeverityFilter(
                      e.target.value as ObstacleSeverity | "all"
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="blocking">Blocking</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as ObstacleType | "all")
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="vendor_blocking">Vendor Blocking</option>
                  <option value="parked_vehicles">Parked Vehicles</option>
                  <option value="construction">Construction</option>
                  <option value="broken_pavement">Broken Pavement</option>
                  <option value="flooding">Flooding</option>
                  <option value="stairs_no_ramp">Stairs (No Ramp)</option>
                  <option value="narrow_passage">Narrow Passage</option>
                  <option value="electrical_post">Electrical Post</option>
                  <option value="tree_roots">Tree Roots</option>
                  <option value="no_sidewalk">No Sidewalk</option>
                  <option value="steep_slope">Steep Slope</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} obstacle{selectedIds.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction("verified")}
                  className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded text-green-700 bg-green-50 hover:bg-green-100"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Verify All
                </button>
                <button
                  onClick={() => handleBulkAction("false_report")}
                  className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Mark as False
                </button>
                <button
                  onClick={() => {
                    setSelectedIds(new Set());
                    setShowBulkActions(false);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading & Error States */}
        {obstaclesLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading obstacles from Firebase...</p>
          </div>
        )}

        {obstaclesError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">
                Error loading obstacles: {obstaclesError}
              </span>
            </div>
          </div>
        )}

        {/* Obstacles List */}
        {!obstaclesLoading && !obstaclesError && (
          <div className="space-y-4">
            {filteredObstacles.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  No obstacles found
                </p>
                <p className="text-gray-500">
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
                  onResolve={handleResolve}
                  onSelect={(obstacle) =>
                    console.log("Obstacle selected:", obstacle.id)
                  }
                  processing={processingIds.has(obstacle.id)}
                />
              ))
            )}
          </div>
        )}

        {/* Firebase Connection Status */}
        <div className="mt-8 text-center text-sm text-gray-500">
          🔥 Connected to Firebase • {firebaseObstacles.length} obstacles loaded
          • Real-time sync active
        </div>
      </div>
    </div>
  );
}
