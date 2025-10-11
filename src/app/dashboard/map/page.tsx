// src/app/dashboard/map/page.tsx
// FIXED: Resolved TypeScript errors and Google Maps loading issues

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeftIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { AdminObstacle } from "@/types/admin";

// Import custom marker system
import {
  generateCustomMarker,
  generateSimpleMarker,
  getZoomLevel,
  createInfoWindowContent,
} from "@/lib/utils/customMarkerGenerator";

// Import centralized helpers
import { getObstacleTypeLabel } from "@/lib/utils/obstacleTypeHelpers";

// Import filter panel
import { FilterPanel, type MapFilters } from "@/components/map/FilterPanel";

type GoogleMap = google.maps.Map & {
  addListener: (
    event: string,
    callback: () => void
  ) => google.maps.MapsEventListener;
  getZoom: () => number;
};

type GoogleInfoWindow = google.maps.InfoWindow;
type GoogleMarker = google.maps.Marker;

export default function InteractiveMapView() {
  const router = useRouter();
  const { user } = useAdminAuth();

  // Map references
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<GoogleMap | null>(null);
  const infoWindowRef = useRef<GoogleInfoWindow | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const scriptLoadedRef = useRef<boolean>(false);

  // Track current zoom level for adaptive markers
  const currentZoomRef = useRef<number>(14);
  const [currentZoom, setCurrentZoom] = useState<number>(14);

  // CRITICAL FIX: Store obstacles in ref so zoom listener always has latest
  const obstaclesRef = useRef<AdminObstacle[]>([]);

  // UI state
  const [mapError, setMapError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MapFilters>({
    status: "all",
    type: "all",
    severity: "all",
  });

  // Load Firebase obstacles
  const { obstacles: firebaseObstacles, loading: obstaclesLoading } =
    useFirebaseObstacles({ autoLoad: true }, user?.uid || "");

  // Filter obstacles
  const [filteredObstacles, setFilteredObstacles] = useState<AdminObstacle[]>(
    []
  );

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

    setFilteredObstacles(filtered);
    // CRITICAL FIX: Also update the ref so zoom listener has latest
    obstaclesRef.current = filtered;
  }, [firebaseObstacles, filters]);

  // ============================================
  // MARKER CREATION
  // ============================================

  /**
   * Create markers with new layered circle design
   * Uses useCallback with proper dependencies
   */
  const createMarkersInternal = useCallback(
    (obstacles: AdminObstacle[], zoom: number) => {
      if (!googleMapRef.current || !window.google?.maps) {
        console.warn("⚠️ Map not ready for marker creation");
        return;
      }

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      console.log(
        `🗺️ Creating ${obstacles.length} custom markers at zoom ${zoom}...`
      );

      // Get current zoom level type (far/medium/close)
      const zoomLevel = getZoomLevel(zoom);

      obstacles.forEach((obstacle) => {
        try {
          // Use custom marker generator
          const markerIcon =
            zoomLevel === "far"
              ? generateSimpleMarker(obstacle)
              : generateCustomMarker(obstacle, zoomLevel);

          const marker = new google.maps.Marker({
            position: {
              lat: obstacle.location.latitude,
              lng: obstacle.location.longitude,
            },
            map: googleMapRef.current!,
            title: getObstacleTypeLabel(obstacle.type),
            icon: markerIcon,
            optimized: false, // Required for custom SVG markers
          });

          // Add click listener for info window
          marker.addListener("click", () => {
            if (infoWindowRef.current && googleMapRef.current) {
              const content = createInfoWindowContent(obstacle);
              infoWindowRef.current.setContent(content);
              infoWindowRef.current.open(googleMapRef.current, marker);
            }
          });

          // Add hover effect
          if (zoomLevel !== "far") {
            marker.addListener("mouseover", () => {
              const hoverIcon = generateCustomMarker(
                obstacle,
                zoomLevel,
                "hover"
              );
              marker.setIcon(hoverIcon);
            });

            marker.addListener("mouseout", () => {
              const defaultIcon = generateCustomMarker(
                obstacle,
                zoomLevel,
                "default"
              );
              marker.setIcon(defaultIcon);
            });
          }

          markersRef.current.push(marker);
        } catch (error) {
          console.error("❌ Error creating marker:", error, obstacle);
        }
      });

      console.log(
        `✅ Created ${markersRef.current.length} markers successfully`
      );
    },
    []
  ); // No dependencies - pure function with parameters

  // ============================================
  // GOOGLE MAPS INITIALIZATION
  // ============================================

  /**
   * Load Google Maps script - FIXED: Check if already loaded
   */
  const loadGoogleMapsScript = useCallback(() => {
    // Check if already loaded
    if (window.google?.maps) {
      console.log("✅ Google Maps already loaded");
      return Promise.resolve();
    }

    // Check if script is already being loaded
    if (scriptLoadedRef.current) {
      console.log("⏳ Google Maps script already loading...");
      return Promise.resolve();
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      console.log("✅ Google Maps script tag found");
      scriptLoadedRef.current = true;
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        reject(new Error("Google Maps API key is missing"));
        return;
      }

      scriptLoadedRef.current = true; // Set before creating script

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log("✅ Google Maps script loaded");
        resolve();
      };

      script.onerror = () => {
        scriptLoadedRef.current = false; // Reset on error
        reject(new Error("Failed to load Google Maps script"));
      };

      document.head.appendChild(script);
    });
  }, []);

  /**
   * Initialize Google Map - FIXED: Proper typing and Pasig City bounds
   */
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) {
      console.warn("⚠️ Map container or Google Maps not ready");
      return;
    }

    if (googleMapRef.current) {
      console.log("ℹ️ Map already initialized");
      return;
    }

    try {
      console.log("🗺️ Initializing Google Map...");

      // Pasig City bounds (restricts map to Pasig only)
      const pasigBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(14.53, 121.04), // Southwest corner
        new google.maps.LatLng(14.62, 121.12) // Northeast corner
      );

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 14.5764, lng: 121.0851 }, // Pasig City Hall
        zoom: 14,
        minZoom: 12, // Prevent zooming out too far
        maxZoom: 20, // Allow detailed street view
        restriction: {
          latLngBounds: pasigBounds,
          strictBounds: true, // Prevent panning outside Pasig
        },
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      }) as GoogleMap;

      googleMapRef.current = map;

      console.log("🔒 Map restricted to Pasig City bounds");

      // Listen to zoom changes for adaptive markers
      map.addListener("zoom_changed", () => {
        const newZoom = map.getZoom();
        if (newZoom !== undefined) {
          const oldZoom = currentZoomRef.current;
          currentZoomRef.current = newZoom;
          setCurrentZoom(newZoom);
          console.log(`🔍 Zoom changed from ${oldZoom} to: ${newZoom}`);

          // CRITICAL FIX: Use obstaclesRef.current instead of filteredObstacles
          // This ensures we always get the LATEST obstacles, not stale closure
          setTimeout(() => {
            console.log(
              `📍 Zoom listener has ${obstaclesRef.current.length} obstacles in ref`
            );
            createMarkersInternal(obstaclesRef.current, newZoom);
          }, 100);
        }
      });

      // Initialize info window
      const infoWindow = new google.maps.InfoWindow() as GoogleInfoWindow;
      infoWindowRef.current = infoWindow;

      console.log("✅ Google Map initialized successfully");
      setMapError(null);

      // Create initial markers
      setTimeout(() => {
        console.log(
          `🎬 Initial markers: ${obstaclesRef.current.length} obstacles available`
        );
        createMarkersInternal(obstaclesRef.current, 14);
      }, 500);
    } catch (error) {
      console.error("❌ Error initializing map:", error);
      setMapError("Failed to initialize map. Please refresh the page.");
    }
  }, [createMarkersInternal]); // FIXED: Removed filteredObstacles dependency

  // ============================================
  // LIFECYCLE EFFECTS
  // ============================================

  /**
   * Load map on component mount
   */
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        initializeMap();
      })
      .catch((error) => {
        console.error("❌ Failed to load Google Maps:", error);
        setMapError(error.message);
      });
  }, [loadGoogleMapsScript, initializeMap]);

  /**
   * Update markers when obstacles change
   */
  useEffect(() => {
    if (
      googleMapRef.current &&
      !obstaclesLoading &&
      filteredObstacles.length > 0
    ) {
      console.log(
        `📊 Obstacles changed, recreating ${filteredObstacles.length} markers...`
      );
      createMarkersInternal(filteredObstacles, currentZoomRef.current);
    }
  }, [filteredObstacles, obstaclesLoading, createMarkersInternal]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Interactive Map View
                </h1>
                <p className="text-sm text-gray-600">
                  Visualizing {filteredObstacles.length} obstacles in Pasig City
                </p>
              </div>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors shadow-md"
              style={{
                background: showFilters
                  ? "linear-gradient(to right, #08345A, #2BA4FF)"
                  : "#FFFFFF",
                color: showFilters ? "#FFFFFF" : "#08345A",
                border: showFilters ? "none" : "2px solid #2BA4FF",
              }}
            >
              <FunnelIcon className="h-5 w-5" />
              <span className="font-semibold">Filters</span>
              {(filters.status !== "all" ||
                filters.type !== "all" ||
                filters.severity !== "all") && (
                <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {
                    [
                      filters.status !== "all",
                      filters.type !== "all",
                      filters.severity !== "all",
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        filters={filters}
        obstacles={firebaseObstacles}
        onFilterChange={setFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Zoom Level Indicator */}
      <div className="fixed top-20 right-4 z-10 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-600">Zoom:</span>
          <span className="text-sm font-bold text-blue-600">
            {currentZoom} - {getZoomLevel(currentZoom).toUpperCase()}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {getZoomLevel(currentZoom) === "far" && "📍 Simple markers"}
          {getZoomLevel(currentZoom) === "medium" && "📍 + Status badge"}
          {getZoomLevel(currentZoom) === "close" && "📍 + Full details"}
        </div>
      </div>

      {/* Loading Overlay */}
      {obstaclesLoading && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-10 bg-white px-6 py-3 rounded-lg shadow-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-700">
              Loading obstacles...
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {mapError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-10 bg-red-50 border border-red-200 px-6 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-red-900 mb-1">Map Error</h3>
              <p className="text-sm text-red-700">{mapError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative" style={{ height: "calc(100vh - 4rem)" }}>
        <div
          ref={mapRef}
          className="absolute inset-0 w-full h-full"
          style={{ minHeight: "500px" }}
        />
      </div>

      {/* Legend - FIXED: Better positioning to avoid sidebar */}
      <div className="fixed bottom-4 left-4 z-10 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs max-h-[calc(100vh-200px)] overflow-y-auto">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center sticky top-0 bg-white">
          <span className="text-lg mr-2">🗺️</span>
          Marker Legend
        </h3>

        <div className="space-y-2 text-sm">
          {/* Validation Status Colors */}
          <div>
            <p className="font-semibold text-gray-700 mb-1">
              Validation Status:
            </p>
            <div className="space-y-1 ml-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#3B82F6] border-2 border-white flex-shrink-0"></div>
                <span className="text-gray-600 text-xs">Official (Admin)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#10B981] border-2 border-white flex-shrink-0"></div>
                <span className="text-gray-600 text-xs">
                  Community Verified
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#F59E0B] border-2 border-white flex-shrink-0"></div>
                <span className="text-gray-600 text-xs">Disputed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#9CA3AF] border-2 border-white flex-shrink-0"></div>
                <span className="text-gray-600 text-xs">Unverified</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#22C55E] border-2 border-white flex-shrink-0"></div>
                <span className="text-gray-600 text-xs">Resolved</span>
              </div>
            </div>
          </div>

          {/* Severity Ring */}
          <div className="pt-2 border-t border-gray-200">
            <p className="font-semibold text-gray-700 mb-1">Severity Ring:</p>
            <div className="space-y-1 ml-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#DC2626] flex-shrink-0"></div>
                <span className="text-gray-600 text-xs">Blocking/Critical</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#F97316] flex-shrink-0"></div>
                <span className="text-gray-600 text-xs">High Severity</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#F59E0B] flex-shrink-0"></div>
                <span className="text-gray-600 text-xs">Medium Severity</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#3B82F6] flex-shrink-0"></div>
                <span className="text-gray-600 text-xs">Low Severity</span>
              </div>
            </div>
          </div>

          {/* Special Indicators */}
          <div className="pt-2 border-t border-gray-200">
            <p className="font-semibold text-gray-700 mb-1">Indicators:</p>
            <div className="space-y-1 ml-2">
              <div className="flex items-center space-x-2">
                <span className="text-base">🛡️</span>
                <span className="text-gray-600 text-xs">Government</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 font-bold text-xs">↑#</span>
                <span className="text-gray-600 text-xs">Upvotes</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-red-600 font-bold text-xs">↓#</span>
                <span className="text-gray-600 text-xs">Downvotes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          💡 Click markers for details
        </div>
      </div>

      {/* Stats Panel - FIXED: Better positioning */}
      <div className="fixed bottom-4 right-4 z-10 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center">
          <span className="text-lg mr-2">📊</span>
          Quick Stats
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-blue-600">
              {filteredObstacles.length}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Official:</span>
            <span className="font-bold text-blue-600">
              {filteredObstacles.filter((o) => o.adminReported).length}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Verified:</span>
            <span className="font-bold text-green-600">
              {filteredObstacles.filter((o) => o.status === "verified").length}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pending:</span>
            <span className="font-bold text-yellow-600">
              {filteredObstacles.filter((o) => o.status === "pending").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
