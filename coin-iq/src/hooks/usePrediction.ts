import { useState, useEffect, useCallback } from 'react';

export interface ModelResult {
  model: string;
  direction: 'UP' | 'DOWN';
  probability: number;
  accuracy?: number;
  threshold?: number;
  coin?: string;
}

export interface SentimentResult {
  vader_compound: number;
  vader_pos: number;
  vader_neg: number;
  vader_neu: number;
  sentiment_label: number;   // 1=bullish, 0=neutral, -1=bearish
  article_count: number;
  source: string;            // 'coin_specific' | 'general_crypto' | 'neutral_fallback'
  fetched_at: string | null;
}

export interface PredictionResult {
  coin: string;
  fetched_at: string;
  market: {
    close_price: number;
    rsi: number;
    macd: number;
    bb_pct_b: number;
  };
  sentiment?: SentimentResult;
  models: {
    xgboost?: ModelResult;
    lightgbm?: ModelResult;
    random_forest?: ModelResult;
    lstm?: ModelResult;
  };
  ensemble: {
    direction: 'UP' | 'DOWN';
    probability: number;
    confidence: string;
    models_used: number;
  };
  note: string;
}

export interface CoinSummary {
  coin: string;
  close_price: number;
  direction: 'UP' | 'DOWN';
  probability: number;
  confidence: string;
  rsi: number;
}

// Fetch live prediction for a single coin from Flask API
export const usePrediction = (coin: string) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_prediction = useCallback(async () => {
    if (!coin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/flask-api/live/predict/${coin}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Prediction failed');
      }
      const data: PredictionResult = await res.json();
      setPrediction(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [coin]);

  useEffect(() => {
    fetch_prediction();
  }, [fetch_prediction]);

  return { prediction, loading, error, refetch: fetch_prediction };
};

// Fetch supported coins list from Flask API
export const useSupportedCoins = () => {
  const [coins, setCoins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/flask-api/live/coins')
      .then(r => r.json())
      .then(d => { setCoins(d.supported_coins || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return { coins, loading, error };
};
