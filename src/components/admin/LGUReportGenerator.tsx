// src/components/admin/LGUReportGenerator.tsx
// FIXED: Removed unused imports and variables

"use client";

import { useState, useCallback } from "react";
import { AdminObstacle } from "@/types/admin";

// Remove unused imports:
// import { ObstacleStatus, useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";

// ✅ STEP 3A: LGU Report interfaces (unchanged)
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

interface LGUReport {
  reportId: string;
  generatedAt: Date;
  timeframe: string;
  executiveSummary: {
    totalObstacles: number;
    priorityBreakdown: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    communityEngagement: number;
    verificationRate: number;
    urgentCount: number;
  };
  topPriorities: Array<{
    obstacle: PriorityObstacle;
    evidence: string;
    legalBasis: string;
  }>;
  implementationPlan: Array<{
    category: string;
    obstacleCount: number;
    estimatedEffort: string;
    timeline: string;
    budgetCategory: string;
  }>;
  recommendations: string[];
}

// ✅ Priority calculator class (unchanged)
class ReportPriorityCalculator {
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
        "Install wheelchair-accessible ramp meeting Philippine building code standards (BP 344)",
      vendor_blocking:
        "Establish vendor-free walkways with designated vendor zones (LGU ordinance)",
      parked_vehicles:
        "Install no-parking signs and enforce vehicle-free sidewalk zones (traffic management)",
      broken_pavement:
        "Repair pavement surface for safe wheelchair navigation (infrastructure maintenance)",
      flooding:
        "Improve drainage and water management infrastructure (flood control program)",
      no_sidewalk:
        "Construct accessible sidewalk with proper materials (major infrastructure project)",
      construction:
        "Provide temporary accessible alternative route during construction (contractor requirement)",
      narrow_passage:
        "Widen walkway to meet 1.5m minimum accessibility width (building code compliance)",
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

  getLegalBasis(type: string): string {
    const legalBasis: Record<string, string> = {
      stairs_no_ramp:
        "Batas Pambansa 344 (Accessibility Law) - mandatory ramp installation",
      no_sidewalk: "Department Order 67 - pedestrian infrastructure standards",
      vendor_blocking:
        "Local Government Code - public space management authority",
      parked_vehicles:
        "Traffic Management Code - sidewalk protection enforcement",
      broken_pavement:
        "DPWH standards - infrastructure maintenance requirements",
      flooding: "Building Code - drainage and accessibility compliance",
      construction:
        "Construction permits - temporary accessibility provisions required",
      narrow_passage:
        "Building Code - minimum 1.5m accessibility width requirement",
    };
    return (
      legalBasis[type] ||
      "General accessibility guidelines and local ordinances"
    );
  }
}

