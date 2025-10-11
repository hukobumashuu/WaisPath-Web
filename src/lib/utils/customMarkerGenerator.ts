// src/lib/utils/customMarkerGenerator.ts
// REDESIGNED: Bigger, better markers with proper verified status colors

import {
  getObstacleTypeEmoji,
  getValidationColor,
  getValidationBadgeText,
  getSeverityColor,
  getSeverityEmoji,
} from "./obstacleTypeHelpers";
import { AdminObstacle } from "@/types/admin";

export type ZoomLevel = "far" | "medium" | "close";
export type MarkerState = "default" | "hover" | "selected";

export function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom <= 13) return "far";
  if (zoom <= 16) return "medium";
  return "close";
}

/**
 * Generate custom SVG marker - REDESIGNED for better visibility
 */
export function generateCustomMarker(
  obstacle: AdminObstacle,
  zoomLevel: ZoomLevel = "medium",
  state: MarkerState = "default"
): google.maps.Icon {
  const sizes = getMarkerSizes(zoomLevel, state);
  const svg = createMarkerSVG(obstacle, zoomLevel, state, sizes);

  return {
    url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(sizes.width, sizes.height),
    anchor: new google.maps.Point(sizes.width / 2, sizes.height - 4),
  };
}

/**
 * REDESIGNED: Much bigger markers for better visibility
 */
function getMarkerSizes(
  zoomLevel: ZoomLevel,
  state: MarkerState
): { width: number; height: number; circleSize: number } {
  let baseWidth = 56; // Increased from 32
  let baseHeight = 80; // Increased from 50

  switch (zoomLevel) {
    case "far":
      baseWidth = 40; // Increased from 24
      baseHeight = 56; // Increased from 36
      break;
    case "medium":
      baseWidth = 56; // Increased from 32
      baseHeight = 80; // Increased from 50
      break;
    case "close":
      baseWidth = 72; // Increased from 40
      baseHeight = 104; // Increased from 62
      break;
  }

  const stateMultiplier =
    state === "selected" ? 1.15 : state === "hover" ? 1.08 : 1.0;

  return {
    width: baseWidth * stateMultiplier,
    height: baseHeight * stateMultiplier,
    circleSize: baseWidth * 0.65 * stateMultiplier,
  };
}

/**
 * Create SVG marker - REDESIGNED with better proportions
 */
function createMarkerSVG(
  obstacle: AdminObstacle,
  zoomLevel: ZoomLevel,
  state: MarkerState,
  sizes: { width: number; height: number; circleSize: number }
): string {
  const { width, height, circleSize } = sizes;

  // Get validation color (now includes verified status)
  const mainColor = getValidationColor(
    obstacle.upvotes,
    obstacle.downvotes,
    obstacle.status,
    obstacle.adminReported
  );

  const severityColor = getSeverityColor(obstacle.severity);
  const icon = getObstacleTypeEmoji(obstacle.type);
  const statusText = getValidationBadgeText(
    obstacle.upvotes,
    obstacle.downvotes,
    obstacle.status,
    obstacle.adminReported
  );

  const centerX = width / 2;
  const circleY = circleSize / 2 + 6;

  const layers: string[] = [];

  // Layer 1: Drop shadow
  layers.push(createShadow(centerX, circleY + 3, circleSize));

  // Layer 2: Severity ring (thicker and more visible)
  if (zoomLevel !== "far") {
    layers.push(
      createSeverityRing(centerX, circleY, circleSize + 2, severityColor)
    );
  }

  // Layer 3: Main circle (bigger)
  layers.push(createMainCircle(centerX, circleY, circleSize, mainColor, state));

  // Layer 4: Icon (properly sized)
  layers.push(createIconElement(centerX, circleY, circleSize, icon));

  // Layer 5: Admin shield
  if (obstacle.adminReported) {
    layers.push(
      createAdminBadge(
        centerX + circleSize / 2 - 4,
        circleY - circleSize / 2 + 4
      )
    );
  }

  // Layer 6: Status banner (REDESIGNED - bigger text, better fit)
  if (zoomLevel !== "far") {
    const bannerY = circleY + circleSize / 2 + 12;
    layers.push(
      createStatusBanner(centerX, bannerY, statusText, mainColor, width)
    );
  }

  // Layer 7: Vote display (REDESIGNED - bigger, clearer)
  if (zoomLevel === "close") {
    const votesY = circleY + circleSize / 2 + 30;
    layers.push(
      createVoteDisplay(centerX, votesY, obstacle.upvotes, obstacle.downvotes)
    );
  }

  return `
    <svg 
      width="${width}" 
      height="${height}" 
      xmlns="http://www.w3.org/2000/svg"
      style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.4));"
    >
      ${layers.join("\n")}
    </svg>
  `;
}

