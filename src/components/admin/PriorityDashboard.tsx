// src/components/admin/PriorityDashboard.tsx
// UPDATED: Now uses REAL Firebase data instead of sample data!

"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminObstacle, ObstacleStatus } from "@/types/admin";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";

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

// ✅ Same calculator as before (no changes needed!)
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
    return Math.min(30, Math.max(0, netSupport * 3));
  }

  private getCriticalPoints(type: string): number {
    const critical = {
      no_sidewalk: 20,
      stairs_no_ramp: 20,
      construction: 15,
      flooding: 15,
    };
    return critical[type as keyof typeof critical] || 0;
  }

  private getAdminPoints(status: string): number {
    const points = { verified: 10, pending: 5, resolved: 0, false_report: 0 };
    return points[status as keyof typeof points] || 5;
  }

  private getCategory(score: number): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  private getRecommendation(type: string): string {
    const recommendations: Record<string, string> = {
      stairs_no_ramp:
        "Install wheelchair-accessible ramp meeting building code standards",
      vendor_blocking: "Establish vendor-free walkways with designated zones",
      parked_vehicles:
        "Install no-parking signs and enforce vehicle-free access",
      broken_pavement: "Repair pavement surface for safe wheelchair navigation",
      flooding: "Improve drainage and water management infrastructure",
      no_sidewalk: "Construct accessible sidewalk with proper materials",
      construction: "Provide temporary accessible alternative route",
      narrow_passage: "Widen walkway to meet accessibility requirements",
    };
    return (
      recommendations[type] ||
      "Investigate and implement accessibility solution"
    );
  }

  private getImplementationCategory(
    type: string
  ): "Quick Fix" | "Medium Project" | "Major Infrastructure" {
    const quickFix = ["vendor_blocking", "parked_vehicles"];
    const major = ["no_sidewalk", "stairs_no_ramp", "construction", "flooding"];

    if (quickFix.includes(type)) return "Quick Fix";
    if (major.includes(type)) return "Major Infrastructure";
    return "Medium Project";
  }

  private getTimeframe(type: string): string {
    const category = this.getImplementationCategory(type);
    const timeframes = {
      "Quick Fix": "1-30 days",
      "Medium Project": "1-6 months",
      "Major Infrastructure": "6+ months",
    };
    return timeframes[category];
  }
}

// ✅ Same UI components as before (no changes needed!)
function PriorityStatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        <div className="text-sm text-gray-600">Total Reports</div>
      </div>

      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="text-2xl font-bold text-red-800">{stats.critical}</div>
        <div className="text-sm text-red-600">🚨 Critical</div>
        <div className="text-xs text-red-500">Immediate action</div>
      </div>

      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div className="text-2xl font-bold text-orange-800">{stats.high}</div>
        <div className="text-sm text-orange-600">⚠️ High</div>
        <div className="text-xs text-orange-500">Priority planning</div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="text-2xl font-bold text-yellow-800">{stats.medium}</div>
        <div className="text-sm text-yellow-600">📋 Medium</div>
        <div className="text-xs text-yellow-500">Schedule review</div>
      </div>

      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="text-2xl font-bold text-green-800">{stats.low}</div>
        <div className="text-sm text-green-600">✅ Low</div>
        <div className="text-xs text-green-500">Future planning</div>
      </div>
    </div>
  );
}

