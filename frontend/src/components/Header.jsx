// components/Header.jsx — Navigation bar with Day/Night Theme Switcher

import { Sun, Moon, Activity, Wifi, ShieldAlert } from 'lucide-react'

export default function Header({ isDark, onToggleTheme, totalCount, criticalCount, avgScore }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-header)] border-b border-[var(--border-app)] transition-colors duration-200">
      <div className="max-w-[1700px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-[var(--text-main)]">
                Campus Router Health 360
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider">
                v2.0 Pro
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              College ISP · Fleet Intelligence & AI Diagnostics
            </p>
          </div>
        </div>

        {/* Fleet Summary Badges & Theme Toggle */}
        <div className="flex items-center gap-4">
          
          {/* Status Badges */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-chip)] border border-[var(--border-card)]">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span className="text-[var(--text-secondary)] font-medium">Monitored:</span>
              <span className="font-bold font-mono text-[var(--text-main)]">{totalCount ?? 0}</span>
            </div>

            {criticalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                <ShieldAlert className="w-4 h-4" />
                <span className="font-medium">Critical:</span>
                <span className="font-bold font-mono">{criticalCount}</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-chip)] border border-[var(--border-card)]">
              <span className="text-[var(--text-secondary)] font-medium">Avg Fleet Score:</span>
              <span className="font-bold font-mono text-[var(--text-main)]">
                {avgScore != null ? avgScore.toFixed(1) : '—'} / 100
              </span>
            </div>
          </div>

          {/* Theme Switcher Button (Day / Night Mode) */}
          <button
            onClick={onToggleTheme}
            id="theme-toggle-btn"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-bright)] transition-all duration-200 shadow-sm cursor-pointer"
            title={`Switch to ${isDark ? 'Day' : 'Night'} Mode`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="text-xs font-semibold">Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold">Night Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
