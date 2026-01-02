'use client';

import Image from 'next/image';
import { NewsItem } from './NewsCard';

interface HeroProps {
  bigStory: NewsItem | null;
  trending: NewsItem[];
}

// Fallback data
const fallbackBigStory: NewsItem = {
  title: 'OpenAI Unveils GPT-5: The Dawn of True AGI',
  description: 'In a surprise announcement, OpenAI revealed GPT-5 with breakthrough reasoning capabilities that surpass human-level performance across multiple domains.',
  category: 'Breaking AI',
  categoryColor: 'bg-red-500',
  image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  readTime: '8 min',
  author: 'Editorial Team',
  link: '#',
};

export default function Hero({ bigStory, trending }: HeroProps) {
  const story = bigStory || fallbackBigStory;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
      {/* Big Story - Left 66% */}
      <div className="lg:col-span-2">
        <a 
          href={story.link || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden group cursor-pointer hover:border-[#0070F3]/50 dark:hover:border-[#0070F3]/50 shadow-md dark:shadow-none transition-all"
        >
          <div className="relative h-64 md:h-96 bg-gradient-to-br from-[#0070F3]/20 to-purple-500/20">
            <Image
              src={story.image}
              alt={story.title}
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="p-6">
            <span className={`inline-block ${story.categoryColor} text-white text-xs px-3 py-1 rounded-full mb-3`}>
              {story.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 group-hover:text-[#0070F3] transition-colors text-gray-900 dark:text-[#EDEDED]">
              {story.title}
            </h1>
            <p className="text-gray-600 dark:text-white/70 mb-4 text-lg">
              {story.description}
            </p>
            <div className="flex items-center text-sm text-gray-500 dark:text-white/50">
              <span>{story.readTime}</span>
              <span className="mx-2">•</span>
              <span>{story.author}</span>
            </div>
          </div>
        </a>
      </div>

      {/* Trending - Right 33% */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md dark:shadow-none">
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900 dark:text-[#EDEDED]">
            <span className="text-2xl mr-2">🔥</span> Trending Now
          </h2>
          <div className="space-y-6">
            {trending.length > 0 ? (
              trending.map((item, index) => (
                <a
                  key={index}
                  href={item.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors -mx-3"
                >
                  <span className={`inline-block ${item.categoryColor} text-white text-xs px-2 py-0.5 rounded-full mb-2`}>
                    {item.category}
                  </span>
                  <h3 className="text-sm font-medium group-hover:text-[#0070F3] transition-colors leading-snug text-gray-900 dark:text-[#EDEDED]">
                    {item.title}
                  </h3>
                  {index < trending.length - 1 && (
                    <div className="border-b border-gray-200 dark:border-white/10 mt-4"></div>
                  )}
                </a>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-white/50">Loading trending articles...</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

