// src/components/admin/AdminViewModal.tsx
// TONED DOWN: Subtle, clean modal with gentle Pasig colors - easy on the eyes

"use client";

import React, { useState } from "react";
import {
  UserIcon,
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { getAuth } from "firebase/auth";

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
    displayName?: string; // Sometimes stored here
  };
  profile?: {
    fullName?: string; // Sometimes stored here
    lastProfileUpdate?: Date;
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

// SUBTLE BADGE HELPER FUNCTIONS
const getRoleBadge = (role: string) => {
  const badges = {
    super_admin: {
      text: "Super Admin",
      bgColor: PASIG.bg,
      textColor: PASIG.primaryNavy,
      borderColor: PASIG.subtleBorder,
    },
    lgu_admin: {
      text: "LGU Admin",
      bgColor: PASIG.bg,
      textColor: PASIG.softBlue,
      borderColor: PASIG.subtleBorder,
    },
    field_admin: {
      text: "Field Admin",
      bgColor: PASIG.bg,
      textColor: PASIG.success,
      borderColor: PASIG.subtleBorder,
    },
  };

  const badge = badges[role as keyof typeof badges] || {
    text: "Unknown",
    bgColor: PASIG.bg,
    textColor: PASIG.muted,
    borderColor: PASIG.subtleBorder,
  };

  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border"
      style={{
        backgroundColor: badge.bgColor,
        color: badge.textColor,
        borderColor: badge.borderColor,
      }}
    >
      {badge.text}
    </span>
  );
};

const getStatusBadge = (status: string) => {
  const badges = {
    active: {
      text: "Active",
      bgColor: PASIG.bg,
      textColor: PASIG.success,
      borderColor: PASIG.subtleBorder,
    },
    deactivated: {
      text: "Deactivated",
      bgColor: PASIG.bg,
      textColor: PASIG.danger,
      borderColor: PASIG.subtleBorder,
    },
  };

  const badge = badges[status as keyof typeof badges] || {
    text: "Unknown",
    bgColor: PASIG.bg,
    textColor: PASIG.muted,
    borderColor: PASIG.subtleBorder,
  };

  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border"
      style={{
        backgroundColor: badge.bgColor,
        color: badge.textColor,
        borderColor: badge.borderColor,
      }}
    >
      {badge.text}
    </span>
  );
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
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!isOpen || !admin) return null;

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    setIsChangingPassword(true);

    try {
      // Get auth token
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Not authenticated");
      }
      const authToken = await currentUser.getIdToken();

      // Use the existing admin password reset API (super admin only feature)
      const response = await fetch(`/api/admin/reset-password/${admin.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password");
      }

      // Reset form and show success
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
      alert(
        "Password changed successfully! The admin will need to sign in with their new password."
      );
    } catch (error) {
      console.error("Password change failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to change password. Please try again."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.4)" }} // Much softer overlay
    >
      <div
        className="rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border"
        style={{
          backgroundColor: PASIG.bg, // Softer background instead of pure white
          borderColor: PASIG.subtleBorder,
        }}
      >
        {/* HEADER with Primary Navy touches */}
        <div
          className="px-6 py-4 border-b"
          style={{
            backgroundColor: PASIG.primaryNavy,
            borderColor: PASIG.subtleBorder,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isEditing ? "Edit Admin" : "Admin Details"}
                </h3>
                <p className="text-sm text-blue-100">{admin.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* BASIC INFORMATION */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <h4
              className="font-semibold mb-4"
              style={{ color: PASIG.primaryNavy }}
            >
              Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display Name */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: PASIG.primaryNavy }}
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    style={{
                      borderColor: PASIG.subtleBorder,
                      backgroundColor: PASIG.card,
                    }}
                    placeholder="Enter display name"
                  />
                ) : (
                  <p style={{ color: PASIG.muted }}>
                    {admin.displayName || admin.profile?.fullName || "Not set"}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: PASIG.primaryNavy }}
                >
                  Role
                </label>
                {isEditing ? (
                  <select
                    value={editForm.role}
                    onChange={(e) => onFormChange("role", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                    style={{
                      borderColor: PASIG.subtleBorder,
                      backgroundColor: PASIG.card,
                    }}
                  >
                    <option value="field_admin" className="text-slate-800">
                      Field Admin
                    </option>
                    <option value="lgu_admin" className="text-slate-800">
                      LGU Admin
                    </option>
                    <option value="super_admin" className="text-slate-800">
                      Super Admin
                    </option>
                  </select>
                ) : (
                  <div>{getRoleBadge(admin.role)}</div>
                )}
              </div>
            </div>
          </div>

          {/* ACCOUNT INFORMATION */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <h4
              className="font-semibold mb-4"
              style={{ color: PASIG.primaryNavy }}
            >
              Account Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: PASIG.primaryNavy }}
                >
                  Status
                </label>
                <div>{getStatusBadge(admin.status)}</div>
              </div>

              {/* Created Date */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: PASIG.primaryNavy }}
                >
                  Created
                </label>
                <p className="text-sm" style={{ color: PASIG.muted }}>
                  {admin.createdAt.toLocaleDateString()}
                </p>
              </div>

              {/* Last Active */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: PASIG.primaryNavy }}
                >
                  Last Active
                </label>
                <p className="text-sm" style={{ color: PASIG.muted }}>
                  {admin.lastActiveAt
                    ? admin.lastActiveAt.toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          {/* CHANGE PASSWORD SECTION */}
          {canManageAdmins && (
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: PASIG.card,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4
                  className="font-semibold"
                  style={{ color: PASIG.primaryNavy }}
                >
                  Change Password
                </h4>
                <button
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="text-sm px-3 py-1 rounded border transition-colors"
                  style={{
                    backgroundColor: showPasswordSection
                      ? PASIG.bg
                      : PASIG.card,
                    color: PASIG.softBlue,
                    borderColor: PASIG.subtleBorder,
                  }}
                >
                  {showPasswordSection ? "Cancel" : "Change"}
                </button>
              </div>

              {showPasswordSection && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: PASIG.primaryNavy }}
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                          style={{
                            borderColor: PASIG.subtleBorder,
                            backgroundColor: PASIG.card,
                          }}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.new ? (
                            <EyeSlashIcon
                              className="h-4 w-4"
                              style={{ color: PASIG.muted }}
                            />
                          ) : (
                            <EyeIcon
                              className="h-4 w-4"
                              style={{ color: PASIG.muted }}
                            />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: PASIG.primaryNavy }}
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                          style={{
                            borderColor: PASIG.subtleBorder,
                            backgroundColor: PASIG.card,
                          }}
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              confirm: !prev.confirm,
                            }))
                          }
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.confirm ? (
                            <EyeSlashIcon
                              className="h-4 w-4"
                              style={{ color: PASIG.muted }}
                            />
                          ) : (
                            <EyeIcon
                              className="h-4 w-4"
                              style={{ color: PASIG.muted }}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handlePasswordChange}
                      disabled={
                        !passwordForm.newPassword ||
                        !passwordForm.confirmPassword ||
                        isChangingPassword
                      }
                      className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      style={{ backgroundColor: PASIG.warning }}
                    >
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIMPLE FOOTER */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: PASIG.subtleBorder }}
        >
          <div className="flex justify-end space-x-3">
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
                  className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: PASIG.success }}
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>
                    {processingIds.has(admin.id) ? "Saving..." : "Save Changes"}
                  </span>
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
                    className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: PASIG.softBlue }}
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit Admin</span>
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
