"use client";

import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ObstacleStatus } from "@/types/admin";

const PASIG = {
  primaryNavy: "#08345A",
  softBlue: "#2BA4FF",
  slate: "#0F172A",
  muted: "#6B7280",
  subtleBorder: "#E6EEF8",
};

export type StatusFilter = "all" | ObstacleStatus;

interface StatusFilterProps {
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  onClear: () => void;
  stats: {
    pending: number;
    verified: number;
    resolved: number;
    false_report: number;
  };
}

export default function StatusFilter({
  statusFilter,
  onStatusChange,
  onClear,
  stats,
}: StatusFilterProps) {
  const hasActiveFilter = statusFilter !== "all";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
      {/* Left side: Label + Select */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          Review Status:
        </span>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
            className="appearance-none text-sm font-medium px-3 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
            style={{
              backgroundColor:
                statusFilter !== "all" ? `${PASIG.softBlue}10` : "white",
              borderColor:
                statusFilter !== "all" ? PASIG.softBlue : PASIG.subtleBorder,
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review ({stats.pending})</option>
            <option value="verified">Under Review ({stats.verified})</option>
            <option value="resolved">
              Fixed / Resolved ({stats.resolved})
            </option>
            <option value="false_report">Invalid ({stats.false_report})</option>
          </select>

          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Right side: Clear button */}
      {hasActiveFilter && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-all"
        >
          <XMarkIcon className="h-4 w-4" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
