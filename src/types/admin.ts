// src/types/admin.ts
// TypeScript definitions for WAISPATH Admin Dashboard - Fixed

// Re-export mobile app types for consistency
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export type ObstacleType =
  | "vendor_blocking"
  | "parked_vehicles"
  | "construction"
  | "electrical_post"
  | "tree_roots"
  | "no_sidewalk"
  | "flooding"
  | "stairs_no_ramp"
  | "narrow_passage"
  | "broken_pavement"
  | "steep_slope"
  | "other";

export type ObstacleSeverity = "low" | "medium" | "high" | "blocking";
export type ObstacleStatus =
  | "pending"
  | "verified"
  | "resolved"
  | "false_report";

// Enhanced obstacle interface for admin dashboard
export interface AdminObstacle {
  id: string;
  location: UserLocation;
  type: ObstacleType;
  severity: ObstacleSeverity;
  description: string;
  photoBase64?: string;
  timePattern?: "permanent" | "morning" | "afternoon" | "evening" | "weekend";

  // User info
  reportedBy: string;
  reportedAt: Date;
  deviceType?: string;
  barangay?: string;

  // Community engagement
  upvotes: number;
  downvotes: number;

  // Admin fields
  status: ObstacleStatus;
  verified: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  adminNotes?: string;

  // Additional metadata
  deleted?: boolean;
  deletedBy?: string;
  deletedAt?: Date;
  createdAt: Date;
}

// User profile for admin management
export interface AdminUserProfile {
  id: string;
  type: "wheelchair" | "walker" | "cane" | "crutches" | "none";
  maxRampSlope: number;
  minPathWidth: number;
  avoidStairs: boolean;
  avoidCrowds: boolean;
  preferShade: boolean;
  maxWalkingDistance: number;
  createdAt: Date;
  lastUpdated: Date;

  // Admin tracking
  obstaclesReported?: number;
  contributionScore?: number;
  warningsCount?: number;
  bannedUntil?: Date;
}

// Analytics interfaces
export interface ObstacleStats {
  total: number;
  pending: number;
  verified: number;
  resolved: number;
  falseReports: number;
}

export interface AnalyticsData {
  obstacleStats: ObstacleStats;
  reportsOverTime: Record<string, number>;
  topObstacleTypes: Array<{ type: ObstacleType; count: number }>;
  topBarangays: Array<{ barangay: string; count: number }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    averageReportsPerUser: number;
  };
}

// Admin dashboard navigation
export interface DashboardRoute {
  name: string;
  href: string;
  icon: string;
  current: boolean;
  badge?: number;
}

// Filter and sorting options
export interface ObstacleFilters {
  status?: ObstacleStatus[];
  type?: ObstacleType[];
  severity?: ObstacleSeverity[];
  barangay?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface SortOption {
  field: "reportedAt" | "type" | "severity" | "status" | "upvotes";
  direction: "asc" | "desc";
}

// API Response types - Fixed with proper generic types
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
