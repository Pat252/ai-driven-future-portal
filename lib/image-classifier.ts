/**
 * Image Type Classifier - Filename Semantics + CSV Metadata
 * 
 * Classifies images by filename prefix AND CSV metadata (defense-in-depth):
 * 
 * 1. Brand images: Start with "brand-" OR have CSV metadata indicating logos/trademarks
 *    - Used ONLY in Tier 1.5 (brand matching)
 *    - Defense-in-depth: Filename prefix ALWAYS overrides CSV
 * 
 * 2. Subject images: Describe what's shown, NO category prefixes
 *    - Used in Tier 2 (keyword matching)
 * 
 * 3. Generic images: Start with *-generic-* (e.g., ai-generic-*)
 *    - Used ONLY in Tier 3 (final fallback)
 * 
 * Last Updated: 2026-01-05 (Added defense-in-depth)
 */

// ============================================================================
// CSV METADATA INTERFACE (for type safety)
// ============================================================================

export interface ImageMetadata {
  id: number;
  filename: string;
  extension: string;
  source: string;
  license: string;
  paid_account: string;
  logo_visible: string;
  trademark_present: string;
  primary_category: string;
  context_type: string;
  brand_name: string;
  allowed_generic_articles: string;
  allowed_brand_articles: string;
  fallback_tier: string;
  notes: string;
}

// ============================================================================
// DEFENSE-IN-DEPTH: FILENAME-BASED BRAND DETECTION
// ============================================================================

/**
 * Check if filename indicates a brand image (defense-in-depth)
 * 
 * This check ALWAYS runs BEFORE CSV metadata checks.
 * Provides protection against CSV data errors.
 * 
 * @param filename - Image filename
 * @returns true if filename starts with "brand-"
 */
export function isBrandByFilename(filename: string): boolean {
  if (!filename) return false;
  return filename.toLowerCase().startsWith('brand-');
}

// ============================================================================
// COMPREHENSIVE BRAND DETECTION (CSV + FILENAME)
// ============================================================================

/**
 * Check if an image is a brand image (comprehensive check)
 * 
 * Defense-in-depth approach:
 * 1. Filename prefix check (ALWAYS WINS)
 * 2. CSV metadata checks (category, logo, trademark)
 * 3. Brand name presence
 * 
 * This ensures brand images are ALWAYS detected, even if CSV is incorrect.
 * 
 * @param metadata - Image metadata object from CSV
 * @returns true if image is a brand image by ANY criterion
 */
export function isBrandImage(metadata: ImageMetadata): boolean {
  // ✅ Defense-in-depth: filename prefix always wins
  if (isBrandByFilename(metadata.filename)) {
    return true;
  }

  // Check CSV metadata
  return (
    metadata.primary_category === "Brand" ||
    metadata.logo_visible === "Yes" ||
    metadata.trademark_present === "Yes" ||
    Boolean(metadata.brand_name && metadata.brand_name.trim().length > 0)
  );
}

/**
 * Check if an image is safe for generic articles (strict filter)
 * 
 * For an image to be safe for generic articles, ALL must be true:
 * 1. Filename does NOT start with "brand-" (defense-in-depth)
 * 2. primary_category === "Generic"
 * 3. logo_visible === "No"
 * 4. trademark_present === "No"
 * 
 * @param metadata - Image metadata object from CSV
 * @returns true if safe for generic articles
 */
export function isGenericSafe(metadata: ImageMetadata): boolean {
  // ✅ Defense-in-depth: reject any brand- filename
  if (isBrandByFilename(metadata.filename)) {
    return false;
  }

  // Check CSV metadata
  return (
    metadata.primary_category === "Generic" &&
    metadata.logo_visible === "No" &&
    metadata.trademark_present === "No"
  );
}

/**
 * Category prefixes that should be excluded from keyword matching
 * These are semantic prefixes that overpower keyword matching
 */
const CATEGORY_PREFIXES = [
  'creative-',
  'ai-',
  'gen-ai-',
  'economy-',
  'toolbox-',
  'breaking-',
];

/**
 * Check if a filename is a generic image
 * Generic images start with: *-generic-* pattern
 * 
 * @param filename - Image filename
 * @returns true if filename indicates a generic image
 */
export function isGenericImage(filename: string): boolean {
  if (!filename) return false;
  
  const lower = filename.toLowerCase();
  
  // Check for generic pattern: *-generic-* or *-generic.*
  return /-generic-/i.test(lower) || /-generic\./i.test(lower);
}

/**
 * Check if a filename has a category prefix
 * Category prefixes like "creative-", "ai-", "economy-" should be excluded
 * from keyword matching as they overpower semantic matching
 * 
 * @param filename - Image filename
 * @returns true if filename starts with a category prefix
 */
export function hasCategoryPrefix(filename: string): boolean {
  if (!filename) return false;
  
  const lower = filename.toLowerCase();
  
  // Check if filename starts with any category prefix
  return CATEGORY_PREFIXES.some(prefix => lower.startsWith(prefix));
}

/**
 * Check if a filename should be excluded from keyword matching (Tier 2)
 * 
 * Excludes:
 * - Generic images (*-generic-*)
 * - Category-prefixed images (creative-*, ai-*, economy-*, etc.)
 * 
 * Note: Brand images are handled separately in Tier 1.5
 * 
 * @param filename - Image filename
 * @returns true if image should be excluded from keyword matching
 */
export function shouldExcludeFromKeywordMatching(filename: string): boolean {
  return isGenericImage(filename) || hasCategoryPrefix(filename);
}

/**
 * Filter image library to only include subject images (for keyword matching)
 * 
 * Removes:
 * - Generic images
 * - Category-prefixed images
 * - Brand images (handled in Tier 1.5)
 * 
 * @param imageLibrary - Array of image filenames
 * @returns Filtered array with only subject images
 */
export function filterSubjectImages(imageLibrary: string[]): string[] {
  return imageLibrary.filter(filename => !shouldExcludeFromKeywordMatching(filename));
}

/**
 * Filter image library to only include generic images (for Tier 3 fallback)
 * 
 * @param imageLibrary - Array of image filenames
 * @returns Filtered array with only generic images
 */
export function filterGenericImages(imageLibrary: string[]): string[] {
  return imageLibrary.filter(filename => isGenericImage(filename));
}

