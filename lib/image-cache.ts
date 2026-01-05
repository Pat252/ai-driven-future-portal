/**
 * Persistent Image Cache for Image Selection Decisions
 * 
 * This module provides persistent storage for article-to-ImageDecision mappings,
 * ensuring smart image selection logic is called at most once per article, even across
 * server restarts, ISR revalidation, and serverless cold starts.
 * 
 * Cache Format:
 * - Key: Normalized article title (lowercase, trimmed)
 * - Value: ImageDecision object (contains image path, filename, tier, reason, policyVersion)
 * 
 * Storage: JSON file at /.cache/image-cache.json
 * 
 * Policy Version Validation:
 * - Cache entries with old policyVersion are treated as cache misses
 * - Brand Safety Validation: Cached brand images for generic articles are invalidated
 * 
 * Last Updated: 2026-01-05
 */

import fs from 'fs/promises';
import path from 'path';
import { ImageDecision, IMAGE_POLICY_VERSION, isBrandByFilename } from './image-utils';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'image-cache.json');

// ============================================================================
// CACHE STATE
// ============================================================================

/**
 * In-memory cache (loaded from disk on initialization)
 * This provides fast lookups while maintaining persistence
 */
let cache: Map<string, ImageDecision> | null = null;
let isInitialized = false;
let savePromise: Promise<void> | null = null;

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Normalize article title for cache key
 * 
 * @param title - Article title
 * @returns Normalized cache key
 */
export function normalizeCacheKey(title: string): string {
  return title.toLowerCase().trim();
}

/**
 * Load cache from disk (called once on initialization)
 * 
 * @returns Map of normalized titles to ImageDecision objects
 */
async function loadCache(): Promise<Map<string, ImageDecision>> {
  // Client-side safety
  if (typeof window !== 'undefined') {
    return new Map();
  }

  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const entries = JSON.parse(data);
    
    // Validate structure - expect array of [key, ImageDecision]
    if (!Array.isArray(entries)) {
      console.warn('⚠️  Invalid cache file format (not array), starting with empty cache');
      return new Map();
    }
    
    // Validate each entry
    const validEntries: Array<[string, ImageDecision]> = [];
    let invalidCount = 0;
    
    for (const entry of entries) {
      if (!Array.isArray(entry) || entry.length !== 2) {
        invalidCount++;
        continue;
      }
      
      const [key, value] = entry;
      
      // Validate key is string
      if (typeof key !== 'string') {
        invalidCount++;
        continue;
      }
      
      // Validate value has required ImageDecision fields
      if (
        typeof value === 'object' &&
        value !== null &&
        typeof value.image === 'string' &&
        typeof value.filename === 'string' &&
        typeof value.tier === 'string' &&
        typeof value.reason === 'string' &&
        typeof value.policyVersion === 'number'
      ) {
        validEntries.push([key, value as ImageDecision]);
      } else {
        invalidCount++;
      }
    }
    
    if (invalidCount > 0) {
      console.warn(`⚠️  Skipped ${invalidCount} invalid cache entries`);
    }
    
    const cacheMap = new Map<string, ImageDecision>(validEntries);
    console.log(`✅ Loaded ${cacheMap.size} cached image decisions from disk`);
    return cacheMap;
  } catch (error: any) {
    // File doesn't exist yet (first run) or read error
    if (error.code === 'ENOENT') {
      console.log('📝 No existing cache file found, starting fresh');
      return new Map();
    }
    
    console.warn('⚠️  Error loading cache file, starting with empty cache:', error.message);
    return new Map();
  }
}

/**
 * Save cache to disk (async, non-blocking)
 * Uses a promise queue to prevent concurrent writes
 * Ensures directory exists before writing
 */
