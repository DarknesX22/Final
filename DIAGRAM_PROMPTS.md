# Coin-IQ — UML & Architecture Diagram Prompts

Paste each prompt into your preferred diagramming AI tool (e.g. ChatGPT, Claude, Gemini, Lucidchart AI, draw.io AI, PlantUML renderer).

---

## 1. Use Case Diagram

```
Draw a detailed UML Use Case Diagram for the Coin-IQ cryptocurrency prediction platform.

Actors:
- Guest (unauthenticated visitor)
- Registered User (authenticated)
- Admin
- Flask ML API (system actor)
- Binance API (external system)
- RSS News Feeds (external system — CoinDesk, CoinTelegraph, Decrypt)

Use Cases to include:

Guest:
- View Landing Page
- View Live Coin Ticker
- View News Articles (read-only)
- Sign Up (via OTP email verification)
- Log In
- Forgot Password

Registered User (extends Guest):
- View Dashboard (Live Tab)
- View Dashboard (History Tab)
- View Prediction for a Coin
- View Market vs Model Accuracy by Date
- Open Interval Detail Modal
- Start / Stop Prediction Recording
- Edit Profile (name, email, password)
- Browse Crypto Markets
- View Coin Detail
- View Analytics & Sentiment
- Read News Article (in popup)
- Browse Learning Courses
- Complete a Lesson
- Take a Quiz
- Earn a Certificate
- View Certificate

Admin (extends Registered User):
- Access Admin Dashboard
- View Platform Analytics
- Manage Users (search, delete, promote, demote)
- Manage LMS Courses (create, edit, delete)
- Manage Lessons and Quiz Questions
- Revoke Certificates
- View Activity Logs
- Check Flask API Health

Flask ML API (system):
- Save Predictions every minute (scheduler)
- Lock Interval Snapshots
- Check Prediction Outcomes

Binance API:
- Provide Live OHLCV Klines
- Provide 24h Ticker Prices

RSS News Feeds:
- Provide News Articles

Include appropriate include/extend relationships:
- "Sign Up" includes "Verify OTP"
- "View Dashboard History Tab" includes "Select Date"
- "View Prediction for a Coin" includes "Run Ensemble Model"
- "Take a Quiz" extends "Complete a Lesson"
- "Earn a Certificate" extends "Take a Quiz"
```

---

## 2. Class Diagram

```
Draw a detailed UML Class Diagram for the Coin-IQ platform covering the core domain models, service classes, and their relationships.

Classes to include:

Domain / Database Models:
1. User { id: int, name: string, email: string, passwordHash: string, createdAt: DateTime }
2. Admin { id: int, name: string, email: string, passwordHash: string, role: string }
3. OtpVerification { id: int, email: string, otpCode: string, expiresAt: DateTime, verified: bool, attempts: int, lockedUntil: DateTime }
4. LmsCourse { id: int, slug: string, title: string, description: string, level: string, lessonCount: int, quizCount: int, icon: string }
5. LmsLesson { id: int, courseId: int, title: string, content: string, order: int }
6. LmsQuizQuestion { id: int, courseId: int, question: string, options: string[], correctAnswer: string }
7. LmsUserProgress { id: int, userId: int, courseId: int, completedLessons: int[], quizPassed: bool, completed: bool }
8. LmsCertificate { id: int, userId: int, courseId: int, certificateId: string, issuedAt: DateTime }
9. PredictionHistory { id: int, coin: string, predictedAt: DateTime, priceAtPrediction: float, ensembleDirection: string, ensembleProbability: float, outcomePrice: float, wasCorrect: bool }
10. IntervalSnapshot { id: int, sessionId: string, coin: string, intervalMinutes: int, predictedAt: DateTime, priceAtPrediction: float, ensembleDirection: string, ensembleProbability: float, actualDirection: string, outcomePrice: float, wasCorrect: bool, lockedAt: DateTime }
11. NewsArticle { id: int, articleId: string, title: string, source: string, publishedAt: DateTime, description: string, body: string, url: string, imageUrl: string }

Service Classes:
12. UserService { createUser(), findUserByEmail(), verifyPassword(), updateUserProfile() }
13. AdminService { findAdminByEmail(), createAdmin(), deleteAdmin() }
14. SessionService { createToken(user): string, verifyToken(token): Payload }
15. AdminSessionService { signAdminToken(admin): string, verifyAdminToken(token): Payload }
16. LmsDbSync { syncLmsToDb(): void }
17. CryptoService { getCryptoData(limit): CryptoData[], getSingleCrypto(id): CryptoData }
18. CoingeckoApiService { getTopCryptos(limit): CryptoData[], getCryptoDetails(id): CryptoDetails, getCryptoHistory(id, days): HistoryData }

Flask ML Classes (Python):
19. XGBoostPredictor { models: dict, thresholds: dict, predict(coin, features): PredictionResult }
20. LGBMPredictor { model, scaler, featureCols: list, predict(features): PredictionResult }
21. RandomForestPredictor { model, scaler, featureCols: list, predict(features): PredictionResult }
22. LSTMPredictor { model, scaler, metadata, predict(sequence): PredictionResult }
23. BinanceFeatureBuilder { fetchKlines(symbol): DataFrame, addIndicators(df): DataFrame, addSentiment(df, coin): DataFrame, buildFeaturesForCoin(symbol): FeatureSet }
24. NewsSentimentService { getRssArticles(): list, computeSentiment(articles): dict, getSentiment(coin): SentimentScore }

Relationships:
- User 1 --o< LmsUserProgress (one user has many progress records)
- User 1 --o< LmsCertificate
- LmsCourse 1 --o< LmsLesson
- LmsCourse 1 --o< LmsQuizQuestion
- LmsCourse 1 --o< LmsUserProgress
- LmsCourse 1 --o< LmsCertificate
- XGBoostPredictor, LGBMPredictor, RandomForestPredictor, LSTMPredictor are used by EnsembleOrchestrator
- BinanceFeatureBuilder feeds into all four ML predictors
- NewsSentimentService feeds into BinanceFeatureBuilder (adds sentiment features)
```

