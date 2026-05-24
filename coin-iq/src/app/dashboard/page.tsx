"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, BarChart3, Activity, User,
  ArrowUpRight, Sparkles, Zap, PieChart, Globe, X,
  RefreshCw, ChevronUp, ChevronDown, Brain, Cpu, BookOpen, Award, CheckCircle,
  ArrowBigUp, ArrowBigDown,
} from 'lucide-react';
import Link from 'next/link';
import { getCryptoData } from '@/lib/cryptoService';
import { getUserProfile } from '@/lib/auth';
import { CryptoData } from '@/types/crypto';
import EditProfileModal from '@/components/edit-profile-modal';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LivePrediction {
  coin: string;
  market: { close_price: number; rsi: number; macd: number; bb_pct_b: number };
  models: {
    xgboost?:       { direction: 'UP'|'DOWN'; probability: number; accuracy?: number };
    lightgbm?:      { direction: 'UP'|'DOWN'; probability: number };
    random_forest?: { direction: 'UP'|'DOWN'; probability: number };
    lstm?:          { direction: 'UP'|'DOWN'; probability: number };
  };
  ensemble: { direction: 'UP'|'DOWN'; probability: number; confidence: string; models_used: number };
}

interface Prediction {
  coin: string; symbol: string; name: string;
  currentPrice: number; direction: 'UP'|'DOWN';
  probability: number; confidence: string;
  riskLevel: 'low'|'medium'|'high';
  rsi: number; macd: number; bb_pct_b: number;
  xgb_prob?: number; lgbm_prob?: number; rf_prob?: number; lstm_prob?: number;
  loading: boolean; error?: string;
}

interface UserProfile { id: number; name: string; email: string; created_at: string; }

// ── All 20 supported coins ────────────────────────────────────────────────────
const ALL_COINS: { coin: string; symbol: string; name: string }[] = [
  { coin: 'BTCUSDT',  symbol: 'BTC',  name: 'Bitcoin'        },
  { coin: 'ETHUSDT',  symbol: 'ETH',  name: 'Ethereum'       },
  { coin: 'BNBUSDT',  symbol: 'BNB',  name: 'BNB'            },
  { coin: 'XRPUSDT',  symbol: 'XRP',  name: 'XRP'            },
  { coin: 'ADAUSDT',  symbol: 'ADA',  name: 'Cardano'        },
  { coin: 'DOGEUSDT', symbol: 'DOGE', name: 'Dogecoin'       },
  { coin: 'LTCUSDT',  symbol: 'LTC',  name: 'Litecoin'       },
  { coin: 'BCHUSDT',  symbol: 'BCH',  name: 'Bitcoin Cash'   },
  { coin: 'ETCUSDT',  symbol: 'ETC',  name: 'Ethereum Classic'},
  { coin: 'TRXUSDT',  symbol: 'TRX',  name: 'TRON'           },
  { coin: 'XLMUSDT',  symbol: 'XLM',  name: 'Stellar'        },
  { coin: 'XMRUSDT',  symbol: 'XMR',  name: 'Monero'         },
  { coin: 'NEOUSDT',  symbol: 'NEO',  name: 'NEO'            },
  { coin: 'EOSUSDT',  symbol: 'EOS',  name: 'EOS'            },
  { coin: 'DASHUSDT', symbol: 'DASH', name: 'Dash'           },
  { coin: 'ZECUSDT',  symbol: 'ZEC',  name: 'Zcash'          },
  { coin: 'IOTAUSDT', symbol: 'IOTA', name: 'IOTA'           },
  { coin: 'QTUMUSDT', symbol: 'QTUM', name: 'Qtum'           },
  { coin: 'OMGUSDT',  symbol: 'OMG',  name: 'OMG Network'    },
  { coin: 'ZRXUSDT',  symbol: 'ZRX',  name: '0x Protocol'    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getRisk = (prob: number): 'low'|'medium'|'high' => {
  const d = Math.abs(prob - 0.5);
  if (d > 0.25) return 'low';
  if (d > 0.12) return 'medium';
  return 'high';
};

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: v < 1 ? 4 : 2,
    maximumFractionDigits: v < 1 ? 6 : 2,
  }).format(v);

