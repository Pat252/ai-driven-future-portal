/**
 * VERCEL KV CACHE FOR NEWS ARTICLES (SERVERLESS-SAFE, PERSISTENT)
 * 
 * ⚠️  CRITICAL: Vercel serverless functions lose in-memory state on cold starts.
 * 
 * Solution: Persist articles to Vercel KV
 * - Articles survive serverless cold starts ✅
 * - Shared across all function instances ✅
 * - No filesystem dependencies ✅
 * - No R2 misuse (R2 is for images only) ✅
 * 
 * This is production-safe and solves the "empty pages after redeploy" issue.
 */

import { kv } from '@vercel/kv';
import { NewsItem } from '@/components/NewsCard';

const KV_KEY = 'articles:latest';

/**
 * Store articles in Vercel KV (PERSISTENT SOURCE OF TRUTH)
 * Called by: POST /api/ingest after successful ingestion
 */
export async function setCachedNewsData(data: NewsItem[]): Promise<void> {
  try {
    await kv.set(KV_KEY, data);
    console.log(`✅ Stored ${data.length} articles in Vercel KV`);
  } catch (error) {
    console.error('❌ Failed to store articles in KV:', error);
    throw new Error(`KV storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch articles from Vercel KV (PERSISTENT SOURCE OF TRUTH)
 * 
 * Articles persist across serverless cold starts.
 * Called by: Homepage and category pages during rendering
 */
export async function getCachedNewsData(): Promise<NewsItem[]> {
  try {
    console.log(`🔍 Fetching articles from Vercel KV (key: ${KV_KEY})`);
    
    const articles = await kv.get<NewsItem[]>(KV_KEY);
    
    if (!articles || !Array.isArray(articles)) {
      console.log('⚠️  No articles found in KV - ingestion may not have run yet');
      return [];
    }
    
    console.log(`✅ Fetched ${articles.length} articles from Vercel KV`);
    return articles;
  } catch (error) {
    console.error('❌ Failed to fetch articles from KV:', error);
    return [];
  }
}

/**
 * Clear cache (for manual cleanup or testing)
 */
export async function clearCachedNewsData(): Promise<void> {
  try {
    await kv.del(KV_KEY);
    console.log('✅ Cache cleared from Vercel KV');
  } catch (error) {
    console.error('❌ Failed to clear KV cache:', error);
  }
}

