"""
Coin-IQ Flask API
Serves predictions from 4 ML models: XGBoost, LightGBM, Random Forest, LSTM
"""

import os
import sys
import warnings
warnings.filterwarnings("ignore")

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
except ImportError:
    pass  # dotenv optional — env vars can be set directly

# Add parent directory to path so we can reference Models folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "Models")

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mail import Mail, Message
from apscheduler.schedulers.background import BackgroundScheduler

from models.xgboost_model import XGBoostPredictor
from models.lgbm_model import LGBMPredictor
from models.rf_model import RFPredictor
from models.lstm_model import LSTMPredictor
from binance_features import build_features_for_coin, COIN_LABEL
from news_sentiment import get_sentiment, get_all_sentiments

app = Flask(__name__)
CORS(app)

# ── Flask-Mail config (Elastic Email) ─────────────────────────────────────────
app.config['MAIL_SERVER']   = os.environ.get('MAIL_SERVER',   'smtp.elasticemail.com')
app.config['MAIL_PORT']     = int(os.environ.get('MAIL_PORT', '2525'))
app.config['MAIL_USE_TLS']  = os.environ.get('MAIL_USE_TLS',  'true').lower() == 'true'
app.config['MAIL_USE_SSL']  = False
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', app.config['MAIL_USERNAME'])

mail = Mail(app)

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


# ── Flask-Mail: send new password email ──────────────────────────────────────

