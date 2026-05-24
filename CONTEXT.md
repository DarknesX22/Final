# Coin-IQ Project — Full Context & Architecture

## Workspace Structure

```
FYPFinal/
├── coin-iq/          # Next.js 16 frontend + backend API
├── Models/           # Trained ML model files
├── flask-api/        # Flask prediction API
└── CONTEXT.md        # This file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, React 19 |
| Styling | Tailwind CSS 4, Framer Motion 12 |
| Backend | Next.js API Routes, Flask (Python) |
| Database | PostgreSQL (pg pool) |
| Auth | JWT (HttpOnly cookies), bcrypt |
| Email | Resend |
| ML | XGBoost, LightGBM, Random Forest, LSTM (TensorFlow/Keras) |
| Data | Binance API (live klines), RSS feeds (news) |

**Design language:** White background (`bg-white`), black/gray palette, `border-gray-200`, black CTAs. Consistent across all pages. No dark mode.

---

## coin-iq (Next.js App)

### Pages

| Route | Auth | Description |
|---|---|---|
| `/` | Public | Landing — hero, ticker, features, predictions preview, CTA |
| `/coins` | Public | Crypto market table — search, sort, pagination, detail modal |
| `/markets` | Public | Markets card grid |
| `/news` | Public | RSS news aggregator — CoinDesk, CoinTelegraph, Decrypt |
| `/about` | Public | About page — hero, how it works, story, values, team, tech stack, CTA |
| `/predictions` | Auth (blur gate) | AI predictions — shows login form on top if not authed |
| `/analytics` | Public | Analytics dashboard |
| `/learn` | Auth (redirect) | LMS course catalog |
| `/learn/[slug]` | Auth | Course lesson viewer |
| `/learn/[slug]/quiz` | Auth | Quiz page |
| `/learn/certificate/[id]` | Public | Printable certificate |
| `/dashboard` | Auth | User dashboard — live predictions, market data, LMS progress |
| `/profile/edit` | Auth | Profile editor |
| `/login` | Public | Split-screen login (left: branding, right: form) |
| `/signup` | Public | Split-screen signup with password strength meter |
| `/forgot-password` | Public | Password reset request |
| `/reset-password` | Public | Password reset with token |
| `/admin` | Admin | Admin dashboard |
| `/admin/login` | Public | Redirects to `/login` |

### Navbar
- Fixed top, white background, blur on scroll
- Active link: `text-black bg-black/[0.06]` + animated bottom bar (`layoutId="nav-underline"`)
- Hover: `text-black hover:bg-black/[0.04]`
- Default: `text-gray-500`
- Uses `usePathname()` for active detection
- Authenticated: avatar dropdown with Edit Profile + Dashboard + Sign out
- Unauthenticated: Sign In + Get Started buttons
- Mobile: full-screen drawer, active = `bg-black text-white` pill

### Auth Flow
1. JWT stored in HttpOnly cookie (`auth_token`, 7-day expiry)
2. Admin JWT in separate `admin_auth_token` cookie
3. `/api/auth/login` checks `admins` table first → sets both cookies if admin → redirects to `/admin`; falls back to `users` table → redirects to `/dashboard`
4. Middleware protects: `/dashboard`, `/profile`, `/settings`, `/learn`, `/predictions` (blur overlay, not redirect)
5. bcrypt (10 rounds) for password hashing
6. OAuth via Google/Facebook → `oauth_providers` table

### Auth Gate (Predictions page)
- Page renders blurred behind a split-screen login/signup form
- Form is embedded directly (not a modal) — tabbed Sign In / Create Account
- On success → overlay disappears, dashboard loads instantly
- No OAuth buttons (removed)

### Auth Modal (Home page CTAs)
- `AuthModal.tsx` — reusable modal for home page CTAs
- Triggered by: "Start Predicting", "Learn Crypto", "View All 20 Coins", "Get Started Free", "View Live Predictions"
- Shows feature perks + Sign In / Create Account links

### Proxy (next.config.ts)
`/flask-api/*` → `http://localhost:5000/*` via Next.js rewrites

---

## API Routes (Next.js)

### Auth
- `POST /api/auth/login` — checks admins then users, sets cookies, returns `isAdmin` + `redirect`
- `POST /api/auth/signup` — creates user, sets cookie
- `POST /api/auth/logout` — clears cookie
- `GET  /api/auth/me` — returns current user from cookie
- `POST /api/auth/forgot-password` — sends reset email via Resend
- `POST /api/auth/reset-password` — resets password with token
- `GET/POST /api/auth/oauth/google|facebook` — OAuth flow

### Crypto
- `GET /api/crypto?limit=N` — top cryptos from Binance (5-min cache)
- `GET /api/crypto/[id]` — single coin details
- `GET /api/crypto/history/[id]?days=N` — price history

### News
- `GET /api/news?page=N` — paginated RSS aggregator (10/page, 5-min cache)
  - Sources: CoinDesk, CoinTelegraph, Decrypt
  - Returns: `{ articles, pagination }` with `actor_name`, `body`, `type` fields

### Profile
- `GET/PUT /api/profile` — user profile

### LMS (User-facing)
- `GET /api/learn/courses` — all courses from DB (includes admin-created), with user progress
- `GET /api/learn/courses/[slug]` — course + lessons + quiz from DB
- `POST /api/learn/progress` — mark lesson complete
- `GET /api/learn/progress` — all progress for current user
- `POST /api/learn/quiz` — grade quiz server-side from DB questions, issue certificate
- `GET /api/learn/certificate/[id]` — public certificate lookup

### Admin
- `GET /api/admin/auth/me` — current admin
- `POST /api/admin/auth/logout` — clear admin cookie
- `GET /api/admin/data/analytics` — full stats: users, admins, LMS metrics, daily signups, monthly growth, top courses, recent registrations
- `GET /api/admin/data/users?search=&page=&limit=` — paginated users with role + courses_completed
- `DELETE /api/admin/data/users` — delete user
- `GET /api/admin/data/logs` — unified activity log (signups + course completions + certificates)
- `POST /api/admin/users/promote` — promote user to admin (uses pool)
- `POST /api/admin/users/demote` — demote admin to user (uses pool)
- `GET /api/admin/lms/courses` — all courses from DB with enrollment stats + lesson/quiz counts
- `POST /api/admin/lms/courses` — create new course
- `GET/PUT/DELETE /api/admin/lms/courses/[slug]` — get detail / edit / delete course
- `POST/PUT/DELETE /api/admin/lms/lessons` — add / edit / delete lesson
- `POST/PUT/DELETE /api/admin/lms/quiz` — add / edit / delete quiz question
- `GET /api/admin/lms/progress` — all user progress with total_lessons
- `GET /api/admin/lms/certificates` — all certificates
- `DELETE /api/admin/lms/certificates` — revoke certificate + reset quiz progress

---

## Database (PostgreSQL)

### Core Tables
| Table | Purpose |
|---|---|
| `users` | App users (id, name, email, password_hash, timestamps) |
| `admins` | Admin accounts (id, name, email, password_hash, role, timestamps) |
| `oauth_providers` | Social login links (provider, provider_user_id, user_id) |
| `password_reset_tokens` | Reset tokens (1h expiry, used flag) |
| `otp_verifications` | Email OTP codes |

### LMS Tables
| Table | Purpose |
|---|---|
| `lms_courses` | Course metadata (slug, title, description, level, duration, icon, color, lesson_count, quiz_count) |
| `lms_lessons` | Lesson content (course_slug, lesson_index, title, content, duration_minutes) |
| `lms_quiz_questions` | Quiz questions (course_slug, question_order, question, options JSONB, correct_index, explanation) |
| `lms_user_progress` | Per-user per-course progress (completed_lessons[], quiz_score, quiz_passed, completed, timestamps) |
| `lms_certificates` | Issued certificates (user_id, course_slug, certificate_id hex, issued_at) |

### DB Sync
`lmsDbSync.ts` — syncs hardcoded `COURSES` array into DB on first `/api/learn/courses` request. Idempotent. Admin-created courses persist in DB only.

---

## LMS Module

### User Flow
1. Browse `/learn` — all courses from DB (4 seeded + any admin-created)
2. Click course → `/learn/[slug]` — lesson viewer with sidebar nav
3. Mark lessons complete → progress saved to `lms_user_progress`
4. Take quiz → `/learn/[slug]/quiz` — one question at a time, graded server-side
5. Pass (≥60%) → certificate issued, viewable at `/learn/certificate/[id]`

### Admin LMS Management
- **Add Course** — 3-step wizard: Step 1 (metadata), Step 2 (lessons with content), Step 3 (quiz questions with correct answer selection)
- **Edit Course** — modal for metadata changes
- **Content modal** — tabbed Lessons/Quiz view with Add/Edit/Delete per item
- **Delete Course** — cascades to lessons and quiz questions

---

## News Page (`/news`)

- 10 articles per page, paginated
- Editorial layout: 1 large featured card + 2 secondary + compact list rows
- Source badges: blue = CoinDesk, amber = CoinTelegraph, violet = Decrypt
- "Read More" opens in-app modal with article body + "Full Article" link
- `xml2js` for RSS XML parsing, 5-min server cache

---

## Predictions Page (`/predictions`)

### Auth Gate
- Unauthenticated: full-width split section at top — left pitch, right tabbed login/signup form
- Dashboard content blurred behind with `backdrop-filter: blur(8px)`
- On login/signup success → overlay disappears, dashboard loads

### Prediction Dashboard (`prediction-dashboard.tsx`)
- 20-coin selector grid with logos
- **Price card** — live price from Binance with green pulse indicator + fetch timestamp
- **Ensemble card** — colored bg (green/red) by direction, shows probability + confidence + models voted
- **Risk Assessment card** — low/medium/high with animated confidence bar
- **Expected Price card** — current → projected price with % change badge. Formula: `current × (1 + direction_factor × confidence × 0.03)`. Tinted green/red by direction.
- **Technical Indicators** — RSI (14), MACD, BB %B, RSI Signal — centered cards with icon + human sub-label (Overbought/Oversold/Neutral, Bullish/Bearish momentum, etc.)
- **Model Breakdown** — 5-card grid (`lg:grid-cols-5`):
  - XGBoost, LightGBM, Random Forest, LSTM — colored border + tinted bg, direction icon, probability %, animated bar, accuracy
  - **Final Decision card** — STRONG BUY / BUY / HOLD / SELL / STRONG SELL based on ensemble confidence:
    - UP + conf ≥ 40% → STRONG BUY (dark green)
    - UP + conf ≥ 20% → BUY (green)
    - Either direction < 20% → HOLD (yellow)
    - DOWN + conf ≥ 20% → SELL (red)
    - DOWN + conf ≥ 40% → STRONG SELL (dark red)
  - Shows reason text, risk level badge, "⚠ Not financial advice" disclaimer
- 30-day candlestick chart + 7-day AI forecast line chart
- All data from Flask API via `/flask-api/live/predict/<coin>`

---

## Dashboard (`/dashboard`)

- All 20 coins predictions table — live from Flask, loads in parallel
- Per-coin: symbol, price, signal badge, probability %, RSI, risk badge, 4 model dot indicators
- Ensemble summary gauge (avg probability + bullish/bearish count)
- Top Gainers / Top Losers from Binance
- Volume bars + Market Cap donut chart
- **LMS Progress widget** — course progress bars, completed/in-progress/certificates count
- Refresh button re-fetches all 20 coins

---

## Admin Dashboard (`/admin`)

**5 sections:**

### Overview
- 4 KPI stat cards (Total Users, New This Week, Courses Completed, Certificates)
- Daily signups SVG bar chart (last 30 days)
- LMS Health — 3 animated donut rings (Enrollment Rate, Quiz Pass Rate, Completion Rate)
- Monthly user growth bar chart (last 12 months)
- Top courses by enrollment with completion % bars
- Recent registrations list (last 5 users)
- Activity feed — 9 recent events in 3-column grid with type badges

### Users
- Search (debounced 400ms), paginated table
- Role badges: admin = black, user = gray
- Promote to Admin / Delete with confirm dialogs

### LMS
- **Courses tab** — expandable course cards with stats, Add/Edit/Delete/Content buttons
- **Add Course wizard** — 3 steps: metadata → lessons → quiz questions
- **Content modal** — tabbed Lessons/Quiz with inline Add/Edit/Delete
- **Progress tab** — filterable by course

### Certificates
- Table with truncated+copyable IDs, Revoke button

### Settings
- Promote/Demote admin with role select
- Platform info (DB counts, versions)
- Flask API health check button

---

## flask-api

```
flask-api/
├── app.py                # Flask app + all routes
├── binance_features.py   # Binance kline fetcher + full feature engineering
├── requirements.txt
├── test_api.py
└── models/
    ├── xgboost_model.py  # Per-coin JSON models (20 coins)
    ├── lgbm_model.py     # Single LightGBM model (45 features)
    ├── rf_model.py       # Single Random Forest model (28 features)
    └── lstm_model.py     # Keras LSTM (seq_len=24, 41 features)
```

### Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/` | API info |
| GET | `/health` | All 4 models status |
| GET | `/models` | Feature lists, supported coins, accuracy |
| POST | `/predict/xgboost` | Manual features prediction |
| POST | `/predict/lgbm` | Manual features prediction |
| POST | `/predict/rf` | Manual features prediction |
| POST | `/predict/lstm` | Manual 24-step sequence |
| POST | `/predict/all` | All models + ensemble |
| GET | `/live/coins` | 20 supported coins |
| GET | `/live/predict/<coin>` | **Live prediction** — fetches Binance, computes features, runs all 4 models |
| GET | `/live/predict/all-coins` | All 20 coins at once |

### Live Prediction Response
```json
{
  "coin": "BTCUSDT",
  "fetched_at": "2026-05-10T08:00:00Z",
  "market": { "close_price": 80736, "rsi": 43.6, "macd": 101.8, "bb_pct_b": 0.57 },
  "models": {
    "xgboost":       { "direction": "UP", "probability": 0.696, "accuracy": 0.7332, "threshold": 0.52 },
    "lightgbm":      { "direction": "UP", "probability": 0.624 },
    "random_forest": { "direction": "UP", "probability": 0.700 },
    "lstm":          { "direction": "UP", "probability": 0.504 }
  },
  "ensemble": { "direction": "UP", "probability": 0.631, "confidence": "26.2%", "models_used": 4 },
  "note": "Sentiment features set to neutral."
}
```

### Feature Engineering (`binance_features.py`)
Fetches 200 × 1h klines from Binance and computes:
- EMAs (9, 21), MACD, Bollinger Bands, RSI, Stochastic, ROC, ATR, OBV
- Taker buy ratio, high-low spread, volume ratio
- Lag features (close_lag_1/3/7, direction lags 1–24, return lags)
- Win rates (24h, 72h), volatility windows (5/7/14/21/24/30d)
- Z-scores, EMA cross signals, candle patterns, confluence flags
- Sentiment features → neutral (0 / mid-range) — not available from Binance
- `coin` → label-encoded integer (alphabetical index 0–19)

---

## Models (ML)

Four trained binary classifiers — predict **price direction next day** (UP=1 / DOWN=0).

### XGBoost (`Models/xgboost_70_export/`)
- One model per coin — 20 coins total
- 141 features: OHLCV, technical indicators, sentiment, FnG, social, lag features, candle patterns
- Per-coin tuned thresholds
- Accuracy: 71.1% – 74.3% | ROC-AUC: 0.77 – 0.81

| Coin | Accuracy | ROC-AUC | Threshold |
|---|---|---|---|
| ETCUSDT | 74.3% | 0.802 | 0.55 |
| BNBUSDT | 74.1% | 0.812 | 0.58 |
| ADAUSDT | 73.9% | 0.802 | 0.44 |
| BTCUSDT | 73.3% | 0.805 | 0.52 |
| ETHUSDT | 72.6% | 0.801 | 0.47 |
| XRPUSDT | 71.3% | 0.787 | 0.47 |
| QTUMUSDT | 71.1% | 0.775 | 0.56 |

### LightGBM (`Models/LightBGM/`)
- Single model, 45 features, interaction features included
- Files: `lgbm_crypto_model.pkl`, `lgbm_crypto_scaler.pkl`, `lgbm_feature_cols.pkl`

### Random Forest (`Models/Random Forest/`)
- Single model, 28 features (core subset)
- Files: `rf_crypto_model.pkl`, `rf_crypto_scaler.pkl`, `rf_feature_cols.pkl`

### LSTM (`Models/LSTM/`)
- Sequence model: 24 timesteps × 41 features
- Target: `direction_next_1d`
- Files: `lstm_crypto_model.keras`, `lstm_crypto_scaler.pkl`, `lstm_crypto_metadata.pkl`

All models use `RobustScaler`. Trained with scikit-learn 1.6.1 (version warnings on 1.8.0 but functional).

---

## Key Components

### `CryptoTicker.tsx`
- Dark `bg-gray-950` scrolling bar
- Real coin logos with colored initial fallback (deterministic color per symbol)
- `text-sm` font — symbol, price, % change with TrendingUp/Down icons
- Pauses on hover, 55s scroll cycle

### `AuthModal.tsx`
- Reusable modal for home page CTA auth gates
- Dark header, feature perks list, Sign In / Create Account links
- Closes on Escape or backdrop click

### `prediction-dashboard.tsx`
- 20-coin selector grid
- Price card, Ensemble card (colored by direction), Risk Assessment
- **Expected Price card** — shows current → projected price with % change badge. Calculated as `current × (1 + direction_factor × confidence × 0.03)`. Tinted green/red by direction.
- Technical indicator cards with icons + human sub-labels (RSI, MACD, BB %B, RSI Signal)
- Model breakdown cards (colored border + tinted bg by direction) — XGBoost, LightGBM, Random Forest, LSTM
- **Final Decision card** (5th card in model breakdown) — STRONG BUY / BUY / HOLD / SELL / STRONG SELL based on ensemble probability + confidence. Shows reason, risk level, disclaimer.
- Candlestick + forecast line charts

**Final Decision logic:**
| Condition | Decision |
|---|---|
| UP + confidence ≥ 40% | STRONG BUY |
| UP + confidence ≥ 20% | BUY |
| Either direction < 20% | HOLD |
| DOWN + confidence ≥ 20% | SELL |
| DOWN + confidence ≥ 40% | STRONG SELL |

### `footer.tsx`
- Dark `bg-gray-950` theme
- Top CTA strip, brand column with social icons
- 3 link columns: Platform, Company, Legal
- Bottom bar with copyright + risk disclaimer + systems status

### `providers.tsx`
- Exports `motion`, `AnimatePresence` from framer-motion
- `Toaster` configured: dark `bg-gray-950` pills, colored borders per type (success=green, error=red)

---

## About Page Sections

### Our Values
- 2×2 grid, colored cards (blue/violet/amber/green)
- Horizontal layout: large icon + title + description + 3 bullet points with CheckCircle icons

### Our Team (3 members — Umair, Rian, Hassan)
- Gradient header cards (gray/blue/violet gradients)
- Frosted glass avatar with initials
- Skill tag pills in white body

### Technology Stack
- Grouped by category: Frontend & Styling / Backend & Data / Machine Learning
- Real SVG brand icons with matching brand colors
- 4-column grid per group, icon scales on hover

---

## Running the Project

```bash
# Terminal 1 — Flask API (loads all 4 ML models ~30s)
cd flask-api
python app.py
# → http://localhost:5000

# Terminal 2 — Next.js
cd coin-iq
npm run dev
# → http://localhost:3000

# Test Flask directly
cd flask-api
python test_api.py

# Run LMS DB migration (first time only)
# In psql or via Python psycopg2:
# Run coin-iq/src/lib/lms-schema.sql
# Run coin-iq/src/lib/lms-schema-v2.sql
```

### Admin Credentials
- Email: `admin@coiniq.com`
- Password: `admin123`
- Run `npm run admin:init` in `coin-iq/` to create if not exists

### Environment Variables (`.env.local`)
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=coin_iq
DB_PASSWORD=123
DB_PORT=5432
JWT_SECRET=coin_iq_secret_key_change_this_in_production
NEXT_PUBLIC_BASE_URL=http://localhost:3000
RESEND_API_KEY=re_...
RESEND_FROM=onboarding@resend.dev
```

---

## Notes & Known Limitations

- Sentiment features (VADER, FinBERT, Fear & Greed Index) are set to neutral — Binance does not provide sentiment data. Adding a real sentiment source would improve model accuracy.
- Models were trained with scikit-learn 1.6.1. Version warnings appear on 1.8.0 but predictions work correctly.
- `lms_courses` table is the source of truth for courses — `lmsData.ts` is only used for initial seeding via `syncLmsToDb()`.
- The `/predictions` page uses a blur overlay (not a redirect) so search engines can still index the page content.
- Flask API must be running for live predictions. If offline, prediction cards show skeleton loaders.
- Not financial advice. Cryptocurrency trading involves significant risk.
