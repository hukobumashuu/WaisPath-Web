// scripts/debug-firebase.ts
// Debug script to check Firebase configuration

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

console.log("🔍 WAISPATH Firebase Configuration Debug");
console.log("=".repeat(50));

// Check client-side environment variables (for web dashboard)
const clientEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

console.log("\n📱 Client-side Variables (for web dashboard):");
clientEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    // Show first 10 characters for security
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
  }
});

// Check admin-side environment variables (for server operations)
const adminEnvVars = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
];

console.log("\n🔑 Admin SDK Variables (for server operations):");
adminEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    if (varName === "FIREBASE_ADMIN_PRIVATE_KEY") {
      // Show just the beginning of private key
      console.log(`✅ ${varName}: -----BEGIN PRIVATE KEY-----...`);
    } else {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    }
  } else {
    console.log(`❌ ${varName}: MISSING`);
  }
});

// Check if all required variables are present
const allClientVars = clientEnvVars.every((varName) => process.env[varName]);
const allAdminVars = adminEnvVars.every((varName) => process.env[varName]);

console.log("\n📊 Configuration Status:");
console.log(
  `Client Config: ${allClientVars ? "✅ Complete" : "❌ Incomplete"}`
);
console.log(`Admin Config: ${allAdminVars ? "✅ Complete" : "❌ Incomplete"}`);

if (!allClientVars || !allAdminVars) {
  console.log("\n🚨 Missing Configuration Fix:");
  console.log("1. Go to Firebase Console → Project Settings");
  console.log("2. In 'General' tab, copy web app config");
  console.log("3. In 'Service accounts' tab, generate new private key");
  console.log("4. Update your .env.local file with the missing values");
  console.log(
    "5. Make sure .env.local is in your project root (same folder as package.json)"
  );
}

// Test Firebase Admin SDK initialization
console.log("\n🧪 Testing Firebase Admin SDK...");
try {
  // Import admin SDK to test configuration
  import("../src/lib/firebase/admin")
    .then((adminModule) => {
      console.log("✅ Firebase Admin SDK loaded successfully");
      console.log("🎉 Configuration appears to be working!");
    })
    .catch((error) => {
      console.log("❌ Firebase Admin SDK failed to load:");
      console.log(error.message);
    });
} catch (error) {
  console.log("❌ Failed to test admin SDK:", (error as Error).message);
}
