import cv2
from .detection import detect_vehicles

def process_video():
    cap = cv2.VideoCapture(0)  # webcam

    if not cap.isOpened():
        print("❌ Camera not working")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        count, speed, annotated = detect_vehicles(frame)

        yield {
            "vehicle_count": count,
            "avg_speed": speed
        }