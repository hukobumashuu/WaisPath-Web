// src/components/admin/AdminFilters.tsx
// Admin filters component

"use client";

import React from "react";

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
  return (
    <div
      className="mb-6 p-4 rounded-xl border"
      style={{ backgroundColor: PASIG.card, borderColor: PASIG.subtleBorder }}
    >
      <div className="flex flex-wrap gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: PASIG.slate }}
          >
            Role
          </label>
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="lgu_admin">LGU Admin</option>
            <option value="field_admin">Field Admin</option>
          </select>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: PASIG.slate }}
          >
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>
    </div>
  );
}
