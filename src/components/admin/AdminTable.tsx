// src/components/admin/AdminTable.tsx
// Admin table component with actions

"use client";

import React from "react";
import {
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  PowerIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

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

interface AdminAccount {
  id: string;
  email: string;
  displayName?: string;
  role: "super_admin" | "lgu_admin" | "field_admin";
  status: "active" | "deactivated";
  createdBy: string;
  createdAt: Date;
  lastActiveAt?: Date;
  permissions: string[];
  metadata?: {
    phoneNumber?: string;
    department?: string;
    notes?: string;
  };
}

interface AdminTableProps {
  admins: AdminAccount[];
  processingIds: Set<string>;
  currentUserEmail?: string;
  canManageAdmins: boolean;
  onViewAdmin: (admin: AdminAccount) => void;
  onStatusChange: (
    admin: AdminAccount,
    newStatus: "active" | "deactivated"
  ) => void;
}

// Helper functions
const getRoleBadge = (role: string) => {
  switch (role) {
    case "super_admin":
      return {
        text: "Super Admin",
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: ShieldCheckIcon,
      };
    case "lgu_admin":
      return {
        text: "LGU Admin",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: UserIcon,
      };
    case "field_admin":
      return {
        text: "Field Admin",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircleIcon,
      };
    default:
      return {
        text: "Unknown",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: ExclamationTriangleIcon,
      };
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return {
        text: "Active",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircleIcon,
      };
    case "deactivated":
      return {
        text: "Deactivated",
        className: "bg-red-100 text-red-800 border-red-200",
        icon: XMarkIcon,
      };
    default:
      return {
        text: "Unknown",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: ExclamationTriangleIcon,
      };
  }
};

const getStatusActions = (admin: AdminAccount) => {
  const actions = [];

  if (admin.status !== "active") {
    actions.push({
      label: "Activate",
      status: "active" as const,
      className: "text-green-600 hover:text-green-700",
      icon: PowerIcon,
    });
  }

  if (admin.status !== "deactivated") {
    actions.push({
      label: "Deactivate",
      status: "deactivated" as const,
      className: "text-red-600 hover:text-red-700",
      icon: XMarkIcon,
    });
  }

  return actions;
};

export default function AdminTable({
  admins,
  processingIds,
  currentUserEmail,
  canManageAdmins,
  onViewAdmin,
  onStatusChange,
}: AdminTableProps) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: PASIG.card, borderColor: PASIG.subtleBorder }}
    >
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y"
          style={{ borderColor: PASIG.subtleBorder }}
        >
          <thead style={{ backgroundColor: PASIG.bg }}>
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: PASIG.muted }}
              >
                Admin
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: PASIG.muted }}
              >
                Role
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: PASIG.muted }}
              >
                Status
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: PASIG.muted }}
              >
                Last Active
              </th>
              {canManageAdmins && (
                <th
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: PASIG.muted }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody
            className="divide-y"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            {admins.map((admin) => {
              const roleBadge = getRoleBadge(admin.role);
              const statusBadge = getStatusBadge(admin.status);
              const statusActions = getStatusActions(admin);

              return (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${PASIG.softBlue}20` }}
                      >
                        <UserIcon
                          className="h-5 w-5"
                          style={{ color: PASIG.softBlue }}
                        />
                      </div>
                      <div className="ml-4">
                        <div
                          className="text-sm font-medium"
                          style={{ color: PASIG.slate }}
                        >
                          {admin.displayName || admin.email.split("@")[0]}
                        </div>
                        <div className="text-sm" style={{ color: PASIG.muted }}>
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadge.className}`}
                    >
                      <roleBadge.icon className="h-3 w-3 mr-1" />
                      {roleBadge.text}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}
                    >
                      <statusBadge.icon className="h-3 w-3 mr-1" />
                      {statusBadge.text}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="flex items-center text-sm"
                      style={{ color: PASIG.muted }}
                    >
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {admin.lastActiveAt
                        ? admin.lastActiveAt.toLocaleDateString()
                        : "Never"}
                    </div>
                  </td>

                  {canManageAdmins && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Button */}
                        <button
                          onClick={() => onViewAdmin(admin)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors border"
                          style={{
                            color: PASIG.softBlue,
                            borderColor: `${PASIG.softBlue}30`,
                            backgroundColor: `${PASIG.softBlue}10`,
                          }}
                          title="View Details"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View
                        </button>

                        {/* Status Action Buttons */}
                        {statusActions.map((action) => (
                          <button
                            key={action.status}
                            onClick={() => onStatusChange(admin, action.status)}
                            disabled={
                              processingIds.has(admin.id) ||
                              admin.email === currentUserEmail
                            }
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${action.className}`}
                            style={{
                              borderColor:
                                action.status === "active"
                                  ? `${PASIG.success}30`
                                  : `${PASIG.danger}30`,
                              backgroundColor:
                                action.status === "active"
                                  ? `${PASIG.success}10`
                                  : `${PASIG.danger}10`,
                            }}
                            title={
                              admin.email === currentUserEmail
                                ? "Cannot modify your own account"
                                : action.label
                            }
                          >
                            <action.icon className="h-3 w-3 mr-1" />
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {admins.length === 0 && (
          <div className="text-center py-12">
            <UserIcon
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: PASIG.muted }}
            />
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: PASIG.slate }}
            >
              No admins found
            </h3>
            <p style={{ color: PASIG.muted }}>
              No admin accounts match the current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
