import Header from '@/components/Header';
import Ticker from '@/components/Ticker';
import Hero from '@/components/Hero';
import NewsGrid from '@/components/NewsGrid';
import { getNewsData } from '@/lib/rss';
import { NewsItem } from '@/components/NewsCard';

export default async function Home() {
  let newsData: NewsItem[] = [];
  
  try {
    newsData = await getNewsData(20); // Limit to 20 for homepage
  } catch (error) {
    console.error('Error fetching news data:', error);
    // Fallback to empty array - UI will handle gracefully
    newsData = [];
  }

  // Get big story (first item) and trending (next 5 items)
  const bigStory = newsData[0] || null;
  const trending = newsData.slice(1, 6);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-[#EDEDED] transition-colors w-full">
      <Header />
      <Ticker />
      <main className="w-full flex-1 py-8">
        <div className="center-container">
          <Hero bigStory={bigStory} trending={trending} />
          <NewsGrid newsItems={newsData} />
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
