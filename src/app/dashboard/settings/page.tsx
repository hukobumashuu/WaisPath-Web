// src/app/dashboard/settings/page.tsx
// SIMPLIFIED: Settings page with working sign-out and reduced features

"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import { UserIcon, KeyIcon } from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";

export default function SettingsPage() {
  const { user, signOut } = useAdminAuth();
  const router = useRouter();

  const [settings, setSettings] = useState({
    // Profile (email is read-only from user)
    adminName: user?.displayName || user?.email?.split("@")[0] || "Admin User",
  });

  const [isSigningOut, setIsSigningOut] = useState(false);

  // Handle sign out with loading state
  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    toast.loading("Signing out...", { id: "signout" });

    try {
      await signOut();
      toast.success("Signed out successfully", { id: "signout" });
      router.push("/auth/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.", { id: "signout" });
      setIsSigningOut(false);
    }
  };

  const SettingsCard = ({
    icon: Icon,
    title,
    children,
    iconColor = "text-blue-600",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
    iconColor?: string;
  }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-4 mb-8">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg`}
        >
          <Icon className={`h-7 w-7 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">⚙️ Settings</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Manage your admin profile and account settings for WAISPATH
          </p>
          <div className="mt-4 text-sm text-blue-600 font-medium">
            👤 Profile Information • 🔒 Account Security
          </div>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <SettingsCard icon={UserIcon} title="Profile Information">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Administrator Name
                </label>
                <input
                  type="text"
                  value={settings.adminName}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      adminName: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  placeholder="Email address (read-only)"
                />
                <p className="text-sm text-gray-500 mt-2">
                  📧 Email address cannot be changed for security reasons
                </p>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💡</span>
                  <span className="font-medium text-blue-900">
                    Your profile information is used across the WAISPATH admin
                    dashboard
                  </span>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Security Settings */}
          <SettingsCard
            icon={KeyIcon}
            title="Security & Account"
            iconColor="text-red-600"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  disabled
                  className="group relative px-6 py-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl cursor-not-allowed font-medium opacity-75"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <KeyIcon className="h-5 w-5" />
                    <span>Change Password</span>
                  </div>
                </button>

                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="group relative px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isSigningOut ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Signing Out...</span>
                      </>
                    ) : (
                      <>
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </>
                    )}
                  </div>
                  {!isSigningOut && (
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-l-4 border-red-400">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🔒</span>
                  <span className="font-medium text-red-900">
                    Sign out securely when you&apos;re done using the admin
                    dashboard
                  </span>
                </div>
              </div>

              {/* User Info Display */}
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Role:
                    </span>
                    <span className="text-sm font-bold text-blue-600 capitalize">
                      {user?.customClaims.role?.replace("_", " ") || "Admin"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Status:
                    </span>
                    <span className="text-sm font-bold text-green-600 capitalize">
                      {user?.accountStatus || "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Admin ID:
                    </span>
                    <span className="text-sm font-mono text-gray-800">
                      {user?.uid?.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>
        </div>

        {/* Save Button for Profile Changes */}
        <div className="mt-12 flex justify-end space-x-4">
          <button
            onClick={() =>
              setSettings({
                adminName:
                  user?.displayName ||
                  user?.email?.split("@")[0] ||
                  "Admin User",
              })
            }
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium"
          >
            Reset Name
          </button>
          <button
            onClick={() =>
              toast.success(
                "Profile updated! (Note: This is a demo - actual saving would require API integration)"
              )
            }
            className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-bold text-lg"
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl">💾</span>
              <span>Save Profile</span>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-600 leading-relaxed">
            <strong>🔧 WAISPATH Admin Settings:</strong> Manage your profile
            information and account security. Your settings help personalize
            your experience while administering the accessibility system for
            Pasig City.
          </div>
        </div>
      </div>
    </div>
  );
}
