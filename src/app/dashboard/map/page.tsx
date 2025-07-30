// app/dashboard/map/page.tsx
// WAISPATH Interactive Admin Map with Google Maps Integration

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import {
  ArrowLeftIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import {
  AdminObstacle,
  ObstacleType,
  ObstacleStatus,
  ObstacleSeverity,
} from "@/types/admin";

// Google Maps types
interface GoogleMap {
  setCenter: (latLng: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  [key: string]: unknown;
}

interface GoogleMarker {
  setMap: (map: GoogleMap | null) => void;
  addListener: (event: string, callback: () => void) => void;
  [key: string]: unknown;
}

interface GoogleInfoWindow {
  setContent: (content: string) => void;
  open: (map: GoogleMap, marker: GoogleMarker) => void;
  close: () => void;
  [key: string]: unknown;
}

interface GoogleHeatmapLayer {
  setMap: (map: GoogleMap | null) => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    google: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: Record<string, unknown>
        ) => GoogleMap;
        Marker: new (options: Record<string, unknown>) => GoogleMarker;
        InfoWindow: new () => GoogleInfoWindow;
        LatLng: new (lat: number, lng: number) => unknown;
        SymbolPath: { CIRCLE: unknown };
        marker?: {
          AdvancedMarkerElement?: new (
            options: Record<string, unknown>
          ) => GoogleMarker;
        };
        visualization: {
          HeatmapLayer: new (
            options: Record<string, unknown>
          ) => GoogleHeatmapLayer;
        };
      };
    };
    initMap: () => void;
    handleObstacleAction: (
      obstacleId: string,
      newStatus: ObstacleStatus
    ) => Promise<void>;
  }
}

interface MapFilters {
  status: ObstacleStatus | "all";
  type: ObstacleType | "all";
  severity: ObstacleSeverity | "all";
  showHeatmap: boolean;
}

