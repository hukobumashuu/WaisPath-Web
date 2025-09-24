// src/app/dashboard/page.tsx
// ENHANCED: Modern dashboard homepage with Pasig color scheme + Backend connection

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPinIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UsersIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

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

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  gradient: string;
}

interface StatsData {
  totalObstacles: number;
  totalUsers: number;
  totalAdmins: number;
  resolvedObstacles: number; // UPDATED: Replace reportsGenerated with resolvedObstacles
  pendingObstacles?: number;
  avgResponseTime?: number;
  lastUpdated?: string;
}

export default function AdminDashboard() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData>({
    totalObstacles: 0,
    totalUsers: 0,
    totalAdmins: 0,
    resolvedObstacles: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Helper function to get auth token (following your codebase pattern)
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("⏳ No authenticated user");
        return null;
      }
      const idToken = await currentUser.getIdToken();
      return idToken;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  };

  // NEW: Fetch real stats from backend API (memoized to fix useEffect dependencies)
  const fetchDashboardStats = useCallback(async () => {
    if (!user?.isAdmin) {
      console.log("⏳ Waiting for user authentication...");
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);
      console.log("📡 Fetching dashboard stats from API...");

      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error("Failed to get authentication token");
      }

      const response = await fetch("/api/dashboard/stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        console.log("📊 Dashboard stats loaded:", result.data);
        setStats(result.data);
      } else {
        throw new Error(result.error || "Invalid API response");
      }
    } catch (error) {
      console.error("❌ Failed to fetch dashboard stats:", error);
      setStatsError(
        error instanceof Error ? error.message : "Failed to load stats"
      );

      // Fallback to placeholder data
      setStats({
        totalObstacles: 0,
        totalUsers: 0,
        totalAdmins: 0,
        resolvedObstacles: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, [user?.isAdmin]);

  // Load stats when user is ready
  useEffect(() => {
    if (user?.isAdmin) {
      fetchDashboardStats();
    }
  }, [user?.isAdmin, fetchDashboardStats]);

  // Get display name with fallback
  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName.split(" ")[0]; // First name only for greeting
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Admin";
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PASIG.bg }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: PASIG.softBlue }}
          />
          <p style={{ color: PASIG.muted }}>Loading WAISPATH dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user?.isAdmin) {
    return null;
  }

  // Dashboard cards - keeping your existing setup
  const dashboardCards: DashboardCard[] = [
    {
      title: "Obstacle Management",
      description:
        "Review, verify, and manage community-reported accessibility barriers",
      href: "/dashboard/priority",
      icon: ShieldCheckIcon,
      status: "Active",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Interactive Map",
      description:
        "Visualize accessibility data and obstacle locations across Pasig City",
      href: "/dashboard/map",
      icon: MapPinIcon,
      status: "Ready",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Admin Management",
      description:
        "Manage administrator accounts, roles, and permissions system-wide",
      href: "/dashboard/admins",
      icon: UserGroupIcon,
      status: "Ready",
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Activity Logs",
      description:
        "Monitor admin activities and system events with detailed audit trails",
      href: "/dashboard/audit",
      icon: ChartBarIcon,
      status: "Enhanced",
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: PASIG.softBlue }}
            >
              <MapPinIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: PASIG.slate }}>
                Welcome back, {getDisplayName()}!
              </h1>
              <p className="text-lg mt-1" style={{ color: PASIG.muted }}>
                WAISPATH Admin Portal - Managing accessibility for Pasig City
              </p>
            </div>
          </div>

          {/* Time-based greeting */}
          <div
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: PASIG.card,
              color: PASIG.softBlue,
              border: `1px solid ${PASIG.subtleBorder}`,
            }}
          >
            {new Date().getHours() < 12
              ? "🌅"
              : new Date().getHours() < 18
              ? "☀️"
              : "🌙"}
            <span className="ml-2">
              {new Date().getHours() < 12
                ? "Good morning"
                : new Date().getHours() < 18
                ? "Good afternoon"
                : "Good evening"}
            </span>
          </div>
        </div>

        {/* Error State */}
        {statsError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">
                  Failed to load dashboard statistics
                </p>
                <p className="text-red-600 text-sm">{statsError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards - Now connected to backend */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Obstacles */}
          <div
            className="rounded-2xl p-6 shadow-sm border transition-all duration-200 hover:shadow-lg"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: PASIG.muted }}
                >
                  Total Obstacles
                </p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: PASIG.slate }}
                  >
                    {stats.totalObstacles.toLocaleString()}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: PASIG.success }}>
                  Community reports
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${PASIG.success}15` }}
              >
                <ShieldCheckIcon
                  className="h-6 w-6"
                  style={{ color: PASIG.success }}
                />
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div
            className="rounded-2xl p-6 shadow-sm border transition-all duration-200 hover:shadow-lg"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: PASIG.muted }}
                >
                  Users
                </p>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: PASIG.slate }}
                  >
                    {stats.totalUsers.toLocaleString()}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: PASIG.softBlue }}>
                  Active community
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${PASIG.softBlue}15` }}
              >
                <UsersIcon
                  className="h-6 w-6"
                  style={{ color: PASIG.softBlue }}
                />
              </div>
            </div>
          </div>

          {/* Total Admins */}
          <div
            className="rounded-2xl p-6 shadow-sm border transition-all duration-200 hover:shadow-lg"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: PASIG.muted }}
                >
                  Admins
                </p>
                {statsLoading ? (
                  <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: PASIG.slate }}
                  >
                    {stats.totalAdmins}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: PASIG.warning }}>
                  System managers
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${PASIG.warning}15` }}
              >
                <UserGroupIcon
                  className="h-6 w-6"
                  style={{ color: PASIG.warning }}
                />
              </div>
            </div>
          </div>

          {/* UPDATED: Resolved Obstacles (now connected to backend) */}
          <div
            className="rounded-2xl p-6 shadow-sm border transition-all duration-200 hover:shadow-lg"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: PASIG.muted }}
                >
                  Resolved Obstacles
                </p>
                {statsLoading ? (
                  <div className="h-8 w-14 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: PASIG.slate }}
                  >
                    {stats.resolvedObstacles.toLocaleString()}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: PASIG.success }}>
                  Successfully addressed
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${PASIG.success}15` }}
              >
                <CheckCircleIcon
                  className="h-6 w-6"
                  style={{ color: PASIG.success }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards Grid - keeping exactly as you have it */}
        <div>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: PASIG.slate }}
          >
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <div
                    className="group rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    style={{
                      backgroundColor: PASIG.card,
                      borderColor: PASIG.subtleBorder,
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${card.gradient} shadow-lg`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span
                        className="px-3 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor:
                            card.status === "Enhanced"
                              ? `${PASIG.softBlue}15`
                              : `${PASIG.success}15`,
                          color:
                            card.status === "Enhanced"
                              ? PASIG.softBlue
                              : PASIG.success,
                        }}
                      >
                        {card.status}
                      </span>
                    </div>

                    <h3
                      className="text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors"
                      style={{ color: PASIG.slate }}
                    >
                      {card.title}
                    </h3>

                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: PASIG.muted }}
                    >
                      {card.description}
                    </p>

                    <div
                      className="mt-4 flex items-center text-sm font-medium group-hover:text-blue-600 transition-colors"
                      style={{ color: PASIG.softBlue }}
                    >
                      <span>Open module</span>
                      <svg
                        className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Status Footer - Enhanced with backend connection info */}
        <div className="mt-12">
          <div
            className="rounded-2xl p-6 border"
            style={{
              backgroundColor: PASIG.card,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: PASIG.slate }}
                >
                  System Status
                </h3>
                <p className="text-sm" style={{ color: PASIG.muted }}>
                  {statsError
                    ? "Connection issues detected"
                    : "All systems operational"}{" "}
                  • Connected to Firebase • Real-time data from Firebase Auth &
                  Firestore
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: statsError ? PASIG.danger : PASIG.success,
                  }}
                ></div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: statsError ? PASIG.danger : PASIG.success,
                  }}
                >
                  {statsError ? "Degraded" : "Healthy"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
