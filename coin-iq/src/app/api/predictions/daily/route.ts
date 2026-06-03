/**
 * Daily prediction records API
 * GET  /api/predictions/daily?date=2026-06-01          — all records for a specific date
 * GET  /api/predictions/daily?dates=true               — list of all available dates
 * DELETE /api/predictions/daily                        — clear all prediction history records
 *
 * Records are grouped by interval (10min, 20min, 30min, 1h, 2h, 6h, 12h, 24h)
 * within the selected day.
 */
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const INTERVALS = [
  { label: '10 min',  minutes: 10   },
  { label: '20 min',  minutes: 20   },
  { label: '30 min',  minutes: 30   },
  { label: '1 hour',  minutes: 60   },
  { label: '2 hours', minutes: 120  },
  { label: '6 hours', minutes: 360  },
  { label: '12 hours',minutes: 720  },
  { label: '24 hours',minutes: 1440 },
];

async function getCurrentPrices(coins: string[]): Promise<Record<string, number>> {
  if (!coins.length) return {};
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price', {
      signal: AbortSignal.timeout(6000),
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
  const datesOnly = searchParams.get('dates') === 'true';
  const dateParam = searchParams.get('date'); // e.g. "2026-06-01"

  try {
    // ── Return list of available dates ────────────────────────────────────────
    if (datesOnly) {
      const rows = await db.query(`
        SELECT DISTINCT DATE(predicted_at AT TIME ZONE 'UTC') AS day
        FROM prediction_history
        ORDER BY day DESC
        LIMIT 30
      `);
      return NextResponse.json({
        dates: rows.rows.map((r: any) => r.day.toISOString().slice(0, 10)),
      });
    }

    // ── Return records for a specific date ────────────────────────────────────
    const targetDate = dateParam || new Date().toISOString().slice(0, 10);

    // All coins that have predictions on this date
    const allCoins = ['BTCUSDT','ETHUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOGEUSDT',
      'LTCUSDT','BCHUSDT','ETCUSDT','TRXUSDT','XLMUSDT','XMRUSDT','NEOUSDT','EOSUSDT',
      'DASHUSDT','ZECUSDT','IOTAUSDT','QTUMUSDT','OMGUSDT','ZRXUSDT'];

    // Fetch current prices for live comparison
    const currentPrices = await getCurrentPrices(allCoins);

    // Trigger lock-intervals in background
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/predictions/lock-intervals`)
      .catch(() => {});

    // Build interval groups for this day
    const intervalGroups = await Promise.all(
      INTERVALS.map(async ({ label, minutes }) => {

        // ── Locked snapshots for this day + interval ──────────────────────────
        const locked = await db.query(`
          SELECT DISTINCT ON (coin)
            coin,
            ensemble_direction AS predicted_dir,
            price_at_prediction AS price_then,
            ensemble_probability,
            outcome_price,
            actual_direction AS actual_dir,
            was_correct,
            locked_at,
            predicted_at,
            session_id
          FROM interval_snapshots
          WHERE interval_minutes = $1
            AND DATE(predicted_at AT TIME ZONE 'UTC') = $2::date
            AND locked_at IS NOT NULL
          ORDER BY coin, locked_at DESC
        `, [minutes, targetDate]);

        if (locked.rows.length > 0) {
          const coins = locked.rows.map((r: any) => {
            const priceThen = parseFloat(r.price_then);
            const priceNow  = r.outcome_price ? parseFloat(r.outcome_price) : null;
            const changePct = priceNow && priceThen
              ? parseFloat((((priceNow - priceThen) / priceThen) * 100).toFixed(4))
              : null;
            return {
              coin:          r.coin,
              predicted_dir: r.predicted_dir,
              actual_dir:    r.actual_dir,
              price_then:    priceThen,
              price_now:     priceNow,
              change_pct:    changePct,
              correct:       r.was_correct,
              probability:   parseFloat(r.ensemble_probability),
              predicted_at:  r.predicted_at,
              locked_at:     r.locked_at,
              locked:        true,
            };
          });

          const total    = coins.length;
          const correct  = coins.filter((c: any) => c.correct === true).length;
          const accuracy = total ? parseFloat(((correct / total) * 100).toFixed(1)) : null;

          return { label, minutes, total, correct, accuracy_pct: accuracy,
                   coins, has_data: true, locked: true };
        }

        // ── Pending snapshots for this day + interval ─────────────────────────
        const pending = await db.query(`
          SELECT DISTINCT ON (coin)
            coin,
            ensemble_direction AS predicted_dir,
            price_at_prediction AS price_then,
            ensemble_probability,
            predicted_at
          FROM interval_snapshots
          WHERE interval_minutes = $1
            AND DATE(predicted_at AT TIME ZONE 'UTC') = $2::date
            AND locked_at IS NULL
          ORDER BY coin, predicted_at DESC
        `, [minutes, targetDate]);

        if (pending.rows.length > 0) {
          // For today's pending intervals, show live comparison
          const isToday = targetDate === new Date().toISOString().slice(0, 10);
          const coins: any[] = [];

          for (const r of pending.rows) {
            const priceThen = parseFloat(r.price_then);
            const priceNow  = isToday ? (currentPrices[r.coin] ?? null) : null;
            const actualDir = priceNow ? (priceNow >= priceThen ? 'UP' : 'DOWN') : null;
            const correct   = actualDir ? actualDir === r.predicted_dir : null;
            const changePct = priceNow && priceThen
              ? parseFloat((((priceNow - priceThen) / priceThen) * 100).toFixed(4))
              : null;

            // Check if interval has elapsed
            const predTime   = new Date(r.predicted_at).getTime();
            const lockTime   = predTime + minutes * 60 * 1000;
            const hasElapsed = Date.now() >= lockTime;

            coins.push({
              coin:          r.coin,
              predicted_dir: r.predicted_dir,
              actual_dir:    actualDir,
              price_then:    priceThen,
              price_now:     priceNow,
              change_pct:    changePct,
              correct,
              probability:   parseFloat(r.ensemble_probability),
              predicted_at:  r.predicted_at,
              locked:        false,
              pending:       !hasElapsed,
            });
          }

          const resolved = coins.filter(c => c.correct !== null);
          const correct  = resolved.filter(c => c.correct === true).length;
          const accuracy = resolved.length
            ? parseFloat(((correct / resolved.length) * 100).toFixed(1))
            : null;

          return {
            label, minutes,
            total:        coins.length,
            correct,
            accuracy_pct: accuracy,
            coins,
            has_data:     true,
            locked:       false,
            pending:      true,
          };
        }

        // No data for this interval on this day
        return {
          label, minutes, total: 0, correct: 0, accuracy_pct: null,
          coins: [], has_data: false, locked: false, pending: false,
        };
      })
    );

    // Overall accuracy for the day
    const allCoinsWithData = intervalGroups.flatMap(g => g.coins);
    const resolved  = allCoinsWithData.filter((c: any) => c.correct !== null);
    const correct   = resolved.filter((c: any) => c.correct === true).length;
    const accuracy  = resolved.length
      ? parseFloat(((correct / resolved.length) * 100).toFixed(1))
      : null;

    // Summary per coin for the day
    const coinSummary: Record<string, { total: number; correct: number }> = {};
    for (const c of resolved as any[]) {
      if (!coinSummary[c.coin]) coinSummary[c.coin] = { total: 0, correct: 0 };
      coinSummary[c.coin].total++;
      if (c.correct) coinSummary[c.coin].correct++;
    }

    return NextResponse.json({
      date:      targetDate,
      intervals: intervalGroups,
      overall:   { total: resolved.length, correct, accuracy_pct: accuracy },
      coin_summary: Object.entries(coinSummary).map(([coin, s]) => ({
        coin,
        total:        s.total,
        correct:      s.correct,
        accuracy_pct: s.total ? parseFloat(((s.correct / s.total) * 100).toFixed(1)) : null,
      })).sort((a, b) => b.total - a.total),
    });

  } catch (error) {
    console.error('Daily predictions error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily records' }, { status: 500 });
  }
}

// DELETE — clear all prediction history (Market vs Model only)
export async function DELETE(_request: NextRequest) {
  try {
    await db.query('TRUNCATE TABLE interval_snapshots RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE prediction_history RESTART IDENTITY CASCADE');
    return NextResponse.json({ message: 'All prediction history cleared successfully' });
  } catch (error) {
    console.error('Clear history error:', error);
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
  }
}
