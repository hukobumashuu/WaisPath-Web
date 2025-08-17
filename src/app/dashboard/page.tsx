// src/app/dashboard/page.tsx
// FIXED: Simple dashboard homepage without complex dependencies

"use client";

import React from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPinIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  FireIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  color: string;
}

export default function AdminDashboard() {
  const { user, loading, signOut } = useAdminAuth();
  const router = useRouter();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user?.isAdmin) {
    return null;
  }

  // Dashboard cards
  const dashboardCards: DashboardCard[] = [
    {
      title: "Priority Analysis",
      description:
        "Smart obstacle prioritization with community validation weighting",
      href: "/dashboard/priority",
      icon: FireIcon,
      status: "Ready",
      color: "border-red-200 bg-red-50",
    },
    {
      title: "LGU Reports",
      description:
        "Generate accessibility compliance reports for local government",
      href: "/dashboard/reports",
      icon: DocumentChartBarIcon,
      status: "Ready",
      color: "border-purple-200 bg-purple-50",
    },
    {
      title: "Interactive Map",
      description: "Visualize and manage accessibility obstacles in real-time",
      href: "/dashboard/map",
      icon: MapPinIcon,
      status: "Ready",
      color: "border-blue-200 bg-blue-50",
    },
    {
      title: "Obstacle Management",
      description: "Review, approve, and manage reported accessibility issues",
      href: "/dashboard/obstacles",
      icon: ShieldCheckIcon,
      status: "Ready",
      color: "border-green-200 bg-green-50",
    },
    {
      title: "Analytics",
      description: "View comprehensive analytics and usage statistics",
      href: "/dashboard/analytics",
      icon: ChartBarIcon,
      status: "Ready",
      color: "border-orange-200 bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🔥 WAISPATH Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 flex items-center space-x-2">
                <span>Intelligent Accessibility Management for Pasig City</span>
                <span className="text-green-600">• System Online</span>
                <span className="text-blue-600">• Welcome, {user.email}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Notifications
              </button>
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">
              Welcome to WAISPATH Admin Dashboard
            </h2>
            <p className="text-blue-100">
              Manage accessibility infrastructure and empower PWDs in Pasig City
              with intelligent route planning and real-time obstacle reporting.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Obstacles
                </p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FireIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  High Priority
                </p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Routes
                </p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Reports Generated
                </p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <div
                  className={`bg-white rounded-lg p-6 shadow-sm border-2 hover:shadow-md transition-shadow cursor-pointer ${card.color}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <Icon className="h-6 w-6 text-gray-700 mr-2" />
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                          {card.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      Access Module →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500">
                  System activity will appear here once you start using the
                  modules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
