// src/app/test-analysis/page.tsx
// CLEAN VERSION - No duplicate identifiers or test framework conflicts!

"use client";

import { useState } from "react";
import { AdminObstacle } from "@/types/admin";

// ✅ STEP 1: Import only what we need (no duplicates!)
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

interface AnalysisResult {
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
    urgentCount: number;
  };
}

// ✅ STEP 2: Simplified Rule-Based Analysis (embedded in component)
class TestRuleBasedAnalysis {
  calculatePriorityScore(obstacle: AdminObstacle): PriorityResult {
    console.log(`🔍 Analyzing: ${obstacle.type} (${obstacle.severity})`);

    // RULE 1: Severity Impact (40%)
    const severityPoints = this.getSeverityPoints(obstacle.severity);
    console.log(`  📊 Severity: ${severityPoints} points`);

    // RULE 2: Community Validation (30%)
    const communityPoints = this.getCommunityPoints(
      obstacle.upvotes,
      obstacle.downvotes
    );
    console.log(`  👥 Community: ${communityPoints} points`);

    // RULE 3: Critical Infrastructure (20%)
    const criticalPoints = this.getCriticalPoints(obstacle.type);
    console.log(`  🏗️ Infrastructure: ${criticalPoints} points`);

    // RULE 4: Admin Verification (10%)
    const adminPoints = this.getAdminPoints(obstacle.status);
    console.log(`  ⚖️ Admin: ${adminPoints} points`);

    const score = Math.max(
      0,
      Math.min(
        100,
        severityPoints + communityPoints + criticalPoints + adminPoints
      )
    );
    const category = this.getCategory(score);

    console.log(`  🎯 Final: ${score}/100 (${category})`);

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
        "Install wheelchair-accessible ramp meeting Philippine building code standards",
      vendor_blocking:
        "Establish vendor-free walkways with designated vendor zones",
      parked_vehicles:
        "Install no-parking signs and enforce vehicle-free sidewalk zones",
      broken_pavement:
        "Repair and smooth pavement surface for safe wheelchair access",
      flooding: "Improve drainage system and install proper water management",
      no_sidewalk:
        "Construct accessible sidewalk with proper width and materials",
    };
    return (
      recommendations[type] ||
      "Investigate and implement appropriate accessibility solution"
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

  async analyzeAllObstacles(
    obstacles: AdminObstacle[]
  ): Promise<AnalysisResult> {
    console.log(`🔍 Analyzing ${obstacles.length} obstacles...`);

    const prioritizedObstacles = obstacles.map((obstacle) => ({
      ...obstacle,
      priorityResult: this.calculatePriorityScore(obstacle),
    }));

    prioritizedObstacles.sort(
      (a, b) => b.priorityResult.score - a.priorityResult.score
    );

    const total = obstacles.length;
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
    const urgentCount = critical + high;

    return {
      prioritizedObstacles,
      summary: { total, critical, high, medium, low, avgScore, urgentCount },
    };
  }
}

// ✅ STEP 3: Main Test Component
export default function TestAnalysisPage() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Create analyzer instance
  const analyzer = new TestRuleBasedAnalysis();

  // ✅ STEP 4: Sample test data
  const sampleObstacles: AdminObstacle[] = [
    {
      id: "test_critical_1",
      location: { latitude: 14.5764, longitude: 121.0851 },
      type: "stairs_no_ramp",
      severity: "blocking",
      description: "City Hall entrance - no wheelchair access",
      reportedBy: "user_wheelchair_001",
      reportedAt: new Date(Date.now() - 86400000),
      upvotes: 15,
      downvotes: 1,
      status: "verified",
      verified: true,
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: "test_high_1",
      location: { latitude: 14.565, longitude: 121.064 },
      type: "flooding",
      severity: "high",
      description: "Major flooding after rain blocks wheelchair access",
      reportedBy: "user_walker_002",
      reportedAt: new Date(Date.now() - 43200000),
      upvotes: 8,
      downvotes: 0,
      status: "pending",
      verified: false,
      createdAt: new Date(Date.now() - 43200000),
    },
    {
      id: "test_medium_1",
      location: { latitude: 14.57, longitude: 121.08 },
      type: "vendor_blocking",
      severity: "medium",
      description: "Sari-sari store taking up half the sidewalk",
      reportedBy: "user_crutches_003",
      reportedAt: new Date(Date.now() - 21600000),
      upvotes: 5,
      downvotes: 2,
      status: "pending",
      verified: false,
      createdAt: new Date(Date.now() - 21600000),
    },
    {
      id: "test_low_1",
      location: { latitude: 14.572, longitude: 121.082 },
      type: "parked_vehicles",
      severity: "low",
      description: "Motorcycle parked on sidewalk corner",
      reportedBy: "user_cane_004",
      reportedAt: new Date(Date.now() - 10800000),
      upvotes: 2,
      downvotes: 1,
      status: "pending",
      verified: false,
      createdAt: new Date(Date.now() - 10800000),
    },
  ];

