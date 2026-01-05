/**
 * AI-POWERED AUTOMATIC IMAGE DISCOVERY SYSTEM
 * 
 * NO HARD-CODED LIST - AUTOMATIC FILE DETECTION (SERVER-SIDE ONLY)
 * 
 * This system automatically discovers all images in /public/assets/images/all/
 * and uses GPT-4o-mini to intelligently match them to articles.
 * 
 * IMPORTANT: Image discovery uses Node.js 'fs' module (server-side only).
 * Client components should never call discovery functions directly.
 * 
 * Benefits:
 * - Automatic: Add images to folder, system finds them instantly
 * - AI-Powered: GPT-4o-mini understands brand/logo relationships
 * - Zero maintenance: No code updates needed when adding images
 * - Smart matching: Semantic understanding + keyword fallback
 * 
 * Updated: 2026-01-04 (Automatic Discovery + Server-Side Safety)
 */

import { getGenericImageForArticle } from './generic-images';
import { findBrandMatches, selectBrandImage } from './brand-matcher';
import { filterSubjectImages, filterGenericImages } from './image-classifier';

// ============================================================================
// CONDITIONAL IMPORTS (Server-Side Only)
// ============================================================================
// Import 'fs' and 'path' only on server-side to prevent browser errors

// ============================================================================
// AUTOMATIC IMAGE DISCOVERY (SERVER-SIDE ONLY)
// ============================================================================

/**
 * Supported image file extensions
 */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];

/**
 * Cache for discovered images (prevents repeated file system reads)
 */
let imageLibraryCache: string[] | null = null;

/**
 * Automatically discover all images in /public/assets/images/all/
 * 
 * This function:
 * 1. Reads the file system for all files in the images directory
 * 2. Filters for valid image extensions
 * 3. Caches the result for performance
 * 4. Returns array of filenames (e.g., ['bitcoins-money-dollars.jpg', ...])
 * 
 * ⚠️  SERVER-SIDE ONLY - Uses Node.js 'fs' module
 * ⚠️  DO NOT call from client components!
 * 
 * @returns Array of image filenames
 */
function getAllLocalImages(): string[] {
  // Return cached list if available
  if (imageLibraryCache !== null) {
    return imageLibraryCache;
  }

  // CLIENT-SIDE SAFETY: Return empty array if called in browser
  if (typeof window !== 'undefined') {
    console.warn('⚠️  getAllLocalImages() called on client-side, returning empty array');
    return [];
  }

  try {
    // Dynamically require fs and path (server-side only)
    // This prevents bundling errors in client components
    const fs = require('fs');
    const path = require('path');
    
    // Build path to images directory
    const imagesDir = path.join(process.cwd(), 'public', 'assets', 'images', 'all');
    
    // Read directory contents
    const files = fs.readdirSync(imagesDir);
    
    // Filter for valid image files
    const imageFiles = files.filter((file: string) => {
      const ext = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });
    
    // Sort alphabetically for consistency
    imageFiles.sort();
    
    // Cache the result
    imageLibraryCache = imageFiles;
    
    console.log(`✅ Discovered ${imageFiles.length} images in /public/assets/images/all/`);
    
    return imageFiles;
  } catch (error) {
    console.error('❌ Error reading images directory:', error);
    console.warn('⚠️  Falling back to empty image library');
    return [];
  }
}

/**
 * Get the image library (auto-discovered or cached)
 * 
 * ⚠️  SERVER-SIDE ONLY
 * 
 * @returns Array of image filenames
 */
function getImageLibrary(): string[] {
  // Return empty array on client-side
  if (typeof window !== 'undefined') {
    return [];
  }
  return getAllLocalImages();
}

