// app/dashboard/obstacles/page.tsx
// WAISPATH Advanced Obstacle Management System

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import {
  CheckCircleIcon,
  MapPinIcon,
  PhotoIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import {
  AdminObstacle,
  ObstacleType,
  ObstacleStatus,
  ObstacleSeverity,
} from "@/types/admin";

export default function ObstacleManagement() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  // State management
  const [obstacles, setObstacles] = useState<AdminObstacle[]>([]);
  const [filteredObstacles, setFilteredObstacles] = useState<AdminObstacle[]>(
    []
  );
  const [loadingObstacles, setLoadingObstacles] = useState(true);
  const [selectedObstacle, setSelectedObstacle] =
    useState<AdminObstacle | null>(null);
  const [showDetails, setShowDetails] = useState(false);
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Load obstacles on component mount
  useEffect(() => {
    if (user?.isAdmin) {
      loadObstacles();
    }
  }, [user]); // Removed loadObstacles from dependencies to avoid infinite loop

  // Apply filters whenever they change
  const applyFilters = useCallback(() => {
    let filtered = [...obstacles];

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
          obs.type.toLowerCase().includes(query) ||
          obs.barangay?.toLowerCase().includes(query)
      );
    }

    setFilteredObstacles(filtered);
  }, [obstacles, statusFilter, typeFilter, severityFilter, searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadObstacles = async () => {
    try {
      setLoadingObstacles(true);

      // Generate realistic dummy data for demonstration
      const dummyObstacles: AdminObstacle[] = [
        {
          id: "obs_001",
          location: { latitude: 14.5764, longitude: 121.0851 },
          type: "vendor_blocking",
          severity: "medium",
          description:
            "Sari-sari store blocking sidewalk near Pasig City Hall, wheelchair users need to go around",
          reportedBy: "user_12345",
          reportedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
          upvotes: 8,
          downvotes: 1,
          status: "pending",
          verified: false,
          barangay: "Kapitolyo",
          deviceType: "wheelchair",
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
          timePattern: "permanent",
        },
        {
          id: "obs_002",
          location: { latitude: 14.5657, longitude: 121.0644 },
          type: "broken_pavement",
          severity: "high",
          description:
            "Large pothole and broken concrete near The Podium entrance",
          reportedBy: "user_67890",
          reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          upvotes: 15,
          downvotes: 0,
          status: "verified",
          verified: true,
          reviewedBy: user?.uid,
          reviewedAt: new Date(Date.now() - 1000 * 60 * 30),
          barangay: "Ortigas Center",
          deviceType: "walker",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          timePattern: "permanent",
        },
        {
          id: "obs_003",
          location: { latitude: 14.5739, longitude: 121.0892 },
          type: "flooding",
          severity: "blocking",
          description:
            "Heavy flooding after rain, completely impassable for wheelchair users",
          reportedBy: "user_11111",
          reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          upvotes: 23,
          downvotes: 2,
          status: "pending",
          verified: false,
          barangay: "Pinagbuhatan",
          deviceType: "wheelchair",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
          timePattern: "morning",
        },
        {
          id: "obs_004",
          location: { latitude: 14.5858, longitude: 121.0907 },
          type: "stairs_no_ramp",
          severity: "blocking",
          description:
            "New building entrance has stairs only, no ramp for wheelchairs",
          reportedBy: "user_22222",
          reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
          upvotes: 31,
          downvotes: 1,
          status: "resolved",
          verified: true,
          reviewedBy: user?.uid,
          reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          adminNotes: "Contacted building management, ramp installed",
          barangay: "Ugong",
          deviceType: "wheelchair",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
          timePattern: "permanent",
        },
        {
          id: "obs_005",
          location: { latitude: 14.569, longitude: 121.064 },
          type: "parked_vehicles",
          severity: "low",
          description: "Motorcycle parked on sidewalk, reported as false alarm",
          reportedBy: "user_33333",
          reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
          upvotes: 2,
          downvotes: 8,
          status: "false_report",
          verified: false,
          reviewedBy: user?.uid,
          reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
          adminNotes: "Investigated - no permanent obstruction found",
          barangay: "San Antonio",
          deviceType: "none",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
          timePattern: "afternoon",
        },
      ];

      setObstacles(dummyObstacles);
    } catch (error) {
      console.error("Failed to load obstacles:", error);
    } finally {
      setLoadingObstacles(false);
    }
  };

  const handleStatusUpdate = async (
    obstacleId: string,
    newStatus: ObstacleStatus,
    adminNotes?: string
  ) => {
    if (!user?.uid) return;

    setProcessingIds((prev) => new Set(prev).add(obstacleId));

    try {
      // Update local state immediately for better UX
      setObstacles((prev) =>
        prev.map((obs) =>
          obs.id === obstacleId
            ? {
                ...obs,
                status: newStatus,
                reviewedBy: user.uid,
                reviewedAt: new Date(),
                adminNotes,
              }
            : obs
        )
      );

      // In production, this would call the Firebase service
      // await adminFirebaseServices.obstacles.updateStatus(obstacleId, newStatus, user.uid, adminNotes);

      console.log(`Updated obstacle ${obstacleId} to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update obstacle status:", error);
      // Revert local change on error
      loadObstacles();
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

    const idsArray = Array.from(selectedIds);

    try {
      // Update all selected obstacles
      for (const id of idsArray) {
        await handleStatusUpdate(id, action);
      }

      setSelectedIds(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error("Bulk action failed:", error);
    }
  };

  const toggleObstacleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const getStatusBadge = (status: ObstacleStatus) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      verified: "bg-green-100 text-green-800 border-green-200",
      resolved: "bg-blue-100 text-blue-800 border-blue-200",
      false_report: "bg-red-100 text-red-800 border-red-200",
    };

    const labels = {
      pending: "Pending Review",
      verified: "Verified",
      resolved: "Resolved",
      false_report: "False Report",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const getSeverityBadge = (severity: ObstacleSeverity) => {
    const styles = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      blocking: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styles[severity]}`}
      >
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  const getObstacleTypeLabel = (type: ObstacleType) => {
    const labels: Record<ObstacleType, string> = {
      vendor_blocking: "Vendor Blocking",
      parked_vehicles: "Parked Vehicles",
      construction: "Construction",
      electrical_post: "Electrical Post",
      tree_roots: "Tree Roots",
      no_sidewalk: "No Sidewalk",
      flooding: "Flooding",
      stairs_no_ramp: "Stairs (No Ramp)",
      narrow_passage: "Narrow Passage",
      broken_pavement: "Broken Pavement",
      steep_slope: "Steep Slope",
      other: "Other",
    };
    return labels[type] || type;
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
                  Obstacle Management
                </h1>
                <p className="text-sm text-gray-500">
                  Review and manage community reports
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {filteredObstacles.length} of {obstacles.length} obstacles
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search obstacles, descriptions, barangays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              <ChevronDownIcon
                className={`h-4 w-4 ml-2 transform transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <option value="pending">Pending Review</option>
                    <option value="verified">Verified</option>
                    <option value="resolved">Resolved</option>
                    <option value="false_report">False Reports</option>
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
                    <option value="broken_pavement">Broken Pavement</option>
                    <option value="flooding">Flooding</option>
                    <option value="stairs_no_ramp">Stairs (No Ramp)</option>
                    <option value="parked_vehicles">Parked Vehicles</option>
                    <option value="construction">Construction</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

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

        {/* Obstacles List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loadingObstacles ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading obstacles...</p>
            </div>
          ) : filteredObstacles.length === 0 ? (
            <div className="p-8 text-center">
              <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No obstacles found
              </p>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredObstacles.map((obstacle) => (
                <div key={obstacle.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(obstacle.id)}
                      onChange={() => toggleObstacleSelection(obstacle.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {getObstacleTypeLabel(obstacle.type)}
                            </h3>
                            {getStatusBadge(obstacle.status)}
                            {getSeverityBadge(obstacle.severity)}
                          </div>

                          <p className="text-gray-700 mb-3">
                            {obstacle.description}
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {obstacle.barangay}
                            </div>
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1" />
                              {obstacle.deviceType}
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {obstacle.reportedAt.toLocaleDateString()}
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <HandThumbUpIcon className="h-4 w-4 mr-1 text-green-500" />
                                {obstacle.upvotes}
                              </div>
                              <div className="flex items-center">
                                <HandThumbDownIcon className="h-4 w-4 mr-1 text-red-500" />
                                {obstacle.downvotes}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedObstacle(obstacle);
                              setShowDetails(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>

                          {obstacle.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(obstacle.id, "verified")
                                }
                                disabled={processingIds.has(obstacle.id)}
                                className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Verify
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    obstacle.id,
                                    "false_report"
                                  )
                                }
                                disabled={processingIds.has(obstacle.id)}
                                className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                              >
                                <XMarkIcon className="h-4 w-4 mr-1" />
                                Reject
                              </button>
                            </>
                          )}

                          {obstacle.status === "verified" && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  obstacle.id,
                                  "resolved",
                                  "Marked as resolved by admin"
                                )
                              }
                              disabled={processingIds.has(obstacle.id)}
                              className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Resolved
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Admin Notes */}
                      {obstacle.adminNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Admin Notes:</span>{" "}
                            {obstacle.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Obstacle Details Modal */}
      {showDetails && selectedObstacle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Obstacle Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {getObstacleTypeLabel(selectedObstacle.type)}
                  </h3>
                  <div className="flex space-x-2">
                    {getStatusBadge(selectedObstacle.status)}
                    {getSeverityBadge(selectedObstacle.severity)}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Description
                  </h4>
                  <p className="text-gray-700">
                    {selectedObstacle.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Location</h4>
                    <p className="text-gray-700">{selectedObstacle.barangay}</p>
                    <p className="text-sm text-gray-500">
                      {selectedObstacle.location.latitude.toFixed(6)},{" "}
                      {selectedObstacle.location.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Reporter</h4>
                    <p className="text-gray-700">
                      {selectedObstacle.deviceType} user
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedObstacle.reportedAt.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Community Feedback
                    </h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-green-600">
                        <HandThumbUpIcon className="h-4 w-4 mr-1" />
                        {selectedObstacle.upvotes} upvotes
                      </div>
                      <div className="flex items-center text-red-600">
                        <HandThumbDownIcon className="h-4 w-4 mr-1" />
                        {selectedObstacle.downvotes} downvotes
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Time Pattern
                    </h4>
                    <p className="text-gray-700 capitalize">
                      {selectedObstacle.timePattern}
                    </p>
                  </div>
                </div>

                {selectedObstacle.reviewedBy && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Review Information
                    </h4>
                    <p className="text-sm text-gray-600">
                      Reviewed by admin on{" "}
                      {selectedObstacle.reviewedAt?.toLocaleString()}
                    </p>
                    {selectedObstacle.adminNotes && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {selectedObstacle.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo placeholder */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Photo Evidence
                  </h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {selectedObstacle.photoBase64
                        ? "Photo available"
                        : "No photo provided"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedObstacle.status === "pending" && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedObstacle.id, "verified");
                        setShowDetails(false);
                      }}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Verify Obstacle
                    </button>
                    <button
                      onClick={() => {
                        handleStatusUpdate(
                          selectedObstacle.id,
                          "false_report",
                          "Marked as false report after review"
                        );
                        setShowDetails(false);
                      }}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Mark as False
                    </button>
                  </div>
                )}

                {selectedObstacle.status === "verified" && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleStatusUpdate(
                          selectedObstacle.id,
                          "resolved",
                          "Issue has been resolved"
                        );
                        setShowDetails(false);
                      }}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
