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

// Fallback image pool for articles without images
// Professional AI-themed pool: "Bloomberg Terminal meets The Matrix"
// Curated for: Neural Networks, Quantum Computing, Dark Circuitry, Matrix Code
// Total: 28 images (Index 0-27) - Option B: Maximum Brand Consistency
const FALLBACK_POOL: string[] = [
  // Original pool (kept 8 best, removed Index 8 & 9: generic tech and dog)
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', // 0: Space/Earth from orbit
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', // 1: Tech workspace
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80', // 2: Motherboard
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80', // 3: AI Neural network
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', // 4: Robotics
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', // 5: Data streams
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80', // 6: Modern AI
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80', // 7: Server racks
  
  // New Professional AI Pool (20 unique images)
  // Neural Networks & Brain Visualization (8-12)
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80', // 8: Neural pathways
  'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&q=80', // 9: AI brain circuitry
  'https://images.unsplash.com/photo-1655720031554-a929595ffad7?w=800&q=80', // 10: Digital neural network
  'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=800&q=80', // 11: 3D neural web
  'https://images.unsplash.com/photo-1634193295627-1cdddf751ebf?w=800&q=80', // 12: Brain scan technology
  
  // Circuit Boards & Quantum Computing (13-19)
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', // 13: Circuit board macro
  'https://images.unsplash.com/photo-1640826514546-7d2d05a22382?w=800&q=80', // 14: Quantum computing
  'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&q=80', // 15: Motherboard close-up
  'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&q=80', // 16: Server infrastructure
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80', // 17: AI robot face
  'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&q=80', // 18: Blue circuit board
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80', // 19: Laptop code screen
  
  // Matrix Code & Data Streams (20-23)
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80', // 20: Matrix code
  'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&q=80', // 21: Digital waves
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80', // 22: Dark coding
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', // 23: Analytics dashboard
  
  // Futuristic AI & Robotics (24-27)
  'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&q=80', // 24: AI chip
  'https://images.unsplash.com/photo-1676277791608-ac61a7f28a82?w=800&q=80', // 25: Holographic interface
  'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80', // 26: Robotic arm precision
  'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?w=800&q=80', // 27: Futuristic tech abstract
];

/**
 * Hash function for deterministic fallback selection
 * Uses title + category + source as "salt" to ensure diverse image distribution
 */
function hashContent(title: string, category: string, source: string): number {
  // Combine title, category, and source to create unique seed
  const seed = `${title}|${category}|${source}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get deterministic fallback image with Position-Aware Zero-Repetition logic
 * 
 * This "salted" selection mathematically guarantees that no two neighboring
 * articles will ever share the same fallback image, even if they have
 * identical titles, categories, or sources.
 * 
 * @param title - Article title
 * @param category - Article category (Breaking AI, Gen AI, etc.)
 * @param source - Article source (TechCrunch, NVIDIA, etc.)
 * @param position - Article's position in the feed (0, 1, 2, 3...)
 * @returns URL of the fallback image from the pool
 */
function getFallbackImage(title: string, category: string, source: string, position: number): string {
  if (!title || title.trim() === '') {
    return FALLBACK_POOL[0];
  }
  
  // Position-Aware Selection: (hash + position) % pool_size
  // By adding the position to the hash result, we shift the "starting point"
  // in the pool for each article, guaranteeing visual diversity
  const hash = hashContent(title, category, source);
  const selectionIndex = (hash + position) % FALLBACK_POOL.length;
  
  return FALLBACK_POOL[selectionIndex];
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
function extractImage(item: any, title: string, category: string, source: string, position: number): string {
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

  // 8. Fallback to Position-Aware Zero-Repetition selection
  // Uses title + category + source + position to mathematically guarantee
  // that no two articles in sequence will ever share the same fallback image
  return getFallbackImage(title, category, source, position);
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
 */
async function fetchFeed(feedConfig: typeof FEED_URLS[0]): Promise<NewsItem[]> {
  const { url, category, categoryColor, source } = feedConfig;
  
  try {
    console.log(`Fetching feed from ${source}...`);
    const feed = await parser.parseURL(url);
    const items: NewsItem[] = [];

    // Deep Buffer Strategy: Fetch 50 items instead of 20 for better retention
    // This keeps articles available for 2-3 days instead of 12 hours
    // Position-Aware Processing: Track index for zero-repetition fallback logic
    feed.items.slice(0, 50).forEach((item, itemIndex) => {
      // Extract and validate link - CRITICAL: filter out items without valid links
      const link = extractLink(item);
      if (!link) {
        console.warn(`Skipping item from ${source}: No valid link found for "${item.title}"`);
        return; // Skip this item entirely (forEach equivalent of continue)
      }

      const articleTitle = sanitizeTitle(item.title || 'Untitled');
      const pubDateString = item.pubDate || item.isoDate || (item as any).published || (item as any).updated;
      const pubDate = parseRSSDate(pubDateString);
      
      // Pass itemIndex to extractImage for Position-Aware fallback selection
      items.push({
        title: articleTitle,
        description: sanitizeDescription(item.contentSnippet || (item as any).description || ''),
        category: category,
        categoryColor: categoryColor,
        image: extractImage(item, articleTitle, category, source, itemIndex),
        readTime: formatDate(pubDateString),
        author: extractAuthor(item, source),
        link: link, // Guaranteed to be valid at this point
        source: source, // Store source name for diversity
        pubDate: pubDate, // Store actual date for sorting
      });
    });

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
