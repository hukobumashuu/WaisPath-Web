// src/components/admin/AuditFiltersPanel.tsx
// MINIMAL REDESIGN: Clean, compact, modern with PROPER debouncing

"use client";

import React, { useState, useEffect } from "react";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";

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

interface FilterState {
  adminEmail: string;
  action: string;
  targetType: string;
  source: string;
  startDate: string;
  endDate: string;
  search: string;
}

interface AuditFiltersPanelProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  show: boolean;
  onToggle: () => void;
}

export default function AuditFiltersPanel({
  filters,
  onFilterChange,
  onReset,
  show,
  onToggle,
}: AuditFiltersPanelProps) {
  // Local state for email input (for debouncing)
  const [emailInput, setEmailInput] = useState(filters.adminEmail);

  // Sync local state with prop changes
  useEffect(() => {
    setEmailInput(filters.adminEmail);
  }, [filters.adminEmail]);

  // Debounce email input - only trigger filter change after 800ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInput !== filters.adminEmail) {
        onFilterChange("adminEmail", emailInput);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [emailInput, filters.adminEmail, onFilterChange]);

  // Check if any filters are active
  const hasActiveFilters = filters.adminEmail !== "" || filters.source !== "";

  return (
    <div className="mb-6">
      {/* Compact Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-sm"
          style={{
            borderColor: show ? PASIG.softBlue : PASIG.subtleBorder,
            backgroundColor: show ? `${PASIG.softBlue}08` : PASIG.card,
            color: show ? PASIG.softBlue : PASIG.slate,
          }}
        >
          <FunnelIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span
              className="ml-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: PASIG.softBlue }}
            />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setEmailInput(""); // Clear local state too
              onReset();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: PASIG.muted }}
          >
            <XMarkIcon className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Minimal Filter Panel */}
      {show && (
        <div
          className="rounded-xl p-5 shadow-sm border"
          style={{
            backgroundColor: PASIG.card,
            borderColor: PASIG.subtleBorder,
          }}
        >
          <div className="space-y-4">
            {/* Compact Admin Email Search */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: PASIG.muted }}
              >
                Search Admin
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@example.com"
                className="w-full max-w-md px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400"
                style={{
                  borderColor: PASIG.subtleBorder,
                  backgroundColor: PASIG.bg,
                  color: PASIG.slate,
                }}
              />
              <p className="mt-1 text-xs" style={{ color: PASIG.muted }}>
                Filters after 800ms of typing
              </p>
            </div>

            {/* Compact Source Filter - Pills */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: PASIG.muted }}
              >
                Source
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "", label: "All", icon: "🌐" },
                  { value: "web_portal", label: "Web", icon: "💻" },
                  { value: "mobile_app", label: "Mobile", icon: "📱" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onFilterChange("source", option.value)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor:
                        filters.source === option.value
                          ? PASIG.softBlue
                          : PASIG.bg,
                      color:
                        filters.source === option.value ? "white" : PASIG.slate,
                      border: `1px solid ${
                        filters.source === option.value
                          ? PASIG.softBlue
                          : PASIG.subtleBorder
                      }`,
                    }}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
