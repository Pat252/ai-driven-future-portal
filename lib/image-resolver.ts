/**
 * IMAGE RESOLVER - Abstraction Layer
 * 
 * Allows switching between local files and Cloudflare R2.
 * 
 * CRITICAL: Image filenames ALREADY include their full relative path.
 * Example: "companies/adobe/brand-adobe-3d-logo.jpg"
 * 
 * PRODUCTION-SAFE: No Node.js APIs, works in both server and client
 * 
 * Last Updated: 2026-01-10 (Removed folder logic - filenames are complete paths)
 */

export type ImageSource = 'local' | 'r2';

export interface ImageResolverConfig {
  source: ImageSource;
  r2BaseUrl?: string; // e.g., 'https://images.aidrivenfuture.ca'
  // NOTE: r2Folder is intentionally NOT used - filenames include full paths
}

// Default configuration (backward-compatible with local images)
const DEFAULT_CONFIG: ImageResolverConfig = {
  source: 'local',
};

/**
 * Resolve image path to full URL
 * 
 * CRITICAL: filename must be an exact R2 object key from the manifest.
 * NO modification, NO construction, NO invention of paths.
 * 
 * @param filename - Exact R2 object key (e.g., 'companies/openai/logo-2024.jpg')
 * @param config - Resolver configuration
 * @returns Full image URL (e.g., 'https://images.aidrivenfuture.ca/companies/openai/logo-2024.jpg')
 */
export function resolveArticleImage(
  filename: string,
  config: ImageResolverConfig = DEFAULT_CONFIG
): string {
  if (config.source === 'r2' && config.r2BaseUrl) {
    // Direct concatenation - filename is already the exact R2 key
    const baseUrl = config.r2BaseUrl.replace(/\/$/, '');
    const cleanFilename = filename.replace(/^\//, '');
    
    // Return exact URL with no modification
    return `${baseUrl}/${cleanFilename}`;
  }
  
  // Local mode
  return `/assets/images/all/${filename}`;
}

/**
 * Resolve fallback/placeholder image
 * 
 * ⚠️  DEPRECATED - Use safeImage() from lib/safe-image.ts instead.
 * This function is kept for backward compatibility only.
 * 
 * @param config - Resolver configuration
 * @returns Fallback image URL (R2 CDN generic image)
 */
export function resolveFallbackImage(
  config: ImageResolverConfig = DEFAULT_CONFIG
): string {
  // Always return R2 CDN generic image
  const cdnUrl = process.env.NEXT_PUBLIC_R2_CDN_URL || 'https://images.aidrivenfuture.ca';
  return `${cdnUrl}/generic/generic-01.jpg`;
}

/**
 * Get resolver configuration from environment variables
 * 
 * CLIENT-SAFE: Uses NEXT_PUBLIC_ prefix for browser access
 * 
 * ⚠️  PRODUCTION: R2 mode is MANDATORY for serverless deployment
 */
export function getResolverConfigFromEnv(): ImageResolverConfig {
  // Only NEXT_PUBLIC_ env vars are available in browser
  const source = process.env.NEXT_PUBLIC_IMAGE_SOURCE as ImageSource;
  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_CDN_URL;
  
  // ENFORCE R2 MODE for production (serverless-safe)
  if (!source || source !== 'r2') {
    console.warn(
      '⚠️  NEXT_PUBLIC_IMAGE_SOURCE not set to "r2" - this may cause issues in production.\n' +
      'For serverless deployment, set: NEXT_PUBLIC_IMAGE_SOURCE=r2'
    );
  }
  
  // NOTE: NEXT_PUBLIC_R2_FOLDER is intentionally NOT read
  //       Filenames already contain their full paths
  
  return {
    source: source || 'r2',  // Default to r2 (no local mode)
    r2BaseUrl,
  };
}

/**
 * Check if an image path/URL is from R2
 */
export function isR2Image(imageUrl: string): boolean {
  if (!imageUrl) return false;
  
  // Check if URL contains R2 domain patterns
  return imageUrl.includes('.r2.dev') || 
         imageUrl.includes('.r2.cloudflarestorage.com') ||
         imageUrl.includes('images.aidrivenfuture.ca'); // Our custom domain
}

/**
 * Check if an image path is local
 */
export function isLocalImage(imageUrl: string): boolean {
  if (!imageUrl) return false;
  
  // Local images start with /
  if (imageUrl.startsWith('/')) return true;
  
  // R2 images are not "local"
  if (isR2Image(imageUrl)) return false;
  
  // Reject all other external URLs
  return false;
}
