'use client';

import { useState } from 'react';
import NewsCard, { NewsItem } from './NewsCard';

interface NewsGridProps {
  newsItems?: NewsItem[];
}

export default function NewsGrid({ newsItems = [] }: NewsGridProps) {
  // ⚠️  If no items, show message to trigger ingestion
  if (newsItems.length === 0) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-12">
          <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-12 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-[#EDEDED]">
              No Articles Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              RSS ingestion has not been triggered yet.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 font-mono">
              Trigger ingestion: <code className="bg-white dark:bg-black px-2 py-1 rounded">POST /api/ingest</code>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // ⚠️  Filter to ONLY articles with valid imageUrl
  // If an article has no imageUrl, it's a data error
  const validItems = newsItems.filter(item => {
    const isValid = item.image && item.image.startsWith('http');
    if (!isValid) {
      console.error('❌ DATA ERROR: Article filtered due to missing imageUrl', {
        title: item.title.substring(0, 50),
        link: item.link,
        image: item.image,
      });
    }
    return isValid;
  });
  
  if (validItems.length === 0) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-12">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-12 text-center border-2 border-red-500">
            <h2 className="text-2xl font-bold mb-4 text-red-900 dark:text-red-200">
              ❌ DATA ERROR
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-6">
              All articles are missing imageUrl. Ingestion failed.
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-mono">
              Check ingestion logs for errors
            </p>
          </div>
        </div>
      </div>
    );
  }
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setIsSuccess(false);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setEmail('');
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        console.error('Subscription error:', data.error);
        alert(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-12">
        {validItems.slice(0, 6).map((item, index) => (
          <NewsCard key={index} news={item} />
        ))}

        {/* Growth Feature 1: Newsletter Signup (7th item) */}
        <div className="bg-gradient-to-br from-[#0070F3]/20 to-purple-500/20 backdrop-blur-sm border border-[#0070F3]/50 dark:border-[#0070F3]/50 border-blue-200 rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-md dark:shadow-none">
          <div className="text-4xl mb-4">📬</div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-[#EDEDED]">Stay Ahead of the Curve</h3>
          <p className="text-gray-600 dark:text-white/70 mb-6 text-sm">
            Get the latest AI news delivered to your inbox every morning.
          </p>
          {isSuccess ? (
            <div className="w-full text-center py-4">
              <p className="text-lg font-medium text-gray-900 dark:text-[#EDEDED]">Welcome aboard! 🚀</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="w-full">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 mb-3 text-sm focus:outline-none focus:border-[#0070F3] transition-colors text-gray-900 dark:text-[#EDEDED] placeholder-gray-500 dark:placeholder-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0070F3] hover:bg-[#0070F3]/90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Joining...' : 'Subscribe Now'}
              </button>
            </form>
          )}
        </div>

        {validItems.slice(6, 12).map((item, index) => (
          <NewsCard key={index + 6} news={item} />
        ))}
      </div>

    </div>
  );
}

