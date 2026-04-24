from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import time

# 🔀 Existing Routers
from routes.route_api import router as route_router
from routes.video_routes import router as video_router
from routes.ml_routes import router as ml_router
from routes.alert_routes import router as alert_router

# 🔧 Existing Services
from services.alert_manager import alert_manager
from services.real_detection import process_video

# 🆕 NEW SERVICES (ADD THESE FILES)
from services.weather_service import get_weather
from services.route_service import get_routes


# ─────────────────────────────────────────────
# 🚀 Lifespan
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚦 AI Traffic Intelligence System starting...")
    yield
    print("🛑 System shutting down...")


# ─────────────────────────────────────────────
# 🌐 App Initialization
# ─────────────────────────────────────────────
app = FastAPI(
    title="AI Traffic Intelligence System",
    version="2.0.0",
    lifespan=lifespan
)


# ─────────────────────────────────────────────
# 🌍 CORS
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# 🔗 Include Routers
# ─────────────────────────────────────────────
app.include_router(route_router)
app.include_router(video_router)
app.include_router(ml_router)
app.include_router(alert_router)


# ─────────────────────────────────────────────
# 🏠 Basic Routes
# ─────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "AI Traffic Intelligence System",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": time.time()
    }


# ─────────────────────────────────────────────
# 🆕 REAL ROUTE API (MULTI ROUTE + VEHICLE)
# ─────────────────────────────────────────────
@app.get("/smart-route")
def smart_route(start: str, end: str, vehicle: str = "car"):
    return get_routes(start, end, vehicle)


# ─────────────────────────────────────────────
# 🆕 WEATHER API
# ─────────────────────────────────────────────
@app.get("/weather")
def weather(city: str):
    return get_weather(city)


# ─────────────────────────────────────────────
# 🔌 WebSocket Manager
# ─────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)


manager = ConnectionManager()


# ─────────────────────────────────────────────
# 🎥 Live Feed WebSocket
# ─────────────────────────────────────────────
@app.websocket("/ws/live-feed")
async def live_feed_ws(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        for data in process_video():
            data["timestamp"] = time.time()
            data["alerts"] = alert_manager.stats()

            # 🆕 add traffic density
            data["traffic_density"] = "high" if data.get("vehicle_count", 0) > 15 else "low"

            await websocket.send_json(data)
            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("🔌 Live feed disconnected")

    except Exception as e:
        manager.disconnect(websocket)
        print(f"❌ WebSocket error: {e}")


# ─────────────────────────────────────────────
# 🚨 Alerts WebSocket
# ─────────────────────────────────────────────
@app.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket):
    await manager.connect(websocket)

    last_count = 0

    try:
        while True:
            stats = alert_manager.stats()

            if stats["total"] != last_count:
                last_count = stats["total"]

                alerts = alert_manager.get_all()[:5]

                await websocket.send_json({
                    "alerts": alerts,
                    "stats": stats
                })

            await asyncio.sleep(2)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("🔌 Alerts disconnected")