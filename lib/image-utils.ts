/**
 * SIMPLIFIED IMAGE SELECTION PIPELINE
 * 
 * Single-tier scoring system with no fallbacks.
 * Every article gets a real image from /public/assets/images/all/
 * 
 * Last Updated: 2026-01-06 (Complete refactor)
 */

// ============================================================================
// TYPES
// ============================================================================

export type ImageDecision = {
  image: string;             // final public path (e.g., /assets/images/all/xxx.jpg)
  filename: string;          // raw filename (xxx.jpg)
  score: number;             // selection score
  reason: string;
  policyVersion: number;     // bump when rules change
};

export type ImageSelectionContext = {
  usedFilenames: Set<string>;
};

export const IMAGE_POLICY_VERSION = 2; // Bumped for new scoring system

// ============================================================================
// IMAGE DISCOVERY (SERVER-SIDE ONLY)
// ============================================================================

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
let imageLibraryCache: string[] | null = null;

/**
 * Discover all images in /public/assets/images/all/
 * SERVER-SIDE ONLY - Uses Node.js 'fs' module
 * 
 * @returns Array of image filenames
 */
function getAllLocalImages(): string[] {
  // Return cached list if available
  if (imageLibraryCache !== null) {
    return imageLibraryCache;
  }

  // CLIENT-SIDE SAFETY: Should never happen, but guard it
  if (typeof window !== 'undefined') {
    throw new Error('getAllLocalImages() called on client-side - this should never happen');
  }

  try {
    const fs = require('fs');
    const path = require('path');
    
    const imagesDir = path.join(process.cwd(), 'public', 'assets', 'images', 'all');
    const files = fs.readdirSync(imagesDir);
    
    const imageFiles = files.filter((file: string) => {
      const ext = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });
    
    imageFiles.sort();
    imageLibraryCache = imageFiles;
    
    console.log(`✅ Discovered ${imageFiles.length} images in /public/assets/images/all/`);
    
    if (imageFiles.length === 0) {
      throw new Error('CRITICAL: No images found in /public/assets/images/all/');
    }
    
    return imageFiles;
  } catch (error) {
    console.error('❌ CRITICAL ERROR: Failed to read images directory:', error);
    throw error; // Don't swallow this - we need images to work
  }
}

/**
 * Get the image library (auto-discovered or cached)
 * SERVER-SIDE ONLY
 */
export function getImageLibrary(): string[] {
  if (typeof window !== 'undefined') {
    throw new Error('getImageLibrary() called on client-side');
  }
  return getAllLocalImages();
}

/**
 * Clear the image library cache (useful for testing)
 */
