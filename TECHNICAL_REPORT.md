# Coin-IQ Technical Report

## 1. Overview

This repository implements a cryptocurrency prediction and learning platform called Coin-IQ.
It combines a Next.js 16.1.1 frontend/backend application with a separate Flask-based machine learning service.

- `coin-iq/`: primary UI and server-side app.
- `flask-api/`: Python ML prediction service.
- `Models/`: trained model artifacts.

## 2. Architecture

### 2.1 Frontend & App Router

- Built with Next.js App Router and TypeScript.
- Uses React 19.2.3 and Tailwind CSS v4.
- UI pages include home, login, signup, forgot-password, reset-password, dashboard, predictions, learn, news, profile, admin, legal.
- `src/components/` hosts reusable UI components and dashboard widgets.
- `src/hooks/` contains custom hooks for fetching crypto data and predictions.

### 2.2 Backend within Next.js

- Uses raw SQL through `pg` and a direct database connection pool.
- Authentication is JWT-based with HTTP-only cookies.
- Admin sessions use a separate JWT (`admin_auth_token`) managed by `jose`.
- LMS content is stored in code and synced to the database for tracking progress.
- Prediction history and lock intervals are saved to PostgreSQL.

### 2.3 Flask ML Service

- `flask-api/app.py` exposes ML prediction endpoints.
- Models are loaded once at startup.
- Supports separate routes for XGBoost, LightGBM, Random Forest, LSTM, and ensemble predictions.
- Implements live Binance feature engineering for real-time prediction.
- Uses Flask-Mail, Flask-CORS, APScheduler, and VADER sentiment.

## 3. Core Backend Files

### 3.1 Database Connection

- `coin-iq/src/lib/db.ts`
  - PostgreSQL pool config with `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`.

### 3.2 User & Auth Services

- `coin-iq/src/lib/userService.ts`
  - Creates users, verifies passwords with bcrypt, updates profiles, fetches users by email or ID.
- `coin-iq/src/lib/session.ts`
  - Creates/verifies user JWTs with `jsonwebtoken`.
  - Builds `auth_token` cookie values.
- `coin-iq/src/app/api/auth/login/route.ts`
  - Authenticates either admin or regular user.
  - Sets both user and admin cookies for admin login.
- `coin-iq/src/app/api/auth/signup/route.ts`
  - Creates a user and issues auth cookie.
- `coin-iq/src/app/api/auth/logout/route.ts`
  - Clears auth cookie.
- `coin-iq/src/app/api/auth/me/route.ts`
  - Returns authenticated user profile.

### 3.3 Admin Services

- `coin-iq/src/lib/adminService.ts`
  - Admin CRUD, password hashing, role updates.
- `coin-iq/src/lib/adminSession.ts`
  - Admin JWT creation, verification, cookie handling.
- `coin-iq/src/app/api/admin/auth/login/route.ts`
  - Admin login endpoint.
- `coin-iq/src/app/api/admin/auth/me/route.ts`
  - Returns admin metadata from cookie.
- `coin-iq/src/app/api/admin/auth/logout/route.ts`
  - Clears admin session.
- `coin-iq/src/app/api/admin/users/promote/route.ts`
  - Promotes a regular user to admin.
- `coin-iq/src/app/api/admin/users/demote/route.ts`
  - Demotes an admin to regular user.
- `coin-iq/src/app/api/admin/data/users/route.ts`
  - Lists users and admin roles.

### 3.4 Password Reset and OTP

- `coin-iq/src/app/api/auth/otp/send/route.ts`
  - Sends one-time OTP using EmailJS.
  - Stores OTP in `otp_verifications`.
- `coin-iq/src/app/api/auth/otp/verify-signup/route.ts`
  - Verifies OTP, creates user account, issues auth cookie.
- `coin-iq/src/app/api/auth/forgot-password/route.ts`
  - Generates a new random password and emails it using EmailJS.
- `coin-iq/src/app/api/auth/reset-password/validate/route.ts`
- `coin-iq/src/app/api/auth/reset-password/route.ts`
  - These routes exist, but the referenced `src/lib/passwordResetService.ts` is missing from the workspace.

## 4. LMS & Education

### 4.1 Course Content and Syncing

- `coin-iq/src/lib/lmsData.ts`
  - Hardcoded course content with lessons, quizzes, and explanations.
- `coin-iq/src/lib/lmsDbSync.ts`
  - Syncs `COURSES` into DB tables with idempotent upsert.

### 4.2 LMS APIs

- `coin-iq/src/app/api/learn/courses/route.ts`
  - Lists courses and includes user progress.
