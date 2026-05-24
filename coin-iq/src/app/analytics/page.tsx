"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/providers';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import {
  TrendingUp, TrendingDown, Activity,
  DollarSign, ArrowUpRight, ArrowDownRight,
  RefreshCw, Newspaper, ChevronUp, ChevronDown,
  BarChart3, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CoinData {
  symbol: string;
  name: string;
  displaySymbol: string;
  image: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume: number;
}

interface SentimentData {
  vader_compound: number;
  vader_pos: number;
  vader_neg: number;
  vader_neu: number;
  sentiment_label: number;
  article_count: number;
  source: string;
}

const SUPPORTED_SYMBOLS = [
  'BTCUSDT','ETHUSDT','BNBUSDT','XRPUSDT','ADAUSDT',
  'DOGEUSDT','LTCUSDT','BCHUSDT','ETCUSDT','TRXUSDT',
  'XLMUSDT','XMRUSDT','NEOUSDT','EOSUSDT','DASHUSDT',
  'ZECUSDT','IOTAUSDT','QTUMUSDT','OMGUSDT','ZRXUSDT',
];

const COIN_META: Record<string, { name: string; image: string }> = {
  BTCUSDT:  { name: 'Bitcoin',          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  ETHUSDT:  { name: 'Ethereum',         image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  BNBUSDT:  { name: 'BNB',              image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  XRPUSDT:  { name: 'XRP',              image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  ADAUSDT:  { name: 'Cardano',          image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
  DOGEUSDT: { name: 'Dogecoin',         image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
  LTCUSDT:  { name: 'Litecoin',         image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png' },
  BCHUSDT:  { name: 'Bitcoin Cash',     image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png' },
  ETCUSDT:  { name: 'Ethereum Classic', image: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png' },
  TRXUSDT:  { name: 'TRON',             image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png' },
  XLMUSDT:  { name: 'Stellar',          image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png' },
  XMRUSDT:  { name: 'Monero',           image: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png' },
  NEOUSDT:  { name: 'NEO',              image: 'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png' },
  EOSUSDT:  { name: 'EOS',              image: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png' },
  DASHUSDT: { name: 'Dash',             image: 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png' },
  ZECUSDT:  { name: 'Zcash',            image: 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png' },
  IOTAUSDT: { name: 'IOTA',             image: 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png' },
  QTUMUSDT: { name: 'Qtum',             image: 'https://assets.coingecko.com/coins/images/684/large/qtum.png' },
  OMGUSDT:  { name: 'OMG Network',      image: 'https://assets.coingecko.com/coins/images/776/large/OMG_Network.jpg' },
  ZRXUSDT:  { name: '0x Protocol',      image: 'https://assets.coingecko.com/coins/images/863/large/0x.png' },
};

function fmt(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return `${value.toFixed(2)}`;
}

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1)    return p.toFixed(4);
  return p.toFixed(6);
}

function CoinLogo({ symbol, image, size = 36 }: { symbol: string; image: string; size?: number }) {
  const [err, setErr] = useState(false);
  const colors = ['#f97316','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899'];
  const bg = colors[symbol.charCodeAt(0) % colors.length];
  if (err) {
    return (
      <div style={{ width: size, height: size, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontSize: size * 0.3, fontWeight: 700 }}>{symbol.slice(0, 2)}</span>
      </div>
    );
  }
  return (
    <img src={image} alt={symbol} width={size} height={size}
      style={{ borderRadius: '50%', objectFit: 'contain', background: '#f9fafb' }}
      onError={() => setErr(true)} />
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AnalyticsPage() {
  const [coins, setCoins]             = useState<CoinData[]>([]);
  const [sentiments, setSentiments]   = useState<Record<string, SentimentData>>({});
  const [sparklines, setSparklines]   = useState<Record<string, number[]>>({});
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortKey, setSortKey]         = useState<'change24h' | 'price' | 'volume24h'>('change24h');
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab]     = useState<'overview' | 'coins' | 'sentiment'>('overview');

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [authed, setAuthed]               = useState<boolean | null>(null);
  const [tab, setTab]                     = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading]   = useState(false);
  const [showLoginPw, setShowLoginPw]     = useState(false);
  const [signupName, setSignupName]       = useState('');
  const [signupEmail, setSignupEmail]     = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [showSignupPw, setShowSignupPw]   = useState(false);

  const checkAuth = () => {
    fetch('/api/auth/me').then(r => setAuthed(r.ok)).catch(() => setAuthed(false));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast.error('Please fill in all fields'); return; }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Invalid credentials'); return; }
      toast.success('Welcome back!');
      checkAuth();
    } catch { toast.error('Something went wrong. Try again.'); }
    finally { setLoginLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) { toast.error('Please fill in all fields'); return; }
    if (signupPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Signup failed'); return; }
      toast.success('Account created! Loading analytics...');
      checkAuth();
    } catch { toast.error('Something went wrong. Try again.'); }
    finally { setSignupLoading(false); }
  };

  async function fetchCoins() {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('Binance API error');
    const all: any[] = await res.json();
    const map = Object.fromEntries(all.map((t: any) => [t.symbol, t]));
    return SUPPORTED_SYMBOLS.map(sym => {
      const t = map[sym] || {};
      const meta = COIN_META[sym] || { name: sym.replace('USDT', ''), image: '' };
      return {
        symbol: sym, name: meta.name, displaySymbol: sym.replace('USDT', ''), image: meta.image,
        price:       parseFloat(t.lastPrice            || '0'),
        change24h:   parseFloat(t.priceChangePercent   || '0'),
        high24h:     parseFloat(t.highPrice            || '0'),
        low24h:      parseFloat(t.lowPrice             || '0'),
        volume24h:   parseFloat(t.volume               || '0'),
        quoteVolume: parseFloat(t.quoteVolume          || '0'),
      } as CoinData;
    });
  }

  async function fetchSparklines(symbols: string[]) {
    const results: Record<string, number[]> = {};
    await Promise.all(symbols.map(async sym => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&limit=7`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const data: any[] = await res.json();
        results[sym] = data.map((k: any) => parseFloat(k[4]));
      } catch { /* skip */ }
    }));
    return results;
  }

  async function fetchSentiments() {
    try {
      const res = await fetch('/flask-api/sentiment', { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return {};
      return await res.json() as Record<string, SentimentData>;
    } catch { return {}; }
  }

  async function loadAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [coinData, sentData, sparkData] = await Promise.all([fetchCoins(), fetchSentiments(), fetchSparklines(SUPPORTED_SYMBOLS)]);
      setCoins(coinData);
      setSentiments(sentData);
      setSparklines(sparkData);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadAll(); checkAuth(); }, []);

  const totalVolume = coins.reduce((s, c) => s + c.quoteVolume, 0);
  const gainers     = coins.filter(c => c.change24h > 0).length;
  const losers      = coins.filter(c => c.change24h < 0).length;
  const avgChange   = coins.length ? coins.reduce((s, c) => s + c.change24h, 0) / coins.length : 0;
  const btc         = coins.find(c => c.symbol === 'BTCUSDT');
  const topGainers  = [...coins].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  const topLosers   = [...coins].sort((a, b) => a.change24h - b.change24h).slice(0, 5);

  const sentList    = Object.values(sentiments);
  const avgCompound = sentList.length ? sentList.reduce((s, x) => s + x.vader_compound, 0) / sentList.length : 0;
  const bullishPct  = sentList.length ? sentList.filter(x => x.sentiment_label === 1).length  / sentList.length : 0;
  const bearishPct  = sentList.length ? sentList.filter(x => x.sentiment_label === -1).length / sentList.length : 0;
  const neutralPct  = 1 - bullishPct - bearishPct;

  const sortedCoins = [...coins].sort((a, b) =>
    sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
  );

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="h-16" />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
            <p className="mt-4 text-gray-600">Loading live analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="h-16" />

      {/* ── Auth gate — shown at top when not logged in ── */}
      <AnimatePresence>
        {authed === false && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}
            className="bg-gray-50 border-b border-gray-200"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

                {/* Left — pitch */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-full mb-6 uppercase tracking-widest">
                    <BarChart3 className="w-3.5 h-3.5" /> Live Analytics
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-5">
                    Real-Time Market<br />
                    <span className="text-gray-400">Analytics</span>
                  </h1>
                  <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
                    Sign in to access live market data, sentiment analysis, and performance charts for 20 cryptocurrencies.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Live Binance data', 'News sentiment', '20 coins tracked', 'Free forever'].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — form card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="flex border-b border-gray-100">
                    {(['login', 'signup'] as const).map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${
                          tab === t ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-400 hover:text-gray-600 bg-gray-50'
                        }`}>
                        {t === 'login' ? 'Sign In' : 'Create Account'}
                      </button>
                    ))}
                  </div>

                  <div className="px-8 py-7">
                    <AnimatePresence mode="wait">
                      {tab === 'login' && (
                        <motion.form key="login" onSubmit={handleLogin}
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}
                          className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email</label>
                            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                              placeholder="you@example.com" required
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</label>
                              <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Forgot password?</Link>
                            </div>
                            <div className="relative">
                              <input type={showLoginPw ? 'text' : 'password'} value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" required
                                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
                              <button type="button" onClick={() => setShowLoginPw(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <button type="submit" disabled={loginLoading}
                            className="w-full py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {loginLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {loginLoading ? 'Signing in...' : 'Sign In'}
                          </button>
                        </motion.form>
                      )}

                      {tab === 'signup' && (
                        <motion.form key="signup" onSubmit={handleSignup}
                          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                          className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Full Name</label>
                            <input type="text" value={signupName} onChange={e => setSignupName(e.target.value)}
                              placeholder="John Doe" required
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email</label>
                            <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                              placeholder="you@example.com" required
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Password</label>
                            <div className="relative">
                              <input type={showSignupPw ? 'text' : 'password'} value={signupPassword}
                                onChange={e => setSignupPassword(e.target.value)}
                                placeholder="Min. 8 characters" required minLength={8}
                                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" />
                              <button type="button" onClick={() => setShowSignupPw(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showSignupPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <button type="submit" disabled={signupLoading}
                            className="w-full py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {signupLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {signupLoading ? 'Creating account...' : 'Create Free Account'}
                          </button>
                          <p className="text-center text-xs text-gray-400">No credit card required · Free forever</p>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Analytics content — blurred when not authed ── */}
      <div className={`relative ${authed === false ? 'pointer-events-none select-none' : ''}`}>
        {authed === false && (
          <div className="absolute inset-0 z-10"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.55)' }} />
        )}
        <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Market Analytics</h1>
            <p className="text-gray-500 text-sm">
              Live data for 20 coins · {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}
            </p>
          </div>
          <button onClick={() => loadAll(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 w-fit mb-8">
          {(['overview', 'coins', 'sentiment'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
              {tab}
            </button>
          ))}
        </motion.div>

        {/* KPI cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <DollarSign className="w-5 h-5 text-blue-600" />,  bg: 'bg-blue-50',   label: '24h Volume (20 coins)', value: fmt(totalVolume), badge: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`, up: avgChange >= 0 },
            { icon: <Activity    className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', label: 'BTC Price', value: btc ? fmtPrice(btc.price) : '—', badge: `${(btc?.change24h ?? 0) >= 0 ? '+' : ''}${(btc?.change24h ?? 0).toFixed(2)}%`, up: (btc?.change24h ?? 0) >= 0 },
            { icon: <TrendingUp  className="w-5 h-5 text-green-600" />,  bg: 'bg-green-50',  label: 'Gainers / Losers', value: `${gainers} / ${losers}`, badge: `${coins.length} coins`, up: gainers >= losers },
            { icon: <Newspaper   className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50', label: 'News Sentiment', value: avgCompound >= 0.05 ? 'Bullish' : avgCompound <= -0.05 ? 'Bearish' : 'Neutral', badge: `${(avgCompound * 100).toFixed(1)} score`, up: avgCompound >= 0 },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 ${card.bg} rounded-lg`}>{card.icon}</div>
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${card.up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.badge}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </motion.div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {[{ title: 'Top Gainers', data: topGainers, up: true }, { title: 'Top Losers', data: topLosers, up: false }].map(({ title, data, up }) => (
                <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`p-2 ${up ? 'bg-green-50' : 'bg-red-50'} rounded-lg`}>
                      {up ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                  </div>
                  <div className="space-y-3">
                    {data.map((coin, idx) => (
                      <div key={coin.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-400 w-5">#{idx + 1}</span>
                          <CoinLogo symbol={coin.displaySymbol} image={coin.image} size={32} />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{coin.name}</p>
                            <p className="text-xs text-gray-400">{coin.displaySymbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{fmtPrice(coin.price)}</p>
                          <p className={`text-xs font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>
                            {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">24h Performance — All 20 Coins</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Sorted by best performers · bar width = relative magnitude</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Gain</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Loss</span>
                </div>
              </div>
              {(() => {
                const sorted = [...coins].sort((a, b) => b.change24h - a.change24h);
                const maxAbs = Math.max(...sorted.map(c => Math.abs(c.change24h)), 0.01);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sorted.map((coin, i) => {
                      const isUp   = coin.change24h >= 0;
                      const pct    = Math.abs(coin.change24h);
                      const barW   = Math.round((pct / maxAbs) * 100);
                      const spark  = sparklines[coin.symbol] || [];
                      return (
                        <motion.div key={coin.symbol}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 + i * 0.02, duration: 0.35 }}
                          className={`relative rounded-xl border overflow-hidden ${isUp ? 'border-green-100' : 'border-red-100'}`}>
                          {/* Gradient background fill */}
                          <motion.div
                            className={`absolute inset-y-0 left-0 ${isUp ? 'bg-green-50' : 'bg-red-50'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${barW}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 + i * 0.02 }}
                          />
                          <div className="relative flex items-center gap-3 px-4 py-3">
                            <CoinLogo symbol={coin.displaySymbol} image={coin.image} size={34} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{coin.name}</p>
                              <p className="text-xs text-gray-400">{coin.displaySymbol}/USDT</p>
                            </div>
                            {/* Sparkline */}
                            {spark.length >= 2 && (
                              <Sparkline values={spark} color={isUp ? '#16a34a' : '#dc2626'} />
                            )}
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-gray-900">{fmtPrice(coin.price)}</p>
                              <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {isUp ? '+' : ''}{coin.change24h.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}

        {/* ── COINS TAB ── */}
        {activeTab === 'coins' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">All 20 Coins — Live Data</h2>
              <p className="text-sm text-gray-500 mt-1">Click column headers to sort</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Coin</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900" onClick={() => toggleSort('price')}>
                      <span className="flex items-center justify-end gap-1">Price {sortKey === 'price' ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null}</span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900" onClick={() => toggleSort('change24h')}>
                      <span className="flex items-center justify-end gap-1">24h % {sortKey === 'change24h' ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null}</span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">24h High</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">24h Low</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-900" onClick={() => toggleSort('volume24h')}>
                      <span className="flex items-center justify-end gap-1">Volume {sortKey === 'volume24h' ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null}</span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">7d Trend</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sentiment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedCoins.map((coin, idx) => {
                    const sent = sentiments[coin.symbol];
                    const spark = sparklines[coin.symbol] || [];
                    const sentLabel = !sent ? 'N/A' : sent.sentiment_label === 1 ? 'Bullish' : sent.sentiment_label === -1 ? 'Bearish' : 'Neutral';
                    return (
                      <tr key={coin.symbol} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <CoinLogo symbol={coin.displaySymbol} image={coin.image} size={32} />
                            <div>
                              <p className="font-semibold text-gray-900">{coin.name}</p>
                              <p className="text-xs text-gray-400">{coin.displaySymbol}/USDT</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-gray-900">{fmtPrice(coin.price)}</td>
                        <td className="px-4 py-4 text-right">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${coin.change24h >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {coin.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-600 text-xs">{fmtPrice(coin.high24h)}</td>
                        <td className="px-4 py-4 text-right text-gray-600 text-xs">{fmtPrice(coin.low24h)}</td>
                        <td className="px-4 py-4 text-right text-gray-600 text-xs">{fmt(coin.quoteVolume)}</td>
                        <td className="px-4 py-4 text-right">
                          <Sparkline values={spark} color={coin.change24h >= 0 ? '#16a34a' : '#dc2626'} />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            !sent ? 'bg-gray-100 text-gray-500' :
                            sent.sentiment_label === 1  ? 'bg-green-50 text-green-700' :
                            sent.sentiment_label === -1 ? 'bg-red-50 text-red-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {sentLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── SENTIMENT TAB ── */}
        {activeTab === 'sentiment' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="space-y-6 mb-8">

            {/* Aggregate summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Bullish Coins', value: `${Math.round(bullishPct * 100)}%`, count: sentList.filter(x => x.sentiment_label === 1).length,  color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
                { label: 'Neutral Coins', value: `${Math.round(neutralPct * 100)}%`, count: sentList.filter(x => x.sentiment_label === 0).length,  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
                { label: 'Bearish Coins', value: `${Math.round(bearishPct * 100)}%`, count: sentList.filter(x => x.sentiment_label === -1).length, color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
              ].map(card => (
                <div key={card.label} className={`rounded-xl border-2 p-5 ${card.bg}`}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{card.label}</p>
                  <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.count} of {sentList.length} coins</p>
                </div>
              ))}
            </div>

            {/* Per-coin grid */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Per-Coin Sentiment (Live News)</h2>
              {Object.keys(sentiments).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Sentiment data unavailable — Flask API may be offline.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {coins.map(coin => {
                    const sent = sentiments[coin.symbol];
                    if (!sent) return null;
                    const label       = sent.sentiment_label === 1 ? 'Bullish' : sent.sentiment_label === -1 ? 'Bearish' : 'Neutral';
                    const labelColor  = sent.sentiment_label === 1 ? 'text-green-700' : sent.sentiment_label === -1 ? 'text-red-600' : 'text-yellow-700';
                    const borderColor = sent.sentiment_label === 1 ? 'border-green-200' : sent.sentiment_label === -1 ? 'border-red-200' : 'border-yellow-200';
                    return (
                      <div key={coin.symbol} className={`rounded-xl border-2 p-4 hover:shadow-sm transition-shadow ${borderColor}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <CoinLogo symbol={coin.displaySymbol} image={coin.image} size={28} />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{coin.name}</p>
                            <p className="text-xs text-gray-400">{coin.displaySymbol}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-black ${labelColor}`}>{label}</span>
                          <span className="text-xs text-gray-500">{sent.vader_compound >= 0 ? '+' : ''}{sent.vader_compound.toFixed(3)}</span>
                        </div>
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
                          <div className="bg-green-500" style={{ width: `${sent.vader_pos * 100}%` }} />
                          <div className="bg-red-500"   style={{ width: `${sent.vader_neg * 100}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {sent.article_count} articles · {sent.source === 'coin_specific' ? 'specific' : 'general'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
      <Footer />
        </div>
      </div>
    </div>
  );
}
