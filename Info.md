# Coin-IQ Technical Documentation

Generated from the current repository state in `D:\FYPFinal` on 2026-06-03.

This document describes the code as it exists in the repository. When behavior is inferred from source code rather than a complete schema or running system, the inference is called out explicitly.

## 1. Project Overview

Coin-IQ is a full-stack cryptocurrency analytics, prediction, and learning platform. It combines:

- A Next.js 16 / React 19 application in `coin-iq/`.
- Next.js API routes for authentication, profile management, crypto data proxying, news aggregation, prediction persistence, LMS features, and admin operations.
- A Flask machine-learning API in `flask-api/`.
- Pretrained model artifacts in `Models/`.
- PostgreSQL persistence for users, admins, OTPs, LMS progress/certificates, and prediction history.

The product lets users view live cryptocurrency market data, fetch ML predictions for supported Binance USDT pairs, track prediction outcomes over time, read crypto news, complete learning courses/quizzes, earn certificates, and manage the system through an admin dashboard.

## 2. Repository Layout

```text
FYPFinal/
|-- README.md
|-- CLEANUP_LOG.md
|-- Info.md
|-- .gitignore
|-- coin-iq/
|   |-- package.json
|   |-- package-lock.json
|   |-- next.config.ts
|   |-- tsconfig.json
|   |-- eslint.config.mjs
|   |-- postcss.config.mjs
|   |-- DB_SETUP.md
|   |-- PROJECT_DOCUMENTATION.md
|   |-- public/
|   |-- src/
|       |-- app/
|       |-- components/
|       |-- hooks/
|       |-- lib/
|       |-- scripts/
|       |-- types/
|       |-- middleware.ts
|-- flask-api/
|   |-- app.py
|   |-- binance_features.py
|   |-- news_sentiment.py
|   |-- requirements.txt
|   |-- models/
|-- Models/
    |-- xgboost_70_export/
    |-- LightBGM/
    |-- Random Forest/
    |-- LSTM/
```

## 3. Architecture

```text
Browser
  |
  | Next.js App Router pages and client components
  v
coin-iq Next.js server
  |-- /api/auth/*, /api/profile, /api/admin/*, /api/learn/* -> PostgreSQL
  |-- /api/crypto*, /api/news -> Binance/RSS external APIs
  |-- /api/predictions/* -> PostgreSQL + Binance outcome prices
  |
  | next.config.ts rewrite
  v
/flask-api/:path* -> http://localhost:5000/:path*
  |
  v
Flask ML API
  |-- Loads XGBoost, LightGBM, Random Forest, LSTM artifacts from Models/
  |-- Fetches Binance klines and ticker prices
  |-- Fetches RSS news and computes VADER sentiment
  |-- Scheduler posts prediction snapshots back to Next.js
```

The architecture is split into two backend runtimes:

| Runtime | Location | Role |
|---|---|---|
| Next.js | `coin-iq/` | Web UI, server-rendered/client pages, API routes, auth, database CRUD, LMS/admin/prediction persistence. |
| Flask | `flask-api/` | ML model loading, feature engineering, live prediction, sentiment service, scheduler jobs. |

The frontend calls Flask through `/flask-api/*`. `coin-iq/next.config.ts` rewrites that path to `http://localhost:5000/*`, so local development requires Flask on port 5000 and Next.js on port 3000.

## 4. Technology Stack and Dependencies

### 4.1 Next.js Dependencies

| Dependency | Why it is used | Where it is used |
|---|---|---|
| `next` | React framework, App Router, API routes, image config, rewrites. | `src/app/*`, `src/app/api/*`, `next.config.ts`. |
| `react`, `react-dom` | UI rendering and client state. | All client pages/components. |
| `typescript` | Type safety and TSX compilation. | Whole `coin-iq/src` tree. |
| `tailwindcss`, `@tailwindcss/postcss` | Utility-first styling via Tailwind CSS 4. | `src/app/globals.css`, component class names, `postcss.config.mjs`. |
| `eslint`, `eslint-config-next` | Linting using Next.js Core Web Vitals and TypeScript rules. | `eslint.config.mjs`, `npm run lint`. |
| `babel-plugin-react-compiler` | Supports Next.js React Compiler mode. | Enabled by `reactCompiler: true` in `next.config.ts`. |
| `pg`, `@types/pg` | PostgreSQL client pool and direct SQL queries. | `src/lib/db.ts`, services, scripts, API routes. |
| `bcrypt`, `@types/bcrypt` | Password hashing and password verification. | `userService.ts`, `adminService.ts`, `init-admin.ts`. |
| `jsonwebtoken`, `@types/jsonwebtoken` | Regular user JWT creation/verification. | `src/lib/session.ts`. |
| `jose` | Admin JWT signing/verification with Web Crypto-compatible APIs. | `src/lib/adminSession.ts`. |
| `axios` | HTTP client for some Binance calls. | `src/lib/cryptoService.ts`. |
| `xml2js`, `@types/xml2js` | RSS XML parsing for the Next.js news API. | `src/app/api/news/route.ts`. |
| `framer-motion` | Motion components and animations. | `src/components/providers.tsx`, many UI pages/components. |
| `lucide-react` | Icon library. | Navbar, admin dashboard, dashboard, legal pages, auth pages, charts. |
| `react-hot-toast` | Toast notifications. | `src/components/providers.tsx`. |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Class composition utilities. | `src/lib/utils.ts`, UI component styling patterns. |
| `ts-node` | Runs TypeScript maintenance scripts. | `npm run db:create`, `npm run db:migrate`, `npm run admin:init`. |

### 4.2 Flask/Python Dependencies

| Dependency | Why it is used | Where it is used |
|---|---|---|
| `flask` | Python API server. | `flask-api/app.py`. |
| `flask-cors` | Allows cross-origin requests. | `CORS(app)` in `app.py`. |
| `flask-mail` | Sends password emails from Flask endpoint. | `/send-password-email` in `app.py`. |
| `python-dotenv` | Loads `.env` for Flask runtime. | Startup section in `app.py`. |
| `psycopg2-binary` | Direct PostgreSQL access from Flask scheduler locker. | `_get_db_conn()` in `app.py`. |
| `requests` | HTTP calls to Binance, RSS, and Next.js endpoints. | `app.py`, `binance_features.py`, `news_sentiment.py`. |
| `numpy`, `pandas` | Feature engineering and model input shaping. | `binance_features.py`, model predictor classes. |
| `scikit-learn` | Compatibility for saved scalers/models. | LightGBM/RF/LSTM scalers via `joblib`. |
| `lightgbm` | LightGBM model compatibility. | `models/lgbm_model.py` artifacts. |
| `xgboost` | Loads per-coin XGBoost JSON boosters. | `models/xgboost_model.py`. |
| `tensorflow` | Loads Keras LSTM model. | `models/lstm_model.py`. |
| `joblib` | Loads pickled models, scalers, metadata, feature lists. | LightGBM, RF, LSTM predictors. |
| `vaderSentiment` | Computes sentiment scores from RSS articles. | `news_sentiment.py`. |
| `apscheduler` | Background jobs for saving predictions and locking snapshots. | `app.py`. |

