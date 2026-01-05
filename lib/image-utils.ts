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
 * - Brand Safety: Defense-in-depth filtering for all tiers
 * - Deterministic: ImageDecision contract for testability
 * 
 * Updated: 2026-01-05 (Cleanup & Defense-in-Depth)
 */

import { getGenericImageForArticle } from './generic-images';
import { findBrandMatches, selectBrandImage } from './brand-matcher';
import { filterSubjectImages, filterGenericImages } from './image-classifier';

// ============================================================================
// IMAGE DECISION CONTRACT (Centralized)
// ============================================================================

export type ImageTier = "GPT" | "BRAND" | "KEYWORD" | "GENERIC" | "HARD_FALLBACK";

export type ImageDecision = {
  image: string;             // final public path (e.g., /assets/images/all/xxx.jpg)
  filename: string;          // raw filename (xxx.jpg)
  tier: ImageTier;
  reason: string;
  policyVersion: number;     // bump when rules change
};

/**
 * Current image selection policy version
 * Bump this number when:
 * - Brand safety rules change
 * - Filtering logic changes
 * - Any algorithmic changes to selection
 * This invalidates old cache entries automatically
 */
export const IMAGE_POLICY_VERSION = 1;

// ============================================================================
// PER-REQUEST CONTEXT (Avoid Duplicates on Same Page)
// ============================================================================

export type ImageSelectionContext = {
  usedFilenames: Set<string>;
};

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
// HELPER FUNCTIONS (Pure, Deterministic)
// ============================================================================

/**
 * Normalize filename from path or name
 * @param pathOrName - Either a full path or just a filename
 * @returns Just the filename (e.g., "image.jpg")
 */
export function normalizeFilename(pathOrName: string): string {
  return pathOrName.split('/').pop() || pathOrName;
}

/**
 * Check if filename indicates a brand image
 * @param filename - Image filename
 * @returns true if filename starts with "brand-"
 */
export function isBrandByFilename(filename: string): boolean {
  return normalizeFilename(filename).toLowerCase().startsWith('brand-');
}

/**
 * Check if filename is safe for generic articles
 * @param filename - Image filename
 * @returns true if NOT a brand image
 */
export function isGenericSafeFilename(filename: string): boolean {
  return !isBrandByFilename(filename);
}

/**
 * Add public path prefix to filename
 * @param filename - Image filename
 * @returns Full public path
 */
export function withPublicPath(filename: string): string {
  return `/assets/images/all/${normalizeFilename(filename)}`;
}

// ============================================================================
// BRAND CLASSIFICATION (Simple, Deterministic)
// ============================================================================

/**
 * Known brand keywords for simple classification
 * Used to detect brand articles vs generic articles
 */
const BRAND_KEYWORDS = [
  'openai', 'gpt', 'chatgpt',
  'google', 'gemini', 'deepmind',
  'meta', 'facebook', 'instagram', 'whatsapp',
  'apple', 'siri', 'iphone',
  'microsoft', 'copilot', 'azure', 'bing',
  'nvidia', 'cuda',
  'amazon', 'aws', 'alexa',
  'anthropic', 'claude',
  'tesla', 'spacex',
  'samsung', 'galaxy',
  'intel', 'amd',
  'ibm', 'watson',
  'oracle', 'salesforce',
  'adobe', 'photoshop',
  'netflix', 'spotify',
  'uber', 'lyft',
  'airbnb', 'booking',
];

/**
 * Determine if an article is likely about a specific brand
 * @param title - Article title
 * @param description - Article description
 * @returns true if article mentions brand keywords
 */
export function isLikelyBrandArticle(title: string, description: string = ''): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return BRAND_KEYWORDS.some(keyword => text.includes(keyword));
}

// ============================================================================
// FINALIZE DECISION (Brand Safety + Deduplication)
// ============================================================================

