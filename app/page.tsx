import Header from '@/components/Header';
import Ticker from '@/components/Ticker';
import Hero from '@/components/Hero';
import NewsGrid from '@/components/NewsGrid';
import { getCachedNewsData } from '@/lib/cache';
import { getIngestionStatus } from '@/lib/ingestion-status';

// Force dynamic rendering (no static generation, no ISR)
export const dynamic = 'force-dynamic';

/**
 * ⚠️  CRITICAL: This page ONLY renders precomputed data.
 * It NEVER calls RSS ingestion or image selection.
 * 
 * RSS ingestion happens via: POST /api/ingest
 * Articles are read from file system cache (.cache/news-data.json)
 */

export default async function Home() {
  // Check ingestion status FIRST
  const ingestionStatus = getIngestionStatus();
  console.log(`[PAGE] Ingestion status: ${ingestionStatus}`);
  
  // FETCH FROM R2: Read articles from persistent R2 storage
  // No RSS fetching, no AI calls, no image selection
  const allNewsData = await getCachedNewsData();
  
  // ⚠️ CRITICAL: Filter to ONLY articles with valid imageUrl
  // If an article has no imageUrl, it's a DATA ERROR from ingestion
  const validNewsData = allNewsData.filter(item => {
    const isValid = item.image && item.image.startsWith('http');
    if (!isValid && process.env.NODE_ENV !== 'production') {
      console.error('❌ DATA ERROR: Homepage filtered article missing imageUrl', {
        title: item.title.substring(0, 50),
        link: item.link,
        image: item.image,
      });
    }
    return isValid;
  });

  // Deduplicate images at render time: prefer articles with unique image URLs
  const seenImages = new Set<string>();
  const newsData: typeof validNewsData = [];
  for (const item of validNewsData) {
    if (newsData.length >= 20) break;
    if (!seenImages.has(item.image)) {
      seenImages.add(item.image);
      newsData.push(item);
    } else if (newsData.length < 20) {
      // Allow duplicates if unique images exhausted
      newsData.push(item);
    }
  }

  // Dev log: Verify each article has unique image
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[HOME] Rendering ${newsData.length} articles (filtered from ${allNewsData.length})`);
    if (newsData.length > 0) {
      const uniqueImages = new Set(newsData.map(item => item.image));
      console.log(`[HOME] Unique image URLs: ${uniqueImages.size} / ${newsData.length}`);
      if (uniqueImages.size < newsData.length) {
        console.warn(`⚠️  WARNING: Duplicate images detected! ${uniqueImages.size} unique / ${newsData.length} total`);
      }
    }
  }

  const bigStory = newsData[0] || null;
  const trending = newsData.slice(1, 6);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-[#EDEDED] transition-colors w-full">
      <Header />
      <Ticker />
      <main className="w-full flex-1 py-8 pb-16">
        <div className="center-container">
          {/* STATE-AWARE RENDERING */}
          {ingestionStatus === 'running' && newsData.length === 0 ? (
            // ONLY show spinner if cache is empty during ingestion
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0070F3] mb-4"></div>
                <h2 className="text-2xl font-bold mb-2">Loading latest news…</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Fetching fresh AI news. This may take 10-20 seconds.
                </p>
              </div>
            </div>
          ) : ingestionStatus === 'error' && newsData.length === 0 ? (
            // ONLY show error if cache is empty
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
          ) : newsData.length === 0 ? (
            // Empty state (no ingestion running, no cache)
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">No articles available yet</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  RSS ingestion has not been triggered.
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
                      Updating with latest news… Fresh articles will appear shortly.
                    </p>
                  </div>
                </div>
              )}
              <Hero bigStory={bigStory} trending={trending} />
              <NewsGrid newsItems={newsData} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
