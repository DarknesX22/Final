"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, BarChart3, Activity, User,
  ArrowUpRight, Sparkles, PieChart, RefreshCw, ChevronUp, ChevronDown,
  Brain, Cpu, BookOpen, Award, CheckCircle, ArrowBigUp, ArrowBigDown,
  History, Clock, Target, Play, Square, Zap, Calendar, Lock, RotateCcw, Globe,
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
  { coin: 'BTCUSDT',  symbol: 'BTC',  name: 'Bitcoin'         },
  { coin: 'ETHUSDT',  symbol: 'ETH',  name: 'Ethereum'        },
  { coin: 'BNBUSDT',  symbol: 'BNB',  name: 'BNB'             },
  { coin: 'XRPUSDT',  symbol: 'XRP',  name: 'XRP'             },
  { coin: 'ADAUSDT',  symbol: 'ADA',  name: 'Cardano'         },
  { coin: 'DOGEUSDT', symbol: 'DOGE', name: 'Dogecoin'        },
  { coin: 'LTCUSDT',  symbol: 'LTC',  name: 'Litecoin'        },
  { coin: 'BCHUSDT',  symbol: 'BCH',  name: 'Bitcoin Cash'    },
  { coin: 'ETCUSDT',  symbol: 'ETC',  name: 'Ethereum Classic'},
  { coin: 'TRXUSDT',  symbol: 'TRX',  name: 'TRON'            },
  { coin: 'XLMUSDT',  symbol: 'XLM',  name: 'Stellar'         },
  { coin: 'XMRUSDT',  symbol: 'XMR',  name: 'Monero'          },
  { coin: 'NEOUSDT',  symbol: 'NEO',  name: 'NEO'             },
  { coin: 'EOSUSDT',  symbol: 'EOS',  name: 'EOS'             },
  { coin: 'DASHUSDT', symbol: 'DASH', name: 'Dash'            },
  { coin: 'ZECUSDT',  symbol: 'ZEC',  name: 'Zcash'           },
  { coin: 'IOTAUSDT', symbol: 'IOTA', name: 'IOTA'            },
  { coin: 'QTUMUSDT', symbol: 'QTUM', name: 'Qtum'            },
  { coin: 'OMGUSDT',  symbol: 'OMG',  name: 'OMG Network'     },
  { coin: 'ZRXUSDT',  symbol: 'ZRX',  name: '0x Protocol'     },
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

// ── Coin image map ────────────────────────────────────────────────────────────
const COIN_IMG: Record<string, string> = {
  BTC:  'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH:  'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  BNB:  'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  XRP:  'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  ADA:  'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  LTC:  'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  BCH:  'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
  ETC:  'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  TRX:  'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  XLM:  'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  XMR:  'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
  NEO:  'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png',
  EOS:  'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png',
  DASH: 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png',
  ZEC:  'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png',
  IOTA: 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png',
  QTUM: 'https://assets.coingecko.com/coins/images/684/large/qtum.png',
  OMG:  'https://assets.coingecko.com/coins/images/776/large/OMG_Network.jpg',
  ZRX:  'https://assets.coingecko.com/coins/images/863/large/0x.png',
  SOL:  'https://assets.coingecko.com/coins/images/4128/large/Solana.jpg',
  USDC: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  USD1: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
};

// ── Sub-components ────────────────────────────────────────────────────────────
function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

function CoinAvatar({ symbol, size = 'md' }: { symbol: string; size?: 'sm'|'md'|'lg' }) {
  const sym = symbol.replace('USDT','').toUpperCase();
  const img = COIN_IMG[sym];
  const [failed, setFailed] = useState(false);
  const dim = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  if (img && !failed) {
    return (
      <img src={img} alt={sym}
        className={`${dim} rounded-xl object-contain bg-white border border-gray-200 p-0.5 shrink-0`}
        onError={() => setFailed(true)} />
    );
  }
  return (
    <div className={`${dim} rounded-xl bg-gray-900 flex items-center justify-center shrink-0`}>
      <span className="text-white font-black text-[10px]">{sym.slice(0,3)}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: 'low'|'medium'|'high' }) {
  const cls = level === 'low'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : level === 'medium'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls} capitalize`}>
      {level}
    </span>
  );
}

function SignalBadge({ dir }: { dir: 'UP'|'DOWN' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
      dir === 'UP'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-rose-100 text-rose-700'
    }`}>
      {dir === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {dir}
    </span>
  );
}

