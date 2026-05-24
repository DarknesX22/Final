"""
LSTM predictor — sequence model expecting 24 timesteps × 41 features.
Target: direction_next_1d (binary: 0=DOWN, 1=UP)
"""

import os
import joblib
import numpy as np


class LSTMPredictor:
    def __init__(self, models_dir: str):
        lstm_dir = os.path.join(models_dir, "LSTM")

        # Load Keras model lazily to avoid TF import at module level
        import tensorflow as tf
        self._model  = tf.keras.models.load_model(
            os.path.join(lstm_dir, "lstm_crypto_model.keras")
        )
        self._scaler = joblib.load(os.path.join(lstm_dir, "lstm_crypto_scaler.pkl"))
        meta         = joblib.load(os.path.join(lstm_dir, "lstm_crypto_metadata.pkl"))

        self._features: list[str] = meta["FEATURE_COLS"]
        self._seq_len: int        = meta["SEQ_LEN"]       # 24
        self._n_features: int     = meta["N_FEATURES"]    # 41
        print(f"  [LSTM] Loaded — seq_len={self._seq_len}, features={self._n_features}")

    def is_ready(self) -> bool:
        return self._model is not None

    def feature_names(self) -> list[str]:
        return self._features

    def n_features(self) -> int:
        return self._n_features

    def seq_len(self) -> int:
        return self._seq_len

    def predict(self, sequence: list[dict]) -> dict:
        """
        sequence: list of dicts, each dict is one timestep with feature values.
        Must have exactly seq_len (24) timesteps.
        Missing features default to 0.
        """
        try:
            if len(sequence) != self._seq_len:
                return {
                    "error": f"Expected {self._seq_len} timesteps, got {len(sequence)}"
                }

            # Build (seq_len, n_features) array — all features including 'coin', missing default to 0
            # Scaler was trained on all features including 'coin' as numeric
            rows = []
            for step in sequence:
                row = [float(step.get(f, 0)) for f in self._features]
                rows.append(row)

            arr = np.array(rows, dtype=np.float32)  # (24, n_numeric)

            # Scale — scaler expects (n_samples, n_features)
            arr_scaled = self._scaler.transform(arr)

            # Reshape to (1, seq_len, n_features)
            X = arr_scaled.reshape(1, self._seq_len, arr_scaled.shape[1])

            prob      = float(self._model.predict(X, verbose=0)[0][0])
            direction = "UP" if prob >= 0.5 else "DOWN"

            return {
                "model":       "lstm",
                "direction":   direction,
                "probability": round(prob, 4),
            }
        except Exception as e:
            return {"error": str(e)}
