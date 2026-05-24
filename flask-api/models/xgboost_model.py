"""
XGBoost predictor — one model per coin, loaded from JSON files.
Supported coins: BTCUSDT, ETHUSDT, BNBUSDT, XRPUSDT, ADAUSDT, DOGEUSDT,
                 LTCUSDT, BCHUSDT, ETCUSDT, TRXUSDT, XLMUSDT, XMRUSDT,
                 NEOUSDT, EOSUSDT, DASHUSDT, ZECUSDT, IOTAUSDT, QTUMUSDT,
                 OMGUSDT, ZRXUSDT
"""

import os
import pandas as pd
import xgboost as xgb

# Per-coin thresholds from training summary
THRESHOLDS = {
    "ETCUSDT":  0.55, "BNBUSDT":  0.58, "ADAUSDT":  0.44, "ZRXUSDT":  0.51,
    "DASHUSDT": 0.58, "BTCUSDT":  0.52, "ZECUSDT":  0.41, "EOSUSDT":  0.49,
    "TRXUSDT":  0.52, "XMRUSDT":  0.51, "NEOUSDT":  0.43, "ETHUSDT":  0.47,
    "LTCUSDT":  0.53, "OMGUSDT":  0.50, "DOGEUSDT": 0.47, "XLMUSDT":  0.42,
    "BCHUSDT":  0.41, "IOTAUSDT": 0.51, "XRPUSDT":  0.47, "QTUMUSDT": 0.56,
}

ACCURACY = {
    "ETCUSDT": 0.7432, "BNBUSDT": 0.7412, "ADAUSDT": 0.7392, "ZRXUSDT": 0.7342,
    "DASHUSDT": 0.7332, "BTCUSDT": 0.7332, "ZECUSDT": 0.7322, "EOSUSDT": 0.7322,
    "TRXUSDT": 0.7322, "XMRUSDT": 0.7322, "NEOUSDT": 0.7292, "ETHUSDT": 0.7262,
    "LTCUSDT": 0.7262, "OMGUSDT": 0.7252, "DOGEUSDT": 0.7212, "XLMUSDT": 0.7202,
    "BCHUSDT": 0.7161, "IOTAUSDT": 0.7161, "XRPUSDT": 0.7131, "QTUMUSDT": 0.7111,
}


class XGBoostPredictor:
    def __init__(self, models_dir: str):
        self.models_dir = os.path.join(models_dir, "xgboost_70_export")
        self._models: dict[str, xgb.Booster] = {}
        self._feature_names: list[str] = []
        self._load_all()

    def _load_all(self):
        for coin in THRESHOLDS:
            path = os.path.join(self.models_dir, f"{coin}_xgboost.json")
            if os.path.exists(path):
                booster = xgb.Booster()
                booster.load_model(path)
                self._models[coin] = booster
                if not self._feature_names and booster.feature_names:
                    self._feature_names = booster.feature_names
        print(f"  [XGBoost] Loaded {len(self._models)} coin models")

    def is_ready(self) -> bool:
        return len(self._models) > 0

    def supported_coins(self) -> list[str]:
        return sorted(self._models.keys())

    def feature_names(self) -> list[str]:
        return self._feature_names

    def predict(self, coin: str, features: dict) -> dict:
        coin = coin.upper()
        if coin not in self._models:
            return {
                "error": f"Coin '{coin}' not supported. Available: {self.supported_coins()}"
            }

        booster   = self._models[coin]
        threshold = THRESHOLDS.get(coin, 0.5)

        try:
            # Build DataFrame with all expected features, fill missing with 0
            row = {f: features.get(f, 0) for f in self._feature_names}
            df  = pd.DataFrame([row])
            dm  = xgb.DMatrix(df, feature_names=self._feature_names)

            prob      = float(booster.predict(dm)[0])
            direction = "UP" if prob >= threshold else "DOWN"

            return {
                "model":     "xgboost",
                "coin":      coin,
                "direction": direction,
                "probability": round(prob, 4),
                "threshold": threshold,
                "accuracy":  ACCURACY.get(coin),
            }
        except Exception as e:
            return {"error": str(e)}


    def n_features(self) -> int:
        return len(self._feature_names)
