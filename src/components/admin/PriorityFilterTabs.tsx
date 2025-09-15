// src/components/admin/PriorityFilterTabs.tsx
// Separated filter tabs component with original styling

"use client";

import { DashboardStats } from "./PriorityStatsCards";

interface PriorityFilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  stats: DashboardStats;
}

export default function PriorityFilterTabs({
  activeFilter,
  onFilterChange,
  stats,
}: PriorityFilterTabsProps) {
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

  console.log(`🎛️ Filter tabs rendered with active filter: ${activeFilter}`, {
    availableTabs: tabs.map((tab) => ({ id: tab.id, count: tab.count })),
    currentStats: stats,
  });

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <nav className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                console.log(
                  `🎯 Filter changed from ${activeFilter} to ${tab.id}`
                );
                onFilterChange(tab.id);
              }}
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
