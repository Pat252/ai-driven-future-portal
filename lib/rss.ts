import Parser from 'rss-parser';
import { formatDistanceToNow } from 'date-fns';
import { NewsItem } from '@/components/NewsCard';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['enclosure', 'enclosure', { keepArray: false }],
    ],
  },
});

// Category mapping
const categoryMap: Record<string, { category: string; categoryColor: string }> = {
  'wired.com': { category: 'Breaking AI', categoryColor: 'bg-red-500' },
  'techcrunch.com': { category: 'AI Economy', categoryColor: 'bg-green-500' },
  'theverge.com': { category: 'Creative Tech', categoryColor: 'bg-purple-500' },
};

// Curated Image Pool - Futuristic/AI-themed high-quality Unsplash images
// 20 unique images focusing on: Futuristic UI, Networks, Cyberpunk, Hardware, Robots
// No text on images - pure visual themes
const FALLBACK_POOL: string[] = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', // Futuristic UI / HUD - Earth from space
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', // Microchips / Hardware macro
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80', // Robot face / Humanoid
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80', // Abstract network nodes / Data visualization
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', // Cyberpunk cityscape / Neon lights
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', // Circuit board / Electronics
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80', // Tech hardware / Components
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80', // Neon city lights / Urban future
  'https://images.unsplash.com/photo-1607706189992-eae578626c86?w=800&q=80', // Digital network / Connections
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80', // AI robot / Automation
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80', // Holographic display / Sci-fi
  'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80', // Electronic components / PCB
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80', // Futuristic architecture / Buildings
  'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&q=80', // Data visualization / Analytics
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80', // Humanoid robot / AI
  'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=800&q=80', // Sci-fi interface / Technology
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', // Computer chip close-up / Silicon
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80', // Technology circuit / Wiring
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', // Digital future / Innovation
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80', // Neural network visualization / AI brain
];

/**
 * Hash function to convert title to a deterministic number
 */
function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get fallback image based on article title (deterministic selection)
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
  
  // Try multiple regex patterns to catch different image formats
  const patterns = [
    /<img[^>]+src=["']([^"']+)["']/i, // Standard img tag
    /<img[^>]+src=([^\s>]+)/i, // img tag without quotes
    /background-image:\s*url\(["']?([^"')]+)["']?\)/i, // CSS background-image
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = match[1].trim();
      // Validate it's a real image URL
      if (url.startsWith('http') && (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || url.includes('unsplash') || url.includes('cdn'))) {
        return url;
      }
    }
  }

  return null;
}

/**
 * Extract image from RSS item with advanced detection
 */
function extractImage(item: any, title: string): string {
  // 1. Try enclosure (Standard RSS) - check if it's an image
  if (item.enclosure?.url) {
    const url = item.enclosure.url;
    // Check if type is image or URL looks like an image
    if (item.enclosure.type?.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      return url;
    }
  }

  // 2. Try media:content (Media RSS) - check both parsed and raw formats
  if (item.mediaContent && item.mediaContent.length > 0) {
    const media = item.mediaContent[0];
    if (media.$?.url) return media.$.url;
    if (media.url) return media.url;
  }

  // Also try direct access to media:content
  if (item['media:content']?.$?.url) {
    return item['media:content'].$.url;
  }

  // 3. Try media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.length > 0) {
    const thumb = item.mediaThumbnail[0];
    if (thumb.$?.url) return thumb.$.url;
    if (thumb.url) return thumb.url;
  }

  // 4. Try regex search in content:encoded (Most reliable for TechCrunch/Wired)
  if (item['content:encoded']) {
    const imageUrl = extractImageFromHTML(item['content:encoded']);
    if (imageUrl) return imageUrl;
  }

  // 5. Try regex search in content
  if (item.content) {
    const imageUrl = extractImageFromHTML(item.content);
    if (imageUrl) return imageUrl;
  }

  // 6. Try regex search in description (Some feeds put images here)
  if (item.description) {
    const imageUrl = extractImageFromHTML(item.description);
    if (imageUrl) return imageUrl;
  }

  // 7. Try contentSnippet as last resort
  if (item.contentSnippet) {
    const imageUrl = extractImageFromHTML(item.contentSnippet);
    if (imageUrl) return imageUrl;
  }

  // 8. Deterministic fallback based on article title
  return getFallbackImage(title);
}

