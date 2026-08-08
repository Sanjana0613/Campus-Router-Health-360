// components/RankingsTable.jsx — Enterprise Fleet Navigation Sidebar (Search, Filters, Compact Cards)

import { Search, Building2, Cpu, Filter, X } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center p-8 text-[var(--text-muted)] gap-2">
        <div className="w-6 h-6 border-2 border-[var(--border-card)] border-t-blue-500 rounded-full animate-spin" />
        <span className="text-[11px] font-medium">Loading fleet data…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 m-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
        Failed to load fleet rankings: {error}
      </div>
    )
  }

  const buildings = Array.from(new Set(routers.map((r) => r.building).filter(Boolean))).sort()
  const firmwares = Array.from(
    new Set(routers.map((r) => r.firmware_version || r.model).filter(Boolean))
  ).sort()

  const filtered = routers.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchId = (r.router_id || '').toLowerCase().includes(q)
      const matchBldg = (r.building || '').toLowerCase().includes(q)
      const matchRoom = String(r.room || '').toLowerCase().includes(q)
      const matchModel = (r.model || '').toLowerCase().includes(q)
      const matchFw = (r.firmware_version || '').toLowerCase().includes(q)
      if (!matchId && !matchBldg && !matchRoom && !matchModel && !matchFw) return false
    }

    if (statusFilter !== 'all') {
      const status = getRouterStatus(r.score)
      if (status !== statusFilter) return false
    }

    if (buildingFilter !== 'all' && r.building !== buildingFilter) {
      return false
    }

    if (firmwareFilter !== 'all') {
      if (r.firmware_version !== firmwareFilter && r.model !== firmwareFilter) {
        return false
      }
    }

    return true
  })

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)]">
      
      {/* Search & Filter Header */}
      <div className="p-3.5 border-b border-[var(--border-app)] bg-[var(--bg-panel)] sticky top-0 z-20 space-y-2.5">
        
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Fleet Inventory
          </h2>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            <strong className="text-[var(--text-main)] font-semibold">{filtered.length}</strong> / {routers.length}
          </span>
        </div>

        {/* Real-time Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            type="text"
            id="fleet-search-input"
            className="w-full enterprise-input pl-8 pr-7 py-1.5 text-xs font-sans"
            placeholder="Filter ID, Building, Room, Model…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search routers"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--bg-chip)] border border-[var(--border-card)]">
          {[
            { id: 'all', label: 'All' },
            { id: 'critical', label: 'Critical' },
            { id: 'warning', label: 'Warning' },
            { id: 'healthy', label: 'Healthy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`flex-1 py-1 px-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer font-mono ${
                statusFilter === tab.id
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-bright)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Building & Firmware Filter Selects */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="relative">
            <Building2 className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] pointer-events-none" />
            <select
              id="building-filter-select"
              value={buildingFilter}
              onChange={(e) => onBuildingFilterChange(e.target.value)}
              className="w-full enterprise-input pl-7 pr-1 py-1 text-[11px] cursor-pointer"
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

          <div className="relative">
            <Cpu className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] pointer-events-none" />
            <select
              id="firmware-filter-select"
              value={firmwareFilter}
              onChange={(e) => onFirmwareFilterChange(e.target.value)}
              className="w-full enterprise-input pl-7 pr-1 py-1 text-[11px] cursor-pointer"
              aria-label="Filter by firmware"
            >
              <option value="all">All Models</option>
              {firmwares.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Router Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)]">
            <Filter className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">No matching routers found.</p>
            <button
              onClick={() => {
                onSearchChange('')
                onStatusFilterChange('all')
                onBuildingFilterChange('all')
                onFirmwareFilterChange('all')
              }}
              className="mt-2 text-xs text-blue-500 hover:underline cursor-pointer"
            >
              Reset filters
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
                className={`enterprise-card p-3 cursor-pointer relative transition-all duration-150 ${
                  isSelected
                    ? 'ring-1 ring-blue-500/50 bg-[var(--bg-card-hover)] border-blue-500/40 shadow-xs'
                    : 'hover:border-[var(--border-bright)] hover:bg-[var(--bg-card-hover)]'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(router.router_id)}
                aria-label={`Router ${router.router_id}, health score ${router.score}`}
                aria-pressed={isSelected}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">#{index + 1}</span>
                    <h4 className="text-xs font-bold font-mono text-[var(--text-main)]">
                      {router.router_id}
                    </h4>
                    <span className={`status-badge ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold font-mono" style={{ color }}>
                      {router.score.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-[var(--text-subtle)] font-mono ml-0.5">/100</span>
                  </div>
                </div>

                {/* Score Track */}
                <div className="w-full h-1 rounded-full bg-[var(--bg-chip)] overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${router.score}%`, backgroundColor: color }}
                  />
                </div>

                {/* Meta & Failure Pattern Tag */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[var(--text-muted)] truncate max-w-[150px]">
                    {router.building} · Rm {router.room}
                  </span>
                  <span
                    className="px-1.5 py-0.2 rounded text-[9px] font-medium truncate max-w-[130px]"
                    style={{ backgroundColor: pattern.bg, color: pattern.color }}
                  >
                    {pattern.label}
                  </span>
                </div>

              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
