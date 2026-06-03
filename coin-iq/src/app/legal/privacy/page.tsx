'use client';

import { motion } from '@/components/providers';
import { Shield, Eye, Database, Lock, UserCheck, Mail, RefreshCw, Globe } from 'lucide-react';

const LAST_UPDATED = 'June 3, 2026';

const SECTIONS = [
  {
    id: 'information-collected',
    icon: Database,
    title: 'Information We Collect',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    content: [
      {
        subtitle: 'Account Information',
        text: 'When you register, we collect your name, email address, and a hashed password. We never store plaintext passwords — all credentials are secured using bcrypt with a cost factor of 12.',
      },
      {
        subtitle: 'Usage Data',
        text: 'We log page visits, prediction interactions, and course progress to improve the platform. This includes your IP address (anonymised after 30 days), browser type, and session timestamps.',
      },
      {
        subtitle: 'Learning Progress',
        text: 'Lesson completions, quiz scores, and certificates earned are stored to personalise your experience and allow you to resume courses across sessions.',
      },
    ],
  },
  {
    id: 'how-we-use',
    icon: Eye,
    title: 'How We Use Your Information',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    content: [
      {
        subtitle: 'Service Delivery',
        text: 'We use your data to authenticate your account, save your prediction history, track learning progress, and issue certificates. This is the core purpose of collecting your information.',
      },
      {
        subtitle: 'Platform Improvement',
        text: 'Aggregated, anonymised usage statistics help us understand which features are most valuable. We do not sell or share individual user data with third parties for marketing purposes.',
      },
      {
        subtitle: 'Communications',
        text: 'We may send transactional emails (password resets, certificate issuance) to the address you provided. You will never receive unsolicited marketing from us.',
      },
    ],
  },
  {
    id: 'data-storage',
    icon: Lock,
    title: 'Data Storage & Security',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    content: [
      {
        subtitle: 'Database Security',
        text: 'All user data is stored in a PostgreSQL database. Sensitive fields (passwords) are one-way hashed. Database access is restricted to application service accounts with minimal required permissions.',
      },
      {
        subtitle: 'Authentication Tokens',
        text: 'Session tokens are signed JWTs stored as HttpOnly cookies, making them inaccessible to client-side JavaScript. Tokens expire after 7 days and are invalidated on logout.',
      },
      {
        subtitle: 'Data Retention',
        text: 'Your account data is retained for as long as your account exists. You may request full deletion at any time by contacting us. Anonymised analytics data may be retained indefinitely.',
      },
    ],
  },
  {
    id: 'your-rights',
    icon: UserCheck,
    title: 'Your Rights',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    content: [
      {
        subtitle: 'Access & Portability',
        text: 'You have the right to request a copy of all personal data we hold about you. We will provide this in JSON format within 30 days of your request.',
      },
      {
        subtitle: 'Correction & Deletion',
        text: 'You can update your name and email directly from your profile settings. To permanently delete your account and all associated data, contact us at the email address below.',
      },
      {
        subtitle: 'Objection & Restriction',
        text: 'You may object to certain processing activities or request that we restrict how we use your data. We will respond to all valid requests within 30 days.',
      },
    ],
  },
  {
    id: 'third-parties',
    icon: Globe,
    title: 'Third-Party Services',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    content: [
      {
        subtitle: 'Binance API',
        text: 'We fetch live market data from Binance\'s public API. Your personal information is never transmitted to Binance. This is a server-to-server request using only public endpoints.',
      },
      {
        subtitle: 'News Sources',
        text: 'Our news feed aggregates RSS feeds from CoinDesk, CoinTelegraph, and Decrypt. We do not share any user data with these providers.',
      },
      {
        subtitle: 'No Advertising Networks',
        text: 'We do not use any third-party advertising networks, analytics trackers (e.g. Google Analytics), or social media pixels. Your browsing behaviour on Coin-IQ stays on Coin-IQ.',
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Legal</p>
                <h1 className="text-2xl font-black text-gray-900 leading-none">Privacy Policy</h1>
              </div>
            </div>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
              We take your privacy seriously. This policy explains exactly what data we collect, why we collect it, and how we protect it.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <RefreshCw className="w-3.5 h-3.5" /> Last updated: {LAST_UPDATED}
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> GDPR-aware
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick summary cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">At a glance</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🚫', title: 'No data selling',    desc: 'We never sell your personal data to third parties — ever.' },
              { icon: '🔒', title: 'Passwords hashed',   desc: 'bcrypt with cost factor 12. We cannot read your password.' },
              { icon: '🗑️', title: 'Right to deletion',  desc: 'Request full account deletion at any time. No questions asked.' },
            ].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-5">
                <span className="text-2xl mb-3 block">{c.icon}</span>
                <p className="font-bold text-gray-900 text-sm mb-1">{c.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {SECTIONS.map((s, si) => (
            <motion.div key={s.id} id={s.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: si * 0.06 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                </div>
                <h2 className="text-xl font-black text-gray-900">{s.title}</h2>
              </div>
              <div className="space-y-5 pl-12">
                {s.content.map((c, ci) => (
                  <div key={ci} className="border-l-2 border-gray-100 pl-5">
                    <p className="font-bold text-gray-800 text-sm mb-1.5">{c.subtitle}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Contact */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gray-950 text-white rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg mb-2">Questions about your data?</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  For data access requests, deletion requests, or any privacy-related questions, contact us directly. We respond within 5 business days.
                </p>
                <a href="mailto:privacy@coin-iq.app"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors">
                  privacy@coin-iq.app
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
