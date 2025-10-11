import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ObstacleType,
  ObstacleStatus,
  ObstacleSeverity,
  AdminObstacle,
} from "@/types/admin";
import {
  getObstacleTypeLabel,
  getObstacleTypeEmoji,
} from "@/lib/utils/obstacleTypeHelpers";

/**
 * Pasig Color Scheme (Matching Dashboard Sidebar)
 */
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

// ============================================
// FILTER INTERFACES
// ============================================

export interface MapFilters {
  status: ObstacleStatus | "all";
  type: ObstacleType | "all";
  severity: ObstacleSeverity | "all";
}

interface FilterPanelProps {
  isOpen: boolean;
  filters: MapFilters;
  obstacles: AdminObstacle[];
  onFilterChange: (filters: MapFilters) => void;
  onClose: () => void;
}

// ============================================
// FILTER BUTTON COMPONENT (styling-only update)
// ============================================

interface FilterButtonProps {
  label: string;
  emoji?: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

/**
 * FilterButton - Updated visual: horizontal, compact, subtle shadow, better truncation
 * NO behavior changes — only styling.
 */
const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  emoji,
  count,
  active,
  onClick,
}) => {
  const isVerifiedLabel = label.toLowerCase() === "verified";

  return (
    <button
      onClick={onClick}
      title={`${label} (${count})`}
      aria-pressed={active}
      className={`
        w-full px-3 py-2 rounded-lg border transition-all duration-150
        flex items-center gap-3
        focus:outline-none focus:ring-2 focus:ring-offset-1
      `}
      style={{
        backgroundColor: active ? PASIG.softBlue : PASIG.card,
        borderColor: active ? "transparent" : PASIG.subtleBorder,
        boxShadow: active
          ? "0 8px 20px rgba(43,164,255,0.12)"
          : "0 6px 18px rgba(12,20,40,0.04)",
        color: active ? "#fff" : PASIG.slate,
      }}
    >
      {/* Emoji / icon */}
      {emoji ? (
        <span
          className="flex-none text-lg"
          style={{ opacity: active ? 0.95 : 0.9, lineHeight: 1 }}
        >
          {emoji}
        </span>
      ) : (
        <span className="w-3" />
      )}

      {/* Label (truncation to avoid overflow) */}
      <div
        className="flex-1 text-sm font-medium truncate"
        style={{
          color: !active && isVerifiedLabel ? PASIG.softBlue : undefined,
        }}
      >
        {label}
      </div>

      {/* Count badge */}
      <div
        className="flex-none text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: active ? "rgba(255,255,255,0.12)" : PASIG.bg,
          border: `1px solid ${
            active ? "rgba(255,255,255,0.08)" : PASIG.subtleBorder
          }`,
          color: active ? "white" : PASIG.muted,
          minWidth: 36,
          textAlign: "center",
        }}
      >
        {count}
      </div>
    </button>
  );
};

// ============================================
// ACTIVE FILTER CHIP COMPONENT (styling-only)
// ============================================

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

/**
 * FilterChip - trimmed width, ellipsis, accessible title for full text, subtle hover
 */
const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm"
      title={label}
      style={{
        background: PASIG.bg,
        color: PASIG.primaryNavy,
        border: `1px solid ${PASIG.subtleBorder}`,
        maxWidth: 220,
      }}
    >
      <span className="truncate max-w-[10rem]">{label}</span>
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{
          color: PASIG.muted,
          background: "transparent",
        }}
        aria-label={`Remove ${label} filter`}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = PASIG.subtleBorder;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// ============================================
