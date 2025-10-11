// src/types/admin.ts
// TypeScript definitions for WAISPATH Admin Dashboard - UPDATED to match mobile app

// Re-export mobile app types for consistency
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * ObstacleType - UPDATED to match mobile app obstacle types
 *
 * CHANGES:
 * - ❌ REMOVED: "tree_roots" (no longer in mobile app reporting system)
 * - ❌ REMOVED: "broken_pavement" (replaced with broken_infrastructure)
 * - ✅ ADDED: "broken_infrastructure" (updated from broken_pavement)
 * - ✅ ADDED: "debris" (new obstacle type for trash/debris)
 */
export type ObstacleType =
  | "vendor_blocking"
  | "parked_vehicles"
  | "construction"
  | "electrical_post"
  | "no_sidewalk"
  | "flooding"
  | "stairs_no_ramp"
  | "narrow_passage"
  | "broken_infrastructure" // ✅ ADD
  | "debris" // ✅ ADD
  | "steep_slope"
  | "other";

/**
 * ObstacleSeverity - How much the obstacle impacts mobility
 *
 * - "low": Minor issue, can navigate with slight difficulty
 * - "medium": Moderate issue, requires assistance
 * - "high": Major issue, very difficult to navigate
 * - "blocking": Completely impassable, no way through
 */
export type ObstacleSeverity = "low" | "medium" | "high" | "blocking";

/**
 * ObstacleStatus - Current validation/resolution state
 *
 * - "pending": Newly reported, awaiting admin review
 * - "verified": Confirmed by admin or community
 * - "resolved": Issue has been fixed/cleared
 * - "false_report": Determined to be incorrect/invalid
 */
export type ObstacleStatus =
  | "pending"
  | "verified"
  | "resolved"
  | "false_report";

/**
 * AdminObstacle - Enhanced obstacle interface for admin dashboard
 *
 * This extends the basic obstacle with admin-specific fields
 * for management, tracking, and community validation
 */
export interface AdminObstacle {
  id: string;
  location: UserLocation;
  type: ObstacleType;
  severity: ObstacleSeverity;
  description: string;
  photoBase64?: string;

  /**
   * timePattern - When this obstacle typically appears
   * Used for temporal obstacles like vendors or flooding
   */
  timePattern?: "permanent" | "morning" | "afternoon" | "evening" | "weekend";

  // ============================================
  // USER INFORMATION
  // ============================================
  reportedBy: string; // User ID who reported
  reportedAt: Date; // When it was reported
  deviceType?: string; // Device used (Android/iOS)
  barangay?: string; // Location barangay

  // ============================================
  // COMMUNITY VALIDATION
  // ============================================
  upvotes: number; // Community confirmations
  downvotes: number; // Community disputes

  /**
   * validationCount - Total community interactions
   * Calculated as: upvotes + downvotes
   */
  get validationCount(): number;

  // ============================================
  // ADMIN MANAGEMENT
  // ============================================
  status: ObstacleStatus; // Current status
  verified: boolean; // Admin verified flag
  reviewedBy?: string; // Admin ID who reviewed
  reviewedAt?: Date; // When it was reviewed
  adminNotes?: string; // Internal admin notes

  /**
   * adminReported - Flag for government-reported obstacles
   * If true, this was reported by an official admin/LGU staff
   */
  adminReported?: boolean;

  /**
   * adminRole - Role of admin who reported (if adminReported = true)
   * - "super_admin": System administrator
   * - "lgu_admin": LGU government official
   * - "field_admin": Field assessment staff
   */
  adminRole?: "super_admin" | "lgu_admin" | "field_admin";

  // ============================================
  // DELETION TRACKING
  // ============================================
  deleted?: boolean;
  deletedBy?: string;
  deletedAt?: Date;

  // ============================================
  // METADATA
  // ============================================
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * AdminUserProfile - User profile for admin management
 *
 * Contains mobility profile and admin tracking metrics
 */
export interface AdminUserProfile {
  id: string;

  // ============================================
  // MOBILITY PROFILE
  // ============================================
  type: "wheelchair" | "walker" | "cane" | "crutches" | "none";
  maxRampSlope: number; // Maximum safe slope (degrees)
  minPathWidth: number; // Minimum path width needed (cm)
  avoidStairs: boolean; // Must avoid stairs
  avoidCrowds: boolean; // Prefers less crowded routes
  preferShade: boolean; // Prefers shaded routes
  maxWalkingDistance: number; // Maximum distance per route (meters)

  // ============================================
  // TIMESTAMPS
  // ============================================
  createdAt: Date;
  lastUpdated: Date;

  // ============================================
  // ADMIN TRACKING METRICS
  // ============================================
  obstaclesReported?: number; // Total obstacles reported by user
  contributionScore?: number; // Overall contribution score
  warningsCount?: number; // Number of warnings issued
  bannedUntil?: Date; // Temporary ban expiration
  suspended?: boolean; // Permanent suspension flag
}

/**
 * ObstacleStats - Statistics for obstacle management
 *
 * Used in dashboard analytics and overview pages
 */
export interface ObstacleStats {
  total: number; // Total obstacles in system
  pending: number; // Awaiting admin review
  verified: number; // Admin/community verified
  resolved: number; // Fixed/cleared obstacles
  falseReports: number; // Invalid reports