/**
 * Sanitize title (remove CDATA tags)
 */
function sanitizeTitle(title: string): string {
  if (!title) return 'Untitled';
  return title
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim();
}

/**
 * Format date to relative time
 */
function formatDate(pubDate: string): string {
  try {
    const date = new Date(pubDate);
    if (isNaN(date.getTime())) return 'Recently';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Recently';
  }

}

/**
 * Estimate read time from content
 */
function estimateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min`;
}

/**
 * Extract author name
 */
function extractAuthor(item: any): string {
  if (item.creator) return item.creator;
  if (item.author) return item.author;
  if (item['dc:creator']) return item['dc:creator'];
  return 'Editorial Team';
}

/**
 * Fetch and parse RSS feed
 */
async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(url);
    const items: NewsItem[] = [];

    for (const item of feed.items.slice(0, 20)) {
      const categoryInfo = categoryMap[source] || { category: 'Breaking AI', categoryColor: 'bg-red-500' };
      
      const articleTitle = sanitizeTitle(item.title || 'Untitled');
      
      const itemAny = item as any;
      
      items.push({
        title: articleTitle,
        description: item.contentSnippet || itemAny.description || 'No description available.',
        category: categoryInfo.category,
        categoryColor: categoryInfo.categoryColor,
        image: extractImage(item, articleTitle),
        readTime: estimateReadTime(itemAny.content || itemAny['content:encoded'] || item.contentSnippet || ''),
        author: extractAuthor(item),
        link: item.link || item.guid || '#',
      });
    }

    return items;
  } catch (error) {
    console.error(`Error fetching feed from ${url}:`, error);
    return [];
  }
}

/**
 * Get all news data from RSS feeds with better interleaving
 * @param limit - Optional limit for homepage (default: all items)
 */
export async function getNewsData(limit?: number): Promise<NewsItem[]> {
  const feeds = [
    { url: 'https://www.wired.com/feed/category/science/artificial-intelligence/latest/rss', source: 'wired.com' },
    { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'techcrunch.com' },
    { url: 'https://www.theverge.com/rss/artificial-intelligence/index.xml', source: 'theverge.com' },
  ];

  try {
    // Fetch all feeds in parallel
    const results = await Promise.allSettled(
      feeds.map(feed => fetchFeed(feed.url, feed.source))
    );

    // Collect items by category for better interleaving
    const itemsByCategory: Record<string, NewsItem[]> = {
      'Breaking AI': [],
      'AI Economy': [],
      'Creative Tech': [],
    };

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        result.value.forEach((item) => {
          const category = item.category;
          if (itemsByCategory[category]) {
            itemsByCategory[category].push(item);
          }
        });
      }
    });

    // Interleave items from each category (round-robin style)
    const interleaved: NewsItem[] = [];
    const maxLength = Math.max(
      itemsByCategory['Breaking AI'].length,
      itemsByCategory['AI Economy'].length,
      itemsByCategory['Creative Tech'].length
    );

    for (let i = 0; i < maxLength; i++) {
      // Add one from each category in rotation
      if (itemsByCategory['Breaking AI'][i]) {
        interleaved.push(itemsByCategory['Breaking AI'][i]);
      }
      if (itemsByCategory['AI Economy'][i]) {
        interleaved.push(itemsByCategory['AI Economy'][i]);
      }
      if (itemsByCategory['Creative Tech'][i]) {
        interleaved.push(itemsByCategory['Creative Tech'][i]);
      }
    }

    // Apply limit if specified (for homepage)
    if (limit !== undefined) {
      return interleaved.slice(0, limit);
    }

    return interleaved;
  } catch (error) {
    console.error('Error fetching news data:', error);
    return [];
  }
}

