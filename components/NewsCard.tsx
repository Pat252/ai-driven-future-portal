'use client';

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

export default function NewsCard({ news }: NewsCardProps) {
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
          src={news.image}
          alt={news.title}
          fill
          className="object-cover opacity-70 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <div className="p-8">
        <span className={`inline-block ${news.categoryColor} text-white text-xs px-3 py-1 rounded-full mb-4`}>
          {news.category}
        </span>
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

