'use client';

export default function Ticker() {
  const tickerItems = [
    'Voxyte Waitlist: 1,245',
    'NVDA: $135.50',
    'GPT-5: Rumored for Q4',
    'AI Index: +12.3%',
    'Tesla Bot: Production Started',
    'Anthropic: New Model Launch',
  ];

  return (
    <div className="w-full bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 overflow-hidden transition-colors">
      <div className="center-container py-2">
        <div className="relative flex">
          <div className="animate-scroll flex whitespace-nowrap">
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
              <span key={index} className="inline-flex items-center text-sm mx-8 text-gray-700 dark:text-[#EDEDED]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0070F3] mr-3"></span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

