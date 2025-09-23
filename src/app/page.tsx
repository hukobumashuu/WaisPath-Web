// src/app/page.tsx
// WAISPATH Landing Page - Redirects to authentication

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth/firebase-auth";
import Link from "next/link";

const PASIG = {
  primaryNavy: "#08345A",
  softBlue: "#2BA4FF",
  slate: "#0F172A",
  muted: "#6B7280",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  success: "#10B981",
  subtleBorder: "#E6EEF8",
};

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAdminAuth();

  useEffect(() => {
    // Auto-redirect logic
    if (!loading) {
      if (user?.isAdmin) {
        // If already logged in as admin, go to dashboard
        router.push("/dashboard");
      } else {
        // After 3 seconds, redirect to login
        const timer = setTimeout(() => {
          router.push("/auth/login");
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PASIG.bg }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: PASIG.softBlue }}
          />
          <p style={{ color: PASIG.muted }}>Loading WAISPATH...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, show brief loading while redirecting
  if (user?.isAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PASIG.bg }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: PASIG.success }}
          />
          <p style={{ color: PASIG.success }}>
            Welcome back! Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Landing page content (shows briefly before redirect)
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: PASIG.bg }}
    >
      <div className="max-w-md w-full">
        <div
          className="text-center p-8 rounded-2xl shadow-sm border"
          style={{
            backgroundColor: PASIG.card,
            borderColor: PASIG.subtleBorder,
          }}
        >
          {/* WAISPATH Logo/Icon */}
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
            style={{ backgroundColor: PASIG.softBlue }}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          {/* Title and Description */}
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: PASIG.slate }}
          >
            WAISPATH
          </h1>

          <p className="text-lg mb-2" style={{ color: PASIG.primaryNavy }}>
            Admin Portal
          </p>

          <p className="text-sm mb-6" style={{ color: PASIG.muted }}>
            Intelligent accessibility mapping and routing system for persons
            with reduced mobility in Pasig City
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors inline-block text-center"
              style={{
                backgroundColor: PASIG.softBlue,
                color: "white",
              }}
            >
              Continue to Admin Login
            </Link>

            <p className="text-xs" style={{ color: PASIG.muted }}>
              Redirecting automatically in 3 seconds...
            </p>
          </div>

          {/* Features Preview */}
          <div
            className="mt-8 pt-6"
            style={{ borderTop: `1px solid ${PASIG.subtleBorder}` }}
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div
                  className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: `${PASIG.success}15` }}
                >
                  <svg
                    className="w-4 h-4"
                    style={{ color: PASIG.success }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p style={{ color: PASIG.slate }}>AHP Priority Algorithm</p>
              </div>

              <div className="text-center">
                <div
                  className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: `${PASIG.primaryNavy}15` }}
                >
                  <svg
                    className="w-4 h-4"
                    style={{ color: PASIG.primaryNavy }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <p style={{ color: PASIG.slate }}>LGU Reports</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-6 pt-4"
            style={{ borderTop: `1px solid ${PASIG.subtleBorder}` }}
          >
            <p className="text-xs" style={{ color: PASIG.muted }}>
              Building inclusive navigation for PWDs in Pasig City
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
