// src/app/dashboard/map/page.tsx
// FIXED: Removed problematic useCallback dependency issue

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeftIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import {
  AdminObstacle,
  ObstacleType,
  ObstacleStatus,
  ObstacleSeverity,
} from "@/types/admin";

// Google Maps types (keep existing)
interface GoogleMap {
  setCenter: (latLng: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  [key: string]: unknown;
}

interface GoogleInfoWindow {
  setContent: (content: string) => void;
  open: (map: GoogleMap, marker: GoogleMarker) => void;
  close: () => void;
  [key: string]: unknown;
}

interface GoogleMarker {
  setMap: (map: GoogleMap | null) => void;
  addListener: (event: string, callback: () => void) => void;
  [key: string]: unknown;
}

interface MapFilters {
  status: ObstacleStatus | "all";
  type: ObstacleType | "all";
  severity: ObstacleSeverity | "all";
  showHeatmap: boolean;
}

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: Record<string, unknown>
        ) => GoogleMap;
        InfoWindow: new () => GoogleInfoWindow;
        Marker: new (options: Record<string, unknown>) => GoogleMarker;
        SymbolPath: {
          CIRCLE: number;
        };
      };
    };
    initMap?: () => void;
  }
}

export default function InteractiveMapView() {
  const router = useRouter();
  const { user } = useAdminAuth();

  // Map state
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<GoogleMap | null>(null);
  const infoWindowRef = useRef<GoogleInfoWindow | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const scriptLoadedRef = useRef<boolean>(false);

  // UI state
  const [mapError, setMapError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters] = useState<MapFilters>({
    status: "all",
    type: "all",
    severity: "all",
    showHeatmap: false,
  });

  // 🔥 Load Firebase obstacles
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
  }, [firebaseObstacles, filters]);

  // Helper functions for markers
  const getMarkerColor = (obstacle: AdminObstacle) => {
    if (obstacle.status === "resolved") return "#22C55E"; // green
    if (obstacle.status === "false_report") return "#6B7280"; // gray

    switch (obstacle.severity) {
      case "blocking":
        return "#EF4444"; // red
      case "high":
        return "#F97316"; // orange
      case "medium":
        return "#F59E0B"; // yellow
      case "low":
        return "#3B82F6"; // blue
      default:
        return "#6B7280"; // gray
    }
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

  // 🔧 FIX: Create markers function - removed from useCallback to avoid dependency issues
  const createMarkers = useCallback(() => {
    if (!googleMapRef.current || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    console.log(`🗺️ Creating ${filteredObstacles.length} markers...`);

    filteredObstacles.forEach((obstacle) => {
      try {
        const marker = new window.google!.maps.Marker({
          position: {
            lat: obstacle.location.latitude,
            lng: obstacle.location.longitude,
          },
          map: googleMapRef.current!,
          title: `${getObstacleTypeLabel(obstacle.type)} - ${
            obstacle.severity
          }`,
          icon: {
            path: window.google!.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: getMarkerColor(obstacle),
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        // Add click listener for info window
        marker.addListener("click", () => {
          if (infoWindowRef.current && googleMapRef.current) {
            const content = `
            <div style="max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                ${getObstacleTypeLabel(obstacle.type)}
              </h3>
              <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">
                ${obstacle.description}
              </p>
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <span style="background: ${getMarkerColor(
                  obstacle
                )}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                  ${obstacle.severity.toUpperCase()}
                </span>
                <span style="background: #e5e7eb; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                  ${obstacle.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div style="color: #6b7280; font-size: 12px;">
                📅 ${obstacle.reportedAt.toLocaleDateString()}<br>
                👍 ${obstacle.upvotes} 👎 ${obstacle.downvotes}<br>
                📍 ${obstacle.location.latitude.toFixed(
                  4
                )}, ${obstacle.location.longitude.toFixed(4)}
              </div>
            </div>
          `;
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(googleMapRef.current, marker);
          }
        });

        markersRef.current.push(marker);
      } catch (error) {
        console.error(
          "❌ Error creating marker for obstacle:",
          obstacle.id,
          error
        );
      }
    });

    console.log(`✅ Created ${markersRef.current.length} markers`);
  }, [filteredObstacles]); // Now properly includes the dependency

  // 🔧 FIX: Update markers when obstacles change - use regular useEffect
  useEffect(() => {
    if (googleMapRef.current && filteredObstacles.length > 0) {
      createMarkers();
    }
  }, [filteredObstacles, createMarkers]); // Only depend on filteredObstacles

  const initializeMap = useCallback(() => {
    console.log("🗺️ Initializing Google Maps...");

    if (!mapRef.current) {
      console.error("❌ Map container ref not available");
      return;
    }

    if (!window.google) {
      console.error("❌ Google Maps API not loaded");
      return;
    }

    try {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 14.5764, lng: 121.0851 }, // Pasig City
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
      setMapError(null);

      // Create markers after map is initialized
      if (filteredObstacles.length > 0) {
        createMarkers();
      }
    } catch (error) {
      console.error("❌ Error initializing Google Maps:", error);
      setMapError("Failed to initialize map. Please refresh the page.");
    }
  }, [filteredObstacles.length, createMarkers]); // Empty dependency array since we don't use external values in this function

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      const error = "Google Maps API key not found in environment variables";
      console.error("❌", error);
      setMapError(error);
      return;
    }

    // If google already available, initialize immediately
    if (window.google && window.google.maps) {
      console.log("🔁 Google Maps already loaded, initializing...");
      initializeMap();
      return;
    }

    // If a script already exists, attach load/error listeners to it
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com"]'
    );

    if (existingScript) {
      console.log("🔄 Google Maps script already exists — attaching listeners");
      // Avoid attaching duplicate listeners
      if (!existingScript.getAttribute("data-gmaps-listener")) {
        existingScript.addEventListener("load", initializeMap);
        existingScript.addEventListener("error", () => {
          console.error("❌ Failed to load Google Maps (existing script)");
          setMapError(
            "Failed to load Google Maps. Please check your internet connection and API key."
          );
          scriptLoadedRef.current = false;
        });
        existingScript.setAttribute("data-gmaps-listener", "1");
      }
      return;
    }

    // Create and append script (no callback param)
    console.log("📡 Loading Google Maps API script (onload)");
    scriptLoadedRef.current = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
    script.async = true;
    script.defer = true;

    script.addEventListener("load", () => {
      console.log("✅ Google Maps script loaded (onload)");
      initializeMap();
    });

    script.addEventListener("error", () => {
      console.error("❌ Failed to load Google Maps script (new script)");
      setMapError(
        "Failed to load Google Maps. Please check your internet connection and API key."
      );
      scriptLoadedRef.current = false;
    });

    document.head.appendChild(script);
  }, [initializeMap]);

  // Load script on mount
  useEffect(() => {
    loadGoogleMapsScript();

    return () => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src*="maps.googleapis.com"]'
      );
      if (
        existingScript &&
        existingScript.getAttribute("data-gmaps-listener")
      ) {
        existingScript.removeEventListener("load", initializeMap);
        existingScript.removeAttribute("data-gmaps-listener");
      }
    };
  }, [loadGoogleMapsScript, initializeMap]);

  // Error state
  if (mapError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Map Loading Error
          </h2>
          <p className="text-gray-600 mb-4">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null);
              scriptLoadedRef.current = false;
              loadGoogleMapsScript();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry Loading Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Back to dashboard"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Interactive Accessibility Map
                </h1>
                <p className="text-sm text-gray-600">
                  Visualize and manage accessibility obstacles in Pasig City
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {obstaclesLoading
                  ? "Loading obstacles..."
                  : `${filteredObstacles.length} obstacles shown`}
              </span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                aria-label="Toggle filters"
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-[calc(100vh-120px)]"
          style={{ minHeight: "600px" }}
        />

        {/* Loading overlay */}
        {(!googleMapRef.current || obstaclesLoading) && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {!googleMapRef.current
                  ? "Loading interactive map..."
                  : "Loading obstacles..."}
              </p>
            </div>
          </div>
        )}

        {/* Firebase data status */}
        {googleMapRef.current && !obstaclesLoading && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
            <div className="text-green-600 font-medium">
              🔥 Firebase Connected
            </div>
            <div className="text-gray-600">
              {firebaseObstacles.length} total obstacles
            </div>
            <div className="text-blue-600">
              {filteredObstacles.length} shown on map
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
