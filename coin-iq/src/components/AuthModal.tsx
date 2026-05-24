'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/providers';
import Link from 'next/link';
import { X, Brain, TrendingUp, BookOpen, Award, Shield } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** What the user was trying to do — shown in the heading */
  reason?: string;
}

const PERKS = [
  { icon: TrendingUp, text: 'Live AI predictions for 20 cryptocurrencies' },
  { icon: Brain,      text: 'Ensemble of 4 ML models — XGBoost, LSTM & more' },
  { icon: BookOpen,   text: 'Full crypto learning hub with certificates' },
  { icon: Award,      text: 'Track your progress and earn achievements' },
  { icon: Shield,     text: 'Free forever — no credit card required' },
];

export default function AuthModal({ open, onClose, reason }: AuthModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Dark header */}
            <div className="bg-gray-950 px-8 pt-8 pb-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>

              <h2 className="text-2xl font-black text-white leading-tight mb-2">
                {reason ? `Sign in to ${reason}` : 'Sign in to continue'}
              </h2>
              <p className="text-gray-400 text-sm">
                Create a free account to unlock all of Coin-IQ's features.
              </p>
            </div>

            {/* Body */}
            <div className="px-8 py-6">
              {/* Perks list */}
              <ul className="space-y-3 mb-6">
                {PERKS.map((p, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <p.icon className="w-3.5 h-3.5 text-gray-700" />
                    </div>
                    <span className="text-sm text-gray-600">{p.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/signup"
                  className="w-full py-3 bg-black text-white text-sm font-bold rounded-xl text-center hover:bg-gray-800 transition-colors"
                  onClick={onClose}
                >
                  Create Free Account
                </Link>
                <Link
                  href="/login"
                  className="w-full py-3 border-2 border-gray-200 text-sm font-semibold rounded-xl text-center hover:bg-gray-50 transition-colors text-gray-700"
                  onClick={onClose}
                >
                  Sign In
                </Link>
              </div>

              <p className="text-center text-xs text-gray-400 mt-4">
                No credit card required · Free forever
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
