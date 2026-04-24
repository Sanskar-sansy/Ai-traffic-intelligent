import requests
import os

API_KEY = os.getenv("WEATHER_API_KEY")

if not API_KEY:
    print("WEATHER_API_KEY not found")

def get_weather(city: str):
    try:
        url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"

        response = requests.get(url)

        if response.status_code != 200:
            print("Weather API error:", response.text)
            return []

        res = response.json()

        if "list" not in res:
            print("Invalid weather response:", res)
            return []

        data = []

        for item in res["list"][:8]:  # next ~24 hours
            data.append({
                "time": item["dt_txt"],
                "temp": item["main"]["temp"]
            })

        return data

    except Exception as e:
        print("Weather fetch error:", e)
        return []
