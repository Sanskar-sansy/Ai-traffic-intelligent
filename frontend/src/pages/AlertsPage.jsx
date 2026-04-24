import React, { useState, useEffect, useCallback } from 'react'
import { Bell, AlertTriangle, Trash2, CheckCheck, RefreshCw, Info } from 'lucide-react'
import { getAlerts, markAlertRead, clearAlerts } from '../services/api'
import { Panel, SeverityBadge, Spinner, EmptyState } from '../components/UI'

const TYPE_ICONS = {
  accident: AlertTriangle,
  info:     Info,
  default:  Bell,
}

export default function AlertsPage() {
  const [alerts,      setAlerts]      = useState([])
  const [stats,       setStats]       = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [unreadOnly,  setUnreadOnly]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getAlerts(unreadOnly)
      setAlerts(data.alerts || [])
      setStats(data.stats)
    } finally {
      setLoading(false)
    }
  }, [unreadOnly])

  useEffect(() => { load() }, [load])

  // Poll every 5 s
  useEffect(() => {
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  const handleRead = async (id) => {
    await markAlertRead(id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  const handleClear = async () => {
    await clearAlerts()
    setAlerts([]); setStats(null)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Alert History</h1>
          <p className="text-[#8b949e] text-sm mt-0.5">All system notifications and accident detections</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
                  className="p-2 rounded-lg bg-[#161b22] border border-[#21262d] hover:border-[#00f5a050] transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#00f5a0]' : 'text-[#8b949e]'} />
          </button>
          <button onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#ff475715] border border-[#ff475740] text-[#ff4757] text-xs hover:bg-[#ff475725] transition-colors">
            <Trash2 size={13} /> Clear All
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',  value: stats.total,                    color: '#e6edf3' },
            { label: 'Unread', value: stats.unread,                   color: '#ffa502' },
            { label: 'High',   value: stats.by_severity?.High   ?? 0, color: '#ff4757' },
            { label: 'Medium', value: stats.by_severity?.Medium ?? 0, color: '#ffa502' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#161b22] border border-[#21262d] rounded-xl px-4 py-3 text-center">
              <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter toggle */}
      <div className="flex gap-2">
        {[false, true].map(v => (
          <button key={String(v)} onClick={() => setUnreadOnly(v)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                    unreadOnly === v
                      ? 'bg-[#00f5a020] text-[#00f5a0] border border-[#00f5a040]'
                      : 'bg-[#161b22] text-[#8b949e] border border-[#21262d]'
                  }`}>
            {v ? 'Unread' : 'All'}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <Panel>
        {loading && alerts.length === 0 ? (
          <div className="flex justify-center py-10"><Spinner size={28} /></div>
        ) : alerts.length === 0 ? (
          <EmptyState icon={Bell} message="No alerts yet. Start the live feed to receive alerts." />
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => {
              const Icon = TYPE_ICONS[alert.type] || TYPE_ICONS.default
              return (
                <div key={alert.id}
                     className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-all ${
                       alert.read
                         ? 'bg-[#0d1117] border-[#21262d] opacity-60'
                         : 'bg-[#161b22] border-[#21262d] hover:border-[#00f5a030]'
                     }`}>
                  <Icon size={16} className={
                    alert.severity === 'High'   ? 'text-[#ff4757] mt-0.5 shrink-0' :
                    alert.severity === 'Medium' ? 'text-[#ffa502] mt-0.5 shrink-0' :
                                                  'text-[#00f5a0] mt-0.5 shrink-0'
                  } />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge level={alert.severity} />
                      <span className="text-xs text-[#8b949e] font-mono">
                        {new Date(alert.timestamp * 1000).toLocaleString()}
                      </span>
                      {!alert.read && (
                        <span className="text-[9px] bg-[#ffa50230] text-[#ffa502] px-1.5 py-0.5 rounded font-mono uppercase">
                          new
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#e6edf3] mt-1">{alert.message}</p>
                  </div>
                  {!alert.read && (
                    <button onClick={() => handleRead(alert.id)}
                            className="text-[#8b949e] hover:text-[#00f5a0] transition-colors mt-0.5 shrink-0"
                            title="Mark as read">
                      <CheckCheck size={15} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
