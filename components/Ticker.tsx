'use client';
import { useEffect, useState } from 'react';

type TickerItem = {
  label: string;
  value: string;
  change?: string; // e.g. "+5.2%"
  isLive?: boolean; // Green dot for live data
  isNegative?: boolean; // Red text if stock is down
};

export default function Ticker() {
  // Initial State: Starts with your static news while data loads
  const [items, setItems] = useState<TickerItem[]>([
    // --- STATIC "AI CULTURE" METRICS ---
    { label: 'Arena Leader', value: 'Claude 3.5 Sonnet' },
    { label: 'H100 Spot Price', value: '~$25,000' },
    { label: 'Voxyte Waitlist', value: '1,245' },
    { label: 'Global Compute', value: 'Shortage Critical' },
    { label: 'GPT-5', value: 'Rumored Q4 2025' },
  ]);

  // 1. Fetch Real Crypto Data (CoinGecko - No Key Needed)
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
          change: `${data.bitcoin.usd_24h_change.toFixed(1)}%`,
          isLive: true,
          isNegative: data.bitcoin.usd_24h_change < 0,
        },
        {
          label: 'FET (AI)',
          value: `$${data['fetch-ai'].usd}`,
          change: `${data['fetch-ai'].usd_24h_change.toFixed(1)}%`,
          isLive: true,
          isNegative: data['fetch-ai'].usd_24h_change < 0,
        },
      ];
    } catch (error) {
      console.error('Crypto Fetch Error:', error);
      return [];
    }
  };

  // 2. Fetch Real Stock Data (Finnhub - Uses Key)
  const fetchStock = async (symbol: string, name: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
      if (!apiKey) return null;

      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
      );
      const data = await res.json();
      // Finnhub returns 'c' for Current Price, 'dp' for Percent Change
      if (!data.c) return null;
      return {
        label: name,
        value: `$${data.c.toFixed(2)}`,
        change: `${data.dp.toFixed(1)}%`,
        isLive: true,
        isNegative: data.dp < 0,
      };
    } catch (error) {
      console.error('Stock Fetch Error:', error);
      return null;
    }
  };

  // 3. Master Update Function
  const updateTicker = async () => {
    // Run fetches in parallel for speed
    const cryptoItems = await fetchCrypto();
    const nvdaItem = await fetchStock('NVDA', 'Nvidia');
    const msftItem = await fetchStock('MSFT', 'Microsoft');

    const newLiveItems = [...cryptoItems];
    if (nvdaItem) newLiveItems.push(nvdaItem);
    if (msftItem) newLiveItems.push(msftItem);

    // Merge: Live items first, then preserve the static items
    setItems((prev) => {
      const staticItems = prev.filter((i) => !i.isLive);
      return [...newLiveItems, ...staticItems];
    });
  };

  // 4. Effect Loop: Run on mount + Every 1 Hour
  useEffect(() => {
    updateTicker(); // Run instantly on load

    const ONE_HOUR = 3600000;
    const interval = setInterval(updateTicker, ONE_HOUR);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 overflow-hidden transition-colors">
      <div className="relative flex">
        <div className="animate-scroll flex whitespace-nowrap">
          {/* Duplicate items 3x for seamless loop */}
          {[...items, ...items, ...items].map((item, index) => (
            <div key={index} className="inline-flex items-center text-sm mx-8">
              {/* Status Dot: Green Pulse (Live) or Blue Static */}
              <span
                className={`w-1.5 h-1.5 rounded-full mr-3 ${
                  item.isLive
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-blue-500'
                }`}
              ></span>
              {/* Label */}
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-2">
                {item.label}:
              </span>
              {/* Value */}
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {item.value}
              </span>
              {/* Change Indicator (Green or Red) */}
              {item.change && (
                <span
                  className={`ml-1 text-xs ${
                    item.isNegative ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  ({item.change})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
