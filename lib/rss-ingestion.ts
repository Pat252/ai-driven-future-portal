/**
 * RSS INGESTION MODULE
 * 
 * ⚠️  CRITICAL: This module runs ONLY when explicitly triggered via API.
 * It NEVER runs during rendering, navigation, or hot reload.
 * 
 * Entry point: POST /api/ingest
 */

import Parser from 'rss-parser';
import { formatDistanceToNow } from 'date-fns';
import { NewsItem } from '@/components/NewsCard';
import { 
  getArticleImageSingle,
  getImageLibrary,
  enableIngestionPhase,
  disableIngestionPhase,
} from './image-utils.server';
import { setIngestionStatus } from './ingestion-status';

// ═══════════════════════════════════════════════════════════════════════════
// INGESTION CAP: UI-Driven Article Limit
// ═══════════════════════════════════════════════════════════════════════════
// UI has 72 visible slots (12 homepage + 5 categories × 12)
// We ingest slightly more for buffer and category balance
const MAX_ARTICLES_TOTAL = 82;
const MAX_PER_CATEGORY = 17; // Balanced cap: 82 articles / 5 categories ≈ 16.4
const MIN_PER_CATEGORY = 12; // Guarantee minimum for each category (especially Toolbox)

// SAFETY LOCK: Prevent concurrent ingestion runs
let ingestionRunning = false;

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
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

