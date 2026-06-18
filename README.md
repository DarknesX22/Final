<div align="center">

<img src="coin-iq/src/logo/logo (2).png" alt="Coin-IQ Logo" width="120" />

# Coin-IQ

### Cryptocurrency Price Direction Prediction Platform

**A Final Year Project combining machine learning ensemble models with a production-quality full-stack web application**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)

[Features](#-features) · [Architecture](#-architecture) · [ML Models](#-machine-learning-models) · [Tech Stack](#-tech-stack) · [Setup](#-setup) · [API Reference](#-api-reference)

</div>

---

## 📌 Overview

**Coin-IQ** answers one research question: *Can an ensemble of machine learning models reliably predict next-day cryptocurrency price direction, and can those predictions be delivered to everyday traders through a production-quality web platform?*

The system trains and deploys **four ML models** — XGBoost, LightGBM, Random Forest, and LSTM — achieving up to **74.3% directional accuracy** on held-out test data. These models run as a live ensemble, generating predictions every minute for **20 cryptocurrency pairs** sourced from Binance's real-time API.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 Machine Learning
- 4-model ensemble (XGBoost · LightGBM · RF · LSTM)
- 80+ engineered technical & sentiment features
- Per-coin XGBoost models with tuned thresholds
- Live VADER sentiment from 3 RSS news feeds
- Confidence scoring and risk assessment
- 8-interval outcome tracking (10 min → 24 h)

</td>
<td width="50%">

### 📊 Platform
- Live predictions for 20 USDT crypto pairs
- Real-time Binance market data (ticker, klines)
- Prediction history with interval accuracy
- Crypto news aggregator (CoinDesk, CoinTelegraph, Decrypt)
- Analytics page with sentiment visualisation
- Crypto markets & coins browser with charts

</td>
</tr>
<tr>
<td width="50%">

### 🎓 Learning Management System
- 4 full courses with lessons and quizzes
- Progress tracking per user per course
- Certificate generation on quiz pass
- Public certificate verification URLs
- Admin course/lesson/quiz management

</td>
<td width="50%">

### 🔐 Auth & Admin
- OTP email verification on signup
- JWT session tokens (user + admin)
- bcrypt password hashing
- Role-based admin dashboard
- User management (promote/demote/delete)
- Scheduler start/stop controls

</td>
</tr>
</table>

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Next.js 16  (port 3000)                    │
│                                                         │
│  /app/*          → SSR/CSR pages                        │
│  /api/auth/*     → Authentication & OTP                 │
│  /api/profile    → Profile management                   │
│  /api/predictions/* → Prediction persistence            │
│  /api/learn/*    → LMS (courses, quiz, certs)           │
│  /api/admin/*    → Admin dashboard APIs                 │
│  /api/crypto/*   → Binance market data proxy            │
│  /api/news       → RSS news aggregation                 │
│  /flask-api/*    → Rewrite proxy ──────────────────┐    │
└────────────────────────────────────────────────────│────┘
                                                     │
┌────────────────────────────────────────────────────▼────┐
│              Flask ML API  (port 5000)                  │
│                                                         │
│  /live/predict/<coin>  → Live ensemble prediction       │
│  /sentiment            → VADER news sentiment           │
│  /scheduler/*          → Start/stop recording           │
│  /health               → Model readiness check          │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ XGBoost  │ │ LightGBM │ │   R.F.   │ │   LSTM   │   │
│  │ 20 models│ │ universal│ │ universal│ │ 24-step  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
  Binance REST API                   PostgreSQL
  (klines, ticker)               (12 tables, users,
                                  predictions, LMS)
```

---

## 🤖 Machine Learning Models

### Accuracy Results (XGBoost, held-out test set — 997 rows per coin)

| Rank | Coin | Accuracy | ROC-AUC | Threshold |
|------|------|----------|---------|-----------|
| 🥇 1 | ETC/USDT | **74.32%** | 0.8019 | 0.55 |
| 🥈 2 | BNB/USDT | 74.12% | 0.8120 | 0.58 |
| 🥉 3 | ADA/USDT | 73.92% | 0.8018 | 0.44 |
| 4 | ZRX/USDT | 73.42% | 0.8020 | 0.51 |
| 5 | DASH/USDT | 73.32% | 0.7975 | 0.58 |
| 5 | BTC/USDT | 73.32% | 0.8049 | 0.52 |
| ... | ... | ... | ... | ... |
| 20 | QTM/USDT | 71.11% | 0.7750 | 0.56 |

**Overall range: 71.1% – 74.3% accuracy · ROC-AUC: 0.77 – 0.81**

### Ensemble Logic

```
ensemble_probability = avg(xgb_prob, lgbm_prob, rf_prob, lstm_prob)
direction            = "UP" if probability >= 0.5 else "DOWN"
confidence           = abs(probability - 0.5) × 2 × 100  (%)
```

### Feature Engineering (`binance_features.py`)

80+ features across 10 categories:

| Category | Features |
|----------|---------|
| EMAs & MACD | EMA 9/21, MACD, signal, histogram, cross flags |
| Bollinger Bands | Upper/lower, %B, width, squeeze, breakout |
| Momentum | RSI 14, Stochastic K/D, ROC 10 |
| Volatility | ATR 14, high-low spread, volatility windows (5d–30d) |
| Volume | OBV, taker-buy ratio, volume ratio, spike flag |
| Returns & Lags | 1d–30d returns, direction lags (1–24 steps) |
| Time | Hour, day-of-week, weekend, month, quarter |
| Z-scores | Close z-score for 5d/7d/14d/21d/30d windows |
| Candle patterns | Body ratio, doji, bullish candle, higher-high |
| Sentiment | VADER compound/pos/neg/neu, finbert score, article count |

---

## 🛠 Tech Stack

### Frontend & Backend (Next.js)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.1 | React framework, App Router, SSR, API routes |
| `react` | 19.2.3 | UI rendering |
| `typescript` | 5.x | Type safety |
| `tailwindcss` | 4.x | Utility-first styling |
| `framer-motion` | 12.x | Page animations, animated charts |
| `lucide-react` | 0.562 | Icon library |
| `react-hot-toast` | 2.6 | Toast notifications |
| `pg` | 8.x | PostgreSQL client |
| `bcrypt` | 6.x | Password hashing |
| `jsonwebtoken` | 9.x | User JWT tokens |
| `jose` | 6.x | Admin JWT (Edge Runtime) |
| `xml2js` | 0.6 | RSS feed XML parsing |
| `axios` | 1.x | HTTP client |

### ML API (Flask/Python)

| Package | Purpose |
|---------|---------|
| `flask` + `flask-cors` | Python API server |
| `xgboost` | Per-coin gradient boosting models |
| `lightgbm` | Universal LightGBM model |
| `tensorflow` / `keras` | LSTM sequence model |
| `scikit-learn` | Random Forest + scalers |
| `pandas` / `numpy` | Feature engineering |
| `vaderSentiment` | News sentiment scoring |
| `apscheduler` | Background prediction scheduler |
| `psycopg2-binary` | PostgreSQL access from Flask |
| `requests` | Binance + RSS HTTP calls |

---

## 🗄 Database Schema

12 PostgreSQL tables across 3 schema files:

```
users                   — registered users
admins                  — admin accounts
otp_verifications       — signup OTP codes (with lockout)
password_reset_tokens   — legacy reset tokens
lms_courses             — course metadata
lms_lessons             — lesson content per course
lms_quiz_questions      — quiz questions
lms_user_progress       — completed lessons per user
lms_certificates        — issued certificates
prediction_history      — every prediction + outcome
interval_snapshots      — 8-interval outcome tracking
news_articles           — persisted RSS articles (deduplicated)
```

---

## 🚀 Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/DarknesX22/Final.git
cd Final
```

### 2. Database setup

Create a PostgreSQL database named `coin_iq`, then run the schema files:

```bash
psql -U postgres -d coin_iq -f coin-iq/src/lib/schema.sql
psql -U postgres -d coin_iq -f coin-iq/src/lib/lms-schema.sql
psql -U postgres -d coin_iq -f coin-iq/src/lib/predictions-schema.sql
psql -U postgres -d coin_iq -f coin-iq/src/lib/news-schema.sql
```

### 3. Frontend setup

```bash
cd coin-iq
npm install
```

Create `.env.local` in the `coin-iq/` folder:

```env
# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=coin_iq
DB_PASSWORD=your_password
DB_PORT=5432

# Auth
JWT_SECRET=your_jwt_secret_here
ADMIN_JWT_SECRET=your_admin_jwt_secret_here

# EmailJS (for OTP and password reset)
EMAILJS_PRIVATE_KEY=your_emailjs_private_key

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Run the dev server:

```bash
npm run dev
# App runs at http://localhost:3000
```

Initialise the admin account:

```bash
npm run admin:init
```

### 4. Flask ML API setup

```bash
cd flask-api
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python app.py
# Flask runs at http://localhost:5000
```

Create `flask-api/.env`:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coin_iq
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## 📡 API Reference

### Flask ML Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Model readiness check |
| `GET` | `/live/coins` | List 20 supported coins |
| `GET` | `/live/predict/<coin>` | Live prediction from Binance (e.g. `/live/predict/BTCUSDT`) |
| `GET` | `/live/predict/all-coins` | Live predictions for all 20 coins |
| `GET` | `/sentiment?coin=BTCUSDT` | VADER sentiment scores |
| `POST` | `/predict/xgboost` | Manual XGBoost prediction |
| `POST` | `/predict/lgbm` | Manual LightGBM prediction |
| `POST` | `/predict/rf` | Manual Random Forest prediction |
| `POST` | `/predict/lstm` | Manual LSTM prediction (24-step sequence) |
| `GET` | `/scheduler/status` | Scheduler running status |
| `POST` | `/scheduler/start` | Start prediction recording |
| `POST` | `/scheduler/stop` | Stop prediction recording |

### Next.js API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/otp/send` | Send OTP to email |
| `POST` | `/api/auth/otp/verify-signup` | Verify OTP and create account |
| `POST` | `/api/auth/login` | Login (user or admin) |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/forgot-password` | Send new password email |
| `GET` | `/api/crypto` | Live market data (Binance) |
| `GET` | `/api/news` | Paginated RSS news |
| `POST` | `/api/predictions/save` | Save a prediction |
| `GET` | `/api/predictions/daily` | History by date and interval |
| `GET` | `/api/learn/courses` | List courses with progress |
| `POST` | `/api/learn/quiz` | Submit quiz answers |
| `GET` | `/api/learn/certificate/:id` | Public certificate lookup |

---

## 📁 Project Structure

```
FYPFinal/
├── coin-iq/                    # Next.js application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── api/            # All API routes
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── predictions/    # Prediction dashboard
│   │   │   ├── analytics/      # Analytics & sentiment
│   │   │   ├── learn/          # LMS pages
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── news/           # News aggregator
│   │   │   └── markets/        # Crypto market browser
│   │   ├── components/         # Shared UI components
│   │   │   ├── charts/         # CandlestickChart, LineChart, RiskAssessment
│   │   │   └── ui/             # Button, Card, Badge, Input
│   │   ├── hooks/              # useCryptoData, usePrediction
│   │   ├── lib/                # db.ts, auth.ts, services, SQL schemas
│   │   └── middleware.ts       # Route protection
│   └── package.json
│
├── flask-api/                  # Python ML API
│   ├── app.py                  # Flask routes + APScheduler
│   ├── binance_features.py     # Feature engineering (80+ features)
│   ├── news_sentiment.py       # VADER RSS sentiment
│   ├── models/
│   │   ├── xgboost_model.py
│   │   ├── lgbm_model.py
│   │   ├── rf_model.py
│   │   └── lstm_model.py
│   └── requirements.txt
│
└── Models/                     # Trained model artifacts
    ├── xgboost_70_export/      # 20 per-coin XGBoost .json files + SHAP plots
    ├── LightBGM/               # lgbm_crypto_model.pkl + scaler
    ├── Random Forest/          # rf_crypto_model.pkl + scaler
    └── LSTM/                   # lstm_crypto_model.keras + scaler + metadata
```

---

## ⚠️ Limitations

- Model artifacts are **static** — no automated retraining pipeline
- 74% accuracy does **not** guarantee profitability in live trading
- Market cap is approximated as `price × 24h volume` (not true circulating supply)
- Sentiment uses VADER — not optimised for financial text (FinBERT would be better)
- Single-server deployment — no Docker, no horizontal scaling
- EmailJS dependency for OTP — no fallback email provider

---

## 🔭 Future Work

- [ ] Automated weekly retraining pipeline (Airflow/cron)
- [ ] Replace VADER with FinBERT for financial sentiment
- [ ] Temporal Fusion Transformer to replace LSTM
- [ ] Backtesting engine (P&L, Sharpe ratio, max drawdown)
- [ ] Portfolio simulation / paper trading mode
- [ ] Docker + cloud deployment (AWS/GCP)
- [ ] Mobile app (React Native)
- [ ] Real exchange API integration (read-only portfolio tracking)

---

## 📜 Legal

This platform is a **decision-support tool**, not a financial advisor. All predictions are for educational and research purposes only. Users assume full responsibility for any financial decisions made using information from this platform.

---

<div align="center">

Built as a Final Year Project · Next.js + Flask + PostgreSQL + XGBoost/LightGBM/RF/LSTM

**[⭐ Star this repo](https://github.com/DarknesX22/Final)** if you found it useful

</div>
