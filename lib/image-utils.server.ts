/**
 * IMAGE UTILITIES - SERVER-SIDE ONLY
 * 
 * This file uses Node.js APIs (fs, path) and must NEVER be imported
 * by client components.
 * 
 * Last Updated: 2026-01-10 (Runtime R2 listing)
 */

import { resolveArticleImage, getResolverConfigFromEnv } from './image-resolver';
import { R2_ALLOWED_ROOTS, R2_FORBIDDEN_ROOTS } from './image-constants';
import { listAllR2Objects } from './r2-client';
import { selectBestImageForArticle, selectTopImageCandidates } from './image-selector-ai.server';

// ============================================================================
// TYPES (Re-exported from barrel)
// ============================================================================

export type ImageDecision = {
  image: string;             // final public path or CDN URL
  filename: string;          // raw filename (xxx.jpg)
  score: number;             // selection score
  reason: string;
  policyVersion: number;
};

export type ImageSelectionContext = {
  usedFilenames: Set<string>;
};

export const IMAGE_POLICY_VERSION = 2;

// ============================================================================
// IMAGE DISCOVERY (SERVER-SIDE ONLY - Uses Node.js fs)
// ============================================================================

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
let imageLibraryCache: string[] | null = null;
let r2ImagesByFolder: Map<string, string[]> | null = null;

// Image selection cache - prevents recomputation during rendering
const imageSelectionCache = new Map<string, { imageKey: string; imageUrl: string; timestamp: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Runtime guard - track if we're in ingestion or rendering phase
let isIngestionPhase = false;

/**
 * Recursively scan directory for images
 * Returns array of paths relative to baseDir
 * 
 * Example: "companies/nvidia/brand-nvidia-logo.jpg"
 */
function scanDirectoryRecursive(
  baseDir: string,
  currentDir: string,
  fs: any,
  path: any,
  relativePath: string = ''
): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      // Recursively scan subdirectory
      const subResults = scanDirectoryRecursive(baseDir, fullPath, fs, path, relPath);
      results.push(...subResults);
    } else if (entry.isFile()) {
      // Check if it's an image file
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        // Store full relative path (e.g., "companies/nvidia/logo.jpg")
        results.push(relPath);
      }
    }
  }
  
  return results;
}

/**
 * List all images from Cloudflare R2 bucket at runtime
 */
async function listR2Images(): Promise<string[]> {
  const bucketName = process.env.R2_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error(
      'CRITICAL: R2_BUCKET_NAME environment variable not set.\n' +
      'Required for runtime R2 object listing.'
    );
  }
  
  console.log(`🔍 Listing objects from R2 bucket: ${bucketName}...`);
  
  // List all objects from R2
  const allKeys = await listAllR2Objects(bucketName);
  
  // Filter for image files only
  const imageKeys = allKeys.filter(key => {
    const ext = key.substring(key.lastIndexOf('.')).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
  });
  
  // Filter by allowed/forbidden folders
  const validImages = imageKeys.filter(key => {
    // Reject forbidden folders
    const isForbidden = R2_FORBIDDEN_ROOTS.some(root => key.startsWith(root));
    if (isForbidden) return false;
    
    // Keep only allowed folders
    const isAllowed = R2_ALLOWED_ROOTS.some(root => key.startsWith(root));
    return isAllowed;
  });
  
  // Build folder index for smart selection
  const folderMap = new Map<string, string[]>();
  
  for (const key of validImages) {
    const firstSlash = key.indexOf('/');
    if (firstSlash > 0) {
      const folder = key.substring(0, firstSlash + 1); // e.g., "companies/"
      if (!folderMap.has(folder)) {
        folderMap.set(folder, []);
      }
      folderMap.get(folder)!.push(key);
    }
  }
  
  r2ImagesByFolder = folderMap;
  
  // Validation: must have at least one image
  if (validImages.length === 0) {
    throw new Error(
      `CRITICAL: No valid images found in R2 bucket "${bucketName}".\n` +
      `Total objects: ${allKeys.length}\n` +
      `Image files: ${imageKeys.length}\n` +
      `After filtering: 0\n` +
      `Check your R2 bucket contents and folder structure.`
    );
  }
  
  // Validation: must have fallback images in generic/ or ai/
  const fallbackImages = validImages.filter(k => k.startsWith('generic/') || k.startsWith('ai/'));
  if (fallbackImages.length === 0) {
    throw new Error(
      `CRITICAL: No fallback images in generic/ or ai/ folders.\n` +
      `At least one image must exist in these folders for guaranteed image selection.\n` +
      `Found folders: ${Array.from(folderMap.keys()).join(', ')}`
    );
  }
  
  // Log summary
  console.log(`✅ Loaded ${validImages.length} valid images from R2`);
  console.log(`   📁 Folders: ${Array.from(folderMap.keys()).join(', ')}`);
  console.log(`   🔄 Fallback pool (generic/ + ai/): ${fallbackImages.length} images`);
  
  // Log folder breakdown
  for (const [folder, images] of folderMap.entries()) {
    console.log(`   📂 ${folder}: ${images.length} images`);
  }
  
  // Sample paths
  if (process.env.NODE_ENV !== 'production') {
    console.log(`   📋 Sample paths:`, validImages.slice(0, 5));
  }
  
  return validImages;
}

