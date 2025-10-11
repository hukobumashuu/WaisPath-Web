// src/components/admin/AdminViewModal.tsx
// UPDATED: Added password strength indicator, fixed text visibility, improved validation

"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  UserIcon,
  PencilIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";
import {
  isPasswordValid,
  passwordsMatch,
  validatePassword,
} from "@/lib/utils/passwordValidator";
import PasswordStrengthIndicator from "@/components/common/PasswordStrengthIndicator";

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

const getRoleBadge = (role: string) => {
  const badges = {
    super_admin: {
      text: "Super Admin",
      bgColor: PASIG.bg,
      textColor: PASIG.danger,
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
  processingIds,
  canManageAdmins,
  onClose,
  onEdit,
  onSave,
  onCancel,
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

  // ✅ UPDATED: Enhanced password change with strong validation
  const handlePasswordChange = async () => {
    // Validate passwords match
    if (
      !passwordsMatch(passwordForm.newPassword, passwordForm.confirmPassword)
    ) {
      toast.error("Passwords don't match!");
      return;
    }

    // ✅ NEW: Validate password strength
    if (!isPasswordValid(passwordForm.newPassword)) {
      const validation = validatePassword(passwordForm.newPassword);
      toast.error(
        validation.errors[0] || "Password does not meet security requirements"
      );
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
      toast.success(
        "Password changed successfully! The admin will need to sign in with their new password."
      );
    } catch (error) {
      console.error("Password change failed:", error);
      toast.error(
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
      style={{ backgroundColor: "rgba(15, 23, 42, 0.4)" }}
    >
      <div
        className="rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border"
        style={{
          backgroundColor: PASIG.bg,
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
                <p className="text-sm text-blue-200">{admin.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 space-y-4">
          {/* Basic Info Section */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: PASIG.muted }}>
                  Email
                </p>
                <p className="font-medium" style={{ color: PASIG.slate }}>
                  {admin.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs" style={{ color: PASIG.muted }}>
                    Role
                  </p>
                  <div className="mt-1">{getRoleBadge(admin.role)}</div>
                </div>

                <div>
                  <p className="text-xs" style={{ color: PASIG.muted }}>
                    Status
                  </p>
                  <div className="mt-1">{getStatusBadge(admin.status)}</div>
                </div>
              </div>

              <div>
                <p className="text-xs" style={{ color: PASIG.muted }}>
                  Last Active
                </p>
                <p className="font-medium" style={{ color: PASIG.slate }}>
                  {admin.lastActiveAt
                    ? admin.lastActiveAt.toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          {/* ✅ UPDATED: CHANGE PASSWORD SECTION with strength indicator */}
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
                  onClick={() => {
                    setShowPasswordSection(!showPasswordSection);
                    if (showPasswordSection) {
                      // Reset form when closing
                      setPasswordForm({ newPassword: "", confirmPassword: "" });
                    }
                  }}
                  className="text-sm px-3 py-1 rounded border transition-colors hover:bg-blue-50"
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
                  {/* ✅ FIXED: New Password with better styling */}
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
                        className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                        style={{
                          borderColor: PASIG.subtleBorder,
                          backgroundColor: PASIG.card,
                        }}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            new: !prev.new,
                          }))
                        }
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPasswords.new ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* ✅ NEW: Password Strength Indicator */}
                    {passwordForm.newPassword && (
                      <div className="mt-3">
                        <PasswordStrengthIndicator
                          password={passwordForm.newPassword}
                          showRequirements={true}
                          showStrengthBar={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* ✅ FIXED: Confirm Password with better styling */}
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
                        className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                        style={{
                          borderColor: PASIG.subtleBorder,
                          backgroundColor: PASIG.card,
                        }}
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPasswords.confirm ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* ✅ NEW: Password match indicator */}
                    {passwordForm.confirmPassword && (
                      <div className="mt-2">
                        {passwordsMatch(
                          passwordForm.newPassword,
                          passwordForm.confirmPassword
                        ) ? (
                          <p className="text-xs text-green-600 flex items-center">
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Passwords match
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 flex items-center">
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Passwords do not match
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handlePasswordChange}
                      disabled={
                        !passwordForm.newPassword ||
                        !passwordForm.confirmPassword ||
                        !isPasswordValid(passwordForm.newPassword) ||
                        !passwordsMatch(
                          passwordForm.newPassword,
                          passwordForm.confirmPassword
                        ) ||
                        isChangingPassword
                      }
                      className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
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
                    className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg font-medium transition-colors hover:opacity-90"
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