## 5. Frontend Implementation

The frontend uses the Next.js App Router under `coin-iq/src/app`. Most application pages are client components because they rely on local state, effects, browser fetches, and interactive controls.

### 5.1 Root Application Files

| File | Purpose and behavior |
|---|---|
| `src/app/layout.tsx` | Root layout. Loads Geist fonts through `next/font/google`, imports `globals.css`, sets app metadata, and wraps all pages in `Providers`. |
| `src/app/globals.css` | Tailwind CSS import, theme variables, black/white base styling, reusable `.card`, `.btn-primary`, `.btn-secondary`, animation utilities, and grid background utility. |
| `src/components/providers.tsx` | Client provider wrapper. Adds a configured `react-hot-toast` `Toaster` and re-exports `motion` and `AnimatePresence` from Framer Motion. |
| `src/middleware.ts` | Route guard middleware. Protects `/dashboard`, `/profile`, `/settings`, and `/learn` with `auth_token`; protects `/admin` except `/admin/login` with `admin_auth_token`; redirects unauthenticated users to login/admin login. |

### 5.2 Page Routes

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page with auth awareness, live prediction cards, feature sections, ticker, and gated calls-to-action. Calls `/api/auth/me` and `/flask-api/live/predict/:coin`. |
| `/about` | `src/app/about/page.tsx` | Static product/team/tech/process page explaining model pipeline and platform value. |
| `/coins` | `src/app/coins/page.tsx` | Market table using `useTopCryptos`; supports search, sorting, pagination, and `CryptoDetailsModal`. |
| `/markets` | `src/app/markets/page.tsx` | Market card grid over crypto data; opens detail modal. |
| `/chart/[symbol]` | `src/app/chart/[symbol]/page.tsx` | Client chart page for a selected symbol with local time-range state. |
| `/news` | `src/app/news/page.tsx` | RSS-backed news UI. Fetches `/api/news?page=N`, displays featured/secondary/list cards, pagination, and article modal. |
| `/predictions` | `src/app/predictions/page.tsx` | Auth-gated prediction page. Checks `/api/auth/me`; unauthenticated users see inline login/signup. Authenticated content renders `PredictionDashboard`. |
| `/analytics` | `src/app/analytics/page.tsx` | Auth-gated analytics page. Fetches Binance 24h data, Binance 7-day klines, and `/flask-api/sentiment`. Provides overview, coins, and sentiment tabs. |
| `/dashboard` | `src/app/dashboard/page.tsx` | Auth-protected dashboard. Fetches user profile, crypto data, Flask predictions, saves predictions to `/api/predictions/save`, shows live/history tabs, daily records, LMS widget, and scheduler controls. |
| `/learn` | `src/app/learn/page.tsx` | Auth-protected learning hub. Fetches `/api/learn/courses`, displays course cards and progress. |
| `/learn/[slug]` | `src/app/learn/[slug]/page.tsx` | Course lesson viewer. Fetches course/lessons/progress and posts completed lessons to `/api/learn/progress`. |
| `/learn/[slug]/quiz` | `src/app/learn/[slug]/quiz/page.tsx` | Quiz UI. Fetches course quiz data and posts answers to `/api/learn/quiz`. |
| `/learn/certificate/[id]` | `src/app/learn/certificate/[id]/page.tsx` | Public certificate display. Fetches `/api/learn/certificate/:id`. |
| `/login` | `src/app/login/page.tsx` | Login form. Posts to `/api/auth/login`; redirects based on response (`/dashboard` or `/admin`). |
| `/signup` | `src/app/signup/page.tsx` | Two-step signup. Sends OTP with `/api/auth/otp/send`; verifies and creates account with `/api/auth/otp/verify-signup`. |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Requests autogenerated password email through `/api/auth/forgot-password`. |
| `/reset-password` | `src/app/reset-password/page.tsx` | Legacy reset UI that posts to `/api/auth/reset-password`. This is currently impacted by missing `passwordResetService.ts`. |
| `/reset-password/[token]` | `src/app/reset-password/[token]/page.tsx` | Legacy token reset UI. Validates token through `/api/auth/reset-password/validate`; currently impacted by missing `passwordResetService.ts`. |
| `/profile/edit` | `src/app/profile/edit/page.tsx` | Profile edit page using `/api/profile`. The navbar/dashboard also use the modal version. |
| `/admin/login` | `src/app/admin/login/page.tsx` | Admin login. Posts to `/api/admin/auth/login`. |
| `/admin` | `src/app/admin/page.tsx` | Admin dashboard with overview, users, LMS, certificates, and settings sections. Calls many `/api/admin/*` routes. |
| `/legal/*` | `src/app/legal/*` | Static legal pages: privacy, terms, cookies, disclaimer, with shared legal layout navigation. |

### 5.3 Shared Components

| Component | Purpose and interactions |
|---|---|
| `navbar.tsx` | Top navigation. Checks `/api/auth/me`, shows auth/user menu state, calls `/api/auth/logout`, opens `EditProfileModal`. |
| `footer.tsx` | Shared footer links and social placeholders. |
| `CryptoTicker.tsx` | Client ticker. Fetches `/api/crypto?limit=20`, formats coin rows, handles image fallbacks. |
| `CryptoDetailsModal.tsx` | Modal for selected coin details. Client-only mounting avoids hydration issues. |
| `edit-profile-modal.tsx` | Portal-based profile modal. Fetches `/api/profile`, updates name/email/password via `PUT /api/profile`, manages image preview locally. |
| `AuthModal.tsx` | Generic auth-required modal used by gated landing actions. |
| `prediction-dashboard.tsx` | Core prediction interface. Uses `useSupportedCoins` and `usePrediction`, renders coin selector, model cards, market indicators, candlestick/line/risk visualizations. |
| `prediction-preview.tsx` | Preview-style prediction cards used for marketing/landing context. |
| `InfiniteTestimonials.tsx` | Animated testimonial rows. |
| `charts/candlestick-chart.tsx` | Canvas/SVG-style candlestick visualization for generated chart data. |
| `charts/line-chart.tsx` | Interactive line chart with hover point state. |
| `charts/risk-assessment.tsx` | Visual risk summary for prediction confidence/risk. |
| `ui/button.tsx` | Reusable button with variants/sizes/loading/fullWidth props. |
| `ui/card.tsx` | Card, header, title, content, description, footer primitives; can animate on view. |
| `ui/badge.tsx` | Badge primitive with variants. |
| `ui/input.tsx` | Input primitive with label, error, left/right icons. |
| `ui/label.tsx` | Label primitive. |
| `ui/AnimatedStatCard.tsx` | Animated metric card using Framer Motion. |
| `ui/icons/CryptoIcon.tsx` | Local icon component for crypto-themed visuals. |

