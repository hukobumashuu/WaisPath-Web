// src/lib/utils/obstacleTypeHelpers.ts
// Centralized obstacle type mappings and helper functions
// UPDATED to match mobile app obstacle types

import { ObstacleType, ObstacleSeverity, ObstacleStatus } from "@/types/admin";

// ============================================
// OBSTACLE TYPE LABELS
// ============================================

/**
 * Get human-readable label for obstacle type
 *
 * @param type - The obstacle type
 * @returns User-friendly label
 *
 * UPDATED: Removed tree_roots, broken_pavement
 * ADDED: broken_infrastructure, debris
 */
export function getObstacleTypeLabel(type: ObstacleType): string {
  const labels: Record<ObstacleType, string> = {
    vendor_blocking: "Vendor Blocking",
    parked_vehicles: "Parked Vehicles",
    construction: "Construction",
    electrical_post: "Electrical Post",
    no_sidewalk: "No Sidewalk",
    flooding: "Flooding",
    stairs_no_ramp: "Stairs (No Ramp)",
    narrow_passage: "Narrow Passage",
    broken_infrastructure: "Broken Infrastructure", // ✅ UPDATED
    debris: "Debris or Trash", // ✅ NEW
    steep_slope: "Steep Slope",
    other: "Other",
  };

  return labels[type] || "Unknown Obstacle";
}

/**
 * Get Filipino/Tagalog label for obstacle type
 * Used in mobile app and for local communication
 */
export function getObstacleTypeLabelFilipino(type: ObstacleType): string {
  const labels: Record<ObstacleType, string> = {
    vendor_blocking: "May Nagtitinda",
    parked_vehicles: "Nakaharang na Sasakyan",
    construction: "Konstruksiyon",
    electrical_post: "Poste sa Daan",
    no_sidewalk: "Walang Sidewalk",
    flooding: "Baha",
    stairs_no_ramp: "May Hagdan, Walang Ramp",
    narrow_passage: "Masikip na Daan",
    broken_infrastructure: "Sirang Infrastructure", // ✅ UPDATED
    debris: "Kalat o Debris", // ✅ NEW
    steep_slope: "Matarik na Daan",
    other: "Iba Pa",
  };

  return labels[type] || "Hindi Alam";
}

// ============================================
// OBSTACLE TYPE ICONS (EMOJI)
// ============================================

/**
 * Get emoji icon for obstacle type
 * Used in cards, lists, and simple displays
 *
 * UPDATED: Removed tree emoji, updated broken pavement to warning
 * ADDED: Trash emoji for debris
 */
export function getObstacleTypeEmoji(type: ObstacleType): string {
  const icons: Record<ObstacleType, string> = {
    vendor_blocking: "🏪",
    parked_vehicles: "🚗",
    construction: "🚧",
    electrical_post: "⚡",
    no_sidewalk: "⚠️",
    flooding: "💧",
    stairs_no_ramp: "🪜",
    narrow_passage: "↔️",
    broken_infrastructure: "⚠️", // ✅ UPDATED (warning symbol)
    debris: "🗑️", // ✅ NEW (trash bin)
    steep_slope: "⛰️",
    other: "❓",
  };

  return icons[type] || "❓";
}

/**
 * Get Ionicons name for obstacle type
 * Used in mobile app and can be adapted for web
 *
 * UPDATED: Changed broken_pavement to warning, added trash for debris
 */
export function getObstacleTypeIcon(type: ObstacleType): string {
  const icons: Record<ObstacleType, string> = {
    vendor_blocking: "storefront-outline",
    parked_vehicles: "car-outline",
    construction: "construct-outline",
    electrical_post: "flash-outline",
    no_sidewalk: "trail-sign-outline",
    flooding: "water-outline",
    stairs_no_ramp: "layers-outline",
    narrow_passage: "resize-outline",
    broken_infrastructure: "warning-outline", // ✅ UPDATED
    debris: "trash-outline", // ✅ NEW
    steep_slope: "trending-up-outline",
    other: "help-circle-outline",
  };

  return icons[type] || "help-circle-outline";
}

// ============================================
// OBSTACLE TYPE COLORS
// ============================================

/**
 * Get primary color for obstacle type
 * Used for categorization and visual coding
 *
 * Color scheme:
 * - Red (#EF4444): Critical/dangerous obstacles
 * - Orange (#F59E0B): Warning/moderate obstacles
 * - Blue (#3B82F6): Water-related obstacles
 * - Gray (#6B7280): Infrastructure/static obstacles
 * - Red Dark (#DC2626): No access obstacles
 */
