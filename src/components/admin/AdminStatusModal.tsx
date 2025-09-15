// src/components/admin/AdminStatusModal.tsx
// Admin status change confirmation modal

"use client";

import React from "react";
import { PowerIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
}

interface AdminStatusModalProps {
  isOpen: boolean;
  admin: AdminAccount | null;
  newStatus: "active" | "deactivated";
  reason: string;
  processingIds: Set<string>;
  onClose: () => void;
  onConfirm: () => void;
  onReasonChange: (reason: string) => void;
}

export default function AdminStatusModal({
  isOpen,
  admin,
  newStatus,
  reason,
  processingIds,
  onClose,
  onConfirm,
  onReasonChange,
}: AdminStatusModalProps) {
  if (!isOpen || !admin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full"
        style={{ backgroundColor: PASIG.card }}
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div
              className="p-2 rounded-xl mr-3"
              style={{
                backgroundColor:
                  newStatus === "active"
                    ? `${PASIG.success}20`
                    : `${PASIG.danger}20`,
              }}
            >
              {newStatus === "active" ? (
                <PowerIcon
                  className="h-6 w-6"
                  style={{ color: PASIG.success }}
                />
              ) : (
                <XMarkIcon
                  className="h-6 w-6"
                  style={{ color: PASIG.danger }}
                />
              )}
            </div>
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: PASIG.slate }}
              >
                {newStatus === "active" ? "Activate" : "Deactivate"} Admin
              </h3>
              <p style={{ color: PASIG.muted }}>{admin.email}</p>
            </div>
          </div>

          <p className="mb-4" style={{ color: PASIG.muted }}>
            Are you sure you want to{" "}
            {newStatus === "active" ? "activate" : "deactivate"} this admin
            account?
            {newStatus === "deactivated" &&
              " This will immediately revoke their access."}
          </p>

          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: PASIG.slate }}
            >
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ borderColor: PASIG.subtleBorder }}
              placeholder="Optional reason for this action..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: PASIG.subtleBorder, color: PASIG.muted }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={processingIds.has(admin.id)}
              className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 hover:opacity-90"
              style={{
                backgroundColor:
                  newStatus === "active" ? PASIG.success : PASIG.danger,
              }}
            >
              {processingIds.has(admin.id)
                ? "Processing..."
                : `${
                    newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
                  } Account`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