### 5.4 Frontend State Management

There is no Redux/Zustand/global store. State is managed with:

- `useState` for form fields, tabs, filters, selected records, loading/error state.
- `useEffect` for initial and repeated data fetching.
- `useCallback` for reusable fetch/refresh handlers.
- Custom hooks:
  - `useTopCryptos(limit)` fetches `/api/crypto?limit=...`, normalizes data to `CryptoData`, refreshes every 5 minutes.
  - `useCryptoDetails(id)` fetches `/api/crypto/:id`.
  - `useCryptoHistory(id, days)` fetches `/api/crypto/history/:id`.
  - `usePrediction(coin)` fetches `/flask-api/live/predict/:coin`.
  - `useSupportedCoins()` fetches `/flask-api/live/coins`.

Authentication state is cookie-backed on the server, but client pages infer it by calling `/api/auth/me` or `/api/admin/auth/me`.

## 6. Backend: Next.js API Routes

### 6.1 Authentication and Profile

| Endpoint | Method | File | Behavior |
|---|---|---|---|
| `/api/auth/login` | POST | `auth/login/route.ts` | Validates email/password. Checks `admins` first, then `users`. Admin login sets both `auth_token` and `admin_auth_token`; user login sets `auth_token`. |
| `/api/auth/signup` | POST | `auth/signup/route.ts` | Legacy direct signup. Validates fields, checks duplicate email, hashes password, creates user, sets `auth_token`. The current signup page uses OTP routes instead. |
| `/api/auth/otp/send` | POST | `auth/otp/send/route.ts` | Generates 6-digit OTP, invalidates previous unverified OTPs, inserts into `otp_verifications`, sends EmailJS message. Logs OTP if EmailJS fails. |
| `/api/auth/otp/verify-signup` | POST | `auth/otp/verify-signup/route.ts` | Validates latest unverified OTP, enforces expiry/max attempts/lockout, creates user, sets `auth_token`. |
| `/api/auth/me` | GET | `auth/me/route.ts` | Reads `auth_token`, verifies JWT, returns token payload without password hash. |
| `/api/auth/logout` | POST | `auth/logout/route.ts` | Clears `auth_token`. |
| `/api/auth/forgot-password` | POST | `auth/forgot-password/route.ts` | Generates a random 16-character password, hashes and saves it, sends it through EmailJS. Always returns a generic success message for unknown email privacy. |
| `/api/auth/reset-password` | POST | `auth/reset-password/route.ts` | Legacy token reset route. Imports missing `@/lib/passwordResetService`, so it will fail to compile/run until that service is restored or route is removed. |
| `/api/auth/reset-password/validate` | GET | `auth/reset-password/validate/route.ts` | Legacy token validation route. Also imports missing `@/lib/passwordResetService`. |
| `/api/profile` | GET | `profile/route.ts` | Reads `auth_token`, verifies user, returns profile fields. |
| `/api/profile` | PUT | `profile/route.ts` | Updates name/email/password using `updateUserProfile`; hashes new password when supplied. |

### 6.2 Admin API

| Endpoint | Method | Behavior |
|---|---|---|
| `/api/admin/auth/login` | POST | Admin-only login against `admins`; sets `admin_auth_token`. |
| `/api/admin/auth/me` | GET | Verifies `admin_auth_token` with `jose`; returns admin payload. |
| `/api/admin/auth/logout` | POST | Clears `admin_auth_token`. |
| `/api/admin/data/analytics` | GET | Admin auth required. Aggregates counts for users/admins/LMS progress/certificates/courses, daily signups, top courses, monthly growth, recent users. |
| `/api/admin/data/users` | GET | Admin auth required. Paginates/searches users, joins completed course count, tags users as admins by email. |
| `/api/admin/data/users` | DELETE | Deletes user by `userId`. Cascades where FKs are defined. |
| `/api/admin/data/logs` | GET | Builds activity logs from user registration, certificates, and completed LMS progress; falls back to registration logs if LMS tables are absent. |
| `/api/admin/users/promote` | POST | Copies an existing user into `admins` with same password hash and supplied role. |
| `/api/admin/users/demote` | POST | Deletes admin record by email. Blocks default `admin@coiniq.com` and self-demotion. |
| `/api/admin/lms/courses` | GET | Lists courses with lesson/quiz counts and enrollment/completion/pass stats. |
| `/api/admin/lms/courses` | POST | Creates a course. Expects `lms_courses` columns `icon` and `quiz_count`, which are not present in current `lms-schema.sql`. |
| `/api/admin/lms/courses/[slug]` | GET/PUT/DELETE | Reads, updates, or deletes a course plus related lessons/quiz. DELETE assumes cascade behavior for course-linked tables. |
| `/api/admin/lms/lessons` | POST/PUT/DELETE | Creates, updates, deletes lessons and updates `lms_courses.lesson_count`. |
| `/api/admin/lms/quiz` | POST/PUT/DELETE | Creates, updates, deletes quiz questions and updates `lms_courses.quiz_count`. |
| `/api/admin/lms/progress` | GET | Lists recent LMS progress joined with user data. |
| `/api/admin/lms/certificates` | GET | Lists certificates joined with user data. |
| `/api/admin/lms/certificates` | DELETE | Deletes certificate by `certificateId`; intended to reset matching progress, but currently deletes the row before using it in reset subqueries, so the reset query cannot locate the deleted certificate. |

### 6.3 Crypto and News API

| Endpoint | Method | Behavior |
|---|---|---|
| `/api/crypto?limit=N` | GET | Calls `getTopCryptos(limit)`, which fetches Binance `/ticker/24hr`, filters USDT pairs, normalizes to CoinGecko-like shape, and caches for 5 minutes through response headers. |
| `/api/crypto/[id]` | GET | Calls `getCryptoDetails(id)` using Binance `/ticker/24hr?symbol=...`. Falls back to mock details on errors/rate limits. |
| `/api/crypto/history/[id]?days=N` | GET | Calls Binance `/klines`, maps to `{ prices, market_caps, total_volumes }`, falls back to generated mock history. |
| `/api/news?page=N` | GET | Fetches CoinDesk, CoinTelegraph, and Decrypt RSS feeds in parallel, parses XML with `xml2js`, extracts image/body/date/source fields, sorts by publication date, paginates 10 per page, caches 5 minutes. |

### 6.4 Prediction Persistence API

