// src/components/admin/PriorityDashboard.tsx
// FIXED: All TypeScript errors resolved! 🔥💪

"use client";

import { useState, useEffect } from "react";
import { AdminObstacle, ObstacleStatus, ObstacleType } from "@/types/admin";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";
import { useAdminAuth } from "@/lib/auth/firebase-auth";

// ✅ Same interfaces as before
interface PriorityResult {
  score: number;
  category: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommendation: string;
  implementationCategory:
    | "Quick Fix"
    | "Medium Project"
    | "Major Infrastructure";
  timeframe: string;
  breakdown: {
    severityPoints: number;
    communityPoints: number;
    criticalPoints: number;
    adminPoints: number;
  };
}

interface PriorityObstacle extends AdminObstacle {
  priorityResult: PriorityResult;
}

interface DashboardStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  urgentCount: number;
  avgScore: number;
}

// ✅ Priority Calculator
class PriorityCalculator {
  calculatePriority(obstacle: AdminObstacle): PriorityResult {
    const severityPoints = this.getSeverityPoints(obstacle.severity);
    const communityPoints = this.getCommunityPoints(
      obstacle.upvotes,
      obstacle.downvotes
    );
    const criticalPoints = this.getCriticalPoints(obstacle.type);
    const adminPoints = this.getAdminPoints(obstacle.status);

    const score = Math.max(
      0,
      Math.min(
        100,
        severityPoints + communityPoints + criticalPoints + adminPoints
      )
    );
    const category = this.getCategory(score);

    return {
      score,
      category,
      recommendation: this.getRecommendation(obstacle.type),
      implementationCategory: this.getImplementationCategory(obstacle.type),
      timeframe: this.getTimeframe(obstacle.type),
      breakdown: {
        severityPoints,
        communityPoints,
        criticalPoints,
        adminPoints,
      },
    };
  }

  private getSeverityPoints(severity: string): number {
    const points = { blocking: 40, high: 30, medium: 20, low: 10 };
    return points[severity as keyof typeof points] || 0;
  }

  private getCommunityPoints(upvotes: number, downvotes: number): number {
    const netSupport = upvotes - downvotes;
    return Math.max(0, Math.min(30, netSupport * 3));
  }

  private getCriticalPoints(type: ObstacleType): number {
    const criticalTypes = {
      no_sidewalk: 20,
      stairs_no_ramp: 20,
      construction: 15,
      flooding: 15,
    };
    return criticalTypes[type as keyof typeof criticalTypes] || 0;
  }

  private getAdminPoints(status: ObstacleStatus): number {
    const statusMapping = {
      verified: 10,
      pending: 5,
      resolved: 0,
      false_report: 0,
    };
    return statusMapping[status] || 5;
  }

  private getCategory(score: number): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  private getRecommendation(type: ObstacleType): string {
    const recommendations: Record<ObstacleType, string> = {
      vendor_blocking: "Enforce sidewalk regulations and vendor zoning",
      parked_vehicles: "Install no-parking signs and tow zone markers",
      construction: "Require accessible temporary pathways during construction",
      electrical_post: "Relocate utility poles to edge of sidewalk",
      tree_roots: "Repair pavement and install root barriers",
      no_sidewalk: "Construct accessible sidewalk infrastructure",
      flooding: "Improve drainage and install proper water management",
      stairs_no_ramp: "Install wheelchair ramp meeting ADA standards",
      narrow_passage: "Widen pathway to minimum accessibility width",
      broken_pavement: "Repair pavement with smooth, level surface",
      steep_slope: "Install ramp or alternative accessible route",
      other:
        "Assess specific accessibility barriers and implement appropriate solution",
    };
    return recommendations[type];
  }

  private getImplementationCategory(
    type: ObstacleType
  ): "Quick Fix" | "Medium Project" | "Major Infrastructure" {
    const quickFix: ObstacleType[] = ["vendor_blocking", "parked_vehicles"];
    const majorInfra: ObstacleType[] = [
      "no_sidewalk",
      "construction",
      "flooding",
    ];

    if (quickFix.includes(type)) return "Quick Fix";
    if (majorInfra.includes(type)) return "Major Infrastructure";
    return "Medium Project";
  }

