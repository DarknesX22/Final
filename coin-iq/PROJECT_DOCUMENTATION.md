# Coin-IQ — Full Project Documentation

## 1. Project Overview

Coin-IQ is a full-stack cryptocurrency prediction and education platform. It combines four machine learning models running on live Binance market data with a crypto learning hub, user authentication, admin dashboard, and real-time analytics. The platform serves predictions for 20 cryptocurrencies and tracks model accuracy over time.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.1.1 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion 12 |
| Backend (API) | Next.js API Routes (TypeScript) |
| ML API | Flask 3.1.2 (Python) |
| Database | PostgreSQL (via pg pool) |
| Authentication | JWT (HttpOnly cookies), bcrypt |
| Email | EmailJS REST API |
| ML Models | XGBoost, LightGBM, Random Forest, LSTM (TensorFlow/Keras) |
| Market Data | Binance REST API |
| News/Sentiment | CoinDesk, CoinTelegraph, Decrypt RSS + VADER |
| Scheduler | APScheduler (Python background jobs) |

---

## 3. Architecture

```
Browser (Next.js)
    │
    ├── /api/* (Next.js API Routes)  ──── PostgreSQL DB
    │
    └── /flask-api/* (proxied)  ──────── Flask API (port 5000)
                                              │
                                         ┌───┴────────────┐
                                         │  4 ML Models   │
                                         │  Binance API   │
                                         │  RSS Sentiment │
                                         │  APScheduler   │
                                         └────────────────┘
```

The Next.js app proxies all `/flask-api/*` requests to `localhost:5000` via `next.config.ts` rewrites. The Flask API runs independently and is responsible for all ML inference, feature engineering, and the background prediction scheduler.

---

## 4. Database Schema

### 4.1 Core Tables (schema.sql)

**users** — registered platform users
- id, name, email, password_hash, created_at, updated_at

**admins** — admin accounts with elevated access
- id, name, email, password_hash, role, created_at, updated_at

**oauth_providers** — social login links (Google, Facebook)
- id, provider, provider_user_id, user_id, email

**password_reset_tokens** — token-based password reset (legacy)
- id, user_id, token, expires_at, used

**otp_verifications** — OTP codes for email verification
- id, email, otp_code, expires_at, verified, attempts, locked_until

### 4.2 LMS Tables (lms-schema.sql)

**lms_courses** — course metadata (slug, title, level, duration, icon)
**lms_lessons** — lesson content per course
**lms_quiz_questions** — quiz questions with JSONB options
**lms_user_progress** — per-user per-course progress tracking
**lms_certificates** — issued certificates with hex IDs

### 4.3 Prediction History (predictions-schema.sql)

**prediction_history** — every ML prediction ever made
- coin, predicted_at, price_at_prediction
- ensemble_direction, ensemble_probability, ensemble_confidence
- xgb/lgbm/rf/lstm direction + probability (all 4 models)
- rsi, macd, bb_pct_b (technical indicators at prediction time)
- outcome_price, outcome_direction, outcome_checked_at, was_correct

---

## 5. Machine Learning Pipeline

### 5.1 Models

**XGBoost** — 20 separate models, one per coin
- Trained on historical OHLCV + technical + sentiment features
- Per-coin classification thresholds (0.41–0.58)
- Accuracy: 71.1%–74.3% | ROC-AUC: 0.77–0.81
- Features: 141 (OHLCV, technicals, sentiment, lag features, candle patterns)

**LightGBM** — single universal model
- 45 features: coin label, price change, VADER sentiment, FinBERT, FnG, technicals, direction lags, win rates, interaction features

**Random Forest** — single universal model
- 28 features: core subset of technicals + sentiment + direction lags

**LSTM** — sequence model (TensorFlow/Keras)
- Input: 24 timesteps × 41 features
- Target: binary direction (UP/DOWN next day)
- Processes temporal patterns in price history

### 5.2 Ensemble