/**
 * Finalize image decision with brand safety (SIMPLIFIED FOR STABILITY)
 * 
 * This function:
 * 1. Ensures generic articles don't get brand images (CRITICAL)
 * 2. Marks filename as used in context (for stats only)
 * 3. Returns final decision
 * 
 * ACCEPTS DUPLICATES: Better to show same image twice than crash.
 * 
 * @param decision - Initial decision from tier
 * @param library - Full image library
 * @param ctx - Per-request context
 * @param isGeneric - Whether article is generic (not brand-specific)
 * @param title - Article title (for deterministic selection)
 * @returns Finalized decision
 */
function finalizeDecision(
  decision: ImageDecision,
  library: string[],
  ctx: ImageSelectionContext,
  isGeneric: boolean,
  title: string
): ImageDecision {
  let finalFilename = decision.filename;
  let finalReason = decision.reason;
  
  // CRITICAL RULE: Generic articles MUST NOT use brand images
  if (isGeneric && isBrandByFilename(finalFilename)) {
    // Find alternative generic-safe images (accept duplicates)
    const anySafeImages = library.filter(img => isGenericSafeFilename(img));
    
    if (anySafeImages.length > 0) {
      // Deterministic selection using title hash
      const titleHash = simpleHash(title);
      const index = Math.floor(titleHash * anySafeImages.length);
      finalFilename = anySafeImages[index];
      finalReason = `${decision.reason} → Replaced brand image with generic-safe`;
    } else {
      // ABSOLUTE FALLBACK: Use placeholder if no generic-safe images
      console.error('[CRITICAL] No generic-safe images available, using placeholder');
      return {
        image: getDefaultPlaceholder(),
        filename: 'placeholder.jpg.svg',
        tier: 'HARD_FALLBACK',
        reason: 'No generic-safe images available',
        policyVersion: IMAGE_POLICY_VERSION,
      };
    }
  }
  
  // Mark as used (for stats tracking only, doesn't affect selection)
  ctx.usedFilenames.add(finalFilename);
  
  // ALWAYS return a valid decision (never null/undefined)
  return {
    ...decision,
    filename: finalFilename,
    image: withPublicPath(finalFilename),
    reason: finalReason,
  };
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
// MAIN IMAGE SELECTOR (Returns ImageDecision)
// ============================================================================

/**
 * AI-POWERED SMART CURATOR with Multi-Tier Fallback System
 * 
 * ⚠️  SERVER-SIDE ONLY - Call from lib/rss.ts or server components
 * ⚠️  DO NOT import in client components (NewsCard, Hero, etc.)
 * 
 * TIER 1: GPT-4o-mini AI Curation (Semantic Understanding)
 * TIER 1.5: Brand Matching (Explicit brand name in title)
 * TIER 2: Weighted Keyword Matching (Fallback)
 * TIER 3: Generic Image Fallback (Brand-Safe)
 * HARD_FALLBACK: Hardcoded Registry
 * 
 * @param title - Article title
 * @param description - Article description (for brand detection)
 * @param imageLibrary - Array of available image filenames
 * @param opts - Optional context for deduplication
 * @returns ImageDecision with path, filename, tier, reason
 */
export async function getArticleImage(
  title: string, 
  description: string,
  imageLibrary: string[],
  opts?: { context?: ImageSelectionContext }
): Promise<ImageDecision> {
  // Setup context
  const ctx = opts?.context ?? { usedFilenames: new Set() };
  
  // CLIENT-SIDE SAFETY: Return default placeholder if called in browser
  if (typeof window !== 'undefined') {
    console.warn('⚠️  getArticleImage() called on client-side, returning default placeholder');
    ctx.usedFilenames.add('placeholder.jpg.svg');
    const decision: ImageDecision = {
      image: getDefaultPlaceholder(),
      filename: 'placeholder.jpg.svg',
      tier: 'HARD_FALLBACK',
      reason: 'Client-side call safety fallback',
      policyVersion: IMAGE_POLICY_VERSION,
    };
    return decision;
  }
  
  // If no images found, return fallback immediately (ABSOLUTE GUARANTEE)
  if (imageLibrary.length === 0) {
    console.error('❌ No images found in library!');
    ctx.usedFilenames.add('placeholder.jpg.svg');
    const decision: ImageDecision = {
      image: getDefaultPlaceholder(),
      filename: 'placeholder.jpg.svg',
      tier: 'HARD_FALLBACK',
      reason: 'Empty image library',
      policyVersion: IMAGE_POLICY_VERSION,
    };
    return decision;
  }
  
  // Classify article
  const isGeneric = !isLikelyBrandArticle(title, description);
  
  // ============================================================================
  // TIER 1: AI-POWERED CURATION (GPT-4o-mini)
  // ============================================================================
  const aiCurationEnabled = process.env.ENABLE_AI_CURATION !== 'false';
  
  if (aiCurationEnabled && typeof window === 'undefined') {
    try {
      const { smartCurateImage } = await import('./openai');
      
      // BRAND SAFETY: Filter library for GPT if article is generic
      let libraryForGPT = imageLibrary;
      if (isGeneric) {
        libraryForGPT = imageLibrary.filter(img => isGenericSafeFilename(img));
        if (libraryForGPT.length === 0) {
          libraryForGPT = imageLibrary; // Fallback to full library if no generic images
        }
      }
      
      // Filter out already-used images
      const availableImages = libraryForGPT.filter(img => !ctx.usedFilenames.has(img));
      const imagesToConsider = availableImages.length > 0 ? availableImages : libraryForGPT;
      
      const aiSelectedFilename = await smartCurateImage(title, '', imagesToConsider);
      
      if (aiSelectedFilename && aiSelectedFilename !== 'RANDOM') {
        const decision: ImageDecision = {
          image: withPublicPath(aiSelectedFilename),
          filename: normalizeFilename(aiSelectedFilename),
          tier: 'GPT',
          reason: `GPT-4o-mini semantic selection${isGeneric ? ' (generic-safe library)' : ''}`,
          policyVersion: IMAGE_POLICY_VERSION,
        };
        
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[AI Match] "${title.substring(0, 50)}..." -> ${aiSelectedFilename}`);
        }
        
        return finalizeDecision(decision, imageLibrary, ctx, isGeneric, title);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  AI curation failed, falling back:', error);
      }
    }
  }
  
  // ============================================================================
  // TIER 1.5: BRAND-AWARE EXPLICIT MATCH (Zero-Cost, Deterministic)
  // ============================================================================
  if (!isGeneric) {
    // Only try brand matching for brand articles
    const brandMatches = findBrandMatches(title, imageLibrary);
    
    if (brandMatches.length > 0) {
      const availableBrandMatches = brandMatches.filter(img => !ctx.usedFilenames.has(img));
      const matchesToConsider = availableBrandMatches.length > 0 ? availableBrandMatches : brandMatches;
      
      const selectedBrandImage = selectBrandImage(title, matchesToConsider, simpleHash);
      
      if (selectedBrandImage) {
        const brandName = selectedBrandImage.split(/[-_]/)[1] || 'brand';
        
        const decision: ImageDecision = {
          image: withPublicPath(selectedBrandImage),
          filename: normalizeFilename(selectedBrandImage),
          tier: 'BRAND',
          reason: `Explicit brand match for "${brandName}"`,
          policyVersion: IMAGE_POLICY_VERSION,
        };
        
        console.log(`[Brand Match] "${brandName}" → ${selectedBrandImage}`);
        
        return finalizeDecision(decision, imageLibrary, ctx, isGeneric, title);
      }
    }
  }
  
  // ============================================================================
  // TIER 2: WEIGHTED KEYWORD MATCHING (Fallback)
  // ============================================================================
  
  // BRAND SAFETY: Filter subject images for generic articles
  let subjectImages = filterSubjectImages(imageLibrary);
  if (isGeneric) {
    subjectImages = subjectImages.filter(img => isGenericSafeFilename(img));
  }
  
  const titleKeywords = extractKeywords(title);
  
  if (titleKeywords.length > 0 && subjectImages.length > 0) {
    const scoredImages = subjectImages.map(imageFilename => ({
      filename: imageFilename,
      score: scoreImageMatch(titleKeywords, '', imageFilename, ctx.usedFilenames),
    }));
  
    scoredImages.sort((a, b) => b.score - a.score);
    const bestMatch = scoredImages[0];
    
    // PERSISTENCE: Use hash of title to pick from top matches consistently
    const titleHash = simpleHash(title);
    const topMatches = scoredImages.filter(img => img.score === bestMatch.score);
    const persistentIndex = Math.floor(titleHash * topMatches.length);
    const selectedImage = topMatches[persistentIndex] || bestMatch;
    
    if (selectedImage.score > 0) {
      const decision: ImageDecision = {
        image: withPublicPath(selectedImage.filename),
        filename: normalizeFilename(selectedImage.filename),
        tier: 'KEYWORD',
        reason: `Keyword match (score: ${selectedImage.score.toFixed(1)})${isGeneric ? ' [generic-safe]' : ''}`,
        policyVersion: IMAGE_POLICY_VERSION,
      };
      
      if (process.env.NODE_ENV !== 'production') {
        const confidence = selectedImage.score > 3 ? 'High' : selectedImage.score > 0 ? 'Medium' : 'Low';
        console.log(`[Keyword Match] "${title.substring(0, 50)}..." -> ${selectedImage.filename} (Score: ${selectedImage.score.toFixed(1)}, Confidence: ${confidence})`);
      }
      
      return finalizeDecision(decision, imageLibrary, ctx, isGeneric, title);
    }
  }
  
  // ============================================================================
  // TIER 3: GENERIC IMAGE FALLBACK (Brand-Safe)
  // ============================================================================
  
  const genericImages = filterGenericImages(imageLibrary);
  const brandSafeImages = genericImages.filter(img => isGenericSafeFilename(img));
  
  if (brandSafeImages.length === 0) {
    // Use hardcoded registry as ABSOLUTE FALLBACK
    const genericImage = getGenericImageForArticle(title, '', simpleHash);
    ctx.usedFilenames.add(normalizeFilename(genericImage));
    const decision: ImageDecision = {
      image: withPublicPath(genericImage),
      filename: normalizeFilename(genericImage),
      tier: 'HARD_FALLBACK',
      reason: 'Hardcoded registry fallback (no brand-safe generic images)',
      policyVersion: IMAGE_POLICY_VERSION,
    };
    
    console.warn(`[Generic Fallback] Using hardcoded registry: ${genericImage}`);
    
    // Don't call finalizeDecision for hard fallback (already safe)
    return decision;
  }
  
  // Deterministic selection from brand-safe pool
  const titleHash = simpleHash(title);
  const genericIndex = Math.floor(titleHash * brandSafeImages.length);
  const genericImage = brandSafeImages[genericIndex];
  
  const decision: ImageDecision = {
    image: withPublicPath(genericImage),
    filename: normalizeFilename(genericImage),
    tier: 'GENERIC',
    reason: `Generic fallback (brand-safe, ${brandSafeImages.length} candidates)`,
    policyVersion: IMAGE_POLICY_VERSION,
  };
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Generic Fallback] "${title.substring(0, 50)}..." -> ${genericImage}`);
  }
  
  console.log(`[Generic Fallback] Selected brand-safe image: ${genericImage} (from ${brandSafeImages.length} candidates)`);
  
  return finalizeDecision(decision, imageLibrary, ctx, isGeneric, title);
}

/**
 * SYNCHRONOUS VERSION - For server-side use without AI
 * 
 * ⚠️  SERVER-SIDE ONLY - Uses file system discovery
 * ⚠️  For client-side, components should receive pre-selected image paths
 * 
 * @param title - Article title
 * @param description - Article description
 * @param imageLibrary - Array of available image filenames
 * @param opts - Optional context for deduplication
 * @returns ImageDecision
 */
export function getArticleImageSync(
  title: string, 
  description: string,
  imageLibrary: string[],
  opts?: { context?: ImageSelectionContext }
): ImageDecision {
  const ctx = opts?.context ?? { usedFilenames: new Set() };
  
  // CLIENT-SIDE SAFETY: Return default placeholder if called in browser
  if (typeof window !== 'undefined') {
    console.warn('⚠️  getArticleImageSync() called on client-side, returning default placeholder');
    ctx.usedFilenames.add('placeholder.jpg.svg');
    return {
      image: getDefaultPlaceholder(),
      filename: 'placeholder.jpg.svg',
      tier: 'HARD_FALLBACK',
      reason: 'Client-side call safety fallback',
      policyVersion: IMAGE_POLICY_VERSION,
    };
  }
  
  // If no images found, return fallback (ABSOLUTE GUARANTEE)
  if (imageLibrary.length === 0) {
    ctx.usedFilenames.add('placeholder.jpg.svg');
    return {
      image: getDefaultPlaceholder(),
      filename: 'placeholder.jpg.svg',
      tier: 'HARD_FALLBACK',
      reason: 'Empty image library',
      policyVersion: IMAGE_POLICY_VERSION,
    };
  }
  
  // Classify article
  const isGeneric = !isLikelyBrandArticle(title, description);
  
  // Extract keywords from title
  const titleKeywords = extractKeywords(title);
  
  // If no keywords, use generic fallback
  if (titleKeywords.length === 0) {
    const genericImages = filterGenericImages(imageLibrary);
    const brandSafeImages = genericImages.filter(img => isGenericSafeFilename(img));
    
    if (brandSafeImages.length > 0) {
      const titleHash = simpleHash(title);
      const index = Math.floor(titleHash * brandSafeImages.length);
      const fallbackImage = brandSafeImages[index];
      
      const decision: ImageDecision = {
        image: withPublicPath(fallbackImage),
        filename: normalizeFilename(fallbackImage),
        tier: 'GENERIC',
        reason: 'No keywords - generic fallback',
        policyVersion: IMAGE_POLICY_VERSION,
      };
      
      return finalizeDecision(decision, imageLibrary, ctx, isGeneric, title);
    }
  }
  
  // BRAND SAFETY: Filter library for generic articles
  let libraryToUse = imageLibrary;
  if (isGeneric) {
    libraryToUse = imageLibrary.filter(img => isGenericSafeFilename(img));
    if (libraryToUse.length === 0) {
      libraryToUse = imageLibrary; // Fallback
    }
  }
  
  // Score all images with visual diversity penalty
  const scoredImages = libraryToUse.map(imageFilename => ({
    filename: imageFilename,
    score: scoreImageMatch(titleKeywords, '', imageFilename, ctx.usedFilenames),
  }));
  
  scoredImages.sort((a, b) => b.score - a.score);
  const bestMatch = scoredImages[0];
  
  // PERSISTENCE: Use hash of title to pick from top matches consistently
  const titleHash = simpleHash(title);
  const topMatches = scoredImages.filter(img => img.score === bestMatch.score);
  const persistentIndex = Math.floor(titleHash * topMatches.length);
  const selectedImage = topMatches[persistentIndex] || bestMatch;
  
  // If best match has positive score, use it
  if (selectedImage.score > 0) {
    const decision: ImageDecision = {
      image: withPublicPath(selectedImage.filename),
      filename: normalizeFilename(selectedImage.filename),
      tier: 'KEYWORD',
      reason: `Keyword match (score: ${selectedImage.score.toFixed(1)})${isGeneric ? ' [generic-safe]' : ''}`,
      policyVersion: IMAGE_POLICY_VERSION,
    };
    
    return finalizeDecision(decision, imageLibrary, ctx, isGeneric, title);
  }
  
  // Generic fallback with brand safety
  const genericImages = filterGenericImages(imageLibrary);
  const brandSafeImages = genericImages.filter(img => isGenericSafeFilename(img));
  
  if (brandSafeImages.length > 0) {
    const fallbackIndex = Math.floor(titleHash * brandSafeImages.length);
    const fallbackImage = brandSafeImages[fallbackIndex];
    
    const decision: ImageDecision = {
      image: withPublicPath(fallbackImage),
      filename: normalizeFilename(fallbackImage),
      tier: 'GENERIC',
      reason: `Generic fallback (brand-safe, ${brandSafeImages.length} candidates)`,
      policyVersion: IMAGE_POLICY_VERSION,
    };
    
    return finalizeDecision(decision, imageLibrary, ctx, isGeneric, title);
  }
  
  // ABSOLUTE HARD FALLBACK (ALWAYS WORKS)
  const hardFallback = getGenericImageForArticle(title, '', simpleHash);
  ctx.usedFilenames.add(normalizeFilename(hardFallback));
  const decision: ImageDecision = {
    image: withPublicPath(hardFallback),
    filename: normalizeFilename(hardFallback),
    tier: 'HARD_FALLBACK',
    reason: 'Hardcoded registry fallback',
    policyVersion: IMAGE_POLICY_VERSION,
  };
  
  // Don't call finalizeDecision for hard fallback (already safe)
  return decision;
}

// ============================================================================
// LEGACY COMPATIBILITY WRAPPERS
// ============================================================================

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use getArticleImage() directly which returns ImageDecision
 */
export async function getArticleImageWithScore(
  title: string, 
  category: string,
  usedImagesSet: Set<string> = new Set(),
  useAI: boolean = true
): Promise<{ path: string; score: number; filename: string; method: 'ai' | 'keyword' | 'fallback' }> {
  const imageLibrary = getImageLibrary();
  const decision = await getArticleImage(title, category, imageLibrary, { context: { usedFilenames: usedImagesSet } });
  
  return {
    path: decision.image,
    score: decision.tier === 'GPT' ? 10.0 : decision.tier === 'BRAND' ? 8.0 : decision.tier === 'KEYWORD' ? 5.0 : 0,
    filename: decision.filename,
    method: decision.tier === 'GPT' ? 'ai' : decision.tier === 'KEYWORD' || decision.tier === 'BRAND' ? 'keyword' : 'fallback',
  };
}

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use getArticleImageSync() directly which returns ImageDecision
 */
export function getArticleImageWithScoreSync(
  title: string, 
  category: string,
  usedImagesSet: Set<string> = new Set()
): { path: string; score: number; filename: string; method: 'keyword' | 'fallback' } {
  const imageLibrary = getImageLibrary();
  const decision = getArticleImageSync(title, category, imageLibrary, { context: { usedFilenames: usedImagesSet } });
  
  return {
    path: decision.image,
    score: decision.tier === 'KEYWORD' ? 5.0 : 0,
    filename: decision.filename,
    method: decision.tier === 'KEYWORD' || decision.tier === 'BRAND' ? 'keyword' : 'fallback',
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
 * Preview what image would be selected for a given title
 * (Useful for testing before building)
 * ASYNC version to support AI curation
 * 
 * @param title - Article title
 * @param description - Article description
 * @param useAI - Whether to use AI curation (default: false for preview)
 * @returns Object with selected image decision
 */
export async function previewImageSelection(
  title: string, 
  description: string = '',
  useAI: boolean = false
): Promise<{
  decision: ImageDecision;
  titleKeywords: string[];
  topMatches: Array<{ filename: string; score: number }>;
}> {
  const imageLibrary = getImageLibrary();
  const titleKeywords = extractKeywords(title);
  
  const scoredImages = imageLibrary.map(imageFilename => ({
    filename: imageFilename,
    score: scoreImageMatch(titleKeywords, '', imageFilename),
  })).sort((a, b) => b.score - a.score);
  
  const decision = await getArticleImage(title, description, imageLibrary, { context: { usedFilenames: new Set() } });
  
  return {
    decision,
    titleKeywords,
    topMatches: scoredImages.slice(0, 5),
  };
}

/**
 * SYNCHRONOUS preview for client-side use
 * 
 * @param title - Article title
 * @param description - Article description
 * @returns Object with selected image decision
 */
export function previewImageSelectionSync(title: string, description: string = ''): {
  decision: ImageDecision;
  titleKeywords: string[];
  topMatches: Array<{ filename: string; score: number }>;
} {
  const imageLibrary = getImageLibrary();
  const titleKeywords = extractKeywords(title);
  
  const scoredImages = imageLibrary.map(imageFilename => ({
    filename: imageFilename,
    score: scoreImageMatch(titleKeywords, '', imageFilename),
  })).sort((a, b) => b.score - a.score);
  
  const decision = getArticleImageSync(title, description, imageLibrary, { context: { usedFilenames: new Set() } });
  
  return {
    decision,
    titleKeywords,
    topMatches: scoredImages.slice(0, 5),
  };
}
