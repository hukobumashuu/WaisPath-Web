// Create this file: scripts/debug-auth.ts
// Run with: npx tsx scripts/debug-auth.ts

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

console.log("🔐 WAISPATH Firebase Authentication Debug");
console.log("=".repeat(50));

// Check BOTH naming conventions
const nextJsVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const expoVars = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
];

console.log("\n📱 Next.js Variables (NEXT_PUBLIC_*):");
let nextJsComplete = true;
nextJsVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    nextJsComplete = false;
  }
});

console.log("\n📱 Expo Variables (EXPO_PUBLIC_*):");
let expoComplete = true;
expoVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    expoComplete = false;
  }
});

console.log("\n📊 Configuration Status:");
console.log(
  `Next.js Config: ${nextJsComplete ? "✅ Complete" : "❌ Incomplete"}`
);
console.log(`Expo Config: ${expoComplete ? "✅ Complete" : "❌ Incomplete"}`);

// Test Firebase client initialization
async function testFirebaseClient() {
  console.log("\n🧪 Testing Firebase Client Initialization...");

  try {
    // Test with Next.js environment variables first
    if (nextJsComplete) {
      console.log("🔄 Testing with NEXT_PUBLIC_* variables...");

      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      console.log("✅ Firebase config object created successfully");
      console.log(`📍 Project ID: ${firebaseConfig.projectId}`);
      console.log(`🌐 Auth Domain: ${firebaseConfig.authDomain}`);
    }

    // Test with Expo variables if Next.js fails
    if (!nextJsComplete && expoComplete) {
      console.log("🔄 Testing with EXPO_PUBLIC_* variables...");

      const firebaseConfig = {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      };

      console.log("✅ Firebase config object created successfully");
      console.log(`📍 Project ID: ${firebaseConfig.projectId}`);
      console.log(`🌐 Auth Domain: ${firebaseConfig.authDomain}`);
    }
  } catch (error) {
    console.log("❌ Firebase client config error:", error);
  }
}

// Check if you have an admin user set up
async function checkAdminSetup() {
  console.log("\n👤 Checking Admin User Setup...");

  try {
    // Check admin environment variables
    const adminVars = [
      "FIREBASE_ADMIN_PROJECT_ID",
      "FIREBASE_ADMIN_CLIENT_EMAIL",
      "FIREBASE_ADMIN_PRIVATE_KEY",
    ];

    const adminComplete = adminVars.every((varName) => process.env[varName]);

    if (adminComplete) {
      console.log("✅ Admin SDK variables are present");
      console.log("📧 Admin Email:", process.env.FIREBASE_ADMIN_CLIENT_EMAIL);

      // Import and test admin SDK
      const { getAdminAuth } = await import("../src/lib/firebase/admin");
      console.log("✅ Admin SDK imported successfully");

      // List first few users to see if any exist
      try {
        const adminAuth = getAdminAuth();
        const listUsers = await adminAuth.listUsers(3);

        console.log(
          `👥 Found ${listUsers.users.length} users in Firebase Auth`
        );

        if (listUsers.users.length === 0) {
          console.log("⚠️  No users found! You need to:");
          console.log("   1. Create a user account in Firebase Console");
          console.log("   2. Run: npx tsx scripts/setup-admin.ts");
        } else {
          console.log("📋 First few users:");
          listUsers.users.forEach((user, index) => {
            console.log(
              `   ${index + 1}. ${user.email} (${user.uid.substring(0, 8)}...)`
            );
          });
        }
      } catch (error) {
        console.log("❌ Could not list users:", error);
      }
    } else {
      console.log("❌ Admin SDK variables are missing");
    }
  } catch (error) {
    console.log("❌ Admin setup check failed:", error);
  }
}

// Show fix instructions
function showFixInstructions() {
  console.log("\n🛠️  Quick Fix Instructions:");

  if (!nextJsComplete && !expoComplete) {
    console.log("❌ Missing Firebase configuration variables");
    console.log(
      "   1. Update your .env.local file with both NEXT_PUBLIC_* and EXPO_PUBLIC_* variables"
    );
    console.log("   2. Use the fixed .env.local file provided");
  } else if (!expoComplete) {
    console.log("⚠️  Missing EXPO_PUBLIC_* variables");
    console.log("   1. Add EXPO_PUBLIC_* versions of your Firebase variables");
    console.log("   2. This ensures compatibility with shared code");
  }

  console.log("\n📋 Next Steps:");
  console.log("1. Update your .env.local file");
  console.log("2. Restart your Next.js dev server: npm run dev");
  console.log("3. Create a test user in Firebase Console if none exist");
  console.log("4. Run setup-admin.ts to grant admin privileges");
  console.log("5. Try logging in again");
}

// Run all checks
async function runAllChecks() {
  await testFirebaseClient();
  await checkAdminSetup();
  showFixInstructions();
}

runAllChecks().catch(console.error);
