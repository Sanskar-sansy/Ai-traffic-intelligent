"""
routes/video_routes.py
Endpoints for video upload analysis and demo data.
"""
import os, tempfile, time
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from services.video_service import VideoAnalyzer, generate_demo_frames
from services.alert_manager import alert_manager

router = APIRouter(prefix="/api", tags=["video"])
UPLOAD_DIR = tempfile.gettempdir()


@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    """
    Accept a traffic video file, run detection, return analytics summary.
    """
    if not file.filename.lower().endswith((".mp4", ".avi", ".mov", ".mkv", ".webm")):
        raise HTTPException(400, "Unsupported file type. Use mp4/avi/mov/mkv/webm.")

    # Save upload temporarily
    suffix = os.path.splitext(file.filename)[1]
    tmp_path = os.path.join(UPLOAD_DIR, f"traffic_{int(time.time())}{suffix}")
    try:
        content = await file.read()
        with open(tmp_path, "wb") as f:
            f.write(content)

        analyzer = VideoAnalyzer(tmp_path)
        result   = await analyzer.analyze()

        # Raise alert if accidents found
        if result["accidents_found"] > 0:
            alert_manager.create_alert(
                alert_type="accident",
                severity="High",
                message=f"Accident detected in uploaded video: {result['accidents_found']} event(s)",
                metadata={"filename": file.filename, "events": result["accident_events"][:3]},
            )

        return JSONResponse({"status": "ok", "filename": file.filename, **result})

    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.get("/demo-analysis")
async def demo_analysis():
    """Return synthetic detection data (no upload needed) for UI demos."""
    frames = generate_demo_frames(n=60)
    counts = [f.total_count for f in frames]
    speeds = [f.avg_speed   for f in frames if f.avg_speed]
    accidents = [f for f in frames if f.accident_detected]

    return {
        "total_frames": 60,
        "avg_vehicles": round(sum(counts) / max(len(counts), 1), 1),
        "max_vehicles": max(counts) if counts else 0,
        "avg_speed":    round(sum(speeds) / max(len(speeds), 1), 1),
        "accidents_found": len(accidents),
        "timeline": [
            {"frame": i * 5, "vehicle_count": f.total_count, "avg_speed": f.avg_speed}
            for i, f in enumerate(frames)
        ],
    }


@router.get("/detect-accident")
async def detect_accident(
    num_vehicles: int = Query(10, ge=0),
    avg_speed:    float = Query(50.0, ge=0),
    has_overlap:  bool = Query(False),
):
    """
    Heuristic accident detection given high-level parameters.
    Designed for quick UI demos.
    """
    accident = False
    severity = "None"

    if has_overlap:
        accident = True
        severity = "High" if avg_speed > 50 else "Medium"
    elif avg_speed < 5 and num_vehicles > 5:
        accident, severity = True, "Low"

    result = {
        "accident_detected": accident,
        "severity": severity,
        "timestamp": time.time(),
        "conditions": {
            "num_vehicles": num_vehicles,
            "avg_speed":    avg_speed,
            "has_overlap":  has_overlap,
        },
    }

    if accident:
        alert_manager.create_alert(
            alert_type="accident",
            severity=severity,
            message=f"Accident detected via API check — severity: {severity}",
            metadata=result,
        )

    return result
