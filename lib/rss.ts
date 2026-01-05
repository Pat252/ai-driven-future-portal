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

// Feed configuration with diverse, reliable sources
const FEED_URLS = [
  // --- BREAKING AI (The "Heavy Hitters") ---
  // We mix Startup news (TechCrunch) with Research (MIT) and Culture (Wired)
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "Breaking AI", categoryColor: "bg-red-500", source: "TechCrunch" },
  { url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "Breaking AI", categoryColor: "bg-red-500", source: "MIT Tech Review" },
  { url: "https://arstechnica.com/tag/ai/feed/", category: "Breaking AI", categoryColor: "bg-red-500", source: "Ars Technica" },
  { url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "Breaking AI", categoryColor: "bg-red-500", source: "Wired" },
  { url: "https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml", category: "Breaking AI", categoryColor: "bg-red-500", source: "ScienceDaily" },

  // --- GEN AI (Agents, Cloud, Models & Tools) --- ✨ BUILDER'S DASHBOARD ✨
  // 1. The Models & Research Labs (Source of Truth)
  { url: "https://openai.com/blog/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "OpenAI" },
  { url: "https://developers.googleblog.com/feeds/posts/default", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Google Developers" }, // Covers Gemini, Antigravity & Nano Banana
  { url: "https://huggingface.co/blog/feed.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Hugging Face" },
  { url: "https://www.deepmind.com/blog/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "DeepMind" },
  { url: "https://developer.nvidia.com/blog/feed", category: "Gen AI", categoryColor: "bg-cyan-500", source: "NVIDIA Blog" },
  { url: "https://machinelearning.apple.com/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Apple ML" },

  // 2. The New IDEs & No-Code Builders (Replit, Bolt, v0)
  { url: "https://blog.replit.com/feed.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Replit" },
  { url: "https://github.blog/category/ai-and-ml/feed/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "GitHub Copilot" },
  { url: "https://vercel.com/blog/category/ai/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Vercel AI" }, // Covers v0

  // 3. Agents & Orchestration (LangChain, n8n, AutoGen)
  { url: "https://blog.langchain.dev/rss/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "LangChain" },
  { url: "https://blog.n8n.io/rss/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "n8n Automation" },
  { url: "https://microsoft.github.io/autogen/blog/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "AutoGen" },

  // 4. Voice & Multimodal AI
  { url: "https://www.assemblyai.com/blog/rss/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "AssemblyAI" }, // Voice AI
  { url: "https://stability.ai/news/rss", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Stability AI" }, // Image/Video Gen

  // 5. Cloud Infrastructure (Azure / AWS)
  { url: "https://blogs.microsoft.com/ai/feed/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Azure AI" },
  { url: "https://aws.amazon.com/blogs/machine-learning/feed/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "AWS ML" },

  // 6. General Trends & Industry News
  { url: "https://techcrunch.com/tag/generative-ai/feed/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "TC GenAI" },
  { url: "https://simonwillison.net/atom/everything/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Simon Willison" },

  // --- AI ECONOMY (Business & Enterprise) ---
  // Replacing VentureBeat (which blocks us) with CNBC and ZDNet
  { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910", category: "AI Economy", categoryColor: "bg-green-500", source: "CNBC Tech" },
  { url: "https://www.zdnet.com/topic/artificial-intelligence/rss.xml", category: "AI Economy", categoryColor: "bg-green-500", source: "ZDNet" },
  { url: "https://fortune.com/feed/fortune-feeds/?id=3230629", category: "AI Economy", categoryColor: "bg-green-500", source: "Fortune" },
  { url: "https://thenewstack.io/blog/feed", category: "AI Economy", categoryColor: "bg-green-500", source: "The New Stack" },

  // --- CREATIVE TECH (Consumer & Design) ---
  { url: "https://www.theverge.com/rss/index.xml", category: "Creative Tech", categoryColor: "bg-purple-500", source: "The Verge" },
  { url: "https://mashable.com/feeds/rss/all", category: "Creative Tech", categoryColor: "bg-purple-500", source: "Mashable" },
  { url: "https://www.engadget.com/rss.xml", category: "Creative Tech", categoryColor: "bg-purple-500", source: "Engadget" },

  // --- TOOLBOX (Dev & Code) ---
  { url: "https://hackernoon.com/feed", category: "Toolbox", categoryColor: "bg-orange-500", source: "HackerNoon" },
  { url: "https://dev.to/feed/tag/ai", category: "Toolbox", categoryColor: "bg-orange-500", source: "Dev.to" },
  { url: "https://towardsdatascience.com/feed", category: "Toolbox", categoryColor: "bg-orange-500", source: "Towards Data Science" },
  { url: "https://machinelearningmastery.com/feed", category: "Toolbox", categoryColor: "bg-orange-500", source: "ML Mastery" },
];

// ============================================================================
// 3-TIER IMAGE FALLBACK STRATEGY
// ============================================================================
// Tier 1: RSS feed images (if from trusted sources) - SKIPPED for copyright safety
// Tier 2: Unsplash dynamic images (high-quality, royalty-free)
// Tier 3: Local placeholders (owned assets, final fallback)
// Last Updated: 2026-01-04
// ============================================================================

import { getArticleImage, getArticleImageWithScore } from './image-utils';

// ============================================================================
// LOCAL-ONLY IMAGE STRATEGY (MAXIMUM CONTROL)
// ============================================================================

// ============================================================================
// IMAGE CACHING - Prevent duplicate AI API calls
// ============================================================================

/**
 * In-memory cache for article-to-image mappings
 * Key: article title (normalized)
 * Value: selected image filename
 * 
 * This ensures we only call OpenAI ONCE per article, even across multiple
 * RSS feed fetches or page reloads within the same server session.
 */
const imageCache = new Map<string, string>();

/**
 * Normalize article title for cache key
 * 
 * @param title - Article title
 * @returns Normalized cache key
 */
function getCacheKey(title: string): string {
  return title.toLowerCase().trim();
}

/**
 * Get image path - AI-POWERED SMART CURATOR with Caching
 * 
 * INTELLIGENT SELECTION STRATEGY (Updated 2026-01-04):
 * - TIER 1: GPT-4o-mini AI curation (semantic understanding)
 * - TIER 2: Weighted keyword matching (fallback)
 * - TIER 3: Hash-based random (final fallback)
 * - CACHING: Only calls AI once per article (saves API costs)
 * - Visual diversity penalty (-5.0 for used images)
 * 
 * Philosophy:
 * - AI understands conceptual relationships beyond keywords
 * - "Agentic Metadata" → infrastructure images
 * - Nearby articles get different images (no logo spam)
 * - Same article always gets same image (bookmarkable UX)
 * - Cost: ~$0.01 per 1,000 NEW articles
 * 
 * @param item - RSS feed item (IGNORED for images)
 * @param title - Article title (USED for AI/keyword matching)
 * @param category - Article category (used as scoring bonus)
 * @param usedImagesSet - Set of already-used images (for visual diversity)
 * @returns Promise<Local image path> (e.g., "/assets/images/all/bitcoins-money-dollars.jpg")
 */
async function extractImage(
  item: any, 
  title: string, 
  category: string,
  usedImagesSet: Set<string> = new Set()
): Promise<string> {
  // ============================================================================
  // LEGAL & COMPLIANT - 100% LOCAL-ONLY STRATEGY
  // ============================================================================
  // ALL external image sources are COMPLETELY IGNORED:
  // ❌ item.enclosure - IGNORED (publisher copyright risk)
  // ❌ item.mediaContent - IGNORED (publisher copyright risk)
  // ❌ item.mediaThumbnail - IGNORED (publisher copyright risk)
  // ❌ HTML content images - IGNORED (publisher copyright risk)
  // ❌ Unsplash API - REMOVED (external dependency)
  // ❌ ANY external URLs - BLOCKED
  // 
  // ✅ ONLY local files in /public/assets/images/all/ (97 owned images)
  // ✅ AI-powered curation with GPT-4o-mini (~$0.01 per 1,000 articles)
  // ============================================================================
  
  // Check cache first to avoid duplicate AI calls
  const cacheKey = getCacheKey(title);
  const cachedImage = imageCache.get(cacheKey);
  
  if (cachedImage) {
    // Cache hit! Return cached image path
    const cachedPath = `/assets/images/all/${cachedImage}`;
    
    // Still add to usedImagesSet for visual diversity in this render
    usedImagesSet.add(cachedImage);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Cache Hit] "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" -> ${cachedImage}`);
    }
    
    return cachedPath;
  }
  
  // Cache miss - need to select image (AI or keyword matching)
  const localImagePath = await getArticleImage(title, category, usedImagesSet);
  
  // Extract filename from path and cache it
  const filename = localImagePath.split('/').pop() || '';
  if (filename) {
    imageCache.set(cacheKey, filename);
    usedImagesSet.add(filename);
  }
  
  return localImagePath;
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
 * Sanitize description (remove HTML tags) and truncate to 200 chars for Fair Use compliance
 */
function sanitizeDescription(description: string): string {
  if (!description) return 'No description available.';
  const cleaned = description
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  // Truncate to 200 characters for Fair Use compliance
  if (cleaned.length > 200) {
    return cleaned.substring(0, 197) + '...';
  }
  return cleaned;
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
 * UPDATED: Now uses AI-powered Smart Curator with caching and visual diversity
 */
async function fetchFeed(feedConfig: typeof FEED_URLS[0]): Promise<NewsItem[]> {
  const { url, category, categoryColor, source } = feedConfig;
  
  try {
    console.log(`Fetching feed from ${source}...`);
    const feed = await parser.parseURL(url);
    const items: NewsItem[] = [];
    
    // VISUAL DIVERSITY: Track used images within this feed to prevent duplicates
    const usedImagesSet = new Set<string>();

    // Deep Buffer Strategy: Fetch 50 items instead of 20 for better retention
    // This keeps articles available for 2-3 days instead of 12 hours
    // Process items sequentially to allow async image extraction
    for (const item of feed.items.slice(0, 50)) {
      // Extract and validate link - CRITICAL: filter out items without valid links
      const link = extractLink(item);
      if (!link) {
        console.warn(`Skipping item from ${source}: No valid link found for "${item.title}"`);
        continue; // Skip this item
      }

      const articleTitle = sanitizeTitle(item.title || 'Untitled');
      const pubDateString = item.pubDate || item.isoDate || (item as any).published || (item as any).updated;
      const pubDate = parseRSSDate(pubDateString);
      
      // AI-Powered Smart Curator: Get contextually matched image with visual diversity
      // This is now async to support AI curation
      const selectedImage = await extractImage(item, articleTitle, category, usedImagesSet);
      
      items.push({
        title: articleTitle,
        description: sanitizeDescription(item.contentSnippet || (item as any).description || ''),
        category: category,
        categoryColor: categoryColor,
        image: selectedImage,
        readTime: formatDate(pubDateString),
        author: extractAuthor(item, source),
        link: link, // Guaranteed to be valid at this point
        source: source, // Store source name for diversity
        pubDate: pubDate, // Store actual date for sorting
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
      'Gen AI': [],
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
    console.log(`Breaking AI: ${itemsByCategory['Breaking AI'].length}, Gen AI: ${itemsByCategory['Gen AI'].length}, AI Economy: ${itemsByCategory['AI Economy'].length}, Creative Tech: ${itemsByCategory['Creative Tech'].length}, Toolbox: ${itemsByCategory['Toolbox'].length}`);

    // SMART INTERLEAVING: Round-robin by SOURCE within each category
    // This prevents TechCrunch from dominating "Breaking AI"
    const diversifiedByCategory: Record<string, NewsItem[]> = {};
    
    Object.keys(itemsByCategory).forEach(category => {
      const categoryItems = itemsByCategory[category];
      
      // Group by source within this category
      const itemsBySource: Record<string, NewsItem[]> = {};
      categoryItems.forEach(item => {
        if (!itemsBySource[item.source]) {
          itemsBySource[item.source] = [];
        }
        itemsBySource[item.source].push(item);
      });

      // Sort each source's articles by date (newest first)
      Object.keys(itemsBySource).forEach(source => {
        itemsBySource[source].sort((a, b) => {
          const dateA = a.pubDate?.getTime() || 0;
          const dateB = b.pubDate?.getTime() || 0;
          return dateB - dateA; // Newest first
        });
      });

      // Round-robin interleaving by source
      const mixedItems: NewsItem[] = [];
      const sources = Object.keys(itemsBySource);
      const maxItems = Math.max(...sources.map(s => itemsBySource[s].length));

      for (let i = 0; i < maxItems; i++) {
        for (const source of sources) {
          if (itemsBySource[source][i]) {
            mixedItems.push(itemsBySource[source][i]);
          }
        }
      }

      diversifiedByCategory[category] = mixedItems;
    });

    // Now interleave categories (Breaking AI, Gen AI, Economy, Creative, Toolbox)
    const interleaved: NewsItem[] = [];
    const maxLength = Math.max(
      diversifiedByCategory['Breaking AI']?.length || 0,
      diversifiedByCategory['Gen AI']?.length || 0,
      diversifiedByCategory['AI Economy']?.length || 0,
      diversifiedByCategory['Creative Tech']?.length || 0,
      diversifiedByCategory['Toolbox']?.length || 0
    );

    for (let i = 0; i < maxLength; i++) {
      if (diversifiedByCategory['Breaking AI']?.[i]) {
        interleaved.push(diversifiedByCategory['Breaking AI'][i]);
      }
      if (diversifiedByCategory['Gen AI']?.[i]) {
        interleaved.push(diversifiedByCategory['Gen AI'][i]);
      }
      if (diversifiedByCategory['AI Economy']?.[i]) {
        interleaved.push(diversifiedByCategory['AI Economy'][i]);
      }
      if (diversifiedByCategory['Creative Tech']?.[i]) {
        interleaved.push(diversifiedByCategory['Creative Tech'][i]);
      }
      if (diversifiedByCategory['Toolbox']?.[i]) {
        interleaved.push(diversifiedByCategory['Toolbox'][i]);
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