export function getObstacleTypeColor(type: ObstacleType): string {
  const colors: Record<ObstacleType, string> = {
    vendor_blocking: "#F59E0B", // Orange - temporary obstacle
    parked_vehicles: "#EF4444", // Red - blocking
    construction: "#F59E0B", // Orange - temporary
    electrical_post: "#6B7280", // Gray - permanent structure
    no_sidewalk: "#DC2626", // Dark red - no access
    flooding: "#3B82F6", // Blue - water hazard
    stairs_no_ramp: "#DC2626", // Dark red - no access
    narrow_passage: "#F59E0B", // Orange - difficult passage
    broken_infrastructure: "#EF4444", // Red - dangerous condition
    debris: "#6B7280", // Gray - obstruction
    steep_slope: "#F59E0B", // Orange - difficult terrain
    other: "#6B7280", // Gray - uncategorized
  };

  return colors[type] || "#6B7280";
}

// ============================================
// SEVERITY LABELS AND COLORS
// ============================================

/**
 * Get human-readable label for severity level
 */
export function getSeverityLabel(severity: ObstacleSeverity): string {
  const labels: Record<ObstacleSeverity, string> = {
    low: "Minor Issue",
    medium: "Moderate Issue",
    high: "Major Issue",
    blocking: "Completely Blocked",
  };

  return labels[severity];
}

/**
 * Get Filipino/Tagalog label for severity level
 */
export function getSeverityLabelFilipino(severity: ObstacleSeverity): string {
  const labels: Record<ObstacleSeverity, string> = {
    low: "Maliit na Problem",
    medium: "Katamtamang Problem",
    high: "Malaking Problem",
    blocking: "Completely Blocked",
  };

  return labels[severity];
}

/**
 * Get color for severity level
 *
 * Used for badges, markers, and severity indicators
 * Priority: Blocking > High > Medium > Low
 */
export function getSeverityColor(severity: ObstacleSeverity): string {
  const colors: Record<ObstacleSeverity, string> = {
    blocking: "#DC2626", // Dark red - critical
    high: "#F97316", // Orange - important
    medium: "#F59E0B", // Yellow - moderate
    low: "#3B82F6", // Blue - minor
  };

  return colors[severity];
}

/**
 * Get emoji for severity level
 */
export function getSeverityEmoji(severity: ObstacleSeverity): string {
  const emojis: Record<ObstacleSeverity, string> = {
    blocking: "🚫",
    high: "⚠️",
    medium: "⚡",
    low: "ℹ️",
  };

  return emojis[severity];
}

// ============================================
// STATUS LABELS AND COLORS
// ============================================

/**
 * Get human-readable label for status
 */
export function getStatusLabel(status: ObstacleStatus): string {
  const labels: Record<ObstacleStatus, string> = {
    pending: "Pending Review",
    verified: "Verified",
    resolved: "Resolved",
    false_report: "False Report",
  };

  return labels[status];
}

/**
 * Get color for status
 *
 * Used for status badges and indicators
 */
export function getStatusColor(status: ObstacleStatus): string {
  const colors: Record<ObstacleStatus, string> = {
    pending: "#F59E0B", // Yellow - awaiting action
    verified: "#3B82F6", // Blue - confirmed
    resolved: "#22C55E", // Green - fixed
    false_report: "#6B7280", // Gray - invalid
  };

  return colors[status];
}

/**
 * Get emoji for status
 */
export function getStatusEmoji(status: ObstacleStatus): string {
  const emojis: Record<ObstacleStatus, string> = {
    pending: "⏳",
    verified: "✓",
    resolved: "✅",
    false_report: "❌",
  };

  return emojis[status];
}

// ============================================
// VALIDATION COLORS
// ============================================

/**
 * Get color based on validation status
 *
 * UPDATED: Verified status gets BLUE color (like official)
 *
 * Priority system:
 * 1. Admin-reported - Blue (#3B82F6)
 * 2. Verified (admin) - Blue (#3B82F6) ← CHANGED!
 * 3. Resolved - Green (#22C55E)
 * 4. Community verified (8+ upvotes) - Green (#10B981)
 * 5. Community disputed - Orange (#F59E0B)
 * 6. Unverified - Gray (#9CA3AF)
 * 7. False report - Gray (#6B7280)
 */
