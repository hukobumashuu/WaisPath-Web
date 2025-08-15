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

/** Utility: wrap a promise with a timeout so reads don't hang forever */
function withTimeout<T>(
  p: Promise<T>,
  ms = 15000,
  msg = "Request timed out"
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(msg));
    }, ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });
}

/** Safe error extractor (avoids `any`) */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** Narrow unknown to a timestamp-like object with toDate() */
function isTimestampLike(v: unknown): v is { toDate: () => Date } {
  return (
    typeof v === "object" &&
    v !== null &&
    "toDate" in v &&
    typeof (v as { toDate?: unknown }).toDate === "function"
  );
}

/** Convert Firestore DocumentSnapshot -> AdminObstacle (defensive) */
function convertFirebaseToAdminObstacle(
  docSnap: DocumentSnapshot<DocumentData>
): AdminObstacle {
  const data = docSnap.data();

  if (!data) {
    throw new Error(`Document ${docSnap.id} has no data`);
  }

  const convertTimestamp = (timestamp: unknown): Date => {
    try {
      if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
      }
      if (isTimestampLike(timestamp)) {
        return timestamp.toDate();
      }
      if (timestamp instanceof Date) {
        return timestamp;
      }
      if (typeof timestamp === "number") {
        return new Date(timestamp);
      }
      if (typeof timestamp === "string") {
        const parsed = Date.parse(timestamp);
        return isNaN(parsed) ? new Date() : new Date(parsed);
      }
      // fallback — return current time rather than undefined to avoid crash
      return new Date();
    } catch (err) {
      console.warn(
        `convertTimestamp warning for doc ${docSnap.id}:`,
        getErrorMessage(err)
      );
      return new Date();
    }
  };

  return {
    id: docSnap.id,
    location: {
      latitude:
        typeof data.location?.latitude === "number"
          ? data.location.latitude
          : 0,
      longitude:
        typeof data.location?.longitude === "number"
          ? data.location.longitude
          : 0,
      accuracy: data.location?.accuracy,
    },
    type: (data.type as AdminObstacle["type"]) || "other",
    severity: (data.severity as AdminObstacle["severity"]) || "low",
    description: data.description || "",
    photoBase64: data.photoBase64,
    timePattern: data.timePattern || "permanent",

    reportedBy: data.reportedBy || "unknown",
    reportedAt: convertTimestamp(data.reportedAt),
    deviceType: data.deviceType,
    barangay: data.barangay,

    upvotes: typeof data.upvotes === "number" ? data.upvotes : 0,
    downvotes: typeof data.downvotes === "number" ? data.downvotes : 0,

    status: (data.status as ObstacleStatus) || "pending",
    verified: !!data.verified,
    reviewedBy: data.reviewedBy,
    reviewedAt: data.reviewedAt ? convertTimestamp(data.reviewedAt) : undefined,
    adminNotes: data.adminNotes,

    deleted: !!data.deleted,
    deletedBy: data.deletedBy,
    deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
    createdAt: convertTimestamp(data.createdAt || data.reportedAt),
  };
}

export class AdminObstacleService {
  private readonly COLLECTION_NAME = "obstacles";
  private readonly READ_TIMEOUT = 15000; // ms - adjust as needed

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

      let obstacleQuery = query(obstaclesRef);

      if (options.status && options.status.length > 0) {
        obstacleQuery = query(
          obstacleQuery,
          where("status", "in", options.status)
        );
      }

      const orderField = options.orderBy || "reportedAt";
      const orderDirection = options.orderDirection || "desc";
      obstacleQuery = query(obstacleQuery, orderBy(orderField, orderDirection));

      if (options.limit) {
        obstacleQuery = query(obstacleQuery, limit(options.limit));
      }

      const querySnapshot = await withTimeout(
        getDocs(obstacleQuery),
        this.READ_TIMEOUT,
        `getAllObstacles timed out after ${this.READ_TIMEOUT}ms`
      );

      const obstacles: AdminObstacle[] = [];
      querySnapshot.forEach((docSnapshot) => {
        try {
          obstacles.push(convertFirebaseToAdminObstacle(docSnapshot));
        } catch (convErr) {
          console.warn(
            `⚠️ Error converting obstacle ${docSnapshot.id}:`,
            getErrorMessage(convErr)
          );
        }
      });

      console.log(`✅ Loaded ${obstacles.length} obstacles from Firebase`);
      return obstacles;
    } catch (error) {
      console.error(
        "❌ Error loading obstacles from Firebase:",
        getErrorMessage(error)
      );
      throw new Error(
        `Failed to load obstacles from database: ${getErrorMessage(error)}`
      );
    }
  }

  async getObstaclesInTimeframe(days: number): Promise<AdminObstacle[]> {
    try {
      console.log(`📅 Loading obstacles from last ${days} days...`);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const cutoffTs = Timestamp.fromDate(cutoffDate);

      const obstaclesRef = collection(db, this.COLLECTION_NAME);
      const timeframeQuery = query(
        obstaclesRef,
        where("reportedAt", ">=", cutoffTs),
        orderBy("reportedAt", "desc")
      );

      const querySnapshot = await withTimeout(
        getDocs(timeframeQuery),
        this.READ_TIMEOUT,
        `getObstaclesInTimeframe timed out after ${this.READ_TIMEOUT}ms`
      );

      const obstacles: AdminObstacle[] = [];
      querySnapshot.forEach((docSnapshot) => {
        try {
          obstacles.push(convertFirebaseToAdminObstacle(docSnapshot));
        } catch (convErr) {
          console.warn(
            `⚠️ Error converting obstacle ${docSnapshot.id}:`,
            getErrorMessage(convErr)
          );
        }
      });

      console.log(
        `✅ Loaded ${obstacles.length} obstacles from last ${days} days`
      );
      return obstacles;
    } catch (error) {
      console.error(
        "❌ Error loading obstacles by timeframe:",
        getErrorMessage(error)
      );
      throw new Error(
        `Failed to load obstacles for specified timeframe: ${getErrorMessage(
          error
        )}`
      );
    }
  }

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
      console.error(
        "❌ Error updating obstacle status:",
        getErrorMessage(error)
      );
      throw new Error(
        `Failed to update obstacle status: ${getErrorMessage(error)}`
      );
    }
  }

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
      console.error(
        "❌ Error calculating obstacle statistics:",
        getErrorMessage(error)
      );
      throw new Error(
        `Failed to calculate obstacle statistics: ${getErrorMessage(error)}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log("🧪 Testing Firebase connection...");
      const obstaclesRef = collection(db, this.COLLECTION_NAME);
      const testQuery = query(obstaclesRef, limit(1));
      const querySnapshot = await withTimeout(
        getDocs(testQuery),
        8000,
        "testConnection timed out"
      );
      console.log(
        `✅ Firebase connection successful! Found ${querySnapshot.size} test documents`
      );
      return true;
    } catch (error) {
      console.error("❌ Firebase connection failed:", getErrorMessage(error));
      return false;
    }
  }
}

export const adminObstacleService = new AdminObstacleService();