- `coin-iq/src/app/api/learn/courses/[slug]/route.ts`
  - Loads course details, lessons, quizzes, and progress.
- `coin-iq/src/app/api/learn/progress/route.ts`
  - Tracks lesson completion and returns progress.
- `coin-iq/src/app/api/learn/quiz/route.ts`
  - Grades quizzes server-side and issues certificates.

### 4.3 Admin LMS APIs

- Course management: `admin/lms/courses/route.ts`
- Lesson CRUD: `admin/lms/lessons/route.ts`
- Quiz CRUD: `admin/lms/quiz/route.ts`
- Progress analytics: `admin/lms/progress/route.ts`
- Certificate management: `admin/lms/certificates/route.ts`

## 5. Prediction & History Tracking

- `coin-iq/src/app/api/predictions/save/route.ts`
  - Saves prediction snapshots, ensemble direction, and time lock metadata.
- `coin-iq/src/app/api/predictions/daily/route.ts`
  - Returns daily prediction summaries and supports delete.
- `coin-iq/src/app/api/predictions/history/route.ts`
  - Returns historical saved predictions.
- `coin-iq/src/app/api/predictions/lock-intervals/route.ts`
  - Computes lock intervals for prediction snapshots.

## 6. News & Crypto Data

- `coin-iq/src/app/api/news/*` provides news aggregation and article parsing.
- `coin-iq/src/app/api/crypto/*` provides crypto lists and historical market data.
- News pages fetch and display RSS-derived articles.

## 7. Flask ML Backend

### 7.1 Primary Service

- `flask-api/app.py`
  - Loads four model classes and exposes endpoints for predictions.
  - Supports live Binance prediction routes.
  - Uses Flask-Mail, Flask-CORS, APScheduler, and dotenv.

### 7.2 Feature Engineering

- `flask-api/binance_features.py`
  - Fetches Binance hourly klines.
  - Builds technical indicators: EMA, MACD, Bollinger Bands, RSI, Stochastics, ATR, OBV, volume ratios, returns, lagged features, candle patterns, volatility, and interactions.
  - Adds sentiment features using live VADER scores.
  - Produces a single-row feature vector and a 24-step sequence for LSTM.

### 7.3 Sentiment

- `flask-api/news_sentiment.py`
  - Scrapes news and computes VADER sentiment scores.
  - Integrates sentiment into model features.

### 7.4 Models

- `flask-api/models/xgboost_model.py`
- `flask-api/models/lgbm_model.py`
- `flask-api/models/rf_model.py`
- `flask-api/models/lstm_model.py`

- `Models/` artifacts:
  - `LightBGM/lgbm_crypto_model.txt`
  - `LSTM/lstm_crypto_model.keras`
  - `xgboost_70_export/*.json`
  - Random Forest artifacts (folder present)

## 8. Database Schema

### 8.1 User/Auth Tables

- `users`
- `admins`
- `oauth_providers`
- `otp_verifications`
- `password_reset_tokens`

### 8.2 Prediction Tables

- `prediction_history`
- `prediction_lock_intervals`

### 8.3 LMS Tables

- `lms_courses`
- `lms_lessons`
- `lms_quiz_questions`
- `lms_user_progress`
- `lms_certificates`

### 8.4 Notes on Schema

- `schema.sql` defines auth, admin, OAuth, OTP, and password reset tables.
- `lms-schema.sql` defines course content, progress, and certificates.
- `predictions-schema.sql` defines prediction history and lock interval storage.

## 9. Security Considerations

### Good Practices

- Passwords hashed using bcrypt.
- Auth via HTTP-only cookies.
- Separate admin session JWT.
- Admin route authorization enforced in APIs.
- DB indexing on email and key fields.

### Risks / Gaps

- `passwordResetService.ts` is missing, making the token-based reset route incomplete.
- `forgot-password` directly resets passwords and emails the generated password, which is less secure than a token-based flow.
- EmailJS keys/templates are hardcoded in source.
- Some error handling returns generic failure messages but may still log internal details.

## 10. Deployment & Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:create`
- `npm run db:migrate`
- `npm run admin:init`

### Flask Requirements

- `flask-api/requirements.txt` includes:
  - flask, flask-cors, flask-mail, python-dotenv
  - pandas, numpy, scikit-learn, lightgbm, xgboost, tensorflow, joblib, vaderSentiment, apscheduler

## 11. Summary

The repository is a hybrid fullstack crypto platform with:

- user auth, OTP signup, admin roles
- LMS content, progress tracking, quiz certification
- prediction saving and analytics
- a separate Python ML service for live modeling

The main gap identified is the missing password reset support library, which should be added to complete the token-based reset flow.
