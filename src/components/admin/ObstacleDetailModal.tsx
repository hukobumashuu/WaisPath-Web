// src/components/admin/ObstacleDetailModal.tsx
// Simplified single-tab obstacle detail modal

"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import {
  XMarkIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  PhotoIcon,
  ClockIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { PriorityObstacle } from "@/lib/priority/PriorityCalculator";
import { ObstacleStatus } from "@/types/admin";

const PASIG = {
  primaryNavy: "#08345A",
  softBlue: "#2BA4FF",
  slate: "#0F172A",
  muted: "#6B7280",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  subtleBorder: "#E6EEF8",
};

interface ObstacleDetailModalProps {
  obstacle: PriorityObstacle;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: ObstacleStatus, notes: string) => void;
}

export default function ObstacleDetailModal({
  obstacle,
  isOpen,
  onClose,
  onStatusChange,
}: ObstacleDetailModalProps) {
  // Handle escape key and backdrop clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Utility functions
  const getObstacleIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      vendor_blocking: "🏪",
      parked_vehicles: "🚗",
      construction: "🚧",
      electrical_post: "⚡",
      tree_roots: "🌳",
      no_sidewalk: "⚠️",
      flooding: "💧",
      stairs_no_ramp: "🔺",
      narrow_passage: "↔️",
      broken_pavement: "🕳️",
      steep_slope: "⛰️",
      other: "❓",
    };
    return iconMap[type] || "❓";
  };

  const getPriorityColor = (category: string) => {
    const colors = {
      CRITICAL: "bg-red-100 text-red-800 border-red-300",
      HIGH: "bg-orange-100 text-orange-800 border-orange-300",
      MEDIUM: "bg-blue-100 text-blue-800 border-blue-300",
      LOW: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[category as keyof typeof colors] || colors.LOW;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      verified: "bg-blue-100 text-blue-800 border-blue-300",
      resolved: "bg-green-100 text-green-800 border-green-300",
      false_report: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b border-gray-200"
          style={{ backgroundColor: PASIG.bg }}
        >
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
              style={{ backgroundColor: PASIG.softBlue, color: "white" }}
            >
              {getObstacleIcon(obstacle.type)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {obstacle.type.replace("_", " ")} Report
              </h2>
              <p className="text-gray-600">
                Priority Score: {obstacle.priorityResult.score}/100 • ID: #
                {obstacle.id.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-8">
            {/* Main Info Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getStatusColor(
                      obstacle.status
                    )}`}
                  >
                    {obstacle.status.replace("_", " ").toUpperCase()}
                  </span>
                  <span
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getPriorityColor(
                      obstacle.priorityResult.category
                    )}`}
                  >
                    {obstacle.priorityResult.category} PRIORITY
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Description
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {obstacle.description}
              </p>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-blue-800 text-sm font-medium">
                        Priority Score
                      </p>
                      <p className="text-xl font-bold text-blue-900">
                        {obstacle.priorityResult.score}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <HandThumbUpIcon className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-green-800 text-sm font-medium">
                        Confirmations
                      </p>
                      <p className="text-xl font-bold text-green-900">
                        {obstacle.upvotes}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <HandThumbDownIcon className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-red-800 text-sm font-medium">
                        Disputes
                      </p>
                      <p className="text-xl font-bold text-red-900">
                        {obstacle.downvotes}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-purple-800 text-sm font-medium">
                        Reported
                      </p>
                      <p className="text-lg font-bold text-purple-900">
                        {obstacle.reportedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Reporter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <MapPinIcon className="h-6 w-6 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    Location
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Coordinates
                    </p>
                    <p className="text-gray-900 font-mono">
                      {obstacle.location.latitude.toFixed(6)},{" "}
                      {obstacle.location.longitude.toFixed(6)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Severity Level
                    </p>
                    <p className="text-gray-900 font-medium capitalize">
                      {obstacle.severity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reporter Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <UserIcon className="h-6 w-6 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    Reporter
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">User ID</p>
                    <p className="text-gray-900 font-mono">
                      #{obstacle.reportedBy.slice(-8)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Community Status
                    </p>
                    <p className="text-gray-900">
                      {obstacle.upvotes > obstacle.downvotes
                        ? `Community confirms (${Math.round(
                            (obstacle.upvotes /
                              Math.max(
                                1,
                                obstacle.upvotes + obstacle.downvotes
                              )) *
                              100
                          )}% agreement)`
                        : obstacle.downvotes > obstacle.upvotes
                        ? `Community disputes (${Math.round(
                            (obstacle.downvotes /
                              Math.max(
                                1,
                                obstacle.upvotes + obstacle.downvotes
                              )) *
                              100
                          )}% disagreement)`
                        : "Mixed feedback"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Analysis Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ChartBarIcon className="h-6 w-6 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-900">
                  Priority Analysis
                </h4>
              </div>

              <div className="text-center mb-6">
                <div
                  className={`inline-flex px-6 py-3 rounded-2xl text-2xl font-bold border-2 ${getPriorityColor(
                    obstacle.priorityResult.category
                  )}`}
                >
                  {obstacle.priorityResult.score}/100 -{" "}
                  {obstacle.priorityResult.category}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Accessibility Impact</span>
                    <span className="font-medium">High</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${obstacle.priorityResult.score * 0.4}%`,
                        backgroundColor: PASIG.softBlue,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Community Validation</span>
                    <span className="font-medium">
                      {obstacle.upvotes > obstacle.downvotes
                        ? "Confirmed"
                        : "Disputed"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (obstacle.upvotes /
                            Math.max(
                              1,
                              obstacle.upvotes + obstacle.downvotes
                            )) *
                            100
                        )}%`,
                        backgroundColor:
                          obstacle.upvotes > obstacle.downvotes
                            ? PASIG.success
                            : PASIG.danger,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Severity Level</span>
                    <span className="font-medium capitalize">
                      {obstacle.severity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${
                          obstacle.severity === "blocking"
                            ? 100
                            : obstacle.severity === "high"
                            ? 75
                            : obstacle.severity === "medium"
                            ? 50
                            : 25
                        }%`,
                        backgroundColor:
                          obstacle.severity === "blocking"
                            ? PASIG.danger
                            : obstacle.severity === "high"
                            ? PASIG.warning
                            : PASIG.softBlue,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <InformationCircleIcon className="h-6 w-6 text-blue-600" />
                <h4 className="text-lg font-semibold text-blue-900">
                  Recommendation
                </h4>
              </div>
              <p className="text-blue-800 leading-relaxed mb-4">
                {obstacle.priorityResult.recommendation}
              </p>

              <div className="p-4 bg-blue-100 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Suggested Timeline:
                </p>
                <p className="text-blue-800">
                  {obstacle.priorityResult.timeframe || "Within 30 days"}
                </p>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ClockIcon className="h-6 w-6 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-900">
                  Status History
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">
                        Report Submitted
                      </h5>
                      <span className="text-sm text-gray-500">
                        {obstacle.reportedAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Initial report submitted by community member
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        obstacle.status === "pending"
                          ? "bg-yellow-100"
                          : obstacle.status === "verified"
                          ? "bg-green-100"
                          : obstacle.status === "resolved"
                          ? "bg-blue-100"
                          : "bg-red-100"
                      }`}
                    >
                      {obstacle.status === "pending" ? (
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                      ) : obstacle.status === "verified" ? (
                        <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                      ) : obstacle.status === "resolved" ? (
                        <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 capitalize">
                        {obstacle.status.replace("_", " ")}
                      </h5>
                      <span className="text-sm text-gray-500">Current</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Current status of the accessibility report
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <PhotoIcon className="h-6 w-6 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-900">
                  Evidence Photos
                </h4>
              </div>

              {obstacle.photoBase64 ? (
                <div className="space-y-4">
                  <div className="relative w-full h-64 rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-gray-50">
                    <Image
                      src={`data:image/jpeg;base64,${obstacle.photoBase64}`}
                      alt={`Evidence photo for ${obstacle.type} obstacle`}
                      width={800}
                      height={600}
                      className="object-cover w-full h-full"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        console.error("Failed to load photo:", e);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      📱 Mobile Photo
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-800 text-sm font-medium">
                        Photo evidence submitted by community member
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No photos available</p>
                  <p className="text-sm text-gray-400 mt-1">
                    This report was submitted without photo evidence
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Last updated: {obstacle.reportedAt.toLocaleDateString()}
            </span>
            {obstacle.verified && (
              <div className="flex items-center space-x-1 text-green-600">
                <ShieldCheckIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              Close
            </button>

            {obstacle.status === "pending" && (
              <>
                <button
                  onClick={() => {
                    onStatusChange(
                      obstacle.id,
                      "false_report" as ObstacleStatus,
                      "Marked as false report via detail modal"
                    );
                    onClose();
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Mark as False Report
                </button>
                <button
                  onClick={() => {
                    onStatusChange(
                      obstacle.id,
                      "verified" as ObstacleStatus,
                      "Verified via detail modal"
                    );
                    onClose();
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  Verify Report
                </button>
              </>
            )}

            {obstacle.status === "verified" && (
              <button
                onClick={() => {
                  onStatusChange(
                    obstacle.id,
                    "resolved" as ObstacleStatus,
                    "Resolved via detail modal"
                  );
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Mark as Resolved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
