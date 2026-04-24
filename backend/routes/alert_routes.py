"""
routes/alert_routes.py
REST endpoints for alert history and management.
"""
from fastapi import APIRouter, Query
from services.alert_manager import alert_manager

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def get_alerts(unread_only: bool = Query(False)):
    return {"alerts": alert_manager.get_all(unread_only=unread_only),
            "stats":  alert_manager.stats()}


@router.patch("/{alert_id}/read")
async def mark_read(alert_id: str):
    ok = alert_manager.mark_read(alert_id)
    return {"success": ok}


@router.delete("/clear")
async def clear_alerts():
    alert_manager.clear_all()
    return {"cleared": True}


@router.get("/stats")
async def alert_stats():
    return alert_manager.stats()
