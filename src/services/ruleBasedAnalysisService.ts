// src/services/ruleBasedAnalysisService.ts
// STEP 1: Core Rule-Based Analysis Service for WAISPATH Admin Dashboard

import {
  AdminObstacle,
  ObstacleType,
  ObstacleSeverity,
  ObstacleStatus,
} from "../types/admin";

// ✅ STEP 1A: Define the result interfaces
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

export interface AnalysisResult {
  prioritizedObstacles: Array<
    AdminObstacle & { priorityResult: PriorityResult }
  >;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    avgScore: number;
    urgentCount: number; // CRITICAL + HIGH
  };
}

// ✅ STEP 1B: Main Rule-Based Analysis Service
export class RuleBasedAnalysisService {
  /**
   * 🎯 CORE METHOD: Calculate priority score using 4-factor weighted system
   */
  calculatePriorityScore(obstacle: AdminObstacle): PriorityResult {
    console.log(
      `🔍 Analyzing obstacle: ${obstacle.type} (${obstacle.severity})`
    );

    // RULE 1: Severity Impact (Weight: 40%)
    const severityPoints = this.getSeverityPoints(obstacle.severity);
    console.log(
      `  📊 Severity: ${obstacle.severity} = ${severityPoints} points`
    );

    // RULE 2: Community Validation (Weight: 30%)
    const communityPoints = this.getCommunityPoints(
      obstacle.upvotes,
      obstacle.downvotes
    );
    console.log(
      `  👥 Community: ${obstacle.upvotes}↑ ${obstacle.downvotes}↓ = ${communityPoints} points`
    );

    // RULE 3: Critical Infrastructure (Weight: 20%)
    const criticalPoints = this.getCriticalInfrastructurePoints(obstacle.type);
    console.log(
      `  🏗️ Infrastructure: ${obstacle.type} = ${criticalPoints} points`
    );

    // RULE 4: Admin Verification (Weight: 10%)
    const adminPoints = this.getAdminVerificationPoints(obstacle.status);
    console.log(`  ⚖️ Admin: ${obstacle.status} = ${adminPoints} points`);

    // Calculate final score
    const score =
      severityPoints + communityPoints + criticalPoints + adminPoints;
    const boundedScore = Math.max(0, Math.min(100, score));

    console.log(`  🎯 Final Score: ${boundedScore}/100`);

    // Assign priority category
    const category = this.getPriorityCategory(boundedScore);
    console.log(`  🏷️ Category: ${category}`);

    // Generate specific recommendation
    const recommendation = this.generateRecommendation(obstacle);

    // Determine implementation details
    const implementationCategory = this.getImplementationCategory(
      obstacle.type
    );
    const timeframe = this.getImplementationTimeframe(implementationCategory);

    return {
      score: boundedScore,
      category,
      recommendation,
      implementationCategory,
      timeframe,
      breakdown: {
        severityPoints,
        communityPoints,
        criticalPoints,
        adminPoints,
      },
    };
  }

  // ✅ STEP 1C: RULE 1 - Severity Impact (40% weight)
  private getSeverityPoints(severity: ObstacleSeverity): number {
    const severityMapping = {
      blocking: 40, // 100 * 0.4 = 40 points (complete barrier)
      high: 30, // 75 * 0.4 = 30 points (significant difficulty)
      medium: 20, // 50 * 0.4 = 20 points (moderate challenge)
      low: 10, // 25 * 0.4 = 10 points (minor inconvenience)
    };

    return severityMapping[severity] || 0;
  }

  // ✅ STEP 1D: RULE 2 - Community Validation (30% weight)
  private getCommunityPoints(upvotes: number, downvotes: number): number {
    const netSupport = upvotes - downvotes;

    // Each net upvote = 3 points (up to 30 max from this rule)
    // Examples:
    // - 10 upvotes, 0 downvotes = 30 points (max)
    // - 8 upvotes, 1 downvote = 21 points
    // - 5 upvotes, 2 downvotes = 9 points
    // - 2 upvotes, 3 downvotes = 0 points (negative community support)

    const points = Math.max(0, netSupport * 3);
    return Math.min(30, points); // Cap at 30 points
  }

