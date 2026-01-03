import Header from '@/components/Header';
import Ticker from '@/components/Ticker';
import NewsGrid from '@/components/NewsGrid';
import MarketOverview from '@/components/MarketOverview';
import { getNewsData } from '@/lib/rss';
import { NewsItem } from '@/components/NewsCard';

// Revalidate every hour (3600 seconds) - ISR
export const revalidate = 3600;

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

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = slugToCategory[slug] || 'Breaking AI';
  const pageTitle = categoryToTitle[category] || 'Latest News';

  let allNews: NewsItem[] = [];
  
  try {
    allNews = await getNewsData();
  } catch (error) {
    console.error('Error fetching news data:', error);
    allNews = [];
  }

  // Filter news by category
  const filteredNews = allNews.filter(item => item.category === category);

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
          
          <NewsGrid newsItems={filteredNews} />
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