/**
 * Clear the image library cache (useful for testing or when images are added)
 * 
 * ⚠️  SERVER-SIDE ONLY
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
// STOP WORDS - Common words to ignore in matching
// ============================================================================

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

// ============================================================================
// HASH FUNCTION - For consistent image selection (persistence)
// ============================================================================

/**
 * Simple hash function to generate a consistent seed from article title
 * This ensures the same article always gets the same image
 * 
 * @param str - String to hash (article title)
 * @returns Number between 0 and 1
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

// ============================================================================
// KEYWORD EXTRACTION
// ============================================================================

/**
 * Extract meaningful keywords from a string
 * 
 * @param text - The text to extract keywords from
 * @returns Array of lowercase keywords
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation except dashes
    .split(/[\s-]+/) // Split on spaces and dashes
    .filter(word => word.length > 2 && !STOP_WORDS.has(word)); // Remove short words and stop words
}

// ============================================================================
// KEYWORD SCORING SYSTEM
// ============================================================================

/**
 * Calculate match score between article and image with visual diversity penalty
 * 
 * WEIGHTED SCORING RULES:
 * - +2.0 points if filename contains article's category name
 * - +1.5 points for each exact match between title keyword and filename keyword
 * - -5.0 points (PENALTY) if image is already in usedImagesSet (forces diversity)
 * - Bonus: +0.5 for multiple matches (>2 matches = stronger relevance)
 * 
 * @param titleKeywords - Keywords from article title
 * @param category - Article category (e.g., "Gen AI", "Breaking AI")
 * @param imageFilename - Image filename to score
 * @param usedImagesSet - Set of already-used image filenames (for visual diversity)
 * @returns Score (higher = better match)
 */
function scoreImageMatch(
  titleKeywords: string[],
  category: string,
  imageFilename: string,
  usedImagesSet: Set<string> = new Set()
): number {
  let score = 0;
  const imageKeywords = extractKeywords(imageFilename);
  const categoryKeywords = extractKeywords(category);
  
  // Category matching (+2.0 points per match)
  for (const catKeyword of categoryKeywords) {
    if (imageKeywords.includes(catKeyword)) {
      score += 2.0;
    }
  }
  
  // Title keyword matching (+1.5 points per match)
  let titleMatches = 0;
  for (const titleKeyword of titleKeywords) {
    if (imageKeywords.includes(titleKeyword)) {
      score += 1.5;
      titleMatches++;
    }
  }
  
  // Relevance bonus (multiple matches = stronger signal)
  if (titleMatches > 2) {
    score += 0.5 * titleMatches;
  }
  
  // VISUAL DIVERSITY PENALTY: Force system to pick different images for nearby articles
  if (usedImagesSet.has(imageFilename)) {
    score -= 5.0;
  }
  
  return score;
}

// ============================================================================
// MAIN IMAGE SELECTOR
// ============================================================================

/**
 * AI-POWERED SMART CURATOR with Multi-Tier Fallback System
 * 
 * ⚠️  SERVER-SIDE ONLY - Call from lib/rss.ts or server components
 * ⚠️  DO NOT import in client components (NewsCard, Hero, etc.)
 * 
 * TIER 1: GPT-4o-mini AI Curation (Semantic Understanding)
 * - Uses OpenAI to understand conceptual relationships
 * - "Agentic Metadata" → infrastructure images
 * - Cost: ~$0.01 per 1,000 articles
 * 
 * TIER 2: Weighted Keyword Matching (Fallback)
 * - +2.0 points if filename contains category name
 * - +1.5 points for each title keyword match
 * - -5.0 points (PENALTY) if image already used
 * 
 * TIER 3: Hash-Based Random (Final Fallback)
 * - Consistent selection based on title hash
 * - Ensures every article gets an image
 * 
 * BENEFITS:
 * - Intelligent Matching: AI understands context beyond keywords
 * - Visual Diversity: Nearby articles use different images
 * - Image Persistence: Same article = same image every time
 * - Reliability: Multiple fallback layers ensure 100% coverage
 * 
 * @param title - Article title (e.g., "Bitcoin Reaches New All-Time High")
 * @param category - Article category (e.g., "AI Economy")
 * @param usedImagesSet - Set of already-used image filenames (for visual diversity)
 * @param useAI - Whether to attempt AI curation (default: true, set false to skip)
 * @returns Local image path (e.g., "/assets/images/all/bitcoins-money-dollars.jpg")
 */