  private getCriticalInfrastructurePoints(type: ObstacleType): number {
    const criticalTypes: Record<ObstacleType, number> = {
      vendor_blocking: 0,
      parked_vehicles: 0,
      construction: 15,
      electrical_post: 0,
      no_sidewalk: 20,
      flooding: 15,
      stairs_no_ramp: 20,
      narrow_passage: 0,
      broken_infrastructure: 10, // new: infrastructure damage gets moderate points
      debris: 0, // new: debris is important but not infrastructure failure
      steep_slope: 0,
      other: 0,
    };

    return criticalTypes[type] ?? 0;
  }

  // ✅ STEP 1F: RULE 4 - Admin Verification (10% weight)
  private getAdminVerificationPoints(status: ObstacleStatus): number {
    const statusMapping = {
      verified: 10, // Government has confirmed this obstacle exists
      pending: 5, // Under government review (partial points)
      resolved: 0, // Already addressed by government
      false_report: 0, // Determined to be invalid
    };

    return statusMapping[status] || 5; // Default to pending if unknown status
  }

  // ✅ STEP 1G: Priority categorization
  private getPriorityCategory(
    score: number
  ): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
    // Based on flowchart thresholds
    if (score >= 80) return "CRITICAL"; // Immediate government attention
    if (score >= 60) return "HIGH"; // Important accessibility barrier
    if (score >= 40) return "MEDIUM"; // Should be addressed in planning
    return "LOW"; // Minor issue for future consideration
  }

  // ✅ STEP 1H: Generate specific recommendations
  private generateRecommendation(obstacle: AdminObstacle): string {
    const recommendations: Record<ObstacleType, string> = {
      stairs_no_ramp:
        "Install wheelchair-accessible ramp meeting Philippine building code standards (BP 344 compliance)",
      vendor_blocking:
        "Establish vendor-free walkways with designated vendor zones (enforcement + urban planning)",
      parked_vehicles:
        "Install no-parking signs and enforce vehicle-free sidewalk zones (traffic management)",
      broken_infrastructure:
        "Repair damaged infrastructure (pavement, curbs) to provide smooth, level surfaces for wheelchair access",
      no_sidewalk:
        "Construct accessible sidewalk with proper width and surface materials (major infrastructure)",
      construction:
        "Provide temporary accessible alternative route during construction period (construction management)",
      flooding:
        "Improve drainage system and install proper water management infrastructure (flood control)",
      narrow_passage:
        "Widen walkway to meet minimum accessibility width requirements (1.5m minimum)",
      electrical_post:
        "Relocate utility obstacles to maintain clear pedestrian path (utility coordination)",
      debris:
        "Clear debris and schedule regular street cleaning; consider trash bins and signage",
      steep_slope:
        "Install accessibility ramps or provide alternative accessible route",
      other:
        "Investigate obstacle details and implement appropriate accessibility solution",
    };

    return recommendations[obstacle.type] ?? recommendations.other;
  }

  // ✅ STEP 1I: Implementation categorization
  private getImplementationCategory(
    type: ObstacleType
  ): "Quick Fix" | "Medium Project" | "Major Infrastructure" {
    // Based on typical implementation complexity and time requirements
    const quickFix = ["vendor_blocking", "parked_vehicles"]; // Enforcement/management
    const majorInfrastructure = [
      "no_sidewalk",
      "stairs_no_ramp",
      "construction",
      "flooding",
    ]; // Major construction

    if (quickFix.includes(type)) return "Quick Fix";
    if (majorInfrastructure.includes(type)) return "Major Infrastructure";
    return "Medium Project"; // Everything else (repairs, minor modifications)
  }

  // ✅ STEP 1J: Implementation timeframes
  private getImplementationTimeframe(
    category: "Quick Fix" | "Medium Project" | "Major Infrastructure"
  ): string {
    const timeframes = {
      "Quick Fix": "1-30 days (enforcement/management)",
      "Medium Project": "1-6 months (repairs/modifications)",
      "Major Infrastructure": "6+ months (construction/major work)",
    };

    return timeframes[category];
  }

  // ✅ STEP 1K: Analyze multiple obstacles
  async analyzeAllObstacles(
    obstacles: AdminObstacle[]
  ): Promise<AnalysisResult> {
    console.log(`🔍 Starting analysis of ${obstacles.length} obstacles...`);

    // Calculate priority for each obstacle
    const prioritizedObstacles = obstacles.map((obstacle) => {
      const priorityResult = this.calculatePriorityScore(obstacle);
      console.log(
        `✅ ${obstacle.type}: ${priorityResult.score} (${priorityResult.category})`
      );

      return {
        ...obstacle,
        priorityResult,
      };
    });

    // Sort by priority score (highest first)
    prioritizedObstacles.sort(
      (a, b) => b.priorityResult.score - a.priorityResult.score
    );

    // Generate summary statistics
    const total = prioritizedObstacles.length;
    const critical = prioritizedObstacles.filter(
      (o) => o.priorityResult.category === "CRITICAL"
    ).length;
    const high = prioritizedObstacles.filter(
      (o) => o.priorityResult.category === "HIGH"
    ).length;
    const medium = prioritizedObstacles.filter(
      (o) => o.priorityResult.category === "MEDIUM"
    ).length;
    const low = prioritizedObstacles.filter(
      (o) => o.priorityResult.category === "LOW"
    ).length;

    const totalScore = prioritizedObstacles.reduce(
      (sum, o) => sum + o.priorityResult.score,
      0
    );
    const avgScore = total > 0 ? Math.round(totalScore / total) : 0;
    const urgentCount = critical + high; // CRITICAL + HIGH need urgent attention

    const summary = {
      total,
      critical,
      high,
      medium,
      low,
      avgScore,
      urgentCount,
    };

    console.log(`📊 Analysis Summary:`, summary);

    return { prioritizedObstacles, summary };
  }

  // ✅ STEP 1L: Test with sample data
  async testWithSampleData(): Promise<void> {
    console.log(`🧪 Testing Rule-Based Analysis with sample data...`);

    // Sample obstacle data matching your AdminObstacle interface
    const sampleObstacles: AdminObstacle[] = [
      {
        id: "test_1",
        location: { latitude: 14.5764, longitude: 121.0851 },
        type: "stairs_no_ramp",
        severity: "blocking",
        description: "City Hall entrance has stairs but no wheelchair ramp",
        reportedBy: "user_001",
        reportedAt: new Date(),
        upvotes: 15,
        downvotes: 1,
        status: "verified",
        verified: true,
        createdAt: new Date(),
        // computed getter required by AdminObstacle interface
        get validationCount() {
          return (this.upvotes || 0) + (this.downvotes || 0);
        },
      },
      {
        id: "test_2",
        location: { latitude: 14.565, longitude: 121.064 },
        type: "vendor_blocking",
        severity: "medium",
        description: "Sari-sari store blocking half of sidewalk",
        reportedBy: "user_002",
        reportedAt: new Date(),
        upvotes: 5,
        downvotes: 2,
        status: "pending",
        verified: false,
        createdAt: new Date(),
        get validationCount() {
          return (this.upvotes || 0) + (this.downvotes || 0);
        },
      },
      {
        id: "test_3",
        location: { latitude: 14.57, longitude: 121.08 },
        // use the new type name instead of removed 'broken_pavement'
        type: "broken_infrastructure",
        severity: "high",
        description: "Large potholes making wheelchair passage dangerous",
        reportedBy: "user_003",
        reportedAt: new Date(),
        upvotes: 8,
        downvotes: 0,
        status: "verified",
        verified: true,
        createdAt: new Date(),
        get validationCount() {
          return (this.upvotes || 0) + (this.downvotes || 0);
        },
      },
    ];

    // Run analysis
    const result = await this.analyzeAllObstacles(sampleObstacles);

    console.log(`\n🎯 TEST RESULTS:`);
    console.log(`📊 Summary:`, result.summary);
    console.log(`\n🏆 Top Priority Obstacles:`);

    result.prioritizedObstacles.slice(0, 3).forEach((obstacle, index) => {
      console.log(
        `${index + 1}. ${obstacle.type} (Score: ${
          obstacle.priorityResult.score
        }, ${obstacle.priorityResult.category})`
      );
      console.log(
        `   Recommendation: ${obstacle.priorityResult.recommendation}`
      );
      console.log(`   Timeline: ${obstacle.priorityResult.timeframe}\n`);
    });
  }
}

// ✅ STEP 1M: Export singleton instance
export const ruleBasedAnalysisService = new RuleBasedAnalysisService();

// ✅ STEP 1N: Export for testing
export const testRuleBasedAnalysis = async () => {
  await ruleBasedAnalysisService.testWithSampleData();
};
