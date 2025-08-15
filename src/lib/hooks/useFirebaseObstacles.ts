// src/lib/hooks/useFirebaseObstacles.ts
// FIXED: Real Firebase connection with stable loading states

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { adminObstacleService } from "@/lib/firebase/adminObstacleService";
import { AdminObstacle, ObstacleStatus } from "@/types/admin";

interface UseFirebaseObstaclesOptions {
  autoLoad?: boolean;
  limit?: number;
  status?: ObstacleStatus[];
  timeframeDays?: number;
}

interface ObstacleStats {
  total: number;
  pending: number;
  verified: number;
  resolved: number;
  falseReports: number;
  totalVotes: number;
}

export function useFirebaseObstacles(
  options: UseFirebaseObstaclesOptions = {},
  adminUserId: string = ""
) {
  const [obstacles, setObstacles] = useState<AdminObstacle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ObstacleStats>({
    total: 0,
    pending: 0,
    verified: 0,
    resolved: 0,
    falseReports: 0,
    totalVotes: 0,
  });

  // 🔥 FIX: Use refs to prevent dependency loops
  const hasLoadedRef = useRef(false);
  const loadingRef = useRef(false);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options.autoLoad, options.limit, options.timeframeDays]);

  // Calculate stats when obstacles change
  useEffect(() => {
    const newStats = {
      total: obstacles.length,
      pending: obstacles.filter((o) => o.status === "pending").length,
      verified: obstacles.filter((o) => o.status === "verified").length,
      resolved: obstacles.filter((o) => o.status === "resolved").length,
      falseReports: obstacles.filter((o) => o.status === "false_report").length,
      totalVotes: obstacles.reduce(
        (sum, o) => sum + o.upvotes + o.downvotes,
        0
      ),
    };
    setStats(newStats);
  }, [obstacles]);

  // 🔥 FIX: Stable load function with proper state management
  const loadObstacles = useCallback(async () => {
    // Prevent concurrent loading
    if (loadingRef.current) {
      console.log("🔄 Already loading obstacles, skipping...");
      return;
    }

    console.log("🔥 Loading obstacles from Firebase...");
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log("📡 Testing Firebase connection...");

      // Test connection first
      const isConnected = await adminObstacleService.testConnection();
      if (!isConnected) {
        throw new Error(
          "Firebase connection failed - check console for details"
        );
      }

      console.log("✅ Firebase connected, loading obstacles...");

      let loadedObstacles: AdminObstacle[];

      if (optionsRef.current.timeframeDays) {
        // Load obstacles for specific timeframe
        loadedObstacles = await adminObstacleService.getObstaclesInTimeframe(
          optionsRef.current.timeframeDays
        );
      } else {
        // Load all obstacles with filtering
        loadedObstacles = await adminObstacleService.getAllObstacles({
          limit: optionsRef.current.limit,
          status: optionsRef.current.status,
          orderBy: "reportedAt",
          orderDirection: "desc",
        });
      }

      setObstacles(loadedObstacles);
      hasLoadedRef.current = true;

      console.log(
        `✅ Loaded ${loadedObstacles.length} real obstacles from Firebase`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load obstacles";
      setError(errorMessage);
      console.error("❌ Error loading obstacles:", err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []); // Empty dependency array to prevent loops

  // 🔥 FIX: Update obstacle status
  const updateObstacleStatus = useCallback(
    async (
      obstacleId: string,
      status: ObstacleStatus,
      adminId: string,
      adminNotes?: string
    ) => {
      try {
        console.log(`🔄 Updating obstacle ${obstacleId} to ${status}...`);

        await adminObstacleService.updateObstacleStatus(
          obstacleId,
          status,
          adminId,
          adminNotes
        );

        // Update local state immediately for UI responsiveness
        setObstacles((prev) =>
          prev.map((obstacle) =>
            obstacle.id === obstacleId
              ? {
                  ...obstacle,
                  status,
                  verified: status === "verified",
                  reviewedBy: adminId,
                  reviewedAt: new Date(),
                  adminNotes,
                }
              : obstacle
          )
        );

        console.log(`✅ Updated obstacle ${obstacleId} status to ${status}`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update obstacle";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Test connection function
  const testConnection = useCallback(async () => {
    try {
      return await adminObstacleService.testConnection();
    } catch (err) {
      console.error("❌ Connection test failed:", err);
      return false;
    }
  }, []);

  // 🔥 FIX: One-time auto-load with stable conditions
  useEffect(() => {
    // Only auto-load if:
    // 1. autoLoad is enabled (default true)
    // 2. Haven't loaded yet
    // 3. Not currently loading
    // 4. Have adminUserId
    if (
      options.autoLoad !== false &&
      !hasLoadedRef.current &&
      !loadingRef.current &&
      adminUserId &&
      adminUserId.trim() !== ""
    ) {
      console.log("🚀 Auto-loading obstacles for admin:", adminUserId);
      loadObstacles();
    }
  }, [adminUserId, loadObstacles, options.autoLoad]);

  return {
    obstacles,
    loading,
    error,
    stats,
    loadObstacles,
    updateObstacleStatus,
    testConnection,
    // Computed values
    hasData: obstacles.length > 0,
    isEmpty: !loading && obstacles.length === 0,
    hasError: !!error,
  };
}
