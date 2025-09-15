// src/components/admin/PriorityStatsCards.tsx
// Separated stats cards component with original styling

"use client";

export interface DashboardStats {
  total: number;
  resolved: number;
  high: number;
  medium: number;
  low: number;
  urgentCount: number;
  avgScore: number;
}

interface PriorityStatsCardsProps {
  stats: DashboardStats;
}

export default function PriorityStatsCards({ stats }: PriorityStatsCardsProps) {
  const statCards = [
    {
      label: "Resolved",
      count: stats.resolved,
      textColor: "text-green-700",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      borderColor: "border-green-200",
      description: "Successfully addressed",
    },
    {
      label: "High Priority",
      count: stats.high,
      textColor: "text-orange-700",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      description: "Address within weeks",
    },
    {
      label: "Medium Priority",
      count: stats.medium,
      textColor: "text-blue-700",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      description: "Schedule for planning",
    },
    {
      label: "Low Priority",
      count: stats.low,
      textColor: "text-gray-700",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
      borderColor: "border-gray-200",
      description: "Monitor and review",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map(
        ({ label, count, textColor, bgColor, borderColor, description }) => (
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
