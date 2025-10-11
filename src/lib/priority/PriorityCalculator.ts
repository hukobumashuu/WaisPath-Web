// src/lib/priority/PriorityCalculator.ts
// Separated priority calculation logic for better maintainability

import {
  AdminObstacle,
  ObstacleStatus,
  ObstacleType,
  ObstacleSeverity,
} from "@/types/admin";

export interface PriorityResult {
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

export interface PriorityObstacle extends AdminObstacle {
  priorityResult: PriorityResult;
}

export class PriorityCalculator {
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

    // Log priority calculation for debugging
    console.log(`🔥 Priority calculated for obstacle ${obstacle.id}:`, {
      score,
      category,
      breakdown: {
        severityPoints,
        communityPoints,
        criticalPoints,
        adminPoints,
      },
      obstacleType: obstacle.type,
      obstacleStatus: obstacle.status,
    });

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

  // tightened typing to ObstacleSeverity for clarity
  private getSeverityPoints(severity: ObstacleSeverity): number {
    const severityMap: Record<ObstacleSeverity, number> = {
      low: 10,
      medium: 20,
      high: 30,
      blocking: 40,
    };
    const points = severityMap[severity] ?? 0;
    console.log(`Severity points for ${severity}: ${points}`);
    return points;
  }

  private getCommunityPoints(upvotes: number, downvotes: number): number {
    const netVotes = (upvotes || 0) - (downvotes || 0);
    const points = Math.max(0, Math.min(30, netVotes * 5));
    console.log(
      `Community points (${upvotes} up, ${downvotes} down): ${points}`
    );
    return points;
  }

  private getCriticalPoints(type: ObstacleType): number {
    const criticalTypes: ObstacleType[] = [
      "no_sidewalk",
      "stairs_no_ramp",
      "flooding",
    ];
    const points = criticalTypes.includes(type) ? 20 : 0;
    console.log(`Critical points for ${type}: ${points}`);
    return points;
  }

  private getAdminPoints(status: ObstacleStatus): number {
    const statusPoints: Record<ObstacleStatus, number> = {
      pending: 0,
      verified: 10,
      resolved: -20,
      false_report: -50,
    };
    const points = statusPoints[status] || 0;
    console.log(`Admin points for ${status}: ${points}`);
    return points;
  }

  private getCategory(score: number): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  private getRecommendation(type: ObstacleType): string {
    // Use Record<ObstacleType, string> so every ObstacleType is covered at compile time
    const recommendations: Record<ObstacleType, string> = {
      vendor_blocking:
        "Coordinate with local authorities for vendor management",
      parked_vehicles: "Implement parking enforcement and signage",
      construction: "Require accessible temporary pathways during construction",
      electrical_post: "Relocate or mark pole with tactile indicators",
      // removed tree_roots (no longer in types) — replaced by generic guidance
      no_sidewalk: "Construct accessible sidewalk with proper curb cuts",
      flooding: "Improve drainage and install accessible walkways",
      stairs_no_ramp: "Install compliant accessibility ramp",
      narrow_passage: "Widen pathway to minimum accessible width",
      // replaced broken_pavement -> broken_infrastructure guidance
      broken_infrastructure: "Repair broken infrastructure for smooth surfaces",
      steep_slope: "Install ramp or alternative accessible route",
      other:
        "Assess specific accessibility barriers and implement appropriate solution",
      // newly added 'debris' handling
      debris: "Clear debris and install regular street cleaning schedules",
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
    const timeframes: Record<
      "Quick Fix" | "Medium Project" | "Major Infrastructure",
      string
    > = {
      "Quick Fix": "1-30 days (enforcement/management)",
      "Medium Project": "1-6 months (repairs/modifications)",
      "Major Infrastructure": "6+ months (construction/major work)",
    };
    return timeframes[category];
  }
}
