import cv2
import os
import base64
from ultralytics import YOLO

# Load model
model = YOLO("yolov8n.pt")

# Vehicle classes
vehicle_classes = [2, 3, 5, 7]  # car, bike, bus, truck


def process_video():
    # Correct path
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    video_path = os.path.join(BASE_DIR, "data", "traffic4.mp4")

    print("✅ VIDEO PATH:", video_path)

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("❌ Video not opening")
        return

    while True:
        ret, frame = cap.read()

        if not ret:
            # loop video
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        # 🔥 YOLO detection happens HERE
        results = model(frame)[0]

        # Draw boxes
        annotated = results.plot()
        annotated = cv2.resize(annotated, (640, 500))

        # Count vehicles
        count = 0
        for box in results.boxes:
            cls = int(box.cls[0])
            if cls in vehicle_classes:
                count += 1

        # Speed logic
        avg_speed = max(5, 60 - count * 1.5)

        # Convert frame to base64
        _, buffer = cv2.imencode('.jpg', annotated)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')

        yield {
            "vehicle_count": count,
            "avg_speed": round(avg_speed, 1),
            "accident_probability": round(count / 20, 2),
            "accident": False,
            "frame": frame_base64
        }