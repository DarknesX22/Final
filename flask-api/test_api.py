"""
Quick test script — run this while the Flask server is running on port 5000.
Usage: python test_api.py
"""

import requests
import json

BASE = "http://localhost:5000"

def pretty(label, resp):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"  Status: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))

# ── 1. Health check ───────────────────────────────────────────────────────────
pretty("GET /health", requests.get(f"{BASE}/health"))

# ── 2. List models ────────────────────────────────────────────────────────────
pretty("GET /models", requests.get(f"{BASE}/models"))

# ── 3. XGBoost — BTCUSDT ─────────────────────────────────────────────────────
xgb_features = {
    "open": 43000, "high": 44000, "low": 42500, "close": 43250, "volume": 15000,
    "vader_compound": 0.35, "vader_pos": 0.25, "vader_neg": 0.05, "vader_neu": 0.70,
    "sentiment_label": 1, "finbert_score": 0.6, "finbert_label": 1,
    "fng_value": 55, "fng_classification": 2, "social_score": 70, "social_votes": 120,
    "quote_asset_volume": 650000000, "num_trades": 450000,
    "taker_buy_base_volume": 8000, "taker_buy_quote_volume": 345000000,
    "EMA_9": 43100, "EMA_21": 42800, "MACD": 150, "MACD_signal": 100,
    "BB_upper": 45000, "BB_lower": 41000, "BB_pct_b": 0.55,
    "RSI_14": 58, "Stoch_K": 65, "Stoch_D": 60, "ROC_10": 2.5,
    "ATR_14": 800, "high_low_spread": 1500, "OBV": 5000000,
    "taker_buy_ratio": 0.55, "hour": 14, "day_of_week": 2,
    "close_lag_1": 43000, "close_lag_3": 42500, "close_lag_7": 41800,
    "return_1d": 0.006, "price_above_ma1": 1,
    "target_lag_1": 1, "target_lag_2": 0, "target_lag_3": 1,
    "bull_confluence": 1, "bear_confluence": 0, "sentiment_tech_agree": 1,
}

pretty("POST /predict/xgboost (BTCUSDT)", requests.post(
    f"{BASE}/predict/xgboost",
    json={"coin": "BTCUSDT", "features": xgb_features}
))

# ── 4. LightGBM ───────────────────────────────────────────────────────────────
lgbm_features = {
    "coin": 1,
    "price_change_pct": 0.006,
    "vader_compound": 0.35, "vader_pos": 0.25, "vader_neg": 0.05, "vader_neu": 0.70,
    "sentiment_label": 1, "finbert_score": 0.6, "finbert_label": 1,
    "fng_value": 55, "fng_classification": 2, "social_score": 70,
    "BB_pct_b": 0.55, "RSI_14": 58, "Stoch_K": 65, "Stoch_D": 60,
    "ROC_10": 2.5, "taker_buy_ratio": 0.55, "hour": 14, "day_of_week": 2,
    "dir_lag_1": 1, "dir_lag_2": 0, "dir_lag_3": 1,
    "dir_lag_6": 1, "dir_lag_12": 0, "dir_lag_24": 1,
    "win_rate_24h": 0.6, "win_rate_72h": 0.55,
    "cl_vs_l1": 0.006, "cl_vs_l3": 0.018, "cl_vs_l7": 0.034,
    "ema_cross_pct": 0.007, "macd_hist_pct": 0.003, "bb_width_pct": 0.09,
    "spread_pct": 0.035, "atr_pct": 0.019, "vol_ratio": 1.1,
    "stoch_diff": 5, "rsi_c": 2,
    "sent_x_momentum": 0.002, "rsi_x_winrate": 34.8,
    "ema_x_rsi": 0.4, "bb_x_stoch": 35.75,
    "fng_x_winrate": 33, "vol_x_momentum": 0.0066,
}

pretty("POST /predict/lgbm", requests.post(
    f"{BASE}/predict/lgbm",
    json={"features": lgbm_features}
))

# ── 5. Random Forest ──────────────────────────────────────────────────────────
rf_features = {
    "coin": 1,
    "price_change_pct": 0.006,
    "vader_compound": 0.35, "vader_pos": 0.25, "vader_neg": 0.05, "vader_neu": 0.70,
    "sentiment_label": 1, "finbert_score": 0.6, "finbert_label": 1,
    "fng_value": 55, "fng_classification": 2, "social_score": 70,
    "BB_pct_b": 0.55, "RSI_14": 58, "Stoch_K": 65, "Stoch_D": 60,
    "ROC_10": 2.5, "taker_buy_ratio": 0.55, "hour": 14, "day_of_week": 2,
    "dir_lag_1": 1, "dir_lag_2": 0, "dir_lag_3": 1,
    "dir_lag_6": 1, "dir_lag_12": 0, "dir_lag_24": 1,
    "win_rate_24h": 0.6, "win_rate_72h": 0.55,
}

pretty("POST /predict/rf", requests.post(
    f"{BASE}/predict/rf",
    json={"features": rf_features}
))

# ── 6. LSTM (24 timesteps) ────────────────────────────────────────────────────
base_step = {
    "price_change_pct": 0.005, "vader_compound": 0.3, "vader_pos": 0.2,
    "vader_neg": 0.05, "vader_neu": 0.75, "sentiment_label": 1,
    "finbert_score": 0.55, "finbert_label": 1, "fng_value": 52,
    "fng_classification": 2, "social_score": 65, "BB_pct_b": 0.5,
    "RSI_14": 55, "Stoch_K": 60, "Stoch_D": 58, "ROC_10": 2.0,
    "high_low_spread": 1400, "taker_buy_ratio": 0.52, "hour": 12,
    "day_of_week": 1, "close_lag_1": 43000, "close_lag_3": 42500,
    "close_lag_7": 41800, "price_return": 0.005, "volatility": 0.02,
    "volume_ratio": 1.05, "bb_position": 0.5, "rsi_norm": 0.55,
    "macd_signal": 0.003, "return_lag_1": 0.005, "direction_lag_1": 1,
    "return_lag_3": 0.012, "direction_lag_3": 1, "return_lag_6": 0.018,
    "direction_lag_6": 0, "return_lag_12": 0.022, "direction_lag_12": 1,
    "return_lag_24": 0.03, "direction_lag_24": 1, "volatility_24h": 0.025,
}
sequence = [base_step.copy() for _ in range(24)]

pretty("POST /predict/lstm (24 timesteps)", requests.post(
    f"{BASE}/predict/lstm",
    json={"sequence": sequence}
))

# ── 7. Ensemble (all models) ──────────────────────────────────────────────────
pretty("POST /predict/all (ensemble)", requests.post(
    f"{BASE}/predict/all",
    json={
        "coin": "BTCUSDT",
        "features": {**xgb_features, **lgbm_features},
        "sequence": sequence,
    }
))

print("\n" + "="*60)
print("  All tests complete.")
print("="*60)
