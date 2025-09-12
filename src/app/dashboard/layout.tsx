// src/app/dashboard/layout.tsx
// UPDATED: Navigation with enhanced audit page (no duplicate)

"use client";

import React from "react";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  MapPinIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  FireIcon,
  ShieldCheckIcon,
  UsersIcon,
  DocumentTextIcon, // Enhanced audit icon
} from "@heroicons/react/24/outline";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current: boolean;
  adminOnly?: boolean;
  auditOnly?: boolean;
  description?: string;
  badge?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, hasRole, hasPermission } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Navigation items with enhanced audit page
  const navigation: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      current: pathname === "/dashboard",
      description: "Overview and key metrics",
    },
    {
      name: "Analysis",
      href: "/dashboard/priority",
      icon: FireIcon,
      current: pathname === "/dashboard/priority",
      description: "Priority analysis and scoring",
    },
    {
      name: "Report",
      href: "/dashboard/reports",
      icon: DocumentChartBarIcon,
      current: pathname === "/dashboard/reports",
      description: "Generate reports and insights",
    },
    {
      name: "Obstacle",
      href: "/dashboard/obstacles",
      icon: ShieldCheckIcon,
      current: pathname === "/dashboard/obstacles",
      description: "Manage obstacle reports",
    },
    {
      name: "Map",
      href: "/dashboard/map",
      icon: MapPinIcon,
      current: pathname === "/dashboard/map",
      description: "Interactive accessibility map",
    },
    // Admin Management - Only for super_admin and lgu_admin
    {
      name: "Admins",
      href: "/dashboard/admins",
      icon: UsersIcon,
      current: pathname === "/dashboard/admins",
      adminOnly: true,
      description: "Manage admin accounts",
    },
    // ENHANCED: Activity Logs with Mobile Support
    {
      name: "Activity Logs",
      href: "/dashboard/audit",
      icon: DocumentTextIcon,
      current: pathname === "/dashboard/audit",
      auditOnly: true,
      description: "Track admin activities (web + mobile)",
      badge: "Enhanced", // Show this is enhanced with mobile support
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Cog6ToothIcon,
      current: pathname === "/dashboard/settings",
      description: "System configuration",
    },
  ];

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter((item) => {
    if (item.adminOnly) {
      return hasRole("super_admin") || hasRole("lgu_admin");
    }
    if (item.auditOnly) {
      return (
        hasPermission("audit:read") ||
        hasRole("super_admin") ||
        hasRole("lgu_admin")
      );
    }
    return true;
  });

  // Redirect non-admin users
  React.useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 bg-blue-600">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">WAISPATH</h1>
                <p className="text-xs text-blue-200">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {user.customClaims.role?.replace("_", " ").toUpperCase() ||
                    "ADMIN"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  title={item.description}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>

                  {/* Enhanced badge for updated audit page */}
                  {item.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      {item.badge}
                    </span>
                  )}

                  {/* Admin-only badge */}
                  {item.adminOnly && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Admin
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">WAISPATH Admin v2.1</span>
              <button
                onClick={() => {
                  // Handle logout
                  router.push("/");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
