'use client';

import { motion } from '@/components/providers';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useTopCryptos } from '@/hooks/useCryptoData';
import { useState } from 'react';
import { CryptoData } from '@/types/crypto';
import { TrendingUp, TrendingDown, ArrowUpDown, Search, X, Activity, DollarSign, BarChart3, Globe } from 'lucide-react';

export default function CoinsPage() {
  const { cryptos, loading, error } = useTopCryptos(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'marketCap' | 'price' | 'percentChange24h' | 'volume24h'>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 20;

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const filteredAndSortedCryptos = cryptos
    .filter(crypto =>
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (a[sortField] - b[sortField]) * multiplier;
    });

  const totalPages = Math.ceil(filteredAndSortedCryptos.length / itemsPerPage);
  const paginatedCryptos = filteredAndSortedCryptos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCryptoModal = (crypto: CryptoData) => {
    setSelectedCrypto(crypto);
    setIsModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${price.toFixed(6)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Navbar />
        <div className="h-16" />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading cryptocurrency data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Navbar />
        <div className="h-16" />
        <div className="flex items-center justify-center py-32">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="h-16" />

      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-black tracking-tight text-black mb-3">Explore Crypto</h1>
            <p className="text-lg text-gray-500">
              Track prices, market caps and trading volumes in real-time
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Market stats ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Market Overview</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Market Cap',       value: '$2.4T',  change: '+2.4%', up: true,  icon: Globe },
              { label: '24h Trading Volume',     value: '$84.2B', change: '-1.2%', up: false, icon: Activity },
              { label: 'BTC Dominance',          value: '52.3%',  change: '+0.5%', up: true,  icon: BarChart3 },
              { label: 'Active Cryptocurrencies',value: '12,847', change: '+1.8%', up: true,  icon: DollarSign },
            ].map((stat, i) => (
              <motion.div key={stat.label} whileHover={{ y: -2 }}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <div className="p-2 bg-gray-100 rounded-xl">
                    <stat.icon className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-3xl font-black text-black mb-2">{stat.value}</p>
                <div className="flex items-center gap-1.5">
                  {stat.up
                    ? <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                    : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                  <span className={`text-sm font-semibold ${stat.up ? 'text-green-600' : 'text-red-500'}`}>{stat.change}</span>
                  <span className="text-xs text-gray-400">24h</span>
                </div>
                <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${[72, 58, 52, 85][i]}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                    className="h-full bg-black rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Table ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold text-black">Crypto Market Prices</h2>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white placeholder-gray-400"
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('price')}>
                      <div className="flex items-center justify-end gap-1">Price <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('percentChange24h')}>
                      <div className="flex items-center justify-end gap-1">24h Change <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('marketCap')}>
                      <div className="flex items-center justify-end gap-1">Market Cap <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('volume24h')}>
                      <div className="flex items-center justify-end gap-1">Volume (24h) <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="text-center py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedCryptos.map((crypto, index) => (
                    <motion.tr key={crypto.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-gray-400 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                            {crypto.image && typeof crypto.image === 'string' && crypto.image.startsWith('http') ? (
                              <img src={crypto.image} alt={crypto.name} className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold text-gray-600">${crypto.symbol.substring(0, 2).toUpperCase()}</span>`;
                                }} />
                            ) : (
                              <span className="text-xs font-bold text-gray-600">{crypto.symbol.substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{crypto.name}</p>
                            <p className="text-xs text-gray-400 uppercase font-medium">{crypto.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-sm text-gray-900">{formatPrice(crypto.price)}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold text-sm ${crypto.percentChange24h >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {crypto.percentChange24h >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {crypto.percentChange24h >= 0 ? '+' : ''}{crypto.percentChange24h?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-gray-600 font-medium">{formatCurrency(crypto.marketCap)}</td>
                      <td className="py-4 px-4 text-right text-sm text-gray-600 font-medium">{formatCurrency(crypto.volume24h)}</td>
                      <td className="py-4 px-4 text-center">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => openCryptoModal(crypto)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors">
                          <Activity className="w-3.5 h-3.5" />
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAndSortedCryptos.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-gray-400">No results for &ldquo;{searchTerm}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${
                    currentPage === page ? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}>
                  {page}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          )}

          <p className="mt-4 text-sm text-gray-400 text-center">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredAndSortedCryptos.length)} of {filteredAndSortedCryptos.length} assets
          </p>
        </motion.div>
      </div>

      <Footer />

      {/* ── Detail modal ── */}
      {isModalOpen && selectedCrypto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsModalOpen(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
            onClick={e => e.stopPropagation()}>

            {/* Dark header */}
            <div className="bg-gray-950 p-6 sm:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                    {selectedCrypto.image && typeof selectedCrypto.image === 'string' && selectedCrypto.image.startsWith('http') ? (
                      <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-10 h-10 object-contain"
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `<span class="text-xl font-bold text-white">${selectedCrypto.symbol.substring(0, 2).toUpperCase()}</span>`;
                        }} />
                    ) : (
                      <span className="text-xl font-bold text-white">{selectedCrypto.symbol.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedCrypto.name}</h2>
                      <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-white/60">
                        #{cryptos.indexOf(selectedCrypto) + 1}
                      </span>
                    </div>
                    <p className="text-sm text-white/40 uppercase tracking-widest font-medium">{selectedCrypto.symbol}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Current Price</p>
                  <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">{formatPrice(selectedCrypto.price)}</p>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                  selectedCrypto.percentChange24h >= 0
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  {selectedCrypto.percentChange24h >= 0
                    ? <TrendingUp className="h-4 w-4 text-green-400" />
                    : <TrendingDown className="h-4 w-4 text-red-400" />}
                  <span className={`text-lg font-bold ${selectedCrypto.percentChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedCrypto.percentChange24h >= 0 ? '+' : ''}{selectedCrypto.percentChange24h?.toFixed(2)}%
                  </span>
                  <span className="text-xs text-white/40">24h</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Market Overview</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: BarChart3, label: 'Market Cap',   value: formatCurrency(selectedCrypto.marketCap) },
                    { icon: Activity,  label: 'Volume (24h)', value: formatCurrency(selectedCrypto.volume24h) },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <m.icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">{m.label}</span>
                      </div>
                      <p className="text-2xl font-black text-black">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Detailed Statistics</p>
                <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {[
                      { label: 'Market Rank',  value: `#${cryptos.indexOf(selectedCrypto) + 1}`,                                                                    color: '' },
                      { label: 'Price',        value: formatPrice(selectedCrypto.price),                                                                             color: '' },
                      { label: '24h Change',   value: `${selectedCrypto.percentChange24h >= 0 ? '+' : ''}${selectedCrypto.percentChange24h?.toFixed(2)}%`,           color: selectedCrypto.percentChange24h >= 0 ? 'text-green-600' : 'text-red-500' },
                      { label: 'Market Cap',   value: formatCurrency(selectedCrypto.marketCap),                                                                      color: '' },
                      { label: '24h Volume',   value: formatCurrency(selectedCrypto.volume24h),                                                                      color: '' },
                      { label: 'Symbol',       value: selectedCrypto.symbol.toUpperCase(),                                                                           color: '' },
                    ].map((row, i) => (
                      <motion.div key={row.label}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="flex items-center justify-between px-5 py-4">
                        <span className="text-gray-600 font-medium">{row.label}</span>
                        <span className={`font-bold text-lg ${row.color || 'text-black'}`}>{row.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