| Endpoint | Method | Behavior |
|---|---|---|
| `/api/predictions/save` | POST | Inserts a row into `prediction_history`, then creates pending rows in `interval_snapshots` for intervals from 10 minutes to 30 days. |
| `/api/predictions/history` | GET | Returns latest prediction per coin in a time window, enriches with current Binance price, computes current correctness and 7-day resolved accuracy. |
| `/api/predictions/check-outcomes` | GET | Finds predictions 23-25 hours old without outcome, fetches Binance current price, updates `prediction_history` outcome fields. |
| `/api/predictions/daily` | GET | With `dates=true`, returns prediction dates. With `date=YYYY-MM-DD`, groups interval snapshots for that day, returns locked/pending accuracy per interval and coin summary. |
| `/api/predictions/daily` | DELETE | Truncates `interval_snapshots` and `prediction_history`. |
| `/api/predictions/lock-intervals` | GET | Locks elapsed pending interval snapshots by fetching current Binance price and setting outcome/actual direction/correctness. |

Important schema note: `interval_snapshots` is used extensively by prediction routes, but no current SQL file creates it. The table shape is inferred in the Database section.

### 6.5 LMS User API

| Endpoint | Method | Behavior |
|---|---|---|
| `/api/learn/courses` | GET | Calls `syncLmsToDb()` once per server process, reads all DB courses, joins lesson/quiz counts, includes current user progress when logged in. |
| `/api/learn/courses/[slug]` | GET | Reads course metadata, lessons, quiz questions, and current user's progress. |
| `/api/learn/progress` | POST | Auth required. Upserts completed lesson index into `lms_user_progress.completed_lessons`. Currently validates course existence through `getCourse()` from hardcoded `lmsData.ts`, so admin-created courses not present in `COURSES` may be rejected here. |
| `/api/learn/progress` | GET | Auth required. Returns all progress rows for the current user. |
| `/api/learn/quiz` | POST | Auth required. Loads quiz questions from DB, grades server-side, upserts quiz progress, creates certificate when score >= `PASSING_SCORE`. |
| `/api/learn/certificate/[id]` | GET | Public certificate lookup by certificate id, joins user name, uses hardcoded `getCourse()` for course title/level fallback. |

## 7. Flask ML API

### 7.1 Core Files

| File | Purpose |
|---|---|
| `flask-api/app.py` | Flask app, model initialization, prediction endpoints, email endpoint, APScheduler jobs, scheduler control routes, interval locking job. |
| `flask-api/binance_features.py` | Fetches Binance klines and computes all technical/sentiment/model features. |
| `flask-api/news_sentiment.py` | Fetches RSS feeds, scores articles with VADER, maps sentiment to supported coins with keyword matching, caches scores for 5 minutes. |
| `flask-api/models/xgboost_model.py` | Loads one XGBoost booster per supported coin from JSON artifacts and applies per-coin thresholds. |
| `flask-api/models/lgbm_model.py` | Loads universal LightGBM model/scaler/feature list from pickles and predicts probability. |
| `flask-api/models/rf_model.py` | Loads universal Random Forest model/scaler/feature list and predicts probability. |
| `flask-api/models/lstm_model.py` | Loads Keras LSTM model, scaler, metadata, validates 24-step sequences, predicts probability. |

### 7.2 Flask Endpoints

| Endpoint | Method | Behavior |
|---|---|---|
| `/` | GET | Returns API metadata and endpoint list. |
| `/health` | GET | Returns readiness for XGBoost, LightGBM, Random Forest, and LSTM predictors. |
| `/models` | GET | Returns model descriptions, supported coins, feature lists/counts, LSTM sequence length. |
| `/predict/xgboost` | POST | Manual prediction with `{ coin, features }`. |
| `/predict/lgbm` | POST | Manual LightGBM prediction with `{ features }`. |
| `/predict/rf` | POST | Manual Random Forest prediction with `{ features }`. |
| `/predict/lstm` | POST | Manual LSTM prediction with `{ sequence }`, exactly 24 timesteps. |
| `/predict/all` | POST | Runs available manual inputs across all models, averages probabilities into ensemble. |
| `/live/coins` | GET | Returns supported coin symbols from `COIN_LABEL`. |
| `/live/predict/<coin>` | GET | Fetches Binance 1h klines, builds features, runs selected models (`?models=xgboost,lgbm,rf,lstm` default all), returns market indicators, sentiment, model results, and ensemble. |
| `/live/predict/all-coins` | GET | Runs live predictions for all supported coins. Defaults to XGBoost only for speed unless `models` query specifies more. |
| `/sentiment` | GET | Returns sentiment for all coins or one coin via `?coin=BTCUSDT`. |
| `/send-password-email` | POST | Sends a new password email through Flask-Mail. The current Next.js forgot-password route uses EmailJS directly, so this endpoint appears available but not the main path. |
| `/scheduler/status` | GET | Returns whether the save prediction scheduler job exists and scheduler is running. |
| `/scheduler/start` | POST | Adds the prediction-saving job if missing. |
| `/scheduler/stop` | POST | Removes the prediction-saving job. |

### 7.3 Feature Engineering

`binance_features.py` builds model input in these steps:

1. `fetch_klines(symbol, interval='1h', limit=200)` calls Binance `/klines`, converts numeric fields, sorts by `open_time`.
2. `add_indicators(df)` computes technical indicators and derived features:
   - EMA 9/21, MACD/signal/histogram.
   - Bollinger upper/lower/%B/width/squeeze/breakout.
   - RSI 14 and RSI flags.
   - Stochastic K/D and crossings.
   - ROC, ATR, OBV.
   - Taker buy ratio, high-low spread, buy pressure.
   - Time features: hour, day of week, weekend, Monday, Friday, month, quarter.
   - Close lags, returns, return lags, direction lags.
   - Rolling win rates, moving-average flags, volatility windows.
   - Volume ratios, z-scores, EMA/MACD interaction fields.
   - Candle/body/wick patterns and target lag proxies.
3. `add_sentiment(df, coin_label, symbol)` calls `get_sentiment(symbol)`, sets VADER/FinBERT-compatible sentiment fields, neutral Fear & Greed/social placeholders, and interaction/confluence features.
4. `build_features_for_coin(symbol)` drops rows missing key rolling indicators, returns:
   - `features`: latest row for XGB/LGBM/RF.
   - `sequence`: last 24 rows for LSTM.
   - market values (`close_price`, `rsi`, `macd`, `bb_pct_b`).
   - current sentiment metadata.

### 7.4 Model Behavior

| Model | Artifact location | Input | Decision threshold |
|---|---|---|---|
| XGBoost | `Models/xgboost_70_export/*_xgboost.json` | One row with booster feature names | Per-coin threshold from `THRESHOLDS`. |
| LightGBM | `Models/LightBGM/lgbm_crypto_model.pkl`, scaler, feature columns | One row with 45 feature columns | `0.5`. |
| Random Forest | `Models/Random Forest/rf_crypto_model.pkl`, scaler, feature columns | One row with 28 feature columns | `0.5`. |
| LSTM | `Models/LSTM/lstm_crypto_model.keras`, scaler, metadata | 24 timesteps x metadata feature count | `0.5`. |

