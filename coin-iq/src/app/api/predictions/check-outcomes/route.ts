import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Fetches current Binance price for a coin
async function getBinancePrice(coin: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${coin}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return parseFloat(data.price);
  } catch { return null; }
}

// GET /api/predictions/check-outcomes
// Finds predictions made ~24h ago that have no outcome yet, fetches current price,
// compares direction, and marks was_correct.
export async function GET(request: NextRequest) {
  try {
    // Find predictions 23–25h old with no outcome yet
    const pending = await db.query(
      `SELECT id, coin, price_at_prediction, ensemble_direction
       FROM prediction_history
       WHERE outcome_checked_at IS NULL
         AND predicted_at BETWEEN NOW() - INTERVAL '25 hours'
                              AND NOW() - INTERVAL '23 hours'
       LIMIT 50`
    );

    if (pending.rows.length === 0) {
      return NextResponse.json({ message: 'No pending outcomes', updated: 0 });
    }

    let updated = 0;
    for (const row of pending.rows) {
      const currentPrice = await getBinancePrice(row.coin);
      if (!currentPrice) continue;

      const actualDirection = currentPrice >= row.price_at_prediction ? 'UP' : 'DOWN';
      const wasCorrect      = actualDirection === row.ensemble_direction;

      await db.query(
        `UPDATE prediction_history
         SET outcome_price       = $1,
             outcome_direction   = $2,
             outcome_checked_at  = NOW(),
             was_correct         = $3
         WHERE id = $4`,
        [currentPrice, actualDirection, wasCorrect, row.id]
      );
      updated++;
    }

    return NextResponse.json({ message: `Updated ${updated} outcomes`, updated });
  } catch (error) {
    console.error('Check outcomes error:', error);
    return NextResponse.json({ error: 'Failed to check outcomes' }, { status: 500 });
  }
}
