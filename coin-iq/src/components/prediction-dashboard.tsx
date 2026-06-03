'use client';

import { motion, AnimatePresence } from '@/components/providers';
import { useState, useEffect } from 'react';
import { usePrediction, useSupportedCoins, PredictionResult } from '@/hooks/usePrediction';
import { useCryptoHistory } from '@/hooks/useCryptoData';
import LineChart from '@/components/charts/line-chart';
import RiskAssessment from '@/components/charts/risk-assessment';
import CandlestickChart from '@/components/charts/candlestick-chart';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Activity, BarChart2, Zap, Brain, Newspaper } from 'lucide-react';

// ── Coin metadata ─────────────────────────────────────────────────────────────
const COIN_META: Record<string, { name: string; image: string }> = {
  BTCUSDT:  { name: 'Bitcoin',          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  ETHUSDT:  { name: 'Ethereum',         image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  BNBUSDT:  { name: 'BNB',              image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  XRPUSDT:  { name: 'XRP',              image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  ADAUSDT:  { name: 'Cardano',          image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
  DOGEUSDT: { name: 'Dogecoin',         image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
  LTCUSDT:  { name: 'Litecoin',         image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png' },
  BCHUSDT:  { name: 'Bitcoin Cash',     image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png' },
  ETCUSDT:  { name: 'Ethereum Classic', image: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png' },
  TRXUSDT:  { name: 'TRON',             image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png' },
  XLMUSDT:  { name: 'Stellar',          image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png' },
  XMRUSDT:  { name: 'Monero',           image: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png' },
  NEOUSDT:  { name: 'NEO',              image: 'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png' },
  EOSUSDT:  { name: 'EOS',              image: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png' },
  DASHUSDT: { name: 'Dash',             image: 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png' },
  ZECUSDT:  { name: 'Zcash',            image: 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png' },
  IOTAUSDT: { name: 'IOTA',             image: 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png' },
  QTUMUSDT: { name: 'Qtum',             image: 'https://assets.coingecko.com/coins/images/684/large/qtum.png' },
  OMGUSDT:  { name: 'OMG Network',      image: 'https://assets.coingecko.com/coins/images/776/large/OMG_Network.jpg' },
  ZRXUSDT:  { name: '0x Protocol',      image: 'https://assets.coingecko.com/coins/images/863/large/0x.png' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(p: number) {
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (p >= 1)    return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}

function getRiskLevel(prob: number): 'low' | 'medium' | 'high' {
  const dist = Math.abs(prob - 0.5);
  if (dist > 0.25) return 'low';
  if (dist > 0.12) return 'medium';
  return 'high';
}

function confidenceNum(confidence: string): number {
  return parseFloat(confidence.replace('%', ''));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ''}`} />;
}

// ── Coin selector card ────────────────────────────────────────────────────────
function CoinCard({ symbol, selected, onClick }: { symbol: string; selected: boolean; onClick: () => void }) {
  const meta = COIN_META[symbol] ?? { name: symbol.replace('USDT', ''), image: '' };
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-2xl border-2 transition-all duration-200 ${
        selected
          ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20'
          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {meta.image ? (
          <img src={meta.image} alt={meta.name} className="w-8 h-8 rounded-full object-cover shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">{symbol.slice(0, 2)}</div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm truncate leading-tight">{meta.name}</p>
          <p className={`text-xs truncate ${selected ? 'text-gray-400' : 'text-gray-500'}`}>{symbol.replace('USDT', '')}/USDT</p>
        </div>
      </div>
    </motion.button>
  );
}

// ── Model card ────────────────────────────────────────────────────────────────
function ModelCard({ label, direction, probability, accuracy }: {
  label: string; direction: 'UP' | 'DOWN'; probability: number; accuracy?: number;
}) {
  const isUp = direction === 'UP';
  const pct  = probability * 100;
  return (
    <div className={`rounded-2xl border-2 p-5 transition-all ${
      isUp ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
    }`}>
      {/* Model name */}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{label}</p>

      {/* Direction */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
          {isUp
            ? <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
            : <TrendingDown className="w-5 h-5" strokeWidth={2.5} />}
          <span className="text-xl font-black tracking-tight">{direction}</span>
        </div>
        <span className={`text-lg font-black ${isUp ? 'text-green-600' : 'text-red-500'}`}>
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Probability bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <motion.div
          className={`h-2 rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>

      {accuracy !== undefined && (
        <p className="text-xs text-gray-400 font-medium">Accuracy: {(accuracy * 100).toFixed(1)}%</p>
      )}
    </div>
  );
}

// ── Technical indicator card ──────────────────────────────────────────────────
function IndicatorCard({ label, value, sub, icon: Icon }: {
  label: string; value: string | number; sub?: string; icon: any;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
        <Icon className="w-4.5 h-4.5 text-gray-600" size={18} />
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900 leading-tight">
        {typeof value === 'number' ? value.toFixed(2) : value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function PredictionDashboard() {
  const { coins, loading: coinsLoading } = useSupportedCoins();
  const [selectedCoin, setSelectedCoin] = useState<string>('BTCUSDT');

  useEffect(() => {
    if (coins.length > 0 && !coins.includes(selectedCoin)) setSelectedCoin(coins[0]);
  }, [coins]);

  const { prediction, loading: predLoading, error: predError, refetch } = usePrediction(selectedCoin);

  const SYMBOL_TO_ID: Record<string, string> = {
    BTCUSDT: 'bitcoin', ETHUSDT: 'ethereum', BNBUSDT: 'binancecoin',
    XRPUSDT: 'ripple', ADAUSDT: 'cardano', DOGEUSDT: 'dogecoin',
    LTCUSDT: 'litecoin', BCHUSDT: 'bitcoin-cash', ETCUSDT: 'ethereum-classic',
    TRXUSDT: 'tron', XLMUSDT: 'stellar', XMRUSDT: 'monero',
    NEOUSDT: 'neo', EOSUSDT: 'eos', DASHUSDT: 'dash',
    ZECUSDT: 'zcash', IOTAUSDT: 'iota', QTUMUSDT: 'qtum',
    OMGUSDT: 'omisego', ZRXUSDT: '0x',
  };
  const { history } = useCryptoHistory(SYMBOL_TO_ID[selectedCoin] ?? '', 30);

  const candleData = history?.prices
    ? history.prices.map(([time, price]: [number, number], i: number, arr: [number, number][]) => {
        const prev = arr[i - 1]?.[1] ?? price;
        const v = price * 0.008;
        return { time, open: prev, high: Math.max(prev, price) + v, low: Math.min(prev, price) - v, close: price };
      })
    : [];

  const buildPredictionChart = (pred: PredictionResult) => {
    const base  = pred.market.close_price;
    const prob  = pred.ensemble.probability;
    const trend = (prob - 0.5) * 0.04;
    const now   = Date.now();
    const past  = history?.prices?.slice(-7).map(([t, p]: [number, number]) => ({ x: t, y: p })) ?? [];
    const future = Array.from({ length: 7 }, (_, i) => ({ x: now + (i + 1) * 86400000, y: base * (1 + trend * (i + 1)) }));
    return [...past, { x: now, y: base }, ...future];
  };

  const meta      = COIN_META[selectedCoin] ?? { name: selectedCoin.replace('USDT', ''), image: '' };
  const isLoading = predLoading;
  const ensemble  = prediction?.ensemble;
  const market    = prediction?.market;
  const riskLevel = ensemble ? getRiskLevel(ensemble.probability) : 'medium';
  const confNum   = ensemble ? confidenceNum(ensemble.confidence) : 0;
  const isUp      = ensemble?.direction === 'UP';

  return (
    <div className="w-full space-y-8">

      {/* ── Coin selector ── */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-4">Select Cryptocurrency</h2>
        {coinsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {coins.map(coin => (
              <CoinCard key={coin} symbol={coin} selected={coin === selectedCoin} onClick={() => setSelectedCoin(coin)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Prediction panel ── */}
      <AnimatePresence mode="wait">
        <motion.div key={selectedCoin}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
          className="space-y-6">

          {/* Error */}
          {predError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 font-semibold mb-1">Could not fetch prediction</p>
                <p className="text-red-500 text-sm mb-3">Make sure the Flask API is running on port 5000.</p>
                <button onClick={refetch} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            </div>
          )}

          {/* ── Top 3 cards: Price · Ensemble · Risk ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Price card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                {meta.image && (
                  <img src={meta.image} alt={meta.name} className="w-11 h-11 rounded-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight">{meta.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{selectedCoin.replace('USDT', '')}/USDT</p>
                </div>
              </div>
              {isLoading ? (
                <div className="space-y-2"><Skeleton className="h-10 w-36" /><Skeleton className="h-3 w-48" /></div>
              ) : market ? (
                <>
                  <p className="text-4xl font-black text-gray-900 tracking-tight">{formatPrice(market.close_price)}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-xs text-gray-400 font-medium">
                      Live · Binance · {prediction?.fetched_at ? new Date(prediction.fetched_at).toLocaleTimeString() : ''}
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            {/* Ensemble prediction card */}
            <div className={`rounded-2xl p-6 shadow-sm border-2 transition-all ${
              isLoading ? 'bg-white border-gray-200' :
              ensemble ? (isUp ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Ensemble Prediction</h3>
              </div>
              {isLoading ? (
                <div className="space-y-2"><Skeleton className="h-12 w-32" /><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-32" /></div>
              ) : ensemble ? (
                <>
                  <div className={`flex items-center gap-3 mb-3 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                    {isUp
                      ? <TrendingUp className="w-8 h-8" strokeWidth={2.5} />
                      : <TrendingDown className="w-8 h-8" strokeWidth={2.5} />}
                    <span className="text-5xl font-black tracking-tight">{ensemble.direction}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Probability</span>
                      <span className="font-black text-gray-900">{(ensemble.probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Confidence</span>
                      <span className="font-black text-gray-900">{ensemble.confidence}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Models voted</span>
                      <span className="font-black text-gray-900">{ensemble.models_used} / 4</span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Risk assessment */}
            {isLoading ? (
              <Skeleton className="h-52" />
            ) : ensemble ? (
              <RiskAssessment riskLevel={riskLevel} confidence={Math.round(confNum)} title="Risk Assessment" />
            ) : <div className="bg-white border border-gray-200 rounded-2xl h-52" />}
          </div>

          {/* ── Expected Price card ── */}
          {(isLoading || (market && ensemble)) && (
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-4">Expected Price (Next 24h)</h3>
              {isLoading ? (
                <Skeleton className="h-28" />
              ) : market && ensemble ? (() => {
                // Estimate expected price: current × (1 + direction_factor × confidence)
                const conf       = confidenceNum(ensemble.confidence) / 100;
                const factor     = ensemble.direction === 'UP' ? 1 : -1;
                // Scale: max ±3% move based on confidence
                const changePct  = factor * conf * 0.03;
                const expected   = market.close_price * (1 + changePct);
                const diff       = expected - market.close_price;
                const diffPct    = (diff / market.close_price) * 100;
                const isUp       = ensemble.direction === 'UP';
                return (
                  <div className={`rounded-2xl border-2 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 ${
                    isUp ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    {/* Left: prices */}
                    <div className="flex items-center gap-8 flex-1">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Price</p>
                        <p className="text-3xl font-black text-gray-900">{formatPrice(market.close_price)}</p>
                      </div>
                      <div className={`text-3xl font-black ${isUp ? 'text-green-500' : 'text-red-400'}`}>→</div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expected Price</p>
                        <p className={`text-3xl font-black ${isUp ? 'text-green-700' : 'text-red-700'}`}>{formatPrice(expected)}</p>
                      </div>
                    </div>
                    {/* Right: change badge */}
                    <div className={`shrink-0 rounded-2xl px-6 py-4 text-center ${
                      isUp ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'
                    }`}>
                      <p className={`text-2xl font-black ${isUp ? 'text-green-700' : 'text-red-700'}`}>
                        {isUp ? '+' : ''}{diffPct.toFixed(2)}%
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                        {isUp ? '+' : ''}{formatPrice(Math.abs(diff))} expected
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Based on {ensemble.confidence} confidence</p>
                    </div>
                  </div>
                );
              })() : null}
            </div>
          )}

          {/* ── Technical indicators ── */}
          {(isLoading || market) && (
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-4">Technical Indicators (Live)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
                ) : market ? (
                  <>
                    <IndicatorCard label="RSI (14)" value={market.rsi} icon={Activity}
                      sub={market.rsi > 70 ? '🔴 Overbought' : market.rsi < 30 ? '🟢 Oversold' : '⚪ Neutral'} />
                    <IndicatorCard label="MACD" value={market.macd} icon={BarChart2}
                      sub={market.macd > 0 ? 'Bullish momentum' : 'Bearish momentum'} />
                    <IndicatorCard label="BB %B" value={market.bb_pct_b} icon={Zap}
                      sub={market.bb_pct_b > 1 ? 'Above upper band' : market.bb_pct_b < 0 ? 'Below lower band' : 'Within bands'} />
                    <IndicatorCard label="RSI Signal" value={market.rsi > 70 ? 'Overbought' : market.rsi < 30 ? 'Oversold' : 'Neutral'} icon={Activity}
                      sub={`RSI: ${market.rsi.toFixed(1)}`} />
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* ── News Sentiment card ── */}
          {(isLoading || prediction?.sentiment) && (
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-4">News Sentiment</h3>
              {isLoading ? (
                <Skeleton className="h-28" />
              ) : prediction?.sentiment ? (() => {
                const s = prediction.sentiment;
                const compound = s.vader_compound;
                const label = s.sentiment_label === 1 ? 'Bullish' : s.sentiment_label === -1 ? 'Bearish' : 'Neutral';
                const labelColor = s.sentiment_label === 1 ? 'text-green-700' : s.sentiment_label === -1 ? 'text-red-600' : 'text-yellow-700';
                const bgColor    = s.sentiment_label === 1 ? 'bg-green-50 border-green-200' : s.sentiment_label === -1 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
                const barColor   = s.sentiment_label === 1 ? 'bg-green-500' : s.sentiment_label === -1 ? 'bg-red-500' : 'bg-yellow-400';
                const sourceLabel = s.source === 'coin_specific' ? `${s.article_count} coin-specific articles` : s.source === 'general_crypto' ? `${s.article_count} general crypto articles` : 'No articles — neutral fallback';
                return (
                  <div className={`rounded-2xl border-2 p-6 ${bgColor}`}>
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                      {/* Left: label + score */}
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <Newspaper className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Market Sentiment</p>
                          <p className={`text-3xl font-black tracking-tight ${labelColor}`}>{label}</p>
                          <p className="text-xs text-gray-400 mt-1">{sourceLabel}</p>
                        </div>
                      </div>

                      {/* Right: VADER breakdown bars */}
                      <div className="flex-1 min-w-[200px] space-y-2">
                        {[
                          { label: 'Positive', value: s.vader_pos, color: '#16a34a' },
                          { label: 'Negative', value: s.vader_neg, color: '#dc2626' },
                          { label: 'Neutral',  value: s.vader_neu, color: '#9ca3af' },
                        ].map(({ label: bl, value, color }) => (
                          <div key={bl}>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-xs font-medium text-gray-500">{bl}</span>
                              <span className="text-xs font-semibold text-gray-700">{(value * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-white/60 rounded-full h-1.5">
                              <motion.div className="h-1.5 rounded-full" style={{ background: color }}
                                initial={{ width: 0 }} animate={{ width: `${value * 100}%` }}
                                transition={{ duration: 0.9, ease: 'easeOut' }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Compound score badge */}
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Compound</p>
                        <p className={`text-2xl font-black ${labelColor}`}>{compound >= 0 ? '+' : ''}{compound.toFixed(3)}</p>
                        <p className="text-xs text-gray-400 mt-1">VADER score</p>
                      </div>
                    </div>
                  </div>
                );
              })() : null}
            </div>
          )}

          {/* ── Model breakdown ── */}
          {(isLoading || prediction?.models) && (
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-4">Model Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)
                ) : prediction?.models ? (
                  <>
                    {prediction.models.xgboost && (
                      <ModelCard label="XGBoost" direction={prediction.models.xgboost.direction}
                        probability={prediction.models.xgboost.probability} accuracy={prediction.models.xgboost.accuracy} />
                    )}
                    {prediction.models.lightgbm && (
                      <ModelCard label="LightGBM" direction={prediction.models.lightgbm.direction}
                        probability={prediction.models.lightgbm.probability} />
                    )}
                    {prediction.models.random_forest && (
                      <ModelCard label="Random Forest" direction={prediction.models.random_forest.direction}
                        probability={prediction.models.random_forest.probability} />
                    )}
                    {prediction.models.lstm && (
                      <ModelCard label="LSTM" direction={prediction.models.lstm.direction}
                        probability={prediction.models.lstm.probability} />
                    )}

                    {/* ── Final Decision card ── */}
                    {ensemble && (() => {
                      const prob     = ensemble.probability;
                      const conf     = confidenceNum(ensemble.confidence);
                      const isUp     = ensemble.direction === 'UP';
                      const risk     = getRiskLevel(prob);

                      // Decision logic
                      let decision: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL';
                      let decisionColor: string;
                      let decisionBg: string;
                      let decisionBorder: string;
                      let reason: string;

                      if (isUp && conf >= 40) {
                        decision = 'STRONG BUY'; decisionColor = 'text-green-700';
                        decisionBg = 'bg-green-50'; decisionBorder = 'border-green-300';
                        reason = `High confidence UP signal (${ensemble.confidence})`;
                      } else if (isUp && conf >= 20) {
                        decision = 'BUY'; decisionColor = 'text-green-600';
                        decisionBg = 'bg-green-50'; decisionBorder = 'border-green-200';
                        reason = `Moderate UP signal (${ensemble.confidence})`;
                      } else if (!isUp && conf >= 40) {
                        decision = 'STRONG SELL'; decisionColor = 'text-red-700';
                        decisionBg = 'bg-red-50'; decisionBorder = 'border-red-300';
                        reason = `High confidence DOWN signal (${ensemble.confidence})`;
                      } else if (!isUp && conf >= 20) {
                        decision = 'SELL'; decisionColor = 'text-red-600';
                        decisionBg = 'bg-red-50'; decisionBorder = 'border-red-200';
                        reason = `Moderate DOWN signal (${ensemble.confidence})`;
                      } else {
                        decision = 'HOLD'; decisionColor = 'text-yellow-700';
                        decisionBg = 'bg-yellow-50'; decisionBorder = 'border-yellow-200';
                        reason = `Low confidence — wait for clearer signal`;
                      }

                      const riskLabel = risk === 'low' ? '🟢 Low Risk' : risk === 'medium' ? '🟡 Medium Risk' : '🔴 High Risk';

                      return (
                        <div className={`rounded-2xl border-2 p-5 flex flex-col justify-between ${decisionBg} ${decisionBorder}`}>
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Final Decision</p>
                            <p className={`text-2xl font-black tracking-tight leading-none mb-2 ${decisionColor}`}>
                              {decision}
                            </p>
                            <p className="text-xs text-gray-500 leading-relaxed mb-3">{reason}</p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 font-medium">Ensemble</span>
                              <span className={`font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                                {(prob * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 font-medium">Risk</span>
                              <span className="font-semibold text-gray-700">{riskLabel}</span>
                            </div>
                            <p className="text-xs text-gray-400 pt-1 border-t border-gray-200 mt-1">
                              ⚠ Not financial advice
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-black text-gray-900 mb-1">{meta.name} — 30-Day History</h3>
              <p className="text-xs text-gray-400 mb-4">Candlestick chart from Binance</p>
              {candleData.length > 0 ? <CandlestickChart data={candleData} title="" /> : <Skeleton className="h-64" />}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-black text-gray-900 mb-1">{meta.name} — 7-Day Forecast</h3>
              <p className="text-xs text-gray-400 mb-4">AI-projected price trajectory</p>
              {prediction && history
                ? <LineChart data={buildPredictionChart(prediction)} title="" predictionLine color={isUp ? '#16a34a' : '#dc2626'} />
                : <Skeleton className="h-64" />}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center pb-2">
            Predictions are generated by ML models trained on historical price + technical data.
            Sentiment is sourced from live crypto news (CoinDesk, CoinTelegraph, Decrypt) via VADER analysis. Not financial advice.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
