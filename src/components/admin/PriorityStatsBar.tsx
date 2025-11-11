"use client";

import {
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import type { DashboardStats } from "./PriorityStatsCards";
import { StatusFilter } from "./StatusFilter"; // adjust import if needed

interface Props {
  stats: DashboardStats;
  activeStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
}

export default function StatusBarFilter({
  stats,
  activeStatus,
  onStatusChange,
}: Props) {
  const items = [
    { key: "all", label: "All", value: stats.total },
    {
      key: "pending",
      label: "Pending",
      value: stats.pending,
      icon: ClockIcon,
      color: "text-yellow-700 border-yellow-200 bg-yellow-50",
    },
    {
      key: "verified",
      label: "Under Review",
      value: stats.verified,
      icon: EyeIcon,
      color: "text-blue-700 border-blue-200 bg-blue-50",
    },
    {
      key: "resolved",
      label: "Resolved",
      value: stats.resolved,
      icon: CheckCircleIcon,
      color: "text-green-700 border-green-200 bg-green-50",
    },
    {
      key: "false_report",
      label: "Invalid",
      value: stats.false_report,
      icon: XCircleIcon,
      color: "text-gray-700 border-gray-200 bg-gray-50",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {items.map(({ key, label, value, icon: Icon, color }) => {
        const isActive = activeStatus === key;
        return (
          <button
            key={key}
            onClick={() =>
              onStatusChange(isActive ? "all" : (key as StatusFilter))
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 
              ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : `${color} hover:shadow-sm`
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4 opacity-80" />}
            <span>{label}</span>
            <span className="font-semibold">{value}</span>
          </button>
        );
      })}
    </div>
  );
}
