'use client';

import { motion } from '@/components/providers';
import { Cookie, Settings, ToggleLeft, RefreshCw, Info, Mail } from 'lucide-react';

const LAST_UPDATED = 'June 3, 2026';

const COOKIE_TYPES = [
  {
    type: 'Essential',
    required: true,
    icon: '🔒',
    color: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cookies: [
      {
        name: 'auth_token',
        purpose: 'Authentication session token (JWT). Keeps you logged in across page loads.',
        duration: '7 days',
        type: 'HttpOnly, Secure',
      },
      {
        name: 'csrf_token',
        purpose: 'Cross-site request forgery protection. Prevents unauthorised form submissions.',
        duration: 'Session',
        type: 'SameSite=Strict',
      },
    ],
  },
  {
    type: 'Functional',
    required: false,
    icon: '⚙️',
    color: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    cookies: [
      {
        name: 'dashboard_tab',
        purpose: 'Remembers your last active dashboard tab (Live or History) between sessions.',
        duration: '30 days',
        type: 'First-party',
      },
      {
        name: 'learn_progress',
        purpose: 'Caches locally the last lesson you were viewing to allow quick resume.',
        duration: '90 days',
        type: 'First-party',
      },
    ],
  },
];

const SECTIONS = [
  {
    id: 'what-are-cookies',
    icon: Info,
    title: 'What Are Cookies?',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    text: 'Cookies are small text files that websites store on your device. They enable the site to remember information about your visit — such as your login state or preferences — so you don\'t have to re-enter it every time. Cookies are not programs and cannot access your files or execute code.',
  },
  {
    id: 'how-we-use',
    icon: Cookie,
    title: 'How We Use Cookies',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    text: 'Coin-IQ uses cookies strictly for essential authentication and limited functional preferences. We do not use any advertising cookies, cross-site tracking cookies, or third-party analytics cookies. Every cookie we set has a specific, documented purpose listed in the table below.',
  },
  {
    id: 'no-third-party',
    icon: Settings,
    title: 'No Third-Party Tracking',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    text: 'We have deliberately chosen not to integrate Google Analytics, Facebook Pixel, advertising networks, or any other third-party tracking service. This means no external company can track your behaviour across the web based on your visit to Coin-IQ.',
  },
  {
    id: 'control',
    icon: ToggleLeft,
    title: 'Your Control',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    text: 'You can manage or delete cookies through your browser settings at any time. Note that disabling essential cookies (like auth_token) will prevent you from staying logged in. Most browsers allow you to block cookies for specific sites while keeping them enabled elsewhere.',
  },
];

const BROWSERS = [
  { name: 'Chrome',  url: 'https://support.google.com/chrome/answer/95647' },
  { name: 'Firefox', url: 'https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer' },
  { name: 'Safari',  url: 'https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471' },
  { name: 'Edge',    url: 'https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge' },
];

export default function CookiesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
                <Cookie className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Legal</p>
                <h1 className="text-2xl font-black text-gray-900 leading-none">Cookie Policy</h1>
              </div>
            </div>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
              We use cookies only where necessary. No ad tracking, no third-party analytics. Here's exactly what we set and why.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <RefreshCw className="w-3.5 h-3.5" /> Last updated: {LAST_UPDATED}
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Cookie className="w-3 h-3" /> 4 cookies total
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cookie table */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">Cookies we set</p>
          <div className="space-y-6">
            {COOKIE_TYPES.map((ct, ci) => (
              <motion.div key={ct.type}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }}
                className={`border-2 rounded-2xl overflow-hidden ${ct.color}`}>
                <div className="px-6 py-4 flex items-center justify-between border-b border-current border-opacity-10">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{ct.icon}</span>
                    <span className="font-black text-gray-900">{ct.type} Cookies</span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${ct.badge}`}>
                    {ct.required ? 'Always active' : 'Optional'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/60">
                      <tr>
                        {['Cookie name', 'Purpose', 'Duration', 'Type'].map(h => (
                          <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/50">
                      {ct.cookies.map(c => (
                        <tr key={c.name} className="bg-white/40 hover:bg-white/70 transition-colors">
                          <td className="px-6 py-4">
                            <code className="text-xs font-mono font-bold text-gray-800 bg-white px-2 py-0.5 rounded-lg border border-gray-200">{c.name}</code>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs leading-relaxed max-w-xs">{c.purpose}</td>
                          <td className="px-6 py-4 text-gray-600 text-xs font-medium whitespace-nowrap">{c.duration}</td>
                          <td className="px-6 py-4 text-gray-500 text-xs">{c.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Explanatory sections */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          {SECTIONS.map((s, si) => (
            <motion.div key={s.id} id={s.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: si * 0.06 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <h2 className="text-lg font-black text-gray-900">{s.title}</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed pl-12">{s.text}</p>
            </motion.div>
          ))}

          {/* Browser controls */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Manage cookies in your browser
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BROWSERS.map(b => (
                <a key={b.name} href={b.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all">
                  {b.name}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gray-950 text-white rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg mb-2">Cookie questions?</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  If you have questions about how we use cookies or want to report an unexpected cookie, get in touch.
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
