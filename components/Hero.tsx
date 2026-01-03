'use client';

import { useState } from 'react';
import Image from 'next/image';
import { NewsItem } from './NewsCard';

interface HeroProps {
  bigStory: NewsItem | null;
  trending: NewsItem[];
}

// Fallback image pool for robust error handling
const FALLBACK_POOL = [
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80', // AI/Robotics
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80', // AI Tech
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80', // Neural Networks
  'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=400&q=80', // Circuits
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', // Technology
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80', // Futuristic
];

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
  source: 'Editorial Team',
  pubDate: new Date(),
};

// TrendingItem component with robust image fallback
function TrendingItem({ item }: { item: NewsItem; index: number; isLast: boolean }) {
  const [imgSrc, setImgSrc] = useState(item.image || FALLBACK_POOL[0]);

  return (
    <a
      href={item.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block group cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors -mx-3"
    >
      <div className="flex flex-row gap-4">
        {/* Thumbnail with Robust Fallback */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-white/10">
          <Image
            src={imgSrc}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgSrc(FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)])}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className={`inline-block ${item.categoryColor} text-white text-xs px-2 py-0.5 rounded-full mb-2`}>
            {item.category}
          </span>
          <h3 className="text-base font-semibold group-hover:text-[#0070F3] transition-colors leading-tight text-gray-900 dark:text-[#EDEDED] line-clamp-2">
            {item.title}
          </h3>
        </div>
      </div>
    </a>
  );
}

export default function Hero({ bigStory, trending }: HeroProps) {
  const story = bigStory || fallbackBigStory;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-20">
      {/* Big Story - Left 66% */}
      <div className="lg:col-span-2 h-full">
        <a 
          href={story.link || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative block h-full rounded-xl overflow-hidden group cursor-pointer shadow-2xl hover:shadow-3xl transition-all"
        >
          {/* Background Image - Covers Entire Card */}
          <div className="absolute inset-0 z-0">
            <Image
              src={story.image}
              alt={story.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-10"></div>

          {/* Glassmorphism Category Tag */}
          <div className="absolute top-4 left-4 z-20">
            <span className={`inline-block ${story.categoryColor}/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg border border-white/20`}>
              {story.category}
            </span>
          </div>

          {/* Text Content - Positioned at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-white group-hover:text-[#0070F3] transition-colors">
              {story.title}
            </h1>
            <p className="text-gray-200 text-base md:text-lg leading-relaxed line-clamp-2 mb-4">
              {story.description}
            </p>
            <div className="flex items-center text-sm text-gray-300">
              <span>{story.readTime}</span>
              <span className="mx-2">•</span>
              <span>{story.author}</span>
            </div>
          </div>
        </a>
      </div>

      {/* Trending - Right 33% */}
      <div className="lg:col-span-1 h-full">
        <div className="h-full flex flex-col bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md dark:shadow-none">
          {/* Live Market Pulse Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="relative flex h-8 w-8 items-center justify-center">
              {/* The Ping Animation (Radar Effect) */}
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-20"></span>
              
              {/* The Background Circle */}
              <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                {/* The Rising Graph Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M15.22 6.268a.75.75 0 01.968-.432l5.942 2.28a.75.75 0 01.431.97l-2.28 5.941a.75.75 0 11-1.44-.512l1.273-3.317-6.126 5.208a.75.75 0 01-1.023-.056L9.61 12.872l-5.385 5.385a.75.75 0 11-1.061-1.061l6.094-6.094a.75.75 0 011.023.06l3.29 3.636 5.09-4.33-3.32-1.273a.75.75 0 01-.432-.969z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* The Gradient Text */}
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Trending Now
            </h2>
          </div>
          <div className="flex-1 flex flex-col justify-between py-2">
            {trending.length > 0 ? (
              trending.slice(0, 5).map((item, index, arr) => (
                <TrendingItem
                  key={index}
                  item={item}
                  index={index}
                  isLast={index === arr.length - 1}
                />
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

