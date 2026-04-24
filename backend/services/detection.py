from ultralytics import YOLO
import cv2

# Load YOLO model
model = YOLO("yolov8n.pt")

# For future tracking (not used fully yet)
prev_positions = {}

def estimate_speed(current_count):
    # temporary simple logic
    return current_count * 2

def detect_vehicles(frame):
    results = model(frame)[0]

    vehicle_classes = [2, 3, 5, 7]  # car, bike, bus, truck
    count = 0

    for box in results.boxes:
        cls = int(box.cls[0])
        if cls in vehicle_classes:
            count += 1

    speed = estimate_speed(count)

    return count, speed, results.plot()