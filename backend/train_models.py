"""
train_models.py – Train all ML models and save them with joblib.
Run: python train_models.py
"""
import os, joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, r2_score

os.makedirs("models", exist_ok=True)

# ── 1. Traffic Density / Congestion Predictor ────────────────────────────────
print("Training traffic congestion model …")
df = pd.read_csv("data/traffic_data.csv")
feat_traffic = ["hour", "road_length_km", "road_width_lanes", "num_vehicles", "avg_speed_kmh"]
X = df[feat_traffic]
y_reg = df["density"]
y_cls = df["congestion_level"]

X_tr, X_te, yr_tr, yr_te = train_test_split(X, y_reg, test_size=0.2, random_state=42)
lr = LinearRegression().fit(X_tr, yr_tr)
print(f"  LinearRegression R²  : {r2_score(yr_te, lr.predict(X_te)):.3f}")

X_tr, X_te, yc_tr, yc_te = train_test_split(X, y_cls, test_size=0.2, random_state=42)
rf = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_tr, yc_tr)
print(f"  RandomForest accuracy: {accuracy_score(yc_te, rf.predict(X_te)):.3f}")

joblib.dump(lr, "models/traffic_density_lr.pkl")
joblib.dump(rf, "models/traffic_congestion_rf.pkl")
joblib.dump(feat_traffic, "models/traffic_features.pkl")

# ── 2. Road Safety Classifier ────────────────────────────────────────────────
print("Training road safety model …")
adf = pd.read_csv("data/accident_data.csv")
le_rt = LabelEncoder().fit(adf["road_type"])
le_wt = LabelEncoder().fit(adf["weather"])
le_td = LabelEncoder().fit(adf["time_of_day"])
le_li = LabelEncoder().fit(adf["lighting"])

adf["road_type_enc"]   = le_rt.transform(adf["road_type"])
adf["weather_enc"]     = le_wt.transform(adf["weather"])
adf["time_of_day_enc"] = le_td.transform(adf["time_of_day"])
adf["lighting_enc"]    = le_li.transform(adf["lighting"])

feat_safety = ["road_type_enc", "weather_enc", "time_of_day_enc",
               "speed_limit", "past_accidents", "lighting_enc"]
Xs = adf[feat_safety]
ys = adf["safe_to_travel"]
yr_s = adf["risk_score"]

Xs_tr, Xs_te, ys_tr, ys_te = train_test_split(Xs, ys, test_size=0.2, random_state=42)
rfs = RandomForestClassifier(n_estimators=100, random_state=42).fit(Xs_tr, ys_tr)
print(f"  Safety RF accuracy   : {accuracy_score(ys_te, rfs.predict(Xs_te)):.3f}")

scaler = StandardScaler().fit(Xs_tr)
Xs_tr_sc = scaler.transform(Xs_tr)
Xs_te_sc = scaler.transform(Xs_te)
lr_s = LogisticRegression(max_iter=500).fit(Xs_tr_sc, ys_tr)
print(f"  Safety LR accuracy   : {accuracy_score(ys_te, lr_s.predict(Xs_te_sc)):.3f}")

joblib.dump(rfs,    "models/safety_classifier_rf.pkl")
joblib.dump(lr_s,   "models/safety_classifier_lr.pkl")
joblib.dump(scaler, "models/safety_scaler.pkl")
joblib.dump({"road_type": le_rt, "weather": le_wt,
             "time_of_day": le_td, "lighting": le_li},
            "models/safety_encoders.pkl")
joblib.dump(feat_safety, "models/safety_features.pkl")

print("\n[✓] All models saved to /models/")
print("Models ready:\n"
      "  models/traffic_density_lr.pkl\n"
      "  models/traffic_congestion_rf.pkl\n"
      "  models/safety_classifier_rf.pkl\n"
      "  models/safety_classifier_lr.pkl\n"
      "  models/safety_scaler.pkl\n"
      "  models/safety_encoders.pkl")
