// src/components/admin/AdminCreationModal.tsx
// Simplified admin creation modal - like basic registration

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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<CreatedAdminResult | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
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
      });
      setCreatedAdmin(null);
      setShowPassword(false);
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

  // Validate form
  const isFormValid = () => {
    const hasEmail = form.email.trim() && form.email.includes("@");
    const hasRole = !!form.role;
    const hasPassword = form.password.length >= 8;

    return hasEmail && hasRole && hasPassword;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        onClick={createdAdmin ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl drop-shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden border-2 border-gray-300/50 ring-1 ring-black/5">
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
                    className="p-2 rounded transition-colors"
                    style={{
                      color: PASIG.primaryNavy,
                      backgroundColor: `${PASIG.primaryNavy}10`,
                    }}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    onClick={copyPassword}
                    disabled={passwordCopied}
                    className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                      passwordCopied
                        ? "bg-green-100 text-green-800"
                        : "text-white"
                    }`}
                    style={{
                      backgroundColor: passwordCopied
                        ? undefined
                        : PASIG.primaryNavy,
                    }}
                  >
                    {passwordCopied ? (
                      <>
                        <CheckIcon className="h-3 w-3 inline mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-3 w-3 inline mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="admin@pasigcity.gov.ph"
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
                    placeholder="Minimum 8 characters"
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
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-4 border-t border-gray-200"
          style={{ backgroundColor: `${PASIG.primaryNavy}05` }}
        >
          {!createdAdmin ? (
            <>
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
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            </>
          ) : (
            <>
              <div className="text-xs text-gray-500">
                Account created successfully
              </div>
              <button
                onClick={handleCloseAfterCreation}
                className="px-4 py-2 text-white rounded-lg transition-colors text-sm"
                style={{ backgroundColor: PASIG.success }}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
