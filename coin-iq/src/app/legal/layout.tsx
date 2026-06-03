'use client';

import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Link from 'next/link';
import { motion } from '@/components/providers';
import { Shield, FileText, Cookie, AlertTriangle } from 'lucide-react';

const LEGAL_PAGES = [
  { label: 'Privacy Policy',   href: '/legal/privacy',   icon: Shield       },
  { label: 'Terms of Service', href: '/legal/terms',     icon: FileText     },
  { label: 'Cookie Policy',    href: '/legal/cookies',   icon: Cookie       },
  { label: 'Disclaimer',       href: '/legal/disclaimer',icon: AlertTriangle },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="h-16" />

      {/* Sub-navigation */}
      <div className="border-b border-gray-200 bg-gray-50 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
            {LEGAL_PAGES.map(p => (
              <Link key={p.href} href={p.href}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all whitespace-nowrap border border-transparent hover:border-gray-200">
                <p.icon className="w-3.5 h-3.5" />
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main>{children}</main>
      <Footer />
    </div>
  );
}
