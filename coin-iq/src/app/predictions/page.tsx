"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/providers';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import PredictionDashboard from '@/components/prediction-dashboard';
import { TrendingUp, Brain, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PredictionsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Form state
  const [tab, setTab]                     = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading]   = useState(false);
  const [showLoginPw, setShowLoginPw]     = useState(false);
  const [signupName, setSignupName]         = useState('');
  const [signupEmail, setSignupEmail]       = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLoading, setSignupLoading]   = useState(false);
  const [showSignupPw, setShowSignupPw]     = useState(false);

  const checkAuth = () => {
    fetch('/api/auth/me')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  };

  useEffect(() => { checkAuth(); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast.error('Please fill in all fields'); return; }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Signup failed'); return; }
      toast.success('Account created! Loading predictions...');
      checkAuth();
    } catch { toast.error('Something went wrong. Try again.'); }
    finally { setSignupLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="h-16" />

      {/* ── Auth section — shown at top when not logged in ── */}
      <AnimatePresence>
        {authed === false && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="bg-gray-50 border-b border-gray-200"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

                {/* Left — pitch */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-full mb-6 uppercase tracking-widest">
                    <Brain className="w-3.5 h-3.5" /> AI Predictions
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-5">
                    Real-Time Market<br />
                    <span className="text-gray-400">Predictions</span>
                  </h1>
                  <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
                    Sign in to unlock live AI forecasts for 20 cryptocurrencies — powered by XGBoost, LightGBM, Random Forest and LSTM running on live Binance data.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      '4 ML models in ensemble',
                      'Up to 74.3% accuracy',
                      '20 coins covered',
                      'Free forever',
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — form card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">

                  {/* Tab switcher */}
                  <div className="flex border-b border-gray-100">
                    {(['login', 'signup'] as const).map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${
                          tab === t
                            ? 'text-gray-900 border-b-2 border-gray-900 bg-white'
                            : 'text-gray-400 hover:text-gray-600 bg-gray-50'
                        }`}>
                        {t === 'login' ? 'Sign In' : 'Create Account'}
                      </button>
                    ))}
                  </div>

                  <div className="px-8 py-7">
                    <AnimatePresence mode="wait">

                      {/* ── Login form ── */}
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
                              <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                                Forgot password?
                              </Link>
                            </div>
                            <div className="relative">
                              <input type={showLoginPw ? 'text' : 'password'} value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                placeholder="••••••••" required
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

                      {/* ── Signup form ── */}
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

      {/* ── Prediction dashboard — blurred preview when not authed ── */}
      <div className={`relative ${authed === false ? 'pointer-events-none select-none' : ''}`}>
        {authed === false && (
          <div className="absolute inset-0 z-10"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.55)' }} />
        )}
        <div className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {authed === true && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Real-Time Market Predictions</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  AI-powered forecasts for major cryptocurrencies with confidence scores
                </p>
              </motion.div>
            )}
            <PredictionDashboard />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
