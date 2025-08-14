// src/components/admin/FirebaseTestPanel.tsx
// FIXED: Firebase Test Panel with proper React state management!

"use client";

import React, { useState } from "react";
import { useFirebaseObstacles } from "@/lib/hooks/useFirebaseObstacles";

export function FirebaseTestPanel() {
  const [testResult, setTestResult] = useState<string>("");

  // 🔥 FIX: Get fresh data each time with explicit autoLoad: false
  const {
    testConnection,
    loadObstacles,
    obstacles,
    loading,
    error,
    stats,
    hasData,
    loadStats,
  } = useFirebaseObstacles({ autoLoad: false });

  const runConnectionTest = async () => {
    setTestResult("🧪 Testing Firebase connection...");

    try {
      const isConnected = await testConnection();
      if (isConnected) {
        setTestResult("✅ Firebase connection successful!");
      } else {
        setTestResult("❌ Firebase connection failed");
      }
    } catch (err) {
      setTestResult(`❌ Connection error: ${err}`);
    }
  };

  const runDataTest = async () => {
    setTestResult("📊 Loading obstacle data from Firebase...");

    try {
      // Force reload obstacles
      await loadObstacles();

      // Also reload stats to sync with obstacles
      await loadStats();

      // Wait a moment for state to update
      setTimeout(() => {
        if (obstacles.length > 0) {
          setTestResult(
            `✅ SUCCESS! Loaded ${obstacles.length} obstacles from Firebase!`
          );
        } else {
          setTestResult("⚠️ No obstacles found in database");
        }
      }, 200);
    } catch (err) {
      setTestResult(`❌ Data loading error: ${err}`);
    }
  };

  // 🔥 FIX: Show real-time obstacle count
  const currentObstacleCount = obstacles.length;
  const hasRealData = currentObstacleCount > 0;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">
        🔥 Firebase Connection Test
      </h3>

      <div className="space-y-4">
        {/* Test Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={runConnectionTest}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            🧪 Test Connection
          </button>
          <button
            onClick={runDataTest}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={loading}
          >
            📊 Test Data Loading
          </button>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div className="bg-gray-50 rounded p-3 border">
            <pre className="text-sm font-mono">{testResult}</pre>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 rounded p-3 border border-blue-200">
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
              <span className="text-blue-700">
                ⏳ Loading obstacles from Firebase...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 rounded p-3 border border-red-200">
            <div className="text-red-700">❌ Error: {error}</div>
            <button
              onClick={loadObstacles}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* Real-Time Data Display */}
        <div className="bg-gray-50 rounded p-3 border">
          <h4 className="font-semibold text-gray-800 mb-2">
            📊 Real-Time Status:
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Obstacles in Memory:</strong> {currentObstacleCount}
            </div>
            <div>
              <strong>Has Data:</strong> {hasRealData ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              <strong>Loading:</strong> {loading ? "🔄 Yes" : "✅ No"}
            </div>
            <div>
              <strong>Error:</strong> {error ? "❌ Yes" : "✅ No"}
            </div>
          </div>
        </div>

        {/* Success State - Show Detailed Stats */}
        {hasRealData && !loading && (
          <div className="bg-green-50 rounded p-4 border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3">
              🎉 Firebase Data Successfully Loaded!
            </h4>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600">Total Obstacles</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pending}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.verified}
                </div>
                <div className="text-sm text-gray-600">Verified</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.resolved}
                </div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.falseReports}
                </div>
                <div className="text-sm text-gray-600">False Reports</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalVotes}
                </div>
                <div className="text-sm text-gray-600">Total Votes</div>
              </div>
            </div>

            {/* Sample Obstacles */}
            <details className="mt-4">
              <summary className="cursor-pointer text-green-700 font-medium hover:text-green-800">
                📋 View Sample Obstacles ({Math.min(5, obstacles.length)} of{" "}
                {obstacles.length})
              </summary>
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {obstacles.slice(0, 5).map((obstacle, index) => (
                  <div
                    key={obstacle.id}
                    className="bg-white rounded p-3 border text-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-800">
                        #{index + 1}{" "}
                        {obstacle.type.replace("_", " ").toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          obstacle.severity === "blocking"
                            ? "bg-red-100 text-red-800"
                            : obstacle.severity === "high"
                            ? "bg-orange-100 text-orange-800"
                            : obstacle.severity === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {obstacle.severity}
                      </span>
                    </div>
                    <div className="text-gray-600 mb-2">
                      {obstacle.description.substring(0, 100)}
                      {obstacle.description.length > 100 ? "..." : ""}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        📍 {obstacle.upvotes}↑ {obstacle.downvotes}↓
                      </span>
                      <span>⚖️ {obstacle.status}</span>
                      <span>📅 {obstacle.reportedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            {/* Action Buttons */}
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => window.open("/dashboard/priorities", "_blank")}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                🎯 View Priority Dashboard
              </button>
              <button
                onClick={() => window.open("/dashboard/reports", "_blank")}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
              >
                📊 Generate LGU Report
              </button>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!hasRealData && !loading && !error && (
          <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
            <div className="text-yellow-800">
              📋 No obstacles loaded yet. Click &quot;📊 Test Data Loading&quot;
              to load from Firebase.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