// ✅ Report Preview Component (unchanged)
function ReportPreview({ report }: { report: LGUReport }) {
  return (
    <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
      <div className="text-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          ACCESSIBILITY IMPROVEMENT REPORT
        </h2>
        <p className="text-gray-600">Pasig City PWD Navigation System</p>
        <p className="text-sm text-gray-500">Report ID: {report.reportId}</p>
        <p className="text-sm text-gray-500">
          Generated: {report.generatedAt.toLocaleDateString()}
        </p>
      </div>

      {/* Executive Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          EXECUTIVE SUMMARY
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Total Accessibility Issues:</strong>{" "}
            {report.executiveSummary.totalObstacles}
          </div>
          <div>
            <strong>Community Engagement:</strong>{" "}
            {report.executiveSummary.communityEngagement} validations
          </div>
          <div>
            <strong>Verification Rate:</strong>{" "}
            {report.executiveSummary.verificationRate}%
          </div>
          <div>
            <strong>Urgent Items:</strong> {report.executiveSummary.urgentCount}{" "}
            (Critical + High)
          </div>
        </div>

        <div className="mt-3">
          <strong>Priority Breakdown:</strong>
          <div className="flex space-x-4 text-sm mt-1">
            <span className="text-red-600">
              Critical: {report.executiveSummary.priorityBreakdown.critical}
            </span>
            <span className="text-orange-600">
              High: {report.executiveSummary.priorityBreakdown.high}
            </span>
            <span className="text-yellow-600">
              Medium: {report.executiveSummary.priorityBreakdown.medium}
            </span>
            <span className="text-green-600">
              Low: {report.executiveSummary.priorityBreakdown.low}
            </span>
          </div>
        </div>
      </div>

      {/* Top Priorities */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          TOP 5 PRIORITY IMPROVEMENTS
        </h3>
        {report.topPriorities.slice(0, 5).map((item, index) => (
          <div
            key={item.obstacle.id}
            className="mb-4 border-l-4 border-blue-400 pl-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">
                  #{index + 1}{" "}
                  {item.obstacle.type.replace("_", " ").toUpperCase()}
                </h4>
                <p className="text-sm text-gray-600">
                  {item.obstacle.description}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  item.obstacle.priorityResult.category === "CRITICAL"
                    ? "bg-red-100 text-red-800"
                    : item.obstacle.priorityResult.category === "HIGH"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {item.obstacle.priorityResult.score}/100
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              <strong>Action:</strong>{" "}
              {item.obstacle.priorityResult.recommendation}
            </p>
            <p className="text-xs text-gray-500">
              <strong>Legal:</strong> {item.legalBasis}
            </p>
            <p className="text-xs text-gray-500">
              <strong>Evidence:</strong> {item.evidence}
            </p>
          </div>
        ))}
      </div>

      {/* Implementation Plan */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          IMPLEMENTATION RECOMMENDATIONS
        </h3>
        {report.implementationPlan.map((plan, index) => (
          <div key={index} className="mb-2 text-sm">
            <strong>{plan.category}:</strong> {plan.obstacleCount} items •{" "}
            {plan.timeline} • {plan.budgetCategory}
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ Main LGU Report Generator Component
export default function LGUReportGenerator() {
  const [report, setReport] = useState<LGUReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<string>("30");

  const [calculator] = useState(() => new ReportPriorityCalculator());

  // 🔧 FIXED: Simplified generate report function - removed unused Firebase hook import
  const generateReport = useCallback(async () => {
    setLoading(true);
    console.log(`📊 Generating LGU report for last ${timeframe} days...`);

    try {
      // For now, use sample data for demo purposes
      // In production, you would fetch real Firebase data here
      const sampleObstacles: AdminObstacle[] = [
        {
          id: "demo_1",
          location: { latitude: 14.5764, longitude: 121.0851 },
          type: "stairs_no_ramp",
          severity: "blocking",
          description:
            "City Hall main entrance has stairs but no wheelchair ramp",
          reportedBy: "user_wheelchair_001",
          reportedAt: new Date(Date.now() - 86400000),
          upvotes: 15,
          downvotes: 1,
          status: "verified",
          verified: true,
          createdAt: new Date(Date.now() - 86400000),
        },
        {
          id: "demo_2",
          location: { latitude: 14.575, longitude: 121.084 },
          type: "vendor_blocking",
          severity: "high",
          description: "Street vendors blocking sidewalk near market",
          reportedBy: "user_walker_002",
          reportedAt: new Date(Date.now() - 172800000),
          upvotes: 8,
          downvotes: 2,
          status: "pending",
          verified: false,
          createdAt: new Date(Date.now() - 172800000),
        },
      ];

      // Calculate priorities
      const prioritizedObstacles: PriorityObstacle[] = sampleObstacles.map(
        (obstacle) => ({
          ...obstacle,
          priorityResult: calculator.calculatePriority(obstacle),
        })
      );

      // Sort by priority score
      prioritizedObstacles.sort(
        (a, b) => b.priorityResult.score - a.priorityResult.score
      );

      // Calculate statistics
      const totalObstacles = prioritizedObstacles.length;
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
      const urgentCount = critical + high;

      const totalVotes = prioritizedObstacles.reduce(
        (sum, o) => sum + o.upvotes + o.downvotes,
        0
      );
      const verifiedCount = prioritizedObstacles.filter(
        (o) => o.status === "verified"
      ).length;
      const verificationRate = Math.round(
        (verifiedCount / totalObstacles) * 100
      );

      // Top priorities with evidence
      const topPriorities = prioritizedObstacles
        .slice(0, 10)
        .map((obstacle) => ({
          obstacle,
          evidence: `${obstacle.upvotes} community confirmations, ${obstacle.downvotes} disputes, ${obstacle.status} by admin`,
          legalBasis: calculator.getLegalBasis(obstacle.type),
        }));

      // Implementation plan
      const implementationPlan = [
        {
          category: "Quick Fix (1-30 days)",
          obstacleCount: prioritizedObstacles.filter(
            (o) => o.priorityResult.implementationCategory === "Quick Fix"
          ).length,
          estimatedEffort: "Low - Enforcement/Management",
          timeline: "Immediate deployment possible",
          budgetCategory: "Operations Budget",
        },
        {
          category: "Medium Project (1-6 months)",
          obstacleCount: prioritizedObstacles.filter(
            (o) => o.priorityResult.implementationCategory === "Medium Project"
          ).length,
          estimatedEffort: "Medium - Repairs/Modifications",
          timeline: "Schedule in next budget cycle",
          budgetCategory: "Infrastructure Maintenance",
        },
        {
          category: "Major Infrastructure (6+ months)",
          obstacleCount: prioritizedObstacles.filter(
            (o) =>
              o.priorityResult.implementationCategory === "Major Infrastructure"
          ).length,
          estimatedEffort: "High - Construction/Major Work",
          timeline: "Long-term planning required",
          budgetCategory: "Capital Expenditure",
        },
      ];

      // Generate recommendations
      const recommendations = [
        "Prioritize Critical and High priority obstacles for immediate government attention",
        "Establish regular PWD community engagement sessions for ongoing accessibility feedback",
        "Create dedicated budget allocation for accessibility improvements based on priority scores",
        "Implement systematic accessibility audits using community-validated data",
        "Develop partnerships with PWD organizations for accessibility monitoring",
        "Use priority scoring system for future infrastructure planning decisions",
      ];

      const generatedReport: LGUReport = {
        reportId: `LGU_${Date.now()}`,
        generatedAt: new Date(),
        timeframe: `${timeframe} days`,
        executiveSummary: {
          totalObstacles,
          priorityBreakdown: { critical, high, medium, low },
          communityEngagement: totalVotes,
          verificationRate,
          urgentCount,
        },
        topPriorities,
        implementationPlan,
        recommendations,
      };

      setReport(generatedReport);
      setLoading(false);

      console.log("✅ LGU Report generated successfully:", generatedReport);
    } catch (error) {
      console.error("❌ Error generating report:", error);
      setLoading(false);
    }
  }, [timeframe, calculator]);

  // Download report function (unchanged)
  const downloadReport = useCallback(() => {
    if (!report) return;

    const reportText = `
ACCESSIBILITY IMPROVEMENT REPORT
Pasig City PWD Navigation System
Report ID: ${report.reportId}
Generated: ${report.generatedAt.toLocaleDateString()}
Timeframe: Last ${report.timeframe}

EXECUTIVE SUMMARY
================
Total Accessibility Issues: ${report.executiveSummary.totalObstacles}
Community Engagement: ${report.executiveSummary.communityEngagement} validations
Verification Rate: ${report.executiveSummary.verificationRate}%
Priority Breakdown:
- Critical: ${
      report.executiveSummary.priorityBreakdown.critical
    } (immediate action required)
- High: ${report.executiveSummary.priorityBreakdown.high} (important barriers)
- Medium: ${
      report.executiveSummary.priorityBreakdown.medium
    } (planning consideration)
- Low: ${report.executiveSummary.priorityBreakdown.low} (future improvement)

TOP PRIORITY IMPROVEMENTS
==========================
${report.topPriorities
  .map(
    (item, index) => `
${index + 1}. ${item.obstacle.type.replace("_", " ").toUpperCase()} (Score: ${
      item.obstacle.priorityResult.score
    }/100)
   Location: ${item.obstacle.description}
   Recommendation: ${item.obstacle.priorityResult.recommendation}
   Legal Basis: ${item.legalBasis}
   Evidence: ${item.evidence}
   Timeline: ${item.obstacle.priorityResult.timeframe}
`
  )
  .join("")}

IMPLEMENTATION RECOMMENDATIONS
==============================
${report.implementationPlan
  .map(
    (plan) => `
${plan.category}: ${plan.obstacleCount} items
Timeline: ${plan.timeline}
Budget Category: ${plan.budgetCategory}
Effort Level: ${plan.estimatedEffort}
`
  )
  .join("")}

STRATEGIC RECOMMENDATIONS
=========================
${report.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join("\n")}

---
Report generated by WAISPATH Admin System
Priority Algorithm: Severity (40%) + Community (30%) + Infrastructure (20%) + Admin (10%)
`;

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WAISPATH_LGU_Report_${report.reportId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("📄 Report downloaded successfully");
  }, [report]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 LGU Report Generator
        </h1>
        <p className="text-gray-600">
          Generate evidence-based accessibility improvement reports for local
          government units
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Report Configuration</h2>

        <div className="flex items-center space-x-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 180 days</option>
            </select>
          </div>

          <div className="flex-1" />

          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "⏳ Generating..." : "📊 Generate Report"}
          </button>
        </div>

        {report && (
          <div className="flex space-x-2">
            <button
              onClick={downloadReport}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              📄 Download Report
            </button>
            <button
              onClick={() => window.print()}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              🖨️ Print Report
            </button>
          </div>
        )}
      </div>

      {/* Report Preview */}
      {report && (
        <div>
          <h2 className="text-xl font-semibold mb-4">📋 Report Preview</h2>
          <ReportPreview report={report} />
        </div>
      )}

      {!report && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-xl font-semibold">
            Ready to Generate LGU Report
          </div>
          <div>
            Select timeframe and click &quot;Generate Report&quot; to create
            evidence-based accessibility improvement recommendations
          </div>
        </div>
      )}
    </div>
  );
}
