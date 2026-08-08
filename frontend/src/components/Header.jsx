// components/Header.jsx — Enterprise Top Navigation Bar

import { Sun, Moon, Activity, ShieldAlert, Cpu } from 'lucide-react'

export default function Header({ isDark, onToggleTheme, totalCount, criticalCount, avgScore }) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-app)] transition-colors duration-150">
      <div className="max-w-[1700px] mx-auto px-6 h-14 flex items-center justify-between">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 font-extrabold font-mono text-sm shadow-xs">
            360
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-[var(--text-main)]">
                Campus Router Health 360
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono uppercase">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">
              ISP Fleet Health & Diagnostic Intelligence
            </p>
          </div>
        </div>

        {/* Fleet Metrics Summary Pills & Theme Toggle */}
        <div className="flex items-center gap-3">
          
          <div className="hidden md:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-chip)] border border-[var(--border-card)]">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[var(--text-muted)]">Fleet:</span>
              <span className="font-bold font-mono text-[var(--text-main)]">{totalCount ?? 0}</span>
            </div>

            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 font-mono">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="font-bold">{criticalCount} Critical</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-chip)] border border-[var(--border-card)]">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[var(--text-muted)]">Avg Score:</span>
              <span className="font-bold font-mono text-[var(--text-main)]">
                {avgScore != null ? avgScore.toFixed(1) : '—'}
              </span>
            </div>
          </div>

          {/* Clean Enterprise Day / Night Mode Toggle */}
          <button
            onClick={onToggleTheme}
            id="theme-toggle-btn"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[var(--bg-chip)] border border-[var(--border-card)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] transition-all text-xs font-medium cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">Dark</span>
              </>
            )}
          </button>

        </div>

      </div>
    </header>
  )
}
