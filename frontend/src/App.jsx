// App.jsx — Main Application Root with Theme Engine, Fleet Analytics, and Donut Pattern Sync

import { useEffect, useState } from 'react'
import { getRankings } from './api/client.js'
import Header from './components/Header.jsx'
import FleetAnalytics from './components/FleetAnalytics.jsx'
import RankingsTable from './components/RankingsTable.jsx'
import RouterDetail from './components/RouterDetail.jsx'
import { getRouterStatus } from './components/ScoreUtils.js'

export default function App() {
  // Theme State: Day / Night Mode
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved !== null) return saved === 'dark'
    return true
  })

  // Fleet Data States
  const [routers, setRouters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'critical' | 'warning' | 'healthy'
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [firmwareFilter, setFirmwareFilter] = useState('all')
  const [patternFilter, setPatternFilter] = useState('all') // Failure Pattern Donut Filter Code

  // Theme Sync
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark((prev) => !prev)

  // Fetch Rankings
  useEffect(() => {
    getRankings()
      .then((data) => {
        setRouters(data)
        if (data.length > 0) setSelectedId(data[0].router_id)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Fleet Summary Stats
  const totalCount = routers.length
  const criticalCount = routers.filter((r) => getRouterStatus(r.score) === 'critical').length
  const avgScore = totalCount > 0 ? routers.reduce((acc, r) => acc + (r.score ?? 0), 0) / totalCount : 0

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-150">
      
      {/* Header with Day/Night Theme Switcher */}
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        totalCount={totalCount}
        criticalCount={criticalCount}
        avgScore={avgScore}
      />

      {/* Main Content Area */}
      <main className="max-w-[1700px] mx-auto px-4 sm:px-6 py-5">
        
        {/* Fleet Health Distribution & Donut Chart */}
        <FleetAnalytics
          routers={routers}
          activeStatusFilter={statusFilter}
          onSelectStatusFilter={setStatusFilter}
          activePatternFilter={patternFilter}
          onSelectPatternFilter={setPatternFilter}
        />

        {/* 2-Panel Core Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Navigation & Search Pane */}
          <aside className="lg:col-span-4 enterprise-card h-[calc(100vh-200px)] overflow-hidden flex flex-col sticky top-20">
            <RankingsTable
              routers={routers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loading}
              error={error}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              buildingFilter={buildingFilter}
              onBuildingFilterChange={setBuildingFilter}
              firmwareFilter={firmwareFilter}
              onFirmwareFilterChange={setFirmwareFilter}
              patternFilter={patternFilter}
              onPatternFilterChange={setPatternFilter}
            />
          </aside>

          {/* Right Detail Pane */}
          <section className="lg:col-span-8">
            <RouterDetail routerId={selectedId} isDark={isDark} />
          </section>

        </div>

      </main>

    </div>
  )
}
