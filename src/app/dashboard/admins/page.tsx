// src/app/dashboard/admins/page.tsx
// ENHANCED: Complete Admin Management with Account Status Controls

"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import {
  UserPlusIcon,
  ShieldCheckIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  PowerIcon, // NEW: For activate/deactivate
  ExclamationTriangleIcon, // NEW: For warnings
  PauseIcon, // NEW: For suspend
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "firebase/auth";

/* ---------- Pasig color scheme (hex) ---------- */
const PASIG = {
  primaryNavy: "#08345A", // main navy
  softBlue: "#2BA4FF", // accent / CTA
  slate: "#0F172A",
  muted: "#6B7280",
  bg: "#F8FAFC", // page background
  card: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  subtleBorder: "#E6EEF8",
};

interface AdminAccount {
  id: string;
  email: string;
  role: "super_admin" | "lgu_admin" | "field_admin";
  status: "active" | "deactivated" | "suspended";
  createdBy: string;
  createdAt: Date;
  lastActiveAt?: Date;
  permissions: string[];
}

interface NewAdminForm {
  email: string;
  role: "lgu_admin" | "field_admin";
  sendInvite: boolean;
}

// NEW: Status change confirmation dialog
interface StatusChangeDialog {
  isOpen: boolean;
  admin: AdminAccount | null;
  newStatus: "active" | "deactivated" | "suspended";
  reason: string;
}

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }

    const idToken = await user.getIdToken();
    return idToken;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
};