---

## 3. Activity Diagram

```
Draw a detailed UML Activity Diagram for the "User Makes a Prediction" workflow in the Coin-IQ platform.

Start: User opens the Dashboard page.

Flow:
1. System checks auth_token cookie
2. [Not authenticated] → Show inline Login/Signup form → User logs in → Redirect to Dashboard
3. [Authenticated] → Load Dashboard
4. Dashboard fetches user profile from PostgreSQL
5. Dashboard fetches top 20 crypto prices from Binance API (via Next.js /api/crypto)
6. Dashboard triggers parallel prediction fetches for all 20 coins (via /flask-api/live/predict/:coin)

   For each coin (parallel swim lane — Flask):
   a. Fetch 1h OHLCV klines from Binance
   b. Compute 80+ technical indicators (EMA, RSI, MACD, Bollinger, etc.)
   c. Fetch RSS news → compute VADER sentiment
   d. Run XGBoost predictor
   e. Run LightGBM predictor
   f. Run Random Forest predictor
   g. Run LSTM predictor (24-step sequence)
   h. Compute ensemble: average probabilities → direction (UP/DOWN) + confidence

7. Next.js receives prediction response
8. Display prediction card (coin, price, signal, probability, RSI, risk level, 4-model arrows, suggestion badge)
9. Fire-and-forget: POST to /api/predictions/save
   a. Insert into prediction_history
   b. Insert pending rows in interval_snapshots (10min, 20min, 30min, 1h, 2h, 6h, 12h, 24h)

10. User switches to History tab
11. User selects a date
12. System fetches /api/predictions/daily?date=YYYY-MM-DD
13. Trigger /api/predictions/lock-intervals (background)
14. Display interval accuracy cards (8 intervals, coin icons with green/red borders)
15. User clicks "View" on an interval → Open detail modal with full coin prediction table

End.

Use swim lanes for: Browser/User, Next.js Server, Flask ML API, PostgreSQL, Binance API
```

---

## 4. Sequence Diagram

