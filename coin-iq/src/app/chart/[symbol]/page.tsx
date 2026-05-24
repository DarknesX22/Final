'use client';

import { motion } from '@/components/providers';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useTopCryptos } from '@/hooks/useCryptoData';
import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3 } from 'lucide-react';

interface ChartDataPoint {
  timestamp: number;
  price: number;
}

export default function ChartPage({ params }: { params: { symbol: string } }) {
  const { cryptos, loading } = useTopCryptos(50);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '1y'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  const crypto = cryptos.find(c => c.symbol.toLowerCase() === params.symbol.toLowerCase());

  useEffect(() => {
    if (crypto) {
      generateChartData();
    }
  }, [crypto, timeRange]);

  const generateChartData = () => {
    setIsLoading(true);
    
    const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 12;
    const data: ChartDataPoint[] = [];
    const basePrice = crypto?.price || 1000;
    const now = Date.now();
    
    for (let i = points; i >= 0; i--) {
      let timestamp: number;
      if (timeRange === '24h') {
        timestamp = now - (i * 60 * 60 * 1000);
      } else if (timeRange === '7d') {
        timestamp = now - (i * 24 * 60 * 60 * 1000);
      } else if (timeRange === '30d') {
        timestamp = now - (i * 24 * 60 * 60 * 1000);
      } else {
        timestamp = now - (i * 30 * 24 * 60 * 60 * 1000);
      }
      
      const volatility = timeRange === '24h' ? 0.02 : timeRange === '7d' ? 0.05 : 0.1;
      const price = basePrice * (1 + (Math.random() - 0.5) * volatility * (i / points));
      
      data.push({ timestamp, price });
    }
    
    setChartData(data);
    setTimeout(() => setIsLoading(false), 500);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${value.toFixed(6)}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeRange === '24h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '7d' || timeRange === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  if (loading || !crypto) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="h-16"></div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        </div>
      </div>
    );
  }

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="h-16"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button & Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Coins
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                {crypto.image && typeof crypto.image === 'string' && crypto.image.startsWith('http') ? (
                  <img 
                    src={crypto.image} 
                    alt={crypto.name} 
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl font-bold text-gray-600">${crypto.symbol.substring(0, 2).toUpperCase()}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-600">{crypto.symbol.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{crypto.name}</h1>
                <p className="text-gray-500">{crypto.symbol.toUpperCase()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{formatCurrency(crypto.price)}</p>
              <div className={`flex items-center justify-end gap-2 mt-1 ${
                crypto.percentChange24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {crypto.percentChange24h >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="text-lg font-semibold">
                  {crypto.percentChange24h >= 0 ? '+' : ''}{crypto.percentChange24h?.toFixed(2)}%
                </span>
                <span className="text-sm text-gray-500">(24h)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chart Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 mb-6"
        >
          {/* Time Range Selector */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Price Chart</h2>
            <div className="flex gap-2">
              {(['24h', '7d', '30d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative h-96">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : chartData.length > 0 ? (
              <svg className="w-full h-full" viewBox={`0 0 ${chartData.length * 20} 400`}>
                {/* Grid Lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={i * 100}
                    x2={chartData.length * 20}
                    y2={i * 100}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}
                
                {/* Price Line */}
                <polyline
                  fill="none"
                  stroke={crypto.percentChange24h >= 0 ? '#10b981' : '#ef4444'}
                  strokeWidth="3"
                  points={chartData.map((point, i) => {
                    const x = i * 20;
                    const y = 380 - ((point.price - minPrice) / priceRange) * 360;
                    return `${x},${y}`;
                  }).join(' ')}
                />
                
                {/* Data Points */}
                {chartData.map((point, i) => {
                  const x = i * 20;
                  const y = 380 - ((point.price - minPrice) / priceRange) * 360;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="4" fill="white" stroke={crypto.percentChange24h >= 0 ? '#10b981' : '#ef4444'} strokeWidth="2" />
                      <title>{`${formatDate(point.timestamp)}: ${formatCurrency(point.price)}`}</title>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No chart data available
              </div>
            )}
          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between mt-4 text-xs text-gray-500">
            {chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0).map((point, i) => (
              <span key={i}>{formatDate(point.timestamp)}</span>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Market Cap</span>
            </div>
            <p className="text-2xl font-bold">${(crypto.marketCap / 1e9).toFixed(2)}B</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">Volume (24h)</span>
            </div>
            <p className="text-2xl font-bold">${(crypto.volume24h / 1e6).toFixed(2)}M</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Rank</span>
            </div>
            <p className="text-2xl font-bold">#{cryptos.indexOf(crypto) + 1}</p>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
