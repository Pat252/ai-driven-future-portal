/**
 * FILE-BASED CACHE FOR NEWS ARTICLES
 * 
 * ⚠️  CRITICAL: This replaces in-memory cache to fix Next.js 16 context isolation.
 * 
 * Problem: API routes and Server Components run in separate execution contexts.
 * Module-level variables are NOT shared between them.
 * 
 * Solution: File system is shared across all contexts.
 * API route writes → .cache/news-data.json
 * Server Components read → .cache/news-data.json
 * 
 * This ensures articles persist from ingestion to rendering.
 */

import fs from 'fs';
import path from 'path';
import { NewsItem } from '@/components/NewsCard';

const CACHE_FILE = path.join(process.cwd(), '.cache', 'news-data.json');

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  const cacheDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

/**
 * Write articles to file system cache
 * Called by: POST /api/ingest after successful ingestion
 */
export function setCachedNewsData(data: NewsItem[]): void {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Cached ${data.length} articles to file system`);
  } catch (error) {
    console.error('❌ Failed to write cache:', error);
    throw error;
  }
}

/**
 * Read articles from file system cache
 * Called by: Homepage and category pages during rendering
 */
export function getCachedNewsData(): NewsItem[] {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      console.log('⚠️  Cache file does not exist');
      return [];
    }
    
    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    const articles = JSON.parse(data) as NewsItem[];
    
    console.log(`✅ Read ${articles.length} articles from cache file`);
    return articles;
  } catch (error) {
    console.error('❌ Failed to read cache:', error);
    return [];
  }
}

/**
 * Clear cache (for manual cleanup or testing)
 */
export function clearCachedNewsData(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('✅ Cache cleared');
    }
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

