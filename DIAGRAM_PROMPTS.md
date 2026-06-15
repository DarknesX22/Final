# Coin-IQ — Mermaid Diagrams

Go to https://mermaid.live → click "Code" tab → paste any block below → diagram renders instantly.

---

## 1. Use Case Diagram

```mermaid
graph TD
    subgraph Actors
        G([Guest])
        U([Registered User])
        A([Admin])
        F([Flask ML API])
        B([Binance API])
        R([RSS News Feeds])
    end

    subgraph Guest Use Cases
        UC1[View Landing Page]
        UC2[View Crypto Ticker]
        UC3[Browse News]
        UC4[Sign Up via OTP]
        UC5[Log In]
        UC6[Forgot Password]
    end

    subgraph Registered User Use Cases
        UC7[View Dashboard - Live Tab]
        UC8[View Dashboard - History Tab]
        UC9[Get Live Prediction for Coin]
        UC10[View Market vs Model Accuracy]
        UC11[Open Interval Detail Modal]
        UC12[Start / Stop Scheduler]
        UC13[Edit Profile]
        UC14[Browse Markets & Coins]
        UC15[View Analytics & Sentiment]
        UC16[Read Full News Article in Popup]
        UC17[Browse Learning Courses]
        UC18[Complete a Lesson]
        UC19[Take a Quiz]
        UC20[Earn a Certificate]
    end

    subgraph Admin Use Cases
        UC21[Access Admin Dashboard]
        UC22[View Platform Analytics]
        UC23[Manage Users CRUD]
        UC24[Manage LMS Courses]
        UC25[Revoke Certificates]
        UC26[Check Flask API Health]
    end

    subgraph System Use Cases
        UC27[Save Predictions Every Minute]
        UC28[Lock Interval Snapshots]
        UC29[Check Prediction Outcomes]
    end

    G --> UC1
    G --> UC2
    G --> UC3
    G --> UC4
    G --> UC5
    G --> UC6

    U --> UC7
    U --> UC8
    U --> UC9
    U --> UC10
    U --> UC11
    U --> UC12
    U --> UC13
    U --> UC14
    U --> UC15
    U --> UC16
    U --> UC17
    U --> UC18
    U --> UC19
    U --> UC20

    A --> UC21
    A --> UC22
    A --> UC23
    A --> UC24
    A --> UC25
    A --> UC26

    F --> UC27
    F --> UC28
    F --> UC29

    UC9 --> B
    UC27 --> B
    UC29 --> B
    UC3 --> R
    UC16 --> R

    UC19 -.->|extends| UC18
    UC20 -.->|extends| UC19
    UC4 -.->|includes| UC5
    UC8 -.->|includes| UC10
```

---

