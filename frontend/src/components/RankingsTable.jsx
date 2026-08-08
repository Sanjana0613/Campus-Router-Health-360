// components/RankingsTable.jsx — Fleet Navigation, Search Box, Building & Firmware Filters, Router Cards

import { Search, Filter, Building2, Cpu, ArrowUpDown } from 'lucide-react'
import { getRouterStatus, getStatusBadgeClass, getStatusLabel, getScoreColor, getFailurePattern } from './ScoreUtils.js'

export default function RankingsTable({
  routers,
  selectedId,
  onSelect,
  loading,
  error,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  buildingFilter,
  onBuildingFilterChange,
  firmwareFilter,
  onFirmwareFilterChange,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-[var(--text-muted)] gap-3">
        <div className="w-8 h-8 border-3 border-[var(--border-card)] border-t-[var(--color-accent-blue)] rounded-full animate-spin" />
        <span className="text-xs font-medium">Loading fleet data…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 m-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
        Failed to load fleet rankings: {error}
      </div>
    )
  }

  // Extract unique buildings and firmware for dropdowns
  const buildings = Array.from(new Set(routers.map((r) => r.building).filter(Boolean))).sort()
  const firmwares = Array.from(
    new Set(routers.map((r) => r.firmware_version || r.model).filter(Boolean))
  ).sort()

  // Apply filters
  const filtered = routers.filter((r) => {
    // Search query (Router ID, Building, Room, Model, Firmware)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchId = (r.router_id || '').toLowerCase().includes(q)
      const matchBldg = (r.building || '').toLowerCase().includes(q)
      const matchRoom = String(r.room || '').toLowerCase().includes(q)
      const matchModel = (r.model || '').toLowerCase().includes(q)
      const matchFw = (r.firmware_version || '').toLowerCase().includes(q)
      if (!matchId && !matchBldg && !matchRoom && !matchModel && !matchFw) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      const status = getRouterStatus(r.score)
      if (status !== statusFilter) return false
    }

    // Building filter
    if (buildingFilter !== 'all' && r.building !== buildingFilter) {
      return false
    }

    // Firmware filter
    if (firmwareFilter !== 'all') {
      if (r.firmware_version !== firmwareFilter && r.model !== firmwareFilter) {
        return false
      }
    }

    return true
  })

  return (
    <div className="flex flex-col h-full">
      
      {/* Search & Filter Section Header */}
      <div className="p-4 border-b border-[var(--border-app)] bg-[var(--bg-panel)] sticky top-0 z-20 space-y-3">
        
        {/* Title & Counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-[var(--color-accent-blue)]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Fleet Rankings
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Showing <strong className="text-[var(--text-main)] font-bold">{filtered.length}</strong> of {routers.length}
          </span>
        </div>

        {/* Real-time Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            type="text"
            id="fleet-search-input"
            className="w-full theme-input pl-9 pr-3 py-2 text-xs"
            placeholder="Search Router ID, Building, Room, Model…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search routers"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-card)]">
          {[
            { id: 'all', label: 'All Fleet' },
            { id: 'critical', label: 'Critical' },
            { id: 'warning', label: 'Warning' },
            { id: 'healthy', label: 'Healthy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-bright)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters: Building & Firmware */}
        <div className="grid grid-cols-2 gap-2">
          {/* Building Filter */}
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] pointer-events-none" />
            <select
              id="building-filter-select"
              value={buildingFilter}
              onChange={(e) => onBuildingFilterChange(e.target.value)}
              className="w-full theme-input pl-8 pr-2 py-1.5 text-[11px] appearance-none cursor-pointer"
              aria-label="Filter by building"
            >
              <option value="all">All Buildings</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Firmware Filter */}
          <div className="relative">
            <Cpu className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] pointer-events-none" />
            <select
              id="firmware-filter-select"
              value={firmwareFilter}
              onChange={(e) => onFirmwareFilterChange(e.target.value)}
              className="w-full theme-input pl-8 pr-2 py-1.5 text-[11px] appearance-none cursor-pointer"
              aria-label="Filter by firmware"
            >
              <option value="all">All Models / Firmware</option>
              {firmwares.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Router List Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-[var(--text-muted)]">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No routers match your search filters.</p>
            <button
              onClick={() => {
                onSearchChange('')
                onStatusFilterChange('all')
                onBuildingFilterChange('all')
                onFirmwareFilterChange('all')
              }}
              className="mt-3 text-xs text-[var(--color-accent-blue)] underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filtered.map((router, index) => {
            const isSelected = router.router_id === selectedId
            const color = getScoreColor(router.score)
            const pattern = getFailurePattern(router)
            const statusBadgeClass = getStatusBadgeClass(router.score)
            const statusLabel = getStatusLabel(router.score)

            return (
              <div
                key={router.router_id}
                id={`router-card-${router.router_id}`}
                onClick={() => onSelect(router.router_id)}
                className={`theme-card p-3.5 cursor-pointer relative overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-[var(--color-accent-blue)] bg-[var(--bg-card-hover)] shadow-md'
                    : 'hover:border-[var(--border-bright)] hover:bg-[var(--bg-card-hover)]'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(router.router_id)}
                aria-label={`Router ${router.router_id}, health score ${router.score}`}
                aria-pressed={isSelected}
              >
                {/* Active selection bar indicator */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent-blue)]" />
                )}

                {/* Top Row: Rank, ID, Status Badge & Score */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">#{index + 1}</span>
                      <h4 className="text-sm font-bold font-mono text-[var(--text-main)]">
                        {router.router_id}
                      </h4>
                      <span className={`status-badge ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {router.building} · Room {router.room}
                    </p>
                  </div>

                  {/* Health Score Box */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-extrabold font-mono leading-none" style={{ color }}>
                      {router.score.toFixed(1)}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--text-subtle)] mt-0.5">
                      / 100
                    </div>
                  </div>
                </div>

                {/* Health Score Bar */}
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden mb-2.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${router.score}%`, backgroundColor: color }}
                  />
                </div>

                {/* Failure Pattern Cluster Chip & Hardware Specs */}
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span
                    className="px-2 py-0.5 rounded-md font-medium text-[10px] truncate max-w-[170px]"
                    style={{ backgroundColor: pattern.bg, color: pattern.color }}
                    title={pattern.desc}
                  >
                    {pattern.label}
                  </span>
                  <span className="text-[var(--text-subtle)] font-mono text-[10px]">
                    {router.model} ({router.firmware_version})
                  </span>
                </div>

                {/* Mini Metrics Summary Row */}
                <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-[var(--border-app)] text-center text-[10px]">
                  <div className="p-1 rounded bg-[var(--bg-input)]">
                    <span className="font-bold font-mono text-[var(--text-main)]">{router.avg_speed.toFixed(0)}</span>
                    <span className="text-[var(--text-subtle)] block text-[8px] uppercase">Mbps</span>
                  </div>
                  <div className="p-1 rounded bg-[var(--bg-input)]">
                    <span className="font-bold font-mono text-[var(--text-main)]">{router.avg_latency.toFixed(0)}</span>
                    <span className="text-[var(--text-subtle)] block text-[8px] uppercase">ms</span>
                  </div>
                  <div className="p-1 rounded bg-[var(--bg-input)]">
                    <span className="font-bold font-mono text-[var(--text-main)]">{router.avg_packet_loss.toFixed(1)}%</span>
                    <span className="text-[var(--text-subtle)] block text-[8px] uppercase">Pkt Loss</span>
                  </div>
                </div>

              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
