"use client";

import { motion } from '@/components/providers';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PredictionPreview from '@/components/prediction-preview';
import { AnimatedStatCard } from '@/components/ui/AnimatedStatCard';
import { CryptoIcon } from '@/components/ui/icons/CryptoIcon';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import CryptoTicker from '@/components/CryptoTicker';
import InfiniteTestimonials from '@/components/InfiniteTestimonials';
import CandlestickChart from '@/components/charts/candlestick-chart';
import LineChart from '@/components/charts/line-chart';
import RiskAssessment from '@/components/charts/risk-assessment';
import AuthModal from '@/components/AuthModal';
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ── Auth gate hook — checks if user is logged in ──────────────────────────────
function useAuth() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = loading
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);
  return authed;
}

// ── Live prediction mini-cards for home page ──────────────────────────────────
const HOME_COINS = [
  { coin: 'BTCUSDT', symbol: 'BTC', name: 'Bitcoin',  image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  { coin: 'ETHUSDT', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { coin: 'BNBUSDT', symbol: 'BNB', name: 'BNB',      image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { coin: 'XRPUSDT', symbol: 'XRP', name: 'XRP',      image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { coin: 'ADAUSDT', symbol: 'ADA', name: 'Cardano',  image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
];

function HomePredictionCards() {
  const [preds, setPreds] = useState<Record<string, any>>({});

  useEffect(() => {
    HOME_COINS.forEach(async ({ coin }) => {
      try {
        const r = await fetch(`/flask-api/live/predict/${coin}`);
        if (!r.ok) return;
        const d = await r.json();
        setPreds(prev => ({ ...prev, [coin]: d }));
      } catch { /* Flask offline */ }
    });
  }, []);

  const fmtPrice = (p: number) =>
    p >= 1000 ? `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `$${p.toFixed(4)}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {HOME_COINS.map(({ coin, symbol, name, image }) => {
        const d = preds[coin];
        const up    = d?.ensemble?.direction === 'UP';
        const prob  = d?.ensemble?.probability ?? 0;
        const price = d?.market?.close_price ?? 0;
        const rsi   = d?.market?.rsi ?? 0;
        const conf  = d?.ensemble?.confidence ?? '';

        return (
          <motion.div
            key={coin}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className={`relative rounded-2xl p-6 border-2 overflow-hidden transition-shadow hover:shadow-xl ${
              d
                ? up
                  ? 'bg-white border-green-200'
                  : 'bg-white border-red-200'
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Faint direction tint */}
            {d && (
              <div className={`absolute inset-0 opacity-[0.04] pointer-events-none ${up ? 'bg-green-500' : 'bg-red-500'}`} />
            )}

            {/* Header row */}
            <div className="flex items-center justify-between mb-5 relative">
              <div className="flex items-center gap-3">
                <img src={image} alt={name} className="w-10 h-10 rounded-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div>
                  <p className="text-lg font-black text-gray-900 leading-none">{symbol}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{name}</p>
                </div>
              </div>

              {d ? (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black ${
                  up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {d.ensemble.direction}
                </span>
              ) : (
                <div className="w-16 h-8 bg-gray-100 rounded-full animate-pulse" />
              )}
            </div>

            {/* Price */}
            {d ? (
              <p className="text-3xl font-black text-gray-900 mb-1 tracking-tight">
                {fmtPrice(price)}
              </p>
            ) : (
              <div className="h-9 w-32 bg-gray-100 rounded-lg animate-pulse mb-1" />
            )}

            {/* Probability */}
            {d ? (
              <p className={`text-base font-bold mb-4 ${up ? 'text-green-600' : 'text-red-500'}`}>
                {(prob * 100).toFixed(1)}% probability
              </p>
            ) : (
              <div className="h-5 w-24 bg-gray-100 rounded animate-pulse mb-4" />
            )}

            {/* Probability bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
              {d && (
                <motion.div
                  className={`h-2.5 rounded-full ${up ? 'bg-green-500' : 'bg-red-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${prob * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              )}
            </div>

            {/* RSI + Confidence row */}
            {d ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">RSI</p>
                  <p className={`text-base font-bold ${rsi > 70 ? 'text-red-500' : rsi < 30 ? 'text-green-600' : 'text-gray-800'}`}>
                    {rsi.toFixed(1)}
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      {rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium">Confidence</p>
                  <p className="text-base font-bold text-gray-800">{conf}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [selectedPeriod, setSelectedPeriod] = useState('1W');
  const authed = useAuth();
  const [authModal, setAuthModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' });

  const requireAuth = useCallback((reason: string, href: string) => {
    if (authed) {
      window.location.href = href;
    } else {
      setAuthModal({ open: true, reason });
    }
  }, [authed]);
  
  // Function to generate chart data based on selected period
  const generateChartData = (period: string) => {
    const now = Date.now();
    const basePrice = 43250;
    
    switch(period) {
      case '1D':
        // Hourly data for 1 day
        return Array.from({ length: 24 }, (_, i) => {
          const time = now - (23 - i) * 60 * 60 * 1000;
          const variation = (Math.random() - 0.5) * 0.005; // -0.25% to +0.25%
          const price = basePrice * (1 + variation);
          return {
            x: time,
            y: price,
            label: new Date(time).getHours().toString()
          };
        });
      case '1W':
        // Daily data for 1 week
        return [
          { x: now - 6 * 24 * 60 * 60 * 1000, y: 42000, label: 'Mon' },
          { x: now - 5 * 24 * 60 * 60 * 1000, y: 42500, label: 'Tue' },
          { x: now - 4 * 24 * 60 * 60 * 1000, y: 43000, label: 'Wed' },
          { x: now - 3 * 24 * 60 * 60 * 1000, y: 42800, label: 'Thu' },
          { x: now - 2 * 24 * 60 * 60 * 1000, y: 43200, label: 'Fri' },
          { x: now - 1 * 24 * 60 * 60 * 1000, y: 43500, label: 'Sat' },
          { x: now, y: 43250, label: 'Sun' },
          // Future predictions
          { x: now + 1 * 24 * 60 * 60 * 1000, y: 43700, label: 'Mon' },
          { x: now + 2 * 24 * 60 * 60 * 1000, y: 44000, label: 'Tue' },
          { x: now + 3 * 24 * 60 * 60 * 1000, y: 44200, label: 'Wed' },
          { x: now + 4 * 24 * 60 * 60 * 1000, y: 44500, label: 'Thu' },
          { x: now + 5 * 24 * 60 * 60 * 1000, y: 44800, label: 'Fri' },
          { x: now + 6 * 24 * 60 * 60 * 1000, y: 45000, label: 'Sat' },
        ];
      case '1M':
        // Daily data for 1 month
        return Array.from({ length: 30 }, (_, i) => {
          const time = now - (29 - i) * 24 * 60 * 60 * 1000;
          const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
          const price = basePrice * (1 + variation);
          return {
            x: time,
            y: price,
            label: `Day ${i+1}`
          };
        });
      case '3M':
        // Weekly data for 3 months
        return Array.from({ length: 12 }, (_, i) => {
          const time = now - (11 - i) * 7 * 24 * 60 * 60 * 1000;
          const variation = (Math.random() - 0.5) * 0.15; // -7.5% to +7.5%
          const price = basePrice * (1 + variation);
          return {
            x: time,
            y: price,
            label: `Week ${i+1}`
          };
        });
      default:
        return [
          { x: now - 6 * 24 * 60 * 60 * 1000, y: 42000, label: 'Mon' },
          { x: now - 5 * 24 * 60 * 60 * 1000, y: 42500, label: 'Tue' },
          { x: now - 4 * 24 * 60 * 60 * 1000, y: 43000, label: 'Wed' },
          { x: now - 3 * 24 * 60 * 60 * 1000, y: 42800, label: 'Thu' },
          { x: now - 2 * 24 * 60 * 60 * 1000, y: 43200, label: 'Fri' },
          { x: now - 1 * 24 * 60 * 60 * 1000, y: 43500, label: 'Sat' },
          { x: now, y: 43250, label: 'Sun' },
        ];
    }
  };
  
  const [chartData, setChartData] = useState(generateChartData(selectedPeriod));
  
  const updateChartData = (period: string) => {
    setSelectedPeriod(period);
    setChartData(generateChartData(period));
  };
  
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      
      {/* Spacing for fixed navbar */}
      <div className="h-20 lg:h-20"></div>
      
      <CryptoTicker />
      
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-white">
        {/* Subtle dot-grid background */}
        <div className="absolute inset-0 z-0"
          style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full mb-7">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-gray-600 tracking-wide">Trusted by 50,000+ traders worldwide</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-gray-900">
                Predict<br />
                <span className="relative inline-block">
                  Market
                  <motion.span
                    className="absolute -bottom-1 left-0 h-1 bg-black rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  />
                </span>{' '}
                Trends<br />
                <span className="text-gray-400">with AI</span>
              </h1>

              <p className="text-gray-500 text-lg leading-relaxed max-w-md mb-8">
                Coin-IQ runs four ML models — XGBoost, LightGBM, Random Forest and LSTM — on live Binance data to forecast next-day price direction for 20 cryptocurrencies.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <button
                  onClick={() => requireAuth('access predictions', '/predictions')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                  Start Predicting →
                </button>
                <button
                  onClick={() => requireAuth('access the learning hub', '/learn')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors text-gray-700">
                  Learn Crypto
                </button>
              </div>

              {/* Mini social proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['U','R','H','S'].map((l, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{l}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">4 ML models</span> running live right now
                </p>
              </div>
            </motion.div>

            {/* Right — stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="grid grid-cols-2 gap-4"
            >
              {/* Large accent card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="col-span-2 bg-gray-950 text-white rounded-3xl p-7 relative overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Best Model Accuracy</p>
                <p className="text-5xl font-black mb-1">74.3%</p>
                <p className="text-gray-400 text-sm">XGBoost on ETC/USDT · held-out test set</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400">Live predictions running</span>
                </div>
              </motion.div>

              {[
                { label: 'Total Predictions', value: '2.4M+', sub: '+12% this month',   up: true  },
                { label: 'Active Users',       value: '50K+',  sub: '+15% this month',   up: true  },
                { label: 'Coins Covered',      value: '20',    sub: 'All USDT pairs',     up: true  },
                { label: 'ML Models',          value: '4',     sub: 'Ensemble voting',    up: true  },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
                >
                  <p className="text-xs text-gray-400 font-medium mb-2">{s.label}</p>
                  <p className="text-3xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {s.sub}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Real-time Prediction Preview ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Section header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-widest">Live from Binance</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                  Real-time Market<br />
                  <span className="text-gray-400">Predictions</span>
                </h2>
                <p className="text-gray-500 text-base mt-3 max-w-lg">
                  Four ML models vote on next-day price direction every hour. Here's what they're saying right now.
                </p>
              </div>
              <button
                onClick={() => requireAuth('view all predictions', '/predictions')}
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors">
                View All 20 Coins →
              </button>
            </div>

            {/* Live prediction cards */}
            <HomePredictionCards />

            {/* Stats strip */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Best Accuracy',  value: '74.3%', sub: 'ETC/USDT · XGBoost' },
                { label: 'Models Running', value: '4',     sub: 'XGB · LGBM · RF · LSTM' },
                { label: 'Coins Covered',  value: '20',    sub: 'All USDT pairs' },
                { label: 'Data Source',    value: 'Live',  sub: 'Binance API · 1h candles' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-3xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-black text-white text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
              Why Coin-IQ
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Powerful Features
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Everything you need to trade smarter — built into one platform.
            </p>
          </motion.div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Large feature — AI Predictions */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 bg-black text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between min-h-[320px] relative overflow-hidden group"
            >
              {/* Background decoration */}
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full" />
              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full" />

              <div className="relative">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <CryptoIcon iconType="trend-up" className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3">AI-Powered Predictions</h3>
                <p className="text-gray-400 text-base leading-relaxed max-w-md">
                  Four ML models — XGBoost, LightGBM, Random Forest and LSTM — run in ensemble to forecast next-day price direction with up to 74% accuracy.
                </p>
              </div>

              <div className="relative mt-8 flex items-center gap-6">
                {[
                  { label: 'Model Accuracy', value: '74.3%' },
                  { label: 'Coins Covered', value: '20' },
                  { label: 'Models', value: '4' },
                ].map(stat => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Real-time Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-8 flex flex-col justify-between min-h-[320px] hover:shadow-lg transition-shadow group"
            >
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-200 transition-colors">
                  <CryptoIcon iconType="chart" className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Analytics</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Live price feeds from Binance with RSI, MACD, Bollinger Bands and volume indicators — updated every hour.
                </p>
              </div>

              {/* Mini indicator bar */}
              <div className="mt-8 space-y-3">
                {[
                  { label: 'RSI', value: 58, color: 'bg-green-500' },
                  { label: 'MACD', value: 72, color: 'bg-blue-500' },
                  { label: 'BB %B', value: 45, color: 'bg-gray-900' },
                ].map(ind => (
                  <div key={ind.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-10 shrink-0">{ind.label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${ind.color}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${ind.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8 text-right">{ind.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Risk Management */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition-shadow group"
            >
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-200 transition-colors">
                  <CryptoIcon iconType="wallet" className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Risk Management</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Per-prediction confidence scores and risk levels help you size positions and protect your portfolio.
                </p>
              </div>

              {/* Risk level pills */}
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  { label: 'Low Risk', color: 'bg-green-50 text-green-700 border-green-200' },
                  { label: 'Medium Risk', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                  { label: 'High Risk', color: 'bg-red-50 text-red-700 border-red-200' },
                ].map(r => (
                  <span key={r.label} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${r.color}`}>
                    {r.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Live News */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition-shadow group"
            >
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-200 transition-colors">
                  <CryptoIcon iconType="trend-up" className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Live Crypto News</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Aggregated in real-time from CoinDesk, CoinTelegraph and Decrypt — 100+ articles refreshed every 5 minutes.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-500 font-medium">Live · 3 sources · Updated now</span>
              </div>
            </motion.div>

            {/* Multi-coin coverage */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-4 bg-gray-900 text-white rounded-3xl p-8 flex flex-col justify-between hover:bg-gray-800 transition-colors group"
            >
              <div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <CryptoIcon iconType="chart" className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">20 Coins Covered</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  BTC, ETH, BNB, XRP, ADA, DOGE, LTC and 13 more — all with dedicated per-coin XGBoost models.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-1.5">
                {['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', '+14'].map(sym => (
                  <span key={sym} className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-semibold text-gray-300">
                    {sym}
                  </span>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>
      
      {/* Infinite Scrolling Testimonials */}
      <InfiniteTestimonials />
      
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-950 text-white rounded-3xl p-12 sm:p-16 relative overflow-hidden"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block px-3 py-1 bg-white/10 text-white text-xs font-semibold uppercase tracking-widest rounded-full mb-5">
                  Get started free
                </span>
                <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
                  Ready to trade<br />smarter?
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mb-8">
                  Join thousands of traders using Coin-IQ's AI ensemble predictions to make better decisions — no Bloomberg terminal required.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => requireAuth('get started', '/signup')}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors">
                    Get Started Free
                  </button>
                  <button
                    onClick={() => requireAuth('view live predictions', '/predictions')}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors">
                    View Live Predictions
                  </button>
                </div>
              </div>

              {/* Feature checklist */}
              <div className="space-y-3">
                {[
                  '4 ML models — XGBoost, LightGBM, RF, LSTM',
                  '20 cryptocurrencies with live Binance data',
                  'RSI, MACD, Bollinger Bands computed automatically',
                  'Crypto education hub with certificates',
                  'Real-time news from 3 major sources',
                  'Free to use — no credit card required',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />

      {/* Auth gate modal */}
      <AuthModal
        open={authModal.open}
        onClose={() => setAuthModal({ open: false, reason: '' })}
        reason={authModal.reason}
      />
    </div>
  );
}