## 2. Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +string name
        +string email
        +string passwordHash
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Admin {
        +int id
        +string name
        +string email
        +string passwordHash
        +string role
        +DateTime createdAt
    }

    class OtpVerification {
        +int id
        +string email
        +string otpCode
        +DateTime expiresAt
        +bool verified
        +int attempts
        +DateTime lockedUntil
    }

    class LmsCourse {
        +int id
        +string slug
        +string title
        +string description
        +string level
        +int lessonCount
        +int quizCount
        +string icon
    }

    class LmsLesson {
        +int id
        +int courseId
        +string title
        +string content
        +int order
    }

    class LmsQuizQuestion {
        +int id
        +int courseId
        +string question
        +string[] options
        +string correctAnswer
    }

    class LmsUserProgress {
        +int id
        +int userId
        +int courseId
        +int[] completedLessons
        +bool quizPassed
        +bool completed
    }

    class LmsCertificate {
        +int id
        +int userId
        +int courseId
        +string certificateId
        +DateTime issuedAt
    }

    class PredictionHistory {
        +int id
        +string coin
        +DateTime predictedAt
        +float priceAtPrediction
        +string ensembleDirection
        +float ensembleProbability
        +float outcomePrice
        +bool wasCorrect
    }

    class IntervalSnapshot {
        +int id
        +string sessionId
        +string coin
        +int intervalMinutes
        +DateTime predictedAt
        +float priceAtPrediction
        +string ensembleDirection
        +string actualDirection
        +float outcomePrice
        +bool wasCorrect
        +DateTime lockedAt
    }

    class NewsArticle {
        +int id
        +string title
        +string source
        +DateTime publishedAt
        +string description
        +string body
        +string url
        +string imageUrl
    }

    class XGBoostPredictor {
        +dict models
        +dict thresholds
        +predict(coin, features) PredictionResult
    }

    class LGBMPredictor {
        +model
        +scaler
        +list featureCols
        +predict(features) PredictionResult
    }

    class RandomForestPredictor {
        +model
        +scaler
        +list featureCols
        +predict(features) PredictionResult
    }

    class LSTMPredictor {
        +model
        +scaler
        +metadata
        +predict(sequence) PredictionResult
    }

    class BinanceFeatureBuilder {
        +fetchKlines(symbol) DataFrame
        +addIndicators(df) DataFrame
        +addSentiment(df, coin) DataFrame
        +buildFeaturesForCoin(symbol) FeatureSet
    }

    class NewsSentimentService {
        +getRssArticles() list
        +computeSentiment(articles) dict
        +getSentiment(coin) SentimentScore
    }

    class EnsembleOrchestrator {
        +runAllModels(coin) EnsembleResult
        +computeEnsemble(results) direction, probability
    }

    User "1" --> "many" LmsUserProgress
    User "1" --> "many" LmsCertificate
    LmsCourse "1" --> "many" LmsLesson
    LmsCourse "1" --> "many" LmsQuizQuestion
    LmsCourse "1" --> "many" LmsUserProgress
    LmsCourse "1" --> "many" LmsCertificate
    EnsembleOrchestrator --> XGBoostPredictor
    EnsembleOrchestrator --> LGBMPredictor
    EnsembleOrchestrator --> RandomForestPredictor
    EnsembleOrchestrator --> LSTMPredictor
    BinanceFeatureBuilder --> EnsembleOrchestrator
    NewsSentimentService --> BinanceFeatureBuilder
```

---

## 3. Activity Diagram

```mermaid
flowchart TD
    Start([User Opens Dashboard]) --> CheckAuth{Auth Token\nValid?}
    CheckAuth -- No --> ShowLogin[Show Login / Signup Form]
    ShowLogin --> Login[User Logs In]
    Login --> CheckAuth
    CheckAuth -- Yes --> LoadDash[Load Dashboard Shell]

    LoadDash --> FetchProfile[Fetch User Profile\nfrom PostgreSQL]
    LoadDash --> FetchCrypto[Fetch Top 20 Coins\nfrom Binance via /api/crypto]

    FetchProfile --> ShowDash[Render Dashboard UI]
    FetchCrypto --> ShowDash

    ShowDash --> TriggerPreds[Trigger Parallel Prediction\nRequests for all 20 Coins]

    subgraph Flask ML - Per Coin
        FetchKlines[Fetch 1h Klines\nfrom Binance]
        ComputeIndicators[Compute 80+ Technical\nIndicators - RSI MACD BB EMA]
        FetchSentiment[Fetch RSS News\nCompute VADER Sentiment]
        RunXGB[Run XGBoost]
        RunLGBM[Run LightGBM]
        RunRF[Run Random Forest]
        RunLSTM[Run LSTM]
        Ensemble[Compute Ensemble\nAvg Probability + Direction]

        FetchKlines --> ComputeIndicators
        ComputeIndicators --> FetchSentiment
        FetchSentiment --> RunXGB
        FetchSentiment --> RunLGBM
        FetchSentiment --> RunRF
        FetchSentiment --> RunLSTM
        RunXGB --> Ensemble
        RunLGBM --> Ensemble
        RunRF --> Ensemble
        RunLSTM --> Ensemble
    end

    TriggerPreds --> FetchKlines
    Ensemble --> ShowCard[Render Prediction Card\nCoin, Price, Signal, RSI, Risk, Models]

    ShowCard --> SavePred[POST /api/predictions/save\nFire and Forget]
    SavePred --> InsertHistory[INSERT prediction_history]
    SavePred --> InsertSnapshots[INSERT interval_snapshots\n8 rows - 10min to 24h]

    ShowCard --> UserTab{User Switches\nto History Tab?}
    UserTab -- Yes --> SelectDate[User Selects a Date]
    SelectDate --> FetchDaily[GET /api/predictions/daily\ndate=YYYY-MM-DD]
    FetchDaily --> LockIntervals[Trigger lock-intervals\nBackground]
    FetchDaily --> ShowCards[Display 8 Interval\nAccuracy Cards]
    ShowCards --> ClickView{User Clicks\nView Button?}
    ClickView -- Yes --> OpenModal[Open Interval Detail Modal\nFull Coin Prediction Table]
    ClickView -- No --> End([End])
    OpenModal --> End
    UserTab -- No --> End
