/**
 * Persistent Image Cache for GPT-4o-mini Image Selections
 * 
 * This module provides persistent storage for article-to-image mappings,
 * ensuring GPT-4o-mini is called at most once per article, even across
 * server restarts, ISR revalidation, and serverless cold starts.
 * 
 * Cache Format:
 * - Key: Normalized article title (lowercase, trimmed)
 * - Value: Selected image filename (e.g., "bitcoins-money-dollars.jpg")
 * 
 * Storage: JSON file at /.cache/image-cache.json
 * 
 * Last Updated: 2026-01-04
 */

import fs from 'fs/promises';
import path from 'path';

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
let cache: Map<string, string> | null = null;
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
 * @returns Map of normalized titles to image filenames
 */
async function loadCache(): Promise<Map<string, string>> {
  // Client-side safety
  if (typeof window !== 'undefined') {
    return new Map();
  }

  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const entries = JSON.parse(data);
    
    // Validate structure
    if (!Array.isArray(entries) || !entries.every(([k, v]) => typeof k === 'string' && typeof v === 'string')) {
      console.warn('⚠️  Invalid cache file format, starting with empty cache');
      return new Map();
    }
    
    const cacheMap = new Map<string, string>(entries);
    console.log(`✅ Loaded ${cacheMap.size} cached image selections from disk`);
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
      // Ensure cache directory exists
      await fs.mkdir(CACHE_DIR, { recursive: true });
      
      // Convert Map to array of [key, value] pairs for JSON serialization
      const entries = Array.from(cache.entries());
      
      // Write to temporary file first, then rename (atomic write)
      const tempFile = `${CACHE_FILE}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(entries, null, 2), 'utf-8');
      await fs.rename(tempFile, CACHE_FILE);
    } catch (error: any) {
      console.error('❌ Error saving cache to disk:', error.message);
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
 * Get cached image filename for an article title
 * 
 * @param title - Article title (will be normalized)
 * @returns Cached image filename or null if not found
 */
export async function getCachedImage(title: string): Promise<string | null> {
  await ensureInitialized();
  
  if (!cache) {
    return null;
  }

  const key = normalizeCacheKey(title);
  return cache.get(key) || null;
}

/**
 * Set cached image filename for an article title
 * 
 * @param title - Article title (will be normalized)
 * @param filename - Image filename (e.g., "bitcoins-money-dollars.jpg")
 */
export async function setCachedImage(title: string, filename: string): Promise<void> {
  await ensureInitialized();
  
  if (!cache) {
    cache = new Map();
  }

  const key = normalizeCacheKey(title);
  cache.set(key, filename);
  
  // Save to disk asynchronously (non-blocking)
  // Don't await to avoid blocking the request
  saveCache().catch(error => {
    console.error('❌ Background cache save failed:', error);
  });
}

/**
 * Check if a title exists in cache
 * 
 * @param title - Article title (will be normalized)
 * @returns True if cached, false otherwise
 */
export async function hasCachedImage(title: string): Promise<boolean> {
  await ensureInitialized();
  
  if (!cache) {
    return false;
  }

  const key = normalizeCacheKey(title);
  return cache.has(key);
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
  sampleEntries: Array<[string, string]>;
}> {
  await ensureInitialized();
  
  if (!cache) {
    return { size: 0, sampleEntries: [] };
  }

  const entries = Array.from(cache.entries());
  return {
    size: cache.size,
    sampleEntries: entries.slice(0, 10), // First 10 entries as sample
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

