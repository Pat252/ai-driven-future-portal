import type { NextConfig } from "next";

// ============================================================================
// 3-TIER FALLBACK CONFIGURATION
// ============================================================================
// POLICY: Unsplash (Tier 2) + Local Assets (Tier 3)
// SECURITY: Explicit allowlist for Unsplash + our domain
// COPYRIGHT: Unsplash License (royalty-free) + owned local assets
// ============================================================================

const nextConfig: NextConfig = {
  images: {
    // Allow SVG rendering (for local .webp.svg placeholders)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    remotePatterns: [
      // ===================================================================
      // UNSPLASH DOMAINS (Tier 2 - Royalty-Free Images)
      // ===================================================================
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Main Unsplash CDN
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com", // Unsplash Source API
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com", // Unsplash Plus
      },
      // ===================================================================
      // OUR OWN DOMAIN (Tier 3 - Local Assets)
      // ===================================================================
      {
        protocol: "https",
        hostname: "www.aidrivenfuture.ca",
      },
      {
        protocol: "https",
        hostname: "aidrivenfuture.ca",
      },
      // ===================================================================
      // FALLBACK CHAIN:
      // 1. Unsplash URL (from RSS parser)
      // 2. Local placeholder (on Unsplash error)
      // 3. Ultimate fallback (if local fails)
      // ===================================================================
    ],
    // Performance optimizations
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;

