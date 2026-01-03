import Header from '@/components/Header';
import Ticker from '@/components/Ticker';
import Hero from '@/components/Hero';
import NewsGrid from '@/components/NewsGrid';
import { getNewsData } from '@/lib/rss';
import { NewsItem } from '@/components/NewsCard';

// Revalidate every hour (3600 seconds) - ISR
export const revalidate = 3600;

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
      <main className="w-full flex-1 py-8 pb-16">
        <div className="center-container">
          <Hero bigStory={bigStory} trending={trending} />
          <NewsGrid newsItems={newsData} />
        </div>
      </main>
    </div>
  );
}