Ensemble probability is the average of all successful model probabilities. Direction is `UP` when probability is at least `0.5`; otherwise `DOWN`. Confidence is `abs(probability - 0.5) * 2 * 100`.

### 7.5 Flask Scheduler Jobs

`app.py` starts APScheduler at import/startup:

- Job `save_predictions`: runs immediately, then every minute. For each supported coin, it builds features, runs all four models, computes ensemble, and posts to `NEXT_PUBLIC_BASE_URL/api/predictions/save`. It then calls `/api/predictions/check-outcomes`.
- Job `lock_intervals`: runs immediately, then every minute. It attempts to create/update rows in `prediction_interval_snapshots`. This is separate from the Next.js `interval_snapshots` table and is not defined in the current SQL files.

Inference: The project currently has two interval snapshot concepts:

- Next.js prediction routes use `interval_snapshots`.
- Flask `_lock_interval_snapshots()` uses `prediction_interval_snapshots`.

No current schema creates either table, so prediction interval history requires an additional migration before it can work reliably.

## 8. Database Design

PostgreSQL is used through `pg` in Next.js and `psycopg2` in Flask.

### 8.1 Connection Configuration

`src/lib/db.ts` creates a `Pool` with:

| Env var | Default |
|---|---|
| `DB_USER` | `postgres` |
| `DB_HOST` | `localhost` |
| `DB_NAME` | `coin_iq` |
| `DB_PASSWORD` | `123` |
| `DB_PORT` | `5432` |

Pool settings:

- `max: 20`
- `idleTimeoutMillis: 30000`
- `connectionTimeoutMillis: 2000`

### 8.2 Tables Defined in Current SQL Files

#### `users`

Defined in `src/lib/schema.sql`.

| Column | Type | Constraint |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `name` | `VARCHAR(255)` | Not null |
| `email` | `VARCHAR(255)` | Unique, not null |
| `password_hash` | `TEXT` | Not null |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default current timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | Default current timestamp, trigger-updated |

Indexes: `idx_users_email`.

Used by user auth, profile, admin listing, LMS progress/cert joins.

#### `admins`

Defined in `src/lib/schema.sql`.

| Column | Type | Constraint |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `name` | `VARCHAR(255)` | Not null |
| `email` | `VARCHAR(255)` | Unique, not null |
| `password_hash` | `TEXT` | Not null |
| `role` | `VARCHAR(50)` | Default `admin` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default current timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | Default current timestamp, trigger-updated |

Indexes: `idx_admins_email`.

Used by admin login, combined login, promotion/demotion, analytics.

#### `oauth_providers`

Defined in `src/lib/schema.sql`, but OAuth route files were removed according to cleanup log.

Columns: `id`, `provider`, `provider_user_id`, `user_id`, `email`, `created_at`, `updated_at`.

Constraints/indexes:

- `user_id` references `users(id)` on delete cascade.
- `UNIQUE(provider, provider_user_id)`.
- `idx_oauth_providers_user_id`.
- `idx_oauth_providers_provider_and_id`.

Current use: no active route imports it; likely legacy/stale.

#### `password_reset_tokens`

Defined in `src/lib/schema.sql`.

Columns: `id`, `user_id`, `token`, `expires_at`, `used`, `created_at`.

Current use: legacy reset routes intend to use it, but their service file is missing.

#### `otp_verifications`

Defined in `src/lib/schema.sql`.

Columns: `id`, `email`, `otp_code`, `expires_at`, `verified`, `created_at`, `attempts`, `locked_until`.

Used by `/api/auth/otp/send` and `/api/auth/otp/verify-signup`.

#### `lms_courses`

Defined in `src/lib/lms-schema.sql`, but current LMS code expects additional columns.

Defined columns:

- `id`, `slug`, `title`, `description`, `level`, `duration_minutes`, `lesson_count`, `created_at`.

Expected by code but not present in `lms-schema.sql`:

- `quiz_count`
- `icon`
- `color`
- `updated_at`

Inference: These extra columns must have existed in an earlier/missing migration or need a new migration. `lmsDbSync.ts` and admin LMS routes will fail against only the checked-in `lms-schema.sql`.

#### `lms_user_progress`

Defined in `src/lib/lms-schema.sql`.

Columns: `id`, `user_id`, `course_slug`, `lesson_index`, `completed_lessons`, `quiz_score`, `quiz_passed`, `completed`, `started_at`, `completed_at`.

Constraints/indexes:

- `user_id` references `users(id)` on delete cascade.
- `UNIQUE(user_id, course_slug)`.
- `idx_lms_progress_user`.
- `idx_lms_progress_course`.

Used by LMS course progress, dashboard widget, admin analytics/progress/logs.

#### `lms_certificates`

Defined in `src/lib/lms-schema.sql`.

Columns: `id`, `user_id`, `course_slug`, `certificate_id`, `issued_at`.

Constraints/indexes:

- `user_id` references `users(id)` on delete cascade.
- `certificate_id` unique.
- `UNIQUE(user_id, course_slug)`.
- `idx_lms_certs_user`.
- `idx_lms_certs_id`.

Used by quiz passing flow, certificate page, admin certificate management.

#### `prediction_history`

Defined in `src/lib/predictions-schema.sql`.

Stores one raw prediction event per coin.

Key columns:

- `coin`, `predicted_at`, `price_at_prediction`.
- Ensemble: `ensemble_direction`, `ensemble_probability`, `ensemble_confidence`.
- Per-model: `xgb_*`, `lgbm_*`, `rf_*`, `lstm_*`.
- Technical snapshot: `rsi`, `macd`, `bb_pct_b`.
- Outcome: `outcome_price`, `outcome_direction`, `outcome_checked_at`, `was_correct`.

Indexes:

- `idx_pred_coin`
- `idx_pred_predicted_at`
- `idx_pred_coin_time`

Important setup note: `predictions-schema.sql` exists, but no checked-in npm script currently runs it. `db:create` and `db:migrate` execute only `schema.sql`; `init-lms.ts` executes only `lms-schema.sql`.

### 8.3 Tables Used by Code but Missing from SQL

#### `lms_lessons`

Expected by `lmsDbSync.ts`, `/api/learn/courses/[slug]`, and admin lesson routes.

Inferred columns:

| Column | Inferred from |
|---|---|
| `id` | Admin lesson update/delete by id. |
| `course_slug` | Queries and inserts. |
| `lesson_index` | Ordering and unique per course. |
| `title` | Lesson metadata. |
| `content` | Lesson body. |
| `duration_minutes` | Lesson duration. |

Expected constraints:

- Likely `UNIQUE(course_slug, lesson_index)`, because `lmsDbSync.ts` uses `ON CONFLICT (course_slug, lesson_index)`.
- Should reference `lms_courses(slug)` with cascade delete for admin course delete assumptions.

