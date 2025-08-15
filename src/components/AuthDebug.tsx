// Create this file: src/components/AuthDebug.tsx
// Temporary component to debug authentication issues

"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function AuthDebug() {
  const [authState, setAuthState] = useState<string>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    email: string | null;
    uid: string;
    claims: Record<string, unknown>;
  } | null>(null);

  useEffect(() => {
    async function debugAuth() {
      try {
        setAuthState("getting auth instance");
        const auth = await getFirebaseAuth();

        if (!auth) {
          setAuthState("auth instance is null");
          setError("Firebase Auth not available");
          return;
        }

        setAuthState("setting up auth listener");

        const unsubscribe = auth.onAuthStateChanged(
          async (user) => {
            console.log("🔐 Auth state changed:", user?.email || "no user");

            if (user) {
              setAuthState("user found, getting token");
              try {
                const tokenResult = await user.getIdTokenResult();
                console.log("🎟️ Token claims:", tokenResult.claims);

                setUserInfo({
                  email: user.email,
                  uid: user.uid,
                  claims: tokenResult.claims,
                });
                setAuthState("authenticated");
              } catch (tokenError) {
                console.error("❌ Token error:", tokenError);
                setError(`Token error: ${tokenError}`);
                setAuthState("token error");
              }
            } else {
              setAuthState("no user");
              setUserInfo(null);
            }
          },
          (authError) => {
            console.error("❌ Auth error:", authError);
            setError(`Auth error: ${authError.message}`);
            setAuthState("auth error");
          }
        );

        return unsubscribe;
      } catch (initError) {
        console.error("❌ Auth debug error:", initError);
        setError(`Init error: ${initError}`);
        setAuthState("initialization error");
      }
    }

    debugAuth();
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🔐 Auth Debug</h3>

      <div className="text-xs space-y-1">
        <div>
          <strong>State:</strong> {authState}
        </div>

        {error && (
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}

        {userInfo && (
          <div className="text-green-600">
            <div>
              <strong>User:</strong> {userInfo.email}
            </div>
            <div>
              <strong>Admin:</strong> {userInfo.claims?.admin ? "Yes" : "No"}
            </div>
            <div>
              <strong>Role:</strong> {String(userInfo.claims?.role) || "None"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
