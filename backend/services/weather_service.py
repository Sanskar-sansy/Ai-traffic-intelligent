import requests

API_KEY = ""

def get_weather(city: str):
    url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"

    res = requests.get(url).json()

    if "list" not in res:
        print(res)  # DEBUG
        return []

    data = []

    for item in res["list"][:8]:  # next ~24 hours
        data.append({
            "time": item["dt_txt"],
            "temp": item["main"]["temp"]
        })

    return data
