// src/lib/priority/PriorityCalculator.ts
// UPDATED: Support for new 6 obstacle types (vendor_blocking, parked_vehicles, construction, broken_infrastructure, debris, other)
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

  // ============================================
  // SCORING METHODS (UNCHANGED LOGIC)
  // ============================================

  /**
   * Get severity points based on obstacle severity level
   * Max: 40 points
   */
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

  /**
   * Get community validation points based on upvotes/downvotes
   * Max: 30 points
   */
  private getCommunityPoints(upvotes: number, downvotes: number): number {
    const netVotes = (upvotes || 0) - (downvotes || 0);
    const points = Math.max(0, Math.min(30, netVotes * 5));
    console.log(
      `Community points (${upvotes} up, ${downvotes} down): ${points}`
    );
    return points;
  }

  /**
   * Get critical type points based on obstacle type
   * Max: 20 points
   *
   * UPDATED: New 6-type classification based on Philippine accessibility context
   */
  private getCriticalPoints(type: ObstacleType): number {
    const criticalTypes: Partial<Record<ObstacleType, number>> = {
      // Tier 1: Critical Infrastructure Barriers (20 points)
      construction: 20,
      broken_infrastructure: 20,

      // Tier 2: Significant Accessibility Barriers (10 points)
      parked_vehicles: 10,

      // Tier 3: Moderate Barriers (5 points)
      vendor_blocking: 5,
      debris: 5,

      // Tier 4: General Obstacles (0 points)
      other: 0,
    };

    const points = criticalTypes[type] ?? 0;
    console.log(`Critical points for ${type}: ${points}`);
    return points;
  }

  /**
   * Get admin verification points based on obstacle status
   * Max: 10 points (verified), Min: -50 points (false report)
   */
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

  /**
   * Convert score to priority category
   */
  private getCategory(score: number): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  // ============================================
  // RECOMMENDATION METHODS (UPDATED FOR NEW TYPES)
  // ============================================

  /**
   * Get specific recommendation for each obstacle type
   * UPDATED: New recommendations for 6 obstacle types
   */
  private getRecommendation(type: ObstacleType): string {
    // FIXED: Using Partial<Record> to handle only the 6 active types
    const recommendations: Partial<Record<ObstacleType, string>> = {
      construction:
        "Require accessible temporary pathways during construction; enforce contractor compliance with accessibility standards; coordinate with DPWH for proper detour signage",

      broken_infrastructure:
        "Immediate repair of damaged ramps, sidewalks, and accessibility features; conduct structural assessment; ensure compliance with Philippine Building Code (BP 344) accessibility requirements",

      parked_vehicles:
        "Implement strict parking enforcement with fines; install physical barriers (bollards) to prevent vehicle access on sidewalks; deploy regular traffic enforcement patrols; public education campaign on sidewalk protection",

      vendor_blocking:
        "Establish clearly marked vendor-free walkways with designated vendor zones; community engagement and consultation with vendor associations; provide alternative vending areas; enforcement with compassion and economic support programs",

      debris:
        "Schedule regular street cleaning and maintenance; install additional waste bins at strategic locations; implement community cleanup programs; enforce anti-littering ordinances; improve waste collection schedules",

      other:
        "Conduct detailed on-site assessment to identify specific barrier type; consult with PWD community for impact evaluation; implement appropriate accessibility solution based on findings; document for future classification",
    };

    // Return the recommendation or a default message
    return (
      recommendations[type] ??
      "Assess specific accessibility barriers and implement appropriate solution"
    );
  }

  /**
   * Get implementation category based on complexity and resources required
   * UPDATED: New categorization for 6 obstacle types
   */
  private getImplementationCategory(
    type: ObstacleType
  ): "Quick Fix" | "Medium Project" | "Major Infrastructure" {
    const quickFix: ObstacleType[] = ["vendor_blocking", "debris"];
    const majorInfra: ObstacleType[] = [
      "construction",
      "broken_infrastructure",
    ];

    if (quickFix.includes(type)) return "Quick Fix";
    if (majorInfra.includes(type)) return "Major Infrastructure";
    return "Medium Project";
  }

  /**
   * Get implementation timeframe based on category
   * FIXED: Proper typing for timeframes object
   */
  private getTimeframe(type: ObstacleType): string {
    const category = this.getImplementationCategory(type);

    // FIXED: Explicit type annotation
    const timeframes: {
      "Quick Fix": string;
      "Medium Project": string;
      "Major Infrastructure": string;
    } = {
      "Quick Fix": "1-30 days (enforcement and management actions)",
      "Medium Project": "1-6 months (enforcement with physical interventions)",
      "Major Infrastructure": "6+ months (construction and major repair work)",
    };

    return timeframes[category];
  }
}