// Feed configuration
// ⚠️  CRITICAL: Feeds are INTERLEAVED by category to ensure even distribution
// This prevents early categories from consuming the entire 82-article cap
// before later categories (especially Toolbox) get any articles.
const FEED_URLS = [
  // Round 1: One feed from each category
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "Breaking AI", categoryColor: "bg-red-500", source: "TechCrunch" },
  { url: "https://openai.com/blog/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "OpenAI" },
  { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910", category: "AI Economy", categoryColor: "bg-green-500", source: "CNBC Tech" },
  { url: "https://www.theverge.com/rss/index.xml", category: "Creative Tech", categoryColor: "bg-purple-500", source: "The Verge" },
  { url: "https://hackernoon.com/feed", category: "Toolbox", categoryColor: "bg-orange-500", source: "HackerNoon" },
  
  // Round 2
  { url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "Breaking AI", categoryColor: "bg-red-500", source: "MIT Tech Review" },
  { url: "https://developers.googleblog.com/feeds/posts/default", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Google Developers" },
  { url: "https://www.zdnet.com/topic/artificial-intelligence/rss.xml", category: "AI Economy", categoryColor: "bg-green-500", source: "ZDNet" },
  { url: "https://mashable.com/feeds/rss/all", category: "Creative Tech", categoryColor: "bg-purple-500", source: "Mashable" },
  { url: "https://dev.to/feed/tag/ai", category: "Toolbox", categoryColor: "bg-orange-500", source: "Dev.to" },
  
  // Round 3
  { url: "https://arstechnica.com/tag/ai/feed/", category: "Breaking AI", categoryColor: "bg-red-500", source: "Ars Technica" },
  { url: "https://huggingface.co/blog/feed.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Hugging Face" },
  { url: "https://fortune.com/feed/fortune-feeds/?id=3230629", category: "AI Economy", categoryColor: "bg-green-500", source: "Fortune" },
  { url: "https://www.engadget.com/rss.xml", category: "Creative Tech", categoryColor: "bg-purple-500", source: "Engadget" },
  { url: "https://towardsdatascience.com/feed", category: "Toolbox", categoryColor: "bg-orange-500", source: "Towards Data Science" },
  
  // Round 4
  { url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "Breaking AI", categoryColor: "bg-red-500", source: "Wired" },
  { url: "https://www.deepmind.com/blog/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "DeepMind" },
  { url: "https://thenewstack.io/blog/feed", category: "AI Economy", categoryColor: "bg-green-500", source: "The New Stack" },
  { url: "https://machinelearningmastery.com/feed", category: "Toolbox", categoryColor: "bg-orange-500", source: "ML Mastery" },
  
  // Round 5 - Additional Gen AI feeds (high-value sources)
  { url: "https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml", category: "Breaking AI", categoryColor: "bg-red-500", source: "ScienceDaily" },
  { url: "https://developer.nvidia.com/blog/feed", category: "Gen AI", categoryColor: "bg-cyan-500", source: "NVIDIA Blog" },
  { url: "https://machinelearning.apple.com/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Apple ML" },
  { url: "https://blog.replit.com/feed.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Replit" },
  { url: "https://github.blog/category/ai-and-ml/feed/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "GitHub Copilot" },
  
  // Round 6
  { url: "https://vercel.com/blog/category/ai/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Vercel AI" },
  { url: "https://blog.langchain.dev/rss/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "LangChain" },
  { url: "https://blog.n8n.io/rss/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "n8n Automation" },
  { url: "https://microsoft.github.io/autogen/blog/rss.xml", category: "Gen AI", categoryColor: "bg-cyan-500", source: "AutoGen" },
  { url: "https://www.assemblyai.com/blog/rss/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "AssemblyAI" },
  
  // Round 7
  { url: "https://stability.ai/news/rss", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Stability AI" },
  { url: "https://blogs.microsoft.com/ai/feed/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Azure AI" },
  { url: "https://aws.amazon.com/blogs/machine-learning/feed/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "AWS ML" },
  { url: "https://techcrunch.com/tag/generative-ai/feed/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "TC GenAI" },
  { url: "https://simonwillison.net/atom/everything/", category: "Gen AI", categoryColor: "bg-cyan-500", source: "Simon Willison" },
];

// Helper functions
function extractLink(item: any): string | null {
  if (item.link && typeof item.link === 'string' && item.link.startsWith('http')) {
    return item.link.trim();
  }
  if (item.guid && typeof item.guid === 'string' && item.guid.startsWith('http')) {
    return item.guid.trim();
  }
  if (item.guid && typeof item.guid === 'object' && item.guid._ && item.guid._.startsWith('http')) {
    return item.guid._.trim();
  }
  if (item.enclosure?.url && item.enclosure.url.startsWith('http')) {
    return item.enclosure.url.trim();
  }
  return null;
}

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

function formatDate(pubDate: string | undefined | null): string {
  const date = parseRSSDate(pubDate);
  if (!date) return '3 hours ago';
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '3 hours ago';
  }
}

function sanitizeTitle(title: string): string {
  if (!title) return 'Untitled';
  return title
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

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
  
  if (cleaned.length > 200) {
    return cleaned.substring(0, 197) + '...';
  }
  return cleaned;
}

function extractAuthor(item: any, source: string): string {
  if (item.creator) return item.creator;
  if (item.author) return item.author;
  if (item['dc:creator']) return item['dc:creator'];
  return source;
}

function isNonLatinTitle(title: string): boolean {
  let latinCount = 0;
  let nonLatinCount = 0;
  
  for (let i = 0; i < title.length; i++) {
    const char = title[i];
    const code = char.charCodeAt(0);
    
    // Check if alphabetic (ignore digits, punctuation, whitespace)
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      // Latin letters (A-Z, a-z)
      latinCount++;
    } else if (
      (code >= 192 && code <= 255) || // Extended Latin (accented)
      (code >= 0x0100 && code <= 0x017F) || // Latin Extended-A
      (code >= 0x0180 && code <= 0x024F) // Latin Extended-B
    ) {
      // Extended Latin (Spanish, French, German accents) - count as Latin
      latinCount++;
    } else if (
      (code >= 0x0400 && code <= 0x04FF) || // Cyrillic
      (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
      (code >= 0x3040 && code <= 0x309F) || // Hiragana
      (code >= 0x30A0 && code <= 0x30FF) || // Katakana
      (code >= 0x0600 && code <= 0x06FF) || // Arabic
      (code >= 0x0590 && code <= 0x05FF) || // Hebrew
      (code >= 0x0370 && code <= 0x03FF) || // Greek
      (code >= 0x0E00 && code <= 0x0E7F) || // Thai
      (code >= 0x1100 && code <= 0x11FF) || // Hangul Jamo
      (code >= 0xAC00 && code <= 0xD7AF) // Hangul Syllables
    ) {
      // Non-Latin scripts
      nonLatinCount++;
    }
  }
  
  const totalAlphabetic = latinCount + nonLatinCount;
  
  // Accept short titles (likely acronyms or code)
  if (totalAlphabetic < 5) {
    return false;
  }
  
  // Reject if non-Latin letters outnumber Latin letters
  return nonLatinCount > latinCount;
}

async function selectUniqueImage(
  title: string,
  description: string,
  category: string,
  imageLibrary: string[],
  usedImages: Set<string>,
  articleGuid: string
): Promise<string> {
  // ENFORCE: Filter out already-used images BEFORE GPT selection
  const availableImages = imageLibrary.filter(key => !usedImages.has(key));
  
  if (availableImages.length === 0) {
    throw new Error(
      `CRITICAL: No unused images available for article "${title.substring(0, 40)}...". ` +
      `Used: ${usedImages.size}, Total: ${imageLibrary.length}`
    );
  }
  
  const selectedImageUrl = await getArticleImageSingle(
    title, 
    description, 
    category,
    availableImages,  // ← ONLY unused images
    articleGuid
  );
  
  return selectedImageUrl;
}

async function fetchFeed(
  feedConfig: typeof FEED_URLS[0], 
  imageLibrary: string[],
  usedImages: Set<string>,  // ← Track used images globally
  maxItems: number // Cap per feed to control total
): Promise<NewsItem[]> {
  const { url, category, categoryColor, source } = feedConfig;
  
  try {
    console.log(`   Fetching ${source}...`);
    const feed = await parser.parseURL(url);
    const items: NewsItem[] = [];

    // EARLY TERMINATION: Stop when maxItems reached
    for (const item of feed.items.slice(0, Math.min(50, maxItems))) {
      const link = extractLink(item);
      if (!link) {
        continue;
      }

      const articleTitle = sanitizeTitle(item.title || 'Untitled');
      
      // Language guardrail: reject obviously non-Latin titles
      if (isNonLatinTitle(articleTitle)) {
        console.log(`   ⏭️  ${source}: Rejected non-latin-title: "${articleTitle.substring(0, 50)}"`);
        continue;
      }
      
      const articleDescription = sanitizeDescription(item.contentSnippet || (item as any).description || '');
      const pubDateString = item.pubDate || item.isoDate || (item as any).published || (item as any).updated;
      const pubDate = parseRSSDate(pubDateString);
      
      const articleGuid = item.guid || item.link || `${articleTitle}-${pubDateString}`;
      
      // ENFORCE: Select ONE unique image immediately (filtered before GPT)
      const selectedImageUrl = await selectUniqueImage(
        articleTitle, 
        articleDescription, 
        category,
        imageLibrary,
        usedImages,  // ← Used images filtered out BEFORE GPT
        articleGuid
      );
      
      // LOCK: Extract key from URL and add to used images immediately (prevents reuse)
      // URL format: https://images.aidrivenfuture.ca/ai/image-01.jpg
      // Key format: ai/image-01.jpg
      const cdnUrl = process.env.NEXT_PUBLIC_R2_CDN_URL || 'https://images.aidrivenfuture.ca';
      const imageKey = selectedImageUrl.replace(cdnUrl + '/', '');
      usedImages.add(imageKey);  // ← Store KEY, not URL
      
      items.push({
        title: articleTitle,
        description: articleDescription,
        category: category,
        categoryColor: categoryColor,
        image: selectedImageUrl,  // ← Final assignment (full URL for rendering)
        readTime: formatDate(pubDateString),
        author: extractAuthor(item, source),
        link: link,
        source: source,
        pubDate: pubDate,
      });
      
      // EARLY TERMINATION: Stop if we've reached the cap for this feed
      if (items.length >= maxItems) {
        break;
      }
    }

    console.log(`   ✅ ${source}: ${items.length} articles`);
    return items;
  } catch (error) {
    console.error(`   ❌ ${source} failed:`, error);
    return [];
  }
}

/**
 * MAIN INGESTION FUNCTION
 * 
 * This is the ONLY function that should be called to ingest RSS feeds.
 * It runs ONCE per API trigger, never during rendering.
 */
export async function ingestRSSFeeds(): Promise<{ 
  articles: NewsItem[];
  totalArticles: number;
  imagesAssigned: number;
}> {
  // SAFETY LOCK: Prevent concurrent runs
  if (ingestionRunning) {
    console.warn('⚠️  RSS ingestion already running — skipping');
    return { articles: [], totalArticles: 0, imagesAssigned: 0 };
  }
  
  ingestionRunning = true;
  
  try {
    console.log('═══════════════════════════════════════');
    console.log('🔄 RSS INGESTION STARTED');
    console.log('═══════════════════════════════════════');
    
    // SET STATUS: Ingestion running
    setIngestionStatus('running');
    
    // ENABLE INGESTION PHASE - allows AI image selection
    enableIngestionPhase();
    
    // Get image library once
    const imageLibrary = await getImageLibrary();
    console.log(`📚 Loaded ${imageLibrary.length} images from R2`);
    console.log(`🎯 Target: ${MAX_ARTICLES_TOTAL} articles maximum`);
    console.log('');
    
    // ═══════════════════════════════════════════════════════════════════════
    // SEQUENTIAL FETCHING WITH CAP ENFORCEMENT
    // ═══════════════════════════════════════════════════════════════════════
    // Fetch feeds sequentially, stopping when cap is reached
    // This prevents over-fetching and excessive GPT costs
    
    // ENFORCE: Track used images globally (ingestion-scoped)
    const usedImages = new Set<string>();
    
    const allArticles: NewsItem[] = [];
    const seenUrls = new Set<string>(); // Deduplication by URL
    const categoryCount: Record<string, number> = {
      'Breaking AI': 0,
      'Gen AI': 0,
      'AI Economy': 0,
      'Creative Tech': 0,
      'Toolbox': 0,
    };
    let gptCallCount = 0;
    
    // Iterate feeds in INTERLEAVED order (ensures even category distribution)
    for (const feedConfig of FEED_URLS) {
      // EARLY TERMINATION: Stop if we've reached the global cap
      if (allArticles.length >= MAX_ARTICLES_TOTAL) {
        console.log(`   ⚠️  Reached cap (${MAX_ARTICLES_TOTAL}) - skipping remaining feeds`);
        break;
      }
      
      // CATEGORY BALANCE: Skip if this category has exceeded its max
      // BUT: Always allow feeds if category is below minimum (guarantees Toolbox gets 12+)
      const categoryHasMin = categoryCount[feedConfig.category] >= MIN_PER_CATEGORY;
      const categoryAtMax = categoryCount[feedConfig.category] >= MAX_PER_CATEGORY;
      
      if (categoryAtMax) {
        console.log(`   ⏭️  ${feedConfig.source}: Category "${feedConfig.category}" at max (${MAX_PER_CATEGORY})`);
        continue;
      }
      
      // Priority: If we're running low on global cap, prioritize categories below minimum
      const remainingGlobal = MAX_ARTICLES_TOTAL - allArticles.length;
      if (remainingGlobal < 20 && categoryHasMin) {
        // Check if any category still needs to reach minimum
        const categoriesNeedingMin = Object.entries(categoryCount).filter(
          ([_, count]) => count < MIN_PER_CATEGORY
        );
        if (categoriesNeedingMin.length > 0) {
          console.log(`   ⏭️  ${feedConfig.source}: Prioritizing categories below minimum`);
          continue;
        }
      }
      
      // Calculate how many articles we can still accept
      const remainingCategory = MAX_PER_CATEGORY - categoryCount[feedConfig.category];
      const maxForThisFeed = Math.min(remainingGlobal, remainingCategory, 10); // Max 10 per feed
      
      // Fetch articles from this feed (images assigned immediately, filtered for uniqueness)
      const feedArticles = await fetchFeed(
        feedConfig,
        imageLibrary,
        usedImages,  // ← Global tracker prevents reuse
        maxForThisFeed
      );
      
      // DEDUPLICATION: Filter out articles with duplicate URLs
      for (const article of feedArticles) {
        // Normalize URL for deduplication (remove query params, trailing slash)
        const normalizedUrl = article.link.split('?')[0].replace(/\/$/, '').toLowerCase();
        
        if (seenUrls.has(normalizedUrl)) {
          console.log(`   🔄 Skipping duplicate: ${article.title.substring(0, 40)}...`);
          continue;
        }
        
        seenUrls.add(normalizedUrl);
        allArticles.push(article);
        categoryCount[feedConfig.category]++;
        gptCallCount++; // Each article = 1 GPT call for image selection
        
        // EARLY TERMINATION: Stop if we've reached the cap
        if (allArticles.length >= MAX_ARTICLES_TOTAL) {
          break;
        }
      }
    }
    
    const totalItems = allArticles.length;

    // ═══════════════════════════════════════════════════════════════════════
    // SORT BY RECENCY (Most recent first)
    // ═══════════════════════════════════════════════════════════════════════
    // No complex interleaving - just sort by date
    // Feed iteration order already provides category diversity
    allArticles.sort((a, b) => {
      const dateA = a.pubDate?.getTime() || 0;
      const dateB = b.pubDate?.getTime() || 0;
      return dateB - dateA; // Newest first
    });
    
    // Count images assigned
    const imagesAssigned = allArticles.filter(item => item.image && item.image.startsWith('http')).length;
    
    // ENFORCE: Log used images count
    console.log(`[IMAGE ALLOCATOR] Used images: ${usedImages.size} / ${imageLibrary.length} available`);
    
    // ⚠️  CRITICAL VALIDATION: 100% image coverage required
    const imageCoverage = totalItems > 0 ? (imagesAssigned / totalItems * 100).toFixed(1) : 0;
    const hasFullCoverage = imagesAssigned === totalItems && totalItems > 0;
    
    // ═══════════════════════════════════════════════════════════════════════
    // FINAL SUMMARY LOG (appears once per run)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('');
    console.log('─────────────────────────────');
    if (hasFullCoverage) {
      console.log('✅ RSS INGESTION COMPLETE');
    } else {
      console.log('⚠️  RSS INGESTION COMPLETE WITH WARNINGS');
    }
    console.log(`📰 Articles ingested: ${totalItems} / ${MAX_ARTICLES_TOTAL}`);
    console.log(`🖼️  Images assigned: ${imagesAssigned}`);
    console.log(`📊 Categories:`);
    console.log(`   Breaking AI: ${categoryCount['Breaking AI']}`);
    console.log(`   Gen AI: ${categoryCount['Gen AI']}`);
    console.log(`   AI Economy: ${categoryCount['AI Economy']}`);
    console.log(`   Creative Tech: ${categoryCount['Creative Tech']}`);
    console.log(`   Toolbox: ${categoryCount['Toolbox']}`);
    console.log(`🤖 GPT calls: ${gptCallCount}`);
    
    if (!hasFullCoverage) {
      console.log(`❌ Image coverage: ${imageCoverage}% (INCOMPLETE)`);
      console.log(`⚠️  ${totalItems - imagesAssigned} articles missing images - DATA ERROR`);
    }
    console.log('─────────────────────────────');
    
    // GUARANTEE: Log image assignment enforcement
    console.log('');
    console.log(`[IMAGE GUARANTEE] Assigned images: ${usedImages.size} / ${totalItems} articles`);
    
    if (usedImages.size !== totalItems) {
      console.error(`❌ IMAGE LOCK FAILURE: Expected ${totalItems} unique images, got ${usedImages.size}`);
      throw new Error('Image lock enforcement failed - duplication detected');
    }
    
    console.log('✅ IMAGE LOCK VERIFIED: Zero duplication possible');
    
    // SET STATUS: Ingestion complete (before returning)
    setIngestionStatus('complete');
    
    return {
      articles: allArticles,  // Already NewsItem[] with images assigned
      totalArticles: totalItems,
      imagesAssigned: imagesAssigned,
    };
    
  } catch (error) {
    // SET STATUS: Ingestion failed
    setIngestionStatus('error', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  } finally {
    // ALWAYS disable ingestion phase and reset lock
    disableIngestionPhase();
    ingestionRunning = false;
  }
}