#### `lms_quiz_questions`

Expected by `lmsDbSync.ts`, quiz API, and admin quiz routes.

Inferred columns:

| Column | Inferred from |
|---|---|
| `id` | Quiz answers use question id; admin update/delete by id. |
| `course_slug` | Queries and inserts. |
| `question_order` | Ordering and upsert conflict. |
| `question` | Question text. |
| `options` | JSON/JSONB options. |
| `correct_index` | Correct option index. |
| `explanation` | Explanation returned after grading. |

Expected constraints:

- Likely `UNIQUE(course_slug, question_order)`, because `lmsDbSync.ts` uses `ON CONFLICT (course_slug, question_order)`.
- Should reference `lms_courses(slug)` with cascade delete.

#### `interval_snapshots`

Used by Next.js prediction routes. Inferred columns:

| Column | Inferred from |
|---|---|
| `id` | `lock-intervals` selects/updates by id. |
| `session_id` | Created by `/api/predictions/save`; conflict key. |
| `interval_minutes` | Interval grouping and lock timing. |
| `coin` | Coin symbol. |
| `predicted_at` | Prediction timestamp. |
| `price_at_prediction` | Price at prediction time. |
| `ensemble_direction` | Prediction direction. |
| `ensemble_probability` | Prediction probability. |
| `outcome_price` | Price at lock time. |
| `actual_direction` | Actual direction at lock time. |
| `was_correct` | Whether prediction matched actual direction. |
| `locked_at` | Snapshot lock timestamp. |

Expected constraint:

- `UNIQUE(session_id, interval_minutes, coin)`, because save route uses `ON CONFLICT (session_id, interval_minutes, coin) DO NOTHING`.

#### `prediction_interval_snapshots`

Used only by Flask `_lock_interval_snapshots()`. Inferred columns:

- `coin`, `interval_minutes`, `session_start`, `predicted_at`, `price_at_prediction`, `ensemble_direction`, `ensemble_probability`, `xgb_direction`, `lgbm_direction`, `rf_direction`, `lstm_direction`, `outcome_price`, `actual_direction`, `was_correct`, `locked_at`.

Expected constraint:

- `UNIQUE(coin, interval_minutes, session_start)`, because Flask uses that conflict target.

## 9. Authentication and Authorization Flow

### 9.1 User Auth

1. User posts credentials to `/api/auth/login`, or completes OTP signup through `/api/auth/otp/verify-signup`.
2. User password is checked with bcrypt against `users.password_hash`.
3. `createToken(user)` in `src/lib/session.ts` signs a JWT using `jsonwebtoken` and `JWT_SECRET`.
4. Response sets `auth_token` cookie:
   - `HttpOnly`
   - `SameSite=Strict`
   - `Path=/`
   - `Max-Age=7 days`
   - `Secure` only in production
5. API routes and client auth checks verify this token with `verifyToken`.

### 9.2 Admin Auth

1. Admin can log in through `/api/admin/auth/login` or through combined `/api/auth/login`.
2. Admin password is checked against `admins.password_hash`.
3. `createAdminToken(admin)` in `src/lib/adminSession.ts` signs an HS256 JWT with `jose` and `isAdmin: true`.
4. Response sets `admin_auth_token`.
5. Admin routes verify the cookie with `getCurrentAdminFromCookieAsync`.
6. Middleware uses `getCurrentAdminFromCookie()` for synchronous payload decoding. This only decodes and checks `isAdmin`; it does not cryptographically verify the token in middleware. API routes do verify it.

### 9.3 Route Guards

`src/middleware.ts` protects:

- User paths: `/dashboard`, `/profile`, `/settings`, `/learn`.
- Admin paths: `/admin`, except `/admin/login`.

The middleware excludes `/api`, static assets, image optimizer files, and favicon.

## 10. Routing and Navigation Flow

Main navigation is defined in `navbar.tsx`. Pages use Next.js file-system routing:

- Public marketing/market routes: `/`, `/about`, `/coins`, `/markets`, `/news`, legal pages.
- Auth-required routes by middleware: `/dashboard`, `/learn`, `/profile`.
- Auth-gated-in-page routes: `/predictions` and `/analytics` show login/signup gate while keeping blurred/limited content.
- Admin route: `/admin` requires admin middleware; `/admin/login` is public.

Admin dashboard navigation is internal state, not nested routes. `AdminDashboard` uses a `section` state with values like `overview`, `users`, `lms`, `certificates`, and `settings`.

Dashboard history/live view is also local state (`activeTab`) rather than separate routes.

## 11. External Services and Integrations

| Service | Used for | Code |
|---|---|---|
| Binance REST API | Live ticker data, klines, prediction feature data, outcome prices. | `coingecko-api.ts`, `cryptoService.ts`, prediction routes, `binance_features.py`, Flask scheduler. |
| CoinDesk RSS | News page and sentiment analysis. | `api/news/route.ts`, `news_sentiment.py`. |
| CoinTelegraph RSS | News page and sentiment analysis. | `api/news/route.ts`, `news_sentiment.py`. |
| Decrypt RSS | News page and sentiment analysis. | `api/news/route.ts`, `news_sentiment.py`. |
| EmailJS REST API | OTP and autogenerated password emails from Next.js. | `auth/otp/send/route.ts`, `auth/forgot-password/route.ts`. |
| Flask-Mail SMTP | Alternative password email endpoint in Flask. | `/send-password-email` in `app.py`. |
| CoinGecko image CDN | Coin images through static URL map. | `coinImages.ts`, `next.config.ts` image domains. |

## 12. Environment Variables and Configuration

Environment files are intentionally ignored by Git (`.env`, `.env.*`, except `.env.example`). A `.env.local` exists under `coin-iq/` but was not read for this documentation to avoid exposing secrets.

### 12.1 Next.js Variables

| Variable | Used by | Purpose |
|---|---|---|
| `DB_USER` | `db.ts`, scripts | PostgreSQL username. |
| `DB_HOST` | `db.ts`, scripts | PostgreSQL host. |
| `DB_NAME` | `db.ts`, scripts | Database name. |
| `DB_PASSWORD` | `db.ts`, scripts | PostgreSQL password. |
| `DB_PORT` | `db.ts`, scripts | PostgreSQL port. |
| `JWT_SECRET` | `session.ts`, `adminSession.ts` | Signs/verifies user and admin JWTs. |
| `NEXT_PUBLIC_BASE_URL` | prediction routes, Flask scheduler target | Base URL for self-calls and Flask posting back to Next.js. |
| `EMAILJS_PRIVATE_KEY` | OTP and forgot-password routes | EmailJS access token/private key. |
| `EMAILJS_OTP_TEMPLATE_ID` | OTP send route | Optional EmailJS OTP template override. |
| `NODE_ENV` | cookie helpers | Adds `Secure` to cookies in production. |

