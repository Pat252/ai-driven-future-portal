/**
 * Brand-Aware Image Matching - Explicit Brand Detection
 * 
 * This module provides strict, deterministic brand matching for image selection.
 * Brand images are ONLY used when the brand name appears explicitly in both:
 * 1. The article title (case-insensitive)
 * 2. The image filename (case-insensitive)
 * 
 * Rules:
 * - No fuzzy matching, no inference, no synonyms
 * - Exact string inclusion only
 * - Deterministic selection using hash when multiple matches exist
 * - Zero OpenAI calls
 * 
 * Last Updated: 2026-01-04
 */

/**
 * Generic words to ignore when extracting brand names from filenames
 */
const GENERIC_WORDS = new Set([
  'logo', 'logos', 'image', 'images', 'photo', 'photos', 'picture', 'pictures',
  'on', 'with', 'and', 'the', 'a', 'an', 'in', 'at', 'for', 'from', 'to',
  'mobile', 'mobiles', 'phone', 'phones', 'bag', 'bags', 'building', 'buildings',
  'office', 'offices', 'store', 'stores', 'company', 'companies', 'front',
  'outdoor', 'indoor', 'neon', 'red', 'blue', 'green', 'gray', 'grey',
  '3d', '2d', 'icon', 'icons', 'app', 'apps', 'page', 'pages', 'tv', 'television',
  'laptop', 'laptops', 'cell', 'cells', 'device', 'devices', 'table', 'tables',
  'card', 'cards', 'credit', 'branch', 'branches', 'address', 'top', 'view',
  'man', 'woman', 'person', 'people', 'holding', 'sitting', 'looking',
  'article', 'articles', 'floating', 'gear', 'items', 'atlas', 'feature',
  'features', 'screen', 'onscreen', 'open', 'closed', 'vintage', 'head',
  'brick', 'wall', 'glow', 'remote', 'web', 'browser', 'film', 'camera',
]);

/**
 * Extract brand candidate from a filename
 * 
 * Strategy:
 * 1. Split filename by - and _
 * 2. Remove file extension
 * 3. Filter out generic words
 * 4. Return the first non-generic word (usually the brand)
 * 
 * Examples:
 * - "doordash-logo-on-bag.jpg" → "doordash"
 * - "openai-logo-on-television.jpg" → "openai"
 * - "microsoft-building-logo.jpg" → "microsoft"
 * - "apple-company-front-building.jpg" → "apple"
 * 
 * @param filename - Image filename (e.g., "doordash-logo-on-bag.jpg")
 * @returns Brand candidate string or null if no brand found
 */
export function extractBrandFromFilename(filename: string): string | null {
  if (!filename) return null;
  
  // Remove file extension
  const withoutExt = filename.replace(/\.[^.]*$/, '');
  
  // Split by - and _
  const parts = withoutExt.split(/[-_]/);
  
  // Filter out generic words and find first brand candidate
  for (const part of parts) {
    const normalized = part.toLowerCase().trim();
    
    // Skip empty, single char, or generic words
    if (normalized.length > 1 && !GENERIC_WORDS.has(normalized)) {
      return normalized;
    }
  }
  
  return null;
}

/**
 * Check if a brand name appears explicitly in text (case-insensitive)
 * 
 * Uses exact string matching - no fuzzy matching, no inference
 * 
 * @param brand - Brand name to search for (normalized, lowercase)
 * @param text - Text to search in (article title)
 * @returns true if brand appears in text
 */
export function brandMatchesText(brand: string, text: string): boolean {
  if (!brand || !text) return false;
  
  const normalizedText = text.toLowerCase();
  const normalizedBrand = brand.toLowerCase();
  
  // Exact substring match (case-insensitive)
  return normalizedText.includes(normalizedBrand);
}

/**
 * Find brand images that match the article title
 * 
 * @param title - Article title
 * @param imageLibrary - Array of image filenames
 * @returns Array of matching image filenames (empty if no matches)
 */
export function findBrandMatches(title: string, imageLibrary: string[]): string[] {
  if (!title || !imageLibrary || imageLibrary.length === 0) {
    return [];
  }
  
  const normalizedTitle = title.toLowerCase();
  const matches: string[] = [];
  
  for (const filename of imageLibrary) {
    const brand = extractBrandFromFilename(filename);
    
    if (brand && brandMatchesText(brand, normalizedTitle)) {
      matches.push(filename);
    }
  }
  
  return matches;
}

/**
 * Select a deterministic brand image from matches
 * 
 * Uses hash-based selection to ensure the same article title
 * always gets the same brand image when multiple matches exist.
 * 
 * @param title - Article title (used for hashing)
 * @param brandMatches - Array of matching image filenames
 * @param hashFn - Hash function (simpleHash from image-utils)
 * @returns Selected image filename or null if no matches
 */
export function selectBrandImage(
  title: string,
  brandMatches: string[],
  hashFn: (str: string) => number
): string | null {
  if (!brandMatches || brandMatches.length === 0) {
    return null;
  }
  
  if (brandMatches.length === 1) {
    return brandMatches[0];
  }
  
  // Multiple matches - use hash for deterministic selection
  const titleHash = hashFn(title);
  const index = Math.floor(titleHash * brandMatches.length);
  
  return brandMatches[index];
}