```
Draw a detailed UML Sequence Diagram for the "Live Prediction Flow" in Coin-IQ.

Participants (left to right):
Browser, Next.js App, Flask API, XGBoost Model, LightGBM Model, Random Forest Model, LSTM Model, Binance API, PostgreSQL DB

Sequence:

1. Browser → Next.js App: GET /dashboard (with auth_token cookie)
2. Next.js App → PostgreSQL DB: SELECT user WHERE id = <from JWT>
3. PostgreSQL DB → Next.js App: User profile row
4. Next.js App → Browser: Render dashboard shell (loading state)
5. Browser → Flask API: GET /flask-api/live/predict/BTCUSDT
6. Flask API → Binance API: GET /klines?symbol=BTCUSDT&interval=1h&limit=200
7. Binance API → Flask API: OHLCV kline data (200 rows)
8. Flask API → Flask API: compute_indicators() — RSI, MACD, Bollinger, EMA, etc.
9. Flask API → Flask API: get_sentiment("BTCUSDT") — VADER scores from RSS cache
10. Flask API → XGBoost Model: predict(features_row)
11. XGBoost Model → Flask API: { direction: "UP", probability: 0.72 }
12. Flask API → LightGBM Model: predict(features_row)
13. LightGBM Model → Flask API: { direction: "UP", probability: 0.68 }
14. Flask API → Random Forest Model: predict(features_row)
15. Random Forest Model → Flask API: { direction: "UP", probability: 0.71 }
16. Flask API → LSTM Model: predict(sequence_24_rows)
17. LSTM Model → Flask API: { direction: "UP", probability: 0.65 }
18. Flask API → Flask API: ensemble = avg(0.72, 0.68, 0.71, 0.65) = 0.69 → "UP", confidence="38%"
19. Flask API → Browser: JSON { coin, market: {close_price, rsi, macd}, models: {...}, ensemble: {direction, probability, confidence} }
20. Browser → Browser: Render prediction card
21. Browser → Next.js App: POST /api/predictions/save { coin, ensemble_direction, ensemble_probability, ... }
22. Next.js App → PostgreSQL DB: INSERT INTO prediction_history (...)
23. Next.js App → PostgreSQL DB: INSERT INTO interval_snapshots (8 rows, locked_at=NULL)
24. PostgreSQL DB → Next.js App: OK
25. Next.js App → Browser: 200 OK (silent)
```

---

## 5. Component Diagram

```
Draw a detailed UML Component Diagram for the Coin-IQ platform showing all major software components and their dependencies/interfaces.

Components:

[Browser Layer]
- React Pages Component (Dashboard, Predictions, News, Learn, Admin, Markets, About, Legal)
- Shared UI Components (Navbar, Footer, CryptoTicker, EditProfileModal, AuthModal)
- Chart Components (CandlestickChart, LineChart, RiskAssessment)
- PredictionDashboard Component

[Next.js Server Layer]
- Auth API Module (/api/auth/login, signup, otp, logout, me, forgot-password)
- Profile API Module (/api/profile)
- Admin API Module (/api/admin/auth, data, users, lms)
- Crypto API Module (/api/crypto, /api/crypto/[id], /api/crypto/history)
- News API Module (/api/news, /api/news/article)
- Predictions API Module (/api/predictions/save, history, daily, lock-intervals, check-outcomes)
- LMS API Module (/api/learn/courses, progress, quiz, certificate)
- Next.js Rewrite Proxy (rewrites /flask-api/* → http://localhost:5000/*)

[Flask ML API Layer]
- Flask App Core (routing, CORS, startup)
- XGBoost Predictor (20 per-coin models)
- LightGBM Predictor (1 universal model)
- Random Forest Predictor (1 universal model)
- LSTM Predictor (Keras sequential model)
- Binance Feature Builder (klines + 80+ indicators)
- News Sentiment Service (RSS + VADER)
- APScheduler (save_predictions job + lock_intervals job)
- Persistent State Manager (scheduler_state.json)

[Data Layer]
- PostgreSQL Database
  - users, admins, otp_verifications tables
  - lms_courses, lms_lessons, lms_quiz_questions, lms_user_progress, lms_certificates tables
  - prediction_history, interval_snapshots tables
  - news_articles table
- Model Artifacts Store (filesystem: Models/)
  - XGBoost JSON files (per coin)
  - LightGBM PKL + scaler
  - Random Forest PKL + scaler
  - LSTM .keras + scaler + metadata

[External Services]
- Binance Public API (market data)
- CoinDesk RSS Feed
- CoinTelegraph RSS Feed
- Decrypt RSS Feed
- EmailJS (OTP and password emails)

Interfaces / connections:
- React Pages ↔ Next.js Server: HTTP fetch (internal)
- Next.js Server ↔ PostgreSQL: pg Pool (SQL)
- Next.js Server → Flask API: HTTP (via rewrite proxy)
- Flask API → Binance: HTTP REST
- Flask API → RSS Feeds: HTTP + XML parse
- Flask API → PostgreSQL: psycopg2 (interval locking)
- Flask APScheduler → Next.js /api/predictions/save: HTTP POST
- Browser ↔ Flask API: HTTP (via Next.js proxy rewrite)
```

