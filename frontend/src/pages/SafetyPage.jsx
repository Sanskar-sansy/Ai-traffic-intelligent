import React, { useState } from 'react'
import { ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, CheckCircle } from 'lucide-react'
import { getRoadSafety } from '../services/api'
import { Panel, Spinner } from '../components/UI'

const SELECT_CLS = `w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2
  text-sm text-[#e6edf3] focus:outline-none focus:border-[#00f5a050] cursor-pointer`

function Select({ label, value, options, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-[#8b949e] uppercase tracking-wide">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={SELECT_CLS}>
        {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    </div>
  )
}

function NumberInput({ label, value, min, max, unit, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-[#8b949e] uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" value={value} min={min} max={max}
               onChange={e => onChange(Number(e.target.value))}
               className={`${SELECT_CLS} flex-1`} />
        {unit && <span className="text-xs text-[#8b949e] whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  )
}

const RISK_COLOR = { Low: '#00f5a0', Medium: '#ffa502', High: '#ff4757' }

export default function SafetyPage() {
  const [form, setForm] = useState({
    road_type:      'highway',
    weather:        'clear',
    time_of_day:    'afternoon',
    speed_limit:    80,
    past_accidents: 2,
    lighting:       'good',
  })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const u = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await getRoadSafety(form)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const riskColor = result ? RISK_COLOR[result.risk_level] : '#00f5a0'

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Road Safety Analysis</h1>
        <p className="text-[#8b949e] text-sm mt-0.5">ML-powered risk assessment based on road conditions</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input form */}
        <Panel title="Road Conditions">
          <div className="space-y-4">
            <Select label="Road Type" value={form.road_type}
                    options={['highway','city','rural','residential','intersection']}
                    onChange={u('road_type')} />
            <Select label="Weather" value={form.weather}
                    options={['clear','rain','fog','snow','windy']}
                    onChange={u('weather')} />
            <Select label="Time of Day" value={form.time_of_day}
                    options={['morning','afternoon','evening','night']}
                    onChange={u('time_of_day')} />
            <Select label="Lighting" value={form.lighting}
                    options={['good','moderate','poor']}
                    onChange={u('lighting')} />
            <NumberInput label="Speed Limit" value={form.speed_limit}
                         min={10} max={200} unit="km/h" onChange={u('speed_limit')} />
            <NumberInput label="Past Accidents (last 12 mo.)" value={form.past_accidents}
                         min={0} max={100} onChange={u('past_accidents')} />

            <button
              onClick={submit} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#00f5a0] text-[#0d1117] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#00d68f] transition-colors disabled:opacity-40"
            >
              {loading ? <Spinner size={16} /> : <ShieldAlert size={16} />}
              Analyse Safety
            </button>
          </div>
        </Panel>

        {/* Result */}
        <Panel title="Safety Report">
          {error && (
            <div className="bg-[#ff475715] border border-[#ff4757] rounded-xl px-4 py-3 text-sm text-[#ff4757] flex gap-2 mb-4">
              <AlertTriangle size={16} className="shrink-0" />{error}
            </div>
          )}

          {result ? (
            <div className="space-y-5 animate-fade-in">
              {/* Risk gauge */}
              <div className="flex flex-col items-center gap-2 py-4">
                {result.safe_to_travel
                  ? <ShieldCheck size={48} style={{ color: riskColor }} />
                  : <ShieldX    size={48} style={{ color: riskColor }} />
                }
                <p className="text-3xl font-bold font-mono" style={{ color: riskColor }}>
                  {result.risk_score}
                  <span className="text-base text-[#8b949e] ml-1">/ 100</span>
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#8b949e]">Risk Level:</span>
                  <span className="font-semibold text-sm px-3 py-1 rounded-full border"
                        style={{ color: riskColor, borderColor: riskColor + '60', background: riskColor + '15' }}>
                    {result.risk_level}
                  </span>
                </div>
              </div>

              {/* Risk bar */}
              <div>
                <div className="h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                       style={{ width: `${result.risk_score}%`, background: riskColor }} />
                </div>
                <div className="flex justify-between text-[10px] text-[#8b949e] mt-1">
                  <span>Safe</span><span>Moderate</span><span>Dangerous</span>
                </div>
              </div>

              {/* Safe to travel */}
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                result.safe_to_travel
                  ? 'bg-[#00f5a015] border-[#00f5a040] text-[#00f5a0]'
                  : 'bg-[#ff475715] border-[#ff475740] text-[#ff4757]'
              }`}>
                {result.safe_to_travel
                  ? <CheckCircle size={18} />
                  : <AlertTriangle size={18} className="blink" />
                }
                <span className="font-semibold text-sm">
                  {result.safe_to_travel ? '✓ Safe to Travel' : '✗ Not Recommended'}
                </span>
              </div>

              {/* Recommendation */}
              <div className="bg-[#0d1117] border border-[#21262d] rounded-xl px-4 py-3">
                <p className="text-xs text-[#8b949e] uppercase tracking-wide mb-1">Assessment</p>
                <p className="text-sm text-[#e6edf3] leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Risk factors */}
              <div>
                <p className="text-xs text-[#8b949e] uppercase tracking-wide mb-3">Risk Factors Detected</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.factors || {}).map(([k, v]) => (
                    <div key={k} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                      v ? 'bg-[#ff475710] border-[#ff475740] text-[#ff7070]'
                        : 'bg-[#00f5a010] border-[#00f5a030] text-[#8b949e]'
                    }`}>
                      {v ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
                      {k.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-[#8b949e] gap-3">
              <ShieldAlert size={36} strokeWidth={1} />
              <p className="text-sm">Fill in road conditions and click Analyse</p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