export function clearImageCache(): void {
  if (typeof window !== 'undefined') {
    console.warn('⚠️  clearImageCache() called on client-side, ignoring');
    return;
  }
  imageLibraryCache = null;
  console.log('🔄 Image library cache cleared');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Add public path prefix to filename
 */
export function withPublicPath(filename: string): string {
  return `/assets/images/all/${filename}`;
}

/**
 * Simple hash function for deterministic selection
 * Same input always returns same value between 0 and 1
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

/**
 * Stop words to ignore in keyword matching
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 's', 't', 'just', 'now', 'also', 'its', 'new', 'says',
]);

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation except dashes
    .split(/[\s-]+/) // Split on spaces and dashes
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Company and LLM names for brand matching
 */
const BRAND_NAMES = [
  'openai', 'gpt', 'chatgpt',
  'google', 'gemini', 'deepmind',
  'meta', 'facebook', 'instagram', 'whatsapp',
  'apple', 'siri', 'iphone',
  'microsoft', 'copilot', 'azure', 'bing',
  'nvidia', 'cuda',
  'amazon', 'aws', 'alexa',
  'anthropic', 'claude',
  'tesla', 'spacex',
  'samsung', 'netflix', 'uber', 'airbnb',
  'bitcoin', 'ethereum', 'cryptocurrency',
  'llama', 'mistral', 'cohere',
];

// ============================================================================
// SINGLE SCORING FUNCTION
// ============================================================================

/**
 * Score an image for relevance to an article
 * 
 * Scoring signals:
 * - +5 if filename contains company or LLM name found in article
 * - +4 if filename contains brand keyword
 * - +2 per keyword overlap with article title
 * - +1 per keyword overlap with category
 * - -3 if image already used in this page render
 * 
 * @param imageFilename - Image filename to score
 * @param articleTitle - Article title
 * @param articleDescription - Article description
 * @param category - Article category
 * @param usedFilenames - Set of already-used filenames
 * @returns Score (higher = better match)
 */
function scoreImage(
  imageFilename: string,
  articleTitle: string,
  articleDescription: string,
  category: string,
  usedFilenames: Set<string>
): number {
  let score = 0;
  
  const imageLower = imageFilename.toLowerCase();
  const titleLower = articleTitle.toLowerCase();
  const descLower = articleDescription.toLowerCase();
  const categoryLower = category.toLowerCase();
  
  const articleText = `${titleLower} ${descLower}`;
  const imageKeywords = extractKeywords(imageFilename);
  const titleKeywords = extractKeywords(articleTitle);
  const categoryKeywords = extractKeywords(category);
  
  // SIGNAL 1: Company/LLM name matching (+5 per match)
  for (const brand of BRAND_NAMES) {
    if (articleText.includes(brand) && imageLower.includes(brand)) {
      score += 5;
    }
  }
  
  // SIGNAL 2: Brand keyword in filename (+4)
  const hasBrandKeyword = BRAND_NAMES.some(brand => imageLower.includes(brand));
  if (hasBrandKeyword && articleText.split(/\s+/).some(word => BRAND_NAMES.includes(word))) {
    score += 4;
  }
  
  // SIGNAL 3: Title keyword overlap (+2 per match)
  let titleMatches = 0;
  for (const keyword of titleKeywords) {
    if (imageKeywords.includes(keyword)) {
      score += 2;
      titleMatches++;
    }
  }
  
  // SIGNAL 4: Category keyword overlap (+1 per match)
  for (const keyword of categoryKeywords) {
    if (imageKeywords.includes(keyword)) {
      score += 1;
    }
  }
  
  // SIGNAL 5: Already used penalty (-3)
  if (usedFilenames.has(imageFilename)) {
    score -= 3;
  }
  
  return score;
}

// ============================================================================
// MAIN IMAGE SELECTOR
// ============================================================================

/**
 * Select the best image for an article
 * 
 * GUARANTEES:
 * - Always returns a valid ImageDecision
 * - Never returns null/undefined
 * - If image pool is empty, throws error (fail fast)
 * 
 * SELECTION RULE:
 * 1. Score all images
 * 2. Pick image(s) with highest score
 * 3. If multiple tie, prefer unused images
 * 4. If all tied images are used, select deterministically via hash
 * 
 * @param title - Article title
 * @param description - Article description  
 * @param category - Article category
 * @param imageLibrary - Array of available image filenames
 * @param context - Per-request context for tracking used images
 * @returns ImageDecision
 */
export async function getArticleImage(
  title: string,
  description: string,
  category: string,
  imageLibrary: string[],
  context: ImageSelectionContext
): Promise<ImageDecision> {
  // SAFETY: Ensure we have images
  if (imageLibrary.length === 0) {
    throw new Error('CRITICAL: Image library is empty - cannot select image');
  }
  
  // Score all images
  const scoredImages = imageLibrary.map(filename => ({
    filename,
    score: scoreImage(filename, title, description, category, context.usedFilenames),
  }));
  
  // Sort by score descending
  scoredImages.sort((a, b) => b.score - a.score);
  
  // Find all images with the highest score
  const maxScore = scoredImages[0].score;
  const topImages = scoredImages.filter(img => img.score === maxScore);
  
  // Prefer unused images among the top scorers
  const unusedTopImages = topImages.filter(img => !context.usedFilenames.has(img.filename));
  const candidatePool = unusedTopImages.length > 0 ? unusedTopImages : topImages;
  
  // Deterministic selection from candidate pool using title hash
  const titleHash = simpleHash(title);
  const selectedIndex = Math.floor(titleHash * candidatePool.length);
  const selected = candidatePool[selectedIndex];
  
  // Register as used
  context.usedFilenames.add(selected.filename);
  
  // Build decision
  const decision: ImageDecision = {
    image: withPublicPath(selected.filename),
    filename: selected.filename,
    score: selected.score,
    reason: `Score: ${selected.score.toFixed(1)} | Pool: ${candidatePool.length} candidates | Used: ${context.usedFilenames.size}`,
    policyVersion: IMAGE_POLICY_VERSION,
  };
  
  // Dev logging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ImageSelect] "${title.substring(0, 40)}..." → ${selected.filename} (score: ${selected.score.toFixed(1)})`);
  }
  
  return decision;
}

/**
 * Synchronous version (no AI fallback needed anymore)
 */
export function getArticleImageSync(
  title: string,
  description: string,
  category: string,
  imageLibrary: string[],
  context: ImageSelectionContext
): ImageDecision {
  // Same implementation as async version (no async operations now)
  if (imageLibrary.length === 0) {
    throw new Error('CRITICAL: Image library is empty - cannot select image');
  }
  
  const scoredImages = imageLibrary.map(filename => ({
    filename,
    score: scoreImage(filename, title, description, category, context.usedFilenames),
  }));
  
  scoredImages.sort((a, b) => b.score - a.score);
  
  const maxScore = scoredImages[0].score;
  const topImages = scoredImages.filter(img => img.score === maxScore);
  
  const unusedTopImages = topImages.filter(img => !context.usedFilenames.has(img.filename));
  const candidatePool = unusedTopImages.length > 0 ? unusedTopImages : topImages;
  
  const titleHash = simpleHash(title);
  const selectedIndex = Math.floor(titleHash * candidatePool.length);
  const selected = candidatePool[selectedIndex];
  
  context.usedFilenames.add(selected.filename);
  
  const decision: ImageDecision = {
    image: withPublicPath(selected.filename),
    filename: selected.filename,
    score: selected.score,
    reason: `Score: ${selected.score.toFixed(1)} | Pool: ${candidatePool.length} candidates`,
    policyVersion: IMAGE_POLICY_VERSION,
  };
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ImageSelect] "${title.substring(0, 40)}..." → ${selected.filename} (score: ${selected.score.toFixed(1)})`);
  }
  
  return decision;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get default placeholder for client-side fallback
 * (Only used in UI error handlers, not in server-side selection)
 */
export function getDefaultPlaceholder(): string {
  return '/assets/images/all/ai-robot-future-technology.jpg';
}

/**
 * Check if an image path is local
 */
export function isLocalImage(imagePath: string): boolean {
  return imagePath.startsWith('/assets/') || imagePath.startsWith('/public/');
}

/**
 * Get image library stats
 */
export function getImageLibraryStats(): {
  totalImages: number;
  sampleFilenames: string[];
} {
  const imageLibrary = getImageLibrary();
  
  return {
    totalImages: imageLibrary.length,
    sampleFilenames: imageLibrary.slice(0, 10),
  };
}