const fmtCompact = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toFixed(2)}`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

function StatCard({ label, value, sub, up }: { label: string; value: string; sub: string; up: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
        {up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {sub}
      </p>
    </div>
  );
}

function RiskBadge({ level }: { level: 'low'|'medium'|'high' }) {
  const cls = level === 'low'
    ? 'bg-green-50 text-green-700 border-green-200'
    : level === 'medium'
    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
    : 'bg-red-50 text-red-700 border-red-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls} capitalize`}>
      {level}
    </span>
  );
}

function SignalBadge({ dir }: { dir: 'UP'|'DOWN' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
      dir === 'UP' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {dir === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {dir}
    </span>
  );
}

// Donut chart for market cap distribution
function DonutChart({ data }: { data: CryptoData[] }) {
  const sorted = [...data].sort((a, b) => b.marketCap - a.marketCap).slice(0, 6);
  const total = sorted.reduce((s, d) => s + d.marketCap, 0);
  const colors = ['#111827','#374151','#6b7280','#9ca3af','#d1d5db','#e5e7eb'];
  let cum = 0;
  const C = 2 * Math.PI * 40;
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
          {sorted.map((c, i) => {
            const pct = c.marketCap / total;
            const dash = `${pct * C} ${C}`;
            const offset = -cum * C;
            cum += pct;
            return (
              <motion.circle key={c.id} cx="50" cy="50" r="40" fill="transparent"
                stroke={colors[i]} strokeWidth="20"
                strokeDasharray={dash} strokeDashoffset={offset}
                initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-sm font-bold">{fmtCompact(total)}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        {sorted.map((c, i) => (
          <div key={c.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[i] }} />
              <span className="font-medium text-gray-700">{c.symbol.toUpperCase()}</span>
            </div>
            <span className="text-gray-500 text-xs">{((c.marketCap / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Volume bars
function VolumeBars({ data }: { data: CryptoData[] }) {
  const sorted = [...data].sort((a, b) => b.volume24h - a.volume24h).slice(0, 8);
  const max = sorted[0]?.volume24h ?? 1;
  return (
    <div className="space-y-2.5">
      {sorted.map((c, i) => (
        <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }} className="flex items-center gap-3">
          <span className="w-12 text-xs font-semibold text-gray-600 shrink-0">{c.symbol.toUpperCase()}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max((c.volume24h / max) * 100, 8)}%` }}
              transition={{ duration: 0.8, delay: i * 0.07 }}
              className="h-full bg-gray-900 rounded-full flex items-center justify-end pr-2"
            >
              <span className="text-xs text-white font-semibold whitespace-nowrap">
                {fmtCompact(c.volume24h)}
              </span>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Ensemble summary gauge
function EnsembleSummary({ predictions }: { predictions: Prediction[] }) {
  const loaded = predictions.filter(p => !p.loading && !p.error);
  const bullish = loaded.filter(p => p.direction === 'UP').length;
  const bearish = loaded.length - bullish;
  const avgProb = loaded.length ? loaded.reduce((s, p) => s + p.probability, 0) / loaded.length : 0.5;
  const C = 2 * Math.PI * 38;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
          <motion.circle cx="50" cy="50" r="38" fill="transparent" stroke="#111827" strokeWidth="12"
            strokeDasharray={`${avgProb * C} ${C}`}
            initial={{ strokeDasharray: `0 ${C}` }}
            animate={{ strokeDasharray: `${avgProb * C} ${C}` }}
            transition={{ duration: 1.5 }} strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{(avgProb * 100).toFixed(0)}%</p>
            <p className="text-xs text-gray-400">avg</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="text-center bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-2xl font-bold text-green-600">{bullish}</p>
          <p className="text-xs text-gray-500">Bullish</p>
        </div>
        <div className="text-center bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-2xl font-bold text-red-500">{bearish}</p>
          <p className="text-xs text-gray-500">Bearish</p>
        </div>
      </div>
      {loaded.length < ALL_COINS.length && (
        <p className="text-xs text-gray-400">{loaded.length}/{ALL_COINS.length} coins loaded</p>
      )}
    </div>
  );
}

// ── LMS Progress Widget ───────────────────────────────────────────────────────
function LMSWidget() {
  const [courses, setCourses] = useState<any[]>([]);
  const [lmsLoading, setLmsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/learn/courses')
      .then(r => r.json())
      .then(d => { setCourses(d.courses ?? []); setLmsLoading(false); })
      .catch(() => setLmsLoading(false));
  }, []);

  const completed  = courses.filter(c => c.progress?.completed).length;
  const inProgress = courses.filter(c => c.progress && !c.progress.completed).length;
  const certs      = courses.filter(c => c.progress?.quiz_passed).length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Learning Progress
        </h3>
        <Link href="/learn" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1">
          View all courses <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Completed',   value: lmsLoading ? '—' : `${completed}/${courses.length}`, icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
          { label: 'In Progress', value: lmsLoading ? '—' : String(inProgress),               icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
          { label: 'Certificates', value: lmsLoading ? '—' : String(certs),                   icon: <Award className="w-4 h-4 text-yellow-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Course list */}
      {lmsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-12" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map(c => {
            const done = c.progress?.completed;
            const lessonsCompleted = c.progress?.completed_lessons?.length ?? 0;
            const pct = Math.round((lessonsCompleted / c.lessonCount) * 100);
            return (
              <Link key={c.slug} href={`/learn/${c.slug}`}>
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <span className="text-2xl shrink-0">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {done ? '✅ Done' : lessonsCompleted > 0 ? `${pct}%` : 'Not started'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${done ? 'bg-green-500' : 'bg-gray-900'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!lmsLoading && completed === 0 && inProgress === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">Start your crypto education journey</p>
          <Link href="/learn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
            <BookOpen className="w-4 h-4" /> Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [topGainers, setTopGainers] = useState<CryptoData[]>([]);
  const [topLosers, setTopLosers]   = useState<CryptoData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm]     = useState({ name: '', email: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState<{type:'success'|'error'; text:string}|null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [predictions, setPredictions] = useState<Prediction[]>(
    ALL_COINS.map(c => ({ ...c, currentPrice: 0, direction: 'UP' as const,
      probability: 0.5, confidence: '0%', riskLevel: 'medium' as const,
      rsi: 0, macd: 0, bb_pct_b: 0, loading: true }))
  );

  const fetchCoin = useCallback(async (coin: string) => {
    try {
      const res = await fetch(`/flask-api/live/predict/${coin}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d: LivePrediction = await res.json();
      const prob = d.ensemble.probability;
      setPredictions(prev => prev.map(p => p.coin !== coin ? p : {
        ...p,
        currentPrice: d.market.close_price,
        direction:    d.ensemble.direction,
        probability:  prob,
        confidence:   d.ensemble.confidence,
        riskLevel:    getRisk(prob),
        rsi:          d.market.rsi,
        macd:         d.market.macd,
        bb_pct_b:     d.market.bb_pct_b,
        xgb_prob:     d.models.xgboost?.probability,
        lgbm_prob:    d.models.lightgbm?.probability,
        rf_prob:      d.models.random_forest?.probability,
        lstm_prob:    d.models.lstm?.probability,
        loading:      false, error: undefined,
      }));
    } catch (e: any) {
      setPredictions(prev => prev.map(p => p.coin !== coin ? p : { ...p, loading: false, error: e.message }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setPredictions(prev => prev.map(p => ({ ...p, loading: true, error: undefined })));
    await Promise.all(ALL_COINS.map(c => fetchCoin(c.coin)));
    setRefreshing(false);
  }, [fetchCoin]);

  useEffect(() => {
    (async () => {
      try {
        const u = await getUserProfile();
        if (u) { setUser(u); setEditForm({ name: u.name, email: u.email, newPassword: '', confirmPassword: '' }); }
        const data = await getCryptoData(20);
        setCryptoData(data.slice(0, 10));
        const sorted = [...data].sort((a, b) => b.percentChange24h - a.percentChange24h);
        setTopGainers(sorted.slice(0, 5));
        setTopLosers(sorted.slice(-5).reverse());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
    ALL_COINS.forEach(c => fetchCoin(c.coin));
  }, [fetchCoin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      setSaveMsg({ type: 'error', text: 'Passwords do not match' }); return;
    }
    setSaving(true);
    try {
      const body: any = { name: editForm.name, email: editForm.email };
      if (editForm.newPassword) body.password = editForm.newPassword;
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setSaveMsg({ type: 'success', text: 'Profile updated!' });
      if (user) setUser({ ...user, name: editForm.name, email: editForm.email });
      setTimeout(() => { setShowEditProfile(false); setSaveMsg(null); }, 1500);
    } catch (e: any) { setSaveMsg({ type: 'error', text: e.message }); }
    finally { setSaving(false); }
  };

  const loadedPreds = predictions.filter(p => !p.loading && !p.error);
  const bullishCount = loadedPreds.filter(p => p.direction === 'UP').length;
  const bearishCount = loadedPreds.length - bullishCount;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar spacer */}
      <div className="h-24" />

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              Welcome back, <span className="font-semibold text-gray-800">{user?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshAll} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => setShowEditProfile(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <User className="w-4 h-4" /> Profile
            </button>
            <a href="/predictions"
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <ArrowUpRight className="w-4 h-4" /> Predictions
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Stat row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Market Cap" value="$2.4T"  sub="+2.4% vs 24h" up={true}  />
          <StatCard label="24h Volume"        value="$84.2B" sub="-1.2% vs 24h" up={false} />
          <StatCard label="Bullish Signals"
            value={loadedPreds.length ? `${bullishCount}/${loadedPreds.length}` : '—'}
            sub={loadedPreds.length ? `${((bullishCount/loadedPreds.length)*100).toFixed(0)}% bullish` : 'Loading...'}
            up={bullishCount >= bearishCount}
          />
          <StatCard label="Bearish Signals"
            value={loadedPreds.length ? `${bearishCount}/${loadedPreds.length}` : '—'}
            sub={loadedPreds.length ? `${((bearishCount/loadedPreds.length)*100).toFixed(0)}% bearish` : 'Loading...'}
            up={false}
          />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left: All 20 coins predictions table ── */}
          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-gray-700" />
                  Live AI Predictions — All 20 Coins
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  XGBoost · LightGBM · Random Forest · LSTM ensemble
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coin</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Signal</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prob</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">RSI</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Models</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Suggestion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {predictions.map((p, i) => (
                    <motion.tr key={p.coin}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{p.symbol}</p>
                          <p className="text-xs text-gray-400">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {p.loading ? <Skel className="h-4 w-20 ml-auto" /> : p.error ? <span className="text-xs text-gray-400">offline</span> : fmt(p.currentPrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.loading ? <Skel className="h-6 w-14 mx-auto" /> : p.error ? <span className="text-xs text-gray-400">—</span> : <SignalBadge dir={p.direction} />}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.loading ? <Skel className="h-4 w-12 ml-auto" /> : p.error ? <span className="text-xs text-gray-400">—</span> : (
                          <span className={`font-semibold ${p.direction === 'UP' ? 'text-green-600' : 'text-red-500'}`}>
                            {(p.probability * 100).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.loading ? <Skel className="h-4 w-10 ml-auto" /> : p.error ? <span className="text-xs text-gray-400">—</span> : (
                          <span className={`font-medium ${p.rsi > 70 ? 'text-red-500' : p.rsi < 30 ? 'text-green-600' : 'text-gray-700'}`}>
                            {p.rsi.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.loading ? <Skel className="h-5 w-14 mx-auto" /> : p.error ? <span className="text-xs text-gray-400">—</span> : <RiskBadge level={p.riskLevel} />}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {p.loading ? <Skel className="h-4 w-28 mx-auto" /> : p.error ? null : (
                          <div className="flex items-center justify-center gap-1">
                            {[p.xgb_prob, p.lgbm_prob, p.rf_prob, p.lstm_prob].map((prob, mi) => (
                              prob !== undefined ? (
                                <span key={mi}
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${prob >= 0.5 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}
                                  title={['XGBoost','LightGBM','Random Forest','LSTM'][mi]}>
                                  {prob >= 0.5
                                    ? <ArrowBigUp className="w-4 h-4" strokeWidth={2.5} />
                                    : <ArrowBigDown className="w-4 h-4" strokeWidth={2.5} />}
                                </span>
                              ) : null
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-center">
                        {p.loading ? <Skel className="h-5 w-24 mx-auto" /> : p.error ? <span className="text-xs text-gray-400">—</span> : (() => {
                          const conf = Math.abs(p.probability - 0.5) * 2;
                          const isUp = p.direction === 'UP';
                          let label: string;
                          let style: string;

                          if (isUp && conf >= 0.4 && p.riskLevel === 'low') {
                            label = 'Strong Buy'; style = 'bg-green-100 text-green-800 border-green-200';
                          } else if (isUp && conf >= 0.2) {
                            label = 'Buy'; style = 'bg-green-50 text-green-700 border-green-200';
                          } else if (!isUp && conf >= 0.4 && p.riskLevel === 'low') {
                            label = 'Strong Sell'; style = 'bg-red-100 text-red-800 border-red-200';
                          } else if (!isUp && conf >= 0.2) {
                            label = 'Sell'; style = 'bg-red-50 text-red-700 border-red-200';
                          } else if (p.rsi > 70) {
                            label = 'Overbought'; style = 'bg-orange-50 text-orange-700 border-orange-200';
                          } else if (p.rsi < 30) {
                            label = 'Oversold'; style = 'bg-blue-50 text-blue-700 border-blue-200';
                          } else {
                            label = 'Hold'; style = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                          }

                          return (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-5">

            {/* Ensemble summary */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4" /> Ensemble Summary
              </h3>
              <EnsembleSummary predictions={predictions} />
            </div>

            {/* Top gainers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-green-600" /> Top Gainers
              </h3>
              <div className="space-y-2">
                {topGainers.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {c.image?.startsWith('http') ? (
                          <img src={c.image} alt={c.name} className="w-full h-full object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        ) : <span className="text-xs font-bold text-gray-600">{c.symbol.slice(0,2).toUpperCase()}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.symbol.toUpperCase()}</p>
                        <p className="text-xs text-gray-400">{fmt(c.price)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600">+{c.percentChange24h.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top losers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-red-500" /> Top Losers
              </h3>
              <div className="space-y-2">
                {topLosers.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {c.image?.startsWith('http') ? (
                          <img src={c.image} alt={c.name} className="w-full h-full object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        ) : <span className="text-xs font-bold text-gray-600">{c.symbol.slice(0,2).toUpperCase()}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.symbol.toUpperCase()}</p>
                        <p className="text-xs text-gray-400">{fmt(c.price)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-500">{c.percentChange24h.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4" /> Trading Volume (24h)
            </h3>
            {cryptoData.length > 0 ? <VolumeBars data={cryptoData} /> : <Skel className="h-48" />}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-5">
              <PieChart className="w-4 h-4" /> Market Cap Distribution
            </h3>
            {cryptoData.length > 0 ? <DonutChart data={cryptoData} /> : <Skel className="h-48" />}
          </div>
        </div>

        {/* ── LMS Progress widget ── */}
        <LMSWidget />

      </div>

      {/* ── Edit profile modal ── */}
      <EditProfileModal
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSaved={(name) => { if (user) setUser({ ...user, name }); }}
      />
    </div>
  );
}
