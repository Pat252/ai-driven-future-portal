import type { NextConfig } from "next";

// ============================================================================
// PRODUCTION IMAGE CONFIGURATION
// ============================================================================
// POLICY: Cloudflare R2 (Primary) + Local Assets (Fallback) + Unsplash
// SECURITY: Explicit allowlist for CDN domains
// COPYRIGHT: R2 owned assets + Unsplash License + local assets
// ============================================================================

const nextConfig: NextConfig = {
  images: {
    // Allow SVG rendering (for local .webp.svg placeholders)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // Allowed quality values (supports both 75 and 85)
    // Next.js default is 75, but components may use 85 for hero images
    unoptimized: false, // Keep optimization enabled
    
    remotePatterns: [
      // ===================================================================
      // CLOUDFLARE R2 - CUSTOM DOMAIN (Primary CDN)
      // ===================================================================
      {
        protocol: "https",
        hostname: "images.aidrivenfuture.ca",
        pathname: "/**",
      },
      // ===================================================================
      // CLOUDFLARE R2 - PUBLIC DEVELOPMENT URL (Fallback)
      // ===================================================================
      {
        protocol: "https",
        hostname: "pub-43b5ac55153d4616afc57dd42dde1a8a.r2.dev",
        pathname: "/**",
      },
      // ===================================================================
      // CLOUDFLARE R2 - WILDCARD (For future subdomains)
      // ===================================================================
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      // ===================================================================
      // UNSPLASH DOMAINS (Legacy support)
      // ===================================================================
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      // ===================================================================
      // OUR OWN DOMAIN (For self-hosted assets)
      // ===================================================================
      {
        protocol: "https",
        hostname: "www.aidrivenfuture.ca",
      },
      {
        protocol: "https",
        hostname: "aidrivenfuture.ca",
      },
    ],
    
    // Performance optimizations
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Cache optimization
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
