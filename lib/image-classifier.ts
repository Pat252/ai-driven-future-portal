/**
 * Image Type Classifier - Filename Semantics
 * 
 * Classifies images by filename prefix to enforce clear selection rules:
 * 
 * 1. Brand images: Start with company name (e.g., doordash-*)
 *    - Used ONLY in Tier 1.5 (brand matching)
 * 
 * 2. Subject images: Describe what's shown, NO category prefixes
 *    - Used in Tier 2 (keyword matching)
 * 
 * 3. Generic images: Start with *-generic-* (e.g., ai-generic-*)
 *    - Used ONLY in Tier 3 (final fallback)
 * 
 * Last Updated: 2026-01-04
 */

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

