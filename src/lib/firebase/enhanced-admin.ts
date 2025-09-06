// src/lib/firebase/enhanced-admin.ts
// Enhanced admin services with audit logging and admin management

import { getAdminAuth, getAdminDb } from "./admin";
import { auditLogger } from "../services/auditLogger";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

// Extended admin interface
interface EnhancedAdminAccount {
  id: string;
  email: string;
  role: "super_admin" | "lgu_admin" | "field_admin";
  status: "active" | "deactivated" | "suspended";
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  lastActiveAt?: Date;
  permissions: string[];
  metadata?: {
    phoneNumber?: string;
    department?: string;
    notes?: string;
  };
}

// Admin creation request
interface CreateAdminRequest {
  email: string;
  role: "lgu_admin" | "field_admin";
  createdBy: string;
  createdByEmail: string;
  sendInvite?: boolean;
  metadata?: {
    phoneNumber?: string;
    department?: string;
    notes?: string;
  };
}

// Updated permissions for new roles
const ROLE_PERMISSIONS = {
  super_admin: [
    "obstacles:read",
    "obstacles:approve",
    "obstacles:delete",
    "obstacles:bulk_actions",
    "users:read",
    "users:manage",
    "users:ban",
    "admins:read",
    "admins:create",
    "admins:manage",
    "admins:delete",
    "analytics:read",
    "analytics:export",
    "settings:read",
    "settings:write",
    "audit:read",
  ],
  lgu_admin: [
    "obstacles:read",
    "obstacles:approve",
    "obstacles:delete",
    "obstacles:bulk_actions",
    "users:read",
    "users:manage",
    "admins:read",
    "admins:create_field", // Can only create field admins
    "analytics:read",
    "analytics:export",
    "audit:read",
  ],
  field_admin: [
    "obstacles:read",
    "obstacles:approve", // Basic obstacle validation
    "users:read", // Can view basic user info
  ],
};

class EnhancedAdminService {
  private auth: Auth;
  private db: Firestore;

  constructor() {
    this.auth = getAdminAuth();
    this.db = getAdminDb();
  }

