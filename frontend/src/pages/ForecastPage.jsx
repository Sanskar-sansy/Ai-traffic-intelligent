import React, { useState, useEffect } from 'react'
import { Radio, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { getForecast } from '../services/api'
import { StatCard, Panel, Spinner } from '../components/UI'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-[#8b949e]">{label}</p>
      <p className="text-[#bc8cff]">Vehicles: {Math.round(payload[0]?.value)}</p>
    </div>
  )
}

const HOUR_OPTS = [3, 6, 12, 24]

export default function ForecastPage() {
  const [hours,   setHours]   = useState(6)
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetch = async (h = hours) => {
    setLoading(true); setError(null)
    try {
      const { data } = await getForecast(h)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const chartData = result?.forecast?.map((v, i) => ({
    label:    result.labels[i],
    vehicles: Math.round(v),
  })) || []

  const peakIdx   = chartData.findIndex(d => d.vehicles === result?.peak_predicted?.toFixed(0)*1 || d.vehicles === Math.round(result?.peak_predicted))
  const peakLabel = peakIdx >= 0 ? chartData[peakIdx]?.label : null

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Hourly Traffic Forecast</h1>
          <p className="text-[#8b949e] text-sm mt-0.5">Time-series prediction (ARIMA / moving average)</p>
        </div>
        <button
          onClick={() => fetch()}
          disabled={loading}
          className="flex items-center gap-2 bg-[#161b22] border border-[#21262d] px-4 py-2 rounded-lg text-sm hover:border-[#00f5a050] transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Hour selector */}
      <div className="flex gap-2">
        {HOUR_OPTS.map(h => (
          <button
            key={h}
            onClick={() => { setHours(h); fetch(h) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all
              ${hours === h
                ? 'bg-[#00f5a020] text-[#00f5a0] border border-[#00f5a040]'
                : 'bg-[#161b22] text-[#8b949e] border border-[#21262d] hover:border-[#00f5a030]'}`}
          >
            +{h}h
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size={32} />
        </div>
      )}

      {error && (
        <div className="bg-[#ff475715] border border-[#ff4757] rounded-xl px-4 py-3 text-sm text-[#ff4757]">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-5 animate-fade-in">
          {/* KPI strip */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard label="Peak Predicted" value={Math.round(result.peak_predicted)} unit=" veh"
                      icon={TrendingUp} color="alert" />
            <StatCard label="Trough Predicted" value={Math.round(result.trough_predicted)} unit=" veh"
                      icon={TrendingDown} color="radar" />
            <StatCard label="Forecast Window" value={result.hours_ahead} unit="h"
                      icon={Radio} color="purple" />
          </div>

          {/* Chart */}
          <Panel title={`Traffic Volume Forecast — Next ${result.hours_ahead} Hours`}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fcstGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#bc8cff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#bc8cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="label" tick={{ fill: '#8b949e', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {peakLabel && (
                  <ReferenceLine x={peakLabel} stroke="#ff4757" strokeDasharray="4 2"
                                 label={{ value: 'PEAK', fill: '#ff4757', fontSize: 10 }} />
                )}
                <Area type="monotone" dataKey="vehicles" stroke="#bc8cff"
                      fill="url(#fcstGrad)" strokeWidth={2.5} dot={{ fill: '#bc8cff', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          {/* Forecast table */}
          <Panel title="Hourly Breakdown">
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
              {chartData.map((d, i) => {
                const pct = result.peak_predicted > 0 ? d.vehicles / result.peak_predicted : 0
                return (
                  <div key={i} className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[#8b949e] font-mono mb-1">{d.label}</p>
                    <p className="text-base font-bold font-mono"
                       style={{ color: pct > 0.85 ? '#ff4757' : pct > 0.6 ? '#ffa502' : '#00f5a0' }}>
                      {d.vehicles}
                    </p>
                    <div className="mt-1.5 h-1 bg-[#21262d] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                           style={{
                             width: `${pct * 100}%`,
                             background: pct > 0.85 ? '#ff4757' : pct > 0.6 ? '#ffa502' : '#00f5a0',
                           }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
