"""
Coin-IQ Flask API
Serves predictions from 4 ML models: XGBoost, LightGBM, Random Forest, LSTM
"""

import os
import sys
import warnings
warnings.filterwarnings("ignore")

# Add parent directory to path so we can reference Models folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "Models")

from flask import Flask, jsonify, request
from flask_cors import CORS

from models.xgboost_model import XGBoostPredictor
from models.lgbm_model import LGBMPredictor
from models.rf_model import RFPredictor
from models.lstm_model import LSTMPredictor
from binance_features import build_features_for_coin, COIN_LABEL
from news_sentiment import get_sentiment, get_all_sentiments

app = Flask(__name__)
CORS(app)

# ── Load all models at startup ──────────────────────────────────────────────
print("Loading models...")

xgb_predictor  = XGBoostPredictor(MODELS_DIR)
lgbm_predictor = LGBMPredictor(MODELS_DIR)
rf_predictor   = RFPredictor(MODELS_DIR)
lstm_predictor = LSTMPredictor(MODELS_DIR)

print("All models loaded.\n")


# ── Health check ─────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "api": "Coin-IQ Prediction API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "GET  /health":                        "Health check",
            "GET  /models":                        "List available models and supported coins",
            "POST /predict/xgboost":               "XGBoost prediction (manual features)",
            "POST /predict/lgbm":                  "LightGBM prediction (manual features)",
            "POST /predict/rf":                    "Random Forest prediction (manual features)",
            "POST /predict/lstm":                  "LSTM prediction (manual 24-step sequence)",
            "POST /predict/all":                   "Run all models and return ensemble (manual features)",
            "GET  /live/coins":                    "List coins supported for live prediction",
            "GET  /live/predict/<coin>":            "Live prediction from Binance (e.g. /live/predict/BTCUSDT)",
            "GET  /live/predict/all-coins":        "Live predictions for all 20 coins",
        }
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "models": {
            "xgboost":      xgb_predictor.is_ready(),
            "lightgbm":     lgbm_predictor.is_ready(),
            "random_forest": rf_predictor.is_ready(),
            "lstm":         lstm_predictor.is_ready(),
        }
    })


# ── Model info ────────────────────────────────────────────────────────────────
@app.route("/models", methods=["GET"])
def list_models():
    return jsonify({
        "xgboost": {
            "description": "Per-coin XGBoost classifiers (binary: price up/down next day)",
            "supported_coins": xgb_predictor.supported_coins(),
            "accuracy_range": "71.1% – 74.3%",
            "roc_auc_range":  "0.77 – 0.81",
            "features": xgb_predictor.feature_names(),
        },
        "lightgbm": {
            "description": "LightGBM classifier with sentiment + technical features",
            "features": lgbm_predictor.feature_names(),
            "n_features": lgbm_predictor.n_features(),
        },
        "random_forest": {
            "description": "Random Forest classifier",
            "features": rf_predictor.feature_names(),
            "n_features": rf_predictor.n_features(),
        },
        "lstm": {
            "description": "LSTM sequence model (seq_len=24)",
            "features": lstm_predictor.feature_names(),
            "n_features": lstm_predictor.n_features(),
            "seq_len": lstm_predictor.seq_len(),
        },
    })


# ── XGBoost ───────────────────────────────────────────────────────────────────
@app.route("/predict/xgboost", methods=["POST"])
def predict_xgboost():
    """
    Body: { "coin": "BTCUSDT", "features": { <feature_name>: value, ... } }
    Returns: { "coin", "direction", "probability", "threshold", "model" }
    """
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    coin     = data.get("coin", "").upper()
    features = data.get("features", {})

    if not coin:
        return jsonify({"error": "'coin' field is required (e.g. BTCUSDT)"}), 400
    if not features:
        return jsonify({"error": "'features' dict is required"}), 400

    result = xgb_predictor.predict(coin, features)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


# ── LightGBM ──────────────────────────────────────────────────────────────────
@app.route("/predict/lgbm", methods=["POST"])
def predict_lgbm():
    """
    Body: { "features": { <feature_name>: value, ... } }
    Returns: { "direction", "probability", "model" }
    """
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    features = data.get("features", {})
    if not features:
        return jsonify({"error": "'features' dict is required"}), 400

    result = lgbm_predictor.predict(features)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


