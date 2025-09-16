// src/components/admin/AdminFilters.tsx
// COMPLETELY REDESIGNED: Modern filter component with proper Pasig City styling

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

interface AdminFiltersProps {
  roleFilter: string;
  statusFilter: string;
  onRoleFilterChange: (role: string) => void;
  onStatusFilterChange: (status: string) => void;
}

export default function AdminFilters({
  roleFilter,
  statusFilter,
  onRoleFilterChange,
  onStatusFilterChange,
}: AdminFiltersProps) {
  const hasActiveFilters = roleFilter || statusFilter;

  const handleClearFilters = () => {
    onRoleFilterChange("");
    onStatusFilterChange("");
  };

  return (
    <div className="mb-6">
      {/* Filter Header with Active Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${PASIG.softBlue}15` }}
          >
            <FunnelIcon className="h-5 w-5" style={{ color: PASIG.softBlue }} />
          </div>
          <div>
            <h3
              className="text-lg font-semibold"
              style={{ color: PASIG.slate }}
            >
              Filter Admins
            </h3>
            <p className="text-sm" style={{ color: PASIG.muted }}>
              Refine your admin account search
            </p>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
            style={{ color: PASIG.muted }}
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Modern Filter Card */}
      <div
        className="rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md"
        style={{
          backgroundColor: PASIG.card,
          borderColor: PASIG.subtleBorder,
        }}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role Filter */}
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold tracking-wide"
                style={{
                  color: PASIG.slate,
                  textShadow: "0 1px 0 rgba(0,0,0,0.04)",
                }}
              >
                Admin Role
              </label>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => onRoleFilterChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 cursor-pointer appearance-none bg-white"
                  style={{
                    borderColor: roleFilter
                      ? PASIG.softBlue
                      : PASIG.subtleBorder,
                    color: PASIG.slate,
                    backgroundColor: roleFilter
                      ? `${PASIG.softBlue}05`
                      : PASIG.card,
                  }}
                >
                  <option value="" style={{ color: PASIG.muted }}>
                    All Roles
                  </option>
                  <option value="super_admin" style={{ color: PASIG.slate }}>
                    Super Admin
                  </option>
                  <option value="lgu_admin" style={{ color: PASIG.slate }}>
                    LGU Admin
                  </option>
                  <option value="field_admin" style={{ color: PASIG.slate }}>
                    Field Admin
                  </option>
                </select>

                {/* Custom Dropdown Arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-4 w-4"
                    style={{ color: roleFilter ? PASIG.softBlue : PASIG.muted }}
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

              {roleFilter && (
                <p
                  className="text-xs font-medium"
                  style={{ color: PASIG.softBlue }}
                >
                  Filtering by: {getRoleDisplayName(roleFilter)}
                </p>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold tracking-wide"
                style={{
                  color: PASIG.slate,
                  textShadow: "0 1px 0 rgba(0,0,0,0.04)",
                }}
              >
                Account Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 cursor-pointer appearance-none bg-white"
                  style={{
                    borderColor: statusFilter
                      ? PASIG.softBlue
                      : PASIG.subtleBorder,
                    color: PASIG.slate,
                    backgroundColor: statusFilter
                      ? `${PASIG.softBlue}05`
                      : PASIG.card,
                  }}
                >
                  <option value="" style={{ color: PASIG.muted }}>
                    All Status
                  </option>
                  <option value="active" style={{ color: PASIG.slate }}>
                    Active Accounts
                  </option>
                  <option value="deactivated" style={{ color: PASIG.slate }}>
                    Deactivated Accounts
                  </option>
                </select>

                {/* Custom Dropdown Arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-4 w-4"
                    style={{
                      color: statusFilter ? PASIG.softBlue : PASIG.muted,
                    }}
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

              {statusFilter && (
                <p
                  className="text-xs font-medium"
                  style={{ color: PASIG.softBlue }}
                >
                  Showing: {getStatusDisplayName(statusFilter)} accounts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Summary Bar */}
        {hasActiveFilters && (
          <div
            className="px-6 py-4 border-t rounded-b-2xl"
            style={{
              backgroundColor: `${PASIG.softBlue}08`,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span
                  className="text-sm font-medium"
                  style={{ color: PASIG.slate }}
                >
                  Active Filters:
                </span>
                <div className="flex items-center space-x-2">
                  {roleFilter && (
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: PASIG.softBlue,
                        color: "white",
                      }}
                    >
                      {getRoleDisplayName(roleFilter)}
                    </span>
                  )}
                  {statusFilter && (
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor:
                          statusFilter === "active"
                            ? PASIG.success
                            : PASIG.warning,
                        color: "white",
                      }}
                    >
                      {getStatusDisplayName(statusFilter)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for display names
function getRoleDisplayName(role: string): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "lgu_admin":
      return "LGU Admin";
    case "field_admin":
      return "Field Admin";
    default:
      return role;
  }
}

function getStatusDisplayName(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "deactivated":
      return "Deactivated";
    default:
      return status;
  }
}