```

---

## 4. Sequence Diagram

```mermaid
sequenceDiagram
    actor Browser
    participant NextJS as Next.js App
    participant Flask as Flask API
    participant XGB as XGBoost
    participant LGBM as LightGBM
    participant RF as Random Forest
    participant LSTM as LSTM
    participant Binance as Binance API
    participant PG as PostgreSQL

    Browser->>NextJS: GET /dashboard (auth_token cookie)
    NextJS->>PG: SELECT * FROM users WHERE id = <jwt_sub>
    PG-->>NextJS: User profile row
    NextJS-->>Browser: Render dashboard shell (loading)

    Browser->>Flask: GET /flask-api/live/predict/BTCUSDT
    Flask->>Binance: GET /klines?symbol=BTCUSDT&interval=1h&limit=200
    Binance-->>Flask: 200 OHLCV rows
    Flask->>Flask: addIndicators() - RSI, MACD, BB, EMA, etc.
    Flask->>Flask: getSentiment("BTCUSDT") - VADER from RSS cache

    Flask->>XGB: predict(features_row)
    XGB-->>Flask: direction=UP, probability=0.72

    Flask->>LGBM: predict(features_row)
    LGBM-->>Flask: direction=UP, probability=0.68

    Flask->>RF: predict(features_row)
    RF-->>Flask: direction=UP, probability=0.71

    Flask->>LSTM: predict(sequence_24_rows)
    LSTM-->>Flask: direction=UP, probability=0.65

    Flask->>Flask: ensemble = avg(0.72,0.68,0.71,0.65) = 0.69
    Flask-->>Browser: JSON { coin, market, models, ensemble{UP, 0.69, 38%} }

    Browser->>Browser: Render prediction card

    Browser->>NextJS: POST /api/predictions/save
    NextJS->>PG: INSERT INTO prediction_history (...)
    NextJS->>PG: INSERT INTO interval_snapshots (8 rows, locked_at=NULL)
    PG-->>NextJS: OK
    NextJS-->>Browser: 200 OK (silent)

    Note over Browser,PG: User switches to History Tab

    Browser->>NextJS: GET /api/predictions/daily?date=2026-06-10
    NextJS->>Binance: GET /ticker/price (outcome prices for lock-intervals)
    Binance-->>NextJS: current prices
    NextJS->>PG: UPDATE interval_snapshots SET was_correct, outcome_price WHERE elapsed
    NextJS->>PG: SELECT intervals + coins WHERE date = 2026-06-10
    PG-->>NextJS: interval groups with accuracy
    NextJS-->>Browser: { intervals: [...], overall: {...}, coin_summary: [...] }
    Browser->>Browser: Render 8 interval accuracy cards with coin icons
