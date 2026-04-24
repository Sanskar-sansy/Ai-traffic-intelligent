import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Activity, Upload, TrendingUp, ShieldAlert,
  Bell, Cpu, Radio, Map   // ✅ added Map icon
} from 'lucide-react'

const NAV = [
  { to: '/',          icon: Activity,    label: 'Live Feed' },
  { to: '/upload',    icon: Upload,      label: 'Upload Video' },
  { to: '/predict',   icon: TrendingUp,  label: 'Traffic Prediction' },
  { to: '/forecast',  icon: Radio,       label: 'Hourly Forecast' },
  { to: '/safety',    icon: ShieldAlert, label: 'Road Safety' },

  // 🔥 NEW ROUTE FEATURE
  { to: '/route',     icon: Map,         label: 'Route Intelligence' },

  { to: '/alerts',    icon: Bell,        label: 'Alert History' },
]

export default function Sidebar({ alertCount = 0 }) {
  return (
    <aside className="w-56 shrink-0 bg-[#0d1117] border-r border-[#21262d] flex flex-col h-screen sticky top-0">
      
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#21262d]">
        <div className="flex items-center gap-2">
          <Cpu size={20} className="text-[#00f5a0]" />
          <span className="font-display font-bold text-sm tracking-tight leading-tight">
            Traffic<br />
            <span className="text-[#00f5a0]">Intelligence</span>
          </span>
        </div>
        <p className="text-[10px] text-[#8b949e] mt-1 font-mono">
          AI System v1.0
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[#00f5a015] text-[#00f5a0] font-medium border border-[#00f5a030]'
                  : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-[#00f5a0]' : ''} />
                <span className="flex-1">{label}</span>

                {label === 'Alert History' && alertCount > 0 && (
                  <span className="text-[10px] bg-[#ff4757] text-white rounded-full px-1.5 py-0.5 font-mono min-w-[18px] text-center">
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#21262d]">
        <p className="text-[10px] text-[#8b949e] font-mono">
          Real-time AI Analysis<br />
          <span className="text-[#00f5a060]">● System Operational</span>
        </p>
      </div>
    </aside>
  )
}