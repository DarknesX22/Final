'use client';

import { motion } from '@/components/providers';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { ArrowUpRight, Brain, BarChart3, Shield, BookOpen, Zap, Users, Target, TrendingUp, CheckCircle } from 'lucide-react';

const TEAM = [
  {
    name: 'Umair Ahmed',
    role: 'CEO & Founder',
    init: 'UA',
    gradient: 'from-gray-900 to-gray-700',
    bio: 'Former crypto trader with 10+ years in financial markets and algorithmic trading. Leads product vision and strategy.',
    tags: ['Strategy', 'Trading', 'Leadership'],
  },
  {
    name: 'Rian Siddique',
    role: 'Lead Data Scientist',
    init: 'RS',
    gradient: 'from-blue-900 to-blue-700',
    bio: 'PhD in Machine Learning, specialising in time-series analysis and predictive modelling. Architect of the ensemble system.',
    tags: ['ML', 'Python', 'Research'],
  },
  {
    name: 'Hassan Mukhtar',
    role: 'Head of Engineering',
    init: 'HM',
    gradient: 'from-violet-900 to-violet-700',
    bio: 'Full-stack developer specialising in blockchain technology and financial applications. Built the entire platform.',
    tags: ['Next.js', 'Flask', 'PostgreSQL'],
  },
];

const STATS = [
  { value: '74.3%', label: 'Model Accuracy', sub: 'XGBoost on ETC/USDT' },
  { value: '20',    label: 'Coins Covered',  sub: 'Live Binance data' },
  { value: '4',     label: 'ML Models',      sub: 'Ensemble predictions' },
  { value: '50K+',  label: 'Traders',        sub: 'Trust Coin-IQ' },
];

const HOW = [
  { icon: BarChart3, step: '01', title: 'Live Data Ingestion',   desc: 'We pull real-time OHLCV klines from Binance every hour — open, high, low, close, volume and 30+ derived indicators.' },
  { icon: Brain,     step: '02', title: 'Feature Engineering',   desc: 'RSI, MACD, Bollinger Bands, EMA crossovers, taker-buy ratios, lag features and volatility windows are computed automatically.' },
  { icon: Zap,       step: '03', title: 'Ensemble Prediction',   desc: 'Four models — XGBoost, LightGBM, Random Forest and LSTM — each vote on next-day direction. Their probabilities are averaged.' },
  { icon: Target,    step: '04', title: 'Confidence Scoring',    desc: 'The further the ensemble probability from 50%, the higher the confidence. Risk level is derived from this distance.' },
];

