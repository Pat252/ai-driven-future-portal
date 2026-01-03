import Header from '@/components/Header';
import Ticker from '@/components/Ticker';
import NewsGrid from '@/components/NewsGrid';
import { getNewsData } from '@/lib/rss';
import { NewsItem } from '@/components/NewsCard';

// Map URL slugs to category names
const slugToCategory: Record<string, string> = {
  'breaking-ai': 'Breaking AI',
  'ai-economy': 'AI Economy',
  'creative-tech': 'Creative Tech',
  'toolbox': 'Toolbox',
};

// Map category names to display titles
const categoryToTitle: Record<string, string> = {
  'Breaking AI': 'Latest News in Breaking AI',
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