---

## 6. Deployment Diagram

```
Draw a detailed UML Deployment Diagram for the Coin-IQ platform in its local development configuration.

Nodes and artifacts:

Node 1: Developer Machine (Windows 10/11)
  - Artifact: coin-iq/ (Next.js 16 application)
    - Execution Environment: Node.js 20 runtime
    - Port: 3000
    - Contains: React pages, API routes, middleware
    - Config: next.config.ts (rewrites /flask-api/* to http://localhost:5000/*)
  
  - Artifact: flask-api/ (Python 3.x Flask application)
    - Execution Environment: Python 3.10+ with venv
    - Port: 5000
    - Contains: app.py, binance_features.py, news_sentiment.py, model classes
    - Reads: scheduler_state.json (persistent scheduler state)
  
  - Artifact: Models/ (ML model artifacts — filesystem)
    - XGBoost JSON files (one per coin)
    - LightGBM .pkl + scaler.pkl
    - Random Forest .pkl + scaler.pkl
    - LSTM .keras + scaler.pkl + metadata.pkl
  
  - Artifact: PostgreSQL 14+ (database server)
    - Port: 5432
    - Database: coin_iq
    - Tables: users, admins, otp_verifications, password_reset_tokens,
              lms_courses, lms_lessons, lms_quiz_questions, lms_user_progress, lms_certificates,
              prediction_history, interval_snapshots, news_articles

Node 2: External Services (Internet)
  - Binance Public API (https://api.binance.com)
    - Used by: Flask API (klines, ticker), Next.js /api/crypto
  - CoinDesk RSS (https://www.coindesk.com/arc/outboundfeeds/rss/)
  - CoinTelegraph RSS (https://cointelegraph.com/rss)
  - Decrypt RSS (https://decrypt.co/feed)
  - EmailJS (https://api.emailjs.com) — OTP + password reset emails
  - CoinGecko CDN (https://assets.coingecko.com) — coin logo images

Node 3: User's Browser
  - React 19 client application
  - Communicates with Next.js on localhost:3000

Communication paths:
- Browser ↔ Next.js (HTTP, port 3000)
- Next.js ↔ Flask (HTTP, port 5000, via rewrite proxy for /flask-api/*)
- Next.js ↔ PostgreSQL (TCP, port 5432)
- Flask ↔ PostgreSQL (TCP, port 5432)
- Flask ↔ Binance (HTTPS)
- Flask ↔ RSS Feeds (HTTPS)
- Next.js ↔ Binance (HTTPS, for /api/crypto)
- Next.js ↔ RSS Feeds (HTTPS, for /api/news)
- Next.js ↔ EmailJS (HTTPS, for OTP/password emails)
```

---

## 7. DFD Diagram (Level 0 — Context Diagram)

```
Draw a Data Flow Diagram Level 0 (Context Diagram) for the Coin-IQ cryptocurrency prediction platform.

Central Process: Coin-IQ System

External Entities (with data flows):

1. User (Registered)
   → Login credentials, signup details, OTP code, profile updates, lesson completions, quiz answers → Coin-IQ System
   ← Prediction results, market data, news articles, course content, certificates, dashboard analytics ← Coin-IQ System

2. Guest (Unauthenticated)
   → Page requests → Coin-IQ System
   ← Landing page, ticker data, news list ← Coin-IQ System

3. Admin
   → Admin credentials, user management commands, LMS course/lesson/quiz data → Coin-IQ System
   ← Admin dashboard analytics, user lists, LMS stats, activity logs ← Coin-IQ System

4. Binance API (External)
   ← Market data requests (klines, 24h ticker) ← Coin-IQ System
   → OHLCV price data, volume, percentage change → Coin-IQ System

5. News RSS Feeds (CoinDesk, CoinTelegraph, Decrypt)
   ← RSS feed requests ← Coin-IQ System
   → News article XML (title, body, image, url, date) → Coin-IQ System

6. EmailJS Service
   ← OTP email request, auto-password email request ← Coin-IQ System
   → Email delivery confirmation → Coin-IQ System

Data stores referenced (shown as open-ended rectangles):
- PostgreSQL DB
- ML Model Files (filesystem)
- scheduler_state.json
```