export function getValidationColor(
  upvotes: number,
  downvotes: number,
  status: ObstacleStatus,
  adminReported: boolean = false
): string {
  // Admin-reported obstacles get official blue
  if (adminReported) {
    return "#3B82F6"; // Blue - official government report
  }

  // UPDATED: Verified status gets BLUE (admin-verified is official)
  if (status === "verified") {
    return "#3B82F6"; // Blue - admin verified (same as official)
  }

  // Resolved obstacles are green
  if (status === "resolved") {
    return "#22C55E"; // Green - issue fixed
  }

  // False reports are gray
  if (status === "false_report") {
    return "#6B7280"; // Gray - invalid
  }

  // Community validation logic (8+ upvotes but not admin-verified)
  const totalVotes = upvotes + downvotes;
  const hasConflict = downvotes > 0 && downvotes >= upvotes * 0.3; // 30% dispute rate

  if (totalVotes >= 8 && upvotes > downvotes) {
    // Community verified with 8+ upvotes (not official admin-verified)
    return hasConflict ? "#F59E0B" : "#10B981"; // Orange if disputed, green if clean
  }

  // Unverified single reports
  return "#9CA3AF"; // Gray - needs validation
}

// ============================================
// BADGE STYLES (For Tailwind CSS)
// ============================================

/**
 * Get Tailwind CSS classes for status badge
 *
 * Returns gradient background and text color classes
 */
export function getStatusBadgeClasses(status: ObstacleStatus): string {
  const badges: Record<ObstacleStatus, string> = {
    pending:
      "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300",
    verified:
      "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300",
    resolved:
      "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300",
    false_report:
      "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
  };

  return badges[status];
}

/**
 * Get Tailwind CSS classes for severity badge
 */
export function getSeverityBadgeClasses(severity: ObstacleSeverity): string {
  const badges: Record<ObstacleSeverity, string> = {
    blocking:
      "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
    high: "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300",
    medium:
      "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300",
    low: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300",
  };

  return badges[severity];
}

// ============================================
// VALIDATION DISPLAY HELPERS
// ============================================

/**
 * Get validation badge text
 *
 * Returns a short text label for validation status
 * Used in compact displays and markers
 */
export function getValidationBadgeText(
  upvotes: number,
  downvotes: number,
  status: ObstacleStatus,
  adminReported: boolean = false
): string {
  if (adminReported) return "OFFICIAL";
  if (status === "resolved") return "CLEARED";
  if (status === "verified") return "VERIFIED";

  const totalVotes = upvotes + downvotes;
  const hasConflict = downvotes > 0 && downvotes >= upvotes * 0.3;

  if (totalVotes >= 8 && upvotes > downvotes) {
    return hasConflict ? "DISPUTED" : "VERIFIED";
  }

  return "UNVERIFIED";
}

/**
 * Calculate validation confidence level
 *
 * Returns a percentage (0-100) representing confidence
 * in the obstacle report accuracy
 */
export function getValidationConfidence(
  upvotes: number,
  downvotes: number
): number {
  const totalVotes = upvotes + downvotes;

  if (totalVotes === 0) return 0;

  const accuracy = (upvotes / totalVotes) * 100;

  // Weight by total votes (more votes = more confidence)
  const volumeWeight = Math.min(totalVotes / 20, 1); // Max weight at 20 votes

  return Math.round(accuracy * volumeWeight);
}

// ============================================
// DESCRIPTION HELPERS
// ============================================

/**
 * Get detailed description for obstacle type
 * Used in tooltips and help text
 */
export function getObstacleTypeDescription(type: ObstacleType): string {
  const descriptions: Record<ObstacleType, string> = {
    vendor_blocking:
      "Vendors, stalls, or street sellers blocking the sidewalk or pathway",
    parked_vehicles: "Vehicles parked on sidewalks, ramps, or accessible paths",
    construction: "Construction work, barriers, or materials blocking the path",
    electrical_post:
      "Electrical or utility posts positioned in the middle of the pathway",
    no_sidewalk:
      "Missing or absent sidewalk, forcing pedestrians onto the road",
    flooding: "Water accumulation, flooding, or waterlogged areas on the path",
    stairs_no_ramp: "Stairs or steps without an accessible ramp alternative",
    narrow_passage:
      "Path too narrow for wheelchairs or mobility devices to pass",
    broken_infrastructure:
      "Damaged ramps, broken sidewalks, or deteriorated accessibility facilities",
    debris: "Trash, litter, debris, or obstacles blocking the pathway",
    steep_slope:
      "Slope too steep for safe wheelchair or mobility device navigation",
    other: "Other accessibility obstacles not covered by standard categories",
  };

  return descriptions[type] || "Obstacle affecting pedestrian accessibility";
}

/**
 * Get impact description for severity level
 * Used in tooltips and help text
 */
export function getSeverityDescription(severity: ObstacleSeverity): string {
  const descriptions: Record<ObstacleSeverity, string> = {
    low: "Minor accessibility issue - can be navigated with slight difficulty",
    medium:
      "Moderate accessibility issue - requires assistance or significant effort",
    high: "Major accessibility issue - very difficult to navigate, alternative route recommended",
    blocking: "Completely impassable - no way through, detour required",
  };

  return descriptions[severity];
}