### 12.2 Flask Variables

| Variable | Used by | Purpose |
|---|---|---|
| `MAIL_SERVER` | `app.py` | SMTP host for Flask-Mail endpoint. |
| `MAIL_PORT` | `app.py` | SMTP port. |
| `MAIL_USE_TLS` | `app.py` | TLS flag. |
| `MAIL_USERNAME` | `app.py` | SMTP username. |
| `MAIL_PASSWORD` | `app.py` | SMTP password. |
| `MAIL_DEFAULT_SENDER` | `app.py` | Sender address. |
| `NEXT_PUBLIC_BASE_URL` | `app.py` | Next.js base URL for scheduler POST/GET callbacks. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `app.py` | PostgreSQL connection for Flask interval locker. |

### 12.3 Next.js Config

`next.config.ts`:

- Enables React Compiler: `reactCompiler: true`.
- Allows remote images from CoinGecko, placeholder images, CoinTelegraph, CoinDesk, and Decrypt hosts.
- Rewrites `/flask-api/:path*` to `http://localhost:5000/:path*`.

## 13. Build, Setup, and Deployment Workflow

### 13.1 Frontend Scripts

From `coin-iq/`:

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Run local Next.js dev server. |
| `build` | `next build` | Production build. |
| `start` | `next start` | Run built production app. |
| `lint` | `eslint` | Run lint checks. |
| `db:create` | `ts-node ./src/scripts/init-db.ts` | Create database if needed and execute `schema.sql`. |
| `db:migrate` | `ts-node ./src/scripts/migrate.ts` | Execute `schema.sql` against existing database. |
| `admin:init` | `ts-node ./src/scripts/init-admin.ts` | Create default admin if missing. |

### 13.2 Database Setup

Current scripts do not fully initialize every table used by the app. A complete setup must include:

1. Run `npm run db:create` or `npm run db:migrate` for `users`, `admins`, OTP, OAuth, password reset tables.
2. Run `ts-node ./src/scripts/init-lms.ts` manually if LMS base tables are needed. There is no package script for it.
3. Execute `predictions-schema.sql` manually for `prediction_history`; no package script currently runs it.
4. Add/execute missing migrations for `lms_lessons`, `lms_quiz_questions`, extra `lms_courses` columns, `interval_snapshots`, and possibly `prediction_interval_snapshots`.

### 13.3 Flask Setup

