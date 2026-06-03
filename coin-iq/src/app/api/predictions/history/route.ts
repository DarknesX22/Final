import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function getCurrentPrices(coins: string[]): Promise<Record<string, number>> {
  if (!coins.length) return {};
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    const all: { symbol: string; price: string }[] = await res.json();
    const map: Record<string, number> = {};
    for (const t of all) {
      if (coins.includes(t.symbol)) map[t.symbol] = parseFloat(t.price);
    }
    return map;
  } catch { return {}; }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const coin  = searchParams.get('coin')?.toUpperCase();
  const hours = parseInt(searchParams.get('hours') || '24');

  try {
    const params: any[] = [hours];
    const coinFilter = coin ? 'AND coin = $2' : '';
    if (coin) params.push(coin);

    // Latest prediction per coin in the window
    const rows = await db.query(
      `SELECT DISTINCT ON (coin)
         id, coin, predicted_at, price_at_prediction,
         ensemble_direction, ensemble_probability, ensemble_confidence,
         xgb_direction, xgb_probability,
         lgbm_direction, lgbm_probability,
         rf_direction, rf_probability,
         lstm_direction, lstm_probability,
         rsi, macd, bb_pct_b,
         outcome_price, outcome_direction, outcome_checked_at, was_correct
       FROM prediction_history
       WHERE predicted_at >= NOW() - ($1 || ' hours')::INTERVAL
       ${coinFilter}
       ORDER BY coin, predicted_at DESC`,
      params
    );

    const uniqueCoins   = [...new Set(rows.rows.map((r: any) => r.coin))];
    const currentPrices = await getCurrentPrices(uniqueCoins);

    const enriched = rows.rows.map((r: any) => {
      const currentPrice = currentPrices[r.coin] ?? null;
      const predPrice    = parseFloat(r.price_at_prediction);
      let actualDirection: 'UP' | 'DOWN' | null = null;
      let priceDiffPct: number | null = null;
      let isCorrect: boolean | null = null;
      if (currentPrice !== null) {
        actualDirection = currentPrice >= predPrice ? 'UP' : 'DOWN';
        priceDiffPct    = ((currentPrice - predPrice) / predPrice) * 100;
        isCorrect       = actualDirection === r.ensemble_direction;
      }
      return {
        ...r, current_price: currentPrice, actual_direction: actualDirection,
        price_diff_pct: priceDiffPct !== null ? parseFloat(priceDiffPct.toFixed(4)) : null,
        is_correct_now: isCorrect,
      };
    });

    const total    = enriched.length;
    const correct  = enriched.filter((r: any) => r.is_correct_now === true).length;
    const accuracy = total ? parseFloat(((correct / total) * 100).toFixed(1)) : null;

    const statsRows = await db.query(
      `SELECT coin,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE was_correct = TRUE) AS correct,
         COUNT(*) FILTER (WHERE was_correct IS NOT NULL) AS resolved,
         ROUND(100.0 * COUNT(*) FILTER (WHERE was_correct = TRUE)
           / NULLIF(COUNT(*) FILTER (WHERE was_correct IS NOT NULL), 0), 1) AS accuracy_pct
       FROM prediction_history
       WHERE predicted_at >= NOW() - INTERVAL '7 days'
       ${coin ? 'AND coin = $1' : ''}
       GROUP BY coin ORDER BY coin`,
      coin ? [coin] : []
    );

    return NextResponse.json({
      predictions:    enriched,
      accuracy:       statsRows.rows,
      overall:        { total, correct, accuracy_pct: accuracy },
      current_prices: currentPrices,
    });
  } catch (error) {
    console.error('Prediction history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
