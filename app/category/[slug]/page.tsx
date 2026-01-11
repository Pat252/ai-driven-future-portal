import Header from '@/components/Header';
import Ticker from '@/components/Ticker';
import NewsGrid from '@/components/NewsGrid';
import MarketOverview from '@/components/MarketOverview';
import { getCachedNewsData } from '@/lib/cache';
import { getIngestionStatus } from '@/lib/ingestion-status';
import type { Metadata } from 'next';

// Force dynamic rendering (no static generation, no ISR)
export const dynamic = 'force-dynamic';

// Map URL slugs to category names
const slugToCategory: Record<string, string> = {
  'breaking-ai': 'Breaking AI',
  'gen-ai': 'Gen AI',
  'ai-economy': 'AI Economy',
  'creative-tech': 'Creative Tech',
  'toolbox': 'Toolbox',
};

// Map category names to display titles
const categoryToTitle: Record<string, string> = {
  'Breaking AI': 'Latest News in Breaking AI',
  'Gen AI': 'Latest News in Gen AI',
  'AI Economy': 'Latest News in AI Economy',
  'Creative Tech': 'Latest News in Creative Tech',
  'Toolbox': 'Latest News in Toolbox',
};

// Map category names to descriptions
const categoryToDescription: Record<string, string> = {
  'Breaking AI': 'Stay updated with the latest breakthroughs in artificial intelligence and machine learning.',
  'Gen AI': 'Discover the newest models, tools, and frameworks in generative AI.',
  'AI Economy': 'Track the financial impact and business transformation driven by AI.',
  'Creative Tech': 'Explore AI-powered innovation in design, media, and creative industries.',
  'Toolbox': 'Find the best developer tools and resources for building AI applications.',
};

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

// ============================================================================
// DYNAMIC METADATA - Category-Specific OG Tags
// ============================================================================
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = slugToCategory[slug] || 'Breaking AI';
  const pageTitle = categoryToTitle[category] || 'Latest News';
  const description = categoryToDescription[category] || 'AI news and insights';

  return {
    title: `${pageTitle} | AI Driven Future`,
    description,
    openGraph: {
      title: `${pageTitle} | AI Driven Future`,
      description,
      url: `https://www.aidrivenfuture.ca/category/${slug}`,
      siteName: "AI Driven Future",
      images: [
        {
          url: "https://www.aidrivenfuture.ca/assets/images/og-brand-banner.png.svg",
          width: 1200,
          height: 630,
          alt: `${pageTitle} - AI Driven Future`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageTitle} | AI Driven Future`,
      description,
      images: ["https://www.aidrivenfuture.ca/assets/images/og-brand-banner.png.svg"],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = slugToCategory[slug] || 'Breaking AI';
  const pageTitle = categoryToTitle[category] || 'Latest News';

  // Check ingestion status FIRST
  const ingestionStatus = getIngestionStatus();
  console.log(`[PAGE] Ingestion status: ${ingestionStatus}`);

  // FETCH FROM R2: Read articles from persistent R2 storage
  // NO RSS fetching, NO AI calls, NO image selection
  const allNews = await getCachedNewsData();

  // Filter to valid articles with imageUrl
  const validNews = allNews.filter(item => {
    const isValid = item.image && item.image.startsWith('http');
    if (!isValid && process.env.NODE_ENV !== 'production') {
      console.error('❌ DATA ERROR: Category filtered article missing imageUrl', {
        title: item.title.substring(0, 50),
        category: item.category,
      });
    }
    return isValid;
  });

  // Filter by category
  const categoryNews = validNews.filter(item => item.category === category);

  // Deduplicate images at render time: prefer articles with unique image URLs
  const seenImages = new Set<string>();
  const filteredNews: typeof categoryNews = [];
  for (const item of categoryNews) {
    if (!seenImages.has(item.image)) {
      seenImages.add(item.image);
      filteredNews.push(item);
    } else {
      // Allow duplicates if unique images exhausted
      filteredNews.push(item);
    }
  }

  // Dev log
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[CATEGORY:${slug}] Rendering ${filteredNews.length} articles (from ${allNews.length} total)`);
    if (filteredNews.length > 0) {
      const uniqueImages = new Set(filteredNews.map(item => item.image));
      console.log(`[CATEGORY:${slug}] Unique image URLs: ${uniqueImages.size} / ${filteredNews.length}`);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-[#EDEDED] transition-colors w-full">
      <Header />
      <Ticker />
      <main className="w-full flex-1 py-8">
        <div className="center-container">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-[#EDEDED]">
            {pageTitle}
          </h1>
          
          {/* Show Market Overview widget only on AI Economy page */}
          {slug === 'ai-economy' && (
            <div className="mb-8">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                Tracking the financial impact of Artificial Intelligence on global markets.
              </p>
              <MarketOverview />
            </div>
          )}
          
          {/* STATE-AWARE RENDERING */}
          {ingestionStatus === 'running' && filteredNews.length === 0 ? (
            // ONLY show spinner if no articles exist during ingestion
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0070F3] mb-4"></div>
                <h2 className="text-2xl font-bold mb-2">Loading latest {category} news…</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Fetching fresh articles. This may take 10-20 seconds.
                </p>
              </div>
            </div>
          ) : ingestionStatus === 'error' && filteredNews.length === 0 ? (
            // ONLY show error if no articles exist
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">News update failed</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  There was an error updating the news feed.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Retry: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /api/ingest</code>
                </p>
              </div>
            </div>
          ) : filteredNews.length === 0 ? (
            // Empty state (no ingestion, no articles for this category)
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">No {category} articles available yet</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  RSS ingestion has not been triggered or no articles match this category.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Trigger ingestion: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /api/ingest</code>
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* NON-BLOCKING UPDATE BANNER - Show existing articles during refresh */}
              {ingestionStatus === 'running' && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                      Updating with latest {category} news… Fresh articles will appear shortly.
                    </p>
                  </div>
                </div>
              )}
              <NewsGrid newsItems={filteredNews} />
            </>
          )}
        </div>
      </main>
      <footer className="w-full border-t border-gray-200 dark:border-white/10 py-8 mt-16">
        <div className="center-container text-center text-sm text-gray-600 dark:text-white/60">
          © 2026 AI Driven Future. Powered by the future.
        </div>
      </footer>
    </div>
  );
}




