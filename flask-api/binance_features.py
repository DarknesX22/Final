"""
Fetches live kline data from Binance and computes all features
required by the 4 ML models.

Sentiment features are now sourced from live RSS news feeds via
news_sentiment.py (VADER analysis). FnG and social remain neutral
as no free real-time source is integrated.
"""

import math
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from news_sentiment import get_sentiment

BINANCE_BASE = "https://api.binance.com/api/v3"

# Coin label encoding — matches training (alphabetical index)
COIN_LABEL: dict[str, int] = {
    "ADAUSDT":  0, "BCHUSDT":  1, "BNBUSDT":  2, "BTCUSDT":  3,
    "DASHUSDT": 4, "DOGEUSDT": 5, "EOSUSDT":  6, "ETCUSDT":  7,
    "ETHUSDT":  8, "IOTAUSDT": 9, "LTCUSDT": 10, "NEOUSDT": 11,
    "OMGUSDT": 12, "QTUMUSDT":13, "TRXUSDT": 14, "XLMUSDT": 15,
    "XMRUSDT": 16, "XRPUSDT": 17, "ZECUSDT": 18, "ZRXUSDT": 19,
}


# ── Binance fetch ─────────────────────────────────────────────────────────────

def fetch_klines(symbol: str, interval: str = "1h", limit: int = 200) -> pd.DataFrame:
    """Fetch OHLCV klines from Binance and return as DataFrame."""
    url = f"{BINANCE_BASE}/klines"
    params = {"symbol": symbol.upper(), "interval": interval, "limit": limit}
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    raw = resp.json()

    df = pd.DataFrame(raw, columns=[
        "open_time", "open", "high", "low", "close", "volume",
        "close_time", "quote_asset_volume", "num_trades",
        "taker_buy_base_volume", "taker_buy_quote_volume", "ignore"
    ])

    numeric = ["open", "high", "low", "close", "volume",
               "quote_asset_volume", "num_trades",
               "taker_buy_base_volume", "taker_buy_quote_volume"]
    df[numeric] = df[numeric].astype(float)
    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms", utc=True)
    df = df.sort_values("open_time").reset_index(drop=True)
    return df


# ── Technical indicators ──────────────────────────────────────────────────────

def _ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def _rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def _stoch(high: pd.Series, low: pd.Series, close: pd.Series,
           k_period: int = 14, d_period: int = 3):
    lowest  = low.rolling(k_period).min()
    highest = high.rolling(k_period).max()
    k = 100 * (close - lowest) / (highest - lowest).replace(0, np.nan)
    d = k.rolling(d_period).mean()
    return k, d


def _atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low  - prev_close).abs()
    ], axis=1).max(axis=1)
    return tr.rolling(period).mean()


def _obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    direction = np.sign(close.diff()).fillna(0)
    return (direction * volume).cumsum()


