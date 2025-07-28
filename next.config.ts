import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure environment variables are properly loaded
  env: {
    // Explicitly expose these for debugging
    CUSTOM_KEY: process.env.NODE_ENV,
  },

  // Ensure turbopack doesn't interfere with env loading
  experimental: {
    turbo: {
      // Environment variable handling
    },
  },

  // Add webpack config to debug env vars
  webpack: (config, { dev, isServer }) => {
    // Log environment variables during build
    if (dev && !isServer) {
      console.log("🔍 Webpack Debug - Environment variables found:");
      console.log("- NODE_ENV:", process.env.NODE_ENV);
      console.log("- Has API Key:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
      console.log(
        "- Has Project ID:",
        !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      );
    }

    return config;
  },
};

export default nextConfig;