From `flask-api/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The Flask API starts on port 5000, loads all model artifacts from `../Models`, starts scheduler jobs, and serves prediction endpoints.

### 13.4 Production Notes

- Run Next.js and Flask as separate processes/services.
- Update `next.config.ts` rewrite destination for deployed Flask host if it is not local.
- Set strong `JWT_SECRET` and real DB credentials.
- Ensure all missing/inferred database tables are migrated.
- Configure EmailJS private key or Flask SMTP credentials depending on email path.
- Use HTTPS so `Secure` cookies are effective in production.

## 14. Error Handling Strategy

Patterns used across the codebase:

- API routes wrap most logic in `try/catch`, log server-side errors, and return JSON errors with HTTP status codes.
- Auth routes validate required fields and email/password shape before DB work.
- DB services catch PostgreSQL unique violation code `23505` and convert it into human-readable errors.
- Crypto data services fall back to mock/generated data on Binance timeout/rate-limit/network errors.
- Flask model predictors catch exceptions and return `{ "error": "..." }` instead of throwing through Flask.
- News routes silently drop failed RSS feeds and return remaining articles.
- EmailJS OTP route logs errors and still returns success because the OTP was inserted into the database; this is useful in development but may hide email delivery failures in production.

## 15. Security Considerations

Implemented:

- Passwords are hashed with bcrypt.
- Auth cookies are HttpOnly and SameSite Strict.
- Cookies become Secure in production.
- SQL queries use parameterized placeholders.
- Admin API routes verify admin JWTs server-side.
- OTP flow has expiry, attempt counting, and lockout.
- Forgot password response avoids user enumeration by returning the same message for unknown emails.

Risks and gaps:

- `JWT_SECRET` has weak defaults in code. Production must override it.
- Admin middleware decodes JWT without cryptographic verification; API routes verify, but page-level middleware protection can be bypassed if only relying on decoded payload. Use async verification where possible.
- Direct autogenerated password email means the new password is sent in plaintext over email. A token-based reset flow is generally safer, but the current token service is missing.
- EmailJS service/public IDs are hardcoded; private key is env-based.
- Default admin script creates `admin@coiniq.com` with password `admin123`; production must change it immediately.
- Missing migrations can cause runtime errors that may expose stack traces in logs.
- `/api/predictions/daily` DELETE truncates prediction tables and appears unauthenticated. This should be protected before production use.
- Admin certificate deletion resets progress after deleting the certificate row, so the reset query cannot find the row. This is a correctness bug.

## 16. Testing Approach

No active automated test suite is present in the current file list. `package.json` has no `test` script, and the cleanup log says a manual Flask test script was deleted.

Current verification options:

- `npm run lint` for static linting.
- `npm run build` for Next.js compile/build validation.
- Flask startup/import validation via `python app.py`.
- Manual endpoint checks:
  - `GET /flask-api/health`
  - `GET /api/auth/me`
  - `GET /api/crypto?limit=10`
  - `GET /api/news`
  - `GET /api/learn/courses`

Recommended additions:

- Unit tests for `userService`, `adminService`, `session`, `adminSession`.
- API route integration tests with a test PostgreSQL database.
- Migration tests that assert every code-referenced table/column exists.
- Flask tests for predictor input validation and `/health`.
- End-to-end auth/LMS/prediction flows with Playwright.

## 17. Folder-by-Folder and File-by-File Breakdown

### 17.1 Root Files

| File/folder | Description |
|---|---|
| `.gitignore` | Ignores dependencies, Next.js outputs, Python caches/venvs, env files, IDE files, and `.git-backups`. |
| `README.md` | Current root README content appears to include a pasted terminal command wrapper plus project setup notes. |
| `CLEANUP_LOG.md` | Documents recent dead-code cleanup and removed files/dependencies. Useful historical context. |
| `coin-iq/` | Next.js app and API backend. |
| `flask-api/` | Python ML API. |
| `Models/` | Trained model artifacts and XGBoost exports/results/SHAP images. |

### 17.2 `coin-iq/` Root

| File | Description |
|---|---|
| `package.json` | Defines frontend dependencies and scripts. |
| `package-lock.json` | npm lockfile. |
| `next.config.ts` | React Compiler, remote image patterns, Flask rewrite. |
| `tsconfig.json` | Strict TypeScript config, App Router plugin, `@/*` alias to `src/*`. |
| `eslint.config.mjs` | Next Core Web Vitals and TypeScript ESLint configuration. |
| `postcss.config.mjs` | Tailwind CSS PostCSS plugin. |
| `DB_SETUP.md` | PostgreSQL setup guide; partially stale because it only describes base schema. |
| `PROJECT_DOCUMENTATION.md` | Existing project summary. Contains useful context but includes some details not fully backed by current schema/scripts. |
| `public/logo.png` | Public logo used by navbar. |
| `.env.local` | Local environment file exists but was intentionally not read/documented with values. |

### 17.3 `coin-iq/src/lib`

| File | Purpose |
|---|---|
| `db.ts` | PostgreSQL connection pool. Shared by services/routes/scripts. |
| `userService.ts` | User model interface, bcrypt hashing, create/find/update user, password verification. |
| `adminService.ts` | Admin model interface, bcrypt hashing, create/find/list/update/delete admin, password verification. |
| `session.ts` | User JWT creation/verification and cookie header helpers. |
| `adminSession.ts` | Admin JWT creation/verification and admin cookie helpers. Uses `jose`; sync middleware helper decodes without verification. |
| `auth.ts` | Helpers to get current user from cookie header/server cookies and client-side `getUserProfile()`. |
| `coingecko-api.ts` | Binance-backed CoinGecko-shaped data adapter with mock fallbacks. |
| `cryptoService.ts` | Additional Binance service returning app-specific `CryptoData`, using `fetch`/`axios`. |
| `coinImages.ts` | Symbol-to-image URL map and safe lookup helpers. |
| `lmsData.ts` | Hardcoded course definitions, lessons, quiz data, `getCourse(slug)`, and `PASSING_SCORE`. Also used as DB seed source. |
| `lmsDbSync.ts` | Idempotently syncs hardcoded courses, lessons, and quiz questions to DB. Expects missing LMS tables/columns unless extra migrations exist. |
| `utils.ts` | `cn()` class merge helper using `clsx` and `tailwind-merge`. |
| `schema.sql` | Base auth/admin/OTP/oauth/reset schema and triggers. |
| `lms-schema.sql` | Base LMS schema, incomplete relative to current LMS code. |
| `predictions-schema.sql` | Prediction history schema; not run by current package scripts. |

### 17.4 `coin-iq/src/scripts`

| File | Purpose |
|---|---|
| `init-db.ts` | Connects to default `postgres`, creates target database if missing, executes `schema.sql`. |
| `migrate.ts` | Connects to target database and executes `schema.sql`. |
| `init-admin.ts` | Creates default `admin@coiniq.com` admin with bcrypt hash if missing. |
| `init-lms.ts` | Executes `lms-schema.sql` and ends pool. No npm script currently points to it. |

### 17.5 `coin-iq/src/hooks`

| File | Purpose |
|---|---|
| `useCryptoData.ts` | Client hooks for top crypto list, details, and history. Normalizes API responses to UI types and handles loading/error state. |
| `usePrediction.ts` | Client hooks for Flask live prediction and supported coins. Defines prediction/result/sentiment TypeScript interfaces. |

### 17.6 `coin-iq/src/types`

| File | Purpose |
|---|---|
| `crypto.ts` | Defines `CryptoData`, the primary frontend market data shape. Notes that unused prediction/market metric types were removed. |

### 17.7 `flask-api/`

| File | Purpose |
|---|---|
| `requirements.txt` | Python dependency list. |
| `app.py` | Main Flask server, endpoints, scheduler jobs, mail config, DB interval locker. |
| `binance_features.py` | Binance data fetching and feature engineering pipeline. |
| `news_sentiment.py` | RSS fetching, VADER scoring, coin keyword mapping, 5-minute sentiment cache. |
| `models/__init__.py` | Package marker. |
| `models/xgboost_model.py` | XGBoost predictor class and per-coin thresholds/accuracy metadata. |
| `models/lgbm_model.py` | LightGBM predictor class. |
| `models/rf_model.py` | Random Forest predictor class. |
| `models/lstm_model.py` | LSTM sequence predictor class. |

### 17.8 `Models/`

| Folder | Contents and use |
|---|---|
| `xgboost_70_export/` | Per-coin XGBoost JSON models, result images, SHAP images, and `summary.csv`. Loaded by `XGBoostPredictor`. |
| `LightBGM/` | LightGBM model text/pickle, scaler pickle, feature columns pickle. Loaded by `LGBMPredictor`. |
| `Random Forest/` | Random Forest model, scaler, feature columns. Loaded by `RFPredictor`. |
| `LSTM/` | Keras model, scaler, metadata pickle. Loaded by `LSTMPredictor`. |

## 18. Known Current-Code Issues and Inferences

These are not changes made by this documentation; they are observations from reading the current code.

| Area | Observation | Impact |
|---|---|---|
| Legacy reset password | `reset-password` routes import missing `@/lib/passwordResetService`. | Build/runtime failure for those routes until restored or removed. |
| LMS schema | Code expects `lms_lessons`, `lms_quiz_questions`, and extra `lms_courses` columns absent from `lms-schema.sql`. | LMS/admin LMS may fail on a freshly initialized DB. |
| Prediction interval schema | Code expects `interval_snapshots`; Flask expects `prediction_interval_snapshots`; neither appears in SQL files. | Dashboard history/interval locking may fail on a fresh DB. |
| Prediction schema execution | `predictions-schema.sql` is not run by `db:create` or `db:migrate`. | `prediction_history` may be missing unless manually created. |
| LMS hardcoded validation | `/api/learn/progress` validates course slug with hardcoded `getCourse()`. | Admin-created DB-only courses may not allow progress updates. |
| Admin certificate revocation | Route deletes certificate before using it to reset matching progress. | Progress reset likely does not happen. |
| Middleware admin verification | Middleware decodes admin token without signature verification. | API routes are protected, but middleware-level access control is weaker than intended. |
| Unauthenticated destructive route | `/api/predictions/daily` DELETE truncates prediction data without auth checks. | Should be restricted before production. |
| README encoding/content | Root README output contains pasted terminal wrapper and mojibake-like characters. | Documentation may confuse new setup unless cleaned separately. |

## 19. Maintenance Guidance

For a new developer extending this project:

1. Start by adding a complete database migration that matches all code-referenced tables and columns.
2. Decide whether the active password reset strategy is autogenerated passwords via EmailJS or token reset links. Remove/repair the inactive path.
3. Keep Flask and Next.js contracts stable:
   - Flask prediction response shape is consumed by `usePrediction`, `prediction-dashboard.tsx`, `dashboard/page.tsx`, and `analytics/page.tsx`.
   - Next.js `/api/predictions/save` payload is produced by Flask scheduler and dashboard client saves.
4. Treat `lmsData.ts` as seed data, not the sole source of truth, if admin-created DB courses are a supported feature.
5. Protect destructive/admin-like prediction maintenance endpoints.
6. Add build and migration checks to CI before deploying.

