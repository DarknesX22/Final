'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/components/providers';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, TrendingUp, Brain, Shield, BookOpen, Award, Mail, KeyRound } from 'lucide-react';

const PERKS = [
  { icon: Brain,      text: 'Live AI predictions — 4 ML models' },
  { icon: TrendingUp, text: '20 cryptocurrencies on Binance data' },
  { icon: BookOpen,   text: 'Full crypto learning hub' },
  { icon: Award,      text: 'Earn certificates as you learn' },
  { icon: Shield,     text: 'Free forever — no credit card' },
];

function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const label = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][score];
  const color = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'][score];
  const textColor = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600', 'text-green-700'][score];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${textColor}`}>{label}</p>
    </div>
  );
}

export default function SignupPage() {
  // Step 1 — form fields
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]                   = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [step, setStep]                       = useState<'form' | 'otp'>('form');

  // Step 2 — OTP
  const [otp, setOtp]                         = useState(['','','','','','']);
  const [otpLoading, setOtpLoading]           = useState(false);
  const [sendLoading, setSendLoading]         = useState(false);
  const [resendCooldown, setResendCooldown]   = useState(0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name)                             e.name    = 'Full name is required';
    if (!email)                            e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email   = 'Invalid email address';
    if (!password)                         e.password = 'Password is required';
    else if (password.length < 8)          e.password = 'At least 8 characters required';
    if (password !== confirmPassword)      e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSendLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to send OTP'); return; }
      toast.success(`OTP sent to ${email}`);
      setStep('otp');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } catch { toast.error('Something went wrong. Try again.'); }
    finally { setSendLoading(false); }
  };

  const handleOtpChange = (val: string, idx: number) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = v; setOtp(next);
    if (v && idx < 5) document.getElementById(`otp-${idx+1}`)?.focus();
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx-1}`)?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter the full 6-digit OTP'); return; }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code, name, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Invalid OTP'); return; }
      toast.success('Account created! Redirecting...');
      setTimeout(() => { window.location.href = '/dashboard'; }, 900);
    } catch { toast.error('Something went wrong. Try again.'); }
    finally { setOtpLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setSendLoading(true);
    try {
      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      setOtp(['','','','','','']);
      toast.success('New OTP sent');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } finally { setSendLoading(false); }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-gray-900 font-black text-lg">C</span>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Coin<span className="text-gray-400">IQ</span>
          </span>
        </Link>
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Start trading<br /><span className="text-gray-400">smarter today.</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm">
              Create a free account and get instant access to live AI predictions, crypto education, and real-time market data.
            </p>
            <ul className="space-y-4 mb-10">
              {PERKS.map((p, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.09 }} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                    <p.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-300 text-sm">{p.text}</span>
                </motion.li>
              ))}
            </ul>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex -space-x-2">
                {['U','R','H','S'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-950 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{l}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400">Join <span className="text-white font-semibold">50,000+</span> traders already using Coin-IQ</p>
            </div>
          </motion.div>
        </div>
        <p className="text-xs text-gray-600 relative z-10">© 2026 Coin-IQ · Not financial advice</p>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-white overflow-y-auto">
        <div className="lg:hidden mb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">C</span>
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Coin<span className="text-gray-500">IQ</span></span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Registration form ── */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-gray-900 mb-2">Create your account</h1>
                  <p className="text-gray-500">Free forever — no credit card required</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                      className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-gray-900 bg-white'}`} />
                    {errors.name && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                      className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none transition-all ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-gray-900 bg-white'}`} />
                    {errors.email && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                        className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl text-base focus:outline-none transition-all ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-gray-900 bg-white'}`} />
                      <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <StrengthBar password={password} />
                    {errors.password && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                        className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl text-base focus:outline-none transition-all ${errors.confirmPassword ? 'border-red-400 bg-red-50' : confirmPassword && confirmPassword === password ? 'border-green-400 bg-green-50' : 'border-gray-200 focus:border-gray-900 bg-white'}`} />
                      <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.confirmPassword}</p>}
                  </div>

                  <button type="submit" disabled={sendLoading}
                    className="w-full py-4 bg-black text-white text-base font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                    {sendLoading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {sendLoading ? 'Sending OTP...' : 'Continue — Verify Email'}
                  </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold text-gray-900 hover:underline">Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: OTP verification ── */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 mb-2">Verify your email</h1>
                  <p className="text-gray-500 text-sm">
                    We sent a 6-digit code to<br />
                    <span className="font-semibold text-gray-900">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* OTP boxes */}
                  <div className="flex gap-3 justify-center">
                    {otp.map((digit, idx) => (
                      <input key={idx} id={`otp-${idx}`}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleOtpChange(e.target.value, idx)}
                        onKeyDown={e => handleOtpKeyDown(e, idx)}
                        className={`w-12 h-14 text-center text-xl font-black border-2 rounded-xl focus:outline-none transition-all ${
                          digit ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 focus:border-gray-900 bg-white text-gray-900'
                        }`} />
                    ))}
                  </div>

                  <button type="submit" disabled={otpLoading || otp.join('').length < 6}
                    className="w-full py-4 bg-black text-white text-base font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {otpLoading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {otpLoading ? 'Verifying...' : 'Verify & Create Account'}
                  </button>

                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-500">
                      Didn&apos;t receive it?{' '}
                      <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || sendLoading}
                        className="font-semibold text-gray-900 hover:underline disabled:text-gray-400 disabled:no-underline">
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                      </button>
                    </p>
                    <button type="button" onClick={() => setStep('form')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                      ← Change email
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
