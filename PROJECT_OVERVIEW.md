# Coin-IQ Project Overview

This document explains what has been built in the Coin-IQ final year project, how the system is organized, and which major features are already implemented.

## 1. Project Summary

Coin-IQ is a cryptocurrency prediction and learning platform. The project combines a Next.js web application with a Flask machine learning API. The user-facing application provides live crypto market data, AI-based prediction screens, crypto news, authentication, user dashboards, profile management, and a learning module. The Flask service loads trained ML models and generates live predictions from Binance market data.

The main goal of the project is to help users understand crypto markets by combining:

- Real-time cryptocurrency data
- Technical indicators
- News sentiment
- Multiple machine learning models
- Ensemble prediction output
- Risk and confidence indicators
- Educational crypto courses
- Admin management tools

## 2. Repository Structure

```text
FYPFinal/
+-- coin-iq/       # Next.js application
+-- flask-api/     # Python Flask prediction API
+-- Models/        # Trained machine learning model files and exports
+-- CONTEXT.md     # Existing detailed internal context
+-- PROJECT_OVERVIEW.md
```

## 3. Main Technology Stack

### Frontend and Web App

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React icons
- React Hot Toast

### Backend

- Next.js API routes
- PostgreSQL
- JWT authentication with HttpOnly cookies
- bcrypt password hashing
- OAuth support for Google and Facebook
- Email support for password reset

### Machine Learning API

- Flask
- Flask-CORS
- pandas
- numpy
- scikit-learn
- XGBoost
- LightGBM
- TensorFlow/Keras
- VADER sentiment analysis

## 4. What We Have Built

### 4.1 Public Website

The project includes a full public-facing website with:

- Landing page
- Live crypto ticker
- Feature sections
- Prediction preview cards
- Testimonials
- Call-to-action sections
- Footer
- About page
- Markets page
- Coins page
- News page

The design uses a clean white, black, and gray visual style with cards, charts, animated sections, and responsive layouts.

### 4.2 Authentication System

The authentication system has been implemented with:

- Signup
- Login
- Logout
- Current user lookup
- Password reset request
- Password reset validation
- Password reset submission
- JWT tokens stored in HttpOnly cookies
- bcrypt password hashing
- Separate user and admin authentication flows
- Google OAuth routes
- Facebook OAuth routes

The normal user token is stored in `auth_token`. Admin authentication uses a separate admin cookie.

### 4.3 User Dashboard

The dashboard page gives logged-in users a central place to view:

- Live prediction summaries
- Market information
- Crypto data
- Learning module progress
- Certificates/progress-related information

The dashboard is protected, so users must be authenticated to access it.

### 4.4 Prediction System

The prediction section is one of the main parts of the project. It includes:

- A protected prediction page
- A blurred preview when the user is not logged in
- Login/signup form directly on the prediction page
- 20 supported cryptocurrency pairs
- Coin selector grid
- Live price card
- Ensemble prediction card
- Risk assessment card
- Expected next-price estimate
- Technical indicators
- News sentiment display
- Individual model breakdown
- Final decision card
- Historical candlestick chart
- Forecast line chart

The prediction page gets its data from the Flask API through the Next.js rewrite:

```text
/flask-api/* -> http://localhost:5000/*
```

### 4.5 Supported Coins

The ML prediction system supports 20 Binance USDT pairs:

```text
ADAUSDT
BCHUSDT
BNBUSDT
BTCUSDT
DASHUSDT
DOGEUSDT
EOSUSDT
ETCUSDT
ETHUSDT
IOTAUSDT
LTCUSDT
NEOUSDT
OMGUSDT
QTUMUSDT
TRXUSDT
XLMUSDT
XMRUSDT
XRPUSDT
ZECUSDT
ZRXUSDT
```

### 4.6 Machine Learning Models

The project includes four model families:

- XGBoost
- LightGBM
- Random Forest
- LSTM

The trained model files are stored under the `Models/` folder.

#### XGBoost

The XGBoost implementation uses per-coin model files stored in:

```text
Models/xgboost_70_export/
```

Each coin has:

- A model JSON file
- A results image
- A SHAP image

There is also a summary CSV for the exported results.

#### LightGBM

The LightGBM files are stored in:

```text
Models/LightBGM/
```

Included files:

- `lgbm_crypto_model.pkl`
- `lgbm_crypto_model.txt`
- `lgbm_crypto_scaler.pkl`
- `lgbm_feature_cols.pkl`

