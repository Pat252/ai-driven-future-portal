import Parser from 'rss-parser';
import { formatDistanceToNow } from 'date-fns';
import { NewsItem } from '@/components/NewsCard';

// Custom parser with extended fields
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['enclosure', 'enclosure', { keepArray: false }],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
    ],
  },
  headers: {
    // Critical: Mimic real browser to bypass bot blocking
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

// Feed configuration with diverse sources
const FEED_URLS = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "Breaking AI", categoryColor: "bg-red-500", source: "TechCrunch" },
  { url: "https://venturebeat.com/category/ai/feed/", category: "AI Economy", categoryColor: "bg-green-500", source: "VentureBeat" },
  { url: "https://www.theverge.com/rss/index.xml", category: "Creative Tech", categoryColor: "bg-purple-500", source: "The Verge" },
  { url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "Breaking AI", categoryColor: "bg-red-500", source: "Wired" },
  { url: "https://hackernoon.com/feed", category: "Toolbox", categoryColor: "bg-orange-500", source: "HackerNoon" },
  { url: "https://mashable.com/feeds/rss/all", category: "Creative Tech", categoryColor: "bg-purple-500", source: "Mashable" },
];

// Fallback image pool for articles without images
const FALLBACK_POOL: string[] = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
  'https://images.unsplash.com/photo-1607706189992-eae578626c86?w=800&q=80',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80',
];

/**
 * Hash function for deterministic fallback selection
 */
function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get deterministic fallback image based on title
 */
function getFallbackImage(title: string): string {
  if (!title || title.trim() === '') {
    return FALLBACK_POOL[0];
  }
  const hash = hashTitle(title);
  const index = hash % FALLBACK_POOL.length;
  return FALLBACK_POOL[index];
}

/**
 * Extract image URL from HTML content using regex
 */
function extractImageFromHTML(html: string): string | null {
  if (!html) return null;
  
  const patterns = [
    /<img[^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=([^\s>]+)/i,
    /background-image:\s*url\(["']?([^"')]+)["']?\)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = match[1].trim();
      if (url.startsWith('http') && (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || url.includes('unsplash') || url.includes('cdn'))) {
        return url;
      }
    }
  }

  return null;
}

/**
 * Robust image extraction - checks all possible fields
 */
function extractImage(item: any, title: string): string {
  // 1. Try enclosure (Standard RSS)
  if (item.enclosure?.url) {
    const url = item.enclosure.url;
    if (item.enclosure.type?.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      return url;
    }
  }

  // 2. Try media:content (Media RSS)
  if (item.mediaContent && Array.isArray(item.mediaContent) && item.mediaContent.length > 0) {
    const media = item.mediaContent[0];
    if (media.$?.url) return media.$.url;
    if (media.url) return media.url;
  }

  // 3. Try direct media:content access
  if (item['media:content']?.$?.url) {
    return item['media:content'].$.url;
  }

  // 4. Try media:thumbnail
  if (item.mediaThumbnail && Array.isArray(item.mediaThumbnail) && item.mediaThumbnail.length > 0) {
    const thumb = item.mediaThumbnail[0];
    if (thumb.$?.url) return thumb.$.url;
    if (thumb.url) return thumb.url;
  }

  // 5. Try content:encoded
  if (item.contentEncoded) {
    const imageUrl = extractImageFromHTML(item.contentEncoded);
    if (imageUrl) return imageUrl;
  }

  // 6. Try content
  if (item.content) {
    const imageUrl = extractImageFromHTML(item.content);
    if (imageUrl) return imageUrl;
  }

  // 7. Try description
  if (item.description) {
    const imageUrl = extractImageFromHTML(item.description);
    if (imageUrl) return imageUrl;
  }

  // 8. Fallback to deterministic image
  return getFallbackImage(title);
}

/**
 * Robust link extraction - checks multiple fields
 * Returns null if no valid link found (caller will filter these out)
 */
function extractLink(item: any): string | null {
  // Priority order: link, guid (if it's a URL), enclosure URL
  
  // 1. Check item.link
  if (item.link && typeof item.link === 'string' && item.link.startsWith('http')) {
    return item.link.trim();
  }

  // 2. Check item.guid (sometimes guid is the URL)
  if (item.guid && typeof item.guid === 'string' && item.guid.startsWith('http')) {
    return item.guid.trim();
  }

  // 3. Check if guid is an object with a URL property
  if (item.guid && typeof item.guid === 'object' && item.guid._ && item.guid._.startsWith('http')) {
    return item.guid._.trim();
  }

  // 4. Last resort: check enclosure URL (rare but possible)
  if (item.enclosure?.url && item.enclosure.url.startsWith('http')) {
    return item.enclosure.url.trim();
  }

  // No valid link found
  return null;
}

/**
 * Parse date from multiple formats
 */
