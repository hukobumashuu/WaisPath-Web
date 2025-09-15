// src/lib/lifecycle/LifecycleManager.ts
// Separated lifecycle management logic with proper logging

import { ObstacleStatus } from "@/types/admin";

export interface StatusAction {
  status: ObstacleStatus;
  label: string;
  color: "blue" | "green" | "red" | "gray";
}

export interface StatusProgression {
  next: ObstacleStatus[];
  actions: StatusAction[];
}

export const STATUS_PROGRESSION: Record<ObstacleStatus, StatusProgression> = {
  pending: {
    next: ["verified", "false_report"],
    actions: [
      { status: "verified", label: "Mark Under Review", color: "blue" },
      { status: "false_report", label: "Mark Invalid", color: "red" },
    ],
  },
  verified: {
    next: ["resolved", "pending"],
    actions: [
      { status: "resolved", label: "Mark as Fixed", color: "green" },
      { status: "pending", label: "Revert to Pending", color: "gray" },
    ],
  },
  resolved: {
    next: ["verified"],
    actions: [
      { status: "verified", label: "Reopen for Review", color: "blue" },
    ],
  },
  false_report: {
    next: ["pending"],
    actions: [{ status: "pending", label: "Revert to Pending", color: "gray" }],
  },
};

export class LifecycleManager {
  static getAvailableActions(currentStatus: ObstacleStatus): StatusAction[] {
    const progression = STATUS_PROGRESSION[currentStatus];
    console.log(
      `📋 Available actions for status ${currentStatus}:`,
      progression?.actions || []
    );
    return progression?.actions || [];
  }

  static canTransition(
    fromStatus: ObstacleStatus,
    toStatus: ObstacleStatus
  ): boolean {
    const progression = STATUS_PROGRESSION[fromStatus];
    const isValid = progression?.next.includes(toStatus) || false;

    console.log(`🔄 Status transition validation:`, {
      from: fromStatus,
      to: toStatus,
      valid: isValid,
      allowedTransitions: progression?.next || [],
    });

    return isValid;
  }

  static getStatusBadgeConfig(status: ObstacleStatus) {
    const configs = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Pending Review",
      },
      verified: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Under Review",
      },
      resolved: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Fixed",
      },
      false_report: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Invalid",
      },
    };

    return configs[status];
  }

  static getActionButtonColor(color: string): string {
    const colorMap = {
      blue: "bg-blue-600 hover:bg-blue-700 text-white",
      green: "bg-green-600 hover:bg-green-700 text-white",
      red: "bg-red-600 hover:bg-red-700 text-white",
      gray: "bg-gray-600 hover:bg-gray-700 text-white",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  }

  static logStatusChange(
    obstacleId: string,
    fromStatus: ObstacleStatus,
    toStatus: ObstacleStatus,
    adminId: string,
    notes: string
  ): void {
    console.log(`✅ Status change logged:`, {
      timestamp: new Date().toISOString(),
      obstacleId,
      transition: `${fromStatus} → ${toStatus}`,
      adminId,
      notes,
      action: "obstacle_status_update",
    });

    // Additional detailed logging for debugging
    console.group(`🔍 Status Change Details for ${obstacleId}`);
    console.log(`Previous Status: ${fromStatus}`);
    console.log(`New Status: ${toStatus}`);
    console.log(`Changed by Admin: ${adminId}`);
    console.log(`Admin Notes: ${notes}`);
    console.log(
      `Validation Passed: ${this.canTransition(fromStatus, toStatus)}`
    );
    console.groupEnd();
  }
}