// MAIN FILTER PANEL COMPONENT (styling-only)
// ============================================

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  filters,
  obstacles,
  onFilterChange,
  onClose,
}) => {
  if (!isOpen) return null;

  // ============================================
  // CALCULATE COUNTS (unchanged)
  // ============================================

  const counts = {
    status: {
      all: obstacles.length,
      pending: obstacles.filter((o) => o.status === "pending").length,
      verified: obstacles.filter((o) => o.status === "verified").length,
      resolved: obstacles.filter((o) => o.status === "resolved").length,
    },
    type: {
      all: obstacles.length,
      vendor_blocking: obstacles.filter((o) => o.type === "vendor_blocking")
        .length,
      parked_vehicles: obstacles.filter((o) => o.type === "parked_vehicles")
        .length,
      construction: obstacles.filter((o) => o.type === "construction").length,
      broken_infrastructure: obstacles.filter(
        (o) => o.type === "broken_infrastructure"
      ).length,
      debris: obstacles.filter((o) => o.type === "debris").length,
      electrical_post: obstacles.filter((o) => o.type === "electrical_post")
        .length,
      other: obstacles.filter((o) => o.type === "other").length,
    },
    severity: {
      all: obstacles.length,
      blocking: obstacles.filter((o) => o.severity === "blocking").length,
      high: obstacles.filter((o) => o.severity === "high").length,
      medium: obstacles.filter((o) => o.severity === "medium").length,
      low: obstacles.filter((o) => o.severity === "low").length,
    },
  };

  // ============================================
  // FILTER HANDLERS (unchanged behavior)
  // ============================================

  const handleStatusChange = (status: ObstacleStatus | "all") => {
    onFilterChange({ ...filters, status });
  };

  const handleTypeChange = (type: ObstacleType | "all") => {
    onFilterChange({ ...filters, type });
  };

  const handleSeverityChange = (severity: ObstacleSeverity | "all") => {
    onFilterChange({ ...filters, severity });
  };

  const handleReset = () => {
    onFilterChange({
      status: "all",
      type: "all",
      severity: "all",
    });
  };

  // ============================================
  // ACTIVE FILTERS (unchanged behaviour — labels trimmed)
  // ============================================

  const activeFilters: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }> = [];

  if (filters.status !== "all") {
    activeFilters.push({
      key: "status",
      label: filters.status.replace("_", " ").toUpperCase(),
      onRemove: () => handleStatusChange("all"),
    });
  }

  if (filters.type !== "all") {
    activeFilters.push({
      key: "type",
      label: getObstacleTypeLabel(filters.type),
      onRemove: () => handleTypeChange("all"),
    });
  }

  if (filters.severity !== "all") {
    activeFilters.push({
      key: "severity",
      label: filters.severity.toUpperCase(),
      onRemove: () => handleSeverityChange("all"),
    });
  }

  // ============================================
  // RENDER (styling-only updates)
  // ============================================

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-sm z-30 lg:hidden"
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div
        className="fixed top-16 right-4 z-40 w-[calc(100vw-2rem)] lg:w-96 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl shadow-lg border"
        style={{
          backgroundColor: PASIG.card,
          borderColor: PASIG.subtleBorder,
        }}
      >
        {/* Header - modern minimalist */}
        <div
          className="sticky top-0 z-10 px-5 py-4 border-b flex items-center justify-between"
          style={{
            background: `linear-gradient(90deg, ${PASIG.primaryNavy}, ${PASIG.primaryNavy})`,
            borderColor: PASIG.subtleBorder,
          }}
        >
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-sm font-medium text-white/90 hover:text-white/100 transition-colors"
              aria-label="Reset filters"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
              aria-label="Close filters"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div
            className="px-5 py-3 border-b"
            style={{
              backgroundColor: PASIG.bg,
              borderColor: PASIG.subtleBorder,
            }}
          >
            <div
              className="text-sm font-semibold mb-2"
              style={{ color: PASIG.slate }}
            >
              Active Filters
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <FilterChip
                  key={filter.key}
                  label={filter.label}
                  onRemove={filter.onRemove}
                />
              ))}
            </div>
          </div>
        )}

        {/* Status Filters */}
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: PASIG.subtleBorder }}
        >
          <h4
            className="text-sm font-bold mb-3 uppercase tracking-wide"
            style={{ color: PASIG.primaryNavy }}
          >
            Status
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <FilterButton
              label="All"
              count={counts.status.all}
              active={filters.status === "all"}
              onClick={() => handleStatusChange("all")}
            />
            <FilterButton
              label="Pending"
              emoji="⏳"
              count={counts.status.pending}
              active={filters.status === "pending"}
              onClick={() => handleStatusChange("pending")}
            />
            <FilterButton
              label="Verified"
              emoji="✓"
              count={counts.status.verified}
              active={filters.status === "verified"}
              onClick={() => handleStatusChange("verified")}
            />
            <FilterButton
              label="Resolved"
              emoji="✅"
              count={counts.status.resolved}
              active={filters.status === "resolved"}
              onClick={() => handleStatusChange("resolved")}
            />
          </div>
        </div>

        {/* Type Filters */}
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: PASIG.subtleBorder }}
        >
          <h4
            className="text-sm font-bold mb-3 uppercase tracking-wide"
            style={{ color: PASIG.primaryNavy }}
          >
            Obstacle Type
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <FilterButton
              label="All"
              count={counts.type.all}
              active={filters.type === "all"}
              onClick={() => handleTypeChange("all")}
            />
            {counts.type.vendor_blocking > 0 && (
              <FilterButton
                label="Vendor"
                emoji={getObstacleTypeEmoji("vendor_blocking")}
                count={counts.type.vendor_blocking}
                active={filters.type === "vendor_blocking"}
                onClick={() => handleTypeChange("vendor_blocking")}
              />
            )}
            {counts.type.parked_vehicles > 0 && (
              <FilterButton
                label="Parked"
                emoji={getObstacleTypeEmoji("parked_vehicles")}
                count={counts.type.parked_vehicles}
                active={filters.type === "parked_vehicles"}
                onClick={() => handleTypeChange("parked_vehicles")}
              />
            )}
            {counts.type.construction > 0 && (
              <FilterButton
                label="Construction"
                emoji={getObstacleTypeEmoji("construction")}
                count={counts.type.construction}
                active={filters.type === "construction"}
                onClick={() => handleTypeChange("construction")}
              />
            )}
            {counts.type.broken_infrastructure > 0 && (
              <FilterButton
                label="Broken"
                emoji={getObstacleTypeEmoji("broken_infrastructure")}
                count={counts.type.broken_infrastructure}
                active={filters.type === "broken_infrastructure"}
                onClick={() => handleTypeChange("broken_infrastructure")}
              />
            )}
            {counts.type.debris > 0 && (
              <FilterButton
                label="Debris"
                emoji={getObstacleTypeEmoji("debris")}
                count={counts.type.debris}
                active={filters.type === "debris"}
                onClick={() => handleTypeChange("debris")}
              />
            )}
            {counts.type.electrical_post > 0 && (
              <FilterButton
                label="Electrical"
                emoji={getObstacleTypeEmoji("electrical_post")}
                count={counts.type.electrical_post}
                active={filters.type === "electrical_post"}
                onClick={() => handleTypeChange("electrical_post")}
              />
            )}
            {counts.type.other > 0 && (
              <FilterButton
                label="Other"
                emoji={getObstacleTypeEmoji("other")}
                count={counts.type.other}
                active={filters.type === "other"}
                onClick={() => handleTypeChange("other")}
              />
            )}
          </div>
        </div>

        {/* Severity Filters */}
        <div className="px-5 py-4">
          <h4
            className="text-sm font-bold mb-3 uppercase tracking-wide"
            style={{ color: PASIG.primaryNavy }}
          >
            Severity
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <FilterButton
              label="All"
              count={counts.severity.all}
              active={filters.severity === "all"}
              onClick={() => handleSeverityChange("all")}
            />
            <FilterButton
              label="Blocking"
              emoji="🚫"
              count={counts.severity.blocking}
              active={filters.severity === "blocking"}
              onClick={() => handleSeverityChange("blocking")}
            />
            <FilterButton
              label="High"
              emoji="⚠️"
              count={counts.severity.high}
              active={filters.severity === "high"}
              onClick={() => handleSeverityChange("high")}
            />
            <FilterButton
              label="Medium"
              emoji="⚡"
              count={counts.severity.medium}
              active={filters.severity === "medium"}
              onClick={() => handleSeverityChange("medium")}
            />
            <FilterButton
              label="Low"
              emoji="ℹ️"
              count={counts.severity.low}
              active={filters.severity === "low"}
              onClick={() => handleSeverityChange("low")}
            />
          </div>
        </div>
      </div>
    </>
  );
};
