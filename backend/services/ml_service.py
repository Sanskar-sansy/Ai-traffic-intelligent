"""
services/ml_service.py
Wraps trained scikit-learn models to serve predictions via FastAPI routes.
"""
import os, joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


def _load(filename: str):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Model not found: {path}. Run train_models.py first."
        )
    return joblib.load(path)


# ── Traffic prediction ─────────────────────────────────────────────────────────

def predict_traffic(
    hour: int,
    road_length_km: float,
    road_width_lanes: int,
    num_vehicles: int,
    avg_speed_kmh: float,
) -> Dict[str, Any]:
    """
    Returns predicted density (float) and congestion level (0/1/2).
    Falls back to heuristic if models are not trained yet.
    """
    try:
        lr = _load("traffic_density_lr.pkl")
        rf = _load("traffic_congestion_rf.pkl")

        X = np.array([[hour, road_length_km, road_width_lanes,
                        num_vehicles, avg_speed_kmh]])

        density    = float(lr.predict(X)[0])
        congestion = int(rf.predict(X)[0])
    except FileNotFoundError:
        # Fallback heuristic
        density    = round(num_vehicles / max(road_length_km * road_width_lanes, 0.1), 2)
        congestion = 2 if density > 15 else 1 if density > 8 else 0

    level_map  = {0: "Low", 1: "Medium", 2: "High"}
    congestion_label = level_map.get(congestion, "Unknown")

    return {
        "predicted_density":     round(density, 2),
        "congestion_level":      congestion,
        "congestion_label":      congestion_label,
        "vehicles_per_km":       round(num_vehicles / max(road_length_km, 0.1), 1),
        "recommendation":        _traffic_recommendation(congestion_label),
    }


def _traffic_recommendation(level: str) -> str:
    return {
        "Low":    "Road is clear. Normal driving conditions.",
        "Medium": "Moderate traffic. Expect minor delays.",
        "High":   "Heavy congestion. Consider alternate routes.",
    }.get(level, "Unknown conditions.")


# ── Time-series forecast ───────────────────────────────────────────────────────

def forecast_traffic(hours_ahead: int = 6) -> Dict[str, Any]:
    """
    ARIMA-style forecast using statsmodels if available,
    otherwise a synthetic sine-wave fallback.
    """
    ts_path = os.path.join(os.path.dirname(__file__), "..", "data", "timeseries_traffic.csv")

    try:
        df = pd.read_csv(ts_path, parse_dates=["timestamp"])
        series = df["vehicle_count"].tail(168).values   # last 7 days

        try:
            from statsmodels.tsa.arima.model import ARIMA
            model  = ARIMA(series, order=(2, 1, 2)).fit()
            fcst   = model.forecast(steps=hours_ahead).tolist()
        except Exception:
            # Simple moving-average fallback
            window = min(24, len(series))
            avg    = float(np.mean(series[-window:]))
            fcst   = [round(avg + np.random.normal(0, 5), 1) for _ in range(hours_ahead)]

    except FileNotFoundError:
        # Synthetic if no data file
        base = 80
        fcst = [round(base + 20 * np.sin(i * 0.5) + np.random.normal(0, 8), 1)
                for i in range(hours_ahead)]

    return {
        "hours_ahead":    hours_ahead,
        "forecast":       [max(0, round(v, 1)) for v in fcst],
        "labels":         [f"+{i+1}h" for i in range(hours_ahead)],
        "peak_predicted": max(fcst),
        "trough_predicted": min(fcst),
    }


# ── Road safety ────────────────────────────────────────────────────────────────

def analyze_road_safety(
    road_type: str,
    weather: str,
    time_of_day: str,
    speed_limit: int,
    past_accidents: int,
    lighting: str = "good",
) -> Dict[str, Any]:
    """
    Returns risk score, risk level, and safe-to-travel flag.
    Falls back to heuristic if models not trained.
    """
    try:
        rf       = _load("safety_classifier_rf.pkl")
        scaler   = _load("safety_scaler.pkl")
        encoders = _load("safety_encoders.pkl")
        feats    = _load("safety_features.pkl")

        rt_enc = encoders["road_type"].transform([road_type])[0]   if road_type   in encoders["road_type"].classes_   else 0
        wt_enc = encoders["weather"].transform([weather])[0]       if weather     in encoders["weather"].classes_     else 0
        td_enc = encoders["time_of_day"].transform([time_of_day])[0] if time_of_day in encoders["time_of_day"].classes_ else 0
        li_enc = encoders["lighting"].transform([lighting])[0]     if lighting    in encoders["lighting"].classes_    else 0

        X = np.array([[rt_enc, wt_enc, td_enc, speed_limit, past_accidents, li_enc]])
        safe = bool(rf.predict(X)[0])

        # Proxy risk score from feature weights
        risk_raw = (past_accidents * 4 + speed_limit * 0.3
                    + (weather in ["fog", "snow"]) * 20
                    + (time_of_day == "night") * 15
                    + (lighting == "poor") * 10)
        risk_score = min(100, round(risk_raw, 1))
    except FileNotFoundError:
        # Heuristic fallback
        risk_raw = (past_accidents * 4 + speed_limit * 0.3
                    + (weather in ["fog", "snow"]) * 20
                    + (time_of_day == "night") * 15
                    + (lighting == "poor") * 10)
        risk_score = min(100.0, round(risk_raw, 1))
        safe = risk_score < 60

    risk_level = "High" if risk_score > 66 else "Medium" if risk_score > 33 else "Low"

    return {
        "road_type":       road_type,
        "risk_score":      risk_score,
        "risk_level":      risk_level,
        "safe_to_travel":  safe,
        "past_accidents":  past_accidents,
        "recommendation":  _safety_recommendation(risk_level, safe),
        "factors": {
            "weather_impact":   weather in ["rain", "fog", "snow"],
            "night_driving":    time_of_day == "night",
            "high_speed_limit": speed_limit >= 100,
            "poor_lighting":    lighting == "poor",
        },
    }


def _safety_recommendation(level: str, safe: bool) -> str:
    if not safe:
        return "⚠️ High risk detected. Avoid this route if possible."
    return {
        "Low":    "✅ Route appears safe. Normal precautions advised.",
        "Medium": "🟡 Moderate risk. Drive carefully and stay alert.",
        "High":   "🔴 Significant risk factors present. Proceed with extreme caution.",
    }.get(level, "")