```

---

## 5. Component Diagram

```mermaid
graph TB
    subgraph Browser["🌐 Browser Layer"]
        Pages["React Pages\nDashboard / Predictions / News\nLearn / Admin / Markets"]
        UIComp["Shared UI Components\nNavbar / Footer / CryptoTicker\nEditProfileModal / AuthModal"]
        Charts["Chart Components\nCandlestickChart / LineChart\nRiskAssessment"]
        PredDash["PredictionDashboard\nComponent"]
    end

    subgraph NextJS["⚙️ Next.js Server :3000"]
        AuthAPI["Auth API Module\n/api/auth/*"]
        ProfileAPI["Profile API\n/api/profile"]
        AdminAPI["Admin API Module\n/api/admin/*"]
        CryptoAPI["Crypto API\n/api/crypto/*"]
        NewsAPI["News API\n/api/news + /api/news/article"]
        PredAPI["Predictions API\n/api/predictions/*"]
        LmsAPI["LMS API\n/api/learn/*"]
        Proxy["Next.js Rewrite Proxy\n/flask-api/* → :5000/*"]
        Middleware["Auth Middleware\nRoute protection"]
    end

    subgraph Flask["🐍 Flask ML API :5000"]
        FlaskCore["Flask App Core\nRouting + CORS"]
        XGBComp["XGBoost Predictor\n20 per-coin models"]
        LGBMComp["LightGBM Predictor\n1 universal model"]
        RFComp["Random Forest Predictor\n1 universal model"]
        LSTMComp["LSTM Predictor\nKeras sequential"]
        FeatEng["Binance Feature Builder\n80+ indicators"]
        SentSvc["News Sentiment Service\nRSS + VADER"]
        Scheduler["APScheduler\nsave_predictions every 1 min"]
        StateFile["Persistent State Manager\nscheduler_state.json"]
    end

    subgraph Data["🗄️ Data Layer"]
        PG[("PostgreSQL :5432\ncoin_iq database")]
        Models[("ML Model Files\nfilesystem Models/")]
    end

    subgraph External["🌍 External Services"]
        BinanceExt["Binance Public API"]
        RSS["RSS Feeds\nCoinDesk / CoinTelegraph\nDecrypt"]
        EmailJS["EmailJS\nOTP + Password Email"]
        CoinGecko["CoinGecko CDN\nCoin Images"]
    end

    Pages --> NextJS
    UIComp --> NextJS
    PredDash --> Proxy
    Proxy --> FlaskCore

    AuthAPI --> PG
    ProfileAPI --> PG
    AdminAPI --> PG
    PredAPI --> PG
    LmsAPI --> PG
    NewsAPI --> PG
    CryptoAPI --> BinanceExt
    NewsAPI --> RSS
    AuthAPI --> EmailJS

    FlaskCore --> FeatEng
    FeatEng --> XGBComp
    FeatEng --> LGBMComp
    FeatEng --> RFComp
    FeatEng --> LSTMComp
    FeatEng --> BinanceExt
    SentSvc --> RSS
    SentSvc --> FeatEng
    XGBComp --> Models
    LGBMComp --> Models
    RFComp --> Models
    LSTMComp --> Models
    Scheduler --> FlaskCore
    Scheduler --> StateFile
    Flask --> PG
```

---

## 6. Deployment Diagram

```mermaid
graph TB
    subgraph DevMachine["💻 Developer Machine - Windows 10/11"]

        subgraph NodeRuntime["Node.js 20 Runtime - Port 3000"]
            NextApp["coin-iq/\nNext.js 16 Application\nPages + API Routes + Middleware"]
        end

        subgraph PythonRuntime["Python 3.10+ Runtime - Port 5000"]
            FlaskApp["flask-api/\nFlask ML API\napp.py + models/"]
            StateJSON["scheduler_state.json\nPersistent scheduler ON/OFF"]
        end

        subgraph ModelStore["Filesystem - Models/"]
            XGBFiles["xgboost_70_export/\n*.json - 1 per coin"]
            LGBMFiles["LightBGM/\nlgbm_model.pkl + scaler"]
            RFFiles["Random Forest/\nrf_model.pkl + scaler"]
            LSTMFiles["LSTM/\nlstm_model.keras + scaler + metadata"]
        end

        subgraph DBServer["PostgreSQL 14+ - Port 5432"]
            DB[("coin_iq database\nusers, admins, otp_verifications\nlms_courses, lms_lessons\nlms_quiz_questions, lms_user_progress\nlms_certificates\nprediction_history\ninterval_snapshots\nnews_articles")]
        end

        NextApp -- "TCP :5432\npg Pool" --> DB
        FlaskApp -- "TCP :5432\npsycopg2" --> DB
        FlaskApp -- "reads" --> ModelStore
        FlaskApp -- "reads/writes" --> StateJSON
        NextApp -- "HTTP :5000\nrewrite proxy" --> FlaskApp
    end

    subgraph UserBrowser["🌐 User Browser"]
        Browser["Chrome / Firefox / Edge\nReact 19 Client"]
    end

    subgraph Internet["🌍 External Services"]
        Binance["api.binance.com\nPublic REST API"]
        CoinDeskRSS["coindesk.com RSS"]
        CTelegraphRSS["cointelegraph.com RSS"]
        DecryptRSS["decrypt.co RSS"]
        EmailJSExt["api.emailjs.com\nOTP + Password Emails"]
        CGeckoCDN["assets.coingecko.com\nCoin Logo Images"]
    end

    Browser -- "HTTP :3000" --> NextApp
    NextApp -- "HTTPS" --> Binance
    NextApp -- "HTTPS" --> CoinDeskRSS
    NextApp -- "HTTPS" --> CTelegraphRSS
    NextApp -- "HTTPS" --> DecryptRSS
    NextApp -- "HTTPS" --> EmailJSExt
    Browser -- "HTTPS" --> CGeckoCDN
    FlaskApp -- "HTTPS" --> Binance
    FlaskApp -- "HTTPS" --> CoinDeskRSS
    FlaskApp -- "HTTPS" --> CTelegraphRSS
    FlaskApp -- "HTTPS" --> DecryptRSS
