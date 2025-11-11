// src/components/admin/PriorityStatsCards.tsx
// MODIFIED: Cards now show Status (Pending, Verified, etc.) instead of Priority

"use client";

export interface DashboardStats {
  total: number;
  resolved: number;
  high: number; // Kept for logic
  medium: number; // Kept for logic
  low: number; // Kept for logic
  urgentCount: number;
  avgScore: number;
  // NEW: Add specific status counts for the new cards
  pending: number;
  verified: number;
  false_report: number;
}

interface PriorityStatsCardsProps {
  stats: DashboardStats;
}

export default function PriorityStatsCards({ stats }: PriorityStatsCardsProps) {
  const statCards = [
    {
      label: "Pending Review",
      count: stats.pending,
      textColor: "text-yellow-700",
      bgColor: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      description: "New reports awaiting review",
      status: "pending",
    },
    {
      label: "Under Review",
      count: stats.verified,
      textColor: "text-blue-700",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      description: "Confirmed and being processed",
      status: "verified",
    },
    {
      label: "Fixed / Resolved",
      count: stats.resolved,
      textColor: "text-green-700",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      borderColor: "border-green-200",
      description: "Successfully addressed",
      status: "resolved",
    },
    {
      label: "Invalid / False",
      count: stats.false_report,
      textColor: "text-gray-700",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
      borderColor: "border-gray-200",
      description: "Marked as false reports",
      status: "false_report",
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
          description,
          status,
        }) => (
          <div
            key={label}
            className={`${bgColor} ${borderColor} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 relative overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 opacity-10 rounded-full bg-white"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
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
                    status === "resolved"
                      ? "bg-green-500"
                      : status === "pending"
                      ? "bg-yellow-500"
                      : status === "verified"
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
