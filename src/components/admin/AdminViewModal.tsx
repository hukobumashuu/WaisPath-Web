// src/components/admin/AdminViewModal.tsx
// Admin view/edit modal component

"use client";

import React from "react";
import {
  UserIcon,
  XMarkIcon,
  PencilIcon,
  CheckIcon,
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

interface AdminEditForm {
  displayName: string;
  role: "super_admin" | "lgu_admin" | "field_admin";
  phoneNumber: string;
  department: string;
  notes: string;
}

interface AdminViewModalProps {
  isOpen: boolean;
  admin: AdminAccount | null;
  isEditing: boolean;
  editForm: AdminEditForm;
  processingIds: Set<string>;
  canManageAdmins: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFormChange: (field: keyof AdminEditForm, value: string) => void;
}

// Helper functions
const getRoleBadge = (role: string) => {
  switch (role) {
    case "super_admin":
      return {
        text: "Super Admin",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      };
    case "lgu_admin":
      return {
        text: "LGU Admin",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      };
    case "field_admin":
      return {
        text: "Field Admin",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    default:
      return {
        text: "Unknown",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return {
        text: "Active",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    case "deactivated":
      return {
        text: "Deactivated",
        className: "bg-red-100 text-red-800 border-red-200",
      };
    default:
      return {
        text: "Unknown",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
};

export default function AdminViewModal({
  isOpen,
  admin,
  isEditing,
  editForm,
  processingIds,
  canManageAdmins,
  onClose,
  onEdit,
  onSave,
  onCancel,
  onFormChange,
}: AdminViewModalProps) {
  if (!isOpen || !admin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: PASIG.card }}
      >
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: `${PASIG.softBlue}20` }}
              >
                <UserIcon
                  className="h-6 w-6"
                  style={{ color: PASIG.softBlue }}
                />
              </div>
              <div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: PASIG.slate }}
                >
                  {isEditing ? "Edit Admin" : "Admin Details"}
                </h3>
                <p style={{ color: PASIG.muted }}>{admin.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XMarkIcon className="h-5 w-5" style={{ color: PASIG.muted }} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: PASIG.bg,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <h4 className="font-semibold mb-4" style={{ color: PASIG.slate }}>
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) =>
                        onFormChange("displayName", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ borderColor: PASIG.subtleBorder }}
                    />
                  ) : (
                    <p style={{ color: PASIG.muted }}>
                      {admin.displayName || "Not set"}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Role
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.role}
                      onChange={(e) => onFormChange("role", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ borderColor: PASIG.subtleBorder }}
                    >
                      <option value="field_admin">Field Admin</option>
                      <option value="lgu_admin">LGU Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        getRoleBadge(admin.role).className
                      }`}
                    >
                      {getRoleBadge(admin.role).text}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: PASIG.bg,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <h4 className="font-semibold mb-4" style={{ color: PASIG.slate }}>
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.phoneNumber}
                      onChange={(e) =>
                        onFormChange("phoneNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ borderColor: PASIG.subtleBorder }}
                      placeholder="+63 912 345 6789"
                    />
                  ) : (
                    <p style={{ color: PASIG.muted }}>
                      {admin.metadata?.phoneNumber || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Department
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={(e) =>
                        onFormChange("department", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ borderColor: PASIG.subtleBorder }}
                      placeholder="PWD Affairs Office"
                    />
                  ) : (
                    <p style={{ color: PASIG.muted }}>
                      {admin.metadata?.department || "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: PASIG.bg,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <h4 className="font-semibold mb-4" style={{ color: PASIG.slate }}>
                Additional Information
              </h4>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: PASIG.slate }}
                >
                  Notes
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => onFormChange("notes", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ borderColor: PASIG.subtleBorder }}
                    placeholder="Additional notes about this admin..."
                  />
                ) : (
                  <p style={{ color: PASIG.muted }}>
                    {admin.metadata?.notes || "No additional notes"}
                  </p>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: PASIG.bg,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <h4 className="font-semibold mb-4" style={{ color: PASIG.slate }}>
                Account Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      getStatusBadge(admin.status).className
                    }`}
                  >
                    {getStatusBadge(admin.status).text}
                  </span>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Created Date
                  </label>
                  <p style={{ color: PASIG.muted }}>
                    {admin.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div
            className="flex justify-end space-x-3 mt-6 pt-6 border-t"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            {isEditing ? (
              <>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: PASIG.subtleBorder,
                    color: PASIG.muted,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={processingIds.has(admin.id)}
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: PASIG.softBlue }}
                >
                  {processingIds.has(admin.id) ? (
                    "Saving..."
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 inline mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: PASIG.subtleBorder,
                    color: PASIG.muted,
                  }}
                >
                  Close
                </button>
                {canManageAdmins && (
                  <button
                    onClick={onEdit}
                    className="px-4 py-2 text-white rounded-lg font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: PASIG.softBlue }}
                  >
                    <PencilIcon className="h-4 w-4 inline mr-2" />
                    Edit Admin
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
