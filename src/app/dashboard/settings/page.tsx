// src/app/dashboard/settings/page.tsx
// COMPLETE REDESIGN: Modern settings page with Pasig color scheme and fixed input focus

"use client";

import React, { useState, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  PowerIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "firebase/auth";

/* ---------- Pasig Color Scheme ---------- */
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

interface ProfileFormData {
  fullName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user, signOut } = useAdminAuth();
  const router = useRouter();

  // Form state with useCallback to prevent re-renders
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: user?.displayName || user?.email?.split("@")[0] || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);

  // Memoized input handlers to prevent focus loss
  const handleNameChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, fullName: value }));
  }, []);

  const handleCurrentPasswordChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, currentPassword: value }));
  }, []);

  const handleNewPasswordChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, newPassword: value }));
  }, []);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, confirmPassword: value }));
  }, []);

  // Get auth token
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user");
      return await currentUser.getIdToken();
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  };

  // Handle form submission
  const handleSaveProfile = async () => {
    if (isUpdating) return;

    // Validation
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (passwordMode) {
      if (!formData.currentPassword) {
        toast.error("Current password is required");
        return;
      }
      if (!formData.newPassword) {
        toast.error("New password is required");
        return;
      }
      if (formData.newPassword.length < 8) {
        toast.error("New password must be at least 8 characters long");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
    }

    setIsUpdating(true);
    const toastId = toast.loading("Updating profile...");

    try {
      const authToken = await getAuthToken();
      if (!authToken) throw new Error("Authentication failed");

      const payload: {
        displayName: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        displayName: formData.fullName.trim(),
      };

      if (passwordMode) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully!", { id: toastId });

      // Reset password fields if password was changed
      if (passwordMode) {
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setPasswordMode(false);

        if (result.updates?.passwordUpdated) {
          toast.success(
            "Password changed! Please sign in again with your new password.",
            {
              duration: 6000,
            }
          );
        }
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
        { id: toastId }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    const toastId = toast.loading("Signing out...");

    try {
      await signOut();
      toast.success("Signed out successfully", { id: toastId });
      router.push("/auth/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.", { id: toastId });
      setIsSigningOut(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      fullName: user?.displayName || user?.email?.split("@")[0] || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordMode(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: PASIG.softBlue }}
            >
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: PASIG.slate }}>
                Profile Settings
              </h1>
              <p className="text-sm" style={{ color: PASIG.muted }}>
                Manage your admin profile and account preferences
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information Card */}
            <div
              className="rounded-2xl p-6 shadow-sm border"
              style={{
                backgroundColor: PASIG.card,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <UserIcon
                  className="h-5 w-5"
                  style={{ color: PASIG.softBlue }}
                />
                <h2
                  className="text-lg font-semibold"
                  style={{ color: PASIG.slate }}
                >
                  Profile Information
                </h2>
              </div>

              <div className="space-y-4">
                {/* Full Name Input */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
                    style={{
                      borderColor: PASIG.subtleBorder,
                    }}
                    placeholder="Enter your full name"
                  />
                  <p className="text-xs mt-1" style={{ color: PASIG.muted }}>
                    This name will appear throughout the admin dashboard
                  </p>
                </div>

                {/* Email Input (Read-only) */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: PASIG.slate }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                    style={{ borderColor: PASIG.subtleBorder }}
                  />
                  <p className="text-xs mt-1" style={{ color: PASIG.muted }}>
                    Email cannot be changed for security reasons
                  </p>
                </div>
              </div>
            </div>

            {/* Password Card */}
            <div
              className="rounded-2xl p-6 shadow-sm border"
              style={{
                backgroundColor: PASIG.card,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <KeyIcon
                    className="h-5 w-5"
                    style={{ color: PASIG.warning }}
                  />
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: PASIG.slate }}
                  >
                    Password Security
                  </h2>
                </div>

                {!passwordMode && (
                  <button
                    onClick={() => setPasswordMode(true)}
                    className="text-sm px-4 py-2 rounded-lg border transition-colors"
                    style={{
                      borderColor: PASIG.softBlue,
                      color: PASIG.softBlue,
                    }}
                  >
                    Change Password
                  </button>
                )}
              </div>

              {passwordMode ? (
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: PASIG.slate }}
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) =>
                          handleCurrentPasswordChange(e.target.value)
                        }
                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
                        style={{
                          borderColor: PASIG.subtleBorder,
                        }}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            current: !prev.current,
                          }))
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: PASIG.slate }}
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) =>
                          handleNewPasswordChange(e.target.value)
                        }
                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
                        style={{
                          borderColor: PASIG.subtleBorder,
                        }}
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            new: !prev.new,
                          }))
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: PASIG.slate }}
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleConfirmPasswordChange(e.target.value)
                        }
                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
                        style={{
                          borderColor: PASIG.subtleBorder,
                        }}
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Actions */}
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setPasswordMode(false)}
                      className="px-4 py-2 text-sm rounded-lg border transition-colors"
                      style={{
                        borderColor: PASIG.subtleBorder,
                        color: PASIG.muted,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-center py-8 rounded-xl"
                  style={{ backgroundColor: PASIG.bg }}
                >
                  <KeyIcon
                    className="h-12 w-12 mx-auto mb-3"
                    style={{ color: PASIG.muted }}
                  />
                  <p className="text-sm" style={{ color: PASIG.muted }}>
                    Your password is secure and protected
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl border transition-colors font-medium"
                style={{
                  borderColor: PASIG.subtleBorder,
                  color: PASIG.muted,
                }}
              >
                Reset Changes
              </button>

              <button
                onClick={handleSaveProfile}
                disabled={isUpdating}
                className="flex-1 px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: PASIG.softBlue }}
              >
                <div className="flex items-center justify-center space-x-2">
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      <span>Save Profile</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Right Column - Account Info & Actions */}
          <div className="space-y-6">
            {/* Account Summary */}
            <div
              className="rounded-2xl p-6 shadow-sm border"
              style={{
                backgroundColor: PASIG.card,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: PASIG.slate }}
              >
                Account Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: PASIG.muted }}>
                    Role
                  </span>
                  <span
                    className="text-sm font-medium px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: PASIG.bg,
                      color: PASIG.softBlue,
                    }}
                  >
                    {user?.customClaims.role?.replace("_", " ") || "Admin"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: PASIG.muted }}>
                    Status
                  </span>
                  <span
                    className="text-sm font-medium px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: "#dcfce7",
                      color: PASIG.success,
                    }}
                  >
                    {user?.accountStatus || "Active"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: PASIG.muted }}>
                    ID
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: PASIG.slate }}
                  >
                    {user?.uid?.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Sign Out Action */}
            <div
              className="rounded-2xl p-6 shadow-sm border"
              style={{
                backgroundColor: PASIG.card,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: PASIG.slate }}
              >
                Account Actions
              </h3>

              <div className="text-center">
                <p className="text-sm mb-4" style={{ color: PASIG.muted }}>
                  Securely end your admin session
                </p>

                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: PASIG.danger }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isSigningOut ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Signing Out...</span>
                      </>
                    ) : (
                      <>
                        <PowerIcon className="h-5 w-5" />
                        <span>Sign Out</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Help Info */}
            <div
              className="rounded-2xl p-6 shadow-sm border"
              style={{
                backgroundColor: PASIG.bg,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <h4
                className="text-sm font-semibold mb-3"
                style={{ color: PASIG.slate }}
              >
                💡 Profile Tips
              </h4>
              <ul className="text-xs space-y-2" style={{ color: PASIG.muted }}>
                <li>• Your full name appears in audit logs</li>
                <li>• Email changes require admin approval</li>
                <li>• Password changes take effect immediately</li>
                <li>• Use strong passwords with 8+ characters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
