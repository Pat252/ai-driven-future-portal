import Parser from 'rss-parser';
import { formatDistanceToNow } from 'date-fns';
import { NewsItem } from '@/components/NewsCard';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['enclosure', 'enclosure', { keepArray: false }],
      ['dc:creator', 'creator'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

// --- 1. THE CENTRAL FEED CONFIGURATION ---
// This is where you add new sites. We map them directly to categories here.
type FeedConfig = {
  url: string;
  sourceName: string; // The display name (e.g. "Google AI")
  category: string;
  categoryColor: string;
};

const FEEDS: FeedConfig[] = [
  // --- BREAKING AI (Research, Models, Big Announcements) ---
  {
    url: 'https://www.wired.com/feed/category/science/artificial-intelligence/latest/rss',
    sourceName: 'Wired',
    category: 'Breaking AI',
    categoryColor: 'bg-red-500',
  },
  {
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    sourceName: 'MIT Tech Review',
    category: 'Breaking AI',
    categoryColor: 'bg-red-500',
  },
  {
    url: 'http://googleaiblog.blogspot.com/atom.xml',
    sourceName: 'Google AI',
    category: 'Breaking AI',
    categoryColor: 'bg-red-500',
  },
  {
    url: 'https://blogs.nvidia.com/feed/',
    sourceName: 'NVIDIA Blog',
    category: 'Breaking AI',
    categoryColor: 'bg-red-500',
  },
  {
    url: 'https://www.unite.ai/feed/',
    sourceName: 'Unite.ai',
    category: 'Breaking AI',
    categoryColor: 'bg-red-500',
  },

  // --- AI ECONOMY (Business, Stocks, Startups, Policy) ---
  {
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    sourceName: 'TechCrunch',
    category: 'AI Economy',
    categoryColor: 'bg-green-500',
  },
  {
    url: 'https://venturebeat.com/category/ai/feed/',
    sourceName: 'VentureBeat',
    category: 'AI Economy',
    categoryColor: 'bg-green-500',
  },
  {
    url: 'https://feeds.feedburner.com/doda/AI_Trends', // Often covers business trends
    sourceName: 'AI Trends',
    category: 'AI Economy',
    categoryColor: 'bg-green-500',
  },
  
  // --- CREATIVE TECH (Art, Design, Consumer Gadgets) ---
  {
    url: 'https://www.theverge.com/rss/artificial-intelligence/index.xml',
    sourceName: 'The Verge',
    category: 'Creative Tech',
    categoryColor: 'bg-purple-500',
  },
  {
    url: 'https://www.engadget.com/rss.xml',
    sourceName: 'Engadget',
    category: 'Creative Tech',
    categoryColor: 'bg-purple-500',
  },
  {
    url: 'https://mashable.com/feeds/rss/tech', // General tech often covers AI art/tools
    sourceName: 'Mashable',
    category: 'Creative Tech',
    categoryColor: 'bg-purple-500',
  },

  // --- TOOLBOX (Developer Tools, Code, Open Source) ---
  {
    url: 'https://www.marktechpost.com/feed/',
    sourceName: 'MarkTechPost',
    category: 'Toolbox',
    categoryColor: 'bg-blue-500',
  },
  {
    url: 'https://hackernoon.com/feed', // Broad, but good dev content
    sourceName: 'HackerNoon',
    category: 'Toolbox',
    categoryColor: 'bg-blue-500',
  },
];

// --- FALLBACK IMAGES (Keep your existing pool) ---
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
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80',
  'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&q=80',
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
  'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=800&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
];

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getFallbackImage(title: string): string {
  if (!title || title.trim() === '') return FALLBACK_POOL[0];
  const hash = hashTitle(title);
  return FALLBACK_POOL[hash % FALLBACK_POOL.length];
}

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
      if (url.startsWith('http') && (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || url.includes('unsplash') || url.includes('cdn') || url.includes('wp-content'))) {
        return url;
      }
    }
  }
  return null;
}

function extractImage(item: any, title: string): string {
  if (item.enclosure?.url && (item.enclosure.type?.startsWith('image/') || item.enclosure.url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i))) {
    return item.enclosure.url;
  }
  if (item.mediaContent?.[0]?.url) return item.mediaContent[0].url;
  if (item.mediaContent?.[0]?.$?.url) return item.mediaContent[0].$.url;
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item.mediaThumbnail?.[0]?.url) return item.mediaThumbnail[0].url;
  if (item.mediaThumbnail?.[0]?.$?.url) return item.mediaThumbnail[0].$.url;
  
  if (item['content:encoded']) {
    const img = extractImageFromHTML(item['content:encoded']);
    if (img) return img;
  }
  if (item.content) {
    const img = extractImageFromHTML(item.content);
    if (img) return img;
  }
  if (item.description) {
    const img = extractImageFromHTML(item.description);
    if (img) return img;
  }

  return getFallbackImage(title);
}

function sanitizeTitle(title: string): string {
  if (!title) return 'Untitled';
  return title.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
}

function estimateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '');
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min`;
}

function extractAuthor(item: any, sourceName: string): string {
  if (item.creator) return item.creator;
  if (item.author) return item.author;
  if (item['dc:creator']) return item['dc:creator'];
  return sourceName; // Default to Source Name if no specific author
}

// --- FETCH FUNCTION UPDATED TO USE CONFIG ---
async function fetchFeed(config: FeedConfig): Promise<NewsItem[]> {
  try {
    // Add a timeout to prevent one slow feed from blocking everything
    const feed = await Promise.race([
      parser.parseURL(config.url),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);

    const items: NewsItem[] = [];

    for (const item of feed.items.slice(0, 10)) { // Limit to 10 per feed to keep it fast
      const articleTitle = sanitizeTitle(item.title || 'Untitled');
      const itemAny = item as any;
      
      items.push({
        title: articleTitle,
        description: item.contentSnippet || itemAny.description || 'No description available.',
        category: config.category,
        categoryColor: config.categoryColor,
        image: extractImage(item, articleTitle),
        readTime: estimateReadTime(itemAny.content || itemAny['content:encoded'] || item.contentSnippet || ''),
        author: extractAuthor(item, config.sourceName),
        link: item.link || item.guid || '#',
      });
    }
    return items;
  } catch (error) {
    // console.error(`Skipping feed ${config.sourceName}:`, error);
    // Return empty array so the rest of the site loads fine
    return [];
  }
}

export async function getNewsData(limit?: number): Promise<NewsItem[]> {
  try {
    const results = await Promise.allSettled(
      FEEDS.map(config => fetchFeed(config))
    );

    const allItems: NewsItem[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    });

    // Sort by Date? (RSS doesn't always give perfect dates, but we can shuffle)
    // Actually, a Shuffle is better for an Aggregator so it doesn't look like blocks of the same source
    const shuffled = allItems.sort(() => Math.random() - 0.5);

    if (limit) {
      return shuffled.slice(0, limit);
    }

    return shuffled;
  } catch (error) {
    console.error('Critical Error fetching news:', error);
    return [];
  }
}