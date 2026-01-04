/**
 * Image Constants - Copyright Compliant Image Management
 * 
 * This file centralizes all image paths to ensure 100% copyright compliance.
 * All images should be local, owned assets with proper licensing.
 * 
 * Last Updated: 2026-01-04
 */

// ============================================================================
// DEFAULT PLACEHOLDERS
// ============================================================================

/**
 * Generic tech placeholder for all news articles
 * Used when: No category-specific image is available
 */
export const DEFAULT_TECH_PLACEHOLDER = '/assets/images/defaults/tech-generic.webp.svg';

/**
 * Generic fallback when even the default fails to load
 * This is a solid gradient background as ultimate fallback
 */
export const ULTIMATE_FALLBACK = '/assets/images/defaults/placeholder.webp.svg';

// ============================================================================
// CATEGORY-SPECIFIC PLACEHOLDERS
// ============================================================================

/**
 * Category-specific placeholders for better branding
 * These should be custom-designed, owned images that represent each category
 * NOTE: Files are .webp.svg (SVG format) - extensions MUST match exactly
 */
export const CATEGORY_PLACEHOLDERS = {
  'Breaking AI': '/assets/images/categories/breaking-ai-default.webp.svg',
  'Gen AI': '/assets/images/categories/gen-ai-default.webp.svg',
  'AI Economy': '/assets/images/categories/ai-economy-default.webp.svg',
  'Creative Tech': '/assets/images/categories/creative-tech-default.webp.svg',
  'Toolbox': '/assets/images/categories/toolbox-default.webp.svg',
  'Future Life': '/assets/images/categories/future-life-default.webp.svg',
} as const;

/**
 * Open Graph (OG) branded banner for social sharing
 * This image appears when your site is shared on social media
 * 
 * Requirements:
 * - Dimensions: 1200x630px (Facebook/LinkedIn standard)
 * - Format: PNG or JPEG
 * - Size: < 5MB
 * - Content: Site logo, tagline, branded design
 * NOTE: Currently SVG format
 */
export const OG_BRAND_BANNER = '/assets/images/og-brand-banner.png.svg';

// ============================================================================
// FALLBACK POOL - Position-Aware Diversity
// ============================================================================

/**
 * Local fallback image pool for RSS articles without images
 * 
 * Strategy: Use category-specific placeholders in rotation
 * This ensures visual consistency and diversity without external dependencies
 * 
 * Note: These are the SAME files as category placeholders, just in array form
 * for position-aware rotation logic in the RSS parser
 */
export const FALLBACK_POOL: string[] = [
  CATEGORY_PLACEHOLDERS['Breaking AI'],
  CATEGORY_PLACEHOLDERS['Gen AI'],
  CATEGORY_PLACEHOLDERS['AI Economy'],
  CATEGORY_PLACEHOLDERS['Creative Tech'],
  CATEGORY_PLACEHOLDERS['Toolbox'],
  CATEGORY_PLACEHOLDERS['Future Life'],
  DEFAULT_TECH_PLACEHOLDER,
  DEFAULT_TECH_PLACEHOLDER, // Repeat default for better distribution
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category-specific placeholder image
 * Falls back to generic tech placeholder if category not found
 * 
 * @param category - News article category
 * @returns Path to category-specific or default placeholder
 */
export function getCategoryPlaceholder(category: string): string {
  return CATEGORY_PLACEHOLDERS[category as keyof typeof CATEGORY_PLACEHOLDERS] || DEFAULT_TECH_PLACEHOLDER;
}

/**
 * Get fallback image based on position (for rotation logic)
 * 
 * @param position - Article position in feed (0, 1, 2, 3...)
 * @returns Path to placeholder image
 */
export function getPositionBasedFallback(position: number): string {
  return FALLBACK_POOL[position % FALLBACK_POOL.length];
}

/**
 * Get local image for article (LOCAL-FIRST strategy)
 * 
 * Uses deterministic selection based on category + position
 * to ensure visual diversity across articles
 * 
 * @param category - Article category
 * @param title - Article title (not used currently, but kept for future enhancement)
 * @param position - Article position in feed
 * @returns Local image path
 */
export function getLocalImageForArticle(
  category: string,
  title: string,
  position: number = 0
): string {
  // Simple rotation: use position to cycle through available images
  return getPositionBasedFallback(position);
}

/**
 * Validate if an image URL is local (100% safe)
 * 
 * LOCAL-FIRST POLICY:
 * - ONLY local images are considered valid
 * - ALL external URLs are rejected
 * - Zero copyright risk
 * 
 * @param url - Image URL to validate
 * @returns true if URL is local, false otherwise
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

// ============================================================================
// IMAGE NAMING CONVENTION
// ============================================================================

/**
 * Standard naming convention for all uploaded images:
 * 
 * Format: YYYYMMDD-category-source-description.webp
 * 
 * Examples:
 * - 20260104-breaking-ai-openai-gpt5-announcement.webp
 * - 20260104-gen-ai-nvidia-new-chip.webp
 * - 20260104-ai-economy-tesla-earnings.webp
 * 
 * Rules:
 * 1. Always use WEBP format for optimal performance
 * 2. Keep descriptions short but descriptive (max 50 chars)
 * 3. Use lowercase with hyphens (kebab-case)
 * 4. Include source/attribution in filename
 */
export function generateImageFilename(
  category: string,
  source: string,
  description: string
): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
  const sourceSlug = source.toLowerCase().replace(/\s+/g, '-');
  const descSlug = description.toLowerCase().replace(/\s+/g, '-').substring(0, 50);
  
  return `${date}-${categorySlug}-${sourceSlug}-${descSlug}.webp`;
}