const VALUES = [
  {
    icon: Shield,
    title: 'Transparency',
    desc: 'Our model accuracy figures are real — sourced from held-out test sets, not cherry-picked backtests.',
    points: ['Open methodology', 'Real test-set metrics', 'No hidden fees'],
    color: 'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
  },
  {
    icon: Brain,
    title: 'Rigour',
    desc: 'Every prediction is backed by four independently trained models. No single point of failure.',
    points: ['4-model ensemble', 'Cross-validated accuracy', 'Continuous retraining'],
    color: 'bg-violet-50 border-violet-100',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
  },
  {
    icon: BookOpen,
    title: 'Education',
    desc: 'We built a full learning hub so users understand the markets they trade — not just the signals.',
    points: ['4 crypto courses', 'Quizzes & certificates', 'Beginner to advanced'],
    color: 'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
  {
    icon: Users,
    title: 'Accessibility',
    desc: 'Professional-grade analysis, free to use. No Bloomberg terminal required.',
    points: ['Free forever', 'No credit card', 'Mobile friendly'],
    color: 'bg-green-50 border-green-100',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-700',
  },
];

// Tech stack with real SVG icons
const TECH = [
  {
    name: 'Next.js 16',
    category: 'Frontend',
    desc: 'App Router, server components, API routes, Turbopack',
    icon: (
      <svg viewBox="0 0 180 180" className="w-7 h-7" fill="currentColor">
        <mask id="m" style={{ maskType: 'alpha' }}>
          <circle cx="90" cy="90" r="90" />
        </mask>
        <circle cx="90" cy="90" r="90" fill="black" />
        <g mask="url(#m)">
          <circle cx="90" cy="90" r="90" fill="black" />
          <path d="M149.508 157.52L69.142 54H54V125.97H66.1V69.3L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="white" />
          <rect x="115" y="54" width="12" height="72" fill="url(#ng)" />
          <defs>
            <linearGradient id="ng" x1="121" y1="54" x2="121" y2="106" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </g>
      </svg>
    ),
    bg: 'bg-black',
    text: 'text-white',
  },
  {
    name: 'TypeScript',
    category: 'Language',
    desc: 'Strict typing across the entire codebase',
    icon: (
      <svg viewBox="0 0 400 400" className="w-7 h-7" fill="none">
        <rect width="400" height="400" rx="50" fill="#3178C6" />
        <path d="M87.7 242v-13.4h106.7V242H87.7zm0-26.8v-13.4h106.7v13.4H87.7zm0-26.8v-13.4h106.7v13.4H87.7z" fill="white" />
        <path d="M220 188.6h40.5v13.4H220v-13.4zm0 26.8h40.5v13.4H220v-13.4zm0 26.8h40.5V256H220v-13.8z" fill="white" />
        <path d="M220 162h40.5v13.4H220V162z" fill="white" />
        <text x="200" y="290" textAnchor="middle" fill="white" fontSize="120" fontWeight="bold" fontFamily="Arial">TS</text>
      </svg>
    ),
    bg: 'bg-blue-600',
    text: 'text-white',
  },
  {
    name: 'Python / Flask',
    category: 'Backend',
    desc: 'ML model serving API — XGBoost, LightGBM, RF, LSTM',
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7">
        <path d="M24.047 5c-1.555.005-3.042.124-4.347.35-3.855.678-4.553 2.098-4.553 4.72v3.46h9.107v1.153H11.4c-2.652 0-4.972 1.594-5.7 4.623-.84 3.47-.877 5.636 0 9.257.65 2.697 2.203 4.623 4.855 4.623h3.14v-4.16c0-3.012 2.606-5.667 5.7-5.667h9.1c2.538 0 4.553-2.09 4.553-4.634V10.07c0-2.473-2.086-4.33-4.553-4.72A49.12 49.12 0 0024.047 5zm-4.92 2.677c.94 0 1.706.78 1.706 1.74s-.766 1.74-1.706 1.74c-.94 0-1.706-.78-1.706-1.74s.766-1.74 1.706-1.74z" fill="#3776AB"/>
        <path d="M33.347 14.683v4.04c0 3.14-2.662 5.78-5.7 5.78h-9.1c-2.498 0-4.553 2.137-4.553 4.634v8.683c0 2.473 2.15 3.925 4.553 4.634 2.882.847 5.646.999 9.1 0 2.294-.664 4.553-2 4.553-4.634v-3.46h-9.1v-1.153h13.653c2.652 0 3.64-1.85 4.553-4.623.948-2.852.908-5.597 0-9.257-.652-2.633-1.9-4.623-4.553-4.623h-3.406zm-5.12 21.97c.94 0 1.706.78 1.706 1.74s-.766 1.74-1.706 1.74c-.94 0-1.706-.78-1.706-1.74s.766-1.74 1.706-1.74z" fill="#FFD43B"/>
      </svg>
    ),
    bg: 'bg-yellow-400',
    text: 'text-gray-900',
  },
  {
    name: 'PostgreSQL',
    category: 'Database',
    desc: 'User auth, LMS progress, certificates, admin data',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z" fill="#336791"/>
        <path d="M22.5 10.5c-.5-1.5-2-2.5-3.5-2.5-1 0-2 .5-2.5 1.5-.5-1-1.5-1.5-2.5-1.5-1.5 0-3 1-3.5 2.5-.5 1.5 0 3 1 4l4 5 4-5c1-1 1.5-2.5 1-4z" fill="white"/>
      </svg>
    ),
    bg: 'bg-blue-800',
    text: 'text-white',
  },
  {
    name: 'TensorFlow / Keras',
    category: 'ML Framework',
    desc: 'LSTM sequence model with 24-step lookback window',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <path d="M16 2L4 8.5v15L16 30l12-6.5v-15L16 2z" fill="#FF6F00"/>
        <path d="M16 2v28M4 8.5l12 6.5 12-6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M16 15.5v7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    bg: 'bg-orange-500',
    text: 'text-white',
  },
  {
    name: 'XGBoost',
    category: 'ML Model',
    desc: 'Per-coin gradient boosting — up to 74.3% accuracy',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <rect width="32" height="32" rx="6" fill="#189AB4"/>
        <text x="16" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">XGB</text>
      </svg>
    ),
    bg: 'bg-teal-600',
    text: 'text-white',
  },
  {
    name: 'Tailwind CSS 4',
    category: 'Styling',
    desc: 'Utility-first CSS — every component hand-crafted',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <path d="M16 6.4c-4.267 0-6.933 2.133-8 6.4 1.6-2.133 3.467-2.933 5.6-2.4 1.218.304 2.088 1.186 3.048 2.16C18.186 14.115 19.84 16 24 16c4.267 0 6.933-2.133 8-6.4-1.6 2.133-3.467 2.933-5.6 2.4-1.218-.304-2.088-1.186-3.048-2.16C21.814 8.285 20.16 6.4 16 6.4zM8 16c-4.267 0-6.933 2.133-8 6.4 1.6-2.133 3.467-2.933 5.6-2.4 1.218.304 2.088 1.186 3.048 2.16C10.186 23.715 11.84 25.6 16 25.6c4.267 0 6.933-2.133 8-6.4-1.6 2.133-3.467 2.933-5.6 2.4-1.218-.304-2.088-1.186-3.048-2.16C13.814 17.885 12.16 16 8 16z" fill="#38BDF8"/>
      </svg>
    ),
    bg: 'bg-sky-500',
    text: 'text-white',
  },
  {
    name: 'Binance API',
    category: 'Data Source',
    desc: 'Live OHLCV klines — no API key required for market data',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <rect width="32" height="32" rx="6" fill="#F3BA2F"/>
        <path d="M16 8l2.5 2.5-2.5 2.5-2.5-2.5L16 8zM10 13l2.5 2.5L10 18l-2.5-2.5L10 13zM22 13l2.5 2.5L22 18l-2.5-2.5L22 13zM16 18l2.5 2.5-2.5 2.5-2.5-2.5L16 18z" fill="white"/>
        <path d="M16 13l3 3-3 3-3-3 3-3z" fill="white"/>
      </svg>
    ),
    bg: 'bg-yellow-500',
    text: 'text-gray-900',
  },
  {
    name: 'Framer Motion',
    category: 'Animation',
    desc: 'Smooth transitions and micro-interactions throughout',
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <rect width="32" height="32" rx="6" fill="#0055FF"/>
        <path d="M8 8h16v8H16L8 8zM8 16h8l8 8H8v-8z" fill="white"/>
      </svg>
    ),
    bg: 'bg-blue-600',
    text: 'text-white',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="h-16" />

      {/* ── Hero ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block px-4 py-1.5 bg-black text-white text-xs font-semibold uppercase tracking-widest rounded-full mb-6">
                About Coin-IQ
              </span>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-6">
                AI that reads<br />
                <span className="text-gray-400">the market</span>
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
                Coin-IQ is a cryptocurrency prediction platform powered by four machine learning models trained on real Binance market data. We built it to give every trader access to institutional-grade analysis.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/predictions"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors">
                  Try Predictions <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link href="/learn"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Learning Hub
                </Link>
              </div>
            </motion.div>

            {/* Stats grid */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
              className="grid grid-cols-2 gap-4">
              {STATS.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className={`rounded-2xl p-6 border ${i === 0 ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-4xl font-black mb-1 ${i === 0 ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
                  <p className={`text-sm font-semibold ${i === 0 ? 'text-gray-300' : 'text-gray-700'}`}>{s.label}</p>
                  <p className={`text-xs mt-1 ${i === 0 ? 'text-gray-500' : 'text-gray-400'}`}>{s.sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-14">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Under the hood</span>
            <h2 className="text-4xl font-black tracking-tight mt-2">How predictions work</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW.map((h, i) => (
              <motion.div key={h.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <h.icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <span className="text-3xl font-black text-gray-100">{h.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{h.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our story ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Our story</span>
              <h2 className="text-4xl font-black tracking-tight mt-2 mb-6">Built for traders,<br />by traders</h2>
              <div className="space-y-4 text-gray-500 text-base leading-relaxed">
                <p>Coin-IQ started as a final-year project with one question: can machine learning reliably predict next-day crypto price direction?</p>
                <p>We trained four models on years of Binance kline data, added technical indicators, and built an ensemble that achieves up to 74.3% accuracy on held-out test data.</p>
                <p>Then we wrapped it in a platform anyone can use — live predictions, a learning hub, real-time news, and a full analytics suite.</p>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="space-y-0">
              {[
                { year: '2023', title: 'Research begins',       desc: 'Data collection, feature engineering, first model experiments.' },
                { year: '2024', title: 'Models trained',        desc: 'XGBoost, LightGBM, RF and LSTM trained on 3+ years of Binance data.' },
                { year: '2025', title: 'Platform launched',     desc: 'Next.js frontend, Flask API, PostgreSQL backend go live.' },
                { year: '2026', title: 'Learning hub added',    desc: '4 courses, quizzes and certificates for crypto education.' },
              ].map((t, i) => (
                <div key={t.year} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">{t.year.slice(2)}</div>
                    {i < 3 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-8">
                    <p className="font-bold text-gray-900">{t.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">What we stand for</span>
            <h2 className="text-4xl font-black tracking-tight mt-2 mb-4">Our values</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Four principles that guide every decision we make — from model design to product features.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <motion.div key={v.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`border-2 rounded-3xl p-8 hover:shadow-lg transition-all duration-300 ${v.color}`}>
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${v.iconBg}`}>
                    <v.icon className={`w-7 h-7 ${v.iconColor}`} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-900 mb-2">{v.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">{v.desc}</p>
                    <ul className="space-y-1.5">
                      {v.points.map(pt => (
                        <li key={pt} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className={`w-4 h-4 shrink-0 ${v.iconColor}`} strokeWidth={2} />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">The people</span>
            <h2 className="text-4xl font-black tracking-tight mt-2 mb-4">Our team</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Three people who built Coin-IQ from scratch — combining trading experience, ML expertise and engineering depth.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM.map((m, i) => (
              <motion.div key={m.name}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="group bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Gradient header */}
                <div className={`bg-gradient-to-br ${m.gradient} p-8 flex flex-col items-center text-center relative overflow-hidden`}>
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />
                  <div className="relative w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                    <span className="text-white font-black text-2xl">{m.init}</span>
                  </div>
                  <h3 className="text-xl font-black text-white">{m.name}</h3>
                  <p className="text-sm text-white/70 font-medium mt-1">{m.role}</p>
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{m.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {m.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Built with</span>
            <h2 className="text-4xl font-black tracking-tight mt-2 mb-4">Technology stack</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Every tool chosen for a reason — performance, reliability, and developer experience.</p>
          </motion.div>

          {/* Category groups */}
          {[
            { label: 'Frontend & Styling', items: TECH.filter(t => ['Frontend', 'Language', 'Styling', 'Animation'].includes(t.category)) },
            { label: 'Backend & Data',     items: TECH.filter(t => ['Backend', 'Database', 'Data Source'].includes(t.category)) },
            { label: 'Machine Learning',   items: TECH.filter(t => ['ML Framework', 'ML Model'].includes(t.category)) },
          ].map((group, gi) => (
            <div key={group.label} className="mb-10">
              <motion.p initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: gi * 0.1 }}
                className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">
                {group.label}
              </motion.p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {group.items.map((t, i) => (
                  <motion.div key={t.name}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: gi * 0.1 + i * 0.07 }}
                    className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${t.bg} ${t.text} group-hover:scale-105 transition-transform`}>
                        {t.icon}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm leading-tight">{t.name}</p>
                        <span className="text-xs text-gray-400 font-medium">{t.category}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gray-950 text-white rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-black mb-4">Ready to trade smarter?</h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of traders using Coin-IQ's AI predictions to make better decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors">
                  Get Started Free <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link href="/predictions"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors">
                  View Live Predictions
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
