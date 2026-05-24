"""
Random Forest predictor — single model for all coins.
Features (28): coin, price_change_pct, vader_compound, vader_pos, vader_neg,
vader_neu, sentiment_label, finbert_score, finbert_label, fng_value,
fng_classification, social_score, BB_pct_b, RSI_14, Stoch_K, Stoch_D,
ROC_10, taker_buy_ratio, hour, day_of_week, dir_lag_1/2/3/6/12/24,
win_rate_24h, win_rate_72h
"""

import os
import joblib
import numpy as np
import pandas as pd


class RFPredictor:
    def __init__(self, models_dir: str):
        rf_dir = os.path.join(models_dir, "Random Forest")
        self._model   = joblib.load(os.path.join(rf_dir, "rf_crypto_model.pkl"))
        self._scaler  = joblib.load(os.path.join(rf_dir, "rf_crypto_scaler.pkl"))
        self._features: list[str] = joblib.load(os.path.join(rf_dir, "rf_feature_cols.pkl"))
        print(f"  [Random Forest] Loaded — {len(self._features)} features")

    def is_ready(self) -> bool:
        return self._model is not None

    def feature_names(self) -> list[str]:
        return self._features

    def n_features(self) -> int:
        return len(self._features)

    def predict(self, features: dict) -> dict:
        try:
            # Build full row — all 28 features, missing ones default to 0
            # 'coin' must be numeric (label-encoded) as the scaler was trained on all 28 cols
            row = {f: float(features.get(f, 0)) for f in self._features}
            df  = pd.DataFrame([row])

            # Scaler was trained on all 28 features including 'coin'
            df[self._features] = self._scaler.transform(df[self._features].values)

            prob      = float(self._model.predict_proba(df)[0][1])
            direction = "UP" if prob >= 0.5 else "DOWN"

            return {
                "model":       "random_forest",
                "direction":   direction,
                "probability": round(prob, 4),
            }
        except Exception as e:
            return {"error": str(e)}
