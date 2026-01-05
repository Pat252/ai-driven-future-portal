'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getDefaultPlaceholder } from '@/lib/image-utils';

export interface NewsItem {
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  image: string;
  readTime: string;
  author: string;
  link: string;
  source: string; // Source name (e.g., "TechCrunch", "MIT Tech Review")
  pubDate: Date | null; // Actual publication date for sorting
}

interface NewsCardProps {
  news: NewsItem;
}

export default function NewsCard({ news }: NewsCardProps) {
  // ============================================================================
  // 100% LOCAL-ONLY STRATEGY
  // ============================================================================
  // - ALL images are local (from /public/assets/images/)
  // - NO external fetching
  // - NO Unsplash, no RSS scraping
  // - Simple fallback: Local category image → Default placeholder
  // ============================================================================
  
  // Final UI fallback: Validate image path before use
  // Treat article.image as untrusted - ensure it's a valid /assets/ path
  const defaultFallback = getDefaultPlaceholder();
  const safeImagePath = news.image && news.image.startsWith('/assets/') 
    ? news.image 
    : '/assets/images/all/ai-robot-future-technology.jpg.svg';
  const [imgSrc, setImgSrc] = useState(safeImagePath);
  const link = news.link || '#';
  
  // Simple fallback: If local image fails, use default placeholder
  const handleImageError = () => {
    if (imgSrc !== defaultFallback) {
      console.log('[NewsCard] Image failed, using default placeholder');
      setImgSrc(defaultFallback);
    }
  };

  return (
    <a 
      href={link} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden group cursor-pointer hover:border-[#0070F3]/50 dark:hover:border-[#0070F3]/50 shadow-md dark:shadow-none transition-all hover:transform hover:scale-[1.02]"
    >
      <div className="relative h-48 bg-gradient-to-br from-[#0070F3]/10 to-purple-500/10">
        <Image
          src={imgSrc}
          alt={news.title}
          fill
          className="object-cover opacity-70 group-hover:opacity-100 transition-opacity"
          onError={handleImageError}
          loading="lazy"
          quality={85}
          unoptimized={imgSrc.endsWith('.svg')}
        />
        {/* Glassmorphism Category Tag */}
        <div className="absolute top-3 left-3">
          <span className={`inline-block ${news.categoryColor}/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg border border-white/20`}>
            {news.category}
          </span>
        </div>
      </div>
      <div className="p-8">
        <h3 className="text-xl font-bold mb-6 group-hover:text-[#0070F3] transition-colors line-clamp-2 leading-relaxed text-gray-900 dark:text-[#EDEDED]">
          {news.title}
        </h3>
        <p className="text-gray-600 dark:text-white/60 text-sm mb-4 line-clamp-2">
          {news.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/50">
          <span>
            {news.author && news.author !== news.source ? `By ${news.author} | ` : ''}{news.source}
          </span>
          <span>{news.readTime}</span>
        </div>
      </div>
    </a>
  );
}

