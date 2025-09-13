// src/app/auth/login/page.tsx
// ENHANCED: Login page with account status change notifications

"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";

/* ---------- Pasig color scheme ---------- */
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

export default function LoginPage() {
  const { user, loading, signIn } = useAdminAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: "deactivated" | "suspended" | null;
    message: string;
  }>({ type: null, message: "" });

  // NEW: Listen for account status change events
  useEffect(() => {
    const handleAccountStatusChange = (event: CustomEvent) => {
      const { status, message } = event.detail;

      setStatusNotification({
        type: status,
        message,
      });

      // Show toast notification
      if (status === "deactivated") {
        toast.error(message, { duration: 10000 });
      } else if (status === "suspended") {
        toast.error(message, { duration: 10000 });
      }
    };

    window.addEventListener(
      "accountStatusChanged",
      handleAccountStatusChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "accountStatusChanged",
        handleAccountStatusChange as EventListener
      );
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user?.isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsSubmitting(true);
    setStatusNotification({ type: null, message: "" }); // Clear any previous notifications

    try {
      const result = await signIn(email.trim(), password);

      if (result.success) {
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        // Check if error is related to account status
        if (result.error?.includes("deactivated")) {
          setStatusNotification({
            type: "deactivated",
            message: result.error,
          });
        } else if (result.error?.includes("suspended")) {
          setStatusNotification({
            type: "suspended",
            message: result.error,
          });
        }

        toast.error(result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PASIG.bg }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: PASIG.softBlue }}
          ></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: PASIG.bg }}
    >
      <Toaster position="top-right" />

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div
            className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: PASIG.primaryNavy }}
          >
            <span className="text-2xl font-bold text-white">W</span>
          </div>
          <h2
            className="text-3xl font-bold"
            style={{ color: PASIG.primaryNavy }}
          >
            WAISPATH Admin
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your administrator account
          </p>
        </div>

        {/* NEW: Account Status Notification */}
        {statusNotification.type && (
          <div
            className={`rounded-lg p-4 border-l-4 ${
              statusNotification.type === "deactivated"
                ? "bg-red-50 border-red-400"
                : "bg-yellow-50 border-yellow-400"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {statusNotification.type === "deactivated" ? (
                  <XMarkIcon className="h-5 w-5 text-red-400" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                )}
              </div>
              <div className="ml-3">
                <h3
                  className={`text-sm font-medium ${
                    statusNotification.type === "deactivated"
                      ? "text-red-800"
                      : "text-yellow-800"
                  }`}
                >
                  Account{" "}
                  {statusNotification.type === "deactivated"
                    ? "Deactivated"
                    : "Suspended"}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    statusNotification.type === "deactivated"
                      ? "text-red-700"
                      : "text-yellow-700"
                  }`}
                >
                  {statusNotification.message}
                </p>
                <div className="mt-2">
                  <p className="text-xs text-gray-600">
                    If you believe this is an error, please contact your system
                    administrator.
                  </p>
                </div>
              </div>
              <div className="ml-auto flex-shrink-0">
                <button
                  onClick={() =>
                    setStatusNotification({ type: null, message: "" })
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="relative block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your admin email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="relative block w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: PASIG.softBlue }}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          {/* Info Message */}
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800">
                    Admin Access Required
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your account must have admin privileges to sign in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            WAISPATH Admin Dashboard v1.0 • Pasig City PWD Navigation System
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Need admin access? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
