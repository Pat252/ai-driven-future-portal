/**
 * IN-MEMORY CACHE FOR NEWS ARTICLES (SERVERLESS-SAFE)
 * 
 * ⚠️  CRITICAL: Vercel serverless functions cannot write to filesystem.
 * 
 * Solution: Use module-level in-memory cache.
 * - Cache persists for the lifetime of the serverless function instance
 * - Cache is lost on cold starts (expected and acceptable)
 * - TTL: 24 hours (resets daily with new ingestion)
 * 
 * This is production-safe for Vercel deployment.
 */

import { NewsItem } from '@/components/NewsCard';

// Module-level in-memory cache
let cachedNewsData: NewsItem[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Write articles to in-memory cache
 * Called by: POST /api/ingest after successful ingestion
 */
export function setCachedNewsData(data: NewsItem[]): void {
  cachedNewsData = data;
  cacheTimestamp = Date.now();
  console.log(`✅ Cached ${data.length} articles in memory`);
}

/**
 * Read articles from in-memory cache
 * Called by: Homepage and category pages during rendering
 */
export function getCachedNewsData(): NewsItem[] {
  // Check if cache is expired
  const isExpired = Date.now() - cacheTimestamp > CACHE_TTL;
  
  if (isExpired && cachedNewsData.length > 0) {
    console.log('⚠️  Cache expired (>24h old)');
    // Keep expired data visible rather than showing empty
    // Fresh data will come from next cron run
  }
  
  if (cachedNewsData.length === 0) {
    console.log('⚠️  Cache is empty (cold start or no ingestion yet)');
  } else {
    console.log(`✅ Read ${cachedNewsData.length} articles from memory cache`);
  }
  
  return cachedNewsData;
}

/**
 * Clear cache (for manual cleanup or testing)
 */
export function clearCachedNewsData(): void {
  cachedNewsData = [];
  cacheTimestamp = 0;
  console.log('✅ Cache cleared');
}

