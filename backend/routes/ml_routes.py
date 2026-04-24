"""
routes/ml_routes.py
Endpoints for traffic prediction, forecasting, and road safety analysis.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.ml_service import predict_traffic, forecast_traffic, analyze_road_safety
from services.weather_service import get_weather

router = APIRouter(prefix="/api", tags=["ml"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class TrafficPredictRequest(BaseModel):
    hour:              int   = Field(12, ge=0, le=23)
    road_length_km:    float = Field(2.0, gt=0)
    road_width_lanes:  int   = Field(4,   ge=1, le=20)
    num_vehicles:      int   = Field(50,  ge=0)
    avg_speed_kmh:     float = Field(40.0, ge=0)


class SafetyRequest(BaseModel):
    road_type:      str = "highway"
    weather:        str = "clear"
    time_of_day:    str = "afternoon"
    speed_limit:    int = Field(80, ge=10, le=200)
    past_accidents: int = Field(2, ge=0)
    lighting:       str = "good"


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/predict-traffic")
async def predict_traffic_route(body: TrafficPredictRequest):
    """Predict traffic density and congestion level using ML models."""
    try:
        result = predict_traffic(
            hour=body.hour,
            road_length_km=body.road_length_km,
            road_width_lanes=body.road_width_lanes,
            num_vehicles=body.num_vehicles,
            avg_speed_kmh=body.avg_speed_kmh,
        )
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/forecast")
async def forecast_route(hours: int = 6):
    """Return time-series traffic forecast for the next N hours."""
    if not (1 <= hours <= 48):
        raise HTTPException(400, "hours must be between 1 and 48")
    try:
        return {"status": "ok", **forecast_traffic(hours_ahead=hours)}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/road-safety")
async def road_safety_route(body: SafetyRequest):
    """Analyse road safety risk and return score + recommendation."""
    valid_road_types  = ["highway", "city", "rural", "residential", "intersection"]
    valid_weather     = ["clear", "rain", "fog", "snow", "windy"]
    valid_tod         = ["morning", "afternoon", "evening", "night"]
    valid_lighting    = ["good", "moderate", "poor"]

    if body.road_type   not in valid_road_types:  body.road_type   = "highway"
    if body.weather     not in valid_weather:      body.weather     = "clear"
    if body.time_of_day not in valid_tod:          body.time_of_day = "afternoon"
    if body.lighting    not in valid_lighting:     body.lighting    = "good"

    try:
        result = analyze_road_safety(
            road_type=body.road_type,
            weather=body.weather,
            time_of_day=body.time_of_day,
            speed_limit=body.speed_limit,
            past_accidents=body.past_accidents,
            lighting=body.lighting,
        )
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/weather")
def weather(city: str):
    return get_weather(city)