export default function InteractiveMapView() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  // Map state
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const infoWindowRef = useRef<GoogleInfoWindow | null>(null);
  const heatmapRef = useRef<GoogleHeatmapLayer | null>(null);

  // Data state
  const [obstacles, setObstacles] = useState<AdminObstacle[]>([]);
  const [filteredObstacles, setFilteredObstacles] = useState<AdminObstacle[]>(
    []
  );
  const [loadingObstacles, setLoadingObstacles] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<MapFilters>({
    status: "all",
    type: "all",
    severity: "all",
    showHeatmap: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper functions (defined first to avoid hoisting issues)
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

  const getStatusColor = (status: ObstacleStatus) => {
    const colors = {
      pending: "#f59e0b",
      verified: "#10b981",
      resolved: "#3b82f6",
      false_report: "#ef4444",
    };
    return colors[status];
  };

  const getSeverityColor = (severity: ObstacleSeverity) => {
    const colors = {
      low: "#6b7280",
      medium: "#f59e0b",
      high: "#f97316",
      blocking: "#dc2626",
    };
    return colors[severity];
  };

  const getSeverityScale = (severity: ObstacleSeverity) => {
    const scales = {
      low: 8,
      medium: 12,
      high: 16,
      blocking: 20,
    };
    return scales[severity];
  };

  const getSeverityWeight = (severity: ObstacleSeverity) => {
    const weights = {
      low: 1,
      medium: 2,
      high: 3,
      blocking: 5,
    };
    return weights[severity];
  };

  // Main functions
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 14.5764, lng: 121.0851 },
      zoom: 14,
      mapTypeId: "roadmap",
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
    console.log("✅ Google Maps initialized successfully");
  }, []);

  const loadGoogleMapsScript = useCallback(() => {
    if (window.google) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=visualization&callback=initMap&loading=async`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      if (mapRef.current) {
        initializeMap();
      }
    };

    document.head.appendChild(script);
  }, [initializeMap]);

  const loadObstacles = useCallback(async () => {
    try {
      setLoadingObstacles(true);

      const dummyObstacles: AdminObstacle[] = [
        {
          id: "obs_001",
          location: { latitude: 14.5764, longitude: 121.0851 },
          type: "vendor_blocking",
          severity: "medium",
          description:
            "Sari-sari store blocking sidewalk near City Hall entrance",
          reportedBy: "user_12345",
          reportedAt: new Date(Date.now() - 1000 * 60 * 30),
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
          description: "Large pothole near The Podium mall entrance",
          reportedBy: "user_67890",
          reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
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
            "Heavy flooding after rain, completely blocks wheelchair access",
          reportedBy: "user_11111",
          reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
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
          description: "Hospital entrance has stairs only, no wheelchair ramp",
          reportedBy: "user_22222",
          reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
          upvotes: 31,
          downvotes: 1,
          status: "resolved",
          verified: true,
          reviewedBy: user?.uid,
          reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          adminNotes: "Contacted hospital management, ramp installed",
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
          description: "Motorcycles occasionally parked on sidewalk",
          reportedBy: "user_33333",
          reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
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
  }, [user?.uid]);

  const applyFilters = useCallback(() => {
    let filtered = [...obstacles];

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
          obs.type.toLowerCase().includes(query) ||
          obs.barangay?.toLowerCase().includes(query)
      );
    }

    setFilteredObstacles(filtered);
  }, [obstacles, filters.status, filters.type, filters.severity, searchQuery]);

  const showInfoWindow = useCallback(
    (marker: GoogleMarker, obstacle: AdminObstacle) => {
      const content = `
      <div style="max-width: 300px; padding: 12px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
          ${getObstacleTypeLabel(obstacle.type)}
        </h3>
        <div style="margin-bottom: 8px;">
          <span style="background: ${getStatusColor(
            obstacle.status
          )}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
            ${obstacle.status.replace("_", " ").toUpperCase()}
          </span>
          <span style="background: ${getSeverityColor(
            obstacle.severity
          )}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px;">
            ${obstacle.severity.toUpperCase()}
          </span>
        </div>
        <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
          ${obstacle.description}
        </p>
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
          <div>📍 ${obstacle.barangay}</div>
          <div>🕒 ${obstacle.reportedAt.toLocaleDateString()}</div>
          <div>👤 ${obstacle.deviceType} user</div>
          <div>👍 ${obstacle.upvotes} 👎 ${obstacle.downvotes}</div>
        </div>
        <div style="display: flex; gap: 8px;">
          ${
            obstacle.status === "pending"
              ? `
            <button onclick="handleObstacleAction('${obstacle.id}', 'verified')" 
                    style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
              ✓ Verify
            </button>
            <button onclick="handleObstacleAction('${obstacle.id}', 'false_report')" 
                    style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
              ✕ Reject
            </button>
          `
              : obstacle.status === "verified"
              ? `
            <button onclick="handleObstacleAction('${obstacle.id}', 'resolved')" 
                    style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
              ✓ Resolved
            </button>
          `
              : ""
          }
        </div>
      </div>
    `;

      if (infoWindowRef.current && googleMapRef.current) {
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(googleMapRef.current, marker);
      }
    },
    []
  );

  const createMarkers = useCallback(() => {
    if (!googleMapRef.current || !window.google) return;

    filteredObstacles.forEach((obstacle) => {
      const MarkerClass =
        window.google.maps.marker?.AdvancedMarkerElement ||
        window.google.maps.Marker;

      const markerOptions = window.google.maps.marker?.AdvancedMarkerElement
        ? {
            position: {
              lat: obstacle.location.latitude,
              lng: obstacle.location.longitude,
            },
            map: googleMapRef.current,
            title: `${getObstacleTypeLabel(obstacle.type)} - ${
              obstacle.severity
            }`,
          }
        : {
            position: {
              lat: obstacle.location.latitude,
              lng: obstacle.location.longitude,
            },
            map: googleMapRef.current,
            title: `${getObstacleTypeLabel(obstacle.type)} - ${
              obstacle.severity
            }`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: getSeverityScale(obstacle.severity),
              fillColor: getStatusColor(obstacle.status),
              fillOpacity: 0.8,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          };

      const marker = new MarkerClass(markerOptions);
      marker.addListener("click", () => {
        showInfoWindow(marker, obstacle);
      });

      markersRef.current.push(marker);
    });
  }, [filteredObstacles, showInfoWindow]);

  const createHeatmap = useCallback(() => {
    if (!googleMapRef.current || !window.google) return;

    const heatmapData = filteredObstacles.map((obstacle) => ({
      location: new window.google.maps.LatLng(
        obstacle.location.latitude,
        obstacle.location.longitude
      ),
      weight: getSeverityWeight(obstacle.severity),
    }));

    heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: googleMapRef.current,
      radius: 50,
      opacity: 0.6,
    });
  }, [filteredObstacles]);

  const updateMapMarkers = useCallback(() => {
    if (!googleMapRef.current || !window.google) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (filters.showHeatmap) {
      createHeatmap();
    } else {
      createMarkers();
    }
  }, [filters.showHeatmap, createHeatmap, createMarkers]);

  const handleStatusUpdate = useCallback(
    async (
      obstacleId: string,
      newStatus: ObstacleStatus,
      adminNotes?: string
    ) => {
      if (!user?.uid) return;

      try {
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

        console.log(`Updated obstacle ${obstacleId} to ${newStatus}`);
      } catch (error) {
        console.error("Failed to update obstacle status:", error);
      }
    },
    [user?.uid]
  );

  // Effects
  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.isAdmin && !window.google) {
      loadGoogleMapsScript();
    } else if (window.google && mapRef.current && !googleMapRef.current) {
      initializeMap();
    }
  }, [user, loadGoogleMapsScript, initializeMap]);

  useEffect(() => {
    if (user?.isAdmin) {
      loadObstacles();
    }
  }, [user, loadObstacles]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    updateMapMarkers();
  }, [updateMapMarkers]);

  useEffect(() => {
    window.handleObstacleAction = async (
      obstacleId: string,
      newStatus: ObstacleStatus
    ) => {
      await handleStatusUpdate(obstacleId, newStatus);
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [handleStatusUpdate]);

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
                  Interactive Map
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time obstacle visualization and management
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

      {/* Controls Panel */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="relative flex-1 max-w-lg">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search obstacles, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    showHeatmap: !prev.showHeatmap,
                  }))
                }
                className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium ${
                  filters.showHeatmap
                    ? "border-red-300 text-red-700 bg-red-50"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                {filters.showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
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
                    value={filters.severity}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        severity: e.target.value as ObstacleSeverity | "all",
                      }))
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
                    value={filters.type}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        type: e.target.value as ObstacleType | "all",
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="vendor_blocking">Vendor Blocking</option>
                    <option value="broken_pavement">Broken Pavement</option>
                    <option value="flooding">Flooding</option>
                    <option value="stairs_no_ramp">Stairs (No Ramp)</option>
                    <option value="construction">Construction</option>
                    <option value="parked_vehicles">Parked Vehicles</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div
          ref={mapRef}
          className="w-full h-[calc(100vh-200px)]"
          style={{ minHeight: "600px" }}
        />

        {loadingObstacles && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading obstacles...</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
              <span>Pending Review</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span>Verified</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span>Resolved</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span>False Report</span>
            </div>
            <hr className="my-2" />
            <div className="text-xs text-gray-500">
              <div>Size indicates severity</div>
              <div>Click markers to review</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
