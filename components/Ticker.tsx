'use client';
import { useEffect, useState } from 'react';

type TickerItem = {
  label: string;
  value: string;
  change: string;
  isNegative: boolean;
  isLive?: boolean;
};

export default function Ticker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  // 1. FETCH LIVE CRYPTO (CoinGecko)
  const fetchCrypto = async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,fetch-ai&vs_currencies=usd&include_24hr_change=true'
      );
      const data = await res.json();

      return [
        {
          label: 'BTC',
          value: `$${data.bitcoin.usd.toLocaleString()}`,
          change: `${data.bitcoin.usd_24h_change.toFixed(2)}%`,
          isNegative: data.bitcoin.usd_24h_change < 0,
          isLive: true,
        },
        {
          label: 'FET (ASI Alliance)', 
          value: `$${data['fetch-ai'].usd.toFixed(2)}`,
          change: `${data['fetch-ai'].usd_24h_change.toFixed(2)}%`,
          isNegative: data['fetch-ai'].usd_24h_change < 0,
          isLive: true,
        },
      ];
    } catch (error) {
      console.error('Crypto Fetch Error:', error);
      return [];
    }
  };

  // 2. FETCH LIVE STOCKS (Finnhub)
  const fetchStock = async (symbol: string, name: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
      if (!apiKey) return null;

      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
      );
      const data = await res.json();
      
      if (!data.c) return null;
      
      return {
        label: name,
        value: `$${data.c.toFixed(2)}`,
        change: `${data.dp.toFixed(2)}%`,
        isNegative: data.dp < 0,
        isLive: true,
      };
    } catch (error) {
      return null;
    }
  };

  const updateTicker = async () => {
    // A. Fetch Live Data
    const cryptoItems = await fetchCrypto();
    const nvda = await fetchStock('NVDA', 'NVIDIA');
    
    // B. Define Editorial/News Lines
    const editorialItems: TickerItem[] = [
      {
        label: 'BREAKING',
        value: "OpenAI 'Operator' Agent Leaked",
        change: 'Rumor',
        isNegative: false,
      },
      {
        label: 'INDUSTRY ALERT',
        value: 'HBM3e Chip Supply Sold Out',
        change: '2027 Delay',
        isNegative: true,
      },
      {
        label: 'CES 2026',
        value: 'Gemini 3.0 Flash Launch',
        change: 'Confirmed',
        isNegative: false,
      }
    ];

    // C. Combine
    const newItems: TickerItem[] = [];
    
    if (nvda) newItems.push(nvda);
    newItems.push(editorialItems[0]); 
    newItems.push(...cryptoItems);
    newItems.push(editorialItems[1]);
    newItems.push(editorialItems[2]);

    setItems(newItems);
  };

  useEffect(() => {
    updateTicker();
    const interval = setInterval(updateTicker, 60000); 
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  return (
    // CONTAINER: ADAPTIVE COLORS (Silver Track in Light Mode / Black in Dark Mode)
    <div className="w-full bg-gray-100 dark:bg-black border-b border-gray-300 dark:border-white/10 overflow-hidden z-50 h-10 flex items-center transition-colors duration-300">
      <div className="relative flex w-full">
        <div className="animate-scroll flex whitespace-nowrap hover:pause">
          {[...items, ...items, ...items, ...items].map((item, index) => (
            <div key={index} className="inline-flex items-center text-sm mx-8">
              {/* LIVE DOT: Green Pulse */}
              {item.isLive ? (
                <span className="relative flex h-2 w-2 mr-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full mr-3 bg-blue-500"></span>
              )}
              
              {/* LABEL: Adaptive Text (Gray-500 in Light / Gray-400 in Dark) */}
              <span className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mr-2 text-[10px]">
                {item.label}
              </span>
              
              {/* VALUE: Adaptive Text (Black in Light / White in Dark) */}
              <span className="font-bold text-gray-900 dark:text-white mr-1">
                {item.value}
              </span>
              
              {/* CHANGE: Green/Red is always visible on both */}
              <span className={`text-[10px] font-bold ${item.isNegative ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'}`}>
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .animate-scroll {
          animation: scroll 35s linear infinite;
        }
        .hover\:pause:hover {
          animation-play-state: paused;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
