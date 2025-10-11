// src/app/dashboard/settings/page.tsx
// UPDATED: Added password strength indicator, fixed input text visibility, improved labels

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
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "firebase/auth";
import {
  isPasswordValid,
  passwordsMatch,
  validatePassword,
} from "@/lib/utils/passwordValidator";
import PasswordStrengthIndicator from "@/components/common/PasswordStrengthIndicator";

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

  // ✅ UPDATED: Enhanced form submission with strong password validation
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

      // ✅ NEW: Use centralized password validation
      if (!isPasswordValid(formData.newPassword)) {
        const validation = validatePassword(formData.newPassword);
        toast.error(
          validation.errors[0] || "Password does not meet security requirements"
        );
        return;
      }

      // ✅ NEW: Check if passwords match
      if (!passwordsMatch(formData.newPassword, formData.confirmPassword)) {
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
                {/* ✅ FIXED: Full Name Input with better text visibility */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-900 placeholder-gray-400"
                    style={{
                      borderColor: PASIG.subtleBorder,
                      backgroundColor: PASIG.card,
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
                    className="block text-sm font-semibold mb-2"
                    style={{ color: PASIG.primaryNavy }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border-2 bg-gray-50 text-gray-600 cursor-not-allowed"
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
                    className="text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-blue-50"
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
                  {/* ✅ FIXED: Current Password with better styling */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: PASIG.primaryNavy }}
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
                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-900 placeholder-gray-400"
                        style={{
                          borderColor: PASIG.subtleBorder,
                          backgroundColor: PASIG.card,
                        }}
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            current: !prev.current,
                          }))
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPasswords.current ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

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
                        value={formData.newPassword}
                        onChange={(e) =>
                          handleNewPasswordChange(e.target.value)
                        }
                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-900 placeholder-gray-400"
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
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPasswords.new ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {/* ✅ NEW: Password Strength Indicator */}
                    {formData.newPassword && (
                      <div className="mt-3">
                        <PasswordStrengthIndicator
                          password={formData.newPassword}
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
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleConfirmPasswordChange(e.target.value)
                        }
                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-900 placeholder-gray-400"
                        style={{
                          borderColor: PASIG.subtleBorder,
                          backgroundColor: PASIG.card,
                        }}
                        placeholder="Re-enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPasswords.confirm ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {/* ✅ NEW: Password match indicator */}
                    {formData.confirmPassword && (
                      <div className="mt-2">
                        {passwordsMatch(
                          formData.newPassword,
                          formData.confirmPassword
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

                  {/* Password Actions */}
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => {
                        setPasswordMode(false);
                        setFormData((prev) => ({
                          ...prev,
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        }));
                      }}
                      className="px-4 py-2 text-sm rounded-lg border transition-colors hover:bg-gray-50"
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
                className="px-6 py-3 rounded-xl border transition-colors hover:bg-gray-50 font-medium"
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
                className="flex-1 px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: PASIG.softBlue }}
              >
                <div className="flex items-center justify-center space-x-2">
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Right Column - Account Info */}
          <div className="space-y-6">
            {/* Account Details Card */}
            <div
              className="rounded-2xl p-6 shadow-sm border"
              style={{
                backgroundColor: PASIG.card,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: PASIG.slate }}
              >
                Account Details
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p style={{ color: PASIG.muted }}>Email</p>
                  <p
                    className="font-medium break-words"
                    style={{ color: PASIG.slate }}
                  >
                    {user?.email}
                  </p>
                </div>

                <div>
                  <p style={{ color: PASIG.muted }}>Role</p>
                  <div className="mt-1">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: `${PASIG.softBlue}20`,
                        color: PASIG.primaryNavy,
                      }}
                    >
                      Administrator
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Out Card */}
            <div
              className="rounded-2xl p-6 shadow-sm border"
              style={{
                backgroundColor: PASIG.card,
                borderColor: PASIG.subtleBorder,
              }}
            >
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: PASIG.slate }}
              >
                Session Management
              </h3>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: PASIG.danger,
                  color: PASIG.danger,
                }}
              >
                {isSigningOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <PowerIcon className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </>
                )}
              </button>

              <p
                className="text-xs text-center mt-3"
                style={{ color: PASIG.muted }}
              >
                You will be redirected to the login page
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
