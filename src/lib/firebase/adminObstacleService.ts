import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  where,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { AdminObstacle, ObstacleStatus } from "@/types/admin";

// ✅ STEP 4C: Firebase-to-AdminObstacle converter (FINAL BOSS DEFEATED VERSION!)
function convertFirebaseToAdminObstacle(
  doc: DocumentSnapshot<DocumentData>
): AdminObstacle {
  const data = doc.data();

  if (!data) {
    throw new Error(`Document ${doc.id} has no data`);
  }

  // Handle Firestore Timestamp conversion (FINAL BOSS DEFEATED!)
  const convertTimestamp = (timestamp: unknown): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (
      timestamp &&
      typeof timestamp === "object" &&
      "toDate" in timestamp &&
      typeof (timestamp as { toDate: () => Date }).toDate === "function"
    ) {
      return (timestamp as { toDate: () => Date }).toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === "string") {
      return new Date(timestamp);
    }
    return new Date(); // Fallback to current date
  };

  return {
    id: doc.id,
    location: {
      latitude: data.location?.latitude || 0,
      longitude: data.location?.longitude || 0,
      accuracy: data.location?.accuracy,
    },
    type: data.type || "other",
    severity: data.severity || "low",
    description: data.description || "",
    photoBase64: data.photoBase64,
    timePattern: data.timePattern || "permanent",

    // User info
    reportedBy: data.reportedBy || "unknown",
    reportedAt: convertTimestamp(data.reportedAt),
    deviceType: data.deviceType,
    barangay: data.barangay,

    // Community engagement
    upvotes: data.upvotes || 0,
    downvotes: data.downvotes || 0,

    // Admin fields
    status: data.status || "pending",
    verified: data.verified || false,
    reviewedBy: data.reviewedBy,
    reviewedAt: data.reviewedAt ? convertTimestamp(data.reviewedAt) : undefined,
    adminNotes: data.adminNotes,

    // Metadata
    deleted: data.deleted || false,
    deletedBy: data.deletedBy,
    deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
    createdAt: convertTimestamp(data.createdAt || data.reportedAt),
  };
}

export class AdminObstacleService {
  private readonly COLLECTION_NAME = "obstacles";

  /**
   * Get all obstacles from Firebase with optional filtering
   */
  async getAllObstacles(
    options: {
      limit?: number;
      status?: ObstacleStatus[];
      orderBy?: "reportedAt" | "upvotes" | "createdAt";
      orderDirection?: "asc" | "desc";
    } = {}
  ): Promise<AdminObstacle[]> {
    try {
      console.log("🔥 Loading obstacles from Firebase...", options);

      const obstaclesRef = collection(db, this.COLLECTION_NAME);

      // Build query
      let obstacleQuery = query(obstaclesRef);

      // Add status filter if specified
      if (options.status && options.status.length > 0) {
        obstacleQuery = query(
          obstacleQuery,
          where("status", "in", options.status)
        );
      }

      // Add ordering
      const orderField = options.orderBy || "reportedAt";
      const orderDirection = options.orderDirection || "desc";
      obstacleQuery = query(obstacleQuery, orderBy(orderField, orderDirection));

      // Add limit
      if (options.limit) {
        obstacleQuery = query(obstacleQuery, limit(options.limit));
      }

      // Execute query
      const querySnapshot = await getDocs(obstacleQuery);

      // Convert to AdminObstacle objects
      const obstacles: AdminObstacle[] = [];
      querySnapshot.forEach((docSnapshot) => {
        try {
          const obstacle = convertFirebaseToAdminObstacle(docSnapshot);
          obstacles.push(obstacle);
        } catch (error) {
          console.warn(
            `⚠️ Error converting obstacle ${docSnapshot.id}:`,
            error
          );
        }
      });

      console.log(`✅ Loaded ${obstacles.length} obstacles from Firebase`);
      return obstacles;
    } catch (error) {
      console.error("❌ Error loading obstacles from Firebase:", error);
      throw new Error("Failed to load obstacles from database");
    }
  }

  /**
   * Get obstacles for specific timeframe (for reports)
   */
  async getObstaclesInTimeframe(days: number): Promise<AdminObstacle[]> {
    try {
      console.log(`📅 Loading obstacles from last ${days} days...`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const obstaclesRef = collection(db, this.COLLECTION_NAME);
      const timeframeQuery = query(
        obstaclesRef,
        where("reportedAt", ">=", cutoffDate),
        orderBy("reportedAt", "desc")
      );

      const querySnapshot = await getDocs(timeframeQuery);

      const obstacles: AdminObstacle[] = [];
      querySnapshot.forEach((docSnapshot) => {
        try {
          const obstacle = convertFirebaseToAdminObstacle(docSnapshot);
          obstacles.push(obstacle);
        } catch (error) {
          console.warn(
            `⚠️ Error converting obstacle ${docSnapshot.id}:`,
            error
          );
        }
      });

      console.log(
        `✅ Loaded ${obstacles.length} obstacles from last ${days} days`
      );
      return obstacles;
    } catch (error) {
      console.error("❌ Error loading obstacles by timeframe:", error);
      throw new Error("Failed to load obstacles for specified timeframe");
    }
  }

  /**
   * Update obstacle status (verify/reject)
   */
  async updateObstacleStatus(
    obstacleId: string,
    status: ObstacleStatus,
    adminUserId: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      console.log(`🔄 Updating obstacle ${obstacleId} status to ${status}...`);

      const obstacleRef = doc(db, this.COLLECTION_NAME, obstacleId);

      const updateData: Record<string, unknown> = {
        status,
        verified: status === "verified",
        reviewedBy: adminUserId,
        reviewedAt: serverTimestamp(),
      };

      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }

      await updateDoc(obstacleRef, updateData);

      console.log(`✅ Updated obstacle ${obstacleId} status to ${status}`);
    } catch (error) {
      console.error("❌ Error updating obstacle status:", error);
      throw new Error("Failed to update obstacle status");
    }
  }

  /**
   * Get obstacle statistics for dashboard
   */
  async getObstacleStats(): Promise<{
    total: number;
    pending: number;
    verified: number;
    resolved: number;
    falseReports: number;
    totalVotes: number;
  }> {
    try {
      console.log("📊 Calculating obstacle statistics...");

      const obstacles = await this.getAllObstacles();

      const stats = {
        total: obstacles.length,
        pending: obstacles.filter((o) => o.status === "pending").length,
        verified: obstacles.filter((o) => o.status === "verified").length,
        resolved: obstacles.filter((o) => o.status === "resolved").length,
        falseReports: obstacles.filter((o) => o.status === "false_report")
          .length,
        totalVotes: obstacles.reduce(
          (sum, o) => sum + (o.upvotes || 0) + (o.downvotes || 0),
          0
        ),
      };

      console.log("✅ Obstacle statistics calculated:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error calculating obstacle statistics:", error);
      throw new Error("Failed to calculate obstacle statistics");
    }
  }

  /**
   * Test Firebase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("🧪 Testing Firebase connection...");

      // Try to read from obstacles collection
      const obstaclesRef = collection(db, this.COLLECTION_NAME);
      const testQuery = query(obstaclesRef, limit(1));
      const querySnapshot = await getDocs(testQuery);

      console.log(
        `✅ Firebase connection successful! Found ${querySnapshot.size} test documents`
      );
      return true;
    } catch (error) {
      console.error("❌ Firebase connection failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const adminObstacleService = new AdminObstacleService();