All 4 model probabilities are averaged. If the average ≥ 0.5 → UP, else → DOWN. Confidence = `|probability - 0.5| × 2 × 100%`.

### 5.3 Feature Engineering (binance_features.py)

Fetches 200 × 1h klines from Binance and computes:
- EMAs (9, 21), MACD, Bollinger Bands, RSI (14), Stochastic, ROC, ATR, OBV
- Volume ratios, taker buy ratio, high-low spread
- Lag features: close_lag_1/3/7, direction lags 1–24, return lags
- Win rates (24h, 72h), volatility windows (5/7/14/21/24/30d)
- Z-scores, EMA cross signals, candle patterns, confluence flags
- Sentiment features from live RSS news (VADER)

### 5.4 News Sentiment (news_sentiment.py)

Added during this session. Fetches RSS feeds from CoinDesk, CoinTelegraph, and Decrypt. Runs VADER sentiment analysis on every article title + description. Maps articles to coins via keyword matching (e.g. "bitcoin"/"btc" → BTCUSDT). Falls back to general crypto sentiment if no coin-specific articles found. Results cached for 5 minutes. Replaces the previous neutral placeholder values.

---

## 6. Flask API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | / | API info |
| GET | /health | All 4 model status |
| GET | /models | Feature lists, supported coins |
| POST | /predict/xgboost | XGBoost prediction (manual features) |
| POST | /predict/lgbm | LightGBM prediction |
| POST | /predict/rf | Random Forest prediction |
| POST | /predict/lstm | LSTM prediction (24-step sequence) |
| POST | /predict/all | All models + ensemble |
| GET | /live/coins | Supported coins list |
| GET | /live/predict/\<coin\> | Live prediction from Binance |
| GET | /live/predict/all-coins | All 20 coins at once |
| GET | /sentiment | VADER sentiment for all/one coin |
| POST | /send-password-email | Send password reset email (Flask-Mail) |

---

## 7. Next.js API Routes

### 7.1 Authentication

| Route | Method | Description |
|---|---|---|
| /api/auth/login | POST | Check admins then users, set JWT cookies |
| /api/auth/signup | POST | Create user, set JWT cookie |
| /api/auth/logout | POST | Clear auth cookies |
| /api/auth/me | GET | Return current user from cookie |
| /api/auth/forgot-password | POST | Generate 16-char password, save to DB, send via EmailJS |
| /api/auth/otp/send | POST | Generate 6-digit OTP, store in DB, send via EmailJS |
| /api/auth/otp/verify-signup | POST | Validate OTP, create user account |
| /api/auth/reset-password | POST | Token-based password reset (legacy) |

### 7.2 Predictions

| Route | Method | Description |
|---|---|---|
| /api/predictions/save | POST | Store prediction snapshot in DB |
| /api/predictions/history | GET | Last 24h predictions + accuracy + interval stats |
| /api/predictions/check-outcomes | GET | Resolve 24h-old predictions against current prices |

### 7.3 Other