  /**
   * Create a new admin account
   */
  async createAdmin(
    request: CreateAdminRequest
  ): Promise<EnhancedAdminAccount> {
    try {
      // Validate permissions
      if (request.role === "lgu_admin") {
        // Only super_admin can create lgu_admin
        // This check should be done in the API layer with the requesting user's role
      }

      // Check if user already exists in Firebase Auth
      let userRecord;
      try {
        userRecord = await this.auth.getUserByEmail(request.email);
      } catch (error) {
        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError.code === "auth/user-not-found") {
          throw new Error(
            `User ${request.email} does not exist in Firebase Auth. Please create the user first.`
          );
        }
        throw error;
      }

      // Set custom claims
      const permissions = ROLE_PERMISSIONS[request.role];
      const customClaims = {
        admin: true,
        role: request.role,
        permissions,
        createdAt: new Date().toISOString(),
      };

      await this.auth.setCustomUserClaims(userRecord.uid, customClaims);

      // Create admin record in Firestore
      const adminData: Omit<EnhancedAdminAccount, "id"> = {
        email: request.email,
        role: request.role,
        status: "active",
        createdBy: request.createdBy,
        createdByEmail: request.createdByEmail,
        createdAt: new Date(),
        permissions,
        metadata: request.metadata,
      };

      const docRef = await this.db.collection("admins").add(adminData);

      const newAdmin: EnhancedAdminAccount = {
        id: docRef.id,
        ...adminData,
      };

      // Log audit trail
      await auditLogger.logAdminAction(
        { id: request.createdBy, email: request.createdByEmail },
        "admin_created",
        userRecord.uid,
        request.email,
        `Created ${request.role} account`
      );

      // TODO: Send invitation email if requested
      if (request.sendInvite) {
        await this.sendAdminInvitation(request.email, request.role);
      }

      return newAdmin;
    } catch (error) {
      console.error("Failed to create admin:", error);
      throw error;
    }
  }

  /**
   * Get all admin accounts
   */
  async getAllAdmins(): Promise<EnhancedAdminAccount[]> {
    try {
      const snapshot = await this.db
        .collection("admins")
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        lastActiveAt: doc.data().lastActiveAt?.toDate(),
      })) as EnhancedAdminAccount[];
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      throw error;
    }
  }

  /**
   * Update admin status
   */
  async updateAdminStatus(
    adminId: string,
    newStatus: "active" | "deactivated" | "suspended",
    updatedBy: { id: string; email: string },
    reason?: string
  ): Promise<void> {
    try {
      // Get admin details for logging
      const adminDoc = await this.db.collection("admins").doc(adminId).get();
      if (!adminDoc.exists) {
        throw new Error("Admin not found");
      }

      const adminData = adminDoc.data();
      if (!adminData) {
        throw new Error("Admin data not found");
      }

      // Update status in Firestore
      await this.db
        .collection("admins")
        .doc(adminId)
        .update({
          status: newStatus,
          lastUpdated: new Date(),
          updatedBy: updatedBy.id,
          ...(reason && { statusReason: reason }),
        });

      // Update Firebase Auth custom claims if deactivating
      if (newStatus === "deactivated") {
        try {
          const userRecord = await this.auth.getUserByEmail(adminData.email);
          await this.auth.setCustomUserClaims(userRecord.uid, {
            admin: false, // Remove admin access
            deactivated: true,
            deactivatedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.warn("Failed to update auth claims:", error);
        }
      } else if (newStatus === "active" && adminData.status === "deactivated") {
        // Reactivate admin
        try {
          const userRecord = await this.auth.getUserByEmail(adminData.email);
          const permissions =
            ROLE_PERMISSIONS[adminData.role as keyof typeof ROLE_PERMISSIONS];
          await this.auth.setCustomUserClaims(userRecord.uid, {
            admin: true,
            role: adminData.role,
            permissions,
            reactivatedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.warn("Failed to reactivate auth claims:", error);
        }
      }

      // Log audit trail
      const action =
        newStatus === "active" ? "admin_reactivated" : "admin_deactivated";
      await auditLogger.logAdminAction(
        updatedBy,
        action,
        adminId,
        adminData.email,
        reason || `Status changed to ${newStatus}`
      );
    } catch (error) {
      console.error("Failed to update admin status:", error);
      throw error;
    }
  }

  /**
   * Get admin by ID
   */
  async getAdminById(adminId: string): Promise<EnhancedAdminAccount | null> {
    try {
      const doc = await this.db.collection("admins").doc(adminId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        lastActiveAt: data.lastActiveAt?.toDate(),
      } as EnhancedAdminAccount;
    } catch (error) {
      console.error("Failed to fetch admin:", error);
      throw error;
    }
  }

  /**
   * Update admin last active timestamp
   */
  async updateLastActive(email: string): Promise<void> {
    try {
      const snapshot = await this.db
        .collection("admins")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        await doc.ref.update({
          lastActiveAt: new Date(),
        });
      }
    } catch (error) {
      console.warn("Failed to update last active:", error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Send admin invitation email (placeholder)
   */
  private async sendAdminInvitation(
    email: string,
    role: string
  ): Promise<void> {
    // TODO: Implement email sending
    // This could use Firebase Functions, SendGrid, or other email service
    console.log(`📧 Would send invitation email to ${email} for role: ${role}`);

    // For now, just log what the email would contain
    const inviteContent = {
      to: email,
      subject: "WAISPATH Admin Account Created",
      body: `
        You have been granted ${role} access to the WAISPATH Admin Dashboard.
        
        Next steps:
        1. Go to: https://waispath-admin.vercel.app/auth/login
        2. Sign in with this email address
        3. Use the password provided separately
        
        Your role: ${role}
        Dashboard: https://waispath-admin.vercel.app/dashboard
        
        For support, contact the WAISPATH development team.
      `,
    };

    console.log("Invitation email content:", inviteContent);
  }

  /**
   * Get admin statistics for dashboard
   */
  async getAdminStats(): Promise<{
    totalAdmins: number;
    activeAdmins: number;
    adminsByRole: Record<string, number>;
    recentlyCreated: EnhancedAdminAccount[];
  }> {
    try {
      const admins = await this.getAllAdmins();

      const adminsByRole: Record<string, number> = {};
      let activeCount = 0;

      admins.forEach((admin) => {
        adminsByRole[admin.role] = (adminsByRole[admin.role] || 0) + 1;
        if (admin.status === "active") {
          activeCount++;
        }
      });

      return {
        totalAdmins: admins.length,
        activeAdmins: activeCount,
        adminsByRole,
        recentlyCreated: admins.slice(0, 5), // Last 5 created
      };
    } catch (error) {
      console.error("Failed to get admin stats:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedAdminService = new EnhancedAdminService();

// Helper function to check if user can create admin of specific role
export function canCreateAdminRole(
  userRole: string,
  targetRole: string
): boolean {
  if (userRole === "super_admin") {
    return true; // Super admin can create any role
  }

  if (userRole === "lgu_admin" && targetRole === "field_admin") {
    return true; // LGU admin can create field admins
  }

  return false;
}