// ── Redesigned Volume Bars ────────────────────────────────────────────────────
function VolumeBars({ data }: { data: CryptoData[] }) {
  const sorted = [...data].sort((a, b) => b.volume24h - a.volume24h).slice(0, 8);
  const max = sorted[0]?.volume24h ?? 1;
  return (
    <div className="space-y-2.5">
      {sorted.map((c, i) => {
        const sym = c.symbol.toUpperCase();
        const pct = Math.max((c.volume24h / max) * 100, 3);
        const rank = i + 1;
        return (
          <motion.div key={c.id}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, ease: 'easeOut' }}
            className="flex items-center gap-3 group">
            <span className="w-4 text-[10px] font-black text-gray-300 text-right shrink-0">{rank}</span>
            <CoinAvatar symbol={sym} size="sm" />
            <span className="w-9 text-xs font-bold text-gray-700 shrink-0">{sym.slice(0,4)}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: i * 0.07, ease: 'easeOut' }}
                className="h-full rounded-full flex items-center justify-end pr-3 min-w-[64px]"
                style={{ background: `linear-gradient(90deg, #111827 0%, #374151 100%)` }}
              >
                <span className="text-[11px] text-white font-bold whitespace-nowrap">
                  {fmtCompact(c.volume24h)}
                </span>
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Redesigned Donut Chart ────────────────────────────────────────────────────
function DonutChart({ data }: { data: CryptoData[] }) {
  const sorted = [...data].sort((a, b) => b.marketCap - a.marketCap).slice(0, 6);
  const total  = sorted.reduce((s, d) => s + d.marketCap, 0);
  const colors = ['#111827','#1d4ed8','#7c3aed','#0891b2','#059669','#d97706'];
  let cum = 0;
  const R = 42; const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-8">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
          <circle cx="50" cy="50" r={R} fill="transparent" stroke="#f3f4f6" strokeWidth="14" />
          {sorted.map((c, i) => {
            const pct = c.marketCap / total;
            const dash = `${pct * C - 1.5} ${C}`;
            const offset = -(cum * C);
            cum += pct;
            return (
              <motion.circle key={c.id} cx="50" cy="50" r={R}
                fill="transparent" stroke={colors[i]} strokeWidth="14"
                strokeDasharray={dash} strokeDashoffset={offset}
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{ strokeDasharray: dash }}
                transition={{ duration: 1.2, delay: i * 0.12, ease: 'easeOut' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] text-gray-400 font-medium">Total</p>
          <p className="text-sm font-black text-gray-900 leading-tight">{fmtCompact(total)}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {sorted.map((c, i) => {
          const sym = c.symbol.toUpperCase();
          const pct = ((c.marketCap / total) * 100).toFixed(1);
          return (
            <div key={c.id} className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[i] }} />
              <CoinAvatar symbol={sym} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-gray-900">{sym}</span>
                  <span className="text-xs font-bold text-gray-600">{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1">
                  <motion.div className="h-1 rounded-full"
                    style={{ background: colors[i] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{fmtCompact(c.marketCap)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Ensemble Summary Gauge ────────────────────────────────────────────────────
function EnsembleSummary({ predictions }: { predictions: Prediction[] }) {
  const loaded   = predictions.filter(p => !p.loading && !p.error);
  const bullish  = loaded.filter(p => p.direction === 'UP').length;
  const bearish  = loaded.length - bullish;
  const avgProb  = loaded.length ? loaded.reduce((s, p) => s + p.probability, 0) / loaded.length : 0.5;
  const R = 36; const C = 2 * Math.PI * R;
  const bullPct = loaded.length ? (bullish / loaded.length) * 100 : 50;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
            <circle cx="50" cy="50" r={R} fill="transparent" stroke="#f3f4f6" strokeWidth="14" />
            <motion.circle cx="50" cy="50" r={R} fill="transparent"
              stroke={avgProb >= 0.5 ? '#059669' : '#e11d48'} strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${avgProb * C} ${C}`}
              initial={{ strokeDasharray: `0 ${C}` }}
              animate={{ strokeDasharray: `${avgProb * C} ${C}` }}
              transition={{ duration: 1.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-black text-gray-900">{(avgProb * 100).toFixed(0)}%</p>
            <p className="text-[9px] text-gray-400 font-medium">avg conf</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600 font-medium">Bullish</span>
            </div>
            <span className="text-sm font-black text-emerald-600">{bullish}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div className="h-2 rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${bullPct}%` }}
              transition={{ duration: 1.2 }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs text-gray-600 font-medium">Bearish</span>
            </div>
            <span className="text-sm font-black text-rose-500">{bearish}</span>
          </div>
        </div>
      </div>
      {loaded.length < ALL_COINS.length && (
        <p className="text-[10px] text-gray-400 text-center">
          {loaded.length}/{ALL_COINS.length} coins loaded
        </p>
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
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Learning Progress</h3>
            <p className="text-[10px] text-gray-400">Your crypto education journey</p>
          </div>
        </div>
        <Link href="/learn"
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300">
          All Courses <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Completed',   value: lmsLoading ? '—' : `${completed}/${courses.length}`, icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-50' },
            { label: 'In Progress', value: lmsLoading ? '—' : String(inProgress),               icon: <BookOpen className="w-4 h-4 text-blue-500" />,         bg: 'bg-blue-50'    },
            { label: 'Certificates',value: lmsLoading ? '—' : String(certs),                    icon: <Award className="w-4 h-4 text-amber-500" />,           bg: 'bg-amber-50'   },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3.5 text-center`}>
              <div className="flex justify-center mb-1.5">{s.icon}</div>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        {lmsLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-14" />)}</div>
        ) : (
          <div className="space-y-1.5">
            {courses.map(c => {
              const done = c.progress?.completed;
              const lessonsCompleted = c.progress?.completed_lessons?.length ?? 0;
              const pct = c.lessonCount ? Math.round((lessonsCompleted / c.lessonCount) * 100) : 0;
              return (
                <Link key={c.slug} href={`/learn/${c.slug}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200">
                    <span className="text-2xl shrink-0">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2 font-medium">
                          {done ? '✅' : lessonsCompleted > 0 ? `${pct}%` : 'Start'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-gray-800'}`}
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
          <div className="text-center py-4 mt-2">
            <p className="text-sm text-gray-500 mb-3">Start your crypto education journey</p>
            <Link href="/learn"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
              <BookOpen className="w-4 h-4" /> Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser]             = useState<UserProfile | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [topGainers, setTopGainers] = useState<CryptoData[]>([]);
  const [topLosers, setTopLosers]   = useState<CryptoData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm]     = useState({ name: '', email: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState<{type:'success'|'error'; text:string}|null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState<'live'|'history'>('live');

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate]     = useState<string>('');
  const [dailyData, setDailyData]           = useState<any>(null);
  const [dailyLoading, setDailyLoading]     = useState(false);
  const [recording, setRecording]           = useState<boolean | null>(null);

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
        loading: false, error: undefined,
      }));
      fetch('/api/predictions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin,
          price_at_prediction:  d.market.close_price,
          ensemble_direction:   d.ensemble.direction,
          ensemble_probability: d.ensemble.probability,
          ensemble_confidence:  d.ensemble.confidence,
          xgb_direction:    d.models.xgboost?.direction,
          xgb_probability:  d.models.xgboost?.probability,
          lgbm_direction:   d.models.lightgbm?.direction,
          lgbm_probability: d.models.lightgbm?.probability,
          rf_direction:     d.models.random_forest?.direction,
          rf_probability:   d.models.random_forest?.probability,
          lstm_direction:   d.models.lstm?.direction,
          lstm_probability: d.models.lstm?.probability,
          rsi: d.market.rsi, macd: d.market.macd, bb_pct_b: d.market.bb_pct_b,
        }),
      }).catch(() => {});
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

  const fetchAvailableDates = useCallback(async () => {
    try {
      const res = await fetch('/api/predictions/daily?dates=true');
      if (res.ok) {
        const d = await res.json();
        const dates: string[] = d.dates || [];
        setAvailableDates(dates);
        if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0]);
      }
    } catch { /* silent */ }
  }, [selectedDate]);

  const fetchDailyRecords = useCallback(async (date: string) => {
    if (!date) return;
    setDailyLoading(true);
    try {
      const res = await fetch(`/api/predictions/daily?date=${date}`);
      if (res.ok) { const d = await res.json(); setDailyData(d); }
    } catch { /* silent */ }
    finally { setDailyLoading(false); }
  }, []);

  const clearAllHistory = useCallback(async () => {
    if (!confirm('Delete ALL prediction history records? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/predictions/daily', { method: 'DELETE' });
      if (res.ok) {
        setDailyData(null); setAvailableDates([]); setSelectedDate('');
        alert('All prediction history cleared.');
      }
    } catch { alert('Failed to clear history.'); }
  }, []);

  const fetchRecordingStatus = useCallback(async () => {
    try {
      const res = await fetch('/flask-api/scheduler/status');
      if (res.ok) { const d = await res.json(); setRecording(d.recording); }
    } catch { setRecording(false); }
  }, []);

  const toggleRecording = useCallback(async () => {
    const endpoint = recording ? '/flask-api/scheduler/stop' : '/flask-api/scheduler/start';
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) { const d = await res.json(); setRecording(d.recording); }
    } catch { /* silent */ }
  }, [recording]);

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

  const loadedPreds  = predictions.filter(p => !p.loading && !p.error);
  const bullishCount = loadedPreds.filter(p => p.direction === 'UP').length;
  const bearishCount = loadedPreds.length - bullishCount;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500 text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="h-24" />

      {/* ── Hero top bar ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Welcome back, <span className="font-semibold text-gray-700">{user?.name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tab switcher */}
              <div className="flex gap-0.5 bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setActiveTab('live')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'live' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <Brain className="w-3.5 h-3.5" /> Live
                </button>
                <button onClick={() => {
                  setActiveTab('history');
                  fetchAvailableDates();
                  const today = new Date().toISOString().slice(0,10);
                  setSelectedDate(today);
                  fetchDailyRecords(today);
                  fetchRecordingStatus();
                }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <History className="w-3.5 h-3.5" /> History
                </button>
              </div>
              <button onClick={refreshAll} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button onClick={() => setShowEditProfile(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
                <User className="w-3.5 h-3.5" /> Profile
              </button>
              <a href="/predictions"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors">
                <ArrowUpRight className="w-3.5 h-3.5" /> Predictions
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Stat row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Market Cap', value: '$2.4T',  sub: '+2.4% vs 24h', up: true,  icon: <Globe className="w-4 h-4 text-blue-500" /> },
            { label: '24h Volume',       value: '$84.2B', sub: '-1.2% vs 24h', up: false, icon: <BarChart3 className="w-4 h-4 text-violet-500" /> },
            {
              label: 'Bullish Signals',
              value: loadedPreds.length ? `${bullishCount}/${loadedPreds.length}` : '—',
              sub:   loadedPreds.length ? `${((bullishCount/loadedPreds.length)*100).toFixed(0)}% bullish` : 'Loading...',
              up: bullishCount >= bearishCount,
              icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
            },
            {
              label: 'Bearish Signals',
              value: loadedPreds.length ? `${bearishCount}/${loadedPreds.length}` : '—',
              sub:   loadedPreds.length ? `${((bearishCount/loadedPreds.length)*100).toFixed(0)}% bearish` : 'Loading...',
              up: false,
              icon: <TrendingDown className="w-4 h-4 text-rose-500" />,
            },
          ].map((card, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">{card.icon}</div>
              </div>
              <p className="text-2xl font-black text-gray-900 leading-none">{card.value}</p>
              <p className={`text-[11px] font-semibold mt-2 flex items-center gap-1 ${card.up ? 'text-emerald-600' : 'text-rose-500'}`}>
                {card.up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {card.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LIVE TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'live' && (
          <>
            {/* ── Main grid: predictions table + sidebar ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Predictions table */}
              <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                        <Brain className="w-3.5 h-3.5 text-white" />
                      </div>
                      Live AI Predictions — All 20 Coins
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5 ml-9">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      XGBoost · LightGBM · Random Forest · LSTM ensemble
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Coin</th>
                        <th className="text-right px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Price</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Signal</th>
                        <th className="text-right px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Prob</th>
                        <th className="text-right px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">RSI</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Risk</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Models</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {predictions.map((p, i) => (
                        <motion.tr key={p.coin}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <CoinAvatar symbol={p.symbol} size="sm" />
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{p.symbol}</p>
                                <p className="text-[10px] text-gray-400">{p.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800 text-sm">
                            {p.loading ? <Skel className="h-4 w-20 ml-auto" /> : p.error ? <span className="text-xs text-gray-300">offline</span> : fmt(p.currentPrice)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.loading ? <Skel className="h-6 w-14 mx-auto" /> : p.error ? <span className="text-xs text-gray-300">—</span> : <SignalBadge dir={p.direction} />}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.loading ? <Skel className="h-4 w-12 ml-auto" /> : p.error ? <span className="text-xs text-gray-300">—</span> : (
                              <span className={`font-bold text-sm ${p.direction === 'UP' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {(p.probability * 100).toFixed(1)}%
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.loading ? <Skel className="h-4 w-10 ml-auto" /> : p.error ? <span className="text-xs text-gray-300">—</span> : (
                              <span className={`font-medium text-sm ${p.rsi > 70 ? 'text-rose-500' : p.rsi < 30 ? 'text-emerald-600' : 'text-gray-700'}`}>
                                {p.rsi.toFixed(1)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.loading ? <Skel className="h-5 w-14 mx-auto" /> : p.error ? <span className="text-xs text-gray-300">—</span> : <RiskBadge level={p.riskLevel} />}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {p.loading ? <Skel className="h-4 w-28 mx-auto" /> : p.error ? null : (
                              <div className="flex items-center justify-center gap-1">
                                {[p.xgb_prob, p.lgbm_prob, p.rf_prob, p.lstm_prob].map((prob, mi) => (
                                  prob !== undefined ? (
                                    <span key={mi} title={['XGBoost','LightGBM','RF','LSTM'][mi]}
                                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${prob >= 0.5 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                                      {prob >= 0.5 ? <ArrowBigUp className="w-3.5 h-3.5" strokeWidth={2.5} /> : <ArrowBigDown className="w-3.5 h-3.5" strokeWidth={2.5} />}
                                    </span>
                                  ) : null
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-center">
                            {p.loading ? <Skel className="h-5 w-24 mx-auto" /> : p.error ? null : (() => {
                              const conf = Math.abs(p.probability - 0.5) * 2;
                              const isUp = p.direction === 'UP';
                              let label: string; let style: string;
                              if (isUp && conf >= 0.4 && p.riskLevel === 'low')       { label = 'Strong Buy';  style = 'bg-emerald-100 text-emerald-800 border-emerald-200'; }
                              else if (isUp && conf >= 0.2)                            { label = 'Buy';         style = 'bg-emerald-50 text-emerald-700 border-emerald-100'; }
                              else if (!isUp && conf >= 0.4 && p.riskLevel === 'low') { label = 'Strong Sell'; style = 'bg-rose-100 text-rose-800 border-rose-200'; }
                              else if (!isUp && conf >= 0.2)                           { label = 'Sell';        style = 'bg-rose-50 text-rose-700 border-rose-100'; }
                              else if (p.rsi > 70)                                     { label = 'Overbought'; style = 'bg-orange-50 text-orange-700 border-orange-200'; }
                              else if (p.rsi < 30)                                     { label = 'Oversold';   style = 'bg-blue-50 text-blue-700 border-blue-200'; }
                              else                                                      { label = 'Hold';       style = 'bg-gray-100 text-gray-600 border-gray-200'; }
                              return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${style}`}>{label}</span>;
                            })()}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Right sidebar ── */}
              <div className="space-y-4">
                {/* Ensemble gauge */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Cpu className="w-3.5 h-3.5 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Ensemble</h3>
                      <p className="text-[10px] text-gray-400">Model consensus</p>
                    </div>
                  </div>
                  <EnsembleSummary predictions={predictions} />
                </div>

                {/* Top Gainers */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="font-bold text-gray-900 text-sm">Top Gainers</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">24h</span>
                  </div>
                  <div className="p-3 space-y-1">
                    {topGainers.map((c, i) => (
                      <motion.div key={c.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-2">
                          <CoinAvatar symbol={c.symbol} size="sm" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{c.symbol.toUpperCase()}</p>
                            <p className="text-[10px] text-gray-400">{fmt(c.price)}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          +{c.percentChange24h.toFixed(2)}%
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Top Losers */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                      <span className="font-bold text-gray-900 text-sm">Top Losers</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">24h</span>
                  </div>
                  <div className="p-3 space-y-1">
                    {topLosers.map((c, i) => (
                      <motion.div key={c.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-2">
                          <CoinAvatar symbol={c.symbol} size="sm" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{c.symbol.toUpperCase()}</p>
                            <p className="text-[10px] text-gray-400">{fmt(c.price)}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          {c.percentChange24h.toFixed(2)}%
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Volume */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Trading Volume</h3>
                    <p className="text-[10px] text-gray-400">24h quote volume across assets</p>
                  </div>
                </div>
                <div className="p-6">
                  {cryptoData.length > 0 ? <VolumeBars data={cryptoData} /> : <Skel className="h-52" />}
                </div>
              </div>

              {/* Market cap */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Market Cap Distribution</h3>
                    <p className="text-[10px] text-gray-400">Relative market share by asset</p>
                  </div>
                </div>
                <div className="p-6">
                  {cryptoData.length > 0 ? <DonutChart data={cryptoData} /> : <Skel className="h-52" />}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            HISTORY TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="space-y-6">

            {/* ── History hero card ── */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden">
              {/* Top bar */}
              <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                      <History className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-black text-white text-lg tracking-tight">Model vs Market</h2>
                  </div>
                  <p className="text-xs text-gray-400 ml-10">What the model predicted vs what actually happened</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Recording indicator */}
                  {recording !== null && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                      <span className={`w-2 h-2 rounded-full ${recording ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                      <span className="text-xs text-gray-300 font-medium">{recording ? 'Recording' : 'Stopped'}</span>
                    </div>
                  )}
                  <button onClick={toggleRecording}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                      recording
                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}>
                    {recording ? <><Square className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Start</>}
                  </button>
                  <button onClick={() => { if (selectedDate) fetchDailyRecords(selectedDate); fetchAvailableDates(); }}
                    disabled={dailyLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${dailyLoading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                  <button onClick={clearAllHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-xl transition-colors border border-rose-500/20">
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>

              {/* Date pills */}
              <div className="px-6 pb-5 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const today    = new Date().toISOString().slice(0,10);
                    const allDates = availableDates.includes(today) ? availableDates : [today, ...availableDates];
                    return allDates.slice(0,10).map(date => {
                      const d       = new Date(date + 'T00:00:00');
                      const label   = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                      const isToday = date === today;
                      const isActive= selectedDate === date;
                      return (
                        <button key={date}
                          onClick={() => { setSelectedDate(date); fetchDailyRecords(date); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                          }`}>
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          {label}
                        </button>
                      );
                    });
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-3 py-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <input type="date" value={selectedDate}
                      onChange={e => { setSelectedDate(e.target.value); fetchDailyRecords(e.target.value); }}
                      className="bg-transparent text-white text-xs font-medium focus:outline-none [color-scheme:dark]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stats row (from daily data) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Predictions', icon: <BarChart3 className="w-4 h-4 text-gray-500" />,
                  value: dailyData?.overall?.total ?? '—', sub: 'intervals tracked', accent: '#111827',
                },
                {
                  label: 'Correct Calls', icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
                  value: dailyData?.overall?.correct ?? '—', sub: 'right predictions', accent: '#059669',
                },
                {
                  label: 'Wrong Calls', icon: <Target className="w-4 h-4 text-rose-500" />,
                  value: dailyData?.overall ? dailyData.overall.total - dailyData.overall.correct : '—',
                  sub: 'missed calls', accent: '#e11d48',
                },
                {
                  label: 'Overall Accuracy', icon: <Activity className="w-4 h-4 text-blue-500" />,
                  value: dailyData?.overall?.accuracy_pct != null ? `${dailyData.overall.accuracy_pct}%` : '—',
                  sub: 'for selected date', accent: '#2563eb',
                },
              ].map((card, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: card.accent }} />
                  <div className="flex items-center justify-between mb-3 pl-2">
                    <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                      {card.icon}
                    </div>
                  </div>
                  <p className="text-3xl font-black text-gray-900 leading-none mb-1 pl-2">{card.value}</p>
                  <p className="text-xs font-semibold text-gray-700 pl-2">{card.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 pl-2">{card.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Daily records panel ── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {dailyLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-12 h-12 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm text-gray-400 font-medium">Loading records...</p>
                </div>
              ) : !dailyData ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-base font-bold text-gray-600 mb-1">Select a date</p>
                  <p className="text-xs text-gray-400">Choose a date above to view prediction records</p>
                </div>
              ) : (
                <>
                  {/* Summary banner */}
                  {dailyData.overall && dailyData.overall.total > 0 && (
                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Date</p>
                          <p className="text-sm font-black text-gray-900">
                            {new Date(dailyData.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Accuracy</p>
                          <p className={`text-2xl font-black leading-none ${
                            (dailyData.overall.accuracy_pct ?? 0) >= 60 ? 'text-emerald-600' :
                            (dailyData.overall.accuracy_pct ?? 0) >= 40 ? 'text-amber-600' : 'text-rose-500'
                          }`}>{dailyData.overall.accuracy_pct ?? '—'}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Correct</p>
                          <p className="text-2xl font-black text-emerald-600 leading-none">{dailyData.overall.correct}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Total</p>
                          <p className="text-2xl font-black text-gray-700 leading-none">{dailyData.overall.total}</p>
                        </div>
                        {/* Mini accuracy bar */}
                        <div className="flex-1 min-w-[120px]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-400 font-medium">Accuracy rate</span>
                            <span className="text-[10px] font-bold text-gray-600">{dailyData.overall.accuracy_pct ?? 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div className="h-2 rounded-full"
                              style={{ background: (dailyData.overall.accuracy_pct ?? 0) >= 60 ? '#059669' : (dailyData.overall.accuracy_pct ?? 0) >= 40 ? '#d97706' : '#e11d48' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${dailyData.overall.accuracy_pct ?? 0}%` }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interval cards grid */}
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(dailyData.intervals || []).map((interval: any, idx: number) => {
                      const hasData = interval.has_data;
                      const acc     = interval.accuracy_pct;
                      const isGood  = acc >= 60;
                      const isMid   = acc >= 40 && acc < 60;
                      const barClr  = !hasData ? '#e5e7eb' : isGood ? '#059669' : isMid ? '#d97706' : '#e11d48';
                      const numClr  = !hasData ? 'text-gray-300' : isGood ? 'text-emerald-600' : isMid ? 'text-amber-600' : 'text-rose-500';
                      const bgCard  = !hasData ? 'bg-gray-50 border-gray-100' : isGood ? 'bg-emerald-50/60 border-emerald-100' : isMid ? 'bg-amber-50/60 border-amber-100' : 'bg-rose-50/60 border-rose-100';
                      return (
                        <motion.div key={interval.label}
                          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`rounded-2xl border-2 p-4 ${bgCard}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{interval.label}</p>
                            </div>
                            {interval.locked && hasData && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-full">
                                <Lock className="w-2.5 h-2.5" /> locked
                              </span>
                            )}
                            {!interval.locked && hasData && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> live
                              </span>
                            )}
                          </div>
                          <p className={`text-4xl font-black leading-none mb-1 ${numClr}`}>
                            {hasData ? `${acc}%` : '—'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium mb-3">
                            {hasData ? `${interval.correct} / ${interval.total} correct` : interval.pending ? 'Pending...' : 'No data'}
                          </p>
                          <div className="w-full bg-white/80 rounded-full h-1.5 mb-3 overflow-hidden">
                            <motion.div className="h-1.5 rounded-full"
                              style={{ background: barClr }}
                              initial={{ width: 0 }}
                              animate={{ width: hasData ? `${Math.round(acc)}%` : '0%' }}
                              transition={{ duration: 0.9, delay: idx * 0.05 }}
                            />
                          </div>
                          {hasData && (
                            <div className="flex flex-wrap gap-1">
                              {interval.coins.map((c: any) => {
                                const sym = c.coin.replace('USDT','');
                                const img = COIN_IMG[sym];
                                return (
                                  <div key={c.coin}
                                    title={`${sym}: ${c.predicted_dir} → ${c.actual_dir ?? '?'} (${c.change_pct != null ? (c.change_pct >= 0 ? '+' : '') + c.change_pct.toFixed(2) + '%' : '—'})`}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center ring-1 overflow-hidden cursor-default ${
                                      c.correct === true ? 'ring-emerald-400' : c.correct === false ? 'ring-rose-400' : 'ring-gray-200'
                                    }`}>
                                    {img
                                      ? <img src={img} alt={sym} className="w-full h-full object-contain" />
                                      : <span className="text-[7px] font-black text-gray-600">{sym.slice(0,2)}</span>
                                    }
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Per-coin summary table */}
                  {dailyData.coin_summary && dailyData.coin_summary.length > 0 && (
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                          <span className="w-5 h-5 bg-gray-900 rounded-lg flex items-center justify-center">
                            <Activity className="w-3 h-3 text-white" />
                          </span>
                          Per-Coin Summary
                          <span className="text-[11px] font-medium text-gray-400 ml-1">
                            {new Date((dailyData.date ?? '') + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </h3>
                      </div>
                      <div className="border border-gray-200 rounded-2xl overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Coin</th>
                              <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Intervals</th>
                              <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Correct</th>
                              <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Accuracy</th>
                              <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Bar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {dailyData.coin_summary.map((c: any, i: number) => {
                              const acc  = c.accuracy_pct ?? 0;
                              const good = acc >= 60;
                              const mid  = acc >= 40 && acc < 60;
                              return (
                                <motion.tr key={c.coin}
                                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  transition={{ delay: i * 0.03 }}
                                  className="hover:bg-gray-50/80 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <CoinAvatar symbol={c.coin} size="sm" />
                                      <div>
                                        <p className="font-bold text-gray-900 text-sm">{c.coin.replace('USDT','')}</p>
                                        <p className="text-[10px] text-gray-400">{c.coin}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-bold text-gray-600">{c.total}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-bold text-emerald-600">{c.correct}</span>
                                    <span className="text-xs text-gray-300"> / {c.total}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {c.accuracy_pct != null ? (
                                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                                        good ? 'bg-emerald-100 text-emerald-700' :
                                        mid  ? 'bg-amber-100 text-amber-700'    :
                                               'bg-rose-100 text-rose-600'
                                      }`}>{c.accuracy_pct}%</span>
                                    ) : <span className="text-gray-300 text-xs">—</span>}
                                  </td>
                                  <td className="px-4 py-3 hidden sm:table-cell">
                                    <div className="w-24 bg-gray-100 rounded-full h-1.5 mx-auto overflow-hidden">
                                      <motion.div className="h-1.5 rounded-full"
                                        style={{ background: good ? '#059669' : mid ? '#d97706' : '#e11d48' }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${acc}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.03 }}
                                      />
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Market movers + charts (history bottom) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Top Gainers */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm">Top Gainers</h3>
                      <p className="text-[10px] text-gray-400">24h performance</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">24h</span>
                </div>
                <div className="p-4 space-y-1">
                  {topGainers.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-2.5">
                        <CoinAvatar symbol={c.symbol} />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{c.symbol.toUpperCase()}</p>
                          <p className="text-[10px] text-gray-400">{fmt(c.price)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">+{c.percentChange24h.toFixed(2)}%</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Top Losers */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-rose-100 rounded-xl flex items-center justify-center">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm">Top Losers</h3>
                      <p className="text-[10px] text-gray-400">24h performance</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">24h</span>
                </div>
                <div className="p-4 space-y-1">
                  {topLosers.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-2.5">
                        <CoinAvatar symbol={c.symbol} />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{c.symbol.toUpperCase()}</p>
                          <p className="text-[10px] text-gray-400">{fmt(c.price)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">{c.percentChange24h.toFixed(2)}%</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Ensemble */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">Ensemble Summary</h3>
                    <p className="text-[10px] text-gray-400">Live model consensus</p>
                  </div>
                </div>
                <div className="p-5"><EnsembleSummary predictions={predictions} /></div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Trading Volume</h3>
                    <p className="text-[10px] text-gray-400">24h quote volume</p>
                  </div>
                </div>
                <div className="p-6">{cryptoData.length > 0 ? <VolumeBars data={cryptoData} /> : <Skel className="h-48" />}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Market Cap Distribution</h3>
                    <p className="text-[10px] text-gray-400">Relative market share</p>
                  </div>
                </div>
                <div className="p-6">{cryptoData.length > 0 ? <DonutChart data={cryptoData} /> : <Skel className="h-48" />}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── LMS widget ── */}
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
