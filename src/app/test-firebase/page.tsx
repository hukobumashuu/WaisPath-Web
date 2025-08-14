// src/app/test-firebase/page.tsx
// FIXED: Proper import for FirebaseTestPanel component

"use client";

import FirebaseTestPanel from "@/components/admin/FirebaseTestPanel";

export default function TestFirebasePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Firebase Connection Test
          </h1>
          <p className="text-gray-600">
            Test your Firebase connection and verify obstacle data loading
          </p>
        </div>

        <FirebaseTestPanel />
      </div>
    </div>
  );
}