async function saveCache(): Promise<void> {
  // Client-side safety
  if (typeof window !== 'undefined') {
    return;
  }

  if (!cache) {
    return;
  }

  // Queue saves to prevent concurrent writes
  if (savePromise) {
    await savePromise;
  }

  savePromise = (async () => {
    try {
      // Ensure cache directory exists (CRITICAL: prevents ENOENT on Vercel)
      await fs.mkdir(CACHE_DIR, { recursive: true });
      
      // Convert Map to array of [key, value] pairs for JSON serialization
      const entries = Array.from(cache.entries());
      
      // Write to temporary file first, then rename (atomic write)
      const tempFile = `${CACHE_FILE}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(entries, null, 2), 'utf-8');
      await fs.rename(tempFile, CACHE_FILE);
    } catch (error: any) {
      // Swallow error with single warning (no spam)
      console.warn('⚠️  Cache save failed (non-critical):', error.message);
      // Don't throw - cache operations should be resilient
    } finally {
      savePromise = null;
    }
  })();

  await savePromise;
}

/**
 * Initialize cache (load from disk)
 * Safe to call multiple times (idempotent)
 */
async function ensureInitialized(): Promise<void> {
  if (isInitialized && cache !== null) {
    return;
  }

  cache = await loadCache();
  isInitialized = true;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get cached image decision for an article title
 * 
 * Validates:
 * - Policy version matches current version
 * - Brand safety (generic articles shouldn't get brand images)
 * 
 * @param title - Article title (will be normalized)
 * @param isGeneric - Whether article is generic (not brand-specific)
 * @returns Cached ImageDecision or null if not found/invalid
 */
export async function getCachedImage(title: string, isGeneric: boolean = true): Promise<ImageDecision | null> {
  await ensureInitialized();
  
  if (!cache) {
    return null;
  }

  const key = normalizeCacheKey(title);
  const cached = cache.get(key);
  
  if (!cached) {
    return null; // Cache miss
  }
  
  // VALIDATION 1: Policy version check
  if (cached.policyVersion !== IMAGE_POLICY_VERSION) {
    console.log(`[Cache] Policy version mismatch for "${title.substring(0, 30)}..." (cached: ${cached.policyVersion}, current: ${IMAGE_POLICY_VERSION}) - treating as miss`);
    return null; // Invalidate old policy
  }
  
  // VALIDATION 2: Brand safety check
  if (isGeneric && isBrandByFilename(cached.filename)) {
    console.log(`[Cache] Brand safety violation for generic article "${title.substring(0, 30)}..." (cached brand image: ${cached.filename}) - treating as miss`);
    return null; // Invalidate unsafe cache entry
  }
  
  return cached; // Valid cache hit
}

/**
 * Set cached image decision for an article title
 * 
 * @param title - Article title (will be normalized)
 * @param decision - ImageDecision object to cache
 */
export async function setCachedImage(title: string, decision: ImageDecision): Promise<void> {
  await ensureInitialized();
  
  if (!cache) {
    cache = new Map();
  }

  const key = normalizeCacheKey(title);
  cache.set(key, decision);
  
  // Save to disk asynchronously (non-blocking)
  // Don't await to avoid blocking the request
  saveCache().catch(error => {
    console.warn('⚠️  Background cache save failed:', error.message);
  });
}

/**
 * Check if a title exists in cache (with validation)
 * 
 * @param title - Article title (will be normalized)
 * @param isGeneric - Whether article is generic (for brand safety validation)
 * @returns True if cached and valid, false otherwise
 */
export async function hasCachedImage(title: string, isGeneric: boolean = true): Promise<boolean> {
  const cached = await getCachedImage(title, isGeneric);
  return cached !== null;
}

/**
 * Clear the entire cache (useful for testing or manual reset)
 * 
 * @returns Promise that resolves when cache is cleared
 */
export async function clearCache(): Promise<void> {
  await ensureInitialized();
  
  cache = new Map();
  await saveCache();
  console.log('🗑️  Image cache cleared');
}

/**
 * Get cache statistics (for debugging/monitoring)
 * 
 * @returns Object with cache size and sample entries
 */
export async function getCacheStats(): Promise<{
  size: number;
  sampleEntries: Array<[string, ImageDecision]>;
  policyVersion: number;
  brandImageCount: number;
  genericImageCount: number;
}> {
  await ensureInitialized();
  
  if (!cache) {
    return { 
      size: 0, 
      sampleEntries: [],
      policyVersion: IMAGE_POLICY_VERSION,
      brandImageCount: 0,
      genericImageCount: 0,
    };
  }

  const entries = Array.from(cache.entries());
  
  // Count brand vs generic images
  let brandImageCount = 0;
  let genericImageCount = 0;
  
  entries.forEach(([_, decision]) => {
    if (isBrandByFilename(decision.filename)) {
      brandImageCount++;
    } else {
      genericImageCount++;
    }
  });
  
  return {
    size: cache.size,
    sampleEntries: entries.slice(0, 10), // First 10 entries as sample
    policyVersion: IMAGE_POLICY_VERSION,
    brandImageCount,
    genericImageCount,
  };
}

// ============================================================================
// INITIALIZATION ON MODULE LOAD (Server-Side Only)
// ============================================================================

// Pre-initialize cache on server-side module load (non-blocking)
if (typeof window === 'undefined') {
  ensureInitialized().catch(error => {
    console.error('❌ Failed to initialize image cache:', error);
  });
}
