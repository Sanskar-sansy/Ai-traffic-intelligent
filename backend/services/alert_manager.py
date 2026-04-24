"""
services/alert_manager.py
In-memory alert store with severity ranking and history.
"""
import time, uuid
from typing import List, Dict, Any, Optional
from collections import deque

SEVERITY_RANK = {"Low": 1, "Medium": 2, "High": 3}

class AlertManager:
    def __init__(self, max_history: int = 100):
        self._alerts: deque = deque(maxlen=max_history)
        self._active_subscribers: List = []   # WebSocket connections

    def create_alert(
        self,
        alert_type: str,
        severity: str,
        message: str,
        metadata: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        alert = {
            "id":         str(uuid.uuid4())[:8],
            "type":       alert_type,
            "severity":   severity,
            "message":    message,
            "timestamp":  time.time(),
            "read":       False,
            "metadata":   metadata or {},
        }
        self._alerts.appendleft(alert)
        return alert

    def get_all(self, unread_only: bool = False) -> List[Dict]:
        alerts = list(self._alerts)
        if unread_only:
            alerts = [a for a in alerts if not a["read"]]
        return alerts

    def mark_read(self, alert_id: str) -> bool:
        for a in self._alerts:
            if a["id"] == alert_id:
                a["read"] = True
                return True
        return False

    def clear_all(self):
        self._alerts.clear()

    def stats(self) -> Dict:
        all_alerts = list(self._alerts)
        return {
            "total":    len(all_alerts),
            "unread":   sum(1 for a in all_alerts if not a["read"]),
            "by_severity": {
                "High":   sum(1 for a in all_alerts if a["severity"] == "High"),
                "Medium": sum(1 for a in all_alerts if a["severity"] == "Medium"),
                "Low":    sum(1 for a in all_alerts if a["severity"] == "Low"),
            }
        }


# Global singleton
alert_manager = AlertManager()
