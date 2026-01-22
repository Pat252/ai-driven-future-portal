/**
 * ARTICLE DIVERSITY UTILITIES
 * 
 * Render-time utilities to ensure source variety in article displays.
 * Pure functions with no side effects.
 */

import { NewsItem } from '@/components/NewsCard';

/**
 * Get publication timestamp as number for sorting.
 * Handles both Date objects and ISO string dates (from JSON deserialization).
 */
function getPubDateTimestamp(pubDate: Date | null | string): number {
  if (!pubDate) return 0;
  
  if (typeof pubDate === 'string') {
    const date = new Date(pubDate);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }
  
  if (pubDate instanceof Date) {
    return isNaN(pubDate.getTime()) ? 0 : pubDate.getTime();
  }
  
  return 0;
}

/**
 * Interleave articles by source using round-robin selection.
 * 
 * Groups articles by source, preserves recency order within each source,
 * then selects articles round-robin (one per source per cycle).
 * 
 * @param articles - Array of NewsItem articles (already filtered by category)
 * @returns Reordered array with source diversity at the top
 * 
 * Behavior:
 * - Groups articles by `source` field
 * - Within each source group, maintains recency order (newest first)
 * - Selects articles round-robin: one from each source per cycle
 * - Continues until all articles are exhausted
 * - Handles edge cases: empty arrays, single source, etc.
 */
export function interleaveBySource(articles: NewsItem[]): NewsItem[] {
  // Handle empty input
  if (articles.length === 0) {
    return [];
  }
  
  // Group articles by source
  const sourceGroups = new Map<string, NewsItem[]>();
  
  for (const article of articles) {
    const source = article.source || 'Unknown';
    if (!sourceGroups.has(source)) {
      sourceGroups.set(source, []);
    }
    sourceGroups.get(source)!.push(article);
  }
  
  // Handle single source case (no interleaving needed)
  if (sourceGroups.size === 1) {
    // Still sort by recency within the single source
    const singleSourceArticles = Array.from(sourceGroups.values())[0];
    return singleSourceArticles.sort((a, b) => {
      const timeA = getPubDateTimestamp(a.pubDate);
      const timeB = getPubDateTimestamp(b.pubDate);
      return timeB - timeA; // Newest first
    });
  }
  
  // Sort each source group by recency (newest first)
  const sortedGroups = new Map<string, NewsItem[]>();
  for (const [source, groupArticles] of sourceGroups.entries()) {
    const sorted = [...groupArticles].sort((a, b) => {
      const timeA = getPubDateTimestamp(a.pubDate);
      const timeB = getPubDateTimestamp(b.pubDate);
      return timeB - timeA; // Newest first
    });
    sortedGroups.set(source, sorted);
  }
  
  // Round-robin selection
  const result: NewsItem[] = [];
  const sourceNames = Array.from(sortedGroups.keys());
  const sourceIndices = new Map<string, number>();
  
  // Initialize indices
  for (const source of sourceNames) {
    sourceIndices.set(source, 0);
  }
  
  // Continue until all articles are selected
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    
    // One article from each source per cycle
    for (const source of sourceNames) {
      const index = sourceIndices.get(source)!;
      const group = sortedGroups.get(source)!;
      
      if (index < group.length) {
        result.push(group[index]);
        sourceIndices.set(source, index + 1);
        hasMore = true;
      }
    }
  }
  
  return result;
}

