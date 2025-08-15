// Create this file: scripts/debug-maps.ts
// Run with: npx tsx scripts/debug-maps.ts

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

console.log("🗺️ WAISPATH Google Maps Debug Script");
console.log("=".repeat(50));

// Check environment variables
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
console.log("\n🔑 API Key Check:");
if (apiKey) {
  console.log(
    `✅ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${apiKey.substring(0, 10)}...`
  );

  // Validate API key format
  if (apiKey.startsWith("AIza")) {
    console.log("✅ API key format looks correct");
  } else {
    console.log("❌ API key format looks incorrect (should start with 'AIza')");
  }
} else {
  console.log("❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: MISSING");
}

// Test API key by making a simple request
async function testApiKey() {
  if (!apiKey) {
    console.log("❌ Cannot test API - no key found");
    return;
  }

  console.log("\n🧪 Testing API Key with Google Maps JavaScript API...");

  try {
    // Test with a simple geocoding request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Pasig+City,Philippines&key=${apiKey}`;

    const response = await fetch(testUrl);
    const data = await response.json();

    console.log(`📡 API Response Status: ${data.status}`);

    if (data.status === "OK") {
      console.log("✅ API Key is working correctly!");
      console.log(`📍 Found location: ${data.results[0]?.formatted_address}`);
    } else if (data.status === "REQUEST_DENIED") {
      console.log("❌ API Key issue:");
      console.log("   - Check if Maps JavaScript API is enabled");
      console.log("   - Check API key restrictions in Google Cloud Console");
      console.log("   - Ensure localhost:3000 is in allowed domains");
    } else if (data.status === "OVER_QUERY_LIMIT") {
      console.log("❌ API quota exceeded");
    } else {
      console.log(`❌ API Error: ${data.status}`);
      if (data.error_message) {
        console.log(`   Message: ${data.error_message}`);
      }
    }
  } catch (error) {
    console.log("❌ Network error testing API:");
    console.log(`   ${error}`);
  }
}

// Check Google Cloud Console settings
function showGoogleCloudInstructions() {
  console.log("\n🔧 Google Cloud Console Checklist:");
  console.log("1. Go to https://console.cloud.google.com/");
  console.log("2. Select your project (waispath-4dbf1)");
  console.log("3. Go to APIs & Services → Library");
  console.log("4. Enable these APIs:");
  console.log("   ✓ Maps JavaScript API");
  console.log("   ✓ Maps Embed API");
  console.log("   ✓ Places API");
  console.log("   ✓ Directions API");
  console.log("   ✓ Geocoding API");
  console.log("\n5. Go to APIs & Services → Credentials");
  console.log("6. Click on your API key");
  console.log("7. Under 'Application restrictions':");
  console.log("   → Select 'HTTP referrers (web sites)'");
  console.log("   → Add: localhost:3000/*");
  console.log("   → Add: *.vercel.app/* (for deployment)");
  console.log("\n8. Under 'API restrictions':");
  console.log("   → Select 'Restrict key'");
  console.log("   → Choose the APIs listed above");
}

// Browser debug instructions
function showBrowserDebugInstructions() {
  console.log("\n🌐 Browser Debug Steps:");
  console.log("1. Open Chrome DevTools (F12)");
  console.log("2. Go to Network tab");
  console.log("3. Filter by 'maps.googleapis.com'");
  console.log("4. Reload the page");
  console.log("5. Look for any red/failed requests");
  console.log("6. Check the response for specific error messages");
  console.log("\n🚫 Common fixes for net::ERR_BLOCKED_BY_CLIENT:");
  console.log("• Disable browser extensions (especially ad blockers)");
  console.log("• Try incognito mode");
  console.log("• Clear browser cache and cookies");
  console.log("• Check if corporate firewall blocks googleapis.com");
}

// Run all checks
async function runAllChecks() {
  await testApiKey();
  showGoogleCloudInstructions();
  showBrowserDebugInstructions();

  console.log("\n📋 Next Steps:");
  console.log("1. Fix any API key issues shown above");
  console.log("2. Replace your map component with the fixed version");
  console.log("3. Restart your Next.js dev server");
  console.log("4. Check browser console for any remaining errors");
}

runAllChecks().catch(console.error);