# ── Random Forest ─────────────────────────────────────────────────────────────
@app.route("/predict/rf", methods=["POST"])
def predict_rf():
    """
    Body: { "features": { <feature_name>: value, ... } }
    Returns: { "direction", "probability", "model" }
    """
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    features = data.get("features", {})
    if not features:
        return jsonify({"error": "'features' dict is required"}), 400

    result = rf_predictor.predict(features)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


# ── LSTM ──────────────────────────────────────────────────────────────────────
@app.route("/predict/lstm", methods=["POST"])
def predict_lstm():
    """
    Body: { "sequence": [ { <feature_name>: value, ... }, ... ] }  (24 timesteps)
    Returns: { "direction", "probability", "model" }
    """
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    sequence = data.get("sequence", [])
    if not sequence:
        return jsonify({"error": "'sequence' list is required (24 timesteps)"}), 400

    result = lstm_predictor.predict(sequence)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


# ── Ensemble (all models) ─────────────────────────────────────────────────────
@app.route("/predict/all", methods=["POST"])
def predict_all():
    """
    Runs all available models and returns individual + ensemble result.
    Body: {
        "coin": "BTCUSDT",          (for XGBoost)
        "features": { ... },        (single-row features for XGB / LGBM / RF)
        "sequence": [ {...}, ... ]  (24-row sequence for LSTM)
    }
    """
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    coin     = data.get("coin", "").upper()
    features = data.get("features", {})
    sequence = data.get("sequence", [])

    results = {}
    probs   = []

    if coin and features:
        r = xgb_predictor.predict(coin, features)
        results["xgboost"] = r
        if "probability" in r:
            probs.append(r["probability"])

    if features:
        r = lgbm_predictor.predict(features)
        results["lightgbm"] = r
        if "probability" in r:
            probs.append(r["probability"])

        r = rf_predictor.predict(features)
        results["random_forest"] = r
        if "probability" in r:
            probs.append(r["probability"])

    if sequence:
        r = lstm_predictor.predict(sequence)
        results["lstm"] = r
        if "probability" in r:
            probs.append(r["probability"])

    ensemble_prob      = round(sum(probs) / len(probs), 4) if probs else None
    ensemble_direction = "UP" if ensemble_prob and ensemble_prob >= 0.5 else "DOWN"

    return jsonify({
        "models":    results,
        "ensemble": {
            "probability": ensemble_prob,
            "direction":   ensemble_direction,
            "models_used": len(probs),
        }
    })


# ── Live Binance endpoints ────────────────────────────────────────────────────

@app.route("/live/coins", methods=["GET"])
def live_coins():
    """Returns the list of supported coins for live prediction."""
    return jsonify({
        "supported_coins": sorted(COIN_LABEL.keys()),
        "note": "Use GET /live/predict/<coin> for a live prediction"
    })


