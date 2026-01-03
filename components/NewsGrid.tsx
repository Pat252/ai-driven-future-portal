'use client';

import { useState } from 'react';
import NewsCard, { NewsItem } from './NewsCard';

interface NewsGridProps {
  newsItems?: NewsItem[];
}

// Fallback dummy data
const fallbackNewsItems: NewsItem[] = [
    {
      title: 'Anthropic Claude 4 Outperforms Human Experts in Medical Diagnosis',
      description: 'Latest benchmarks show Claude 4 achieving 98% accuracy in complex medical case analysis.',
      category: 'Breaking AI',
      categoryColor: 'bg-red-500',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80',
      readTime: '5 min',
      author: 'Sarah Chen',
      link: '#',
    },
    {
      title: 'AI-Generated Movies Hit $1B Box Office Milestone',
      description: 'The first fully AI-generated feature film breaks records worldwide.',
      category: 'Creative Tech',
      categoryColor: 'bg-purple-500',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80',
      readTime: '6 min',
      author: 'Marcus Webb',
      link: '#',
    },
    {
      title: 'Tesla Optimus Robots Now Working in 500+ Warehouses',
      description: 'Humanoid robots are revolutionizing logistics and manufacturing sectors.',
      category: 'AI Economy',
      categoryColor: 'bg-green-500',
      image: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=500&q=80',
      readTime: '7 min',
      author: 'Alex Kumar',
      link: '#',
    },
    {
      title: 'AI Tutors Now Standard in 10,000+ Schools Globally',
      description: 'Personalized learning powered by AI is transforming education outcomes.',
      category: 'Future Life',
      categoryColor: 'bg-blue-500',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80',
      readTime: '4 min',
      author: 'Emma Liu',
      link: '#',
    },
    {
      title: 'LangChain 2.0: The Ultimate Framework for AI Apps',
      description: 'New version brings 10x performance improvements and easier integration.',
      category: 'Toolbox',
      categoryColor: 'bg-orange-500',
      image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=500&q=80',
      readTime: '8 min',
      author: 'Dev Singh',
      link: '#',
    },
    {
      title: 'Microsoft Copilot Now Writes 40% of Production Code',
      description: 'Developer productivity skyrockets with AI pair programming assistance.',
      category: 'Toolbox',
      categoryColor: 'bg-orange-500',
      image: 'https://images.unsplash.com/photo-1607706189992-eae578626c86?w=500&q=80',
      readTime: '5 min',
      author: 'Ryan Park',
      link: '#',
    },
    {
      title: 'AI Discovers New Antibiotics That Kill Superbugs',
      description: 'Machine learning models identify compounds that defeated drug-resistant bacteria.',
      category: 'Breaking AI',
      categoryColor: 'bg-red-500',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500&q=80',
      readTime: '6 min',
      author: 'Dr. Lisa Wang',
      link: '#',
    },
    {
      title: 'Runway Gen-4: Create Hollywood-Quality Videos from Text',
      description: 'Latest AI video generator produces 4K content indistinguishable from reality.',
      category: 'Creative Tech',
      categoryColor: 'bg-purple-500',
      image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500&q=80',
      readTime: '5 min',
      author: 'Jordan Blake',
      link: '#',
    },
    {
      title: 'AI-Powered Smart Homes Cut Energy Usage by 60%',
      description: 'Neural networks optimize every aspect of home energy consumption.',
      category: 'Future Life',
      categoryColor: 'bg-blue-500',
      image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=500&q=80',
      readTime: '4 min',
      author: 'Nina Patel',
      link: '#',
    },
    {
      title: 'Goldman Sachs: AI Will Add $7 Trillion to Global GDP',
      description: 'New report forecasts massive economic transformation driven by AI.',
      category: 'AI Economy',
      categoryColor: 'bg-green-500',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80',
      readTime: '7 min',
      author: 'Michael Torres',
      link: '#',
    },
    {
      title: 'Cursor IDE: GitHub Copilot Killer Reaches 5M Users',
      description: 'AI-first code editor disrupts development tools market.',
      category: 'Toolbox',
      categoryColor: 'bg-orange-500',
      image: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=500&q=80',
      readTime: '6 min',
      author: 'Chris Anderson',
      link: '#',
    },
    {
      title: 'Neuralink Patient Controls Computer with 95% Accuracy',
      description: 'Brain-computer interface achieves remarkable milestone in human trials.',
      category: 'Breaking AI',
      categoryColor: 'bg-red-500',
      image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&q=80',
      readTime: '8 min',
      author: 'Dr. James Wilson',
      link: '#',
    },
];

export default function NewsGrid({ newsItems = [] }: NewsGridProps) {
  const items = newsItems.length > 0 ? newsItems : fallbackNewsItems;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {items.slice(0, 6).map((item, index) => (
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

        {items.slice(6, 12).map((item, index) => (
          <NewsCard key={index + 6} news={item} />
        ))}
      </div>

    </div>
  );
}

