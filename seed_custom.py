"""
╔══════════════════════════════════════════════════════════════════════════════╗
║              Coin-IQ — Custom Accuracy Seeder                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  HOW TO USE:                                                                 ║
║  ───────────                                                                 ║
║  Edit the SEED_CONFIG list below, then run:                                  ║
║      python seed_custom.py                                                   ║
║                                                                              ║
║  Each entry in SEED_CONFIG is a dict with:                                   ║
║                                                                              ║
║  "dates"     → list of date strings "YYYY-MM-DD"                             ║
║               Use a range helper:  date_range("2026-06-11", "2026-06-15")    ║
║                                                                              ║
║  "intervals" → list of interval names (see INTERVAL_MAP below)              ║
║               Choices: "10min","20min","30min","1h","2h","6h","12h","24h"   ║
║               Use "ALL" to target every interval at once                     ║
║                                                                              ║
║  "accuracy"  → fixed accuracy % you want shown (integer, 1–100)             ║
║               e.g. 75 means 75% of the 20 coins will be correct             ║
║                                                                              ║
║  EXAMPLES:                                                                   ║
║  ──────────                                                                  ║
║  # Fix ALL intervals on a single date to 80%                                 ║
║  {"dates": ["2026-06-11"], "intervals": "ALL", "accuracy": 80}               ║
║                                                                              ║
║  # Fix only 10min and 1h on a date range to 72%                              ║
║  {"dates": date_range("2026-06-12","2026-06-15"),                            ║
║   "intervals": ["10min","1h"], "accuracy": 72}                               ║
║                                                                              ║
║  # Different accuracy per interval on the same dates                         ║
║  {"dates": ["2026-06-20"], "intervals": ["10min"], "accuracy": 85},          ║
║  {"dates": ["2026-06-20"], "intervals": ["24h"],   "accuracy": 70},          ║
║                                                                              ║
║  NOTES:                                                                      ║
║  • If a date already has data for a given interval, it is REPLACED           ║
║    (old records deleted, new ones inserted at the requested accuracy)        ║
║  • If the date has no data yet, fresh records are created                    ║
║  • All records are marked as locked/historical                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import psycopg2
import random
from datetime import datetime, date, timedelta

# ─────────────────────────────────────────────────────────────────────────────
# DB CONNECTION  — change if your credentials differ
# ─────────────────────────────────────────────────────────────────────────────
DB = dict(host="localhost", port=5432, dbname="coin_iq", user="postgres", password="123")

# ─────────────────────────────────────────────────────────────────────────────
# INTERVAL NAME → minutes mapping
# ─────────────────────────────────────────────────────────────────────────────
INTERVAL_MAP = {
    "10min": 10,
    "20min": 20,
    "30min": 30,
    "1h":    60,
    "2h":    120,
    "6h":    360,
    "12h":   720,
    "24h":   1440,
}

ALL_INTERVALS = list(INTERVAL_MAP.keys())

# ─────────────────────────────────────────────────────────────────────────────
# 20 COINS with representative base prices
# ─────────────────────────────────────────────────────────────────────────────
COINS = [
    ("BTCUSDT",  95000.0), ("ETHUSDT",  3500.0), ("BNBUSDT",   620.0),
    ("XRPUSDT",     2.4),  ("ADAUSDT",    0.75), ("DOGEUSDT",   0.18),
    ("LTCUSDT",   105.0),  ("BCHUSDT",  480.0),  ("ETCUSDT",    26.0),
    ("TRXUSDT",    0.33),  ("XLMUSDT",   0.42),  ("XMRUSDT",   310.0),
    ("NEOUSDT",   12.5),   ("EOSUSDT",   0.85),  ("DASHUSDT",   38.0),
    ("ZECUSDT",   28.0),   ("IOTAUSDT",  0.22),  ("QTUMUSDT",   3.2),
    ("OMGUSDT",    0.52),  ("ZRXUSDT",   0.48),
]

# ─────────────────────────────────────────────────────────────────────────────
# HELPER — generate a list of date strings between start and end (inclusive)
# ─────────────────────────────────────────────────────────────────────────────
def date_range(start: str, end: str):
    """Returns a list of 'YYYY-MM-DD' strings from start to end inclusive."""
    s = datetime.strptime(start, "%Y-%m-%d").date()
    e = datetime.strptime(end,   "%Y-%m-%d").date()
    out = []
    while s <= e:
        out.append(s.isoformat())
        s += timedelta(days=1)
    return out


# ═════════════════════════════════════════════════════════════════════════════
#  ✏️  EDIT THIS SECTION — define what you want to seed
# ═════════════════════════════════════════════════════════════════════════════
SEED_CONFIG = [

    # ── YOUR ENTRIES BELOW ─────────────────────────────────────────────────
    {"dates": ["2026-05-25"], "intervals": ["10min"], "accuracy": 75},
    {"dates": ["2026-05-25"], "intervals": ["20min"], "accuracy": 76},
    {"dates": ["2026-05-25"], "intervals": ["30min"], "accuracy": 72},
    {"dates": ["2026-05-25"], "intervals": ["1h"],    "accuracy": 66},
    {"dates": ["2026-05-25"], "intervals": ["2h"],    "accuracy": 71},
    {"dates": ["2026-05-25"], "intervals": ["6h"],    "accuracy": 70},
    {"dates": ["2026-05-25"], "intervals": ["12h"],   "accuracy": 78},
    {"dates": ["2026-05-25"], "intervals": ["24h"],   "accuracy": 79},

]
# ═════════════════════════════════════════════════════════════════════════════


# ─────────────────────────────────────────────────────────────────────────────
# CORE SEEDER — do not edit below this line
# ─────────────────────────────────────────────────────────────────────────────
def seed(conn, target_date: str, interval_name: str, accuracy: int):
    interval_min = INTERVAL_MAP[interval_name]
    d = datetime.strptime(target_date, "%Y-%m-%d").date()
    rng = random.Random(f"{target_date}-{interval_min}-{accuracy}")

    cur = conn.cursor()

    # Delete existing records for this date+interval so we replace them cleanly
    cur.execute(
        "DELETE FROM interval_snapshots WHERE predicted_at::date = %s AND interval_minutes = %s",
        (target_date, interval_min)
    )
    deleted = cur.rowcount

    rows = []
    # 144 sessions per day (every 10 min from 00:00 to 23:50)
    for session_idx in range(144):
        hour   = (session_idx * 10) // 60
        minute = (session_idx * 10) % 60
        pred_time  = datetime(d.year, d.month, d.day, hour, minute, 30)
        session_id = f"{target_date}T{hour:02d}:{minute:02d}"

        # Exactly `correct_cnt` coins will be correct this session
        correct_cnt  = round(len(COINS) * accuracy / 100)
        correct_idxs = set(rng.sample(range(len(COINS)), correct_cnt))

        for ci, (coin, base_price) in enumerate(COINS):
            noise      = 1 + rng.uniform(-0.03, 0.03)
            price_pred = round(base_price * noise, 8)
            pred_dir   = rng.choice(["UP", "DOWN"])
            is_correct = ci in correct_idxs

            actual_dir    = pred_dir if is_correct else ("DOWN" if pred_dir == "UP" else "UP")
            price_delta   = (1.015 if pred_dir == "UP" else 0.985) if is_correct else (0.985 if pred_dir == "UP" else 1.015)
            outcome_price = round(price_pred * price_delta, 8)
            prob          = round(rng.uniform(0.55, 0.85), 4)

            rows.append((
                session_id, coin, interval_min,
                pred_time, price_pred,
                pred_dir, prob,
                actual_dir, outcome_price,
                is_correct, pred_time   # locked_at = pred_time (historical)
            ))

    cur.executemany(
        """
        INSERT INTO interval_snapshots
          (session_id, coin, interval_minutes, predicted_at,
           price_at_prediction, ensemble_direction, ensemble_probability,
           actual_direction, outcome_price, was_correct, locked_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (session_id, interval_minutes, coin) DO NOTHING
        """,
        rows
    )
    conn.commit()
    cur.close()

    actual_correct  = sum(1 for r in rows if r[9])
    actual_total    = len(rows)
    actual_accuracy = round(100 * actual_correct / actual_total, 1) if actual_total else 0

    print(f"  [{target_date}] {interval_name:5s} ({interval_min:4d}min) | "
          f"target={accuracy}%  actual={actual_accuracy}% | "
          f"{len(rows)} rows  (replaced {deleted})")


def main():
    print("=" * 70)
    print("  Coin-IQ Custom Accuracy Seeder")
    print("=" * 70)

    conn = psycopg2.connect(**DB)

    for entry in SEED_CONFIG:
        dates     = entry["dates"]
        intervals = ALL_INTERVALS if entry["intervals"] == "ALL" else entry["intervals"]
        accuracy  = int(entry["accuracy"])

        # Validate
        for iv in intervals:
            if iv not in INTERVAL_MAP:
                print(f"  ERROR: unknown interval '{iv}'. Valid: {list(INTERVAL_MAP.keys())}")
                conn.close()
                return

        if not (1 <= accuracy <= 100):
            print(f"  ERROR: accuracy must be 1-100, got {accuracy}")
            conn.close()
            return

        print(f"\nTarget accuracy: {accuracy}%  |  "
              f"Intervals: {intervals}  |  "
              f"Dates: {dates[0]} → {dates[-1]} ({len(dates)} days)")

        for d in dates:
            for iv in intervals:
                seed(conn, d, iv, accuracy)

    conn.close()
    print("\n" + "=" * 70)
    print("  Done.")
    print("=" * 70)


if __name__ == "__main__":
    main()
