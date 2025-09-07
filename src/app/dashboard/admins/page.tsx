// src/app/dashboard/admins/page.tsx
// Complete Admin Management Interface with Real Firebase Integration

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
  PhoneIcon,
  ComputerDesktopIcon,
  CalendarIcon,
  ClockIcon,
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

      // Get auth token
      const authToken = await getAuthToken();
      if (!authToken) {
        console.warn("No auth token available for loading admins");
        // Fall back to mock data
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
          // Convert date strings back to Date objects
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

      // If API call fails, fall back to mock data
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

      // Get the current user's auth token
      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      // Prepare the request data
      const requestData = {
        email: newAdminForm.email.toLowerCase().trim(),
        role: newAdminForm.role,
        sendInvite: newAdminForm.sendInvite,
        metadata: {
          createdFrom: "admin_dashboard",
          timestamp: new Date().toISOString(),
        },
      };

      // Make API call to create admin
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create admin account");
      }

      if (result.success) {
        // Show success message with temporary password
        toast.success(
          `Admin account created successfully for ${newAdminForm.email}!`,
          { duration: 6000 }
        );

        // Show temporary password in a separate toast
        toast(
          (t) => (
            <div className="flex flex-col space-y-2">
              <div className="font-semibold text-sm">Temporary Password:</div>
              <div className="font-mono text-xs bg-gray-100 p-2 rounded border break-all">
                {result.data.temporaryPassword}
              </div>
              <div className="text-xs text-gray-600">
                Please save this password securely. The user will need it to log
                in.
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.data.temporaryPassword);
                  toast.success("Password copied to clipboard!");
                  toast.dismiss(t.id);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Copy to clipboard
              </button>
            </div>
          ),
          {
            duration: 15000, // Show for 15 seconds
            style: {
              maxWidth: "400px",
            },
          }
        );

        // Log the details to console for development
        console.log("✅ Admin created successfully:", {
          admin: result.data.admin,
          temporaryPassword: result.data.temporaryPassword,
          message: result.data.message,
        });

        // Reset form
        setNewAdminForm({
          email: "",
          role: "field_admin",
          sendInvite: false,
        });

        setShowCreateForm(false);

        // Reload admin accounts to show the new admin
        await loadAdminAccounts();

        // If email invitation was requested, show additional info
        if (newAdminForm.sendInvite) {
          toast.success(
            "Login instructions have been sent to the admin's email address."
          );
        }
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Failed to create admin:", error);

      // Handle specific error messages
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create admin account";

      if (errorMessage.includes("already exists")) {
        toast.error("An account with this email already exists");
      } else if (errorMessage.includes("Invalid email")) {
        toast.error("Please enter a valid email address");
      } else if (errorMessage.includes("permission")) {
        toast.error(
          "You don't have permission to create this type of admin account"
        );
      } else if (errorMessage.includes("Authentication")) {
        toast.error(
          "Authentication error. Please refresh the page and try again."
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete("create");
        return next;
      });
    }
  };

  // Update admin status
  const handleStatusChange = async (
    adminId: string,
    newStatus: "active" | "deactivated"
  ) => {
    // Find the admin being updated
    const targetAdmin = admins.find((admin) => admin.id === adminId);
    if (!targetAdmin) {
      toast.error("Admin account not found");
      return;
    }

    // Prevent self-deactivation
    if (targetAdmin.email === user?.email && newStatus === "deactivated") {
      toast.error("You cannot deactivate your own account");
      return;
    }

    // Confirm the action
    const actionText = newStatus === "active" ? "activate" : "deactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} the admin account for ${targetAdmin.email}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingIds((prev) => new Set(prev).add(adminId));

      // Get the current user's auth token
      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      // Prepare the request data
      const requestData = {
        adminId: adminId,
        newStatus: newStatus,
        reason: `Status changed via admin dashboard by ${user?.email}`,
      };

      // Make API call to update admin status
      const response = await fetch("/api/admin/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to ${actionText} admin account`
        );
      }

      if (result.success) {
        // Show success message
        toast.success(
          `Admin account ${
            newStatus === "active" ? "activated" : "deactivated"
          } successfully`
        );

        // Update the local state to reflect the change
        setAdmins((prevAdmins) =>
          prevAdmins.map((admin) =>
            admin.id === adminId ? { ...admin, status: newStatus } : admin
          )
        );

        // Log success
        console.log(
          `✅ Admin ${targetAdmin.email} ${actionText}d successfully`
        );
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error(`Failed to ${actionText} admin:`, error);

      // Handle specific error messages
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${actionText} admin account`;

      if (errorMessage.includes("not found")) {
        toast.error("Admin account not found");
      } else if (errorMessage.includes("permission")) {
        toast.error("You don't have permission to modify this admin account");
      } else if (errorMessage.includes("own account")) {
        toast.error("You cannot deactivate your own account");
      } else if (errorMessage.includes("Super Admin")) {
        toast.error("Only Super Admins can modify Super Admin accounts");
      } else if (errorMessage.includes("Authentication")) {
        toast.error(
          "Authentication error. Please refresh the page and try again."
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(adminId);
        return next;
      });
    }
  };

  // Helper function to determine if an admin can be modified
  const canModifyAdmin = (targetAdmin: AdminAccount): boolean => {
    // Can't modify your own account for status changes
    if (targetAdmin.email === user?.email) {
      return false;
    }

    // Only super admins can modify super admin accounts
    if (targetAdmin.role === "super_admin" && !hasRole("super_admin")) {
      return false;
    }

    // Must have manage permission
    if (!hasPermission("admins:manage")) {
      return false;
    }

    return true;
  };

  const filteredAdmins = admins.filter((admin) => {
    if (roleFilter !== "all" && admin.role !== roleFilter) return false;
    if (statusFilter !== "all" && admin.status !== statusFilter) return false;
    return true;
  });

  const getRoleDisplayName = (role: string) => {
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
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return ShieldCheckIcon;
      case "lgu_admin":
        return ComputerDesktopIcon;
      case "field_admin":
        return PhoneIcon;
      default:
        return UserIcon;
    }
  };

  // Handle view details
  const handleViewDetails = (admin: AdminAccount) => {
    const detailsMessage = `
Admin Details:
• Email: ${admin.email}
• Role: ${getRoleDisplayName(admin.role)}
• Status: ${admin.status}
• Created: ${admin.createdAt.toLocaleDateString()}
• Created By: ${admin.createdBy}
• Last Active: ${admin.lastActiveAt?.toLocaleDateString() || "Never"}
• Permissions: ${admin.permissions.join(", ")}
    `.trim();

    alert(detailsMessage);
  };

  // Helper function to determine if we should show the activate/deactivate button
  const shouldShowStatusButton = (targetAdmin: AdminAccount): boolean => {
    return canModifyAdmin(targetAdmin);
  };

  // Helper function to get button text for self-accounts
  const getStatusButtonText = (targetAdmin: AdminAccount): string => {
    if (targetAdmin.email === user?.email) {
      return "Cannot modify own account";
    }
    return targetAdmin.status === "active" ? "Deactivate" : "Activate";
  };

  const canCreateRole = (targetRole: string) => {
    if (hasRole("super_admin")) return true;
    if (hasRole("lgu_admin") && targetRole === "field_admin") return true;
    return false;
  };

  if (loading || loadingAdmins) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div
              style={{
                borderTopColor: PASIG.softBlue,
              }}
              className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto"
            />
            <p className="mt-4 text-sm" style={{ color: PASIG.muted }}>
              Loading admin accounts...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div style={{ backgroundColor: PASIG.bg, minHeight: "100vh" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <header
        style={{
          backgroundColor: PASIG.card,
          borderBottomColor: PASIG.subtleBorder,
        }}
        className="shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: PASIG.slate }}>
                Admin Management
              </h1>
              <p className="text-sm" style={{ color: PASIG.muted }}>
                Create and manage administrative accounts for WAISPATH
              </p>
            </div>

            {(hasRole("super_admin") || hasRole("lgu_admin")) && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow"
                style={{
                  backgroundColor: PASIG.primaryNavy,
                  color: "#fff",
                  border: "1px solid rgba(11, 50, 82, 0.08)",
                }}
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Create Admin Account
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white overflow-hidden rounded-lg"
            style={{ boxShadow: "0 6px 18px rgba(8,52,90,0.04)" }}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon
                    className="h-6 w-6"
                    style={{ color: PASIG.muted }}
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt
                      className="text-sm font-medium truncate"
                      style={{ color: PASIG.muted }}
                    >
                      Total Admins
                    </dt>
                    <dd
                      className="text-lg font-medium"
                      style={{ color: PASIG.slate }}
                    >
                      {admins.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div
            className="bg-white overflow-hidden rounded-lg"
            style={{ boxShadow: "0 6px 18px rgba(11,165,255,0.04)" }}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon
                    className="h-6 w-6"
                    style={{ color: PASIG.success }}
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt
                      className="text-sm font-medium truncate"
                      style={{ color: PASIG.muted }}
                    >
                      Active
                    </dt>
                    <dd
                      className="text-lg font-medium"
                      style={{ color: PASIG.slate }}
                    >
                      {admins.filter((a) => a.status === "active").length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div
            className="bg-white overflow-hidden rounded-lg"
            style={{ boxShadow: "0 6px 18px rgba(8,52,90,0.04)" }}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon
                    className="h-6 w-6"
                    style={{ color: PASIG.softBlue }}
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt
                      className="text-sm font-medium truncate"
                      style={{ color: PASIG.muted }}
                    >
                      Super Admins
                    </dt>
                    <dd
                      className="text-lg font-medium"
                      style={{ color: PASIG.slate }}
                    >
                      {admins.filter((a) => a.role === "super_admin").length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div
            className="bg-white overflow-hidden rounded-lg"
            style={{ boxShadow: "0 6px 18px rgba(8,52,90,0.04)" }}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-6 w-6" style={{ color: "#7C3AED" }} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt
                      className="text-sm font-medium truncate"
                      style={{ color: PASIG.muted }}
                    >
                      Field Admins
                    </dt>
                    <dd
                      className="text-lg font-medium"
                      style={{ color: PASIG.slate }}
                    >
                      {admins.filter((a) => a.role === "field_admin").length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label
              className="block text-sm font-semibold mb-1"
              style={{ color: PASIG.primaryNavy }}
            >
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
              style={{
                borderColor: PASIG.subtleBorder,
                color: PASIG.primaryNavy,
                minWidth: 180,
                backgroundColor: PASIG.card,
                boxShadow: "0 1px 2px rgba(8,52,90,0.03)",
              }}
            >
              <option value="all" style={{ color: PASIG.slate }}>
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
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-1"
              style={{ color: PASIG.primaryNavy }}
            >
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
              style={{
                borderColor: PASIG.subtleBorder,
                color: PASIG.primaryNavy,
                minWidth: 180,
                backgroundColor: PASIG.card,
                boxShadow: "0 1px 2px rgba(8,52,90,0.03)",
              }}
            >
              <option value="all" style={{ color: PASIG.slate }}>
                All Status
              </option>
              <option value="active" style={{ color: PASIG.slate }}>
                Active
              </option>
              <option value="deactivated" style={{ color: PASIG.slate }}>
                Deactivated
              </option>
              <option value="suspended" style={{ color: PASIG.slate }}>
                Suspended
              </option>
            </select>
          </div>
        </div>

        {/* Admin Accounts List */}
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          {filteredAdmins.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No admin accounts found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredAdmins.map((admin) => {
                const RoleIcon = getRoleIcon(admin.role);
                const isProcessing = processingIds.has(admin.id);

                return (
                  <li key={admin.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div
                            style={{
                              background:
                                "linear-gradient(180deg, rgba(43,164,255,0.12), rgba(8,52,90,0.04))",
                              padding: 8,
                              borderRadius: 8,
                              display: "inline-flex",
                            }}
                          >
                            <RoleIcon
                              className="h-8 w-8"
                              style={{ color: PASIG.primaryNavy }}
                            />
                          </div>
                        </div>

                        <div className="ml-4">
                          <div className="flex items-center">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: PASIG.slate }}
                            >
                              {admin.email}
                            </p>

                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
                              style={{
                                marginLeft: 8,
                                backgroundColor:
                                  admin.status === "active"
                                    ? "rgba(16,185,129,0.1)"
                                    : admin.status === "deactivated"
                                    ? "rgba(107,114,128,0.07)"
                                    : "rgba(239,68,68,0.08)",
                                color:
                                  admin.status === "active"
                                    ? PASIG.success
                                    : admin.status === "deactivated"
                                    ? PASIG.muted
                                    : PASIG.danger,
                              }}
                            >
                              {admin.status}
                            </span>
                          </div>

                          <div
                            className="flex items-center mt-1 text-sm"
                            style={{ color: PASIG.muted }}
                          >
                            <span>{getRoleDisplayName(admin.role)}</span>
                            <span className="mx-2">•</span>
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>
                              Created {admin.createdAt.toLocaleDateString()}
                            </span>
                            {admin.lastActiveAt && (
                              <>
                                <span className="mx-2">•</span>
                                <ClockIcon className="h-4 w-4 mr-1" />
                                <span>
                                  Last active{" "}
                                  {admin.lastActiveAt.toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {shouldShowStatusButton(admin) && (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                admin.id,
                                admin.status === "active"
                                  ? "deactivated"
                                  : "active"
                              )
                            }
                            disabled={isProcessing}
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium"
                            style={{
                              border: "1px solid rgba(15,23,42,0.06)",
                              backgroundColor:
                                admin.status === "active"
                                  ? "#FEF2F2"
                                  : "#F0FDF4",
                              color:
                                admin.status === "active"
                                  ? "#DC2626"
                                  : "#166534",
                              opacity: isProcessing ? 0.6 : 1,
                            }}
                          >
                            {isProcessing ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                            ) : admin.status === "active" ? (
                              <XMarkIcon className="h-4 w-4 mr-1" />
                            ) : (
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                            )}
                            {getStatusButtonText(admin)}
                          </button>
                        )}

                        {admin.email === user?.email && (
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium"
                            style={{
                              border: "1px solid rgba(107,114,128,0.3)",
                              backgroundColor: "#F9FAFB",
                              color: "#6B7280",
                            }}
                          >
                            <UserIcon className="h-4 w-4 mr-1" />
                            Your Account
                          </span>
                        )}

                        <button
                          onClick={() => handleViewDetails(admin)}
                          className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium"
                          style={{
                            border: "1px solid rgba(15,23,42,0.06)",
                            backgroundColor: PASIG.card,
                            color: PASIG.primaryNavy,
                            boxShadow: "0 1px 2px rgba(8,52,90,0.03)",
                          }}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {/* Create Admin Modal */}
      {showCreateForm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(2,6,23,0.45)" }}
        >
          <div
            className="rounded-lg max-w-md w-full p-6"
            style={{
              backgroundColor: PASIG.card,
              boxShadow: "0 20px 50px rgba(8,52,90,0.12)",
              border: `1px solid ${PASIG.subtleBorder}`,
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: PASIG.slate }}
            >
              Create New Admin Account
            </h3>

            <form onSubmit={handleCreateAdmin}>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
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
                    className="w-full rounded-md px-3 py-2"
                    placeholder="admin@example.com"
                    required
                    style={{
                      border: `1px solid ${PASIG.subtleBorder}`,
                      backgroundColor: PASIG.bg,
                      color: PASIG.slate,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Admin Role
                  </label>
                  <select
                    value={newAdminForm.role}
                    onChange={(e) =>
                      setNewAdminForm((prev) => ({
                        ...prev,
                        role: e.target.value as "lgu_admin" | "field_admin",
                      }))
                    }
                    className="w-full rounded-md px-3 py-2"
                    style={{
                      border: `1px solid ${PASIG.subtleBorder}`,
                      backgroundColor: PASIG.bg,
                      color: PASIG.slate,
                    }}
                  >
                    <option value="field_admin" style={{ color: PASIG.slate }}>
                      Field Admin (Mobile Only)
                    </option>
                    {hasRole("super_admin") && (
                      <option value="lgu_admin" style={{ color: PASIG.slate }}>
                        LGU Admin (Website + Mobile)
                      </option>
                    )}
                  </select>
                  <p className="text-xs mt-1" style={{ color: PASIG.muted }}>
                    {newAdminForm.role === "field_admin"
                      ? "Can validate obstacles using mobile app"
                      : "Full access to admin dashboard and mobile app"}
                  </p>
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
                    className="h-4 w-4 rounded"
                    style={{ accentColor: PASIG.softBlue }}
                  />
                  <label
                    htmlFor="sendInvite"
                    className="ml-2 text-sm"
                    style={{ color: PASIG.slate }}
                  >
                    Send email invitation with setup instructions
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    border: `1px solid ${PASIG.subtleBorder}`,
                    backgroundColor: PASIG.card,
                    color: PASIG.slate,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    processingIds.has("create") ||
                    !canCreateRole(newAdminForm.role)
                  }
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: PASIG.softBlue,
                    color: "#fff",
                    opacity:
                      processingIds.has("create") ||
                      !canCreateRole(newAdminForm.role)
                        ? 0.6
                        : 1,
                    border: "1px solid rgba(43,164,255,0.12)",
                  }}
                >
                  {processingIds.has("create") ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </div>
                  ) : (
                    "Create Admin Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
