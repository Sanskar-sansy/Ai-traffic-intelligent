import React, { useState } from 'react'
import { TrendingUp, Car, Navigation, Clock, AlertTriangle } from 'lucide-react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { predictTraffic } from '../services/api'
import { StatCard, Panel, SeverityBadge, Spinner } from '../components/UI'

const CONGESTION_COLOR = { Low: '#00f5a0', Medium: '#ffa502', High: '#ff4757' }
const CONGESTION_LABEL = { 0: 'Low', 1: 'Medium', 2: 'High' }

function SliderField({ label, name, value, min, max, step = 1, unit, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <label className="text-[#8b949e] uppercase tracking-wide">{label}</label>
        <span className="font-mono text-[#00f5a0]">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(name, Number(e.target.value))}
        className="w-full h-1.5 appearance-none bg-[#21262d] rounded-full
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-[#00f5a0] cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-[#8b949e]">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

export default function PredictPage() {
  const [form, setForm] = useState({
    hour:             12,
    road_length_km:   2.0,
    road_width_lanes: 4,
    num_vehicles:     50,
    avg_speed_kmh:    45,
  })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await predictTraffic(form)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const congLabel = result ? (CONGESTION_LABEL[result.congestion_level] ?? 'Unknown') : null
  const radialData = result ? [{ value: result.predicted_density, fill: CONGESTION_COLOR[congLabel] || '#00f5a0' }] : []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Traffic Prediction</h1>
        <p className="text-[#8b949e] text-sm mt-0.5">ML-powered density &amp; congestion forecast</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input panel */}
        <Panel title="Road Parameters">
          <div className="space-y-6">
            <SliderField label="Hour of Day" name="hour" value={form.hour}
                         min={0} max={23} unit="h" onChange={update} />
            <SliderField label="Road Length" name="road_length_km" value={form.road_length_km}
                         min={0.5} max={20} step={0.5} unit=" km" onChange={update} />
            <SliderField label="Road Width (lanes)" name="road_width_lanes" value={form.road_width_lanes}
                         min={1} max={12} unit="" onChange={update} />
            <SliderField label="Number of Vehicles" name="num_vehicles" value={form.num_vehicles}
                         min={1} max={300} unit="" onChange={update} />
            <SliderField label="Average Speed" name="avg_speed_kmh" value={form.avg_speed_kmh}
                         min={5} max={140} unit=" km/h" onChange={update} />

            <button
              onClick={submit} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#00f5a0] text-[#0d1117] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#00d68f] transition-colors disabled:opacity-40"
            >
              {loading ? <Spinner size={16} /> : <TrendingUp size={16} />}
              Predict Congestion
            </button>
          </div>
        </Panel>

        {/* Result panel */}
        <Panel title="Prediction Result">
          {error && (
            <div className="bg-[#ff475715] border border-[#ff4757] rounded-xl px-4 py-3 flex gap-3 text-sm mb-4">
              <AlertTriangle size={16} className="text-[#ff4757] shrink-0" />
              <span className="text-[#ff4757]">{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-5 animate-fade-in">
              {/* Gauge */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <ResponsiveContainer width={200} height={200}>
                    <RadialBarChart
                      cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                      startAngle={180} endAngle={0}
                      data={radialData}
                      barSize={14}
                    >
                      <PolarAngleAxis type="number" domain={[0, 40]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={7} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold font-mono"
                       style={{ color: CONGESTION_COLOR[congLabel] }}>
                      {result.predicted_density}
                    </p>
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-widest">density</p>
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Congestion Level" value={congLabel} icon={AlertTriangle}
                          color={congLabel === 'High' ? 'alert' : congLabel === 'Medium' ? 'warn' : 'radar'} />
                <StatCard label="Vehicles/km" value={result.vehicles_per_km} icon={Car} color="blue" />
              </div>

              {/* Recommendation */}
              <div className="bg-[#0d1117] border border-[#21262d] rounded-xl px-4 py-3">
                <p className="text-xs text-[#8b949e] uppercase tracking-wide mb-1">Recommendation</p>
                <p className="text-sm text-[#e6edf3]">{result.recommendation}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-[#8b949e] gap-3">
              <TrendingUp size={36} strokeWidth={1} />
              <p className="text-sm">Adjust parameters and click Predict</p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
