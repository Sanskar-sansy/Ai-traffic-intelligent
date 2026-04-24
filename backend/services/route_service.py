import requests
import pandas as pd
import os
import polyline

API_KEY = ""

# 📁 File path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
file_path = os.path.join(BASE_DIR, "data", "accident_data.csv")


# ─────────────────────────────────────────────
# 🌍 Get coordinates (Geocoding)
# ─────────────────────────────────────────────
def get_coordinates(city):
    url = "https://api.openrouteservice.org/geocode/search"

    params = {
        "api_key": API_KEY,
        "text": city + ", India"
    }

    res = requests.get(url, params=params).json()

    if "features" not in res or len(res["features"]) == 0:
        raise Exception(f"Location not found: {city}")

    return res["features"][0]["geometry"]["coordinates"]


# ─────────────────────────────────────────────
# 🗺️ Get route from ORS
# ─────────────────────────────────────────────
def fetch_route(start_coords, end_coords):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"

    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [start_coords, end_coords]
    }

    res = requests.post(url, json=body, headers=headers).json()

    if "routes" not in res:
        print(res)  # DEBUG
        raise Exception("Route API failed")

    route = res["routes"][0]

    distance = route["summary"]["distance"] / 1000
    duration = route["summary"]["duration"] / 3600

    # ✅ FIXED PART
    decoded = polyline.decode(route["geometry"])
    coords = [[lat, lng] for lat, lng in decoded]

    return distance, duration, coords

# ─────────────────────────────────────────────
# 🚗 Vehicle-based logic
# ─────────────────────────────────────────────
def apply_vehicle_factor(duration, vehicle):
    factors = {
        "car": 1.0,
        "bike": 0.8,
        "truck": 1.5
    }

    return duration * factors.get(vehicle, 1)


# ─────────────────────────────────────────────
# 🚦 Traffic Analysis
# ─────────────────────────────────────────────
def traffic_analysis(distance):
    avg_speed = 50

    base_time = distance / avg_speed
    congestion_factor = 0.3

    delay = base_time * congestion_factor
    adjusted_time = base_time + delay

    density = "high" if delay > 2 else "medium" if delay > 1 else "low"

    return adjusted_time, delay, density


# ─────────────────────────────────────────────
# 🚨 Safety Analysis
# ─────────────────────────────────────────────
def safety_analysis():
    try:
        df = pd.read_csv(file_path)
        total = len(df)

        if total > 100:
            risk = "High Risk"
        elif total > 50:
            risk = "Moderate"
        else:
            risk = "Safe"

        return {
            "risk": risk,
            "total_accidents": total
        }

    except Exception as e:
        return {
            "risk": "Unknown",
            "total_accidents": 0
        }


# ─────────────────────────────────────────────
# 🚀 MAIN FUNCTION (MULTI ROUTE)
# ─────────────────────────────────────────────
def get_routes(start, end, vehicle="car"):

    start_coords = get_coordinates(start)
    end_coords = get_coordinates(end)

    distance, duration, coords = fetch_route(start_coords, end_coords)

    # 🚗 apply vehicle logic
    duration = apply_vehicle_factor(duration, vehicle)

    # 🚦 traffic
    adjusted_time, delay, density = traffic_analysis(distance)

    # 🚨 safety
    safety = safety_analysis()

    # 🔥 simulate multiple routes
    routes = [
        {
            "label": "Fastest",
            "geometry": coords,
            "color": "#22c55e"
        },
        {
            "label": "Shortest",
            "geometry": coords[::-1],  # reverse for variation
            "color": "#f97316"
        },
        {
            "label": "Low Traffic",
            "geometry": coords,
            "color": "#ef4444"
        }
    ]

    return {
        "routes": routes,
        "distance": round(distance, 2),
        "estimated_time": round(duration, 2),
        "traffic_delay": round(delay, 2),
        "traffic_density": density,
        "safety": safety,
        "vehicle": vehicle
    }