#### Random Forest

The Random Forest files are stored in:

```text
Models/Random Forest/
```

Included files:

- `rf_crypto_model.pkl`
- `rf_crypto_scaler.pkl`
- `rf_feature_cols.pkl`

#### LSTM

The LSTM files are stored in:

```text
Models/LSTM/
```

Included files:

- `lstm_crypto_model.keras`
- `lstm_crypto_scaler.pkl`
- `lstm_crypto_metadata.pkl`

### 4.7 Flask Prediction API

The Flask API lives in:

```text
flask-api/
```

Important files:

- `app.py`
- `binance_features.py`
- `news_sentiment.py`
- `test_api.py`
- `models/xgboost_model.py`
- `models/lgbm_model.py`
- `models/rf_model.py`
- `models/lstm_model.py`

The Flask API loads all four models at startup and exposes endpoints for health checks, model information, manual prediction, live prediction, all-coin prediction, and sentiment.

Main Flask endpoints:

```text
GET  /
GET  /health
GET  /models
POST /predict/xgboost
POST /predict/lgbm
POST /predict/rf
POST /predict/lstm
POST /predict/all
GET  /live/coins
GET  /live/predict/<coin>
GET  /live/predict/all-coins
GET  /sentiment
```

### 4.8 Live Feature Engineering

The file `flask-api/binance_features.py` fetches live Binance kline data and generates the features needed by the ML models.

The feature engineering includes:

- OHLCV values
- Returns
- RSI
- MACD
- Bollinger Bands
- Stochastic indicators
- ROC
- ATR
- OBV
- EMA features
- Volume ratios
- Candle pattern signals
- Lag features
- Rolling volatility
- Rolling win-rate features
- Encoded coin label
- Neutral fallback values for unavailable social/Fear and Greed features

### 4.9 News Sentiment

The project includes sentiment support through:

```text
flask-api/news_sentiment.py
```

Sentiment is calculated using VADER from live crypto RSS/news data. The prediction response includes a `sentiment` object with:

- Compound sentiment
- Positive score
- Negative score
- Neutral score
- Sentiment label
- Article count
- Source type
- Fetch timestamp

The prediction dashboard displays the sentiment as bullish, bearish, or neutral.

### 4.10 Crypto Market and News Features

The Next.js app includes crypto data and news functionality:

- `/api/crypto`
- `/api/crypto/[id]`
- `/api/crypto/history/[id]`
- `/api/news`

The app can show:

- Market tables
- Coin detail pages
- Price history
- News articles
- Paginated news views
- News modal/details behavior

### 4.11 Learning Management System

The learning module has been implemented with:

- Course catalog
- Course detail page
- Lesson viewer
- Quiz page
- Progress tracking
- Certificate issuing
- Public certificate page
- Admin course management

User routes include:

```text
/learn
/learn/[slug]
/learn/[slug]/quiz
/learn/certificate/[id]
```

User-facing LMS API routes include:

```text
GET  /api/learn/courses
GET  /api/learn/courses/[slug]
GET  /api/learn/progress
POST /api/learn/progress
POST /api/learn/quiz
GET  /api/learn/certificate/[id]
```

The seeded courses include:

- Blockchain Basics
- Ethereum & DeFi
- NFTs & Digital Assets
- Crypto Trading & Analysis

The passing score is 60%.

### 4.12 Admin System

The admin area has been implemented with:

- Admin login handling
- Admin dashboard
- User analytics
- User management
- LMS management
- Course management
- Lesson management
- Quiz management
- Certificate management
- Admin promote/demote routes
- Activity logs

Admin routes include:

```text
/admin
/admin/login
```

Admin API routes include:

```text
GET  /api/admin/auth/me
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/data/analytics
GET  /api/admin/data/users
DELETE /api/admin/data/users
GET  /api/admin/data/logs
POST /api/admin/users/promote
POST /api/admin/users/demote
GET  /api/admin/lms/courses
POST /api/admin/lms/courses
GET  /api/admin/lms/courses/[slug]
PUT  /api/admin/lms/courses/[slug]
DELETE /api/admin/lms/courses/[slug]
POST /api/admin/lms/lessons
PUT  /api/admin/lms/lessons
DELETE /api/admin/lms/lessons
POST /api/admin/lms/quiz
PUT  /api/admin/lms/quiz
DELETE /api/admin/lms/quiz
GET  /api/admin/lms/progress
GET  /api/admin/lms/certificates
DELETE /api/admin/lms/certificates
```

