'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface NewsItem {
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  image: string;
  readTime: string;
  author: string;
  link: string;
}

interface NewsCardProps {
  news: NewsItem;
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

export default function NewsCard({ news }: NewsCardProps) {
  const [imgSrc, setImgSrc] = useState(news.image || FALLBACK_POOL[0]);
  const link = news.link || '#';
  
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
          onError={() => setImgSrc(FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)])}
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
          <span>{news.author}</span>
          <span>{news.readTime}</span>
        </div>
      </div>
    </a>
  );
}

