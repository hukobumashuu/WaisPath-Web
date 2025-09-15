// src/components/admin/AuditStatsCards.tsx
// Modern stats cards for audit dashboard - Fixed TypeScript errors

"use client";

import React from "react";
import {
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

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

interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: "obstacle" | "user" | "admin" | "system";
  targetId: string;
  targetDescription?: string;
  details: string;
  timestamp: Date;
}

interface AuditStats {
  totalActions: number;
  webActions?: number;
  mobileActions?: number;
  actionsByType: Record<string, number>;
  actionsBySource?: {
    web_portal: number;
    mobile_app: number;
  };
  topAdmins: Array<{ adminEmail: string; actionCount: number }>;
  recentActions: AuditLogEntry[];
}

interface AuditStatsCardsProps {
  stats: AuditStats;
  loading?: boolean;
}

export default function AuditStatsCards({
  stats,
  loading = false,
}: AuditStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-pulse"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Actions",
      value: stats.totalActions.toLocaleString(),
      icon: DocumentTextIcon,
      color: PASIG.primaryNavy,
      bgColor: `${PASIG.primaryNavy}15`,
      description: "All admin activities",
    },
    {
      title: "Mobile Actions",
      value: stats.mobileActions?.toLocaleString() || "0",
      icon: DevicePhoneMobileIcon,
      color: PASIG.softBlue,
      bgColor: `${PASIG.softBlue}15`,
      description: "From mobile app",
    },
    {
      title: "Web Actions",
      value: stats.webActions?.toLocaleString() || "0",
      icon: ComputerDesktopIcon,
      color: PASIG.muted,
      bgColor: `${PASIG.muted}15`,
      description: "From web portal",
    },
    {
      title: "Active Admins",
      value: stats.topAdmins.length.toString(),
      icon: UserIcon,
      color: PASIG.success,
      bgColor: `${PASIG.success}15`,
      description: "Contributing admins",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card) => {
        const Icon = card.icon;
        const numericValue = parseInt(card.value.replace(/,/g, ""));
        const percentage =
          stats.totalActions > 0
            ? (numericValue / stats.totalActions) * 100
            : 0;

        return (
          <div
            key={card.title}
            className="bg-white rounded-2xl p-6 shadow-sm border transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            style={{ borderColor: PASIG.subtleBorder }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: card.bgColor }}
              >
                <Icon className="h-6 w-6" style={{ color: card.color }} />
              </div>
              <div className="text-right">
                <p
                  className="text-2xl font-bold"
                  style={{ color: PASIG.slate }}
                >
                  {card.value}
                </p>
              </div>
            </div>

            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: PASIG.slate }}
              >
                {card.title}
              </p>
              <p className="text-xs" style={{ color: PASIG.muted }}>
                {card.description}
              </p>
            </div>

            {/* Progress indicator */}
            <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-700 ease-out rounded-full"
                style={{
                  backgroundColor: card.color,
                  width: `${Math.min(100, percentage)}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
