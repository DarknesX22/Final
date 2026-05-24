'use client';

import { useState } from 'react';
import { motion } from '@/components/providers';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, TrendingUp, Brain, Shield, BookOpen } from 'lucide-react';

const FEATURES = [
  { icon: Brain,      text: 'AI ensemble of 4 ML models' },
  { icon: TrendingUp, text: 'Live predictions for 20 coins' },
  { icon: Shield,     text: 'Up to 74.3% model accuracy' },
  { icon: BookOpen,   text: 'Crypto learning hub + certificates' },
];

const STATS = [
  { value: '20',    label: 'Coins' },
  { value: '4',     label: 'Models' },
  { value: '74.3%', label: 'Accuracy' },
  { value: 'Free',  label: 'Forever' },
];

export default function LoginPage() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email)                          e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email   = 'Invalid email address';
    if (!password)                       e.password = 'Password is required';
    else if (password.length < 6)        e.password = 'At least 6 characters required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Invalid credentials'); return; }
      toast.success(data.isAdmin ? 'Welcome, Admin!' : 'Welcome back!');
      setTimeout(() => {
        window.location.href = data.redirect ?? '/dashboard';
      }, 900);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — dark branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-gray-900 font-black text-lg">C</span>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Coin<span className="text-gray-400">IQ</span>
          </span>
        </Link>

        {/* Main copy */}
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              AI-powered crypto<br />
              <span className="text-gray-400">predictions.</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm">
              Four machine learning models running on live Binance data — giving you an edge on every trade.
            </p>

            {/* Feature list */}
            <ul className="space-y-4 mb-10">
              {FEATURES.map((f, i) => (
                <motion.li key={i}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-300 text-sm">{f.text}</span>
                </motion.li>
              ))}
            </ul>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              {STATS.map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="text-center">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom note */}
        <p className="text-xs text-gray-600 relative z-10">
          © 2026 Coin-IQ · Not financial advice
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-white">

        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">C</span>
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              Coin<span className="text-gray-500">IQ</span>
            </span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500">Sign in to your Coin-IQ account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none transition-all ${
                  errors.email
                    ? 'border-red-400 focus:border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-gray-900 bg-white'
                }`}
              />
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-sm text-red-500 font-medium">
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl text-base focus:outline-none transition-all ${
                    errors.password
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-gray-900 bg-white'
                  }`}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-sm text-red-500 font-medium">
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                Remember me for 7 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-black text-white text-base font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading && (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-bold text-gray-900 hover:underline">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