```

---

## 7. DFD Level 0 — Context Diagram

```mermaid
graph LR
    U([Registered User]) -- "credentials, OTP,\nprofile updates,\nlesson completions,\nquiz answers" --> SYS
    SYS -- "predictions, market data,\nnews, courses,\ncertificates, dashboard" --> U

    G([Guest]) -- "page requests" --> SYS
    SYS -- "landing page,\nticker data, news list" --> G

    AD([Admin]) -- "admin credentials,\nuser management,\nLMS content commands" --> SYS
    SYS -- "analytics, user lists,\nLMS stats, activity logs" --> AD

    SYS((Coin-IQ\nSystem)) -- "klines request\nticker request" --> BIN([Binance API])
    BIN -- "OHLCV price data\nvolume, % change" --> SYS

    SYS -- "RSS fetch request" --> RSS([CoinDesk\nCoinTelegraph\nDecrypt RSS])
    RSS -- "news XML articles" --> SYS

    SYS -- "OTP email request\npassword email request" --> EJS([EmailJS])
    EJS -- "delivery confirmation" --> SYS

    SYS -- "coin logo requests" --> CDN([CoinGecko CDN])
    CDN -- "coin logo images" --> SYS
```

---

## 8. DFD Level 1

```mermaid
flowchart TD
    U([User])
    AD([Admin])
    BIN([Binance API])
    RSS([RSS Feeds])
    EJS([EmailJS])

    D1[(D1 users\nadmins)]
    D2[(D2 otp_verifications)]
    D3[(D3 prediction_history\ninterval_snapshots)]
    D4[(D4 ML Model Files)]
    D5[(D5 lms_courses\nlms_lessons\nlms_quiz_questions\nlms_user_progress\nlms_certificates)]
    D6[(D6 news_articles)]
    D7[(D7 scheduler_state.json)]

    P1["P1\nAuthentication &\nUser Management"]
    P2["P2\nLive Market\nData Service"]
    P3["P3\nML Prediction\nEngine - Flask"]
    P4["P4\nPrediction Persistence\n& History"]
    P5["P5\nNews Aggregation\n& Storage"]
    P6["P6\nLearning Management\nSystem"]
    P7["P7\nAdmin Dashboard"]
    P8["P8\nScheduler &\nAutomation"]

    U -- "credentials, OTP, profile" --> P1
    P1 -- "auth token, profile data" --> U
    P1 -- "OTP email" --> EJS
    P1 <--> D1
    P1 <--> D2

    U -- "crypto data request" --> P2
    P2 -- "coin prices, details" --> U
    P2 <--> BIN

    U -- "request prediction\nfor coin" --> P3
    P3 -- "prediction result\nUP/DOWN, probability" --> U
    P3 <--> BIN
    P3 <--> RSS
    P3 <--> D4

    P3 -- "prediction result" --> P4
    P4 -- "accuracy history\ninterval cards" --> U
    P4 <--> D3
    P4 <--> BIN

    U -- "browse news\nopen article" --> P5
    P5 -- "paginated news list\nfull article content" --> U
    P5 <--> RSS
    P5 <--> D6

    U -- "courses, lessons\nquiz, certificate" --> P6
    P6 -- "course content\nprogress, certificates" --> U
    P6 <--> D5

    AD -- "management commands" --> P7
    P7 -- "analytics, logs, lists" --> AD
    P7 <--> D1
    P7 <--> D5

    P8 -- "triggers every 1 min" --> P3
    P8 -- "triggers lock" --> P4
    P8 <--> D7
    D7 -- "ON/OFF state" --> P8
```
