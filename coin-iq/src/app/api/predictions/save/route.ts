import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Interval definitions — how many minutes after prediction to lock each snapshot
const INTERVALS = [10, 20, 30, 60, 120, 360, 720, 1440, 2880, 4320, 10080, 43200];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      coin, price_at_prediction,
      ensemble_direction, ensemble_probability, ensemble_confidence,
      xgb_direction, xgb_probability,
      lgbm_direction, lgbm_probability,
      rf_direction, rf_probability,
      lstm_direction, lstm_probability,
      rsi, macd, bb_pct_b,
    } = body;

    if (!coin || !price_at_prediction || !ensemble_direction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Save raw prediction
    const result = await db.query(
      `INSERT INTO prediction_history
        (coin, price_at_prediction,
         ensemble_direction, ensemble_probability, ensemble_confidence,
         xgb_direction, xgb_probability,
         lgbm_direction, lgbm_probability,
         rf_direction, rf_probability,
         lstm_direction, lstm_probability,
         rsi, macd, bb_pct_b)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id, predicted_at`,
      [
        coin, price_at_prediction,
        ensemble_direction, ensemble_probability, ensemble_confidence,
        xgb_direction   ?? null, xgb_probability  ?? null,
        lgbm_direction  ?? null, lgbm_probability ?? null,
        rf_direction    ?? null, rf_probability   ?? null,
        lstm_direction  ?? null, lstm_probability ?? null,
        rsi ?? null, macd ?? null, bb_pct_b ?? null,
      ]
    );

    const predicted_at = result.rows[0].predicted_at;

    // 2. Create one pending interval_snapshot row per interval for this coin+time
    // session_id = ISO timestamp truncated to the minute (groups all 20 coins saved together)
    const sessionId = new Date(predicted_at).toISOString().slice(0, 16); // "2026-05-24T13:06"

    for (const minutes of INTERVALS) {
      await db.query(
        `INSERT INTO interval_snapshots
           (session_id, interval_minutes, coin, predicted_at, price_at_prediction,
            ensemble_direction, ensemble_probability)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (session_id, interval_minutes, coin) DO NOTHING`,
        [sessionId, minutes, coin, predicted_at, price_at_prediction,
         ensemble_direction, ensemble_probability]
      );
    }

    return NextResponse.json({ id: result.rows[0].id, predicted_at });
  } catch (error) {
    console.error('Save prediction error:', error);
    return NextResponse.json({ error: 'Failed to save prediction' }, { status: 500 });
  }
}
