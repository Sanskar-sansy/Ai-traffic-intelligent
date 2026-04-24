import React, { useEffect } from 'react'
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react'

const ICONS = {
  High:   { Icon: AlertTriangle, cls: 'text-[#ff4757] bg-[#ff475715] border-[#ff475740]' },
  Medium: { Icon: AlertTriangle, cls: 'text-[#ffa502] bg-[#ffa50215] border-[#ffa50240]' },
  Low:    { Icon: Info,          cls: 'text-[#58a6ff] bg-[#58a6ff15] border-[#58a6ff40]' },
  None:   { Icon: CheckCircle,   cls: 'text-[#00f5a0] bg-[#00f5a015] border-[#00f5a040]' },
}

export function Toast({ alert, onDismiss }) {
  const { Icon, cls } = ICONS[alert.severity] || ICONS.None

  useEffect(() => {
    const t = setTimeout(() => onDismiss(alert.id), 6000)
    return () => clearTimeout(t)
  }, [alert.id, onDismiss])

  return (
    <div className={`flex items-start gap-3 border rounded-xl px-4 py-3 shadow-2xl animate-slide-in max-w-sm w-full ${cls}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{alert.type} — {alert.severity}</p>
        <p className="text-sm mt-0.5 leading-snug">{alert.message}</p>
        <p className="text-[10px] opacity-50 mt-1 font-mono">
          {new Date(alert.timestamp * 1000).toLocaleTimeString()}
        </p>
      </div>
      <button onClick={() => onDismiss(alert.id)} className="opacity-50 hover:opacity-100 transition-opacity mt-0.5">
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
      {toasts.map(t => <Toast key={t.id} alert={t} onDismiss={onDismiss} />)}
    </div>
  )
}
