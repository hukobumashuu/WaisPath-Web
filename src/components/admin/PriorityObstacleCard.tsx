// src/components/admin/PriorityObstacleCard.tsx
// Separated obstacle card component with original styling and lifecycle management

"use client";

import { useState } from "react";
import { ObstacleStatus } from "@/types/admin";
import { PriorityObstacle } from "@/lib/priority/PriorityCalculator";
import {
  LifecycleManager,
  StatusAction,
} from "@/lib/lifecycle/LifecycleManager";

interface PriorityObstacleCardProps {
  obstacle: PriorityObstacle;
  rank: number;
  onStatusChange: (id: string, status: ObstacleStatus, notes: string) => void;
}

export default function PriorityObstacleCard({
  obstacle,
  rank,
  onStatusChange,
}: PriorityObstacleCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<StatusAction | null>(
    null
  );

  const getCategoryColor = (category: string) => {
    const colors = {
      CRITICAL: "bg-red-100 text-red-800 border-red-300",
      HIGH: "bg-orange-100 text-orange-800 border-orange-300",
      MEDIUM: "bg-blue-100 text-blue-800 border-blue-300",
      LOW: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[category as keyof typeof colors] || colors.LOW;
  };

  const handleActionClick = (action: StatusAction) => {
    console.log(`🎯 Action clicked:`, {
      obstacleId: obstacle.id,
      currentStatus: obstacle.status,
      targetStatus: action.status,
      actionLabel: action.label,
    });

    setSelectedAction(action);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (selectedAction) {
      const notes = `${selectedAction.label} via Priority Dashboard`;

      // Log the status change before executing
      LifecycleManager.logStatusChange(
        obstacle.id,
        obstacle.status,
        selectedAction.status,
        "current-admin-id", // This should come from auth context
        notes
      );

      onStatusChange(obstacle.id, selectedAction.status, notes);
      setShowConfirm(false);
      setSelectedAction(null);
    }
  };

  const renderActionButtons = () => {
    const availableActions = LifecycleManager.getAvailableActions(
      obstacle.status
    );
    const badgeConfig = LifecycleManager.getStatusBadgeConfig(obstacle.status);

    if (availableActions.length === 0) {
      // Show status badge only for resolved/final states
      return (
        <div className="flex flex-col space-y-3">
          <div
            className={`px-4 py-3 rounded-xl border-2 text-sm font-medium text-center ${badgeConfig?.color}`}
          >
            {badgeConfig?.label}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-3">
        {/* Current Status Badge */}
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${badgeConfig?.color} mb-2`}
        >
          {badgeConfig?.label}
        </div>

        {/* Action Buttons */}
        {availableActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action)}
            className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${LifecycleManager.getActionButtonColor(
              action.color
            )}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  console.log(`🃏 Rendering obstacle card:`, {
    id: obstacle.id,
    rank,
    status: obstacle.status,
    priority: obstacle.priorityResult.category,
    score: obstacle.priorityResult.score,
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="flex">
        {/* Left: Content */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-2xl font-bold text-blue-600">#{rank}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 capitalize">
                    {obstacle.type.replace("_", " ")}
                  </h3>
                  <div className="text-sm text-gray-500">
                    Priority Score: {obstacle.priorityResult.score}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 mb-4">
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getCategoryColor(
                    obstacle.priorityResult.category
                  )}`}
                >
                  {obstacle.priorityResult.category} PRIORITY
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-6 text-lg leading-relaxed">
            {obstacle.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center space-x-2">
              <span>Date:</span>
              <span>{obstacle.reportedAt.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>User:</span>
              <span>#{obstacle.reportedBy.slice(-4)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Votes:</span>
              <span>
                {obstacle.upvotes} up, {obstacle.downvotes} down
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Location:</span>
              <span>
                {obstacle.location.latitude.toFixed(4)},{" "}
                {obstacle.location.longitude.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-400">
            <div className="font-bold text-blue-900 mb-2">
              Recommended Action:
            </div>
            <div className="text-blue-800 text-sm leading-relaxed">
              {obstacle.priorityResult.recommendation}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="w-64 bg-gray-50 p-6 flex flex-col justify-center">
          {renderActionButtons()}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {selectedAction.label.toLowerCase()} this
              obstacle?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${LifecycleManager.getActionButtonColor(
                  selectedAction.color
                )}`}
              >
                Yes, {selectedAction.label}
              </button>
              <button
                onClick={() => {
                  console.log(
                    `❌ Action cancelled for obstacle ${obstacle.id}`
                  );
                  setShowConfirm(false);
                  setSelectedAction(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
