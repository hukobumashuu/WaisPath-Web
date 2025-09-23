// src/app/dashboard/admins/page.tsx
// COMPLETE: Admin management page with integrated creation modal

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import {
  UserPlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "firebase/auth";

// Import components
import AdminViewModal from "@/components/admin/AdminViewModal";
import AdminStatusModal from "@/components/admin/AdminStatusModal";
import AdminTable from "@/components/admin/AdminTable";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminCreationModal from "@/components/admin/AdminCreationModal";

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

interface ApiAdminResponse {
  id: string;
  email: string;
  displayName?: string;
  role: "super_admin" | "lgu_admin" | "field_admin";
  status: "active" | "deactivated";
  createdBy: string;
  createdAt: string;
  lastActiveAt?: string;
  permissions: string[];
  metadata?: {
    phoneNumber?: string;
    department?: string;
    notes?: string;
  };
}

export default function AdminManagementPage() {
  const { user, loading, hasPermission } = useAdminAuth();

  // Initialize with empty array to prevent undefined errors
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Create Admin Modal
  const [createDialog, setCreateDialog] = useState({
    isOpen: false,
  });

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // View/Edit Modal
  const [viewDialog, setViewDialog] = useState<{
    isOpen: boolean;
    admin: AdminAccount | null;
    isEditing: boolean;
    editForm: AdminEditForm;
  }>({
    isOpen: false,
    admin: null,
    isEditing: false,
    editForm: {
      displayName: "",
      role: "field_admin",
      phoneNumber: "",
      department: "",
      notes: "",
    },
  });

  // Status Change Dialog
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    admin: AdminAccount | null;
    newStatus: "active" | "deactivated";
    reason: string;
  }>({
    isOpen: false,
    admin: null,
    newStatus: "active",
    reason: "",
  });

  // Helper function to get auth token
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      return await currentUser.getIdToken();
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  }, []);

  // Load admins with proper error handling
  const loadAdminAccounts = useCallback(async () => {
    try {
      setLoadingAdmins(true);
      console.log("Loading admin accounts...");

      const authToken = await getAuthToken();
      if (!authToken) {
        console.error("No auth token available");
        toast.error("Authentication error. Please sign in again.");
        return;
      }

      const response = await fetch("/api/admin/list", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      console.log("Admin list response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Admin list result:", result);

        if (result.success && Array.isArray(result.data)) {
          const adminData: AdminAccount[] = result.data.map(
            (admin: ApiAdminResponse) => ({
              id: admin.id,
              email: admin.email,
              displayName: admin.displayName,
              role: admin.role,
              status: admin.status,
              createdBy: admin.createdBy,
              createdAt: new Date(admin.createdAt),
              lastActiveAt: admin.lastActiveAt
                ? new Date(admin.lastActiveAt)
                : undefined,
              permissions: admin.permissions || [],
              metadata: admin.metadata,
            })
          );

          console.log("Processed admin data:", adminData);
          setAdmins(adminData);
        } else {
          console.error("Invalid response format:", result);
          setAdmins([]); // Ensure we have an empty array
          toast.error("Invalid response format from server");
        }
      } else {
        console.error(
          "Failed to load admin accounts, status:",
          response.status
        );
        setAdmins([]); // Ensure we have an empty array

        try {
          const errorResult = await response.json();
          toast.error(errorResult.error || "Failed to load admin accounts");
        } catch {
          toast.error("Failed to load admin accounts");
        }
      }
    } catch (error) {
      console.error("Error loading admin accounts:", error);
      setAdmins([]); // Ensure we have an empty array
      toast.error("Failed to load admin accounts");
    } finally {
      setLoadingAdmins(false);
    }
  }, [getAuthToken]);

  // Load admins when user is available
  useEffect(() => {
    if (user?.isAdmin) {
      loadAdminAccounts();
    }
  }, [user, loadAdminAccounts]);

  // Get filtered admins with safety check
  const filteredAdmins = React.useMemo(() => {
    if (!Array.isArray(admins)) {
      console.warn("Admins is not an array:", admins);
      return [];
    }

    return admins.filter((admin) => {
      if (roleFilter && admin.role !== roleFilter) return false;
      if (statusFilter && admin.status !== statusFilter) return false;
      return true;
    });
  }, [admins, roleFilter, statusFilter]);

  // Handle view admin
  const handleViewAdmin = useCallback((admin: AdminAccount) => {
    setViewDialog({
      isOpen: true,
      admin,
      isEditing: false,
      editForm: {
        displayName: admin.displayName || "",
        role: admin.role,
        phoneNumber: admin.metadata?.phoneNumber || "",
        department: admin.metadata?.department || "",
        notes: admin.metadata?.notes || "",
      },
    });
  }, []);

  // Handle edit admin
  const handleEditAdmin = useCallback(() => {
    setViewDialog((prev) => ({ ...prev, isEditing: true }));
  }, []);

  // Handle save admin changes
  const handleSaveAdmin = useCallback(async () => {
    if (!viewDialog.admin) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(viewDialog.admin!.id));

      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please sign in again.");
        return;
      }

      const updateData = {
        displayName: viewDialog.editForm.displayName,
        role: viewDialog.editForm.role,
        metadata: {
          phoneNumber: viewDialog.editForm.phoneNumber,
          department: viewDialog.editForm.department,
          notes: viewDialog.editForm.notes,
        },
      };

      const response = await fetch(`/api/admin/update/${viewDialog.admin.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state
        setAdmins((prev) =>
          prev.map((admin) =>
            admin.id === viewDialog.admin!.id
              ? {
                  ...admin,
                  displayName: viewDialog.editForm.displayName,
                  role: viewDialog.editForm.role,
                  metadata: {
                    ...admin.metadata,
                    ...updateData.metadata,
                  },
                }
              : admin
          )
        );

        toast.success("Admin information updated successfully");
        setViewDialog((prev) => ({ ...prev, isEditing: false }));
      } else {
        toast.error(result.error || "Failed to update admin information");
      }
    } catch (error) {
      console.error("Failed to update admin:", error);
      toast.error("Failed to update admin information");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(viewDialog.admin!.id);
        return newSet;
      });
    }
  }, [viewDialog.admin, viewDialog.editForm, getAuthToken]);

  // Handle status change
  const handleStatusChange = useCallback(
    (admin: AdminAccount, newStatus: "active" | "deactivated") => {
      // Prevent self-deactivation
      if (admin.email === user?.email && newStatus === "deactivated") {
        toast.error("You cannot deactivate your own account");
        return;
      }

      // Check if this is the last super admin
      if (admin.role === "super_admin" && newStatus !== "active") {
        const activeSuperAdmins = admins.filter(
          (a) =>
            a.role === "super_admin" &&
            a.status === "active" &&
            a.id !== admin.id
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
    },
    [user?.email, admins]
  );

  // Execute status change
  const executeStatusChange = useCallback(async () => {
    if (!statusDialog.admin) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(statusDialog.admin!.id));

      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Authentication error. Please sign in again.");
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
          reason: statusDialog.reason,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state
        setAdmins((prev) =>
          prev.map((admin) =>
            admin.id === statusDialog.admin!.id
              ? { ...admin, status: statusDialog.newStatus }
              : admin
          )
        );

        toast.success(
          `Admin account ${
            statusDialog.newStatus === "active" ? "activated" : "deactivated"
          } successfully`
        );
        setStatusDialog({
          isOpen: false,
          admin: null,
          newStatus: "active",
          reason: "",
        });
      } else {
        toast.error(result.error || "Failed to update admin status");
      }
    } catch (error) {
      console.error("Failed to update admin status:", error);
      toast.error("Failed to update admin status");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(statusDialog.admin!.id);
        return newSet;
      });
    }
  }, [
    statusDialog.admin,
    statusDialog.newStatus,
    statusDialog.reason,
    getAuthToken,
  ]);

  // Modal handlers
  const handleCloseViewModal = useCallback(() => {
    setViewDialog({
      isOpen: false,
      admin: null,
      isEditing: false,
      editForm: {
        displayName: "",
        role: "field_admin",
        phoneNumber: "",
        department: "",
        notes: "",
      },
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (viewDialog.admin) {
      setViewDialog((prev) => ({
        ...prev,
        isEditing: false,
        editForm: {
          displayName: viewDialog.admin!.displayName || "",
          role: viewDialog.admin!.role,
          phoneNumber: viewDialog.admin!.metadata?.phoneNumber || "",
          department: viewDialog.admin!.metadata?.department || "",
          notes: viewDialog.admin!.metadata?.notes || "",
        },
      }));
    }
  }, [viewDialog.admin]);

  const handleFormChange = useCallback(
    (field: keyof AdminEditForm, value: string) => {
      setViewDialog((prev) => ({
        ...prev,
        editForm: {
          ...prev.editForm,
          [field]: value,
        },
      }));
    },
    []
  );

  const handleCloseStatusModal = useCallback(() => {
    setStatusDialog({
      isOpen: false,
      admin: null,
      newStatus: "active",
      reason: "",
    });
  }, []);

  const handleReasonChange = useCallback((reason: string) => {
    setStatusDialog((prev) => ({ ...prev, reason }));
  }, []);

  // Create Admin Modal handlers
  const handleCloseCreateModal = useCallback(() => {
    setCreateDialog({ isOpen: false });
  }, []);

  const handleAdminCreated = useCallback(() => {
    // Refresh admin list after creation
    loadAdminAccounts();
  }, [loadAdminAccounts]);

  // Check permissions
  const canManageAdmins = hasPermission("admins:manage");
  const canCreateAdmins = hasPermission("admins:create");

  // Loading state
  if (loading || loadingAdmins) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: PASIG.softBlue }}
            ></div>
            <p style={{ color: PASIG.muted }}>Loading admin accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!canManageAdmins && !canCreateAdmins) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: PASIG.slate }}
            >
              Access Denied
            </h2>
            <p style={{ color: PASIG.muted }}>
              You don&apos;t have permission to manage admin accounts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toaster position="top-right" />

        {/* Modals */}
        <AdminViewModal
          isOpen={viewDialog.isOpen}
          admin={viewDialog.admin}
          isEditing={viewDialog.isEditing}
          editForm={viewDialog.editForm}
          processingIds={processingIds}
          canManageAdmins={canManageAdmins}
          onClose={handleCloseViewModal}
          onEdit={handleEditAdmin}
          onSave={handleSaveAdmin}
          onCancel={handleCancelEdit}
          onFormChange={handleFormChange}
        />

        <AdminStatusModal
          isOpen={statusDialog.isOpen}
          admin={statusDialog.admin}
          newStatus={statusDialog.newStatus}
          reason={statusDialog.reason}
          processingIds={processingIds}
          onClose={handleCloseStatusModal}
          onConfirm={executeStatusChange}
          onReasonChange={handleReasonChange}
        />

        <AdminCreationModal
          isOpen={createDialog.isOpen}
          onClose={handleCloseCreateModal}
          onAdminCreated={handleAdminCreated}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: PASIG.primaryNavy }}
              >
                Admin Management
              </h1>
              <p className="mt-2" style={{ color: PASIG.muted }}>
                Manage administrator accounts and permissions
              </p>
            </div>

            {canCreateAdmins && (
              <button
                onClick={() => setCreateDialog({ isOpen: true })}
                className="flex items-center px-4 py-2 text-white rounded-xl transition-colors hover:opacity-90"
                style={{ backgroundColor: PASIG.softBlue }}
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Create Admin
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdminFilters
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Admin Table */}
        <AdminTable
          admins={filteredAdmins}
          processingIds={processingIds}
          currentUserEmail={user?.email || undefined}
          canManageAdmins={canManageAdmins}
          onViewAdmin={handleViewAdmin}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