### 4.13 Database Work

The PostgreSQL database schema includes:

- `users`
- `admins`
- `oauth_providers`
- `password_reset_tokens`
- `otp_verifications`
- `lms_courses`
- `lms_user_progress`
- `lms_certificates`
- `lms_lessons`
- `lms_quiz_questions`

There are also indexes and triggers for performance and timestamp maintenance.

Important schema files:

```text
coin-iq/src/lib/schema.sql
coin-iq/src/lib/lms-schema.sql
coin-iq/src/lib/lms-schema-v2.sql
```

### 4.14 Profile Management

The project includes profile functionality:

- Profile edit page
- Profile API
- Edit profile component
- User service helpers

Profile API:

```text
GET /api/profile
PUT /api/profile
```

### 4.15 Password Reset

Password reset functionality includes:

- Forgot password page
- Reset password page
- Token validation
- Token storage in database
- Reset email support
- Password update flow

Related routes:

```text
POST /api/auth/forgot-password
GET  /api/auth/reset-password/validate
POST /api/auth/reset-password
```

### 4.16 GitHub Upload

The project has been committed and uploaded to GitHub.

Repository:

```text
https://github.com/DarknesX22/Final.git
```

Current uploaded branch:

```text
master
```

Initial commit:

```text
0f90c3f Initial project upload
```

## 5. How The Full System Works

### User Prediction Flow

1. User opens the Next.js app.
2. User logs in or signs up.
3. User opens the predictions page.
4. Next.js calls `/flask-api/live/predict/<coin>`.
5. Next.js rewrites that request to Flask on port `5000`.
6. Flask fetches live Binance market data.
7. Flask builds technical indicators and model features.
8. Flask runs XGBoost, LightGBM, Random Forest, and LSTM.
9. Flask calculates an ensemble prediction.
10. Flask returns price, indicators, sentiment, model outputs, and ensemble result.
11. Next.js displays the prediction dashboard.

### LMS Flow

1. User logs in.
2. User opens `/learn`.
3. Courses are loaded from the database.
4. User opens a course and completes lessons.
5. Progress is stored in PostgreSQL.
6. User takes the quiz.
7. Server grades the quiz.
8. If the score is at least 60%, a certificate is created.
9. User can view the certificate from a public certificate URL.

### Admin Flow

1. Admin logs in.
2. Admin opens `/admin`.
3. Admin can view analytics, users, LMS progress, courses, certificates, and logs.
4. Admin can create/edit/delete courses, lessons, and quiz questions.
5. Admin can promote or demote users.
6. Admin can revoke certificates.

## 6. Setup On A New Computer

### Clone The Repository

```bash
git clone https://github.com/DarknesX22/Final.git
cd Final
```

### Run The Next.js App

```bash
cd coin-iq
npm install
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

### Run The Flask API

Open another terminal:

```bash
cd flask-api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The Flask API runs at:

```text
http://localhost:5000
```

### Environment Variables

The `.env.local` file is not uploaded to GitHub because it contains secrets. It must be recreated on each computer.

Expected environment values include database, JWT, OAuth, email, and base URL settings.

Example:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=coin_iq
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=change_this_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
RESEND_API_KEY=your_resend_key
RESEND_FROM=onboarding@resend.dev
```

## 7. Important Notes

- `node_modules/` is not uploaded. Run `npm install` after cloning.
- `.next/` is not uploaded. It is generated by Next.js.
- `.env.local` is not uploaded for security.
- Python virtual environments are not uploaded. Create a new one on each computer.
- Flask must be running for live predictions to work.
- PostgreSQL must be configured for auth, admin, profile, and LMS features.
- The ML model files are included in the repository.
- Prediction output is educational and should not be treated as financial advice.

## 8. Current Project Status

The project currently contains:

- Complete Next.js frontend
- Authentication system
- User dashboard
- Prediction dashboard
- Flask prediction API
- Four ML model integrations
- Binance live data feature engineering
- News sentiment support
- Crypto market/news pages
- LMS course system
- Certificates
- Admin dashboard
- PostgreSQL schemas
- GitHub upload

Overall, Coin-IQ is a working full-stack AI crypto prediction platform with education and admin management features.
