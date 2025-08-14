// src/lib/hooks/useFirebaseObstacles.ts
// FIXED: No more infinite loops, proper dependency management! 🔥💪

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

export function useFirebaseObstacles(
  options: UseFirebaseObstaclesOptions = {},
  adminUserId: string = ""
) {
  const [obstacles, setObstacles] = useState<AdminObstacle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    resolved: 0,
    falseReports: 0,
    totalVotes: 0,
  });

  // 🔥 FIX: Use refs to prevent infinite re-renders
  const hasLoadedRef = useRef(false);
  const optionsRef = useRef(options);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [
    options.autoLoad,
    options.limit,
    options.timeframeDays,
    JSON.stringify(options.status),
  ]);

  // 🔥 FIX: Stable load function with proper dependencies
  const loadObstacles = useCallback(async () => {
    console.log("🔥 Loading obstacles - Starting...");
    setLoading(true);
    setError(null);

    try {
      console.log("📡 Attempting Firebase connection...");

      // Test connection first
      const isConnected = await adminObstacleService.testConnection();
      if (!isConnected) {
        throw new Error("Firebase connection failed");
      }

      console.log("✅ Firebase connected, loading obstacles...");

      let loadedObstacles: AdminObstacle[];

      if (optionsRef.current.timeframeDays) {
        // Load obstacles for specific timeframe (for reports)
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
        `✅ Loaded ${loadedObstacles.length} obstacles from Firebase`
      );

      // Calculate stats
      const newStats = {
        total: loadedObstacles.length,
        pending: loadedObstacles.filter((o) => o.status === "pending").length,
        verified: loadedObstacles.filter((o) => o.status === "verified").length,
        resolved: loadedObstacles.filter((o) => o.status === "resolved").length,
        falseReports: loadedObstacles.filter((o) => o.status === "false_report")
          .length,
        totalVotes: loadedObstacles.reduce(
          (sum, o) => sum + o.upvotes + o.downvotes,
          0
        ),
      };
      setStats(newStats);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load obstacles";
      setError(errorMessage);
      console.error("❌ Hook error loading obstacles:", err);
    } finally {
      setLoading(false);
    }
  }, []); // 🔥 FIX: Empty dependency array, use refs for options

  // 🔥 FIX: Stable update function
  const updateObstacleStatus = useCallback(
    async (
      obstacleId: string,
      status: ObstacleStatus,
      adminId: string,
      adminNotes?: string
    ) => {
      try {
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

  // 🔥 FIX: Test connection function
  const testConnection = useCallback(async () => {
    try {
      return await adminObstacleService.testConnection();
    } catch (err) {
      console.error("❌ Connection test failed:", err);
      return false;
    }
  }, []);

  // 🔥 FIX: Controlled auto-load with proper conditions
  useEffect(() => {
    console.log("🚀 Auto-loading obstacles...");
    console.log("🔍 Hook State:", {
      autoLoad: options.autoLoad,
      hasLoaded: hasLoadedRef.current,
      loading,
      adminUserId,
    });

    // Only auto-load if:
    // 1. autoLoad is not explicitly false
    // 2. Haven't loaded yet
    // 3. Not currently loading
    // 4. Have adminUserId (for authenticated calls)
    if (
      options.autoLoad !== false &&
      !hasLoadedRef.current &&
      !loading &&
      adminUserId
    ) {
      loadObstacles();
    }
  }, [options.autoLoad, adminUserId, loading, loadObstacles]);

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
