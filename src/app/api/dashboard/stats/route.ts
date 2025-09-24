// src/app/api/dashboard/stats/route.ts
// NEW: Dashboard statistics API endpoint - connects to existing backend services

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { adminObstacleService } from "@/lib/firebase/adminObstacleService";

interface DashboardStats {
  totalObstacles: number;
  totalUsers: number;
  totalAdmins: number;
  resolvedObstacles: number;
  // Additional metrics for the dashboard
  pendingObstacles: number;
  avgResponseTime?: number;
  lastUpdated: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Fetching dashboard statistics...");

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

    console.log("✅ Admin authenticated:", decodedToken.email);

    // Get Firestore database instance
    const adminDb = getAdminDb();

    // Fetch data from multiple sources concurrently
    const [obstacleStats, totalUsersFromAuth, adminDocsSnapshot] =
      await Promise.all([
        // Use existing obstacle service
        adminObstacleService.getObstacleStats(),

        // NEW: Count users from Firebase Auth (registered + anonymous)
        (async () => {
          try {
            let totalUsers = 0;
            let nextPageToken: string | undefined = undefined;

            do {
              const listUsersResult = await adminAuth.listUsers(
                1000,
                nextPageToken
              );

              // Count registered users (non-admin accounts) and anonymous users
              const validUsers = listUsersResult.users.filter((userRecord) => {
                const isAdmin = userRecord.customClaims?.admin === true;
                const isAnonymous = userRecord.providerData.length === 0;
                const isRegistered =
                  userRecord.providerData.length > 0 && !isAdmin;

                // Count both registered users and anonymous users, but not admins
                return isAnonymous || isRegistered;
              });

              totalUsers += validUsers.length;
              nextPageToken = listUsersResult.pageToken;

              console.log(
                `📱 Counted ${validUsers.length} users in this batch (${totalUsers} total so far)`
              );
            } while (nextPageToken);

            console.log(`👥 Total users from Firebase Auth: ${totalUsers}`);
            return totalUsers;
          } catch (error) {
            console.error("❌ Error counting Firebase Auth users:", error);
            // Fallback to userProfiles collection count
            const userProfilesSnapshot = await adminDb
              .collection("userProfiles")
              .get();
            console.log(
              `📋 Fallback: Using userProfiles count: ${userProfilesSnapshot.size}`
            );
            return userProfilesSnapshot.size;
          }
        })(),

        // Count admins from Firestore (more reliable than custom claims)
        adminDb.collection("admins").get(),
      ]);

    // Filter active admins from the documents
    const activeAdmins = adminDocsSnapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.active !== false && data.status !== "deactivated";
    });

    console.log("📈 Raw data fetched:", {
      obstacles: obstacleStats,
      usersFromAuth: totalUsersFromAuth,
      totalAdminDocs: adminDocsSnapshot.size,
      activeAdmins: activeAdmins.length,
    });

    // Calculate final metrics
    const totalObstacles = obstacleStats.total;
    const resolvedObstacles = obstacleStats.resolved;
    const pendingObstacles = obstacleStats.pending;
    const totalAdmins = activeAdmins.length;
    const totalUsers = totalUsersFromAuth;

    // Calculate average response time (placeholder - you can enhance this)
    const avgResponseTime =
      totalObstacles > 0
        ? Math.round((resolvedObstacles / totalObstacles) * 5) // Simplified calculation
        : 0;

    const dashboardStats: DashboardStats = {
      totalObstacles,
      totalUsers,
      totalAdmins,
      resolvedObstacles,
      pendingObstacles,
      avgResponseTime,
      lastUpdated: new Date().toISOString(),
    };

    console.log("📊 Dashboard stats calculated:", dashboardStats);

    return NextResponse.json({
      success: true,
      data: dashboardStats,
      metadata: {
        generatedAt: new Date().toISOString(),
        requestedBy: decodedToken.email,
        dataSource: "firebase_auth_and_firestore",
        userCountMethod: "firebase_auth_listUsers",
      },
    });
  } catch (error) {
    console.error("❌ Dashboard stats API error:", error);

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
        error: "Failed to fetch dashboard statistics. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
