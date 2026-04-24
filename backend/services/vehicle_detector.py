"""
services/vehicle_detector.py
Simulates vehicle detection + speed estimation via background subtraction.
In production swap detect_vehicles() with a real YOLOv8 / DeepSORT pipeline.
"""
import cv2
import numpy as np
import time
import base64
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional

# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class Vehicle:
    id: int
    bbox: Tuple[int, int, int, int]   # x, y, w, h
    center: Tuple[int, int]
    speed: float = 0.0
    label: str = "vehicle"
    color: Tuple[int, int, int] = (0, 255, 0)

@dataclass
class DetectionResult:
    vehicles: List[Vehicle] = field(default_factory=list)
    total_count: int = 0
    avg_speed: float = 0.0
    accident_detected: bool = False
    accident_severity: str = "None"
    frame_b64: Optional[str] = None
    fps: float = 0.0
    timestamp: float = 0.0


# ── Detector class ─────────────────────────────────────────────────────────────

class VehicleDetector:
    """
    Background-subtraction based vehicle detector.
    Replace _detect_blobs() with YOLOv8 inference for production use.
    """

    def __init__(self, fps: float = 30.0, px_per_meter: float = 8.0):
        self.fps = fps
        self.px_per_meter = px_per_meter          # calibration constant
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=200, varThreshold=50, detectShadows=False
        )
        self.prev_centers: Dict[int, Tuple[int, int]] = {}
        self.next_id = 0
        self.prev_time = time.time()

    # ── Public API ────────────────────────────────────────────────────────────

    def process_frame(self, frame: np.ndarray) -> DetectionResult:
        now = time.time()
        dt  = max(now - self.prev_time, 1e-6)
        self.prev_time = now
        fps = round(1.0 / dt, 1)

        vehicles = self._detect_blobs(frame)
        vehicles = self._assign_ids_and_speed(vehicles, dt)
        self._draw_overlays(frame, vehicles)

        avg_speed = float(np.mean([v.speed for v in vehicles])) if vehicles else 0.0
        accident, severity = self._check_accident(vehicles, avg_speed)

        return DetectionResult(
            vehicles=vehicles,
            total_count=len(vehicles),
            avg_speed=round(avg_speed, 1),
            accident_detected=accident,
            accident_severity=severity,
            frame_b64=self._encode_frame(frame),
            fps=fps,
            timestamp=now,
        )

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _detect_blobs(self, frame: np.ndarray) -> List[Vehicle]:
        """Background subtraction → morphology → contour bounding boxes."""
        mask = self.bg_subtractor.apply(frame)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel, iterations=2)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=3)

        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        vehicles = []
        for cnt in cnts:
            area = cv2.contourArea(cnt)
            if area < 800:          # filter noise
                continue
            x, y, w, h = cv2.boundingRect(cnt)
            cx, cy = x + w // 2, y + h // 2
            label = "truck" if area > 8000 else "car" if area > 2500 else "bike"
            vehicles.append(Vehicle(
                id=-1, bbox=(x, y, w, h), center=(cx, cy), label=label
            ))
        return vehicles

    def _assign_ids_and_speed(self, vehicles: List[Vehicle], dt: float) -> List[Vehicle]:
        """Greedy nearest-neighbour tracking + speed estimation."""
        matched = {}
        used_old = set()

        for v in vehicles:
            best_id, best_dist = -1, float("inf")
            for old_id, old_center in self.prev_centers.items():
                if old_id in used_old:
                    continue
                dist = np.hypot(v.center[0] - old_center[0],
                                v.center[1] - old_center[1])
                if dist < best_dist:
                    best_dist, best_id = dist, old_id

            if best_id != -1 and best_dist < 80:
                v.id = best_id
                used_old.add(best_id)
                displacement_px = best_dist
                # pixels → meters → km/h
                speed_ms  = (displacement_px / self.px_per_meter) / dt
                v.speed   = round(speed_ms * 3.6, 1)
                matched[best_id] = v.center
            else:
                v.id = self.next_id
                self.next_id += 1
                matched[v.id] = v.center

            # colour by type
            v.color = {"truck": (255, 100, 0),
                       "car":   (0, 220, 120),
                       "bike":  (0, 140, 255)}.get(v.label, (200, 200, 200))

        self.prev_centers = matched
        return vehicles

    def _check_accident(self, vehicles: List[Vehicle], avg_speed: float):
        """Heuristic accident detection from bounding-box overlaps + speed drops."""
        if not vehicles:
            return False, "None"

        # Check bounding box overlaps (collision indicator)
        for i, v1 in enumerate(vehicles):
            x1, y1, w1, h1 = v1.bbox
            for v2 in vehicles[i + 1:]:
                x2, y2, w2, h2 = v2.bbox
                overlap = (x1 < x2 + w2 and x1 + w1 > x2 and
                           y1 < y2 + h2 and y1 + h1 > y2)
                if overlap:
                    severity = "High" if avg_speed > 40 else "Medium"
                    return True, severity

        # Sudden very-low speed with many vehicles
        slow = sum(1 for v in vehicles if v.speed < 5)
        if slow > 3 and len(vehicles) > 5:
            return True, "Low"

        return False, "None"

    def _draw_overlays(self, frame: np.ndarray, vehicles: List[Vehicle]):
        """Draw boxes, labels, speed on frame."""
        for v in vehicles:
            x, y, w, h = v.bbox
            cv2.rectangle(frame, (x, y), (x + w, y + h), v.color, 2)
            label = f"#{v.id} {v.label} {v.speed}km/h"
            cv2.putText(frame, label, (x, max(y - 6, 12)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, v.color, 2)

        # HUD
        cv2.putText(frame, f"Vehicles: {len(vehicles)}", (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        cv2.putText(frame, f"Avg Speed: {round(np.mean([v.speed for v in vehicles]) if vehicles else 0, 1)} km/h",
                    (10, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

    @staticmethod
    def _encode_frame(frame: np.ndarray) -> str:
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        return base64.b64encode(buf).decode("utf-8")