export async function getArticleImage(
  title: string, 
  category: string, 
  usedImagesSet: Set<string> = new Set(),
  useAI: boolean = true
): Promise<string> {
  // CLIENT-SIDE SAFETY: Return default placeholder if called in browser
  if (typeof window !== 'undefined') {
    console.warn('⚠️  getArticleImage() called on client-side, returning default placeholder');
    return getDefaultPlaceholder();
  }
  
  // Get automatically discovered image library
  const imageLibrary = getImageLibrary();
  
  // If no images found, return fallback immediately
  if (imageLibrary.length === 0) {
    console.error('❌ No images found in library!');
    return getDefaultPlaceholder();
  }
  
  // ============================================================================
  // TIER 1: AI-POWERED CURATION (GPT-4o-mini)
  // ============================================================================
  // Check if AI curation is enabled via environment variable
  // Defaults to true if not set (backward compatible)
  const aiCurationEnabled = process.env.ENABLE_AI_CURATION !== 'false';
  
  if (useAI && aiCurationEnabled && typeof window === 'undefined') { // Server-side only
    try {
      const { smartCurateImage } = await import('./openai');
      
      // Filter out already-used images from library for AI selection
      const availableImages = imageLibrary.filter(img => !usedImagesSet.has(img));
      
      // If all images used, reset to full library
      const imagesToConsider = availableImages.length > 0 ? availableImages : imageLibrary;
      
      const aiSelectedFilename = await smartCurateImage(title, category, imagesToConsider);
      
      if (aiSelectedFilename && aiSelectedFilename !== 'RANDOM') {
        // AI successfully selected an image!
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[AI Match] "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" -> ${aiSelectedFilename} (Confidence: High)`);
        }
        
        // Add to used set
        usedImagesSet.add(aiSelectedFilename);
        
        return `/assets/images/all/${aiSelectedFilename}`;
      }
    } catch (error) {
      // AI failed, fall through to keyword matching
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  AI curation failed, falling back to keyword matching:', error);
      }
    }
  } else if (!aiCurationEnabled && process.env.NODE_ENV !== 'production') {
    // Log when AI curation is explicitly disabled
    console.log(`[AI Curation DISABLED] "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" -> Using keyword matching fallback`);
  }
  
  // ============================================================================
  // TIER 1.5: BRAND-AWARE EXPLICIT MATCH (Zero-Cost, Deterministic)
  // ============================================================================
  // Brand images are used ONLY when brand name appears explicitly in title
  // No fuzzy matching, no inference, no OpenAI calls
  // Runs after GPT (if enabled) but before keyword matching
  const brandMatches = findBrandMatches(title, imageLibrary);
  
  if (brandMatches.length > 0) {
    // Filter out already-used brand images for visual diversity
    const availableBrandMatches = brandMatches.filter(img => !usedImagesSet.has(img));
    const matchesToConsider = availableBrandMatches.length > 0 ? availableBrandMatches : brandMatches;
    
    const selectedBrandImage = selectBrandImage(title, matchesToConsider, simpleHash);
    
    if (selectedBrandImage) {
      // Extract brand name for logging
      const brandName = selectedBrandImage.split(/[-_]/)[0];
      
      console.log(`[Brand Match] "${brandName}" → ${selectedBrandImage} (Title: "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}")`);
      
      usedImagesSet.add(selectedBrandImage);
      return `/assets/images/all/${selectedBrandImage}`;
    }
  }
  
  // ============================================================================
  // TIER 2: WEIGHTED KEYWORD MATCHING (Fallback)
  // ============================================================================
  
  // Filter to only subject images (exclude generic and category-prefixed images)
  const subjectImages = filterSubjectImages(imageLibrary);
  
  // Extract keywords from title (removes stop words automatically)
  const titleKeywords = extractKeywords(title);
  
  // If no keywords or no subject images, skip to Tier 3
  if (titleKeywords.length > 0 && subjectImages.length > 0) {
    // Score only subject images with visual diversity penalty
    const scoredImages = subjectImages.map(imageFilename => ({
      filename: imageFilename,
      score: scoreImageMatch(titleKeywords, category, imageFilename, usedImagesSet),
    }));
  
    // Sort by score (highest first)
    scoredImages.sort((a, b) => b.score - a.score);
    
    // Get best match
    const bestMatch = scoredImages[0];
    
    // PERSISTENCE: Use hash of title to pick from top matches consistently
    // This ensures the same article always gets the same image
    const titleHash = simpleHash(title);
    const topMatches = scoredImages.filter(img => img.score === bestMatch.score);
    const persistentIndex = Math.floor(titleHash * topMatches.length);
    const selectedImage = topMatches[persistentIndex] || bestMatch;
    
    // Keyword Match Console Logging (development only)
    if (process.env.NODE_ENV !== 'production') {
      const truncatedTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
      const confidence = selectedImage.score > 3 ? 'High' : selectedImage.score > 0 ? 'Medium' : 'Low';
      console.log(`[Keyword Match] "${truncatedTitle}" -> ${selectedImage.filename} (Score: ${selectedImage.score.toFixed(1)}, Confidence: ${confidence})`);
    }
    
    // Add to used set
    usedImagesSet.add(selectedImage.filename);
    
    // If best match has positive score, use it
    if (selectedImage.score > 0) {
      return `/assets/images/all/${selectedImage.filename}`;
    }
  }
  
  // ============================================================================
  // TIER 3: GENERIC IMAGE FALLBACK (Mandatory Owned Image - 100% COVERAGE GUARANTEE)
  // ============================================================================
  // 
  // DEFENSE-IN-DEPTH HOTFIX (Option C):
  // - Filters out brand-* filenames BEFORE selection
  // - Ensures brand images never leak via fallback
  // - Works without CSV metadata (filename-based only)
  // ============================================================================
  
  // No matches found - use ONLY images with *-generic-* prefix
  const genericImages = filterGenericImages(imageLibrary);
  
  if (genericImages.length === 0) {
    // Safety fallback: if no generic images exist, use hardcoded registry
    const genericImage = getGenericImageForArticle(title, category, simpleHash);
    console.warn('[Image Fallback Triggered]', title);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Generic Fallback] "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" -> ${genericImage} (Category: ${category}, Using registry)`);
    }
    
    usedImagesSet.add(genericImage);
    return `/assets/images/all/${genericImage}`;
  }
  
  // ============================================================================
  // DEFENSE-IN-DEPTH: Filter out brand-* filenames (CRITICAL SAFETY)
  // ============================================================================
  // Even if an image passes generic filter, block if filename starts with "brand-"
  // This prevents brand leakage even if image naming is inconsistent
  const brandSafeImages = genericImages.filter(
    img => !img.toLowerCase().startsWith("brand-")
  );
  
  if (brandSafeImages.length === 0) {
    console.error(
      `[Generic Fallback] No brand-safe images available — all generic images have brand- prefix (check image inventory)`
    );
    // Fall back to hardcoded registry as last resort
    const genericImage = getGenericImageForArticle(title, category, simpleHash);
    console.log(`[Generic Fallback] Using hardcoded registry fallback: ${genericImage}`);
    usedImagesSet.add(genericImage);
    return `/assets/images/all/${genericImage}`;
  }
  
  // Use hash-based selection from brand-safe generic images only
  const titleHash = simpleHash(title);
  const genericIndex = Math.floor(titleHash * brandSafeImages.length);
  const genericImage = brandSafeImages[genericIndex];
  
  // Log fallback trigger with brand-safe confirmation
  console.warn('[Image Fallback Triggered]', title);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Generic Fallback] "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" -> ${genericImage} (Category: ${category}, Brand-Safe)`);
  }
  
  // Production log for auditability
  console.log(`[Generic Fallback] Selected brand-safe image: ${genericImage} (from ${brandSafeImages.length} candidates)`);
  
  usedImagesSet.add(genericImage);
  
  return `/assets/images/all/${genericImage}`;
}

/**
 * SYNCHRONOUS VERSION - For server-side use without AI
 * 
 * ⚠️  SERVER-SIDE ONLY - Uses file system discovery
 * ⚠️  For client-side, components should receive pre-selected image paths
 * 
 * Uses only keyword matching and hash-based fallback.
 * AI curation is skipped because it requires async execution.
 * 
 * @param title - Article title
 * @param category - Article category
 * @param usedImagesSet - Set of already-used image filenames
 * @returns Local image path
 */
export function getArticleImageSync(
  title: string, 
  category: string, 
  usedImagesSet: Set<string> = new Set()
): string {
  // CLIENT-SIDE SAFETY: Return default placeholder if called in browser
  if (typeof window !== 'undefined') {
    console.warn('⚠️  getArticleImageSync() called on client-side, returning default placeholder');
    return getDefaultPlaceholder();
  }
  
  // Get automatically discovered image library
  const imageLibrary = getImageLibrary();
  
  // If no images found, return fallback
  if (imageLibrary.length === 0) {
    return getDefaultPlaceholder();
  }
  
  // Extract keywords from title (removes stop words automatically)
  const titleKeywords = extractKeywords(title);
  
  // If no keywords, use hash-based fallback
  if (titleKeywords.length === 0) {
    const titleHash = simpleHash(title);
    const fallbackIndex = Math.floor(titleHash * imageLibrary.length);
    const fallbackImage = imageLibrary[fallbackIndex];
    usedImagesSet.add(fallbackImage);
    return `/assets/images/all/${fallbackImage}`;
  }
  
  // Score all images with visual diversity penalty
  const scoredImages = imageLibrary.map(imageFilename => ({
    filename: imageFilename,
    score: scoreImageMatch(titleKeywords, category, imageFilename, usedImagesSet),
  }));
  
  // Sort by score (highest first)
  scoredImages.sort((a, b) => b.score - a.score);
  
  // Get best match
  const bestMatch = scoredImages[0];
  
  // PERSISTENCE: Use hash of title to pick from top matches consistently
  const titleHash = simpleHash(title);
  const topMatches = scoredImages.filter(img => img.score === bestMatch.score);
  const persistentIndex = Math.floor(titleHash * topMatches.length);
  const selectedImage = topMatches[persistentIndex] || bestMatch;
  
  // Add to used set
  usedImagesSet.add(selectedImage.filename);
  
  // If best match has positive score, use it
  if (selectedImage.score > 0) {
    return `/assets/images/all/${selectedImage.filename}`;
  }
  
  // No matches found - use hash to pick consistent fallback
  const fallbackIndex = Math.floor(titleHash * imageLibrary.length);
  const fallbackImage = imageLibrary[fallbackIndex];
  
  usedImagesSet.add(fallbackImage);
  
  return `/assets/images/all/${fallbackImage}`;
}

/**
 * Get article image with score (for debugging and logging purposes)
 * ASYNC version that supports AI curation
 * 
 * @param title - Article title
 * @param category - Article category
 * @param usedImagesSet - Set of already-used image filenames
 * @param useAI - Whether to attempt AI curation
 * @returns Object with path, score, filename, and method used
 */
export async function getArticleImageWithScore(
  title: string, 
  category: string,
  usedImagesSet: Set<string> = new Set(),
  useAI: boolean = true
): Promise<{ path: string; score: number; filename: string; method: 'ai' | 'keyword' | 'fallback' }> {
  // Get automatically discovered image library
  const imageLibrary = getImageLibrary();
  
  // If no images, return default placeholder
  if (imageLibrary.length === 0) {
    return { 
      path: getDefaultPlaceholder(), 
      score: 0, 
      filename: 'default-placeholder',
      method: 'fallback',
    };
  }
  
  // Try AI first if enabled and server-side
  const aiCurationEnabled = process.env.ENABLE_AI_CURATION !== 'false';
  
  if (useAI && aiCurationEnabled && typeof window === 'undefined') {
    try {
      const { smartCurateImage } = await import('./openai');
      
      const availableImages = imageLibrary.filter(img => !usedImagesSet.has(img));
      const imagesToConsider = availableImages.length > 0 ? availableImages : imageLibrary;
      
      const aiSelectedFilename = await smartCurateImage(title, category, imagesToConsider);
      
      if (aiSelectedFilename && aiSelectedFilename !== 'RANDOM') {
        usedImagesSet.add(aiSelectedFilename);
        return {
          path: `/assets/images/all/${aiSelectedFilename}`,
          score: 10.0, // AI selections get perfect score
          filename: aiSelectedFilename,
          method: 'ai',
        };
      }
    } catch (error) {
      // Fall through to keyword matching
    }
  }
  
  // Keyword matching fallback
  const titleKeywords = extractKeywords(title);
  
  if (titleKeywords.length === 0) {
    // Use hash-based fallback for consistency
    const titleHash = simpleHash(title);
    const fallbackIndex = Math.floor(titleHash * imageLibrary.length);
    const fallbackImage = imageLibrary[fallbackIndex];
    usedImagesSet.add(fallbackImage);
    return { 
      path: `/assets/images/all/${fallbackImage}`, 
      score: 0, 
      filename: fallbackImage,
      method: 'fallback',
    };
  }
  
  const scoredImages = imageLibrary.map(imageFilename => ({
    filename: imageFilename,
    score: scoreImageMatch(titleKeywords, category, imageFilename, usedImagesSet),
  }));
  
  scoredImages.sort((a, b) => b.score - a.score);
  const bestMatch = scoredImages[0];
  
  // Use hash for persistence
  const titleHash = simpleHash(title);
  const topMatches = scoredImages.filter(img => img.score === bestMatch.score);
  const persistentIndex = Math.floor(titleHash * topMatches.length);
  const selectedImage = topMatches[persistentIndex] || bestMatch;
  
  usedImagesSet.add(selectedImage.filename);
  
  if (selectedImage.score > 0) {
    return {
      path: `/assets/images/all/${selectedImage.filename}`,
      score: selectedImage.score,
      filename: selectedImage.filename,
      method: 'keyword',
    };
  }
  
  // Consistent fallback using hash
  const fallbackIndex = Math.floor(titleHash * imageLibrary.length);
  const fallbackImage = imageLibrary[fallbackIndex];
  
  usedImagesSet.add(fallbackImage);
  
  return {
    path: `/assets/images/all/${fallbackImage}`,
    score: 0,
    filename: fallbackImage,
    method: 'fallback',
  };
}

/**
 * SYNCHRONOUS version for client-side use
 * 
 * @param title - Article title
 * @param category - Article category
 * @param usedImagesSet - Set of already-used image filenames
 * @returns Object with path, score, and filename
 */
export function getArticleImageWithScoreSync(
  title: string, 
  category: string,
  usedImagesSet: Set<string> = new Set()
): { path: string; score: number; filename: string; method: 'keyword' | 'fallback' } {
  const imageLibrary = getImageLibrary();
  const titleKeywords = extractKeywords(title);
  
  if (imageLibrary.length === 0 || titleKeywords.length === 0) {
    // Use hash-based fallback if we have images but no keywords
    if (imageLibrary.length > 0 && titleKeywords.length === 0) {
      const titleHash = simpleHash(title);
      const fallbackIndex = Math.floor(titleHash * imageLibrary.length);
      const fallbackImage = imageLibrary[fallbackIndex];
      usedImagesSet.add(fallbackImage);
      return { 
        path: `/assets/images/all/${fallbackImage}`, 
        score: 0, 
        filename: fallbackImage,
        method: 'fallback',
      };
    }
    
    return { 
      path: getDefaultPlaceholder(), 
      score: 0, 
      filename: 'default-placeholder',
      method: 'fallback',
    };
  }
  
  const scoredImages = imageLibrary.map(imageFilename => ({
    filename: imageFilename,
    score: scoreImageMatch(titleKeywords, category, imageFilename, usedImagesSet),
  }));
  
  scoredImages.sort((a, b) => b.score - a.score);
  const bestMatch = scoredImages[0];
  
  const titleHash = simpleHash(title);
  const topMatches = scoredImages.filter(img => img.score === bestMatch.score);
  const persistentIndex = Math.floor(titleHash * topMatches.length);
  const selectedImage = topMatches[persistentIndex] || bestMatch;
  
  usedImagesSet.add(selectedImage.filename);
  
  if (selectedImage.score > 0) {
    return {
      path: `/assets/images/all/${selectedImage.filename}`,
      score: selectedImage.score,
      filename: selectedImage.filename,
      method: 'keyword',
    };
  }
  
  const fallbackIndex = Math.floor(titleHash * imageLibrary.length);
  const fallbackImage = imageLibrary[fallbackIndex];
  
  usedImagesSet.add(fallbackImage);
  
  return {
    path: `/assets/images/all/${fallbackImage}`,
    score: 0,
    filename: fallbackImage,
    method: 'fallback',
  };
}

// ============================================================================
// FALLBACK IMAGE
// ============================================================================

/**
 * Get the default placeholder image
 * 
 * Used when:
 * - Image library is empty
 * - Title has no keywords
 * - As a last-resort fallback
 * 
 * @returns Path to default placeholder
 */
export function getDefaultPlaceholder(): string {
  return '/assets/images/defaults/placeholder.jpg.svg';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get image library stats (for debugging/admin)
 * 
 * @returns Object with library statistics
 */
export function getImageLibraryStats(): {
  totalImages: number;
  categories: Record<string, number>;
  keywords: string[];
} {
  const imageLibrary = getImageLibrary();
  
  // Count images per category hint
  const categories: Record<string, number> = {
    ai: 0,
    economy: 0,
    creative: 0,
    code: 0,
    research: 0,
    tech: 0,
  };
  
  const allKeywords = new Set<string>();
  
  imageLibrary.forEach(filename => {
    const keywords = extractKeywords(filename);
    keywords.forEach(kw => allKeywords.add(kw));
    
    if (filename.includes('ai') || filename.includes('robot')) categories.ai++;
    if (filename.includes('economy') || filename.includes('business')) categories.economy++;
    if (filename.includes('creative') || filename.includes('design')) categories.creative++;
    if (filename.includes('code') || filename.includes('programming')) categories.code++;
    if (filename.includes('research') || filename.includes('science')) categories.research++;
    if (filename.includes('tech') || filename.includes('digital')) categories.tech++;
  });
  
  return {
    totalImages: imageLibrary.length,
    categories,
    keywords: Array.from(allKeywords).sort(),
  };
}

/**
 * Check if an image path is local (not external)
 * 
 * @param imagePath - Image path to check
 * @returns true if local, false if external
 */
export function isLocalImage(imagePath: string): boolean {
  return imagePath.startsWith('/assets/') || imagePath.startsWith('/public/');
}

/**
 * Preview what image would be selected for a given title/category
 * (Useful for testing before building)
 * ASYNC version to support AI curation
 * 
 * @param title - Article title
 * @param category - Article category
 * @param useAI - Whether to use AI curation (default: false for preview)
 * @returns Object with selected image and score breakdown
 */
export async function previewImageSelection(
  title: string, 
  category: string,
  useAI: boolean = false
): Promise<{
  selectedImage: string;
  titleKeywords: string[];
  topMatches: Array<{ filename: string; score: number }>;
}> {
  const imageLibrary = getImageLibrary();
  const titleKeywords = extractKeywords(title);
  
  const scoredImages = imageLibrary.map(imageFilename => ({
    filename: imageFilename,
    score: scoreImageMatch(titleKeywords, category, imageFilename),
  })).sort((a, b) => b.score - a.score);
  
  return {
    selectedImage: await getArticleImage(title, category, new Set(), useAI),
    titleKeywords,
    topMatches: scoredImages.slice(0, 5),
  };
}

/**
 * SYNCHRONOUS preview for client-side use
 * 
 * @param title - Article title
 * @param category - Article category
 * @returns Object with selected image and score breakdown
 */
export function previewImageSelectionSync(title: string, category: string): {
  selectedImage: string;
  titleKeywords: string[];
  topMatches: Array<{ filename: string; score: number }>;
} {
  const imageLibrary = getImageLibrary();
  const titleKeywords = extractKeywords(title);
  
  const scoredImages = imageLibrary.map(imageFilename => ({
    filename: imageFilename,
    score: scoreImageMatch(titleKeywords, category, imageFilename),
  })).sort((a, b) => b.score - a.score);
  
  return {
    selectedImage: getArticleImageSync(title, category),
    titleKeywords,
    topMatches: scoredImages.slice(0, 5),
  };
}

// ============================================================================
// USAGE INSTRUCTIONS & EXAMPLES
// ============================================================================

/*
HOW TO ADD NEW IMAGES (AUTOMATIC DISCOVERY):

1. **Save Image to /public/assets/images/all/**
   Use descriptive, keyword-rich filenames:
   - ai-chatbot-conversation-assistant.jpg
   - blockchain-crypto-finance-economy.jpg
   - design-ux-ui-creative-interface.jpg
   
   ❗ IMPORTANT: No spaces in filenames!
   ✅ Good: microsoft-logo.jpg
   ❌ Bad: Microsoft Logo.jpg

2. **That's it!** The system automatically discovers new images!
   No code changes needed. Just add files to the folder.

3. **Test & Deploy**
   npm run dev    # Test locally (images auto-discovered)
   npm run build  # Verify build
   deploy         # Push to production

The system uses fs.readdirSync to automatically find all images!

---

NAMING BEST PRACTICES:

✅ GOOD:
- ai-robot-automation-manufacturing.jpg
- startup-funding-venture-capital.jpg
- python-machine-learning-tutorial.jpg

❌ BAD:
- IMG_1234.jpg (no keywords)
- photo.jpg (not descriptive)
- my-image-file.jpg (generic keywords)

---

WHY THIS IS BETTER THAN CATEGORY FOLDERS:

OLD SYSTEM:
- Robot image in /breaking-ai/ → only used for Breaking AI articles
- Need to duplicate same image across multiple category folders
- Limited to 4-5 images per category

NEW SYSTEM:
- Robot image in /all/ → can match ANY article about robots
- One image, infinite uses
- 30+ images available for every article

---

EXAMPLE MATCHES:

Title: "OpenAI Releases GPT-5 Model"
Keywords: [openai, releases, gpt, model]
Best Match: ai-robot-future-technology.jpg
Score: 3.0 (matches "ai")

Title: "Stock Market Rallies on AI News"
Keywords: [stock, market, rallies, news]
Best Match: stock-market-trading-economy.jpg
Score: 4.0 (matches "stock", "market", "economy")

Title: "New Python Library for Machine Learning"
Keywords: [python, library, machine, learning]
Best Match: machine-learning-data-science.jpg
Score: 4.5 (matches "machine", "learning" + bonus)

---

MAINTENANCE:

- Add 5-10 new images per week
- Use descriptive filenames with multiple keywords
- Aim for 100-200 images total
- More images = better matching = more variety
*/