/**
 * Get image library based on IMAGE_SOURCE mode
 * 
 * - R2 mode: Lists R2 objects at runtime (no static manifest)
 * - Local mode: Scans /public/assets/images/all/ recursively
 */
async function getAllImages(): Promise<string[]> {
  // Return cached list if available
  if (imageLibraryCache !== null) {
    return imageLibraryCache;
  }

  // CLIENT-SIDE SAFETY: Should never happen
  if (typeof window !== 'undefined') {
    throw new Error('getAllImages() called on client-side - this should never happen');
  }

  const source = (process.env.NEXT_PUBLIC_IMAGE_SOURCE as 'local' | 'r2') || 'local';
  
  // R2 MODE: List objects from R2 bucket at runtime
  if (source === 'r2') {
    imageLibraryCache = await listR2Images();
    return imageLibraryCache;
  }
  
  // LOCAL MODE: Scan filesystem
  try {
    const fs = require('fs');
    const path = require('path');
    
    const imagesDir = path.join(process.cwd(), 'public', 'assets', 'images', 'all');
    
    // Recursively scan all subdirectories
    const imageFiles = scanDirectoryRecursive(imagesDir, imagesDir, fs, path);
    
    imageFiles.sort();
    imageLibraryCache = imageFiles;
    
    console.log(`✅ Discovered ${imageFiles.length} images in /public/assets/images/all/`);
    
    if (imageFiles.length === 0) {
      throw new Error('CRITICAL: No images found in local filesystem');
    }
    
    if (process.env.NODE_ENV !== 'production') {
      const samples = imageFiles.slice(0, 3);
      console.log(`   Sample paths:`, samples);
    }
    
    return imageFiles;
  } catch (error) {
    console.error('❌ CRITICAL ERROR: Failed to read images directory:', error);
    throw error;
  }
}

/**
 * Get the image library (runtime R2 listing or local filesystem)
 * SERVER-SIDE ONLY
 */
export async function getImageLibrary(): Promise<string[]> {
  if (typeof window !== 'undefined') {
    throw new Error('getImageLibrary() called on client-side');
  }
  return await getAllImages();
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
  r2ImagesByFolder = null;
  console.log('🔄 Image library cache cleared');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple hash function for deterministic selection
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
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
    .replace(/[^\w\s-]/g, '')
    .split(/[\s-]+/)
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
// IMAGE SCORING
// ============================================================================

/**
 * Score an image for relevance to an article
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
  for (const keyword of titleKeywords) {
    if (imageKeywords.includes(keyword)) {
      score += 2;
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
 * SERVER-SIDE ONLY
 */
/**
 * Enable ingestion phase - allows AI image selection
 * MUST be called before RSS ingestion
 */
export function enableIngestionPhase(): void {
  isIngestionPhase = true;
}

/**
 * Disable ingestion phase - prevents AI calls during rendering
 * MUST be called after RSS ingestion completes
 */
export function disableIngestionPhase(): void {
  isIngestionPhase = false;
}

/**
 * Get cached image for article (used during rendering)
 */
export function getCachedImage(articleId: string): { imageKey: string; imageUrl: string } | null {
  const cached = imageSelectionCache.get(articleId);
  
  if (cached) {
    // Check if cache is still valid
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return { imageKey: cached.imageKey, imageUrl: cached.imageUrl };
    }
    // Cache expired
    imageSelectionCache.delete(articleId);
  }
  
  return null;
}

/**
 * Get single best image for an article (ENFORCED: only unused images)
 * Returns ONE image URL selected by AI from filtered (unused) image pool
 */
export async function getArticleImageSingle(
  title: string,
  description: string,
  category: string,
  imageLibrary: string[],  // ← Already filtered to exclude used images
  articleId?: string
): Promise<string> {
  // RUNTIME GUARD: Prevent AI calls during rendering
  if (!isIngestionPhase) {
    throw new Error(
      'CRITICAL: AI image selection cannot run during rendering.\n' +
      'Image selection must happen during RSS ingestion only.'
    );
  }
  
  if (imageLibrary.length === 0) {
    throw new Error('CRITICAL: Image library is empty - cannot select image');
  }
  
  const config = getResolverConfigFromEnv();
  
  // Use AI to select ONE best image (from unused images only)
  try {
    const selection = await selectBestImageForArticle({
      title,
      description,
      category,
      imageKeys: imageLibrary,  // ← Already filtered
    });
    
    // Convert key to full URL
    const imageUrl = resolveArticleImage(selection.imageKey, config);
    
    return imageUrl;
  } catch (error) {
    console.error(`❌ Failed to select image for "${title.substring(0, 40)}...":`, error);
    
    // Fallback: use first unused image (deterministic)
    const fallbackKey = imageLibrary[0];
    return resolveArticleImage(fallbackKey, config);
  }
}

