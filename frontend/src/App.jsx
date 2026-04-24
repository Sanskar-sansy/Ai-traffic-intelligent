import React, { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { ToastContainer } from './components/AlertToast'
import "leaflet/dist/leaflet.css";

import LiveFeedPage  from './pages/LiveFeedPage'
import UploadPage    from './pages/UploadPage'
import PredictPage   from './pages/PredictPage'
import ForecastPage  from './pages/ForecastPage'
import SafetyPage    from './pages/SafetyPage'
import AlertsPage    from './pages/AlertsPage'
import RoutePage     from './pages/RoutePage'   // ✅ correct import

export default function App() {
  const [toasts, setToasts] = useState([])
  const [alertCount, setAlertCount] = useState(0)

  const addAlert = useCallback((alert) => {
    setAlertCount(c => c + 1)
    setToasts(prev => [alert, ...prev].slice(0, 5))
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar alertCount={alertCount} />

        <main className="flex-1 overflow-y-auto max-h-screen">

          {/* 🔥 Ticker */}
          <div className="bg-[#0d1117] border-b border-[#21262d] overflow-hidden h-8 flex items-center">
            <div className="ticker-inner whitespace-nowrap text-[10px] font-mono text-[#8b949e] flex gap-16 px-4">
              {Array.from({ length: 2 }).flatMap((_, rep) => [
                '🚦 AI Traffic Intelligence System v1.0',
                '📡 Real-time vehicle detection active',
                '🧠 ML models: LinearRegression + RandomForest + ARIMA',
                '🚨 Accident detection: enabled',
                '📊 Dashboard: 6 modules live',
                '⚡ WebSocket streaming: active',
              ].map((t, i) => <span key={`${rep}-${i}`}>{t}</span>))}
            </div>
          </div>

          {/* ✅ ROUTES (THIS IS WHERE YOUR LINE BELONGS) */}
          <Routes>
            <Route path="/"         element={<LiveFeedPage onAlert={addAlert} />} />
            <Route path="/upload"   element={<UploadPage   onAlert={addAlert} />} />
            <Route path="/predict"  element={<PredictPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/safety"   element={<SafetyPage />} />
            <Route path="/alerts"   element={<AlertsPage />} />

            {/* ✅ YOUR NEW PAGE */}
            <Route path="/route"    element={<RoutePage />} />
          </Routes>

        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </BrowserRouter>
  )
} 