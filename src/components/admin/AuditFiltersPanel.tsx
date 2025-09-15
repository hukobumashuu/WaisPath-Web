// src/components/admin/AuditFiltersPanel.tsx
// Modern filters panel for audit logs

"use client";

import React from "react";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";

const PASIG = {
  primaryNavy: "#08345A",
  softBlue: "#2BA4FF",
  slate: "#0F172A",
  muted: "#6B7280",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  subtleBorder: "#E6EEF8",
};

interface FilterState {
  adminEmail: string;
  action: string;
  targetType: string;
  source: string;
  startDate: string;
  endDate: string;
  search: string;
}

interface AuditFiltersPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  show: boolean;
  onToggle: () => void;
}

export default function AuditFiltersPanel({
  filters,
  setFilters,
  onSubmit,
  onReset,
  show,
  onToggle,
}: AuditFiltersPanelProps) {
  const filterOptions = {
    actions: [
      { value: "", label: "All Actions" },
      { value: "obstacle_verified", label: "Obstacle Verified" },
      { value: "obstacle_rejected", label: "Obstacle Rejected" },
      { value: "obstacle_resolved", label: "Obstacle Resolved" },
      { value: "admin_created", label: "Admin Created" },
      { value: "priority_obstacle_verified", label: "Priority: Verified" },
      { value: "priority_obstacle_rejected", label: "Priority: Rejected" },
      { value: "admin_signin_web", label: "Web Sign In" },
      { value: "admin_signout_web", label: "Web Sign Out" },
      { value: "mobile_admin_signin", label: "Mobile Sign In" },
      { value: "mobile_admin_signout", label: "Mobile Sign Out" },
      { value: "mobile_obstacle_report", label: "Mobile Report" },
    ],
    sources: [
      { value: "", label: "All Sources" },
      { value: "web_portal", label: "Web Portal" },
      { value: "mobile_app", label: "Mobile App" },
    ],
    targetTypes: [
      { value: "", label: "All Targets" },
      { value: "obstacle", label: "Obstacle" },
      { value: "admin", label: "Admin" },
      { value: "user", label: "User" },
      { value: "system", label: "System" },
    ],
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <div className="mb-6">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 hover:shadow-md"
          style={{
            borderColor: show ? PASIG.softBlue : PASIG.subtleBorder,
            backgroundColor: show ? `${PASIG.softBlue}10` : PASIG.card,
            color: show ? PASIG.softBlue : PASIG.slate,
          }}
        >
          <FunnelIcon className="h-5 w-5" />
          <span className="font-medium">
            {show ? "Hide Filters" : "Show Filters"}
          </span>
          {hasActiveFilters && (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: PASIG.softBlue,
                color: "white",
              }}
            >
              {Object.values(filters).filter((v) => v !== "").length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
            style={{ color: PASIG.muted }}
          >
            <XMarkIcon className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {show && (
        <div
          className="rounded-2xl p-6 shadow-sm border"
          style={{
            backgroundColor: PASIG.card,
            borderColor: PASIG.subtleBorder,
          }}
        >
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Admin Email */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: PASIG.slate }}
                >
                  Admin Email
                </label>
                <input
                  type="text"
                  value={filters.adminEmail}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      adminEmail: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-900 placeholder-gray-500"
                  style={{
                    borderColor: PASIG.subtleBorder,
                    backgroundColor: PASIG.card,
                  }}
                  placeholder="Filter by email"
                />
              </div>

              {/* Action */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: PASIG.slate }}
                >
                  Action Type
                </label>
                <select
                  value={filters.action}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, action: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-900"
                  style={{
                    borderColor: PASIG.subtleBorder,
                    backgroundColor: PASIG.card,
                  }}
                >
                  {filterOptions.actions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: PASIG.slate }}
                >
                  Source
                </label>
                <select
                  value={filters.source}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, source: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-900"
                  style={{
                    borderColor: PASIG.subtleBorder,
                    backgroundColor: PASIG.card,
                  }}
                >
                  {filterOptions.sources.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Type */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: PASIG.slate }}
                >
                  Target Type
                </label>
                <select
                  value={filters.targetType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      targetType: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-900"
                  style={{
                    borderColor: PASIG.subtleBorder,
                    backgroundColor: PASIG.card,
                  }}
                >
                  {filterOptions.targetTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-base font-semibold mb-2 tracking-wide"
                  style={{
                    color: PASIG.slate,
                    textShadow: "0 1px 0 rgba(0,0,0,0.04)",
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  aria-label="Start date filter"
                  title="Start date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
                  style={{ borderColor: PASIG.subtleBorder }}
                />
              </div>

              <div>
                <label
                  className="block text-base font-semibold mb-2 tracking-wide"
                  style={{
                    color: PASIG.slate,
                    textShadow: "0 1px 0 rgba(0,0,0,0.04)",
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  aria-label="End date filter"
                  title="End date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
                  style={{ borderColor: PASIG.subtleBorder }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onReset}
                className="px-6 py-3 rounded-xl border font-medium transition-colors"
                style={{
                  borderColor: PASIG.subtleBorder,
                  color: PASIG.muted,
                }}
              >
                Reset Filters
              </button>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg"
                style={{ backgroundColor: PASIG.softBlue }}
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
