# 🚦 AI Traffic Intelligence System

A production-ready, full-stack AI system for real-time traffic monitoring, vehicle detection, accident alerting, and traffic forecasting.

---

## 🏗 Architecture

```
traffic-ai-project/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # App entry point + WebSocket endpoints
│   ├── generate_data.py        # Sample dataset generator
│   ├── train_models.py         # ML model training pipeline
│   ├── requirements.txt
│   ├── data/                   # Generated CSV datasets
│   │   ├── traffic_data.csv
│   │   ├── timeseries_traffic.csv
│   │   └── accident_data.csv
│   ├── models/                 # Trained .pkl model files
│   ├── routes/
│   │   ├── video_routes.py     # /upload-video, /demo-analysis, /detect-accident
│   │   ├── ml_routes.py        # /predict-traffic, /forecast, /road-safety
│   │   └── alert_routes.py     # /alerts CRUD
│   └── services/
│       ├── vehicle_detector.py # OpenCV background subtraction + tracking
│       ├── video_service.py    # Video upload analyser + live stream processor
│       ├── ml_service.py       # sklearn wrappers for all ML models
│       └── alert_manager.py    # In-memory alert store
│
└── frontend/                   # React + Vite + Tailwind CSS
    └── src/
        ├── App.jsx             # Router + global toast system
        ├── pages/
        │   ├── LiveFeedPage.jsx    # WebSocket live dashboard
        │   ├── UploadPage.jsx      # Video upload + frame analysis
        │   ├── PredictPage.jsx     # ML traffic prediction with sliders
        │   ├── ForecastPage.jsx    # ARIMA time-series forecast
        │   ├── SafetyPage.jsx      # Road safety risk analyser
        │   └── AlertsPage.jsx      # Alert history + management
        ├── components/
        │   ├── Sidebar.jsx         # Navigation sidebar
        │   ├── UI.jsx              # StatCard, Panel, Badge, Spinner
        │   └── AlertToast.jsx      # Toast notification system
        ├── hooks/
        │   └── useWebSocket.js     # Auto-reconnecting WS hook
        └── services/
            └── api.js              # Axios API client
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Generate sample datasets (2000 rows each)
python generate_data.py

# Train ML models (saves to models/)
python train_models.py

# Start the API server
uvicorn main:app --reload --port 8000
```

API is now live at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api → localhost:8000)
npm run dev
```

Dashboard is now live at **http://localhost:3000**

### 3. Production Build

```bash
# Frontend
cd frontend && npm run build   # outputs to dist/

# Backend (with gunicorn)
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload-video` | Analyse uploaded traffic video |
| `GET`  | `/api/demo-analysis` | Run synthetic demo (no file needed) |
| `GET`  | `/api/detect-accident` | Heuristic accident detection |
| `POST` | `/api/predict-traffic` | ML traffic density prediction |
| `GET`  | `/api/forecast?hours=6` | ARIMA time-series forecast |
| `POST` | `/api/road-safety` | Road risk score + recommendation |
| `GET`  | `/api/alerts` | Get alert history |
| `DELETE` | `/api/alerts/clear` | Clear all alerts |
| `WS`   | `/ws/live-feed` | Real-time traffic data stream |
| `WS`   | `/ws/alerts` | Real-time alert push notifications |

### Example: Traffic Prediction

```bash
curl -X POST http://localhost:8000/api/predict-traffic \
  -H "Content-Type: application/json" \
  -d '{
    "hour": 8,
    "road_length_km": 3.0,
    "road_width_lanes": 4,
    "num_vehicles": 120,
    "avg_speed_kmh": 25
  }'
```

Response:
```json
{
  "predicted_density": 10.2,
  "congestion_level": 1,
  "congestion_label": "Medium",
  "vehicles_per_km": 40.0,
  "recommendation": "Moderate traffic. Expect minor delays."
}
```

### Example: Road Safety

```bash
curl -X POST http://localhost:8000/api/road-safety \
  -H "Content-Type: application/json" \
  -d '{
    "road_type": "intersection",
    "weather": "fog",
    "time_of_day": "night",
    "speed_limit": 60,
    "past_accidents": 8,
    "lighting": "poor"
  }'
```

---

## 🧠 ML Models

| Model | Algorithm | Accuracy / R² |
|-------|-----------|----------------|
| Traffic density | Linear Regression | R² ≈ 0.52 |
| Congestion classification | Random Forest (100 trees) | ~97% accuracy |
| Road safety classification | Random Forest (100 trees) | ~89% accuracy |
| Time-series forecast | ARIMA(2,1,2) → MA fallback | — |

All models are retrained from scratch by running `python train_models.py`. Models persist as `.pkl` files in the `models/` directory.

---

## 🎥 Vehicle Detection Pipeline

```
Video Frame
    │
    ▼
Background Subtraction (MOG2)
    │
    ▼
Morphological Cleanup (open → close)
    │
    ▼
Contour Detection → Bounding Boxes
    │
    ▼
Nearest-Neighbour Tracking (IoU + distance)
    │
    ▼
Speed Estimation (px displacement × FPS / calibration)
    │
    ▼
Accident Detection (overlap + speed drop heuristics)
    │
    ▼
Annotated Frame + DetectionResult
```

> **Production upgrade path:** Replace `_detect_blobs()` in `vehicle_detector.py` with a YOLOv8 call (`model = YOLO('yolov8n.pt'); results = model(frame)`) and plug DeepSORT for robust multi-object tracking.

---

## 🔌 WebSocket Protocol

### `/ws/live-feed` — Server → Client (every 1s)
```json
{
  "tick": 42,
  "timestamp": 1720000000.0,
  "vehicle_count": 18,
  "avg_speed": 52.3,
  "accident": false,
  "severity": "None",
  "alerts": { "total": 3, "unread": 1 },
  "hourly_volumes": [10, 12, ...],
  "speed_histogram": [48, 55, 61, ...]
}
```

### `/ws/alerts` — Server → Client (on change, every 2s)
```json
{
  "alerts": [...],
  "stats": { "total": 5, "unread": 2, "by_severity": {...} }
}
```

---

## 🐳 Docker Support (Optional)

```yaml
# docker-compose.yml
version: '3.9'
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes: ["./backend/models:/app/models", "./backend/data:/app/data"]

  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [backend]
```

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN python generate_data.py && python train_models.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🗺 Roadmap / Bonus Features

- [ ] **YOLOv8 integration** — swap background subtraction with real YOLO inference
- [ ] **DeepSORT tracking** — robust multi-object tracking across frames
- [ ] **Traffic heatmap** — density overlay on map using Leaflet.js
- [ ] **Multi-camera support** — tabbed feed switcher in UI
- [ ] **Frame snapshot storage** — save accident frames to S3/disk
- [ ] **Email / SMS alerts** — SMTP + Twilio integration
- [ ] **Map integration** — accident pins on interactive map

---

## 📄 License

MIT — free to use, modify, and distribute.