| Route | Description |
|---|---|
| /api/crypto | Top coins from Binance (5-min cache) |
| /api/news | RSS aggregator (CoinDesk, CoinTelegraph, Decrypt) |
| /api/profile | GET/PUT user profile |
| /api/learn/* | LMS courses, lessons, quiz, certificates |
| /api/admin/* | Admin analytics, user management, LMS management |

---

## 8. Frontend Pages

| Route | Auth | Description |
|---|---|---|
| / | Public | Landing page with hero, ticker, features, predictions preview |
| /coins | Public | Crypto market table with search, sort, pagination |
| /markets | Public | Market card grid |
| /news | Public | RSS news aggregator, paginated |
| /about | Public | About page with team, tech stack, story |
| /predictions | Auth gate | AI predictions dashboard (blur gate if not logged in) |
| /analytics | Auth gate | Live analytics — overview, coins table, sentiment tab |
| /learn | Auth | LMS course catalog |
| /learn/[slug] | Auth | Course lesson viewer |
| /learn/[slug]/quiz | Auth | Quiz page |
| /learn/certificate/[id] | Public | Printable certificate |
| /dashboard | Auth | User dashboard — predictions, history, market data, LMS |
| /login | Public | Split-screen login |
| /signup | Public | 2-step signup with OTP email verification |
| /forgot-password | Public | Request new auto-generated password |
| /admin | Admin | Admin dashboard |

---

## 9. Key Features Built During This Session

### 9.1 News Sentiment Analysis

**What:** Live VADER sentiment analysis on crypto news, fed into ML models as features.

**How:** Created `flask-api/news_sentiment.py`. On each prediction request, it fetches RSS feeds from CoinDesk, CoinTelegraph, and Decrypt. Runs VADER on every article. Maps articles to coins via keyword lists. Computes average compound score, pos/neg/neu ratios, and sentiment label. Results cached 5 minutes. The `add_sentiment()` function in `binance_features.py` replaces the old `add_neutral_sentiment()` — real VADER scores now flow into all 4 models.

### 9.2 Prediction History & Accuracy Tracking

**What:** Every prediction is saved to PostgreSQL. Dashboard shows a History tab comparing what the model predicted vs what actually happened.

**How:**
- Created `predictions-schema.sql` with the `prediction_history` table
- `POST /api/predictions/save` stores each prediction snapshot
- Flask APScheduler calls `_save_all_predictions()` every minute — fetches all 20 coins, runs all 4 models, POSTs to Next.js save endpoint
- `GET /api/predictions/history` enriches stored predictions with current live Binance prices, computes real-time accuracy, and returns interval stats (10min → 30 days)
- `GET /api/predictions/check-outcomes` resolves predictions made ~24h ago against actual prices
- Dashboard History tab shows: Price Then vs Price Now, % change, Model Said vs Market Did, Correct/Wrong badge
- Cumulative accuracy cards show accuracy for 12 time windows, growing as more data accumulates

### 9.3 Forgot Password — Auto-Generated Password

**What:** User submits email → system generates a 16-char random password → saves hashed to DB → sends plain password to user's email via EmailJS.

**How:** Rewrote `POST /api/auth/forgot-password`. Uses `crypto.randomBytes` to generate an alphanumeric password. Hashes with bcrypt and updates `users.password_hash`. Calls EmailJS REST API (`https://api.emailjs.com/api/v1.0/email/send`) with service_id, template_id, public_key, and private_key. No SMTP needed — works over HTTPS port 443.

### 9.4 OTP Email Verification on Signup

**What:** New users must verify their email with a 6-digit OTP before their account is created.

**How:**
- Signup page is now 2-step: form → OTP entry
- `POST /api/auth/otp/send` generates OTP, stores in `otp_verifications` table with 15-min expiry, sends via EmailJS (template `template_220g35n`)
- `POST /api/auth/otp/verify-signup` validates OTP (max 5 attempts, 10-min lockout on failure), then creates the user account
- OTP boxes auto-advance on input, backspace navigates back
- 60-second resend cooldown

### 9.5 Edit Profile Modal

**What:** "Edit Profile" in the navbar dropdown and dashboard now opens a centered modal instead of navigating to a separate page.

**How:** Created `edit-profile-modal.tsx` using `createPortal(modal, document.body)` to render outside the navbar's DOM tree (fixing z-index/positioning issues). Two-tab design: Personal Info and Password. Dark banner header with avatar overlap. Navbar and dashboard both import and use this shared component.

### 9.6 Analytics Page Auth Gate

**What:** Analytics page shows a login/signup form at the top and blurs the content when not authenticated — same pattern as the Predictions page.

**How:** Added `authed` state, `checkAuth()`, login/signup handlers, and `AnimatePresence` auth gate section to `analytics/page.tsx`. Content wrapped in a blur overlay (`backdrop-filter: blur(8px)`) when `authed === false`.

### 9.7 Dashboard Improvements

**What:** Added suggestion column, model icons, history tab, spacing fixes.

**How:**
- Model direction indicators changed from `▲▼` text to `ArrowBigUp`/`ArrowBigDown` Lucide icons in colored rounded squares
- Suggestion column added: Strong Buy / Buy / Hold / Sell / Strong Sell based on ensemble confidence, RSI, and risk level
- Live/History tab switcher in the top bar
- Dashboard header no longer sticky (removed `sticky top-16`)
- `h-24` spacer added above the header for breathing room

### 9.8 Admin Daily Signups Chart Redesign

**What:** Replaced the basic SVG bar chart with an interactive area chart.

**How:** Rewrote the `SignupsChart` component in `admin/page.tsx`. New chart uses a `viewBox`-based responsive SVG with gradient fill under the line, grid lines with Y-axis labels, animated polyline, hover interaction (tooltip + vertical guide line), and date labels. Mini stats row above the chart shows Last 30d total, Daily average, and Peak day.

### 9.9 Analytics Performance Chart Redesign

**What:** Replaced the plain horizontal diverging bar chart with a 2-column card grid.

**How:** Each coin gets a card with logo, name, animated background fill proportional to magnitude, 7-day sparkline, live price, and % change badge. Cards stagger in with Framer Motion delays.

---

## 10. Email System

EmailJS is used for all transactional emails. It works over HTTPS (port 443) — no SMTP port blocking issues.

| Template | ID | Variables | Used For |
|---|---|---|---|
| Password Reset | template_inx67iw | {{email}}, {{name}}, {{new_password}} | Forgot password |
| OTP Verification | template_220g35n | {{email}}, {{name}}, {{passcode}}, {{time}} | Signup OTP |

**Credentials:**
- Service ID: service_kzoq3zj
- Public Key: f9PoMgPGK53rQ8XF4
- Private Key: stored in `EMAILJS_PRIVATE_KEY` env var

---

## 11. Running the Project

```bash
# Terminal 1 — Flask API
cd flask-api
python app.py
# Starts on http://localhost:5000
# Loads all 4 ML models (~30s)
# Starts APScheduler (saves predictions every minute)

# Terminal 2 — Next.js
cd coin-iq
npm run dev
# Starts on http://localhost:3000
```

### Environment Variables (coin-iq/.env.local)

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=coin_iq
DB_PASSWORD=123
DB_PORT=5432
JWT_SECRET=coin_iq_secret_key_change_this_in_production
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EMAILJS_PRIVATE_KEY=652mWlBIroUNl5qNmqWS-
EMAILJS_OTP_TEMPLATE_ID=template_220g35n
```

### Flask Environment (flask-api/.env)

```
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=umairahmed25679@gmail.com
MAIL_PASSWORD=mrnl noxo fvny rffm
MAIL_DEFAULT_SENDER=umairahmed25679@gmail.com
```

### Admin Account

```
Email: admin@coiniq.com
Password: admin123
```

Run `npm run admin:init` in `coin-iq/` to create if not exists.

---

## 12. Supported Coins (20)

BTCUSDT, ETHUSDT, BNBUSDT, XRPUSDT, ADAUSDT, DOGEUSDT, LTCUSDT, BCHUSDT, ETCUSDT, TRXUSDT, XLMUSDT, XMRUSDT, NEOUSDT, EOSUSDT, DASHUSDT, ZECUSDT, IOTAUSDT, QTUMUSDT, OMGUSDT, ZRXUSDT

---

## 13. Known Limitations

- FnG (Fear & Greed Index) and social score features remain neutral — no free real-time source integrated
- Models were trained with scikit-learn 1.6.1; version warnings appear on newer versions but predictions work correctly
- SMTP ports (587, 465) are blocked on some networks — EmailJS over HTTPS is used as the workaround
- Prediction history accuracy is real-time (current price vs prediction price), not 24h-delayed outcome accuracy, until the `check-outcomes` endpoint resolves them
- Not financial advice
