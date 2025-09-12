// src/app/api/audit/stats/route.ts
// UPDATED: API endpoint for audit statistics with mobile analytics

import { NextRequest, NextResponse } from "next/server";
import { auditLogger } from "@/lib/services/auditLogger";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    // Get the requesting user's info from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization token required" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split(" ")[1];

    // Verify the ID token and get user info
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check if user has admin privileges
    if (!decodedToken.admin) {
      return NextResponse.json(
        { success: false, error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Check if user has permission to read audit logs
    const hasAuditPermission =
      decodedToken.permissions?.includes("audit:read") ||
      decodedToken.role === "super_admin" ||
      decodedToken.role === "lgu_admin";

    if (!hasAuditPermission) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to view audit statistics",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") || "7d") as
      | "24h"
      | "7d"
      | "30d";
    const adminEmail = searchParams.get("adminEmail") || undefined;

    console.log("📊 Fetching enhanced audit statistics:", {
      timeframe,
      adminEmail,
      requestedBy: decodedToken.email,
    });

    // Get enhanced audit statistics (now includes mobile stats)
    const stats = await auditLogger.getAuditStats(timeframe);

    // Get mobile admin summary if specific admin requested
    let mobileAdminSummary = null;
    if (adminEmail) {
      mobileAdminSummary = await auditLogger.getMobileAdminSummary(
        adminEmail,
        timeframe
      );
    }

    // Calculate additional insights
    const insights = {
      mobileVsWebRatio:
        stats.totalActions > 0
          ? Math.round((stats.mobileActions / stats.totalActions) * 100)
          : 0,
      avgActionsPerAdmin:
        stats.topAdmins.length > 0
          ? Math.round(stats.totalActions / stats.topAdmins.length)
          : 0,
      mostActiveSource:
        stats.mobileActions > stats.webActions ? "mobile_app" : "web_portal",
      topAction:
        Object.entries(stats.actionsByType).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] || "none",
    };

    console.log(
      `📈 Returning enhanced audit stats: ${stats.totalActions} total actions (${stats.mobileActions} mobile, ${stats.webActions} web)`
    );

    return NextResponse.json({
      success: true,
      data: {
        stats,
        mobileAdminSummary,
        insights,
        timeframe,
      },
    });
  } catch (error) {
    console.error("Enhanced audit stats API error:", error);

    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes("auth/invalid-id-token")) {
        return NextResponse.json(
          { success: false, error: "Invalid authentication token" },
          { status: 401 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch enhanced audit statistics. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