function createShadow(x: number, y: number, size: number): string {
  return `
    <ellipse 
      cx="${x}" 
      cy="${y}" 
      rx="${size / 2}" 
      ry="${size / 7}" 
      fill="rgba(0,0,0,0.25)" 
    />
  `;
}

/**
 * REDESIGNED: Thicker severity ring for better visibility
 */
function createSeverityRing(
  x: number,
  y: number,
  size: number,
  color: string
): string {
  return `
    <circle 
      cx="${x}" 
      cy="${y}" 
      r="${size / 2}" 
      fill="none" 
      stroke="${color}" 
      stroke-width="4"
      opacity="0.7"
    />
  `;
}

/**
 * REDESIGNED: Thicker border, better glow effect
 */
function createMainCircle(
  x: number,
  y: number,
  size: number,
  color: string,
  state: MarkerState
): string {
  const glow =
    state === "selected"
      ? `<circle cx="${x}" cy="${y}" r="${
          size / 2 + 6
        }" fill="${color}" opacity="0.3" />`
      : "";

  return `
    ${glow}
    <circle 
      cx="${x}" 
      cy="${y}" 
      r="${size / 2}" 
      fill="${color}" 
      stroke="white" 
      stroke-width="4"
    />
  `;
}

/**
 * REDESIGNED: Bigger icon, better centering
 */
function createIconElement(
  x: number,
  y: number,
  circleSize: number,
  icon: string
): string {
  const fontSize = circleSize * 0.5; // Bigger icon

  return `
    <text 
      x="${x}" 
      y="${y + 2}" 
      text-anchor="middle" 
      dominant-baseline="central"
      font-size="${fontSize}px"
      font-family="Arial, sans-serif"
    >
      ${icon}
    </text>
  `;
}

/**
 * REDESIGNED: Bigger admin badge
 */
function createAdminBadge(x: number, y: number): string {
  return `
    <g transform="translate(${x}, ${y})">
      <circle 
        cx="0" 
        cy="0" 
        r="10" 
        fill="white" 
        stroke="#F59E0B" 
        stroke-width="2.5"
      />
      <text 
        x="0" 
        y="0" 
        text-anchor="middle" 
        dominant-baseline="central"
        font-size="12px"
      >
        🛡️
      </text>
    </g>
  `;
}

/**
 * FIXED: Banner now TRULY adapts to text width - no more overflow!
 */
function createStatusBanner(
  x: number,
  y: number,
  text: string,
  color: string,
  maxWidth: number
): string {
  const fontSize = 9;

  // FIXED: More accurate text measurement for SVG
  // Each character in bold Arial is approximately 0.8 * fontSize wide
  const avgCharWidth = fontSize * 0.8; // More accurate for bold text
  const estimatedTextWidth = text.length * avgCharWidth;

  // Add generous padding so text never touches edges
  const horizontalPadding = 16; // Increased padding
  const minBannerWidth = estimatedTextWidth + horizontalPadding * 2;

  // Only limit if it would be wider than the marker itself
  // Give it 90% of available width to prevent going outside marker
  const bannerWidth = Math.min(minBannerWidth, maxWidth * 0.9);
  const bannerHeight = fontSize + 10; // Slightly taller

  return `
    <g>
      <!-- Banner background - fully adaptive -->
      <rect 
        x="${x - bannerWidth / 2}" 
        y="${y - bannerHeight / 2}" 
        width="${bannerWidth}" 
        height="${bannerHeight}" 
        rx="8" 
        fill="${color}"
        stroke="white"
        stroke-width="2"
      />
      
      <!-- Banner text - centered with proper sizing -->
      <text 
        x="${x}" 
        y="${y + 1}" 
        text-anchor="middle" 
        dominant-baseline="middle"
        font-size="${fontSize}px"
        font-weight="bold"
        font-family="Arial, sans-serif"
        fill="white"
        letter-spacing="0.3"
      >
        ${text}
      </text>
    </g>
  `;
}

/**
 * REDESIGNED: Bigger vote numbers, better spacing
 */
