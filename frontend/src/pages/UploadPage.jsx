import React, { useState, useRef, useCallback } from 'react'
import { Upload, Film, AlertTriangle, CheckCircle, Clock, Car, Zap } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { uploadVideo, getDemoAnalysis } from '../services/api'
import { StatCard, Panel, SeverityBadge, Spinner, EmptyState } from '../components/UI'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-[#8b949e]">t={label}s</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {Number(p.value).toFixed(1)}</p>)}
    </div>
  )
}

export default function UploadPage({ onAlert }) {
  const [dragging, setDragging] = useState(false)
  const [file,     setFile]     = useState(null)
  const [progress, setProgress] = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)
  const inputRef = useRef()

  const handleFile = (f) => {
    setFile(f); setResult(null); setError(null); setProgress(0)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const submit = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await uploadVideo(fd, setProgress)
      setResult(data)
      if (data.accidents_found > 0) {
        onAlert?.({
          id:        Date.now().toString(),
          type:      'accident',
          severity:  'High',
          message:   `Video "${file.name}": ${data.accidents_found} accident event(s) detected`,
          timestamp: Date.now() / 1000,
        })
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const runDemo = async () => {
    setLoading(true); setError(null); setFile(null); setResult(null)
    try {
      const { data } = await getDemoAnalysis()
      setResult({ ...data, filename: 'demo_synthetic.mp4', demo: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const timelineData = result?.timeline?.map(r => ({
    t:        r.timestamp ?? r.frame,
    vehicles: r.vehicle_count,
    speed:    r.avg_speed,
  })) || []

  const accidentMarkers = result?.accident_events || []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Upload Video Analysis</h1>
        <p className="text-[#8b949e] text-sm mt-0.5">Upload a traffic video for AI-powered frame-by-frame analysis</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200
          ${dragging ? 'border-[#00f5a0] bg-[#00f5a010]' : 'border-[#21262d] hover:border-[#00f5a050] hover:bg-[#00f5a005]'}`}
      >
        <input ref={inputRef} type="file" accept=".mp4,.avi,.mov,.mkv,.webm"
               className="hidden" onChange={e => handleFile(e.target.files[0])} />
        <div className="w-14 h-14 rounded-full bg-[#161b22] border border-[#21262d] flex items-center justify-center">
          <Upload size={24} className="text-[#00f5a0]" />
        </div>
        {file ? (
          <div className="text-center">
            <p className="font-medium text-[#00f5a0]">{file.name}</p>
            <p className="text-[#8b949e] text-sm">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[#e6edf3] font-medium">Drop video here or click to browse</p>
            <p className="text-[#8b949e] text-sm mt-1">MP4, AVI, MOV, MKV, WebM</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={!file || loading}
          className="flex items-center gap-2 bg-[#00f5a0] text-[#0d1117] font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#00d68f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading && !result ? <Spinner size={16} /> : <Film size={16} />}
          Analyse Video
        </button>
        <button
          onClick={runDemo}
          disabled={loading}
          className="flex items-center gap-2 bg-[#161b22] border border-[#21262d] text-[#e6edf3] font-medium px-5 py-2.5 rounded-lg text-sm hover:border-[#00f5a050] transition-colors disabled:opacity-40"
        >
          {loading && !file ? <Spinner size={16} /> : <Zap size={16} />}
          Run Demo
        </button>
      </div>

      {/* Progress bar */}
      {loading && progress > 0 && (
        <div className="h-1 bg-[#21262d] rounded-full overflow-hidden">
          <div className="h-full bg-[#00f5a0] transition-all duration-300 rounded-full"
               style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#ff475715] border border-[#ff4757] rounded-xl px-4 py-3 flex gap-3 text-sm">
          <AlertTriangle size={16} className="text-[#ff4757] shrink-0 mt-0.5" />
          <span className="text-[#ff4757]">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-fade-in">
          {result.demo && (
            <div className="bg-[#58a6ff15] border border-[#58a6ff40] rounded-xl px-4 py-2 text-sm text-[#58a6ff] flex items-center gap-2">
              <Zap size={14} /> Showing synthetic demo data (no real video required)
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Max Vehicles"  value={result.max_vehicles}  icon={Car}           color="radar" />
            <StatCard label="Avg Vehicles"  value={result.avg_vehicles}  icon={Car}           color="blue" />
            <StatCard label="Avg Speed"     value={result.avg_speed}     unit="km/h" icon={Zap} color="purple" />
            <StatCard label="Accidents Found" value={result.accidents_found}
                      icon={AlertTriangle} color={result.accidents_found > 0 ? 'alert' : 'radar'} />
          </div>

          {/* Info strip */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { icon: Film,  label: 'File',     val: result.filename },
              { icon: Clock, label: 'Duration', val: result.duration_sec ? `${result.duration_sec}s` : '—' },
              { icon: Car,   label: 'FPS',      val: result.fps ? `${result.fps} fps` : '—' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="bg-[#161b22] border border-[#21262d] rounded-xl px-4 py-3 flex items-center gap-3">
                <Icon size={15} className="text-[#8b949e]" />
                <div>
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">{label}</p>
                  <p className="text-xs text-[#e6edf3] font-mono truncate max-w-[140px]">{val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline chart */}
          {timelineData.length > 0 && (
            <Panel title="Detection Timeline">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="t" tick={{ fill: '#8b949e', fontSize: 10 }} tickLine={false} label={{ value: 'time (s)', position: 'insideBottomRight', fill: '#8b949e', fontSize: 10, offset: -5 }} />
                  <YAxis tick={{ fill: '#8b949e', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {accidentMarkers.map((a, i) => (
                    <ReferenceLine key={i} x={a.timestamp} stroke="#ff4757" strokeDasharray="4 2" label={{ value: '⚠', fill: '#ff4757', fontSize: 12 }} />
                  ))}
                  <Line type="monotone" dataKey="vehicles" name="Vehicles" stroke="#00f5a0" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="speed"    name="Speed"    stroke="#58a6ff" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              {accidentMarkers.length > 0 && (
                <p className="text-[10px] text-[#8b949e] mt-2">⚠ Red lines mark detected accident events</p>
              )}
            </Panel>
          )}

          {/* Accident events */}
          {result.accident_events?.length > 0 && (
            <Panel title="Accident Events">
              <div className="space-y-2">
                {result.accident_events.map((evt, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2.5 text-sm">
                    <AlertTriangle size={14} className="text-[#ff4757] shrink-0" />
                    <span className="text-[#8b949e] font-mono text-xs">Frame {evt.frame}</span>
                    <SeverityBadge level={evt.severity} />
                    <span className="text-[#e6edf3] text-xs">{evt.vehicle_count} vehicles · {evt.avg_speed} km/h</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {!result && !loading && (
        <EmptyState icon={Film} message="Upload a video or run the demo to see analysis results" />
      )}
    </div>
  )
}
