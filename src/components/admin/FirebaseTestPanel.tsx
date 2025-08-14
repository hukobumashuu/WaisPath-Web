// src/components/admin/FirebaseTestPanel.tsx
// FIXED: useFirebaseObstacles hook usage with adminUserId parameter

"use client";

import React from "react";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";
import { useAdminAuth } from "@/lib/auth/firebase-auth";

export default function FirebaseTestPanel() {
  const { user } = useAdminAuth();

  // 🔥 FIXED: Added adminUserId parameter
  const { obstacles, loading, error, loadObstacles } = useFirebaseObstacles(
    { autoLoad: true },
    user?.uid || ""
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔥 Firebase Connection Test
        </h3>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading obstacles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔥 Firebase Connection Test
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-800">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔥 Firebase Connection Test
      </h3>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-green-800 font-medium">
              Firebase Connected Successfully!
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">
              {obstacles.length}
            </div>
            <div className="text-sm text-blue-700">Total Obstacles</div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-900">
              {obstacles.filter((o) => o.status === "pending").length}
            </div>
            <div className="text-sm text-yellow-700">Pending Review</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">
              {obstacles.filter((o) => o.status === "verified").length}
            </div>
            <div className="text-sm text-green-700">Verified</div>
          </div>
        </div>

        {/* Recent Obstacles */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Recent Obstacles:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {obstacles.slice(0, 5).map((obstacle) => (
              <div
                key={obstacle.id}
                className="bg-gray-50 rounded-lg p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {obstacle.type.replace("_", " ").toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      obstacle.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : obstacle.status === "verified"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {obstacle.status}
                  </span>
                </div>
                <div className="text-gray-600 mt-1">
                  {obstacle.description.slice(0, 80)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadObstacles}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
