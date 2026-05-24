'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import {
  ExternalLink, Clock, X, ArrowUpRight,
  ChevronLeft, ChevronRight, Newspaper, Radio, BookOpen,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  body: string;
  url: string;
  imageUrl: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ── Source styles (light theme) ───────────────────────────────────────────────
const SOURCE_STYLE: Record<string, { badge: string; bar: string }> = {
  CoinDesk:      { badge: 'bg-blue-50 text-blue-700 border border-blue-100',    bar: 'bg-blue-500' },
  CoinTelegraph: { badge: 'bg-amber-50 text-amber-700 border border-amber-100', bar: 'bg-amber-500' },
  Decrypt:       { badge: 'bg-violet-50 text-violet-700 border border-violet-100', bar: 'bg-violet-500' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateString: string) {
  const diffH = Math.floor((Date.now() - new Date(dateString).getTime()) / 3_600_000);
  const diffD = Math.floor(diffH / 24);
  if (diffH < 1)  return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7)  return `${diffD}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function readMins(body: string) {
  return Math.max(1, Math.ceil(body.split(' ').length / 200));
}

// ── Source badge ──────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_STYLE[source] ?? { badge: 'bg-gray-100 text-gray-600 border border-gray-200', bar: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.bar}`} />
      {source}
    </span>
  );
}

// ── Article modal ─────────────────────────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: NewsArticle; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  const s = SOURCE_STYLE[article.source] ?? { badge: '', bar: 'bg-gray-300' };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-200"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* Hero image */}
          <div className="aspect-[16/7] overflow-hidden rounded-t-3xl sm:rounded-t-2xl bg-gray-100">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          <div className="p-6 sm:p-8">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <SourceBadge source={article.source} />
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeAgo(article.publishedAt)}
              </span>
              <span className="text-gray-400 text-xs">{readMins(article.body)} min read</span>
            </div>

            {/* Accent bar */}
            <div className={`h-0.5 w-10 mb-5 rounded-full ${s.bar}`} />

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-5">
              {article.title}
            </h2>

            {/* Body */}
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
              {article.body || article.description}
            </p>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-gray-400">
                Published on <span className="text-gray-700 font-medium">{article.source}</span>
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Full Article <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Featured card (large hero) ────────────────────────────────────────────────
function FeaturedCard({ article, onClick }: { article: NewsArticle; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer bg-gray-100 h-full min-h-[400px] flex flex-col justify-end border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <img
        src={article.imageUrl}
        alt={article.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            `https://placehold.co/800x500/f3f4f6/9ca3af?text=${encodeURIComponent(article.source)}`;
        }}
      />
      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

      <div className="relative p-6 sm:p-8">
        <SourceBadge source={article.source} />
        <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white leading-snug line-clamp-3 mb-3 drop-shadow">
          {article.title}
        </h2>
        <p className="text-white/75 text-sm line-clamp-2 mb-5">{article.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-xs flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {timeAgo(article.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">
            Read More <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Secondary card ────────────────────────────────────────────────────────────
function SecondaryCard({ article, onClick }: { article: NewsArticle; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer bg-gray-100 flex flex-col justify-end min-h-[190px] border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <img
        src={article.imageUrl}
        alt={article.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            `https://placehold.co/600x300/f3f4f6/9ca3af?text=${encodeURIComponent(article.source)}`;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
      <div className="relative p-4 sm:p-5">
        <SourceBadge source={article.source} />
        <h3 className="mt-2 text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 mb-1.5 drop-shadow">
          {article.title}
        </h3>
        <span className="text-white/60 text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" /> {timeAgo(article.publishedAt)}
        </span>
      </div>
    </motion.div>
  );
}

// ── List card (compact row) ───────────────────────────────────────────────────
function ListCard({ article, index, onClick }: { article: NewsArticle; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://placehold.co/96x96/f3f4f6/9ca3af?text=${article.source.slice(0, 2)}`;
          }}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <SourceBadge source={article.source} />
          <h3 className="mt-1.5 text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-black transition-colors">
            {article.title}
          </h3>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-400 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo(article.publishedAt)}
            <span className="mx-1 text-gray-300">·</span>
            {readMins(article.body)} min
          </span>
          <span className="text-xs text-gray-400 group-hover:text-black transition-colors flex items-center gap-0.5 font-medium">
            Read <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
function SkeletonFeatured() {
  return <div className="rounded-2xl bg-gray-100 animate-pulse min-h-[400px] border border-gray-200" />;
}
function SkeletonSecondary() {
  return <div className="rounded-2xl bg-gray-100 animate-pulse min-h-[190px] border border-gray-200" />;
}
function SkeletonList() {
  return (
    <div className="flex gap-4 p-4 animate-pulse">
      <div className="shrink-0 w-20 h-20 rounded-xl bg-gray-100 border border-gray-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
        <div className="h-3.5 bg-gray-100 rounded w-full" />
        <div className="h-3.5 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Paginator({ pagination, current, onGo }: {
  pagination: Pagination; current: number; onGo: (p: number) => void;
}) {
  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - current) <= 1)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onGo(current - 1)}
        disabled={current === 1}
        className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-gray-700" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="w-10 text-center text-gray-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onGo(p as number)}
            className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
              p === current
                ? 'bg-black text-white shadow-sm'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onGo(current + 1)}
        disabled={current === pagination.totalPages}
        className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const [articles, setArticles]       = useState<NewsArticle[]>([]);
  const [pagination, setPagination]   = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [selected, setSelected]       = useState<NewsArticle | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?page=${page}`);
      if (!res.ok) throw new Error('Failed to load news');
      const data = await res.json();
      setArticles(data.articles ?? []);
      setPagination(data.pagination ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(currentPage); }, [currentPage, fetchPage]);

  const goTo = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featured  = articles[0] ?? null;
  const secondary = articles.slice(1, 3);
  const listItems = articles.slice(3);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="h-16" />

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 mb-5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Live Feed</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Cryptocurrency News
            </h1>

            <div className="flex flex-wrap items-center gap-6">
              <p className="text-gray-500 text-base max-w-xl">
                Real-time stories from CoinDesk, CoinTelegraph &amp; Decrypt — refreshed every 5 minutes.
              </p>
              {pagination && (
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Newspaper className="w-4 h-4" /> {pagination.total} articles
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-4 h-4" /> 3 sources
                  </span>
                </div>
              )}
            </div>

            {/* Source legend */}
            <div className="flex flex-wrap items-center gap-4 mt-5">
              {Object.entries(SOURCE_STYLE).map(([name, { badge, bar }]) => (
                <span key={name} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${bar}`} /> {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchPage(currentPage)}
              className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Featured row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-3">
            {loading
              ? <SkeletonFeatured />
              : featured && <FeaturedCard article={featured} onClick={() => setSelected(featured)} />
            }
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            {loading
              ? <><SkeletonSecondary /><SkeletonSecondary /></>
              : secondary.map(a => (
                  <SecondaryCard key={a.id} article={a} onClick={() => setSelected(a)} />
                ))
            }
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">More Stories</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ── List rows ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => <SkeletonList key={i} />)
            : listItems.map((a, i) => (
                <ListCard key={a.id} article={a} index={i} onClick={() => setSelected(a)} />
              ))
          }
        </div>

        {/* Empty */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-24">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No articles right now</h3>
            <p className="text-gray-400 text-sm">Feeds refresh every 5 minutes.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && !loading && (
          <Paginator pagination={pagination} current={currentPage} onGo={goTo} />
        )}
      </div>

      <Footer />

      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