---

## 8. DFD Diagram Level 1

```
Draw a Data Flow Diagram Level 1 for the Coin-IQ cryptocurrency prediction platform.
Decompose the central Coin-IQ System into its major internal processes.

Internal Processes:

P1: Authentication & User Management
  - Inputs: login credentials, signup form, OTP, profile updates
  - Outputs: auth tokens (JWT cookies), user profile data, OTP emails
  - Data stores: D1 (users table), D2 (otp_verifications table), D3 (admins table)
  - External: User, Admin, EmailJS

P2: Live Market Data Service
  - Inputs: crypto data requests from browser
  - Outputs: top coin prices, coin details, historical klines
  - Data stores: none (no caching — all from Binance)
  - External: Binance API
  - Feeds into: P3, P5, Browser

P3: ML Prediction Engine (Flask)
  - Inputs: coin symbol from browser/scheduler
  - Outputs: prediction result (direction, probability, confidence, 4-model breakdown)
  - Internal sub-processes:
    3a. Feature Engineering (Binance klines → 80+ technical indicators)
    3b. Sentiment Analysis (RSS → VADER scores)
    3c. XGBoost Prediction
    3d. LightGBM Prediction
    3e. Random Forest Prediction
    3f. LSTM Prediction
    3g. Ensemble Voting (average → direction + confidence)
  - Data stores: D4 (ML Model Files)
  - External: Binance API, RSS Feeds

P4: Prediction Persistence & History
  - Inputs: prediction results from P3, current prices from Binance
  - Outputs: historical accuracy data, interval accuracy cards, per-coin summaries
  - Sub-processes:
    4a. Save Prediction (insert into prediction_history + interval_snapshots)
    4b. Lock Interval Snapshots (compare outcome price after elapsed time)
    4c. Check Daily Records (group by date + interval)
    4d. Check Outcomes (update was_correct after 24h)
  - Data stores: D5 (prediction_history), D6 (interval_snapshots)
  - External: Binance API (outcome prices)

P5: News Aggregation & Storage
  - Inputs: RSS feed data
  - Outputs: paginated news list, full article content (scraped)
  - Sub-processes:
    5a. Fetch & Parse RSS Feeds
    5b. Extract Images & Body
    5c. Persist to DB (ON CONFLICT DO NOTHING)
    5d. Scrape Full Article (proxy server-side fetch)
  - Data stores: D7 (news_articles)
  - External: CoinDesk RSS, CoinTelegraph RSS, Decrypt RSS

P6: Learning Management System (LMS)
  - Inputs: course browse requests, lesson completions, quiz submissions
  - Outputs: course list + progress, quiz grading, certificate issuance
  - Sub-processes:
    6a. Sync Course Data to DB (lmsData.ts seed)
    6b. Track Lesson Progress
    6c. Grade Quiz & Issue Certificate
    6d. Serve Certificate (public)
  - Data stores: D8 (lms_courses, lms_lessons, lms_quiz_questions), D9 (lms_user_progress, lms_certificates)
  - External: User

P7: Admin Dashboard
  - Inputs: admin auth, management commands (CRUD users, LMS, certificates)
  - Outputs: analytics summaries, user lists, activity logs, LMS stats
  - Data stores: D1 (users), D3 (admins), D8 (LMS courses), D9 (LMS progress/certs)
  - External: Admin

P8: Scheduler & Automation
  - Inputs: timer tick (every 1 minute), scheduler_state.json (ON/OFF state)
  - Outputs: triggers P3 for each coin, triggers P4 lock & check-outcomes
  - Sub-processes:
    8a. Read persistent state (scheduler_state.json)
    8b. Save predictions job (calls P3 → P4 for all 20 coins)
    8c. Lock intervals job (updates D6 with outcomes)
    8d. Write persistent state on start/stop
  - Data stores: D10 (scheduler_state.json)

Data stores summary:
D1 — users table
D2 — otp_verifications table
D3 — admins table
D4 — ML Model Files (filesystem)
D5 — prediction_history table
D6 — interval_snapshots table
D7 — news_articles table
D8 — lms_courses, lms_lessons, lms_quiz_questions tables
D9 — lms_user_progress, lms_certificates tables
D10 — scheduler_state.json
```
