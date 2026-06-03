'use client';

import { motion } from '@/components/providers';
import { AlertTriangle, TrendingDown, Brain, BookOpen, Scale, RefreshCw, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const LAST_UPDATED = 'June 3, 2026';

const WARNINGS = [
  {
    icon: '📉',
    title: 'Cryptocurrency is highly volatile',
    desc: 'Crypto asset prices can fall — or rise — by 50% or more in a matter of days. You can lose your entire investment.',
    color: 'border-rose-200 bg-rose-50 text-rose-900',
  },
  {
    icon: '🤖',
    title: 'AI predictions are probabilistic',
    desc: 'Our models predict the more likely price direction with ~65–74% accuracy. That means they are wrong 26–35% of the time.',
    color: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  {
    icon: '📜',
    title: 'Not regulated financial advice',
    desc: 'Coin-IQ is not a registered investment advisor. Nothing on this platform constitutes regulated financial advice.',
    color: 'border-blue-200 bg-blue-50 text-blue-900',
  },
];

const SECTIONS = [
  {
    id: 'no-financial-advice',
    icon: Scale,
    title: 'Not Financial Advice',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    paras: [
      'All content published on Coin-IQ — including AI-generated predictions, market analytics, news summaries, accuracy statistics, and educational materials — is provided for informational and educational purposes only.',
      'Nothing on this platform should be interpreted as a recommendation to buy, sell, hold, or otherwise trade any cryptocurrency or other financial instrument. Coin-IQ is not a licensed financial advisor, broker, dealer, or investment professional in any jurisdiction.',
      'You should consult a qualified financial advisor before making any investment decisions. Any trading or investment activity you undertake is solely at your own risk.',
    ],
  },
  {
    id: 'prediction-accuracy',
    icon: Brain,
    title: 'About Our Prediction Accuracy',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    paras: [
      'Our published accuracy figures (e.g. "74.3% accuracy for XGBoost on ETC/USDT") are calculated on held-out test datasets that the models were not trained on. These figures represent historical model performance and do not guarantee future results.',
      'Cryptocurrency markets are influenced by regulatory announcements, macroeconomic events, exchange failures, and other unpredictable factors that no machine learning model can reliably anticipate. Black swan events will produce incorrect predictions.',
      'Model accuracy varies significantly across different coins, time periods, and market conditions. A model that achieved 74% accuracy in its test period may perform differently in live trading conditions.',
    ],
  },
  {
    id: 'investment-risk',
    icon: TrendingDown,
    title: 'Investment Risk',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    paras: [
      'Trading cryptocurrencies involves substantial risk of loss. The value of digital assets can decrease significantly or go to zero. Unlike bank deposits, cryptocurrency holdings are generally not insured by any government guarantee scheme.',
      'Leveraged trading, futures, and options on cryptocurrencies carry even greater risk and are entirely outside the scope of anything discussed on this platform. Do not use Coin-IQ predictions to inform leveraged trading decisions.',
      'Past returns — whether from cryptocurrencies generally or from acting on specific model predictions — do not indicate or guarantee future returns.',
    ],
  },
  {
    id: 'data-accuracy',
    icon: RefreshCw,
    title: 'Data Accuracy & Availability',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    paras: [
      'Market data displayed on Coin-IQ is sourced from the Binance public API and may be delayed, incomplete, or temporarily unavailable due to API outages or network issues. We make no warranty that prices, volumes, or other data are accurate or current.',
      'News content is aggregated from third-party RSS feeds (CoinDesk, CoinTelegraph, Decrypt). We do not verify the accuracy of third-party news and are not responsible for errors or omissions in aggregated content.',
      'The platform may be temporarily unavailable during maintenance, infrastructure issues, or unexpected outages. We do not guarantee continuous uptime.',
    ],
  },
  {
    id: 'educational',
    icon: BookOpen,
    title: 'Educational Content',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    paras: [
      'Course content in the Coin-IQ learning hub is designed to provide general knowledge about cryptocurrency markets, trading concepts, and blockchain technology. It is not a substitute for professional financial education or formal qualifications.',
      'Certificates issued by Coin-IQ are acknowledgements of course completion only and carry no regulatory standing, professional accreditation, or formal qualification status.',
    ],
  },
];

export default function DisclaimerPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Legal</p>
                <h1 className="text-2xl font-black text-gray-900 leading-none">Disclaimer</h1>
              </div>
            </div>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
              Coin-IQ provides AI predictions and market information for educational purposes. Please read this disclaimer carefully before using our predictions for any purpose.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <RefreshCw className="w-3.5 h-3.5" /> Last updated: {LAST_UPDATED}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Warning cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Key warnings</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {WARNINGS.map((w, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`border-2 rounded-2xl p-5 ${w.color}`}>
                <span className="text-2xl mb-3 block">{w.icon}</span>
                <p className="font-black text-sm mb-2">{w.title}</p>
                <p className="text-xs leading-relaxed opacity-80">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main bold disclaimer */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-rose-900 mb-2">Important Notice</p>
              <p className="text-rose-800 text-sm leading-relaxed">
                <strong>COIN-IQ IS NOT A FINANCIAL ADVISOR.</strong> The predictions, analytics, and information provided on this platform are for educational and informational purposes only. They do not constitute financial, investment, trading, or any other type of professional advice. Never invest money you cannot afford to lose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed sections */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {SECTIONS.map((s, si) => (
            <motion.div key={s.id} id={s.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: si * 0.06 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <h2 className="text-xl font-black text-gray-900">{s.title}</h2>
              </div>
              <div className="pl-12 space-y-4">
                {s.paras.map((p, pi) => (
                  <p key={pi} className="text-gray-600 text-sm leading-relaxed">{p}</p>
                ))}
              </div>
            </motion.div>
          ))}

          {/* CTA to learn more */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gray-950 text-white rounded-2xl p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <h3 className="font-black text-lg mb-2">Want to learn how our models work?</h3>
                <p className="text-gray-400 text-sm">
                  Visit our Learning Hub to understand the methodology behind our predictions before acting on any signal.
                </p>
              </div>
              <Link href="/learn"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors whitespace-nowrap">
                Learning Hub <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
