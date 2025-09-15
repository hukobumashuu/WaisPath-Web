// src/components/admin/PriorityDashboard.tsx
// ENHANCED: Full lifecycle management with original UI/UX, proper logging, and separated components
// Status progression: "pending" → "verified" (Under Review) → "resolved" (Fixed)
//                   ↘️ "false_report" (Rejected/Invalid)

"use client";

import { useState, useMemo } from "react";
import { ObstacleStatus } from "@/types/admin";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import {
  PriorityCalculator,
  PriorityObstacle,
} from "@/lib/priority/PriorityCalculator";
import { LifecycleManager } from "@/lib/lifecycle/LifecycleManager";
import PriorityStatsCards, { DashboardStats } from "./PriorityStatsCards";
import PriorityFilterTabs from "./PriorityFilterTabs";
import PriorityObstacleCard from "./PriorityObstacleCard";

export default function PriorityDashboard() {
  const { user } = useAdminAuth();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [priorityCalculator] = useState(() => new PriorityCalculator());

  console.log(`🔥 PriorityDashboard initializing with user:`, {
    userId: user?.uid,
    userEmail: user?.email,
    isAdmin: user?.isAdmin,
    timestamp: new Date().toISOString(),
  });

  // Firebase hook - using existing infrastructure
  const {
    obstacles: firebaseObstacles,
    loading,
    error,
    updateObstacleStatus,
  } = useFirebaseObstacles({ autoLoad: true }, user?.uid || "");

  // Calculate priorities with logging
  const prioritizedObstacles = useMemo(() => {
    if (firebaseObstacles.length === 0) {
      console.log(`📊 No obstacles to process for priority analysis`);
      return [];
    }

    console.log(
      `📊 Processing ${firebaseObstacles.length} obstacles for priority analysis...`
    );

    const processed = firebaseObstacles.map((obstacle) => {
      const priorityResult = priorityCalculator.calculatePriority(obstacle);
      return {
        ...obstacle,
        priorityResult,
      };
    });

    // Sort by priority score (highest first)
    processed.sort((a, b) => b.priorityResult.score - a.priorityResult.score);

    console.log(`✅ Priority analysis complete:`, {
      totalObstacles: processed.length,
      topPriority: processed[0]?.priorityResult,
      scoreDistribution: {
        critical: processed.filter(
          (o) => o.priorityResult.category === "CRITICAL"
        ).length,
        high: processed.filter((o) => o.priorityResult.category === "HIGH")
          .length,
        medium: processed.filter((o) => o.priorityResult.category === "MEDIUM")
          .length,
        low: processed.filter((o) => o.priorityResult.category === "LOW")
          .length,
      },
    });

    return processed;
  }, [firebaseObstacles, priorityCalculator]);

  // Calculate stats with logging
  const stats = useMemo(() => {
    const total = prioritizedObstacles.length;
    const resolved = prioritizedObstacles.filter(
      (o) => o.status === "resolved"
    ).length;
    const high = prioritizedObstacles.filter(
      (o) =>
        o.priorityResult.category === "HIGH" ||
        o.priorityResult.category === "CRITICAL"
    ).length;
    const medium = prioritizedObstacles.filter(
      (o) => o.priorityResult.category === "MEDIUM"
    ).length;
    const low = prioritizedObstacles.filter(
      (o) => o.priorityResult.category === "LOW"
    ).length;
    const urgentCount = high;
    const totalScore = prioritizedObstacles.reduce(
      (sum, o) => sum + o.priorityResult.score,
      0
    );
    const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

    const calculatedStats: DashboardStats = {
      total,
      resolved,
      high,
      medium,
      low,
      urgentCount,
      avgScore,
    };

    console.log(`📈 Dashboard stats calculated:`, calculatedStats);

    return calculatedStats;
  }, [prioritizedObstacles]);

  // Filter logic with logging
  const filteredObstacles = useMemo(() => {
    console.log(`🔍 Applying filter: ${activeFilter}`);

    let filtered: PriorityObstacle[];

    if (activeFilter === "all") {
      filtered = prioritizedObstacles;
    } else if (activeFilter === "resolved") {
      filtered = prioritizedObstacles.filter(
        (obstacle) => obstacle.status === "resolved"
      );
    } else if (activeFilter === "high") {
      filtered = prioritizedObstacles.filter(
        (obstacle) =>
          obstacle.priorityResult.category === "HIGH" ||
          obstacle.priorityResult.category === "CRITICAL"
      );
    } else {
      filtered = prioritizedObstacles.filter(
        (obstacle) =>
          obstacle.priorityResult.category.toLowerCase() === activeFilter
      );
    }

    console.log(
      `🎯 Filter applied: ${activeFilter}, showing ${filtered.length}/${prioritizedObstacles.length} obstacles`
    );

    return filtered;
  }, [prioritizedObstacles, activeFilter]);

  // Handle status changes with comprehensive logging
  const handleStatusChange = async (
    obstacleId: string,
    newStatus: ObstacleStatus,
    adminNotes: string
  ) => {
    const currentObstacle = prioritizedObstacles.find(
      (o) => o.id === obstacleId
    );
    const currentStatus = currentObstacle?.status;

    console.log(`🔄 Initiating status change:`, {
      obstacleId,
      currentStatus,
      newStatus,
      adminId: user?.uid,
      adminEmail: user?.email,
      adminNotes,
      timestamp: new Date().toISOString(),
    });

    // Validate transition
    if (
      currentStatus &&
      !LifecycleManager.canTransition(currentStatus, newStatus)
    ) {
      console.error(`❌ Invalid status transition:`, {
        from: currentStatus,
        to: newStatus,
        obstacleId,
      });
      alert(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      return;
    }

    try {
      console.log(`📤 Sending status update to Firebase...`);

      await updateObstacleStatus(
        obstacleId,
        newStatus,
        user?.uid || "",
        adminNotes
      );

      console.log(`✅ Status update successful:`, {
        obstacleId,
        transition: `${currentStatus} → ${newStatus}`,
        adminId: user?.uid,
        timestamp: new Date().toISOString(),
      });

      // Log for lifecycle tracking
      if (currentStatus) {
        LifecycleManager.logStatusChange(
          obstacleId,
          currentStatus,
          newStatus,
          user?.uid || "",
          adminNotes
        );
      }
    } catch (error) {
      console.error(`❌ Status update failed:`, {
        obstacleId,
        currentStatus,
        newStatus,
        error: error instanceof Error ? error.message : String(error),
        adminId: user?.uid,
        timestamp: new Date().toISOString(),
      });
      alert("Failed to update obstacle status. Please try again.");
    }
  };

  // Loading state
  if (loading) {
    console.log(`⏳ Dashboard loading...`);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <div className="text-2xl font-bold text-gray-900">
            Loading Priority Analysis...
          </div>
          <div className="text-gray-600 mt-2">
            Processing obstacle data and calculating priorities
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error(`❌ Dashboard error:`, error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-2xl font-bold text-red-900 mb-4">
            Connection Error
          </div>
          <div className="text-red-700 mb-6">{error}</div>
          <button
            onClick={() => {
              console.log(`🔄 Retrying dashboard connection...`);
              window.location.reload();
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  console.log(
    `🎨 Rendering dashboard UI with ${filteredObstacles.length} filtered obstacles`
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Priority Analysis Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Intelligent obstacle lifecycle management with AHP prioritization
          </p>
        </div>

        {/* Stats Cards */}
        <PriorityStatsCards stats={stats} />

        {/* Filter Tabs */}
        <PriorityFilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          stats={stats}
        />

        {/* Obstacles List */}
        {filteredObstacles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              No obstacles found
            </div>
            <div className="text-gray-600">
              {activeFilter === "all"
                ? "No obstacles have been reported yet."
                : `No obstacles match the ${activeFilter} filter.`}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredObstacles.map((obstacle, index) => (
              <PriorityObstacleCard
                key={obstacle.id}
                obstacle={obstacle}
                rank={index + 1}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