function parseRSSDate(pubDate: string | undefined | null): Date | null {
  if (!pubDate) return null;
  
  try {
    const date = new Date(pubDate);
    
    if (!isNaN(date.getTime())) {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      if (date <= now && date >= oneYearAgo) {
        return date;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Format date to relative time
 */
function formatDate(pubDate: string | undefined | null): string {
  const date = parseRSSDate(pubDate);
  
  if (!date) {
    return '3 hours ago';
  }
  
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '3 hours ago';
  }
}

/**
 * Sanitize title (remove CDATA tags and HTML)
 */
function sanitizeTitle(title: string): string {
  if (!title) return 'Untitled';
  return title
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Sanitize description (remove HTML tags)
 */
function sanitizeDescription(description: string): string {
  if (!description) return 'No description available.';
  return description
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Extract author name from various fields
 */
function extractAuthor(item: any, source: string): string {
  if (item.creator) return item.creator;
  if (item.author) return item.author;
  if (item['dc:creator']) return item['dc:creator'];
  // Fallback to source name
  return source;
}

/**
 * Fetch and parse a single RSS feed with robust error handling
 */
async function fetchFeed(feedConfig: typeof FEED_URLS[0]): Promise<NewsItem[]> {
  const { url, category, categoryColor, source } = feedConfig;
  
  try {
    console.log(`Fetching feed from ${source}...`);
    const feed = await parser.parseURL(url);
    const items: NewsItem[] = [];

    for (const item of feed.items.slice(0, 20)) {
      // Extract and validate link - CRITICAL: filter out items without valid links
      const link = extractLink(item);
      if (!link) {
        console.warn(`Skipping item from ${source}: No valid link found for "${item.title}"`);
        continue; // Skip this item entirely
      }

      const articleTitle = sanitizeTitle(item.title || 'Untitled');
      const pubDate = item.pubDate || item.isoDate || (item as any).published || (item as any).updated;
      
      items.push({
        title: articleTitle,
        description: sanitizeDescription(item.contentSnippet || (item as any).description || ''),
        category: category,
        categoryColor: categoryColor,
        image: extractImage(item, articleTitle),
        readTime: formatDate(pubDate),
        author: extractAuthor(item, source),
        link: link, // Guaranteed to be valid at this point
      });
    }

    console.log(`✅ Successfully fetched ${items.length} items from ${source}`);
    return items;
  } catch (error) {
    console.error(`❌ Error fetching feed from ${source} (${url}):`, error);
    // Return empty array - don't crash the whole system
    return [];
  }
}

/**
 * Get all news data from RSS feeds with diversity and resilience
 */
export async function getNewsData(limit?: number): Promise<NewsItem[]> {
  try {
    console.log('Starting RSS feed fetch...');
    
    // Fetch all feeds in parallel with individual error handling
    const results = await Promise.allSettled(
      FEED_URLS.map(feedConfig => fetchFeed(feedConfig))
    );

    // Collect items by category for better interleaving
    const itemsByCategory: Record<string, NewsItem[]> = {
      'Breaking AI': [],
      'AI Economy': [],
      'Creative Tech': [],
      'Toolbox': [],
    };

    let totalItems = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const feedItems = result.value;
        totalItems += feedItems.length;
        
        feedItems.forEach((item) => {
          const category = item.category;
          if (itemsByCategory[category]) {
            itemsByCategory[category].push(item);
          }
        });
      } else {
        console.error(`Feed ${FEED_URLS[index].source} failed:`, result.reason);
      }
    });

    console.log(`✅ Total items fetched: ${totalItems}`);
    console.log(`Breaking AI: ${itemsByCategory['Breaking AI'].length}, AI Economy: ${itemsByCategory['AI Economy'].length}, Creative Tech: ${itemsByCategory['Creative Tech'].length}, Toolbox: ${itemsByCategory['Toolbox'].length}`);

    // Interleave items from each category (round-robin style)
    const interleaved: NewsItem[] = [];
    const maxLength = Math.max(
      itemsByCategory['Breaking AI'].length,
      itemsByCategory['AI Economy'].length,
      itemsByCategory['Creative Tech'].length,
      itemsByCategory['Toolbox'].length
    );

    for (let i = 0; i < maxLength; i++) {
      if (itemsByCategory['Breaking AI'][i]) {
        interleaved.push(itemsByCategory['Breaking AI'][i]);
      }
      if (itemsByCategory['AI Economy'][i]) {
        interleaved.push(itemsByCategory['AI Economy'][i]);
      }
      if (itemsByCategory['Creative Tech'][i]) {
        interleaved.push(itemsByCategory['Creative Tech'][i]);
      }
      if (itemsByCategory['Toolbox'][i]) {
        interleaved.push(itemsByCategory['Toolbox'][i]);
      }
    }

    // Apply limit if specified (for homepage)
    if (limit !== undefined) {
      return interleaved.slice(0, limit);
    }

    return interleaved;
  } catch (error) {
    console.error('❌ Critical error in getNewsData:', error);
    return [];
  }
}
