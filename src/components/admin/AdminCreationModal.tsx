// src/components/admin/AdminCreationModal.tsx
// UPDATED: Added password strength indicator and confirm password field

"use client";

import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  UserPlusIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { getAuth } from "firebase/auth";
import { isPasswordValid, passwordsMatch } from "@/lib/utils/passwordValidator";
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

interface AdminCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminCreated: () => void;
}

interface CreateAdminForm {
  email: string;
  role: "lgu_admin" | "field_admin";
  displayName: string;
  password: string;
  confirmPassword: string; // ✅ NEW: Confirm password field
}

interface CreatedAdminResult {
  admin: {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    permissions: string[];
  };
  temporaryPassword?: string;
  message: string;
}

export default function AdminCreationModal({
  isOpen,
  onClose,
  onAdminCreated,
}: AdminCreationModalProps) {
  const [form, setForm] = useState<CreateAdminForm>({
    email: "",
    role: "field_admin",
    displayName: "",
    password: "",
    confirmPassword: "", // ✅ NEW: Initialize confirm password
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<CreatedAdminResult | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ✅ NEW: Separate toggle for confirm password
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Handle escape key and backdrop clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setForm({
        email: "",
        role: "field_admin",
        displayName: "",
        password: "",
        confirmPassword: "", // ✅ NEW: Reset confirm password
      });
      setCreatedAdmin(null);
      setShowPassword(false);
      setShowConfirmPassword(false); // ✅ NEW: Reset confirm password visibility
      setPasswordCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper function to get auth token
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      return await currentUser.getIdToken();
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  };

  // Handle form changes
  const handleChange = (field: keyof CreateAdminForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ UPDATED: Enhanced form validation with password matching
  const isFormValid = () => {
    const hasEmail = form.email.trim() && form.email.includes("@");
    const hasRole = !!form.role;
    const hasValidPassword = isPasswordValid(form.password); // Uses centralized validator
    const passwordsDoMatch = passwordsMatch(
      form.password,
      form.confirmPassword
    ); // Check if passwords match

    return hasEmail && hasRole && hasValidPassword && passwordsDoMatch;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ NEW: Additional validation before submission
    if (!isPasswordValid(form.password)) {
      toast.error("Password does not meet security requirements");
      return;
    }

    if (!passwordsMatch(form.password, form.confirmPassword)) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isFormValid() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please sign in again.");
        return;
      }

      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email: form.email.toLowerCase().trim(),
          role: form.role,
          sendInvite: false,
          metadata: {
            displayName: form.displayName.trim() || undefined,
            customPassword: form.password,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCreatedAdmin({
          ...result.data,
          temporaryPassword: form.password,
        });
        toast.success("Admin account created successfully!");
        onAdminCreated();
      } else {
        toast.error(result.error || "Failed to create admin account");
      }
    } catch (error) {
      console.error("Failed to create admin:", error);
      toast.error("Failed to create admin account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy password to clipboard
  const copyPassword = async () => {
    if (!createdAdmin?.temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(createdAdmin.temporaryPassword);
      setPasswordCopied(true);
      toast.success("Password copied to clipboard!");
      setTimeout(() => setPasswordCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy password:", error);
      toast.error("Failed to copy password");
    }
  };

  // Handle closing after creation
  const handleCloseAfterCreation = () => {
    setCreatedAdmin(null);
    onClose();
  };

  // Get role info
  const getRoleInfo = (role: string) => {
    const roleMap = {
      lgu_admin: {
        name: "LGU Administrator",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      },
      field_admin: {
        name: "Field Administrator",
        color: "bg-green-100 text-green-800 border-green-300",
      },
    };
    return roleMap[role as keyof typeof roleMap] || roleMap.field_admin;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.4)" }}
        onClick={createdAdmin ? undefined : onClose}
      />

      {/* Modal - ✅ UPDATED: Increased max height for password strength indicator */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[95vh] overflow-y-auto border-2 border-gray-300/50">
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b border-gray-200"
          style={{ backgroundColor: PASIG.primaryNavy }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-white"
              style={{ color: PASIG.primaryNavy }}
            >
              {createdAdmin ? "✅" : <UserPlusIcon className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {createdAdmin ? "Admin Created" : "Create Administrator"}
              </h2>
              <p className="text-blue-100 text-sm">
                {createdAdmin
                  ? "Account ready to use"
                  : "Add new admin to system"}
              </p>
            </div>
          </div>
          <button
            onClick={createdAdmin ? handleCloseAfterCreation : onClose}
            className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdAdmin ? (
            /* Success View */
            <div className="space-y-4">
              {/* Account Details */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-100 text-green-800 border-green-300">
                    CREATED
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      getRoleInfo(createdAdmin.admin.role).color
                    }`}
                  >
                    {getRoleInfo(createdAdmin.admin.role).name.toUpperCase()}
                  </span>
                </div>

                <p className="text-lg font-semibold text-gray-900">
                  {createdAdmin.admin.email}
                </p>
                {form.displayName && (
                  <p className="text-gray-600">{form.displayName}</p>
                )}
              </div>

              {/* Password Display */}
              <div
                className="border rounded-lg p-4"
                style={{
                  backgroundColor: `${PASIG.warning}10`,
                  borderColor: `${PASIG.warning}40`,
                }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <KeyIcon
                    className="h-4 w-4"
                    style={{ color: PASIG.primaryNavy }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Login Password
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div
                    className="flex-1 p-2 bg-white border rounded font-mono text-center text-sm"
                    style={{ borderColor: `${PASIG.primaryNavy}30` }}
                  >
                    <code style={{ color: PASIG.primaryNavy }}>
                      {showPassword
                        ? createdAdmin.temporaryPassword
                        : "••••••••••••"}
                    </code>
                  </div>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 rounded hover:bg-gray-100"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={copyPassword}
                    className="p-2 rounded hover:bg-gray-100"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    {passwordCopied ? (
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-sm text-gray-600 space-y-2">
                <p>✅ Admin account has been created successfully</p>
                <p>
                  📧 Share these credentials with{" "}
                  <strong>{createdAdmin.admin.email}</strong>
                </p>
                <p>🔒 They can change their password after first login</p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleCloseAfterCreation}
                className="w-full py-3 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: PASIG.success }}
              >
                Done
              </button>
            </div>
          ) : (
            /* Creation Form */
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label
                  className="flex items-center space-x-2 text-sm font-medium mb-2"
                  style={{ color: PASIG.primaryNavy }}
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="admin@pasig.gov.ph"
                  className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                  style={{
                    borderColor: `${PASIG.primaryNavy}30`,
                  }}
                />
              </div>

              {/* Role */}
              <div>
                <label
                  className="flex items-center space-x-2 text-sm font-medium mb-2"
                  style={{ color: PASIG.primaryNavy }}
                >
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>Role *</span>
                </label>
                <select
                  required
                  value={form.role}
                  onChange={(e) =>
                    handleChange(
                      "role",
                      e.target.value as "lgu_admin" | "field_admin"
                    )
                  }
                  className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-blue-500 transition-colors text-gray-900"
                  style={{
                    borderColor: `${PASIG.primaryNavy}30`,
                  }}
                >
                  <option value="field_admin">Field Admin</option>
                  <option value="lgu_admin">LGU Admin</option>
                </select>
              </div>

              {/* Display Name */}
              <div>
                <label
                  className="flex items-center space-x-2 text-sm font-medium mb-2"
                  style={{ color: PASIG.primaryNavy }}
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                  style={{
                    borderColor: `${PASIG.primaryNavy}30`,
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  className="flex items-center space-x-2 text-sm font-medium mb-2"
                  style={{ color: PASIG.primaryNavy }}
                >
                  <KeyIcon className="h-4 w-4" />
                  <span>Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Create a strong password"
                    minLength={8}
                    className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-blue-500 transition-colors pr-10 text-gray-900 placeholder-gray-500"
                    style={{
                      borderColor: `${PASIG.primaryNavy}30`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* ✅ NEW: Password Strength Indicator */}
                {form.password && (
                  <div className="mt-3">
                    <PasswordStrengthIndicator
                      password={form.password}
                      showRequirements={true}
                      showStrengthBar={true}
                    />
                  </div>
                )}
              </div>

              {/* ✅ NEW: Confirm Password */}
              <div>
                <label
                  className="flex items-center space-x-2 text-sm font-medium mb-2"
                  style={{ color: PASIG.primaryNavy }}
                >
                  <KeyIcon className="h-4 w-4" />
                  <span>Confirm Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={form.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    placeholder="Re-enter password"
                    minLength={8}
                    className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:border-blue-500 transition-colors pr-10 text-gray-900 placeholder-gray-500"
                    style={{
                      borderColor: `${PASIG.primaryNavy}30`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* ✅ NEW: Password match indicator */}
                {form.confirmPassword && (
                  <div className="mt-2">
                    {passwordsMatch(form.password, form.confirmPassword) ? (
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
            </form>
          )}
        </div>

        {/* Footer */}
        {!createdAdmin && (
          <div
            className="flex items-center justify-between p-4 border-t border-gray-200"
            style={{ backgroundColor: `${PASIG.primaryNavy}05` }}
          >
            <div className="text-xs text-gray-500">* Required fields</div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
                className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                style={{ backgroundColor: PASIG.primaryNavy }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-4 w-4" />
                    <span>Create Admin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
