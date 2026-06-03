'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getCoinImage } from '@/lib/coinImages';

interface TickerItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

// Deterministic color from symbol string — gives each coin a unique avatar color
function symbolColor(symbol: string): string {
  const colors = [
    '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981',
    '#ef4444', '#06b6d4', '#f97316', '#6366f1',
    '#ec4899', '#14b8a6', '#84cc16', '#a855f7',
  ];
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Coin avatar — shows image if available, colored initial fallback otherwise
function CoinAvatar({ symbol, name, image }: { symbol: string; name: string; image: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const bg = symbolColor(symbol);
  const initial = symbol.slice(0, 2).toUpperCase();

  if (!image || imgFailed) {
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
        style={{ backgroundColor: bg }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      className="w-7 h-7 rounded-full object-cover shrink-0"
      onError={() => setImgFailed(true)}
    />
  );
}

const CryptoTicker = () => {
  const [data, setData] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/crypto?limit=20');
        const raw = await res.json();
        setData(
          raw.map((item: any) => {
            const sym = (item.symbol || '').toUpperCase();
            const rawImage = typeof item.image === 'string' ? item.image : item.image?.large || '';
            return {
              id:     item.id,
              symbol: sym,
              name:   item.name,
              image:  getCoinImage(sym) || rawImage,
              current_price:               item.current_price ?? item.price ?? 0,
              price_change_percentage_24h: item.price_change_percentage_24h ?? item.percentChange24h ?? 0,
            };
          })
        );
      } catch { /* keep empty */ }
      finally { setLoading(false); }
    };

    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, []);

  const fmtPrice = (p: number) => {
    if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (p >= 1)    return `$${p.toFixed(2)}`;
    return `$${p.toFixed(4)}`;
  };

  if (loading || data.length === 0) {
    return (
      <div className="bg-gray-950 border-b border-gray-800 py-3.5 overflow-hidden">
        <div className="flex items-center gap-2 px-6 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-500 font-medium">Loading live prices...</span>
        </div>
      </div>
    );
  }

  // Triple for seamless infinite loop
  const items = [...data, ...data, ...data];

  return (
    <div className="bg-gray-950 border-b border-gray-800 overflow-hidden relative select-none">

      {/* Left fade + LIVE badge */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center">
        <div className="w-28 bg-gradient-to-r from-gray-950 via-gray-950/90 to-transparent h-full" />
        <div className="absolute left-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Live</span>
        </div>
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-950 to-transparent z-20 pointer-events-none" />

      {/* Scrolling strip */}
      <div className="overflow-hidden sm:pl-24">
        <div className="flex ticker-track py-3">
          {items.map((c, i) => {
            const up = c.price_change_percentage_24h >= 0;
            return (
              <div
                key={`${c.id}-${i}`}
                className="flex items-center gap-3 px-6 shrink-0 border-r border-gray-800/50 hover:bg-white/5 transition-colors cursor-default"
              >
                {/* Coin avatar */}
                <CoinAvatar symbol={c.symbol} name={c.name} image={c.image} />

                {/* Symbol */}
                <span className="text-sm font-bold text-white tracking-wide">{c.symbol}</span>

                {/* Price */}
                <span className="text-sm font-semibold text-gray-200 font-mono">
                  {fmtPrice(c.current_price)}
                </span>

                {/* Change */}
                <span className={`text-sm font-bold flex items-center gap-1 ${up ? 'text-green-400' : 'text-red-400'}`}>
                  {up
                    ? <TrendingUp className="w-3.5 h-3.5" />
                    : <TrendingDown className="w-3.5 h-3.5" />}
                  {Math.abs(c.price_change_percentage_24h).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .ticker-track {
          animation: ticker-move 55s linear infinite;
          width: max-content;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-move {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
};

export default CryptoTicker;
