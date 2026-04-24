"""
Generate sample datasets for training ML models.
Run once: python generate_data.py
"""
import pandas as pd
import numpy as np
import os

np.random.seed(42)
N = 2000

# ── Traffic dataset ──────────────────────────────────────────────────────────
hours = np.random.randint(0, 24, N)
road_length = np.random.uniform(0.5, 10.0, N)   # km
road_width  = np.random.choice([2, 4, 6, 8], N)  # lanes
num_vehicles = (
    20 + hours * 3
    + road_width * 8
    + np.random.normal(0, 10, N)
).clip(5, 250).astype(int)

avg_speed = (
    80 - num_vehicles * 0.25
    + np.random.normal(0, 5, N)
).clip(5, 120)

density = num_vehicles / (road_length * road_width)
congestion = np.where(density > 15, 2,
             np.where(density > 8,  1, 0))       # 0=low 1=med 2=high

traffic_df = pd.DataFrame({
    "hour": hours,
    "road_length_km": road_length.round(2),
    "road_width_lanes": road_width,
    "num_vehicles": num_vehicles,
    "avg_speed_kmh": avg_speed.round(1),
    "density": density.round(2),
    "congestion_level": congestion,
})
traffic_df.to_csv("data/traffic_data.csv", index=False)
print(f"[✓] traffic_data.csv  — {len(traffic_df)} rows")

# ── Time-series hourly counts (30 days) ──────────────────────────────────────
dates = pd.date_range("2024-01-01", periods=30*24, freq="h")
base  = 80 + 40 * np.sin(np.linspace(0, 30*2*np.pi, len(dates)))
noise = np.random.normal(0, 10, len(dates))
ts_df = pd.DataFrame({
    "timestamp": dates,
    "vehicle_count": (base + noise).clip(5).astype(int),
})
ts_df.to_csv("data/timeseries_traffic.csv", index=False)
print(f"[✓] timeseries_traffic.csv — {len(ts_df)} rows")

# ── Accident dataset ──────────────────────────────────────────────────────────
road_types   = ["highway", "city", "rural", "residential", "intersection"]
weather_cond = ["clear", "rain", "fog", "snow", "windy"]
time_of_day  = ["morning", "afternoon", "evening", "night"]

road_type_enc = np.random.choice(road_types, N)
weather_enc   = np.random.choice(weather_cond, N)
tod_enc       = np.random.choice(time_of_day, N)
speed_limit   = np.random.choice([30, 50, 60, 80, 100, 120], N)
past_accidents= np.random.randint(0, 20, N)
lighting      = np.random.choice(["good", "moderate", "poor"], N)

risk_raw = (
    past_accidents * 0.4
    + (speed_limit / 20)
    + (weather_enc == "rain").astype(int) * 2
    + (weather_enc == "fog").astype(int) * 3
    + (tod_enc == "night").astype(int) * 2
    + (road_type_enc == "intersection").astype(int) * 2
    + np.random.normal(0, 1, N)
)
risk_score = ((risk_raw - risk_raw.min()) / (risk_raw.max() - risk_raw.min()) * 100).round(1)
risk_level = np.where(risk_score > 66, "High",
             np.where(risk_score > 33, "Medium", "Low"))

accident_df = pd.DataFrame({
    "road_type": road_type_enc,
    "weather": weather_enc,
    "time_of_day": tod_enc,
    "speed_limit": speed_limit,
    "past_accidents": past_accidents,
    "lighting": lighting,
    "risk_score": risk_score,
    "risk_level": risk_level,
    "safe_to_travel": (risk_score < 60).astype(int),
})
accident_df.to_csv("data/accident_data.csv", index=False)
print(f"[✓] accident_data.csv  — {len(accident_df)} rows")
print("\nAll datasets generated successfully.")
