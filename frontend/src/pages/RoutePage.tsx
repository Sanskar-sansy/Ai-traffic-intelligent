import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RouteResult {
  distance: number;
  estimated_time: number;
  traffic_delay: number;
  routes: any[];
  traffic_density: string;
  safety: any;
}

export default function RoutePage() {
  const [start, setStart] = useState("Delhi");
  const [end, setEnd] = useState("Kanpur");
  const [vehicle, setVehicle] = useState("car");

  const [result, setResult] = useState<RouteResult | null>(null);
  const [weather, setWeather] = useState<any[]>([]);

  const getRoute = async () => {
    const res = await fetch(
      `http://127.0.0.1:8000/smart-route?start=${start}&end=${end}&vehicle=${vehicle}`
    );
    const data = await res.json();
    setResult(data);

    // 🌦 weather
    const w = await fetch(
      `http://127.0.0.1:8000/weather?city=${start}`
    );
    const weatherData = await w.json();

    // clean format
    const formatted = weatherData.map((d: any) => ({
      time: d.time.split(" ")[1],
      temp: d.temp,
    }));

    setWeather(formatted);
  };

  return (
    <div className="flex bg-[#0b0f14] text-white min-h-screen">

      {/* SIDEBAR */}
      <div className="w-60 bg-[#0f1720] p-5">
        <h1 className="text-green-400 font-bold mb-6">
          🚦 Traffic Intelligence
        </h1>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6">

        <h1 className="text-2xl font-bold mb-4">
          📍 Route Intelligence
        </h1>

        {/* INPUT */}
        <div className="flex gap-3 mb-6">
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="p-3 bg-black border border-gray-700 rounded w-1/4"
          />

          <input
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="p-3 bg-black border border-gray-700 rounded w-1/4"
          />

          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className="p-3 bg-black border border-gray-700 rounded"
          >
            <option value="car">🚗 Car</option>
            <option value="bike">🏍 Bike</option>
            <option value="truck">🚚 Truck</option>
          </select>

          <button
            onClick={getRoute}
            className="bg-green-400 text-black px-6 rounded font-bold"
          >
            Get Route
          </button>
        </div>

        {/* TOP CARDS */}
        {result && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card label="Distance" value={`${result.distance} km`} />
            <Card label="Est. Time" value={`${result.estimated_time} hrs`} />
            <Card label="Delay" value={`${result.traffic_delay} hrs`} color="text-orange-400"/>
            <Card label="Traffic" value={result.traffic_density} color="text-red-400"/>
          </div>
        )}

        {/* MAP */}
        {result && (
          <div className="mb-6 bg-[#111827] p-3 rounded-xl">
            <MapContainer
              center={result.routes[0].geometry[0]}
              zoom={6}
              style={{ height: "350px", width: "100%" }}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

              {result.routes.map((r, i) => (
                <Polyline
                  key={i}
                  positions={r.geometry}
                  color={r.color}
                  weight={5}
                />
              ))}

              <Marker position={result.routes[0].geometry[0]}>
                <Popup>{start}</Popup>
              </Marker>

              <Marker position={result.routes[0].geometry.slice(-1)[0]}>
                <Popup>{end}</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {/* LOWER GRID */}
        {result && (
          <div className="grid grid-cols-3 gap-4">

            {/* ROUTE OVERVIEW */}
            <Box title="Route Overview">
              <p>Distance: {result.distance} km</p>
              <p>Delay: {result.traffic_delay} hrs</p>
              <p className="text-green-400 mt-2">Best Time: Night</p>
            </Box>

            {/* DONUT */}
            <Box title="Traffic Conditions">
              <PieChart width={200} height={200}>
                <Pie
                  data={[
                    { name: "High", value: 60, color: "#ef4444" },
                    { name: "Medium", value: 30, color: "#f97316" },
                    { name: "Low", value: 10, color: "#22c55e" },
                  ]}
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                >
                  {[0,1,2].map((i) => (
                    <Cell key={i} fill={["#ef4444","#f97316","#22c55e"][i]} />
                  ))}
                </Pie>
              </PieChart>
            </Box>

            {/* WEATHER */}
            <Box title="Weather">
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={weather}>
                  <XAxis dataKey="time" stroke="#888"/>
                  <YAxis stroke="#888"/>
                  <Tooltip />
                  <Area dataKey="temp" stroke="#38bdf8" fill="#38bdf8"/>
                </AreaChart>
              </ResponsiveContainer>
            </Box>

          </div>
        )}

        {/* EXTRA PANELS */}
        {result && (
          <div className="grid grid-cols-2 gap-4 mt-4">

            <Box title="Safety">
              <p>{result.safety.risk}</p>
              <p>Total Accidents: {result.safety.total_accidents}</p>
            </Box>

            <Box title="Routes">
              {result.routes.map((r, i) => (
                <p key={i}>{r.label}</p>
              ))}
            </Box>

          </div>
        )}

      </div>
    </div>
  );
}

/* COMPONENTS */
const Card = ({ label, value, color = "text-white" }: any) => (
  <div className="bg-[#111827] p-4 rounded-lg">
    <p className="text-gray-400 text-sm">{label}</p>
    <h2 className={`text-lg font-bold ${color}`}>{value}</h2>
  </div>
);

const Box = ({ title, children }: any) => (
  <div className="bg-[#111827] p-5 rounded-lg">
    <h3 className="mb-2 font-semibold">{title}</h3>
    {children}
  </div>
);