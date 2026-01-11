/**
 * R2-BACKED CACHE FOR NEWS ARTICLES (SERVERLESS-SAFE, PERSISTENT)
 * 
 * ⚠️  CRITICAL: Vercel serverless functions lose in-memory state on cold starts.
 * 
 * Solution: Persist articles to Cloudflare R2 as articles/index.json
 * - Articles survive serverless cold starts
 * - Frontend fetches directly from R2 CDN
 * - No local state dependencies
 * - Instant availability after ingestion
 * 
 * This is production-safe and solves the "empty pages after redeploy" issue.
 */

import { NewsItem } from '@/components/NewsCard';

// Module-level in-memory cache (backup only, not source of truth)
let cachedNewsData: NewsItem[] = [];
let cacheTimestamp: number = 0;

/**
 * Write articles to in-memory cache (backup)
 * Note: Articles are also persisted to R2 by /api/ingest
 */
export function setCachedNewsData(data: NewsItem[]): void {
  cachedNewsData = data;
  cacheTimestamp = Date.now();
  console.log(`✅ Cached ${data.length} articles in memory (backup)`);
}

/**
 * Fetch articles from Cloudflare R2 (PERSISTENT SOURCE OF TRUTH)
 * 
 * This function fetches from R2 CDN, not in-memory cache.
 * Articles persist across serverless cold starts.
 */
export async function getCachedNewsData(): Promise<NewsItem[]> {
  const cdnUrl = process.env.NEXT_PUBLIC_R2_CDN_URL;
  
  if (!cdnUrl) {
    console.error('❌ NEXT_PUBLIC_R2_CDN_URL not set - cannot fetch articles');
    return [];
  }
  
  const articlesUrl = `${cdnUrl}/articles/index.json`;
  
  try {
    console.log(`🔍 Fetching articles from R2: ${articlesUrl}`);
    
    const response = await fetch(articlesUrl, {
      cache: 'no-store',  // Always fetch fresh data
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('⚠️  Articles not found in R2 (404) - ingestion may not have run yet');
        return [];
      }
      throw new Error(`R2 fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const articles: NewsItem[] = await response.json();
    console.log(`✅ Fetched ${articles.length} articles from R2`);
    
    // Update in-memory cache as backup
    cachedNewsData = articles;
    cacheTimestamp = Date.now();
    
    return articles;
  } catch (error) {
    console.error('❌ Failed to fetch articles from R2:', error);
    
    // Fallback to in-memory cache if R2 fetch fails
    if (cachedNewsData.length > 0) {
      console.log(`⚠️  Using stale in-memory cache (${cachedNewsData.length} articles)`);
      return cachedNewsData;
    }
    
    return [];
  }
}

/**
 * Clear cache (for manual cleanup or testing)
 */
export function clearCachedNewsData(): void {
  cachedNewsData = [];
  cacheTimestamp = 0;
  console.log('✅ Cache cleared');
}

