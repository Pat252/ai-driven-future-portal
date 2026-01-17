'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface NewsItem {
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  image: string;  // REQUIRED: Must be assigned during RSS ingestion
  readTime: string;
  author: string;
  link: string;
  source: string; // Source name (e.g., "TechCrunch", "MIT Tech Review")
  pubDate: Date | null; // Actual publication date for sorting
}

/**
 * Format article timestamp using hybrid display logic:
 * - If < 24 hours ago: "X hours ago"
 * - If ≥ 24 hours ago: "Jan 16, 2026"
 * 
 * Uses article's pubDate (NOT ingestion time).
 * Timezone-safe, deterministic, accurate.
 */
export function formatArticleTime(pubDate: Date | null | string): string {
  // Handle null/undefined
  if (!pubDate) return 'Recently';
  
  // Convert to Date if string (from JSON deserialization)
  const date = typeof pubDate === 'string' ? new Date(pubDate) : pubDate;
  
  // Validate date
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Recently';
  }
  
  // Calculate hours since publication (no libraries, pure math)
  const now = Date.now();
  const publishedMs = date.getTime();
  const ageMs = now - publishedMs;
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60)); // milliseconds → hours
  
  // Guard against future dates or negative values
  if (ageHours < 0) return 'Recently';
  
  // If less than 24 hours, show "X hours ago"
  if (ageHours < 24) {
    // Handle edge case: 0 hours = "Less than an hour ago"
    if (ageHours === 0) return 'Less than an hour ago';
    return `${ageHours} hour${ageHours === 1 ? '' : 's'} ago`;
  }
  
  // If 24+ hours, show formatted date: "Jan 16, 2026"
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

interface NewsCardProps {
  news: NewsItem;
}

export default function NewsCard({ news }: NewsCardProps) {
  // ⚠️ CRITICAL: imageUrl MUST exist - assigned during RSS ingestion
  // If this throws, it's a DATA ERROR - ingestion failed
  if (!news.image || !news.image.startsWith('http')) {
    console.error('❌ DATA ERROR: Article missing imageUrl', {
      title: news.title.substring(0, 50),
      link: news.link,
      image: news.image,
    });
    throw new Error(`Missing or invalid imageUrl for article: "${news.title.substring(0, 50)}..."`);
  }
  
  const [imgSrc, setImgSrc] = useState(news.image);
  const link = news.link || '#';
  
  const handleImageError = () => {
    console.error(`❌ Image failed to load: ${imgSrc} for article: ${news.title.substring(0, 50)}`);
    // DO NOT use fallback - this is a critical error
    // Keep the broken image to make the issue visible
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
          quality={75}
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
          <span>{formatArticleTime(news.pubDate)}</span>
        </div>
      </div>
    </a>
  );
}

