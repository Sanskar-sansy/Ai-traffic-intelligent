"""
services/video_service.py
Handles uploaded video analysis and frame generation for live streams.
"""
import cv2, asyncio, time, os
import numpy as np
from typing import AsyncGenerator, Optional
from services.vehicle_detector import VehicleDetector, DetectionResult


class VideoAnalyzer:
    """Process an uploaded video file frame-by-frame."""

    def __init__(self, path: str):
        self.path    = path
        self.detector = VehicleDetector()

    async def analyze(self) -> dict:
        cap = cv2.VideoCapture(self.path)
        if not cap.isOpened():
            raise IOError(f"Cannot open video: {self.path}")

        fps  = cap.get(cv2.CAP_PROP_FPS) or 30
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.detector.fps = fps

        results, speeds, counts = [], [], []
        frame_no = 0
        sample_interval = max(1, int(fps / 5))   # analyse 5 frames/sec

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_no += 1
            if frame_no % sample_interval != 0:
                continue

            res = self.detector.process_frame(frame)
            counts.append(res.total_count)
            if res.avg_speed:
                speeds.append(res.avg_speed)

            results.append({
                "frame":          frame_no,
                "vehicle_count":  res.total_count,
                "avg_speed":      res.avg_speed,
                "accident":       res.accident_detected,
                "severity":       res.accident_severity,
                "timestamp":      round(frame_no / fps, 2),
            })

        cap.release()

        accident_frames = [r for r in results if r["accident"]]
        return {
            "total_frames":    total,
            "fps":             fps,
            "duration_sec":    round(total / fps, 1),
            "max_vehicles":    max(counts) if counts else 0,
            "avg_vehicles":    round(float(np.mean(counts)), 1) if counts else 0,
            "peak_speed":      max(speeds) if speeds else 0,
            "avg_speed":       round(float(np.mean(speeds)), 1) if speeds else 0,
            "accidents_found": len(accident_frames),
            "accident_events": accident_frames[:10],
            "timeline":        results[::5],     # thin out for response size
        }


class LiveStreamProcessor:
    """Process a live camera / RTSP / webcam feed frame by frame."""

    def __init__(self, source=0):
        self.source   = source
        self.detector = VehicleDetector()
        self._running = False

    async def stream_frames(self) -> AsyncGenerator[DetectionResult, None]:
        cap = cv2.VideoCapture(self.source)
        if not cap.isOpened():
            raise IOError(f"Cannot open stream: {self.source}")

        self._running = True
        loop = asyncio.get_event_loop()

        try:
            while self._running:
                ret, frame = await loop.run_in_executor(None, cap.read)
                if not ret:
                    break
                result = self.detector.process_frame(frame)
                yield result
                await asyncio.sleep(0.033)   # ~30 fps cap
        finally:
            cap.release()

    def stop(self):
        self._running = False


# ── Utility: generate a demo synthetic video ──────────────────────────────────

def generate_demo_frames(n: int = 90) -> list:
    """
    Returns a list of DetectionResult objects from synthetic frames,
    useful for demoing the API without a real video file.
    """
    detector = VehicleDetector()
    frames   = []
    for i in range(n):
        h, w = 480, 640
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        # Draw road markings
        cv2.rectangle(frame, (0, 200), (w, h), (40, 40, 40), -1)
        cv2.line(frame, (w // 2, 200), (w // 2, h), (255, 255, 0), 3)

        # Draw synthetic "vehicles"
        n_cars = np.random.randint(2, 8)
        for _ in range(n_cars):
            x = np.random.randint(50, w - 80)
            y = np.random.randint(210, h - 60)
            wv, hv = np.random.randint(50, 100), np.random.randint(30, 60)
            color = tuple(np.random.randint(100, 255, 3).tolist())
            cv2.rectangle(frame, (x, y), (x + wv, y + hv), color, -1)

        result = detector.process_frame(frame)
        frames.append(result)
    return frames