export default function AdminManagement() {
  const { user, loading, hasPermission, hasRole } = useAdminAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // NEW: Status change dialog state
  const [statusDialog, setStatusDialog] = useState<StatusChangeDialog>({
    isOpen: false,
    admin: null,
    newStatus: "active",
    reason: "",
  });

  const [newAdminForm, setNewAdminForm] = useState<NewAdminForm>({
    email: "",
    role: "field_admin",
    sendInvite: false,
  });

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied: Admin management privileges required");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      loadAdminAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load admin accounts from Firebase
  const loadAdminAccounts = async () => {
    try {
      setLoadingAdmins(true);

      const authToken = await getAuthToken();
      if (!authToken) {
        console.warn("No auth token available for loading admins");
        loadMockData();
        return;
      }

      // Fetch admins from API
      const response = await fetch("/api/admin/list", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const adminData = result.data.map(
            (admin: {
              id: string;
              email: string;
              role: "super_admin" | "lgu_admin" | "field_admin";
              status: "active" | "deactivated" | "suspended";
              createdBy: string;
              createdAt: string;
              lastActiveAt?: string;
              permissions: string[];
            }) => ({
              ...admin,
              createdAt: new Date(admin.createdAt),
              lastActiveAt: admin.lastActiveAt
                ? new Date(admin.lastActiveAt)
                : undefined,
            })
          );
          setAdmins(adminData);
          return;
        }
      }

      console.warn("Failed to load real admin data, using mock data");
      loadMockData();
    } catch (error) {
      console.error("Failed to load admin accounts:", error);
      toast.error("Failed to load admin accounts");
      loadMockData();
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Fallback mock data function
  const loadMockData = () => {
    const mockAdmins: AdminAccount[] = [
      {
        id: "admin_1",
        email: user?.email || "admin@example.com",
        role: "super_admin",
        status: "active",
        createdBy: "system",
        createdAt: new Date("2024-01-15"),
        lastActiveAt: new Date(),
        permissions: [
          "obstacles:read",
          "obstacles:approve",
          "users:read",
          "admins:create",
        ],
      },
      {
        id: "admin_2",
        email: "lgu.admin@pasigcity.gov.ph",
        role: "lgu_admin",
        status: "active",
        createdBy: "admin_1",
        createdAt: new Date("2024-07-10"),
        lastActiveAt: new Date("2024-08-18"),
        permissions: [
          "obstacles:read",
          "obstacles:approve",
          "users:read",
          "admins:create_field",
        ],
      },
      {
        id: "admin_3",
        email: "field.worker@ngopasig.org",
        role: "field_admin",
        status: "deactivated",
        createdBy: "admin_2",
        createdAt: new Date("2024-08-01"),
        lastActiveAt: new Date("2024-08-15"),
        permissions: ["obstacles:read", "obstacles:approve"],
      },
    ];

    setAdmins(mockAdmins);
  };

  // NEW: Handle status change confirmation
  const handleStatusChange = (
    admin: AdminAccount,
    newStatus: "active" | "deactivated" | "suspended"
  ) => {
    // Prevent self-deactivation
    if (
      admin.email === user?.email &&
      (newStatus === "deactivated" || newStatus === "suspended")
    ) {
      toast.error("You cannot deactivate or suspend your own account");
      return;
    }

    // Check if this is the last super admin
    if (admin.role === "super_admin" && newStatus !== "active") {
      const activeSuperAdmins = admins.filter(
        (a) =>
          a.role === "super_admin" && a.status === "active" && a.id !== admin.id
      );

      if (activeSuperAdmins.length === 0) {
        toast.error("Cannot deactivate the last active super admin");
        return;
      }
    }

    setStatusDialog({
      isOpen: true,
      admin,
      newStatus,
      reason: "",
    });
  };

  // NEW: Execute status change
  const executeStatusChange = async () => {
    if (!statusDialog.admin) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(statusDialog.admin!.id));

      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      const response = await fetch("/api/admin/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          adminId: statusDialog.admin.id,
          newStatus: statusDialog.newStatus,
          reason: statusDialog.reason.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setAdmins((prev) =>
            prev.map((admin) =>
              admin.id === statusDialog.admin!.id
                ? { ...admin, status: statusDialog.newStatus }
                : admin
            )
          );

          const statusText =
            statusDialog.newStatus === "active"
              ? "activated"
              : statusDialog.newStatus === "deactivated"
              ? "deactivated"
              : "suspended";

          toast.success(`Admin account ${statusText} successfully`);

          // Close dialog
          setStatusDialog({
            isOpen: false,
            admin: null,
            newStatus: "active",
            reason: "",
          });
        } else {
          toast.error(result.error || "Failed to update admin status");
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to update admin status:", error);
      toast.error("Failed to update admin status. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(statusDialog.admin!.id);
        return newSet;
      });
    }
  };

  // Create new admin account
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminForm.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!newAdminForm.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (newAdminForm.role === "lgu_admin" && !hasRole("super_admin")) {
      toast.error("Only Super Admins can create LGU Admin accounts");
      return;
    }

    try {
      setProcessingIds((prev) => new Set(prev).add("create"));

      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email: newAdminForm.email.trim(),
          role: newAdminForm.role,
          sendInvite: newAdminForm.sendInvite,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Admin account created successfully for ${newAdminForm.email}`
          );
          setShowCreateForm(false);
          setNewAdminForm({
            email: "",
            role: "field_admin",
            sendInvite: false,
          });
          await loadAdminAccounts();
        } else {
          toast.error(result.error || "Failed to create admin account");
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to create admin:", error);
      toast.error("Failed to create admin account. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete("create");
        return newSet;
      });
    }
  };

  // Filter admins based on role and status
  const filteredAdmins = admins.filter((admin) => {
    const roleMatch = roleFilter === "all" || admin.role === roleFilter;
    const statusMatch = statusFilter === "all" || admin.status === statusFilter;
    return roleMatch && statusMatch;
  });

  // NEW: Get status badge styling
  const getStatusBadge = (status: AdminAccount["status"]) => {
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
      case "suspended":
        return {
          text: "Suspended",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: PauseIcon,
        };
      default:
        return {
          text: "Unknown",
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: ExclamationTriangleIcon,
        };
    }
  };

  // NEW: Get available status actions for an admin
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

    if (admin.status !== "suspended") {
      actions.push({
        label: "Suspend",
        status: "suspended" as const,
        className: "text-yellow-600 hover:text-yellow-700",
        icon: PauseIcon,
      });
    }

    return actions;
  };

  // Check permissions
  const canManageAdmins = hasPermission("admins:manage");
  const canCreateAdmins = hasPermission("admins:create");

  if (loading || loadingAdmins) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: PASIG.softBlue }}
            ></div>
            <p className="text-gray-600">Loading admin accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canManageAdmins && !canCreateAdmins) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don&apos;t have permission to manage admin accounts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
      <Toaster position="top-right" />

      {/* Status Change Confirmation Dialog */}
      {statusDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Status Change
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to {statusDialog.newStatus} the account for{" "}
              <span className="font-medium">{statusDialog.admin?.email}</span>?
            </p>

            {statusDialog.newStatus !== "active" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={statusDialog.reason}
                  onChange={(e) =>
                    setStatusDialog((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter reason for status change..."
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() =>
                  setStatusDialog({
                    isOpen: false,
                    admin: null,
                    newStatus: "active",
                    reason: "",
                  })
                }
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeStatusChange}
                disabled={processingIds.has(statusDialog.admin?.id || "")}
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  statusDialog.newStatus === "active"
                    ? "bg-green-600 hover:bg-green-700"
                    : statusDialog.newStatus === "suspended"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {processingIds.has(statusDialog.admin?.id || "")
                  ? "Processing..."
                  : `${
                      statusDialog.newStatus.charAt(0).toUpperCase() +
                      statusDialog.newStatus.slice(1)
                    } Account`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: PASIG.primaryNavy }}
              >
                Admin Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage administrator accounts and permissions
              </p>
            </div>

            {canCreateAdmins && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: PASIG.softBlue }}
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Create Admin
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div
          className="mb-6 bg-white rounded-lg shadow-sm border p-4"
          style={{ borderColor: PASIG.subtleBorder }}
        >
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="lgu_admin">LGU Admin</option>
                <option value="field_admin">Field Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Create Admin Form */}
        {showCreateForm && (
          <div
            className="mb-6 bg-white rounded-lg shadow-sm border p-6"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Create New Admin
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newAdminForm.email}
                  onChange={(e) =>
                    setNewAdminForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newAdminForm.role}
                  onChange={(e) =>
                    setNewAdminForm((prev) => ({
                      ...prev,
                      role: e.target.value as "lgu_admin" | "field_admin",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="field_admin">Field Admin</option>
                  {hasRole("super_admin") && (
                    <option value="lgu_admin">LGU Admin</option>
                  )}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendInvite"
                  checked={newAdminForm.sendInvite}
                  onChange={(e) =>
                    setNewAdminForm((prev) => ({
                      ...prev,
                      sendInvite: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="sendInvite"
                  className="ml-2 text-sm text-gray-700"
                >
                  Send invitation email with temporary password
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingIds.has("create")}
                  className="px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50"
                  style={{ backgroundColor: PASIG.softBlue }}
                >
                  {processingIds.has("create") ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin List */}
        <div
          className="bg-white rounded-lg shadow-sm border"
          style={{ borderColor: PASIG.subtleBorder }}
        >
          <div
            className="p-4 border-b"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Admin Accounts ({filteredAdmins.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  {canManageAdmins && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAdmins.map((admin) => {
                  const statusBadge = getStatusBadge(admin.status);
                  const StatusIcon = statusBadge.icon;
                  const statusActions = getStatusActions(admin);
                  const isProcessing = processingIds.has(admin.id);

                  return (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {admin.email}
                            </div>
                            {admin.email === user?.email && (
                              <span className="text-xs text-blue-600 font-medium">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <ShieldCheckIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 capitalize">
                            {admin.role.replace("_", " ")}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusBadge.text}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {admin.lastActiveAt ? (
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {admin.lastActiveAt.toLocaleDateString()}
                          </div>
                        ) : (
                          "Never"
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {admin.createdAt.toLocaleDateString()}
                        </div>
                      </td>

                      {canManageAdmins && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {statusActions.map((action) => (
                              <button
                                key={action.status}
                                onClick={() =>
                                  handleStatusChange(admin, action.status)
                                }
                                disabled={
                                  isProcessing ||
                                  (admin.email === user?.email &&
                                    action.status !== "active")
                                }
                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.className} bg-white border border-gray-200 hover:bg-gray-50`}
                                title={
                                  admin.email === user?.email &&
                                  action.status !== "active"
                                    ? "Cannot modify your own account"
                                    : action.label
                                }
                              >
                                <action.icon className="h-3 w-3 mr-1" />
                                {action.label}
                              </button>
                            ))}

                            <button
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              View
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredAdmins.length === 0 && (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No admins found
                </h3>
                <p className="text-gray-500">
                  {admins.length === 0
                    ? "No admin accounts have been created yet."
                    : "No admins match the current filters."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