  // ✅ STEP 5: Run test function
  const runTest = async () => {
    setLoading(true);
    console.log("🧪 Starting Rule-Based Analysis Test...");

    try {
      const analysisResult = await analyzer.analyzeAllObstacles(
        sampleObstacles
      );
      setResults(analysisResult);
      console.log("✅ Analysis Complete!", analysisResult);
    } catch (error) {
      console.error("❌ Analysis Error:", error);
    }

    setLoading(false);
  };

  // ✅ STEP 6: Manual verification function
  const showManualCalculation = () => {
    console.log("🧮 MANUAL CALCULATION VERIFICATION:");
    console.log("");
    console.log("📋 Test Case: stairs_no_ramp, blocking, 15↑ 1↓, verified");
    console.log("🔢 Expected Calculation:");
    console.log("  • Severity: blocking = 40 points (40% weight)");
    console.log(
      "  • Community: (15-1) × 3 = 42 → capped at 30 points (30% weight)"
    );
    console.log("  • Infrastructure: stairs_no_ramp = 20 points (20% weight)");
    console.log("  • Admin: verified = 10 points (10% weight)");
    console.log("  • Total: 40 + 30 + 20 + 10 = 100 points");
    console.log("  • Category: 100 ≥ 80 = CRITICAL ✅");
    console.log("");
    console.log("🎯 This should be the #1 priority obstacle!");
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Rule-Based Analysis Test</h1>
        <p className="text-gray-600">
          Testing the 4-factor weighted scoring algorithm with sample WAISPATH
          obstacle data
        </p>
      </div>

      <div className="flex space-x-4 mb-8">
        <button
          onClick={runTest}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "⏳ Running Analysis..." : "🚀 Run Test Analysis"}
        </button>

        <button
          onClick={showManualCalculation}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          🧮 Show Manual Calculation
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">📊 Analysis Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-100 p-4 rounded">
                <div className="text-2xl font-bold text-red-800">
                  {results.summary.critical}
                </div>
                <div className="text-red-600">Critical</div>
              </div>
              <div className="bg-orange-100 p-4 rounded">
                <div className="text-2xl font-bold text-orange-800">
                  {results.summary.high}
                </div>
                <div className="text-orange-600">High</div>
              </div>
              <div className="bg-yellow-100 p-4 rounded">
                <div className="text-2xl font-bold text-yellow-800">
                  {results.summary.medium}
                </div>
                <div className="text-yellow-600">Medium</div>
              </div>
              <div className="bg-green-100 p-4 rounded">
                <div className="text-2xl font-bold text-green-800">
                  {results.summary.low}
                </div>
                <div className="text-green-600">Low</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Average Score: {results.summary.avgScore}/100 | Urgent Items:{" "}
              {results.summary.urgentCount}
            </div>
          </div>

          {/* Priority List */}
          <div className="bg-white rounded-lg border">
            <h2 className="text-xl font-bold p-6 border-b">
              🏆 Priority Rankings
            </h2>
            <div className="divide-y">
              {results.prioritizedObstacles.map((obstacle, index) => (
                <div key={obstacle.id} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-500">
                        #{index + 1}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          obstacle.priorityResult.category === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : obstacle.priorityResult.category === "HIGH"
                            ? "bg-orange-100 text-orange-800"
                            : obstacle.priorityResult.category === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {obstacle.priorityResult.category}
                      </span>
                      <span className="font-semibold">
                        {obstacle.type.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {obstacle.priorityResult.score}/100
                    </div>
                  </div>

                  <div className="text-gray-700 mb-2">
                    {obstacle.description}
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    📍 Community: {obstacle.upvotes}↑ {obstacle.downvotes}↓ | ⚖️
                    Status: {obstacle.status} | ⏱️{" "}
                    {obstacle.priorityResult.timeframe}
                  </div>

                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <div className="font-medium text-blue-800">
                      💡 Recommendation:
                    </div>
                    <div className="text-blue-700">
                      {obstacle.priorityResult.recommendation}
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      📊 View Score Breakdown
                    </summary>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-gray-100 p-2 rounded">
                        <div className="font-medium">Severity (40%)</div>
                        <div>
                          {obstacle.priorityResult.breakdown.severityPoints} pts
                        </div>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <div className="font-medium">Community (30%)</div>
                        <div>
                          {obstacle.priorityResult.breakdown.communityPoints}{" "}
                          pts
                        </div>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <div className="font-medium">Infrastructure (20%)</div>
                        <div>
                          {obstacle.priorityResult.breakdown.criticalPoints} pts
                        </div>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <div className="font-medium">Admin (10%)</div>
                        <div>
                          {obstacle.priorityResult.breakdown.adminPoints} pts
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