def _bollinger(close: pd.Series, period: int = 20, std_mult: float = 2.0):
    ma    = close.rolling(period).mean()
    std   = close.rolling(period).std()
    upper = ma + std_mult * std
    lower = ma - std_mult * std
    pct_b = (close - lower) / (upper - lower).replace(0, np.nan)
    return upper, lower, pct_b


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    c = df["close"]
    h = df["high"]
    l = df["low"]
    v = df["volume"]

    # EMAs
    df["EMA_9"]  = _ema(c, 9)
    df["EMA_21"] = _ema(c, 21)

    # MACD
    ema12 = _ema(c, 12)
    ema26 = _ema(c, 26)
    df["MACD"]        = ema12 - ema26
    df["MACD_signal"] = _ema(df["MACD"], 9)
    df["macd_hist"]   = df["MACD"] - df["MACD_signal"]

    # Bollinger Bands
    df["BB_upper"], df["BB_lower"], df["BB_pct_b"] = _bollinger(c)
    df["bb_width"]    = (df["BB_upper"] - df["BB_lower"]) / c
    df["bb_position"] = df["BB_pct_b"]   # alias for LSTM

    # RSI
    df["RSI_14"] = _rsi(c, 14)
    df["rsi_norm"] = df["RSI_14"] / 100.0

    # Stochastic
    df["Stoch_K"], df["Stoch_D"] = _stoch(h, l, c)

    # ROC
    df["ROC_10"] = c.pct_change(10) * 100

    # ATR
    df["ATR_14"] = _atr(h, l, c, 14)

    # OBV
    df["OBV"] = _obv(c, v)

    # Taker buy ratio
    df["taker_buy_ratio"] = (
        df["taker_buy_base_volume"] / df["volume"].replace(0, np.nan)
    ).fillna(0.5)

    # High-low spread
    df["high_low_spread"] = h - l

    # Time features
    df["hour"]       = df["open_time"].dt.hour
    df["day_of_week"]= df["open_time"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["is_monday"]  = (df["day_of_week"] == 0).astype(int)
    df["is_friday"]  = (df["day_of_week"] == 4).astype(int)
    df["month"]      = df["open_time"].dt.month
    df["quarter"]    = df["open_time"].dt.quarter

    # Lag closes
    df["close_lag_1"] = c.shift(1)
    df["close_lag_3"] = c.shift(3)
    df["close_lag_7"] = c.shift(7)

    # Returns
    df["price_return"]   = c.pct_change(1)
    df["price_change_pct"] = df["price_return"]
    df["return_1d"]  = c.pct_change(1)
    df["return_2d"]  = c.pct_change(2)
    df["return_3d"]  = c.pct_change(3)
    df["return_5d"]  = c.pct_change(5)
    df["return_7d"]  = c.pct_change(7)
    df["return_14d"] = c.pct_change(14)
    df["return_21d"] = c.pct_change(21)
    df["return_30d"] = c.pct_change(30)

    # Return lags (for LSTM)
    df["return_lag_1"]  = df["return_1d"].shift(1)
    df["return_lag_3"]  = df["return_3d"].shift(1)
    df["return_lag_6"]  = c.pct_change(6).shift(1)
    df["return_lag_12"] = c.pct_change(12).shift(1)
    df["return_lag_24"] = c.pct_change(24).shift(1)

    # Direction lags
    df["direction"]       = (df["return_1d"] > 0).astype(int)
    df["dir_lag_1"]       = df["direction"].shift(1)
    df["dir_lag_2"]       = df["direction"].shift(2)
    df["dir_lag_3"]       = df["direction"].shift(3)
    df["dir_lag_6"]       = df["direction"].shift(6)
    df["dir_lag_12"]      = df["direction"].shift(12)
    df["dir_lag_24"]      = df["direction"].shift(24)
    df["direction_lag_1"] = df["dir_lag_1"]
    df["direction_lag_3"] = df["dir_lag_3"]
    df["direction_lag_6"] = df["dir_lag_6"]
    df["direction_lag_12"]= df["dir_lag_12"]
    df["direction_lag_24"]= df["dir_lag_24"]

    # Win rates
    df["win_rate_24h"] = df["direction"].rolling(24).mean()
    df["win_rate_72h"] = df["direction"].rolling(72).mean()

    # Price vs MA flags
    for d in [1, 2, 3, 5, 7, 14, 21, 30]:
        ma = c.rolling(d).mean()
        df[f"price_above_ma{d}"] = (c > ma).astype(int)

    # Volatility windows
    for d in [5, 7, 14, 21, 24, 30]:
        col = f"volatility_{d}d" if d != 24 else "volatility_24h"
        df[col] = c.pct_change().rolling(d).std()

    df["volatility"] = df["volatility_24h"]

    # Vol ratio windows
    vol_ma20 = v.rolling(20).mean()
    df["volume_ratio"] = (v / vol_ma20.replace(0, np.nan)).fillna(1)
    for d in [5, 7, 14, 21, 30]:
        ma = v.rolling(d).mean()
        df[f"vol_ratio_{d}d"] = (v / ma.replace(0, np.nan)).fillna(1)

    # Close z-score windows
    for d in [5, 7, 14, 21, 30]:
        mu  = c.rolling(d).mean()
        std = c.rolling(d).std()
        df[f"close_zscore_{d}d"] = ((c - mu) / std.replace(0, np.nan)).fillna(0)

    # cl_vs_l features (close vs lagged close pct)
    df["cl_vs_l1"] = (c - c.shift(1))  / c.shift(1).replace(0, np.nan)
    df["cl_vs_l3"] = (c - c.shift(3))  / c.shift(3).replace(0, np.nan)
    df["cl_vs_l7"] = (c - c.shift(7))  / c.shift(7).replace(0, np.nan)

    # EMA cross
    df["ema_cross"]     = (df["EMA_9"] > df["EMA_21"]).astype(int)
    df["ema_cross_pct"] = (df["EMA_9"] - df["EMA_21"]) / df["EMA_21"].replace(0, np.nan)
    df["ema_gap"]       = df["EMA_9"] - df["EMA_21"]
    df["price_vs_ema9"] = (c - df["EMA_9"]) / df["EMA_9"].replace(0, np.nan)
    df["price_vs_ema21"]= (c - df["EMA_21"]) / df["EMA_21"].replace(0, np.nan)

    # MACD cross & derived
    df["macd_cross"]      = (df["MACD"] > df["MACD_signal"]).astype(int)
    df["macd_hist_change"]= df["macd_hist"].diff()
    df["macd_hist_pct"]   = (df["macd_hist"] / c.replace(0, np.nan)).fillna(0)

    # BB derived
    df["bb_width_pct"]    = df["bb_width"]
    df["bb_squeeze"]      = (df["bb_width"] < df["bb_width"].rolling(20).mean() * 0.8).astype(int)
    df["bb_breakout_up"]  = (c > df["BB_upper"]).astype(int)
    df["bb_breakout_down"]= (c < df["BB_lower"]).astype(int)

    # RSI signals
    df["rsi_overbought"] = (df["RSI_14"] > 70).astype(int)
    df["rsi_oversold"]   = (df["RSI_14"] < 30).astype(int)
    df["rsi_bullish"]    = (df["RSI_14"] > 50).astype(int)
    df["rsi_change_3d"]  = df["RSI_14"].diff(3)
    df["rsi_change_7d"]  = df["RSI_14"].diff(7)
    df["rsi_c"]          = df["RSI_14"].diff(1)

    # Stoch derived
    df["stoch_diff"]      = df["Stoch_K"] - df["Stoch_D"]
    df["stoch_cross"]     = (df["Stoch_K"] > df["Stoch_D"]).astype(int)
    df["stoch_overbought"]= (df["Stoch_K"] > 80).astype(int)
    df["stoch_oversold"]  = (df["Stoch_K"] < 20).astype(int)

    # ATR derived
    df["atr_pct"]      = df["ATR_14"] / c.replace(0, np.nan)
    df["atr_ratio"]    = df["ATR_14"] / df["ATR_14"].rolling(14).mean().replace(0, np.nan)
    df["high_volatility"] = (df["atr_ratio"] > 1.5).astype(int)
    df["atr_change"]   = df["ATR_14"].diff()
    df["spread_pct"]   = df["high_low_spread"] / c.replace(0, np.nan)

    # Volume signals
    vol_ma20_v = v.rolling(20).mean()
    df["volume_spike"] = (v > vol_ma20_v * 2).astype(int)
    df["obv_change"]   = df["OBV"].diff()
    df["obv_trend"]    = (df["OBV"].diff(5) > 0).astype(int)

    # Buy pressure
    df["buy_pressure"]      = df["taker_buy_ratio"]
    df["buy_pressure_trend"]= (df["taker_buy_ratio"].diff(3) > 0).astype(int)

    # Candle patterns
    body = (c - df["open"]).abs()
    wick = h - l
    df["candle_body"]    = body / wick.replace(0, np.nan)
    df["doji"]           = (body / wick.replace(0, np.nan) < 0.1).astype(int)
    df["bullish_candle"] = (c > df["open"]).astype(int)
    df["higher_high"]    = (h > h.shift(1)).astype(int)
    df["lower_low"]      = (l < l.shift(1)).astype(int)

    # Target lags (use direction as proxy)
    for lag in [1, 2, 3, 5, 7, 14]:
        df[f"target_lag_{lag}"] = df["direction"].shift(lag)

    return df


def add_sentiment(df: pd.DataFrame, coin_label: int = 0, symbol: str = "") -> pd.DataFrame:
    """
    Populate sentiment features using live VADER scores from RSS news feeds.
    FnG and social features remain neutral (no free real-time source).
    """
    # Fetch live sentiment for this coin
    sent = get_sentiment(symbol) if symbol else {}

    vader_compound  = float(sent.get("vader_compound",  0.0))
    vader_pos       = float(sent.get("vader_pos",       0.0))
    vader_neg       = float(sent.get("vader_neg",       0.0))
    vader_neu       = float(sent.get("vader_neu",       1.0))
    sentiment_label = int(sent.get("sentiment_label",   0))
    finbert_score   = float(sent.get("finbert_score",   0.0))
    finbert_label   = int(sent.get("finbert_label",     0))

    df["coin"]              = coin_label
    df["vader_compound"]    = vader_compound
    df["vader_pos"]         = vader_pos
    df["vader_neg"]         = vader_neg
    df["vader_neu"]         = vader_neu
    df["sentiment_label"]   = sentiment_label
    df["finbert_score"]     = finbert_score
    df["finbert_label"]     = finbert_label
    df["fng_value"]         = 50.0   # neutral — no real-time FnG source
    df["fng_classification"]= 2
    df["social_score"]      = 50.0
    df["social_votes"]      = 0

    # Sentiment rolling features — use constant value across rows
    # (single snapshot; rolling would require historical sentiment data)
    df["sentiment_ma3"]       = vader_compound
    df["sentiment_ma7"]       = vader_compound
    df["sentiment_ma14"]      = vader_compound
    df["sentiment_trend"]     = 0.0
    df["sentiment_momentum"]  = 0.0
    df["sentiment_pos"]       = vader_pos
    df["sentiment_neg"]       = vader_neg
    df["sentiment_strong_pos"]= int(vader_compound >= 0.5)
    df["sentiment_strong_neg"]= int(vader_compound <= -0.5)
    df["vader_pos_change"]    = 0.0
    df["vader_neg_change"]    = 0.0
    df["finbert_ma3"]         = finbert_score
    df["finbert_ma7"]         = finbert_score
    df["finbert_trend"]       = 0.0

    # FnG derived — neutral
    df["fng_extreme_fear"]  = 0
    df["fng_fear"]          = 0
    df["fng_greed"]         = 0
    df["fng_extreme_greed"] = 0
    df["fng_change_3d"]     = 0.0
    df["fng_change_7d"]     = 0.0
    df["fng_ma7"]           = 50.0

    # Social derived — neutral
    df["social_spike"]      = 0
    df["social_trend"]      = 0.0
    df["social_votes_spike"]= 0

    # Interaction features (now use real vader_compound)
    df["sent_x_momentum"]  = df["vader_compound"] * df["price_change_pct"]
    df["rsi_x_winrate"]    = df["RSI_14"] * df["win_rate_24h"]
    df["ema_x_rsi"]        = df["ema_cross_pct"] * df["RSI_14"]
    df["bb_x_stoch"]       = df["BB_pct_b"] * df["Stoch_K"]
    df["fng_x_winrate"]    = df["fng_value"] * df["win_rate_24h"]
    df["vol_x_momentum"]   = df["volume_ratio"] * df["price_change_pct"]

    # Confluence
    df["bull_confluence"] = (
        (df["RSI_14"] > 50).astype(int) +
        (df["ema_cross"] == 1).astype(int) +
        (df["macd_cross"] == 1).astype(int)
    ).clip(0, 1)
    df["bear_confluence"] = (
        (df["RSI_14"] < 50).astype(int) +
        (df["ema_cross"] == 0).astype(int) +
        (df["macd_cross"] == 0).astype(int)
    ).clip(0, 1)

    # sentiment_tech_agree: 1 if sentiment direction matches technical bias
    tech_bullish = (df["bull_confluence"] > df["bear_confluence"]).astype(int)
    sent_bullish = int(vader_compound > 0.05)
    df["sentiment_tech_agree"] = int(tech_bullish.iloc[-1] == sent_bullish)

    return df, sent


# ── Public API ────────────────────────────────────────────────────────────────

def build_features_for_coin(symbol: str) -> dict:
    """
    Fetch live Binance klines for `symbol`, compute all features,
    and return the latest row as a flat dict ready for model inference.
    Also returns the last 24 rows as a sequence for LSTM.
    """
    symbol = symbol.upper()
    coin_label = COIN_LABEL.get(symbol, 0)

    # Fetch enough history for all rolling windows (30d max + buffer)
    df = fetch_klines(symbol, interval="1h", limit=200)
    df = add_indicators(df)
    df, sentiment_data = add_sentiment(df, coin_label, symbol)

    # Drop rows with NaN from rolling windows
    df = df.dropna(subset=["RSI_14", "EMA_21", "BB_pct_b"]).reset_index(drop=True)

    if len(df) < 25:
        raise ValueError(f"Not enough data after indicator calculation: {len(df)} rows")

    # Latest single row for XGB / LGBM / RF
    latest = df.iloc[-1].to_dict()

    # Last 24 rows as sequence for LSTM
    sequence = df.iloc[-24:].to_dict(orient="records")

    return {
        "symbol":   symbol,
        "features": latest,
        "sequence": sequence,
        "fetched_at":  datetime.now(timezone.utc).isoformat(),
        "close_price": latest["close"],
        "rsi":         round(float(latest["RSI_14"]), 2),
        "macd":        round(float(latest["MACD"]), 4),
        "bb_pct_b":    round(float(latest["BB_pct_b"]), 4),
        "sentiment": {
            "vader_compound":  sentiment_data.get("vader_compound", 0.0),
            "vader_pos":       sentiment_data.get("vader_pos", 0.0),
            "vader_neg":       sentiment_data.get("vader_neg", 0.0),
            "vader_neu":       sentiment_data.get("vader_neu", 1.0),
            "sentiment_label": sentiment_data.get("sentiment_label", 0),
            "article_count":   sentiment_data.get("article_count", 0),
            "source":          sentiment_data.get("source", "neutral_fallback"),
            "fetched_at":      sentiment_data.get("fetched_at"),
        },
    }
