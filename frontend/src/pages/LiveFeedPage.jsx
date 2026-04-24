import React, { useEffect, useState } from "react";

export default function LiveFeedPage({ onAlert }) {
  const [data, setData] = useState({
    vehicle_count: 0,
    avg_speed: 0,
    accident_probability: 0,
    frame: null,
  });

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/live-feed");

    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data);
      setData(incoming);

      // 🚨 alert trigger
      if (incoming.accident) {
        onAlert({
          id: Date.now(),
          message: "🚨 Accident detected!",
        });
      }
    };

    ws.onerror = () => console.log("WebSocket error");
    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, []);

  return (
    <div className="p-6 bg-[#0d1117] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">🚦 Live Traffic Feed</h1>

      {/* 🎥 VIDEO (HALF WIDTH, CLEAN) */}
      <div className="flex justify-center mb-8">
        {data.frame ? (
          <div className="w-1/2 bg-black p-2 rounded-xl shadow-xl">
            <img
              src={`data:image/jpeg;base64,${data.frame}`}
              alt="Live Feed"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            Waiting for video...
          </div>
        )}
      </div>

      {/* 📊 STATS */}
      <div className="grid grid-cols-3 gap-6">

        {/* 🚗 Vehicle Count */}
        <div className="bg-[#161b22] p-6 rounded-xl shadow hover:scale-105 transition">
          <p className="text-gray-400 text-sm">Vehicles</p>
          <h2 className="text-3xl font-bold">{data.vehicle_count}</h2>
        </div>

        {/* 🚀 Speed */}
        <div className="bg-[#161b22] p-6 rounded-xl shadow hover:scale-105 transition">
          <p className="text-gray-400 text-sm">Avg Speed</p>
          <h2 className="text-3xl font-bold">{data.avg_speed} km/h</h2>
        </div>

        {/* 🚨 Accident Risk */}
        <div className="bg-[#161b22] p-6 rounded-xl shadow hover:scale-105 transition">
          <p className="text-gray-400 text-sm">Accident Risk</p>
          <h2
            className={`text-3xl font-bold ${
              data.accident_probability > 0.6
                ? "text-red-500"
                : data.accident_probability > 0.3
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            {(data.accident_probability * 100 || 0).toFixed(1)}%
          </h2>
        </div>

      </div>
    </div>
  );
}