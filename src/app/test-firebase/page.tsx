// src/app/test-firebase/page.tsx
import { FirebaseTestPanel } from "@/components/admin/FirebaseTestPanel";

export default function TestFirebasePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🔥 Firebase Connection Test</h1>
      <FirebaseTestPanel />
    </div>
  );
}