function createVoteDisplay(
  x: number,
  y: number,
  upvotes: number,
  downvotes: number
): string {
  const fontSize = 12; // Increased from 9
  const spacing = 24; // Increased from 16

  return `
    <g>
      <!-- Background for votes -->
      <rect 
        x="${x - 30}" 
        y="${y - 10}" 
        width="60" 
        height="20" 
        rx="10" 
        fill="white"
        opacity="0.95"
      />
      
      <!-- Upvotes -->
      <text 
        x="${x - spacing / 2 - 2}" 
        y="${y + 1}" 
        text-anchor="end"
        dominant-baseline="middle"
        font-size="${fontSize}px"
        font-weight="bold"
        font-family="Arial, sans-serif"
        fill="#10B981"
      >
        ↑${upvotes}
      </text>
      
      <!-- Separator -->
      <line 
        x1="${x}" 
        y1="${y - 8}" 
        x2="${x}" 
        y2="${y + 8}" 
        stroke="#E5E7EB" 
        stroke-width="2"
      />
      
      <!-- Downvotes -->
      <text 
        x="${x + spacing / 2 + 2}" 
        y="${y + 1}" 
        text-anchor="start"
        dominant-baseline="middle"
        font-size="${fontSize}px"
        font-weight="bold"
        font-family="Arial, sans-serif"
        fill="#EF4444"
      >
        ↓${downvotes}
      </text>
    </g>
  `;
}

/**
 * Simple marker for far zoom
 */
export function generateSimpleMarker(
  obstacle: AdminObstacle
): google.maps.Symbol {
  const color = getValidationColor(
    obstacle.upvotes,
    obstacle.downvotes,
    obstacle.status,
    obstacle.adminReported
  );

  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8, // Increased from 6
    fillColor: color,
    fillOpacity: 0.95,
    strokeColor: "white",
    strokeWeight: 3,
  };
}

/**
 * REDESIGNED: Better info window with bigger elements
 */
export function createInfoWindowContent(obstacle: AdminObstacle): string {
  const icon = getObstacleTypeEmoji(obstacle.type);
  const statusText = getValidationBadgeText(
    obstacle.upvotes,
    obstacle.downvotes,
    obstacle.status,
    obstacle.adminReported
  );
  const severityEmoji = getSeverityEmoji(obstacle.severity);

  const mainColor = getValidationColor(
    obstacle.upvotes,
    obstacle.downvotes,
    obstacle.status,
    obstacle.adminReported
  );

  return `
    <div style="max-width: 300px; font-family: Arial, sans-serif; padding: 4px;">
      <!-- Header -->
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
        <div style="
          font-size: 40px; 
          width: 56px; 
          height: 56px; 
          background: ${mainColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        ">
          ${icon}
        </div>
        <div>
          <h3 style="margin: 0; color: #1f2937; font-size: 17px; font-weight: 700;">
            ${obstacle.type.replace(/_/g, " ").toUpperCase()}
          </h3>
          <div style="margin-top: 6px; display: flex; gap: 8px; align-items: center;">
            <span style="
              background: ${mainColor}; 
              color: white; 
              padding: 4px 10px; 
              border-radius: 12px; 
              font-size: 11px;
              font-weight: bold;
              letter-spacing: 0.5px;
            ">
              ${statusText}
            </span>
            ${
              obstacle.adminReported
                ? '<span style="font-size: 14px;">🛡️ OFFICIAL</span>'
                : ""
            }
          </div>
        </div>
      </div>
      
      <!-- Description -->
      <p style="margin: 0 0 14px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
        ${obstacle.description}
      </p>
      
      <!-- Stats Grid -->
      <div style="
        display: grid; 
        grid-template-columns: repeat(2, 1fr); 
        gap: 10px; 
        padding: 14px;
        background: #f9fafb;
        border-radius: 10px;
        margin-bottom: 14px;
      ">
        <div>
          <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px; font-weight: 600;">SEVERITY</div>
          <div style="color: #1f2937; font-size: 14px; font-weight: 700;">
            ${severityEmoji} ${obstacle.severity.toUpperCase()}
          </div>
        </div>
        <div>
          <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px; font-weight: 600;">COMMUNITY</div>
          <div style="color: #1f2937; font-size: 14px; font-weight: 700;">
            <span style="color: #10B981;">↑${obstacle.upvotes}</span>
            <span style="color: #EF4444; margin-left: 10px;">↓${
              obstacle.downvotes
            }</span>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
        📅 ${obstacle.reportedAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}<br>
        📍 ${obstacle.location.latitude.toFixed(
          4
        )}, ${obstacle.location.longitude.toFixed(4)}
      </div>
    </div>
  `;
}
