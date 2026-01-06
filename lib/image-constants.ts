/**
 * Image Constants - SIMPLIFIED
 * 
 * Only contains essential utilities.
 * All category placeholders and fallback pools have been removed.
 * 
 * Last Updated: 2026-01-06
 */

// ============================================================================
// DEFAULT PLACEHOLDER (UI Error Handler Only)
// ============================================================================

/**
 * Default placeholder for client-side error handling only
 * This is NOT used in server-side image selection
 */
export const DEFAULT_TECH_PLACEHOLDER = '/assets/images/all/ai-robot-future-technology.jpg';

/**
 * Open Graph branded banner for social sharing
 */
export const OG_BRAND_BANNER = '/assets/images/og-brand-banner.png.svg';

// ============================================================================
// HELPER FUNCTIONS (Minimal)
// ============================================================================

/**
 * Validate if an image URL is local
 */
export function isLocalImage(url: string): boolean {
  if (!url) return false;
  
  // ONLY allow local images (starts with /)
  if (url.startsWith('/')) return true;
  
  // ONLY allow our own domain
  if (url.includes('aidrivenfuture.ca')) return true;
  
  // Reject ALL external URLs
  return false;
}

/**
 * Get default placeholder (for backward compatibility)
 * @deprecated Use DEFAULT_TECH_PLACEHOLDER directly
 */
export function getCategoryPlaceholder(category: string): string {
  return DEFAULT_TECH_PLACEHOLDER;
}
