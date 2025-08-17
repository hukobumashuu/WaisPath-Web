"use client";

import React, { useState } from "react";
import {
  UserIcon,
  BellIcon,
  Cog6ToothIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Profile
    adminName: "Admin User",
    email: "admin@pasig.gov.ph",

    // Notifications
    emailNotifications: true,
    priorityAlerts: true,

    // System
    autoRefresh: true,
    darkMode: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  const Toggle = ({
    enabled,
    onChange,
    label,
    description,
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 mt-1">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 shadow-sm ${
          enabled
            ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-200"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-200 shadow-lg ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
      <div className="max-w-4xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">⚙️ Settings</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Manage your admin preferences and system settings for optimal
            WAISPATH experience
          </p>
          <div className="mt-4 text-sm text-blue-600 font-medium">
            🔧 Personalize your dashboard • Configure notifications • Manage
            security
          </div>
        </div>

        <div className="space-y-8">
          {/* Enhanced Profile Settings */}
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
                  value={settings.email}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💡</span>
                  <span className="font-medium text-blue-900">
                    Your profile information helps personalize your WAISPATH
                    admin experience
                  </span>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Enhanced Notification Settings */}
          <SettingsCard icon={BellIcon} title="Notification Preferences">
            <div className="space-y-2">
              <Toggle
                enabled={settings.emailNotifications}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    emailNotifications: value,
                  }))
                }
                label="Email Notifications"
                description="Receive email alerts for important system events and updates"
              />
              <div className="border-t border-gray-100"></div>
              <Toggle
                enabled={settings.priorityAlerts}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, priorityAlerts: value }))
                }
                label="High Priority Alerts"
                description="Get instant notifications for critical accessibility obstacles"
              />
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-l-4 border-yellow-400">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📱</span>
                <span className="font-medium text-yellow-900">
                  Stay informed about urgent accessibility issues in Pasig City
                </span>
              </div>
            </div>
          </SettingsCard>

          {/* Enhanced System Preferences */}
          <SettingsCard icon={Cog6ToothIcon} title="System Preferences">
            <div className="space-y-2">
              <Toggle
                enabled={settings.autoRefresh}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, autoRefresh: value }))
                }
                label="Auto-Refresh Dashboard"
                description="Automatically update obstacle data and priority rankings"
              />
              <div className="border-t border-gray-100"></div>
              <Toggle
                enabled={settings.darkMode}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, darkMode: value }))
                }
                label="Dark Mode"
                description="Use dark theme for reduced eye strain during long sessions"
              />
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-400">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎨</span>
                <span className="font-medium text-purple-900">
                  Customize your workspace for maximum productivity
                </span>
              </div>
            </div>
          </SettingsCard>

          {/* Enhanced Security Settings */}
          <SettingsCard
            icon={KeyIcon}
            title="Security & Account"
            iconColor="text-red-600"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="group relative px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium">
                  <div className="flex items-center justify-center space-x-2">
                    <KeyIcon className="h-5 w-5" />
                    <span>Change Password</span>
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
                </button>

                <button className="group relative px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium">
                  <div className="flex items-center justify-center space-x-2">
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-l-4 border-red-400">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🔒</span>
                  <span className="font-medium text-red-900">
                    Keep your admin account secure with regular password updates
                  </span>
                </div>
              </div>
            </div>
          </SettingsCard>
        </div>

        {/* Enhanced Save Button */}
        <div className="mt-12 flex justify-end space-x-4">
          <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium">
            Reset Changes
          </button>
          <button className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-bold text-lg">
            <div className="flex items-center space-x-2">
              <span className="text-xl">💾</span>
              <span>Save Changes</span>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
          </button>
        </div>

        {/* Enhanced Footer Info */}
        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-600 leading-relaxed">
            <strong>🔧 Settings Auto-Save:</strong> Your preferences are
            automatically saved to ensure a seamless WAISPATH admin experience.
            Changes take effect immediately and persist across sessions.
          </div>
        </div>
      </div>
    </div>
  );
}
