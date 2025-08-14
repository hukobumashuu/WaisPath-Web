"use client";

import { useState, useEffect, useCallback } from "react";
import { adminObstacleService } from "@/lib/firebase/adminObstacleService";
import { AdminObstacle, ObstacleStatus } from "@/types/admin";

interface UseFirebaseObstaclesOptions {
  autoLoad?: boolean;
  limit?: number;
  status?: ObstacleStatus[];
  timeframeDays?: number;
}

export function useFirebaseObstacles(
  options: UseFirebaseObstaclesOptions = {}
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

  // Load obstacles from Firebase
  const loadObstacles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let loadedObstacles: AdminObstacle[];

      if (options.timeframeDays) {
        // Load obstacles for specific timeframe (for reports)
        loadedObstacles = await adminObstacleService.getObstaclesInTimeframe(
          options.timeframeDays
        );
      } else {
        // Load all obstacles with filtering
        loadedObstacles = await adminObstacleService.getAllObstacles({
          limit: options.limit,
          status: options.status,
          orderBy: "reportedAt",
          orderDirection: "desc",
        });
      }

      setObstacles(loadedObstacles);
      console.log(`🔥 Loaded ${loadedObstacles.length} obstacles via hook`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load obstacles";
      setError(errorMessage);
      console.error("❌ Hook error loading obstacles:", err);
    } finally {
      setLoading(false);
    }
  }, [options.limit, options.status, options.timeframeDays]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const obstacleStats = await adminObstacleService.getObstacleStats();
      setStats(obstacleStats);
    } catch (err) {
      console.error("❌ Error loading stats:", err);
    }
  }, []);

  // Update obstacle status
  const updateObstacleStatus = useCallback(
    async (
      obstacleId: string,
      status: ObstacleStatus,
      adminUserId: string,
      adminNotes?: string
    ) => {
      try {
        await adminObstacleService.updateObstacleStatus(
          obstacleId,
          status,
          adminUserId,
          adminNotes
        );

        // Update local state
        setObstacles((prev) =>
          prev.map((obstacle) =>
            obstacle.id === obstacleId
              ? {
                  ...obstacle,
                  status,
                  verified: status === "verified",
                  reviewedBy: adminUserId,
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

  // Test Firebase connection
  const testConnection = useCallback(async () => {
    return await adminObstacleService.testConnection();
  }, []);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadObstacles();
      loadStats();
    }
  }, [loadObstacles, loadStats, options.autoLoad]);

  return {
    obstacles,
    loading,
    error,
    stats,
    loadObstacles,
    loadStats,
    updateObstacleStatus,
    testConnection,
    // Computed values
    hasData: obstacles.length > 0,
    isEmpty: !loading && obstacles.length === 0,
    hasError: !!error,
  };
}
