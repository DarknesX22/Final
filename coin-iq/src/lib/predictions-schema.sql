-- Stores every prediction made by the ensemble + individual models
CREATE TABLE IF NOT EXISTS prediction_history (
  id              SERIAL PRIMARY KEY,
  coin            VARCHAR(20)  NOT NULL,
  predicted_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Price at prediction time
  price_at_prediction NUMERIC(20, 8) NOT NULL,

  -- Ensemble result
  ensemble_direction  VARCHAR(4)  NOT NULL,  -- 'UP' | 'DOWN'
  ensemble_probability NUMERIC(6,4) NOT NULL,
  ensemble_confidence  VARCHAR(10),

  -- Individual model probabilities
  xgb_direction   VARCHAR(4),
  xgb_probability NUMERIC(6,4),
  lgbm_direction  VARCHAR(4),
  lgbm_probability NUMERIC(6,4),
  rf_direction    VARCHAR(4),
  rf_probability  NUMERIC(6,4),
  lstm_direction  VARCHAR(4),
  lstm_probability NUMERIC(6,4),

  -- Technical indicators at prediction time
  rsi             NUMERIC(8,4),
  macd            NUMERIC(12,6),
  bb_pct_b        NUMERIC(8,4),

  -- Outcome (filled in ~24h later by a background check)
  outcome_price   NUMERIC(20, 8),           -- actual price 24h later
  outcome_direction VARCHAR(4),             -- actual direction ('UP'|'DOWN')
  outcome_checked_at TIMESTAMP WITH TIME ZONE,
  was_correct     BOOLEAN                   -- ensemble prediction correct?
);

CREATE INDEX IF NOT EXISTS idx_pred_coin        ON prediction_history(coin);
CREATE INDEX IF NOT EXISTS idx_pred_predicted_at ON prediction_history(predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pred_coin_time   ON prediction_history(coin, predicted_at DESC);