@app.route("/live/predict/<coin>", methods=["GET"])
def live_predict(coin: str):
    """
    Fetches live 1h klines from Binance for <coin>, computes all technical
    features, runs all 4 models, and returns an ensemble prediction.

    Example: GET /live/predict/BTCUSDT
    Optional query param: ?models=xgboost,lgbm,rf,lstm  (default: all)
    """
    coin = coin.upper()
    if coin not in COIN_LABEL:
        return jsonify({
            "error": f"'{coin}' not supported.",
            "supported": sorted(COIN_LABEL.keys())
        }), 400

    # Which models to run (default all)
    requested = request.args.get("models", "xgboost,lgbm,rf,lstm")
    run_models = {m.strip().lower() for m in requested.split(",")}

    try:
        data = build_features_for_coin(coin)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch Binance data: {str(e)}"}), 502

    features = data["features"]
    sequence = data["sequence"]
    results  = {}
    probs    = []

    if "xgboost" in run_models:
        r = xgb_predictor.predict(coin, features)
        results["xgboost"] = r
        if "probability" in r:
            probs.append(r["probability"])

    if "lgbm" in run_models:
        r = lgbm_predictor.predict(features)
        results["lightgbm"] = r
        if "probability" in r:
            probs.append(r["probability"])

    if "rf" in run_models:
        r = rf_predictor.predict(features)
        results["random_forest"] = r
        if "probability" in r:
            probs.append(r["probability"])

    if "lstm" in run_models:
        r = lstm_predictor.predict(sequence)
        results["lstm"] = r
        if "probability" in r:
            probs.append(r["probability"])

    ensemble_prob      = round(sum(probs) / len(probs), 4) if probs else None
    ensemble_direction = "UP" if ensemble_prob and ensemble_prob >= 0.5 else "DOWN"
    confidence         = round(abs(ensemble_prob - 0.5) * 2 * 100, 1) if ensemble_prob else 0

    return jsonify({
        "coin":        coin,
        "fetched_at":  data["fetched_at"],
        "market": {
            "close_price": data["close_price"],
            "rsi":         data["rsi"],
            "macd":        data["macd"],
            "bb_pct_b":    data["bb_pct_b"],
        },
        "sentiment": data.get("sentiment", {}),
        "models": results,
        "ensemble": {
            "direction":   ensemble_direction,
            "probability": ensemble_prob,
            "confidence":  f"{confidence}%",
            "models_used": len(probs),
        },
        "note": "Sentiment from live RSS news (CoinDesk, CoinTelegraph, Decrypt) via VADER. FnG/social remain neutral."
    })


@app.route("/live/predict/all-coins", methods=["GET"])
def live_predict_all_coins():
    """
    Runs live predictions for ALL supported coins.
    Warning: makes 20 Binance API calls — may take ~10-20 seconds.
    Optional query param: ?models=xgboost,lgbm  (default: xgboost only for speed)
    """
    requested  = request.args.get("models", "xgboost")
    run_models = {m.strip().lower() for m in requested.split(",")}

    predictions = {}
    errors      = {}

    for coin in sorted(COIN_LABEL.keys()):
        try:
            data     = build_features_for_coin(coin)
            features = data["features"]
            sequence = data["sequence"]
            probs    = []
            results  = {}

            if "xgboost" in run_models:
                r = xgb_predictor.predict(coin, features)
                results["xgboost"] = r
                if "probability" in r:
                    probs.append(r["probability"])

            if "lgbm" in run_models:
                r = lgbm_predictor.predict(features)
                results["lightgbm"] = r
                if "probability" in r:
                    probs.append(r["probability"])

            if "rf" in run_models:
                r = rf_predictor.predict(features)
                results["random_forest"] = r
                if "probability" in r:
                    probs.append(r["probability"])

            if "lstm" in run_models:
                r = lstm_predictor.predict(sequence)
                results["lstm"] = r
                if "probability" in r:
                    probs.append(r["probability"])

            ensemble_prob      = round(sum(probs) / len(probs), 4) if probs else None
            ensemble_direction = "UP" if ensemble_prob and ensemble_prob >= 0.5 else "DOWN"
            confidence         = round(abs(ensemble_prob - 0.5) * 2 * 100, 1) if ensemble_prob else 0

            predictions[coin] = {
                "close_price": data["close_price"],
                "direction":   ensemble_direction,
                "probability": ensemble_prob,
                "confidence":  f"{confidence}%",
                "rsi":         data["rsi"],
            }
        except Exception as e:
            errors[coin] = str(e)

    return jsonify({
        "predictions": predictions,
        "errors":      errors,
        "models_used": list(run_models),
    })


@app.route("/sentiment", methods=["GET"])
def sentiment_all():
    """
    Returns current VADER sentiment scores for all 20 coins.
    Scores are derived from live RSS news (CoinDesk, CoinTelegraph, Decrypt).
    Cached for 5 minutes.

    Optional: GET /sentiment?coin=BTCUSDT  for a single coin.
    """
    coin = request.args.get("coin", "").upper()
    if coin:
        if coin not in COIN_LABEL:
            return jsonify({"error": f"'{coin}' not supported.", "supported": sorted(COIN_LABEL.keys())}), 400
        return jsonify({coin: get_sentiment(coin)})
    return jsonify(get_all_sentiments())


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
