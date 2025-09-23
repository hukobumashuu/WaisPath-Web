// src/components/admin/AdminCreationModal.tsx
// Admin creation modal with no dark backdrop

"use client";

import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  UserPlusIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
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
  onAdminCreated: () => void; // Callback to refresh admin list
}

interface CreateAdminForm {
  email: string;
  role: "lgu_admin" | "field_admin";
  displayName: string;
  phoneNumber: string;
  department: string;
  notes: string;
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
  temporaryPassword: string;
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
    phoneNumber: "",
    department: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<CreatedAdminResult | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setForm({
        email: "",
        role: "field_admin",
        displayName: "",
        phoneNumber: "",
        department: "",
        notes: "",
      });
      setCreatedAdmin(null);
      setShowPassword(false);
      setPasswordCopied(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
    return form.email.trim() && form.email.includes("@") && form.role;
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
          metadata: {
            displayName: form.displayName.trim() || undefined,
            phoneNumber: form.phoneNumber.trim() || undefined,
            department: form.department.trim() || undefined,
            notes: form.notes.trim() || undefined,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCreatedAdmin(result.data);
        toast.success("Admin account created successfully!");
        onAdminCreated(); // Refresh the admin list
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

      // Reset copied state after 3 seconds
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Transparent backdrop - no dark overlay */}
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200">
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{
            backgroundColor: PASIG.bg,
            borderColor: PASIG.subtleBorder,
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: PASIG.softBlue }}
            >
              <UserPlusIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: PASIG.slate }}>
                {createdAdmin
                  ? "Admin Created Successfully"
                  : "Create New Admin"}
              </h2>
              <p className="text-sm" style={{ color: PASIG.muted }}>
                {createdAdmin
                  ? "Admin account has been created with temporary credentials"
                  : "Add a new administrator to the system"}
              </p>
            </div>
          </div>
          <button
            onClick={createdAdmin ? handleCloseAfterCreation : onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: PASIG.muted }}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdAdmin ? (
            // Success view
            <div className="space-y-6">
              {/* Admin Details */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-900 mb-3">
                  Admin Account Created
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Email:</span>
                    <span className="font-medium text-green-900">
                      {createdAdmin.admin.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Role:</span>
                    <span className="font-medium text-green-900 capitalize">
                      {createdAdmin.admin.role.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Status:</span>
                    <span className="font-medium text-green-900 capitalize">
                      {createdAdmin.admin.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Temporary Password */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
                  <span>Temporary Password</span>
                  <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                    IMPORTANT
                  </span>
                </h3>

                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-1 p-3 bg-white border border-yellow-300 rounded-lg">
                    <code className="text-sm font-mono">
                      {showPassword
                        ? createdAdmin.temporaryPassword
                        : "••••••••••••"}
                    </code>
                  </div>

                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>

                  <button
                    onClick={copyPassword}
                    disabled={passwordCopied}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      passwordCopied
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                    }`}
                  >
                    {passwordCopied ? (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-yellow-800 space-y-1">
                  <p>• This password is only shown once - save it securely</p>
                  <p>• The admin should change this password on first login</p>
                  <p>
                    • Send credentials to the admin through a secure channel
                  </p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    1. Securely share the login credentials with the new admin
                  </p>
                  <p>2. Ask them to sign in and change their password</p>
                  <p>
                    3. Verify their access to the appropriate admin functions
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Creation form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="admin@pasigcity.gov.ph"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Role *
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="field_admin">
                      Field Admin - Basic obstacle management
                    </option>
                    <option value="lgu_admin">
                      LGU Admin - Full system access
                    </option>
                  </select>
                </div>
              </div>

              {/* Optional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) =>
                      handleChange("displayName", e.target.value)
                    }
                    placeholder="Juan Dela Cruz"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      handleChange("phoneNumber", e.target.value)
                    }
                    placeholder="+63 912 345 6789"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: PASIG.slate }}
                >
                  Department
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="e.g., PWD Affairs Office, City Planning"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: PASIG.slate }}
                >
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Additional notes about this admin..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Role Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  {form.role === "lgu_admin"
                    ? "LGU Admin Permissions"
                    : "Field Admin Permissions"}
                </h3>
                <div className="text-sm text-blue-800">
                  {form.role === "lgu_admin" ? (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Full obstacle management and approval</li>
                      <li>User account management</li>
                      <li>Create field admin accounts</li>
                      <li>Access to analytics and reports</li>
                      <li>View audit logs</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Basic obstacle verification</li>
                      <li>View user information</li>
                      <li>Limited administrative functions</li>
                    </ul>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!createdAdmin && (
          <div
            className="flex items-center justify-end space-x-3 px-6 py-4 border-t"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-gray-50"
              style={{
                borderColor: PASIG.subtleBorder,
                color: PASIG.muted,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: PASIG.softBlue }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        )}

        {/* Success Footer */}
        {createdAdmin && (
          <div
            className="flex items-center justify-end space-x-3 px-6 py-4 border-t"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            <button
              onClick={handleCloseAfterCreation}
              className="px-6 py-2 text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: PASIG.success }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
