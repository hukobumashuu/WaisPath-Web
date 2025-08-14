// src/app/dashboard/map/page.tsx
// SIMPLIFIED: No real-time listeners, just static data loading! 🔥

"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";
import {
  ArrowLeftIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import {
  AdminObstacle,
  ObstacleType,
  ObstacleStatus,
  ObstacleSeverity,
} from "@/types/admin";

interface MapFilters {
  status: ObstacleStatus | "all";
  type: ObstacleType | "all";
  severity: ObstacleSeverity | "all";
}

export default function AdminMapPage() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filters
  const [filters, setFilters] = useState<MapFilters>({
    status: "all",
    type: "all",
    severity: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 🔥 FIXED: Simplified Firebase data loading
  const {
    obstacles: firebaseObstacles,
    loading: obstaclesLoading,
    error: obstaclesError,
    updateObstacleStatus,
    loadObstacles,
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

  // Filter obstacles
  useEffect(() => {
    let filtered = [...firebaseObstacles];

    if (filters.status !== "all") {
      filtered = filtered.filter((obs) => obs.status === filters.status);
    }
    if (filters.type !== "all") {
      filtered = filtered.filter((obs) => obs.type === filters.type);
    }
    if (filters.severity !== "all") {
      filtered = filtered.filter((obs) => obs.severity === filters.severity);
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
  }, [firebaseObstacles, filters, searchQuery]);

  const getMarkerColor = (obstacle: AdminObstacle) => {
    if (obstacle.status === "resolved") return "#22C55E";
    if (obstacle.status === "false_report") return "#6B7280";

    switch (obstacle.severity) {
      case "blocking":
        return "#EF4444";
      case "high":
        return "#F97316";
      case "medium":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getMarkerIcon = (type: ObstacleType) => {
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

  const getStatusLabel = (status: ObstacleStatus) => {
    const labels: Record<ObstacleStatus, string> = {
      pending: "PENDING",
      verified: "VERIFIED",
      resolved: "RESOLVED",
      false_report: "FALSE",
    };
    return labels[status];
  };

  const handleObstacleAction = async (
    id: string,
    newStatus: ObstacleStatus
  ) => {
    try {
      await updateObstacleStatus(id, newStatus, user?.uid || "");
      console.log(`✅ Obstacle ${id} updated to ${newStatus}`);
      // Reload obstacles to see changes
      await loadObstacles();
    } catch (error) {
      console.error("❌ Error updating obstacle:", error);
      alert("Failed to update obstacle. Please try again.");
    }
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
                  🗺️ Interactive Map
                </h1>
                <p className="text-sm text-gray-500">
                  Visualize obstacles across Pasig City •{" "}
                  {filteredObstacles.length} obstacles shown
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  📍 Simplified view - Click obstacles below to manage them
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
              <button
                onClick={loadObstacles}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-7xl mx-auto">
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value as ObstacleStatus | "all",
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
                  value={filters.severity}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      severity: e.target.value as ObstacleSeverity | "all",
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      type: e.target.value as ObstacleType | "all",
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="vendor_blocking">Vendor Blocking</option>
                  <option value="parked_vehicles">Parked Vehicles</option>
                  <option value="construction">Construction</option>
                  <option value="broken_pavement">Broken Pavement</option>
                  <option value="flooding">Flooding</option>
                  <option value="stairs_no_ramp">Stairs (No Ramp)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {obstaclesLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading obstacles from Firebase...</p>
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

        {/* Map Placeholder with Obstacle Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              📍 Obstacle Locations
            </h2>
            <div className="text-sm text-gray-500">
              Total: {firebaseObstacles.length} • Filtered:{" "}
              {filteredObstacles.length}
            </div>
          </div>

          {/* Map simulation with cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredObstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: getMarkerColor(obstacle) }}
                    >
                      {getMarkerIcon(obstacle.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {obstacle.type.replace("_", " ").toUpperCase()}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {getStatusLabel(obstacle.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {obstacle.description}
                </p>

                <div className="text-xs text-gray-500 mb-3">
                  📍 {obstacle.location.latitude.toFixed(4)},{" "}
                  {obstacle.location.longitude.toFixed(4)}
                  <br />
                  📅 {obstacle.reportedAt.toLocaleDateString()}
                  <br />
                  👍 {obstacle.upvotes} 👎 {obstacle.downvotes}
                </div>

                {obstacle.status === "pending" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleObstacleAction(obstacle.id, "verified")
                      }
                      className="flex-1 bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-700"
                    >
                      ✅ Verify
                    </button>
                    <button
                      onClick={() =>
                        handleObstacleAction(obstacle.id, "false_report")
                      }
                      className="flex-1 bg-red-600 text-white py-1 px-2 rounded text-xs hover:bg-red-700"
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {obstacle.status === "verified" && (
                  <button
                    onClick={() =>
                      handleObstacleAction(obstacle.id, "resolved")
                    }
                    className="w-full bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700"
                  >
                    🔧 Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </div>

          {filteredObstacles.length === 0 && !obstaclesLoading && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🗺️</div>
              <p>No obstacles found for the selected criteria.</p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Map Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {firebaseObstacles.length}
              </div>
              <div className="text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {firebaseObstacles.filter((o) => o.status === "pending").length}
              </div>
              <div className="text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {
                  firebaseObstacles.filter((o) => o.status === "verified")
                    .length
                }
              </div>
              <div className="text-gray-500">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {
                  firebaseObstacles.filter((o) => o.status === "resolved")
                    .length
                }
              </div>
              <div className="text-gray-500">Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {
                  firebaseObstacles.filter((o) => o.status === "false_report")
                    .length
                }
              </div>
              <div className="text-gray-500">False Reports</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
