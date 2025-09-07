// src/app/dashboard/layout.tsx
// Updated with Admin Management and Audit Logs navigation

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
  UsersIcon, // Admin management icon
  DocumentTextIcon, // NEW: Audit logs icon
} from "@heroicons/react/24/outline";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current: boolean;
  adminOnly?: boolean; // Flag for admin-only pages
  auditOnly?: boolean; // NEW: Flag for audit-only pages
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, hasRole, hasPermission } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Navigation items with admin-only and audit-only sections
  const navigation: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      current: pathname === "/dashboard",
    },
    {
      name: "Priority Analysis",
      href: "/dashboard/priority",
      icon: FireIcon,
      current: pathname === "/dashboard/priority",
    },
    {
      name: "Admin Report",
      href: "/dashboard/reports",
      icon: DocumentChartBarIcon,
      current: pathname === "/dashboard/reports",
    },
    {
      name: "Obstacle Management",
      href: "/dashboard/obstacles",
      icon: ShieldCheckIcon,
      current: pathname === "/dashboard/obstacles",
    },
    {
      name: "Interactive Map",
      href: "/dashboard/map",
      icon: MapPinIcon,
      current: pathname === "/dashboard/map",
    },
    // Admin Management - Only for super_admin and lgu_admin
    {
      name: "Admin Management",
      href: "/dashboard/admins",
      icon: UsersIcon,
      current: pathname === "/dashboard/admins",
      adminOnly: true,
    },
    // NEW: Audit Logs - Only for super_admin and lgu_admin with audit:read permission
    {
      name: "Audit Logs",
      href: "/dashboard/audit",
      icon: DocumentTextIcon,
      current: pathname === "/dashboard/audit",
      auditOnly: true,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Cog6ToothIcon,
      current: pathname === "/dashboard/settings",
    },
  ];

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter((item) => {
    if (item.adminOnly) {
      // Only show admin management to super_admin and lgu_admin
      return hasRole("super_admin") || hasRole("lgu_admin");
    }
    if (item.auditOnly) {
      // Only show audit logs to users with audit:read permission
      return (
        hasPermission("audit:read") ||
        hasRole("super_admin") ||
        hasRole("lgu_admin")
      );
    }
    return true;
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo/Brand */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">WAISPATH Admin</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? "bg-blue-100 text-blue-900 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <Icon
                    className={`${
                      item.current ? "text-blue-600" : "text-gray-400"
                    } mr-3 h-5 w-5`}
                  />
                  {item.name}
                  {/* Badge for admin-only sections */}
                  {(item.adminOnly || item.auditOnly) && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Admin
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info - Enhanced with role display */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Logged in as: <span className="font-medium">{user.email}</span>
            </div>
            <div className="text-xs text-green-600 mt-1 flex items-center justify-between">
              <span>Firebase Connected • Rule Engine Active</span>
              {/* Role badge */}
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {user.customClaims.role?.replace("_", " ").toUpperCase() ||
                  "ADMIN"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">{children}</div>

      {/* Mobile Navigation - Updated for admin sections */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          {filteredNavigation.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  item.current ? "text-blue-600" : "text-gray-400"
                } flex flex-col items-center py-1`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
