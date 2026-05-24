'use client';

import Link from 'next/link';
import { motion } from './providers';
import { Github, Twitter, Linkedin, MessageCircle, ArrowUpRight } from 'lucide-react';

const LINKS = {
  Platform: [
    { label: 'Predictions', href: '/predictions' },
    { label: 'Live Coins',  href: '/coins' },
    { label: 'Markets',     href: '/markets' },
    { label: 'Analytics',   href: '/analytics' },
    { label: 'News',        href: '/news' },
    { label: 'Learn',       href: '/learn' },
  ],
  Company: [
    { label: 'About',       href: '/about' },
    { label: 'Dashboard',   href: '/dashboard' },
    { label: 'Sign Up',     href: '/signup' },
    { label: 'Login',       href: '/login' },
  ],
  Legal: [
    { label: 'Privacy Policy',    href: '#' },
    { label: 'Terms of Service',  href: '#' },
    { label: 'Cookie Policy',     href: '#' },
    { label: 'Disclaimer',        href: '#' },
  ],
};

const SOCIALS = [
  { icon: Twitter,       label: 'Twitter',  href: '#' },
  { icon: Github,        label: 'GitHub',   href: '#' },
  { icon: Linkedin,      label: 'LinkedIn', href: '#' },
  { icon: MessageCircle, label: 'Discord',  href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      {/* Top CTA strip */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1">Stay ahead of the market</h3>
            <p className="text-gray-400 text-sm">Get AI-powered predictions for 20+ cryptocurrencies — free.</p>
          </div>
          <Link href="/signup"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors">
            Get Started Free <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <span className="text-gray-900 font-black text-lg">C</span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                Coin<span className="text-gray-400">IQ</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              AI-powered cryptocurrency predictions using XGBoost, LightGBM, Random Forest and LSTM models — trained on real market data.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <s.icon className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">© 2026 Coin-IQ. All rights reserved.</p>
          <p className="text-xs text-gray-600 text-center">
            Not financial advice. Cryptocurrency trading involves significant risk.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