function PriorityFilterTabs({
  activeFilter,
  onFilterChange,
  stats,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  stats: DashboardStats;
}) {
  const filters = [
    { key: "all", label: "All Obstacles", count: stats.total, color: "gray" },
    { key: "critical", label: "Critical", count: stats.critical, color: "red" },
    { key: "high", label: "High", count: stats.high, color: "orange" },
    { key: "medium", label: "Medium", count: stats.medium, color: "yellow" },
    { key: "low", label: "Low", count: stats.low, color: "green" },
  ];

  return (
    <div className="flex space-x-2 mb-6 overflow-x-auto">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`px-4 py-2 rounded-lg border-2 whitespace-nowrap transition-colors ${
            activeFilter === filter.key
              ? `border-${filter.color}-300 bg-${filter.color}-100 text-${filter.color}-800`
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          }`}
        >
          <span className="font-medium">{filter.label}</span>
          <span className="ml-2 text-sm">({filter.count})</span>
        </button>
      ))}
    </div>
  );
}

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
  const categoryColors = {
    CRITICAL: "bg-red-100 text-red-800 border-red-200",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
    LOW: "bg-green-100 text-green-800 border-green-200",
  };

  const scoreColors = {
    CRITICAL: "text-red-600",
    HIGH: "text-orange-600",
    MEDIUM: "text-yellow-600",
    LOW: "text-green-600",
  };

  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-lg font-bold text-gray-400">#{rank}</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${
              categoryColors[obstacle.priorityResult.category]
            }`}
          >
            {obstacle.priorityResult.category}
          </span>
          <span className="font-semibold text-gray-800">
            {obstacle.type.replace("_", " ").toUpperCase()}
          </span>
        </div>
        <div
          className={`text-2xl font-bold ${
            scoreColors[obstacle.priorityResult.category]
          }`}
        >
          {obstacle.priorityResult.score}/100
        </div>
      </div>

      <div className="text-gray-700 mb-3">{obstacle.description}</div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
        <span>
          📍 Community: {obstacle.upvotes}↑ {obstacle.downvotes}↓
        </span>
        <span>⚖️ Status: {obstacle.status}</span>
        <span>⏱️ {obstacle.priorityResult.timeframe}</span>
        <span>🏗️ {obstacle.priorityResult.implementationCategory}</span>
        {obstacle.barangay && <span>🏘️ {obstacle.barangay}</span>}
        {obstacle.deviceType && <span>♿ {obstacle.deviceType}</span>}
      </div>

      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400 mb-4">
        <div className="font-medium text-blue-800">💡 Recommended Action:</div>
        <div className="text-blue-700 text-sm">
          {obstacle.priorityResult.recommendation}
        </div>
      </div>

      {obstacle.status === "pending" && (
        <div className="flex space-x-2">
          <button
            onClick={() => onVerify(obstacle.id)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm"
          >
            ✅ Verify
          </button>
          <button
            onClick={() => onReject(obstacle.id)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm"
          >
            ❌ Reject
          </button>
        </div>
      )}

      {obstacle.status === "verified" && (
        <div className="text-center py-2 px-4 bg-green-100 text-green-800 rounded text-sm">
          ✅ Verified by Admin
        </div>
      )}

      {obstacle.status === "resolved" && (
        <div className="text-center py-2 px-4 bg-blue-100 text-blue-800 rounded text-sm">
          🔧 Resolved
        </div>
      )}
    </div>
  );
}

// ✅ MAIN COMPONENT: Now uses REAL Firebase data!
export default function PriorityDashboard() {
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

  // 🔥 NEW: Use real Firebase data!
  const {
    obstacles: firebaseObstacles,
    loading,
    error,
    updateObstacleStatus,
    loadObstacles,
  } = useFirebaseObstacles({ autoLoad: true });

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
      // Update in Firebase (this will update the real database!)
      await updateObstacleStatus(
        obstacleId,
        "verified",
        "admin_user_123",
        "Verified via admin dashboard"
      );

      console.log(`✅ Verified obstacle ${obstacleId} in Firebase`);

      // Reload data to get fresh state
      await loadObstacles();
    } catch (error) {
      console.error("❌ Error verifying obstacle:", error);
      alert("Failed to verify obstacle. Please try again.");
    }
  };

  const handleReject = async (obstacleId: string) => {
    try {
      // Update in Firebase (this will update the real database!)
      await updateObstacleStatus(
        obstacleId,
        "false_report",
        "admin_user_123",
        "Rejected via admin dashboard"
      );

      console.log(`❌ Rejected obstacle ${obstacleId} in Firebase`);

      // Reload data to get fresh state
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
          <div className="text-xl font-semibold mb-2">
            🔄 Loading Real Obstacle Data...
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