  // ============================================
  // ADDITIONAL METRICS
  // ============================================
  adminReported?: number; // Government-reported obstacles
  communityReported?: number; // User-reported obstacles
  avgResolutionTime?: number; // Average hours to resolve
}

/**
 * AnalyticsData - Complete analytics dashboard data
 *
 * Provides comprehensive insights for LGU planning
 */
export interface AnalyticsData {
  obstacleStats: ObstacleStats;

  /**
   * reportsOverTime - Time-series data
   * Key: Date string (YYYY-MM-DD)
   * Value: Number of reports
   */
  reportsOverTime: Record<string, number>;

  /**
   * topObstacleTypes - Most common obstacle types
   * Sorted by frequency, descending
   */
  topObstacleTypes: Array<{
    type: ObstacleType;
    count: number;
    percentage: number;
  }>;

  /**
   * topBarangays - Areas with most obstacles
   * Sorted by frequency, descending
   */
  topBarangays: Array<{
    barangay: string;
    count: number;
    criticalCount: number; // High/blocking severity
  }>;

  /**
   * userEngagement - Community participation metrics
   */
  userEngagement: {
    totalUsers: number;
    activeUsers: number; // Active in last 30 days
    averageReportsPerUser: number;
    topContributors?: Array<{
      userId: string;
      reportsCount: number;
    }>;
  };

  /**
   * severityDistribution - Breakdown by severity level
   */
  severityDistribution?: {
    low: number;
    medium: number;
    high: number;
    blocking: number;
  };
}

/**
 * DashboardRoute - Navigation route definition
 *
 * Used for sidebar navigation in admin dashboard
 */
export interface DashboardRoute {
  name: string; // Display name
  href: string; // URL path
  icon: string; // Icon identifier
  current: boolean; // Is currently active
  badge?: number; // Notification badge count
  adminOnly?: boolean; // Requires admin privileges
}

/**
 * ObstacleFilters - Filter options for obstacle lists
 *
 * Used in obstacle management and map pages
 */
export interface ObstacleFilters {
  status?: ObstacleStatus[];
  type?: ObstacleType[];
  severity?: ObstacleSeverity[];
  barangay?: string[];

  /**
   * dateRange - Filter by date range
   */
  dateRange?: {
    start: Date;
    end: Date;
  };

  /**
   * searchQuery - Text search in descriptions
   */
  searchQuery?: string;

  /**
   * sortBy - Sort order
   */
  sortBy?: "date" | "severity" | "upvotes" | "location";
  sortOrder?: "asc" | "desc";

  /**
   * validationFilters - Community validation filters
   */
  minUpvotes?: number;
  minDownvotes?: number;
  adminReportedOnly?: boolean; // Show only government reports

  /**
   * Pagination
   */
  page?: number;
  limit?: number;
}

/**
 * ValidationTier - Community validation status levels
 *
 * Determines how obstacle markers are displayed and prioritized
 */
export type ValidationTier =
  | "admin_resolved" // Official government action
  | "community_verified" // Strong community confirmation
  | "single_report"; // Unverified single report

/**
 * ValidationStatus - Complete validation status
 *
 * Used by obstacleValidationService to determine display styling
 */
export interface ValidationStatus {
  id: string;
  tier: ValidationTier;
  displayLabel: string; // Human-readable status
  confidence: "high" | "medium" | "low";
  validationCount: number; // Total validations
  conflictingReports: boolean; // Has disputes
  needsValidation: boolean; // Requires more validation
  autoExpireDate: Date; // When it expires if unverified
}

/**
 * ObstacleDisplayStyle - Visual styling for markers
 *
 * Determines color, opacity, icon, and priority for map display
 */
export interface ObstacleDisplayStyle {
  color: string; // Hex color code
  opacity: number; // 0.0 to 1.0
  icon: string; // Icon identifier
  priority: number; // Display priority (1 = highest)
  size?: "small" | "medium" | "large";
  borderColor?: string;
  borderWidth?: number;
}

// ============================================
// HELPER TYPE GUARDS
// ============================================

/**
 * Type guard to check if obstacle is admin-reported
 */
export function isAdminReported(obstacle: AdminObstacle): boolean {
  return obstacle.adminReported === true && !!obstacle.adminRole;
}

/**
 * Type guard to check if obstacle is community-verified
 */
export function isCommunityVerified(obstacle: AdminObstacle): boolean {
  return obstacle.upvotes >= 8 && obstacle.upvotes > obstacle.downvotes;
}

/**
 * Type guard to check if obstacle is blocking
 */
export function isBlockingObstacle(obstacle: AdminObstacle): boolean {
  return obstacle.severity === "blocking" || obstacle.severity === "high";
}

/**
 * Type guard to check if obstacle needs attention
 */
export function needsAdminAttention(obstacle: AdminObstacle): boolean {
  return (
    obstacle.status === "pending" &&
    !obstacle.adminReported &&
    obstacle.upvotes >= 3
  );
}
