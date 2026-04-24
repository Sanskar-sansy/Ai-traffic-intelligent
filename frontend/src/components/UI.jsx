import React from 'react'

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, unit = '', sub, color = 'radar', icon: Icon, pulse }) {
  const colorMap = {
    radar:  'text-[#00f5a0] border-[#00f5a020]',
    alert:  'text-[#ff4757] border-[#ff475720]',
    warn:   'text-[#ffa502] border-[#ffa50220]',
    blue:   'text-[#58a6ff] border-[#58a6ff20]',
    purple: 'text-[#bc8cff] border-[#bc8cff20]',
  }
  const cls = colorMap[color] || colorMap.radar

  return (
    <div className={`relative bg-[#161b22] border rounded-xl p-4 ${cls} overflow-hidden`}>
      {pulse && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#00f5a0] blink" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[#8b949e] text-xs uppercase tracking-widest mb-1">{label}</p>
          <p className={`font-mono text-2xl font-bold ${cls.split(' ')[0]}`}>
            {value}<span className="text-sm ml-1 opacity-70">{unit}</span>
          </p>
          {sub && <p className="text-[#8b949e] text-xs mt-1">{sub}</p>}
        </div>
        {Icon && <Icon size={22} className={`${cls.split(' ')[0]} opacity-60 mt-1`} />}
      </div>
    </div>
  )
}

// ── SeverityBadge ─────────────────────────────────────────────────────────────
export function SeverityBadge({ level }) {
  const map = {
    High:   'bg-[#ff475720] text-[#ff4757] border-[#ff4757]',
    Medium: 'bg-[#ffa50220] text-[#ffa502] border-[#ffa502]',
    Low:    'bg-[#00f5a020] text-[#00f5a0] border-[#00f5a0]',
    None:   'bg-[#8b949e20] text-[#8b949e] border-[#8b949e]',
  }
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${map[level] || map.None}`}>
      {level}
    </span>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionTitle({ children, accent }) {
  return (
    <h2 className="text-sm uppercase tracking-widest text-[#8b949e] font-semibold flex items-center gap-2 mb-4">
      {accent && <span className="w-1 h-4 rounded bg-[#00f5a0] inline-block" />}
      {children}
    </h2>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function Panel({ children, className = '', title }) {
  return (
    <div className={`bg-[#161b22] border border-[#21262d] rounded-xl p-5 ${className}`}>
      {title && <SectionTitle accent>{title}</SectionTitle>}
      {children}
    </div>
  )
}

// ── ConnectionDot ─────────────────────────────────────────────────────────────
export function ConnectionDot({ status }) {
  const map = {
    connected:    'bg-[#00f5a0]',
    disconnected: 'bg-[#8b949e]',
    error:        'bg-[#ff4757]',
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-[#8b949e]">
      <span className={`w-1.5 h-1.5 rounded-full ${map[status] || map.disconnected} ${status === 'connected' ? 'blink' : ''}`} />
      {status}
    </span>
  )
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-[#00f5a0]">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
              fill="none" strokeDasharray="31" strokeDashoffset="10" />
    </svg>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-[#8b949e] gap-3">
      {Icon && <Icon size={36} strokeWidth={1} />}
      <p className="text-sm">{message}</p>
    </div>
  )
}