  private getTimeframe(type: ObstacleType): string {
    const category = this.getImplementationCategory(type);
    const timeframes = {
      "Quick Fix": "1-30 days (enforcement/management)",
      "Medium Project": "1-6 months (repairs/modifications)",
      "Major Infrastructure": "6+ months (construction/major work)",
    };
    return timeframes[category];
  }
}

// ✅ Component: Priority Stats Cards
function PriorityStatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            🔥
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Critical</p>
            <p className="text-2xl font-semibold text-red-900">
              {stats.critical}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            ⚠️
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">High</p>
            <p className="text-2xl font-semibold text-orange-900">
              {stats.high}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            📋
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Medium</p>
            <p className="text-2xl font-semibold text-yellow-900">
              {stats.medium}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            ✅
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Low</p>
            <p className="text-2xl font-semibold text-green-900">{stats.low}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ Component: Priority Filter Tabs
function PriorityFilterTabs({
  activeFilter,
  onFilterChange,
  stats,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  stats: DashboardStats;
}) {
  const tabs = [
    {
      id: "all",
      label: "All",
      count: stats.total,
      color: "bg-gray-100 text-gray-800",
    },
    {
      id: "critical",
      label: "Critical",
      count: stats.critical,
      color: "bg-red-100 text-red-800",
    },
    {
      id: "high",
      label: "High",
      count: stats.high,
      color: "bg-orange-100 text-orange-800",
    },
    {
      id: "medium",
      label: "Medium",
      count: stats.medium,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "low",
      label: "Low",
      count: stats.low,
      color: "bg-green-100 text-green-800",
    },
  ];

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeFilter === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${tab.color}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ✅ Component: Priority Obstacle Card
function PriorityObstacleCard({
  obstacle,
  rank,
  onVerify,
  onReject,
}: {
  obstacle: PriorityObstacle;
  rank: number;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const getCategoryColor = (category: string) => {
    const colors = {
      CRITICAL: "bg-red-100 text-red-800 border-red-200",
      HIGH: "bg-orange-100 text-orange-800 border-orange-200",
      MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
      LOW: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[category as keyof typeof colors] || colors.LOW;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              #{rank}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {obstacle.type.replace("_", " ").toUpperCase()}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(
                    obstacle.priorityResult.category
                  )}`}
                >
                  {obstacle.priorityResult.category} (
                  {obstacle.priorityResult.score}/100)
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{obstacle.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
            <div>📅 {obstacle.reportedAt.toLocaleDateString()}</div>
            <div>👤 User #{obstacle.reportedBy.slice(-4)}</div>
            <div>
              👍 {obstacle.upvotes} 👎 {obstacle.downvotes}
            </div>
            <div>
              📍 {obstacle.location.latitude.toFixed(4)},{" "}
              {obstacle.location.longitude.toFixed(4)}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
            <div className="font-medium text-blue-800">
              💡 Recommended Action:
            </div>
            <div className="text-blue-700 text-sm">
              {obstacle.priorityResult.recommendation}
            </div>
          </div>
        </div>

        <div className="ml-6 flex flex-col space-y-2">
          {obstacle.status === "pending" && (
            <>
              <button
                onClick={() => onVerify(obstacle.id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                ✅ Verify
              </button>
              <button
                onClick={() => onReject(obstacle.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                ❌ Reject
              </button>
            </>
          )}

          {obstacle.status === "verified" && (
            <div className="text-center py-2 px-4 bg-green-100 text-green-800 rounded text-sm">
              ✅ Verified
            </div>
          )}

          {obstacle.status === "resolved" && (
            <div className="text-center py-2 px-4 bg-blue-100 text-blue-800 rounded text-sm">
              🔧 Resolved
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ MAIN COMPONENT: Now uses REAL Firebase data!
export default function PriorityDashboard() {
  const { user } = useAdminAuth();
  const [filteredObstacles, setFilteredObstacles] = useState<
    PriorityObstacle[]
  >([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    urgentCount: 0,
    avgScore: 0,
  });

  const [priorityCalculator] = useState(() => new PriorityCalculator());

  // 🔥 FIXED: Use real Firebase data with adminUserId!
  const {
    obstacles: firebaseObstacles,
    loading,
    error,
    updateObstacleStatus,
    loadObstacles,
  } = useFirebaseObstacles({ autoLoad: true }, user?.uid || "");

  const [prioritizedObstacles, setPrioritizedObstacles] = useState<
    PriorityObstacle[]
  >([]);

  // Calculate priorities when Firebase data changes
  useEffect(() => {
    if (firebaseObstacles.length > 0) {
      console.log(
        `🔥 Processing ${firebaseObstacles.length} obstacles from Firebase...`
      );

      // Calculate priority for each obstacle
      const processed = firebaseObstacles.map((obstacle) => ({
        ...obstacle,
        priorityResult: priorityCalculator.calculatePriority(obstacle),
      }));

      // Sort by priority score (highest first)
      processed.sort((a, b) => b.priorityResult.score - a.priorityResult.score);

      setPrioritizedObstacles(processed);

      // Calculate stats
      const total = processed.length;
      const critical = processed.filter(
        (o) => o.priorityResult.category === "CRITICAL"
      ).length;
      const high = processed.filter(
        (o) => o.priorityResult.category === "HIGH"
      ).length;
      const medium = processed.filter(
        (o) => o.priorityResult.category === "MEDIUM"
      ).length;
      const low = processed.filter(
        (o) => o.priorityResult.category === "LOW"
      ).length;
      const urgentCount = critical + high;
      const totalScore = processed.reduce(
        (sum, o) => sum + o.priorityResult.score,
        0
      );
      const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

      setStats({ total, critical, high, medium, low, urgentCount, avgScore });

      console.log(
        `✅ Processed obstacles - Critical: ${critical}, High: ${high}, Medium: ${medium}, Low: ${low}`
      );
    }
  }, [firebaseObstacles, priorityCalculator]);

  // Filter obstacles when filter changes
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredObstacles(prioritizedObstacles);
    } else {
      const filtered = prioritizedObstacles.filter(
        (obstacle) =>
          obstacle.priorityResult.category.toLowerCase() === activeFilter
      );
      setFilteredObstacles(filtered);
    }
  }, [prioritizedObstacles, activeFilter]);

  // Handle admin actions with real Firebase updates
  const handleVerify = async (obstacleId: string) => {
    try {
      await updateObstacleStatus(
        obstacleId,
        "verified",
        user?.uid || "",
        "Verified via Priority Dashboard"
      );
      console.log(`✅ Verified obstacle ${obstacleId} in Firebase`);
      await loadObstacles();
    } catch (error) {
      console.error("❌ Error verifying obstacle:", error);
      alert("Failed to verify obstacle. Please try again.");
    }
  };

  const handleReject = async (obstacleId: string) => {
    try {
      await updateObstacleStatus(
        obstacleId,
        "false_report",
        user?.uid || "",
        "Rejected via Priority Dashboard"
      );
      console.log(`❌ Rejected obstacle ${obstacleId} in Firebase`);
      await loadObstacles();
    } catch (error) {
      console.error("❌ Error rejecting obstacle:", error);
      alert("Failed to reject obstacle. Please try again.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold mb-2">
            🔄 Loading Priority Analysis...
          </div>
          <div className="text-gray-600">
            Connecting to Firebase and calculating priorities
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2 text-red-600">
            ❌ Error Loading Data
          </div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => loadObstacles()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (prioritizedObstacles.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-xl font-semibold mb-2">No Obstacles Found</div>
          <div className="text-gray-600 mb-4">
            No accessibility obstacles in the database yet.
          </div>
          <button
            onClick={() => loadObstacles()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 Priority Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time obstacles ranked by rule-based priority algorithm • Urgent
          items: {stats.urgentCount} • Average score: {stats.avgScore}/100
        </p>
        <div className="mt-2 text-sm text-blue-600">
          🔥 Connected to Firebase • {firebaseObstacles.length} obstacles loaded
          from waispath-4dbf1
        </div>
      </div>

      <PriorityStatsCards stats={stats} />
      <PriorityFilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        stats={stats}
      />

      <div className="space-y-4">
        {filteredObstacles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No obstacles found for selected priority level.
          </div>
        ) : (
          filteredObstacles.map((obstacle) => (
            <PriorityObstacleCard
              key={obstacle.id}
              obstacle={obstacle}
              rank={
                prioritizedObstacles.findIndex((o) => o.id === obstacle.id) + 1
              }
              onVerify={handleVerify}
              onReject={handleReject}
            />
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          Showing {filteredObstacles.length} of {stats.total} obstacles •
          Priority algorithm: Severity (40%) + Community (30%) + Infrastructure
          (20%) + Admin (10%) • 🔥 Live Firebase data from your mobile app
        </div>
      </div>
    </div>
  );
}
