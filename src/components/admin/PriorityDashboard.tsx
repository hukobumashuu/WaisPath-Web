// src/components/admin/PriorityDashboard.tsx
// ENHANCED: Better UI/UX with improved styling and resolved tracking

"use client";

import { useState, useMemo } from "react";
import { AdminObstacle, ObstacleStatus, ObstacleType } from "@/types/admin";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";
import { useAdminAuth } from "@/lib/auth/firebase-auth";

// Priority interfaces (same as before)
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
  resolved: number;
  high: number;
  medium: number;
  low: number;
  urgentCount: number;
  avgScore: number;
}

// Priority Calculator (same as before)
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

// Enhanced Stats Cards Component
function PriorityStatsCards({ stats }: { stats: DashboardStats }) {
  const statCards = [
    {
      label: "Resolved",
      count: stats.resolved,
      textColor: "text-green-700",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      borderColor: "border-green-200",
      icon: "✅",
      description: "Successfully addressed",
    },
    {
      label: "High Priority",
      count: stats.high,
      textColor: "text-orange-700",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      icon: "⚠️",
      description: "Address within weeks",
    },
    {
      label: "Medium Priority",
      count: stats.medium,
      textColor: "text-blue-700",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      icon: "📋",
      description: "Schedule for planning",
    },
    {
      label: "Low Priority",
      count: stats.low,
      textColor: "text-gray-700",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
      borderColor: "border-gray-200",
      icon: "📝",
      description: "Monitor and review",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map(
        ({
          label,
          count,
          textColor,
          bgColor,
          borderColor,
          icon,
          description,
        }) => (
          <div
            key={label}
            className={`${bgColor} ${borderColor} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 relative overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 opacity-10 rounded-full bg-white"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl" role="img" aria-label={label}>
                  {icon}
                </span>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>

              {/* Mini progress indicator */}
              <div className="mt-4 h-1 bg-white bg-opacity-60 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    label === "Resolved"
                      ? "bg-green-500"
                      : label === "High Priority"
                      ? "bg-orange-500"
                      : label === "Medium Priority"
                      ? "bg-blue-500"
                      : "bg-gray-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (count / Math.max(stats.total, 1)) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// Enhanced Filter Tabs Component
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
      activeColor: "bg-blue-100 text-blue-800 border-blue-500",
    },
    {
      id: "high",
      label: "High Priority",
      count: stats.high,
      color: "bg-orange-100 text-orange-800",
      activeColor: "bg-orange-100 text-orange-800 border-orange-500",
    },
    {
      id: "medium",
      label: "Medium",
      count: stats.medium,
      color: "bg-blue-100 text-blue-800",
      activeColor: "bg-blue-100 text-blue-800 border-blue-500",
    },
    {
      id: "low",
      label: "Low",
      count: stats.low,
      color: "bg-gray-100 text-gray-800",
      activeColor: "bg-gray-100 text-gray-800 border-gray-500",
    },
    {
      id: "resolved",
      label: "Resolved",
      count: stats.resolved,
      color: "bg-green-100 text-green-800",
      activeColor: "bg-green-100 text-green-800 border-green-500",
    },
  ];

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <nav className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeFilter === tab.id
                  ? `${tab.activeColor} shadow-md transform scale-105`
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeFilter === tab.id
                      ? "bg-white bg-opacity-30"
                      : tab.color
                  }`}
                >
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// Enhanced Obstacle Card Component
function PriorityObstacleCard({
  obstacle,
  rank,
  onVerify,
  onReject,
  onRevertToPending,
  showConfirmDialog,
}: {
  obstacle: PriorityObstacle;
  rank: number;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  onRevertToPending: (id: string) => void;
  showConfirmDialog: (
    type: "review" | "plan",
    obstacleId: string,
    obstacleTitle: string
  ) => void;
}) {
  const getCategoryColor = (category: string) => {
    const colors = {
      CRITICAL: "bg-red-100 text-red-800 border-red-300",
      HIGH: "bg-orange-100 text-orange-800 border-orange-300",
      MEDIUM: "bg-blue-100 text-blue-800 border-blue-300",
      LOW: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[category as keyof typeof colors] || colors.LOW;
  };

  const renderActionButtons = () => {
    if (obstacle.status === "verified") {
      return (
        <div className="flex flex-col space-y-3">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-xl border-2 border-blue-200 text-sm font-medium text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">👁️</span>
              <span>Under Review</span>
            </div>
          </div>

          {/* Revert button for verified status */}
          <button
            onClick={() => onRevertToPending(obstacle.id)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-xs font-medium"
          >
            <div className="flex items-center justify-center space-x-1">
              <span>↩️</span>
              <span>Revert to Pending</span>
            </div>
          </button>
        </div>
      );
    }

    if (obstacle.status === "resolved") {
      return (
        <div className="flex flex-col space-y-3">
          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-800 rounded-xl border-2 border-green-200 text-sm font-medium text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">✅</span>
              <span>Resolved</span>
            </div>
          </div>
        </div>
      );
    }

    if (obstacle.status === "false_report") {
      return (
        <div className="flex flex-col space-y-3">
          <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 rounded-xl border-2 border-purple-200 text-sm font-medium text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">📅</span>
              <span>Planned</span>
            </div>
          </div>

          {/* Revert button for false_report status */}
          <button
            onClick={() => onRevertToPending(obstacle.id)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-xs font-medium"
          >
            <div className="flex items-center justify-center space-x-1">
              <span>↩️</span>
              <span>Revert to Pending</span>
            </div>
          </button>
        </div>
      );
    }

    // Enhanced pending status buttons with modal confirmation
    return (
      <div className="flex flex-col space-y-3">
        <button
          onClick={() =>
            showConfirmDialog(
              "review",
              obstacle.id,
              obstacle.type.replace("_", " ").toUpperCase()
            )
          }
          className="group relative px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm font-medium"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">👁️</span>
            <span>Mark Under Review</span>
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
        </button>

        <button
          onClick={() =>
            showConfirmDialog(
              "plan",
              obstacle.id,
              obstacle.type.replace("_", " ").toUpperCase()
            )
          }
          className="group relative px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm font-medium"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">📅</span>
            <span>Plan for Resolution</span>
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
        </button>

        <div className="text-xs text-gray-500 text-center mt-2">
          Priority: {obstacle.priorityResult.category}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              #{rank}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {obstacle.type.replace("_", " ").toUpperCase()}
              </h3>
              <div className="flex items-center space-x-3">
                {/* REMOVED SCORE - Just show priority category */}
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getCategoryColor(
                    obstacle.priorityResult.category
                  )}`}
                >
                  {obstacle.priorityResult.category} PRIORITY
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-6 text-lg leading-relaxed">
            {obstacle.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center space-x-2">
              <span>📅</span>
              <span>{obstacle.reportedAt.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>👤</span>
              <span>User #{obstacle.reportedBy.slice(-4)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>👍 {obstacle.upvotes}</span>
              <span>👎 {obstacle.downvotes}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>📍</span>
              <span>
                {obstacle.location.latitude.toFixed(4)},{" "}
                {obstacle.location.longitude.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-400">
            <div className="font-bold text-blue-900 mb-2 flex items-center space-x-2">
              <span>💡</span>
              <span>Recommended Action:</span>
            </div>
            <div className="text-blue-800 text-sm leading-relaxed">
              {obstacle.priorityResult.recommendation}
            </div>
          </div>
        </div>

        <div className="ml-8">{renderActionButtons()}</div>
      </div>
    </div>
  );
}

// 🔥 MAIN COMPONENT: Enhanced with better UI
export default function PriorityDashboard() {
  const { user } = useAdminAuth();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [priorityCalculator] = useState(() => new PriorityCalculator());

  // Modal state for confirmations
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "review" | "plan";
    obstacleId: string;
    obstacleTitle: string;
  } | null>(null);

  // 🔥 FIX: Use real Firebase data
  const {
    obstacles: firebaseObstacles,
    loading,
    error,
    updateObstacleStatus,
    loadObstacles,
  } = useFirebaseObstacles({ autoLoad: true }, user?.uid || "");

  // 🔥 FIX: Use useMemo to prevent recalculation loops
  const prioritizedObstacles = useMemo(() => {
    if (firebaseObstacles.length === 0) return [];

    console.log(
      `🔥 Processing ${firebaseObstacles.length} obstacles for priority analysis...`
    );

    const processed = firebaseObstacles.map((obstacle) => ({
      ...obstacle,
      priorityResult: priorityCalculator.calculatePriority(obstacle),
    }));

    // Sort by priority score (highest first)
    processed.sort((a, b) => b.priorityResult.score - a.priorityResult.score);

    return processed;
  }, [firebaseObstacles, priorityCalculator]);

  // 🔥 UPDATED: Calculate stats with resolved instead of critical
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

    return { total, resolved, high, medium, low, urgentCount, avgScore };
  }, [prioritizedObstacles]);

  // 🔥 UPDATED: Filter logic with resolved filter
  const filteredObstacles = useMemo(() => {
    if (activeFilter === "all") return prioritizedObstacles;
    if (activeFilter === "resolved") {
      return prioritizedObstacles.filter(
        (obstacle) => obstacle.status === "resolved"
      );
    }
    if (activeFilter === "high") {
      return prioritizedObstacles.filter(
        (obstacle) =>
          obstacle.priorityResult.category === "HIGH" ||
          obstacle.priorityResult.category === "CRITICAL"
      );
    }
    return prioritizedObstacles.filter(
      (obstacle) =>
        obstacle.priorityResult.category.toLowerCase() === activeFilter
    );
  }, [prioritizedObstacles, activeFilter]);

  // Handle admin actions
  const handleVerify = async (obstacleId: string) => {
    try {
      await updateObstacleStatus(
        obstacleId,
        "verified",
        user?.uid || "",
        "Marked as Under Review via Priority Dashboard"
      );
      console.log(`✅ Marked under review: ${obstacleId}`);
    } catch (error) {
      console.error("❌ Error updating obstacle:", error);
      alert("Failed to update obstacle. Please try again.");
    }
  };

  const handleReject = async (obstacleId: string) => {
    try {
      await updateObstacleStatus(
        obstacleId,
        "false_report",
        user?.uid || "",
        "Planned for Resolution via Priority Dashboard"
      );
      console.log(`📅 Planned for resolution: ${obstacleId}`);
    } catch (error) {
      console.error("❌ Error updating obstacle:", error);
      alert("Failed to update obstacle. Please try again.");
    }
  };

  // Add reversion handler
  const handleRevertToPending = async (obstacleId: string) => {
    try {
      await updateObstacleStatus(
        obstacleId,
        "pending",
        user?.uid || "",
        "Reverted to Pending via Priority Dashboard"
      );
      console.log(`↩️ Reverted to pending: ${obstacleId}`);
    } catch (error) {
      console.error("❌ Error reverting obstacle:", error);
      alert("Failed to revert obstacle. Please try again.");
    }
  };

  // Modal handlers
  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "review") {
      handleVerify(confirmAction.obstacleId);
    } else if (confirmAction.type === "plan") {
      handleReject(confirmAction.obstacleId);
    }

    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const showConfirmDialog = (
    type: "review" | "plan",
    obstacleId: string,
    obstacleTitle: string
  ) => {
    setConfirmAction({ type, obstacleId, obstacleTitle });
    setShowConfirmModal(true);
  };

  // Enhanced Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            🔄 Loading Priority Analysis...
          </div>
          <div className="text-gray-600">
            Connecting to Firebase and calculating priorities
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl font-bold mb-4 text-red-600">
            Error Loading Data
          </div>
          <div className="text-gray-600 mb-6">{error}</div>
          <button
            onClick={() => loadObstacles()}
            className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Enhanced No data state
  if (prioritizedObstacles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-8xl mb-6">📊</div>
          <div className="text-2xl font-bold mb-4">No Obstacles Found</div>
          <div className="text-gray-600 mb-6">
            No accessibility obstacles in the database yet.
          </div>
          <button
            onClick={() => loadObstacles()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🎯 Priority Dashboard
          </h1>
        </div>

        <PriorityStatsCards stats={stats} />
        <PriorityFilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          stats={stats}
        />

        <div className="space-y-6">
          {filteredObstacles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-xl font-medium text-gray-600">
                No obstacles found for selected priority level.
              </div>
            </div>
          ) : (
            filteredObstacles.map((obstacle) => (
              <PriorityObstacleCard
                key={obstacle.id}
                obstacle={obstacle}
                rank={
                  prioritizedObstacles.findIndex((o) => o.id === obstacle.id) +
                  1
                }
                onVerify={handleVerify}
                onReject={handleReject}
                onRevertToPending={handleRevertToPending}
                showConfirmDialog={showConfirmDialog}
              />
            ))
          )}
        </div>

        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-600 leading-relaxed">
            <strong>
              Showing {filteredObstacles.length} of {stats.total} obstacles
            </strong>{" "}
            • Priority algorithm: Severity (40%) + Community (30%) +
            Infrastructure (20%) + Admin (10%) • 🔥 Live Firebase data from your
            mobile app
          </div>
        </div>
      </div>

      {/* Enhanced Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div
              className={`p-6 ${
                confirmAction.type === "review"
                  ? "bg-gradient-to-r from-blue-50 to-blue-100"
                  : "bg-gradient-to-r from-purple-50 to-purple-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    confirmAction.type === "review"
                      ? "bg-blue-600"
                      : "bg-purple-600"
                  } text-white text-xl`}
                >
                  {confirmAction.type === "review" ? "👁️" : "📅"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {confirmAction.type === "review"
                      ? "Mark Under Review"
                      : "Plan for Resolution"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {confirmAction.obstacleTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {confirmAction.type === "review"
                    ? "This will mark the obstacle as 'Under Review' and change its status for tracking purposes. You can revert this action later if needed."
                    : "This will mark the obstacle as 'Planned for Resolution' and change its status for tracking purposes. You can revert this action later if needed."}
                </p>
              </div>

              <div
                className={`p-4 rounded-xl ${
                  confirmAction.type === "review"
                    ? "bg-blue-50 border-l-4 border-blue-400"
                    : "bg-purple-50 border-l-4 border-purple-400"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💡</span>
                  <span
                    className={`font-medium ${
                      confirmAction.type === "review"
                        ? "text-blue-900"
                        : "text-purple-900"
                    }`}
                  >
                    {confirmAction.type === "review"
                      ? "This obstacle will be tracked as actively being reviewed by the team."
                      : "This obstacle will be added to the resolution planning queue."}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 flex space-x-3">
              <button
                onClick={handleCancelAction}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-3 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                  confirmAction.type === "review"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                }`}
              >
                {confirmAction.type === "review"
                  ? "Mark Under Review"
                  : "Plan for Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