export async function getArticleImage(
  title: string,
  description: string,
  category: string,
  imageLibrary: string[],
  context: ImageSelectionContext,
  articleId?: string // guid or unique identifier
): Promise<ImageDecision> {
  // RUNTIME GUARD: Prevent AI calls during rendering
  if (!isIngestionPhase) {
    throw new Error(
      'CRITICAL: AI image selection cannot run during rendering.\n' +
      'Image selection must happen during RSS ingestion only.\n' +
      'Use enableIngestionPhase() before ingestion and getCachedImage() for rendering.'
    );
  }
  
  if (imageLibrary.length === 0) {
    throw new Error('CRITICAL: Image library is empty - cannot select image');
  }
  
  // Check cache first - avoid recomputation even during ingestion
  if (articleId) {
    const cached = getCachedImage(articleId);
    if (cached) {
      console.log(`[Cache Hit] "${title.substring(0, 40)}..." → ${cached.imageKey}`);
      
      return {
        image: cached.imageUrl,
        filename: cached.imageKey,
        score: 10.0,
        reason: 'Cached from previous ingestion',
        policyVersion: IMAGE_POLICY_VERSION,
      };
    }
  }
  
  const config = getResolverConfigFromEnv();
  
  // Use AI to select the best image
  try {
    const aiSelection = await selectBestImageForArticle({
      title,
      description,
      category,
      imageKeys: imageLibrary,
    });
    
    // Verify selected image exists in library
    if (!imageLibrary.includes(aiSelection.imageKey)) {
      throw new Error(`AI selected invalid image: ${aiSelection.imageKey}`);
    }
    
    // Check if already used - if so, try to find an unused alternative
    let selectedKey = aiSelection.imageKey;
    if (context.usedFilenames.has(selectedKey)) {
      // Try to find similar unused image
      const folder = selectedKey.substring(0, selectedKey.lastIndexOf('/') + 1);
      const folderImages = imageLibrary.filter(key => 
        key.startsWith(folder) && !context.usedFilenames.has(key)
      );
      
      if (folderImages.length > 0) {
        // Use first unused image from same folder
        selectedKey = folderImages[0];
      }
      // Otherwise keep the AI-selected image even if used
    }
    
    // Register as used
    context.usedFilenames.add(selectedKey);
    
    const imageUrl = resolveArticleImage(selectedKey, config);
    
    // Cache the selection for future renders
    if (articleId) {
      imageSelectionCache.set(articleId, {
        imageKey: selectedKey,
        imageUrl: imageUrl,
        timestamp: Date.now(),
      });
    }
    
    const decision: ImageDecision = {
      image: imageUrl,
      filename: selectedKey,
      score: 10.0, // AI selection is considered optimal
      reason: `AI: ${aiSelection.reason}`,
      policyVersion: IMAGE_POLICY_VERSION,
    };
    
    // Logging (ingestion only)
    console.log(`[AI Ingestion] "${title.substring(0, 40)}..." → ${selectedKey}`);
    console.log(`               Reason: ${aiSelection.reason}`);
    
    return decision;
  } catch (error) {
    // Fallback to deterministic selection if AI fails
    console.error('❌ AI image selection failed, using fallback:', error);
    
    // Filter out company images unless article mentions a company
    const articleText = `${title.toLowerCase()} ${description.toLowerCase()}`;
    const mentionsCompany = BRAND_NAMES.some(brand => articleText.includes(brand));
    
    let fallbackPool = mentionsCompany 
      ? imageLibrary // If mentions company, can use any image
      : imageLibrary.filter(key => !key.startsWith('companies/')); // Otherwise avoid company logos
    
    // Prefer unused images
    const unusedImages = fallbackPool.filter(key => !context.usedFilenames.has(key));
    if (unusedImages.length > 0) {
      fallbackPool = unusedImages;
    }
    
    // Deterministic selection
    const titleHash = simpleHash(title);
    const selectedIndex = Math.floor(titleHash * fallbackPool.length);
    const selectedKey = fallbackPool[selectedIndex];
    
    // Register as used
    context.usedFilenames.add(selectedKey);
    
    const imageUrl = resolveArticleImage(selectedKey, config);
    
    // Cache the fallback selection
    if (articleId) {
      imageSelectionCache.set(articleId, {
        imageKey: selectedKey,
        imageUrl: imageUrl,
        timestamp: Date.now(),
      });
    }
    
    const decision: ImageDecision = {
      image: imageUrl,
      filename: selectedKey,
      score: 0.0,
      reason: `Fallback: AI failed - ${error instanceof Error ? error.message : 'unknown error'}`,
      policyVersion: IMAGE_POLICY_VERSION,
    };
    
    console.log(`[Fallback Ingestion] "${title.substring(0, 40)}..." → ${selectedKey}`);
    
    return decision;
  }
}

/**
 * Get image library stats (for debugging)
 */
export async function getImageLibraryStats(): Promise<{
  totalImages: number;
  sampleFilenames: string[];
}> {
  const imageLibrary = await getImageLibrary();
  
  return {
    totalImages: imageLibrary.length,
    sampleFilenames: imageLibrary.slice(0, 10),
  };
}

