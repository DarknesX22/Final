import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function getBinancePrice(coin: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${coin}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return parseFloat(d.price);
  } catch { return null; }
}

// GET /api/predictions/lock-intervals
// Finds all unlocked snapshots whose lock time has passed, fetches current price,
// computes actual direction, marks was_correct, and locks them permanently.
export async function GET(_req: NextRequest) {
  try {
    // Find snapshots that should be locked:
    // predicted_at + interval_minutes <= NOW()  AND  locked_at IS NULL
    const pending = await db.query(
      `SELECT id, coin, interval_minutes, predicted_at, price_at_prediction, ensemble_direction
       FROM interval_snapshots
       WHERE locked_at IS NULL
         AND predicted_at + (interval_minutes * INTERVAL '1 minute') <= NOW()
       ORDER BY interval_minutes ASC, coin ASC
       LIMIT 200`
    );

    if (pending.rows.length === 0) {
      return NextResponse.json({ locked: 0, message: 'Nothing to lock' });
    }

    // Fetch prices for unique coins in one batch
    const uniqueCoins = [...new Set(pending.rows.map((r: any) => r.coin))];
    const prices: Record<string, number> = {};
    await Promise.all(uniqueCoins.map(async (coin: string) => {
      const p = await getBinancePrice(coin);
      if (p) prices[coin] = p;
    }));

    let locked = 0;
    for (const row of pending.rows) {
      const outcomePrice = prices[row.coin];
      if (!outcomePrice) continue;

      const predPrice     = parseFloat(row.price_at_prediction);
      const actualDir     = outcomePrice >= predPrice ? 'UP' : 'DOWN';
      const wasCorrect    = actualDir === row.ensemble_direction;

      await db.query(
        `UPDATE interval_snapshots
         SET outcome_price    = $1,
             actual_direction = $2,
             was_correct      = $3,
             locked_at        = NOW()
         WHERE id = $4`,
        [outcomePrice, actualDir, wasCorrect, row.id]
      );
      locked++;
    }

    return NextResponse.json({ locked, message: `Locked ${locked} snapshots` });
  } catch (error) {
    console.error('Lock intervals error:', error);
    return NextResponse.json({ error: 'Failed to lock intervals' }, { status: 500 });
  }
}