@app.route("/send-password-email", methods=["POST"])
def send_password_email():
    """
    Called by Next.js forgot-password route.
    Body: { "email": "...", "name": "...", "new_password": "..." }
    """
    data = request.get_json(force=True)
    email        = data.get("email", "")
    name         = data.get("name", "User")
    new_password = data.get("new_password", "")

    if not email or not new_password:
        return jsonify({"error": "email and new_password are required"}), 400

    try:
        msg = Message(
            subject="Your Coin-IQ New Password",
            recipients=[email],
        )
        msg.html = f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
          <div style="background:#0f172a;padding:24px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px">Coin-IQ — New Password</h1>
          </div>
          <div style="background:#f8fafc;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
            <p style="color:#374151;margin:0 0 12px">Hi <strong>{name}</strong>,</p>
            <p style="color:#374151;margin:0 0 20px">
              Your password has been reset. Use the temporary password below to sign in,
              then change it from your profile settings.
            </p>
            <div style="background:#fff;border:2px solid #0f172a;border-radius:10px;padding:18px;text-align:center;margin:0 0 20px">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Your new password</p>
              <span style="font-size:22px;font-weight:900;letter-spacing:4px;color:#0f172a;font-family:monospace">{new_password}</span>
            </div>
            <p style="color:#6b7280;font-size:13px;margin:0">
              If you did not request this, please contact support immediately.
            </p>
          </div>
        </div>"""
        msg.body = (
            f"Hi {name},\n\n"
            f"Your new Coin-IQ password is: {new_password}\n\n"
            f"Please sign in and change it from your profile settings.\n\n"
            f"If you did not request this, contact support immediately."
        )
        mail.send(msg)
        return jsonify({"message": "Email sent successfully"})
    except Exception as e:
        print(f"[Flask-Mail] Error sending email: {e}")
        return jsonify({"error": str(e)}), 500


# ── Background prediction saver ───────────────────────────────────────────────

import requests as _requests

NEXT_BASE = os.environ.get("NEXT_PUBLIC_BASE_URL", "http://localhost:3000")

def _save_all_predictions():
    """
    Runs every hour: fetches live predictions for all 20 coins and
    POSTs each one to the Next.js /api/predictions/save endpoint so
    they are persisted in the database without any user interaction.
    """
    print("[Scheduler] Saving predictions for all 20 coins...")
    saved = 0
    for coin in sorted(COIN_LABEL.keys()):
        try:
            data     = build_features_for_coin(coin)
            features = data["features"]
            sequence = data["sequence"]
            probs    = []
            results  = {}

            r = xgb_predictor.predict(coin, features)
            results["xgboost"] = r
            if "probability" in r: probs.append(r["probability"])

            r = lgbm_predictor.predict(features)
            results["lightgbm"] = r
            if "probability" in r: probs.append(r["probability"])

            r = rf_predictor.predict(features)
            results["random_forest"] = r
            if "probability" in r: probs.append(r["probability"])

            r = lstm_predictor.predict(sequence)
            results["lstm"] = r
            if "probability" in r: probs.append(r["probability"])

            ensemble_prob      = round(sum(probs) / len(probs), 4) if probs else None
            ensemble_direction = "UP" if ensemble_prob and ensemble_prob >= 0.5 else "DOWN"
            confidence         = round(abs(ensemble_prob - 0.5) * 2 * 100, 1) if ensemble_prob else 0

            payload = {
                "coin":                 coin,
                "price_at_prediction":  data["close_price"],
                "ensemble_direction":   ensemble_direction,
                "ensemble_probability": ensemble_prob,
                "ensemble_confidence":  f"{confidence}%",
                "xgb_direction":        results["xgboost"].get("direction"),
                "xgb_probability":      results["xgboost"].get("probability"),
                "lgbm_direction":       results["lightgbm"].get("direction"),
                "lgbm_probability":     results["lightgbm"].get("probability"),
                "rf_direction":         results["random_forest"].get("direction"),
                "rf_probability":       results["random_forest"].get("probability"),
                "lstm_direction":       results["lstm"].get("direction"),
                "lstm_probability":     results["lstm"].get("probability"),
                "rsi":                  data["rsi"],
                "macd":                 data["macd"],
                "bb_pct_b":             data["bb_pct_b"],
            }

            _requests.post(
                f"{NEXT_BASE}/api/predictions/save",
                json=payload,
                timeout=10,
            )
            saved += 1
        except Exception as e:
            print(f"[Scheduler] Error saving {coin}: {e}")

    print(f"[Scheduler] Done — saved {saved}/20 predictions.")

    # Also trigger outcome checking for predictions made ~24h ago
    try:
        _requests.get(f"{NEXT_BASE}/api/predictions/check-outcomes", timeout=30)
    except Exception:
        pass


import json as _json
import os as _os_state

# ── Persistent scheduler state ────────────────────────────────────────────────
_STATE_FILE = _os_state.path.join(_os_state.path.dirname(__file__), "scheduler_state.json")

def _load_scheduler_state() -> bool:
    """Return True if scheduler should be running (default True if no file)."""
    try:
        with open(_STATE_FILE, "r") as f:
            data = _json.load(f)
            return bool(data.get("recording", True))
    except (FileNotFoundError, ValueError):
        return True  # default: start recording on first run

def _save_scheduler_state(recording: bool):
    """Persist the recording state to disk."""
    try:
        with open(_STATE_FILE, "w") as f:
            _json.dump({"recording": recording}, f)
    except Exception as e:
        print(f"[Scheduler] Warning: could not save state: {e}")

# Start scheduler — respects saved state from previous run
_scheduler = BackgroundScheduler(daemon=True)
_scheduler_should_run = _load_scheduler_state()

if _scheduler_should_run:
    _scheduler.add_job(
        _save_all_predictions,
        trigger="interval",
        minutes=1,
        id="save_predictions",
        next_run_time=__import__("datetime").datetime.now(),
    )
    print("[Scheduler] Prediction saver started — runs every minute.")
else:
    print("[Scheduler] Prediction saver is STOPPED (saved state). Use /scheduler/start to enable.")

_scheduler.start()


# ── Scheduler control endpoints ───────────────────────────────────────────────

@app.route("/scheduler/status", methods=["GET"])
def scheduler_status():
    job     = _scheduler.get_job("save_predictions")
    running = job is not None and _scheduler.running
    return jsonify({"recording": running, "status": "running" if running else "stopped"})


@app.route("/scheduler/start", methods=["POST"])
def scheduler_start():
    job = _scheduler.get_job("save_predictions")
    if job is None:
        _scheduler.add_job(
            _save_all_predictions,
            trigger="interval",
            minutes=1,
            id="save_predictions",
            next_run_time=__import__("datetime").datetime.now(),
        )
        print("[Scheduler] Recording started.")
    _save_scheduler_state(True)   # persist: ON
    return jsonify({"recording": True, "message": "Recording started"})


@app.route("/scheduler/stop", methods=["POST"])
def scheduler_stop():
    job = _scheduler.get_job("save_predictions")
    if job is not None:
        _scheduler.remove_job("save_predictions")
        print("[Scheduler] Recording stopped.")
    _save_scheduler_state(False)  # persist: OFF
    return jsonify({"recording": False, "message": "Recording stopped"})


# ── Interval snapshot locking job ─────────────────────────────────────────────

import psycopg2, os as _os

def _get_db_conn():
    return psycopg2.connect(
        host    = _os.environ.get("DB_HOST",     "localhost"),
        port    = int(_os.environ.get("DB_PORT", "5432")),
        dbname  = _os.environ.get("DB_NAME",     "coin_iq"),
        user    = _os.environ.get("DB_USER",     "postgres"),
        password= _os.environ.get("DB_PASSWORD", "123"),
    )

INTERVAL_MINUTES = [10, 20, 30, 60, 120, 360, 720, 1440, 2880, 4320, 10080, 43200]

def _lock_interval_snapshots():
    """
    Runs every minute. For each interval (10min, 20min, …):
    1. Determine the current session_start = floor(NOW() to interval boundary)
    2. If the interval has elapsed and no snapshot exists yet → create + lock it
    3. Fetch the outcome price from Binance and mark was_correct
    """
    from datetime import datetime, timezone, timedelta
    import requests as _req

    now = datetime.now(timezone.utc)

    try:
        conn = _get_db_conn()
        cur  = conn.cursor()

        for minutes in INTERVAL_MINUTES:
            # session_start = most recent boundary (floor to interval)
            epoch_seconds   = int(now.timestamp())
            interval_secs   = minutes * 60
            session_epoch   = (epoch_seconds // interval_secs) * interval_secs
            session_start   = datetime.fromtimestamp(session_epoch, tz=timezone.utc)
            session_end     = session_start + timedelta(minutes=minutes)

            # Only lock once the interval has fully elapsed
            if now < session_end:
                continue

            # Check if already locked for this session
            cur.execute(
                "SELECT COUNT(*) FROM prediction_interval_snapshots "
                "WHERE interval_minutes = %s AND session_start = %s AND locked_at IS NOT NULL",
                (minutes, session_start)
            )
            already_locked = cur.fetchone()[0]
            if already_locked > 0:
                continue

            # Find the prediction made closest to session_start for each coin
            cur.execute("""
                SELECT DISTINCT ON (coin)
                    coin, ensemble_direction, price_at_prediction,
                    ensemble_probability,
                    xgb_direction, lgbm_direction, rf_direction, lstm_direction,
                    predicted_at
                FROM prediction_history
                WHERE predicted_at >= %s - INTERVAL '5 minutes'
                  AND predicted_at <= %s + INTERVAL '5 minutes'
                ORDER BY coin,
                    ABS(EXTRACT(EPOCH FROM (predicted_at - %s))) ASC
            """, (session_start, session_start, session_start))
            predictions = cur.fetchall()

            if not predictions:
                continue

            # Fetch current prices from Binance for outcome
            coins = [p[0] for p in predictions]
            prices = {}
            try:
                resp = _req.get("https://api.binance.com/api/v3/ticker/price", timeout=8)
                if resp.ok:
                    for t in resp.json():
                        if t["symbol"] in coins:
                            prices[t["symbol"]] = float(t["price"])
            except Exception:
                pass

            locked_at = now
            for p in predictions:
                (coin, ens_dir, price_then, ens_prob,
                 xgb_dir, lgbm_dir, rf_dir, lstm_dir, pred_at) = p

                outcome_price    = prices.get(coin)
                actual_direction = None
                was_correct      = None
                if outcome_price and price_then:
                    actual_direction = "UP" if outcome_price >= float(price_then) else "DOWN"
                    was_correct      = actual_direction == ens_dir

                cur.execute("""
                    INSERT INTO prediction_interval_snapshots
                        (coin, interval_minutes, session_start, predicted_at,
                         price_at_prediction, ensemble_direction, ensemble_probability,
                         xgb_direction, lgbm_direction, rf_direction, lstm_direction,
                         outcome_price, actual_direction, was_correct, locked_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (coin, interval_minutes, session_start) DO UPDATE
                        SET outcome_price    = EXCLUDED.outcome_price,
                            actual_direction = EXCLUDED.actual_direction,
                            was_correct      = EXCLUDED.was_correct,
                            locked_at        = EXCLUDED.locked_at
                """, (
                    coin, minutes, session_start, pred_at,
                    price_then, ens_dir, ens_prob,
                    xgb_dir, lgbm_dir, rf_dir, lstm_dir,
                    outcome_price, actual_direction, was_correct, locked_at
                ))

            conn.commit()
            print(f"[Locker] Locked {len(predictions)} coins for {minutes}min interval @ {session_start}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"[Locker] Error: {e}")


# Add locking job to scheduler (runs every minute)
_scheduler.add_job(
    _lock_interval_snapshots,
    trigger="interval",
    minutes=1,
    id="lock_intervals",
    next_run_time=__import__("datetime").datetime.now(),
)
print("[Scheduler] Interval locker started.")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
