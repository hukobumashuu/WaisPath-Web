// app/dashboard/page.tsx
// Main WAISPATH Admin Dashboard Page

"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { adminFirebaseServices } from "@/lib/firebase/admin";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  UsersIcon,
  MapPinIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface DashboardStats {
  obstacles: {
    total: number;
    pending: number;
    verified: number;
    resolved: number;
    falseReports: number;
  };
  users: {
    total: number;
    active: number;
  };
  recentActivity: Array<{
    id: string;
    type: "obstacle_reported" | "obstacle_verified" | "user_joined";
    message: string;
    timestamp: Date;
    user?: string;
  }>;
}

export default function AdminDashboard() {
  const { user, loading, signOut } = useAdminAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Load dashboard statistics
  useEffect(() => {
    if (user?.isAdmin) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true);

      // For now, we'll use dummy data since your mobile app has dummy data
      // In production, this would call: await adminFirebaseServices.obstacles.getStats();
      const dummyStats: DashboardStats = {
        obstacles: {
          total: 247,
          pending: 23,
          verified: 186,
          resolved: 32,
          falseReports: 6,
        },
        users: {
          total: 156,
          active: 89,
        },
        recentActivity: [
          {
            id: "1",
            type: "obstacle_reported",
            message:
              "New obstacle reported: Vendor blocking sidewalk near Pasig City Hall",
            timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
            user: "PWD User #1234",
          },
          {
            id: "2",
            type: "obstacle_verified",
            message: "Obstacle verified: Broken pavement on Rizal Avenue",
            timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
          },
          {
            id: "3",
            type: "user_joined",
            message: "New user joined: Wheelchair user from Kapitolyo",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          },
          {
            id: "4",
            type: "obstacle_reported",
            message: "New obstacle: Flooding reported on Ortigas Extension",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
            user: "PWD User #5678",
          },
        ],
      };

      setStats(dummyStats);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Obstacles",
      value: stats?.obstacles.total || 0,
      icon: MapPinIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12% from last month",
    },
    {
      name: "Pending Review",
      value: stats?.obstacles.pending || 0,
      icon: ClockIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      change: "23 need immediate attention",
    },
    {
      name: "Verified Obstacles",
      value: stats?.obstacles.verified || 0,
      icon: CheckCircleIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8% verification rate",
    },
    {
      name: "Active Users",
      value: stats?.users.active || 0,
      icon: UsersIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "89 active this week",
    },
  ];

  const quickActions = [
    {
      name: "Review Pending Obstacles",
      description: "Approve or reject community reports",
      href: "/dashboard/obstacles?status=pending",
      icon: ClockIcon,
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      name: "View All Obstacles",
      description: "Manage all accessibility obstacles",
      href: "/dashboard/obstacles",
      icon: MapPinIcon,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      name: "User Management",
      description: "View and manage PWD users",
      href: "/dashboard/users",
      icon: UsersIcon,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      name: "Analytics",
      description: "View accessibility insights",
      href: "/dashboard/analytics",
      icon: ChartBarIcon,
      color: "bg-green-500 hover:bg-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">WAISPATH</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
          <p className="mt-2 text-gray-600">
            Here's what's happening with WAISPATH accessibility data in Pasig
            City.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className={`${action.color} text-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow`}
              >
                <action.icon className="h-8 w-8 mb-3" />
                <h4 className="font-semibold mb-2">{action.name}</h4>
                <p className="text-sm opacity-90">{action.description}</p>
                <ArrowRightIcon className="h-4 w-4 mt-3" />
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {loadingStats ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading activity...
              </div>
            ) : (
              stats?.recentActivity.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === "obstacle_reported" && (
                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
                      )}
                      {activity.type === "obstacle_verified" && (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      )}
                      {activity.type === "user_joined" && (
                        <UsersIcon className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      {activity.user && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reported by: {activity.user}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-sm text-green-800">
              All systems operational • Last updated:{" "}
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
