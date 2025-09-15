// src/app/dashboard/layout.tsx
// ENHANCED: Navigation with name display and Pasig color scheme

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
  DocumentTextIcon,
  UserCircleIcon,
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

  // Navigation items
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
    {
      name: "Admins",
      href: "/dashboard/admins",
      icon: UsersIcon,
      current: pathname === "/dashboard/admins",
      adminOnly: true,
      description: "Manage admin accounts",
    },
    {
      name: "Activity Logs",
      href: "/dashboard/audit",
      icon: DocumentTextIcon,
      current: pathname === "/dashboard/audit",
      auditOnly: true,
      description: "Track admin activities",
      badge: "Enhanced",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Cog6ToothIcon,
      current: pathname === "/dashboard/settings",
      description: "Profile and system settings",
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

  // Get display name with fallback
  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Admin User";
  };

  // Redirect non-admin users
  React.useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push("/");
    }
  }, [user, loading, router]);

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
          <p style={{ color: PASIG.muted }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PASIG.bg }}>
      {/* Enhanced Sidebar */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl"
        style={{ backgroundColor: PASIG.card }}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div
            className="flex items-center h-16 px-4"
            style={{ backgroundColor: PASIG.primaryNavy }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: PASIG.softBlue }}
              >
                <MapPinIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">WAISPATH</h1>
                <p className="text-blue-200 text-xs">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Enhanced Profile Section */}
          <div
            className="p-4 border-b"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: PASIG.bg }}
              >
                <UserCircleIcon
                  className="h-6 w-6"
                  style={{ color: PASIG.softBlue }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: PASIG.slate }}
                >
                  {getDisplayName()}
                </p>
                <p className="text-xs truncate" style={{ color: PASIG.muted }}>
                  {user?.email}
                </p>
                <p
                  className="text-xs font-medium px-2 py-1 rounded-full inline-block mt-1"
                  style={{
                    backgroundColor: PASIG.bg,
                    color: PASIG.softBlue,
                  }}
                >
                  {user?.customClaims.role?.replace("_", " ") || "Admin"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    item.current
                      ? "shadow-lg transform scale-105"
                      : "hover:shadow-md hover:transform hover:scale-102"
                  }`}
                  style={{
                    backgroundColor: item.current
                      ? PASIG.softBlue
                      : "transparent",
                    color: item.current ? "white" : PASIG.slate,
                  }}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors`} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: item.current
                          ? "rgba(255,255,255,0.2)"
                          : PASIG.bg,
                        color: item.current ? "white" : PASIG.softBlue,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className="p-4 border-t"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            <div className="text-center">
              <p className="text-xs" style={{ color: PASIG.muted }}>
                WAISPATH Admin Portal
              </p>
              <p className="text-xs" style={{ color: PASIG.muted }}>
                Pasig City Accessibility Management
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
