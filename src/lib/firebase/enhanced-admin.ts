// src/lib/firebase/enhanced-admin.ts
// Complete Enhanced admin services with automatic Firebase Auth user creation

import { getAdminAuth, getAdminDb } from "./admin";
import { auditLogger } from "../services/auditLogger";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

// Extended admin interface
export interface EnhancedAdminAccount {
  id: string;
  email: string;
  displayName?: string;
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
export interface CreateAdminRequest {
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

// Admin creation response with temporary password
export interface CreateAdminResponse {
  admin: EnhancedAdminAccount;
  temporaryPassword: string;
  message: string;
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
   * Generate a secure temporary password
   */
  private generateTemporaryPassword(): string {
    // Generate a 12-character password with letters, numbers, and symbols
    const chars =
      "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Create Firebase Auth user if it doesn't exist
   */
  private async createFirebaseAuthUser(
    email: string
  ): Promise<{ uid: string; temporaryPassword: string }> {
    try {
      // Check if user already exists
      let userRecord;
      try {
        userRecord = await this.auth.getUserByEmail(email);
        throw new Error(
          `User ${email} already exists in Firebase Auth. Cannot create duplicate account.`
        );
      } catch (error) {
        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError.code !== "auth/user-not-found") {
          throw error; // Re-throw if it's not a "user not found" error
        }
        // User doesn't exist, proceed with creation
      }

      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();

      // Create user in Firebase Auth
      userRecord = await this.auth.createUser({
        email: email,
        password: temporaryPassword,
        emailVerified: false,
        disabled: false,
      });

      console.log(
        `✅ Created Firebase Auth user: ${userRecord.uid} for ${email}`
      );

      return {
        uid: userRecord.uid,
        temporaryPassword: temporaryPassword,
      };
    } catch (error) {
      console.error("Failed to create Firebase Auth user:", error);
      throw error;
    }
  }

  /**
   * Create a new admin account with automatic Firebase Auth user creation
   */
  async createAdminWithAuth(
    request: CreateAdminRequest
  ): Promise<CreateAdminResponse> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        throw new Error("Invalid email format");
      }

      console.log(`🔨 Creating admin account for: ${request.email}`);

      // Step 1: Create Firebase Auth user
      const { uid, temporaryPassword } = await this.createFirebaseAuthUser(
        request.email
      );

      // Step 2: Set custom claims for the user
      const permissions = ROLE_PERMISSIONS[request.role];
      const customClaims = {
        admin: true,
        role: request.role,
        permissions,
        createdAt: new Date().toISOString(),
      };

      await this.auth.setCustomUserClaims(uid, customClaims);
      console.log(`✅ Set custom claims for ${request.email}: ${request.role}`);

      // Step 3: Create admin record in Firestore
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
      console.log(`✅ Created Firestore admin record: ${docRef.id}`);

      const newAdmin: EnhancedAdminAccount = {
        id: docRef.id,
        ...adminData,
      };

      // Step 4: Log audit trail
      await auditLogger.logAdminAction(
        { id: request.createdBy, email: request.createdByEmail },
        "admin_created",
        uid,
        request.email,
        `Created ${request.role} account with Firebase Auth user`
      );

      // Step 5: Handle email invitation (if requested)
      if (request.sendInvite) {
        await this.sendAdminInvitation(
          request.email,
          request.role,
          temporaryPassword
        );
      }

      const response: CreateAdminResponse = {
        admin: newAdmin,
        temporaryPassword: temporaryPassword,
        message: `Admin account created successfully. Temporary password: ${temporaryPassword}`,
      };

      console.log(`🎉 Admin creation complete for ${request.email}`);
      return response;
    } catch (error) {
      console.error("Failed to create admin with auth:", error);
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
        `Changed status to ${newStatus}${reason ? `. Reason: ${reason}` : ""}`
      );

      console.log(`✅ Updated admin ${adminData.email} status to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update admin status:", error);
      throw error;
    }
  }

  /**
   * Send admin invitation email (placeholder - implement with your email service)
   */
  private async sendAdminInvitation(
    email: string,
    role: string,
    temporaryPassword: string
  ): Promise<void> {
    try {
      // TODO: Replace with actual email service (SendGrid, Nodemailer, etc.)
      console.log(`📧 Sending invitation email to: ${email}`);
      console.log(`   Role: ${role}`);
      console.log(`   Temporary Password: ${temporaryPassword}`);
      console.log(
        `   Login URL: ${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/auth/login`
      );

      // For now, just log to console. Replace with actual email implementation:
      /*
      await emailService.send({
        to: email,
        subject: 'WAISPATH Admin Account Created',
        template: 'admin-invitation',
        data: {
          role,
          temporaryPassword,
          loginUrl: process.env.NEXT_PUBLIC_APP_URL + '/auth/login'
        }
      });
      */
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      // Don't throw error - email failure shouldn't break account creation
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
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        lastActiveAt: data?.lastActiveAt?.toDate(),
      } as EnhancedAdminAccount;
    } catch (error) {
      console.error("Failed to fetch admin by ID:", error);
      throw error;
    }
  }

  /**
   * Delete admin account (soft delete - sets status to suspended)
   */
  async deleteAdmin(
    adminId: string,
    deletedBy: { id: string; email: string },
    reason?: string
  ): Promise<void> {
    try {
      await this.updateAdminStatus(adminId, "suspended", deletedBy, reason);

      // Log deletion action
      const adminDoc = await this.db.collection("admins").doc(adminId).get();
      const adminData = adminDoc.data();

      if (adminData) {
        await auditLogger.logAdminAction(
          deletedBy,
          "admin_deactivated",
          adminId,
          adminData.email,
          `Admin account suspended (soft delete)${
            reason ? `. Reason: ${reason}` : ""
          }`
        );
      }

      console.log(`✅ Admin account ${adminId} suspended (soft delete)`);
    } catch (error) {
      console.error("Failed to delete admin:", error);
      throw error;
    }
  }

  /**
   * Validate role permissions for admin creation
   */
  canCreateRole(creatorRole: string, targetRole: string): boolean {
    if (creatorRole === "super_admin") {
      return true; // Super admin can create any role
    }

    if (creatorRole === "lgu_admin" && targetRole === "field_admin") {
      return true; // LGU admin can create field admins
    }

    return false;
  }
}

// Export singleton instance
export const enhancedAdminService = new EnhancedAdminService();

// Export the class for potential direct instantiation
export default EnhancedAdminService;
