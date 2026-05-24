'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Award, CheckCircle, ExternalLink } from 'lucide-react';

interface CertData {
  certificateId: string; userName: string;
  courseTitle: string; courseLevel: string; issuedAt: string;
}

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/learn/certificate/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(d => { setCert(d); setLoading(false); })
      .catch(() => { setError('Certificate not found.'); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !cert) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <Link href="/learn" className="text-sm text-gray-900 underline">Back to Learning Hub</Link>
      </div>
    </div>
  );

  const issued = new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="h-16" />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500">Certificate of Completion</p>
          <p className="text-xs text-gray-400 mt-1">ID: {cert.certificateId}</p>
        </div>

        {/* Certificate card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-gray-900 rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden">

          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-gray-300 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-gray-300 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-gray-300 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-gray-300 rounded-br-lg" />

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">C</span>
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">Coin<span className="text-gray-500">IQ</span></span>
          </div>

          <p className="text-sm text-gray-500 uppercase tracking-widest mb-3">This certifies that</p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">{cert.userName}</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-3">has successfully completed</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{cert.courseTitle}</h2>
          <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium mb-8">
            {cert.courseLevel} Level
          </span>

          <div className="flex items-center justify-center gap-2 mb-8">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Issued on {issued}</span>
          </div>

          {/* Award icon */}
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
            Print / Save PDF
          </button>
          <Link href="/learn"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Back to Learning Hub
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Verify this certificate at: {typeof window !== 'undefined' ? window.location.href : ''}
        </p>
      </div>

      <Footer />
    </div>
  );
}
