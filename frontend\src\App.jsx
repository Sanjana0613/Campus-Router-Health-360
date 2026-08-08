// App.jsx — root component

import { useEffect, useState } from 'react'
import { getRankings } from './api/client.js'
import RankingsTable from './components/RankingsTable.jsx'
import RouterDetail from './components/RouterDetail.jsx'

export default function App() {
  const [routers, setRouters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [routerCount, setRouterCount] = useState(null)

  useEffect(() => {
    getRankings()
      .then((data) => {
        setRouters(data)
        setRouterCount(data.length)
        // Auto-select the worst router
        if (data.length > 0) setSelectedId(data[0].router_id)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header" role="banner">
        <div className="header-brand">
          <div className="header-logo" aria-hidden="true">📡</div>
          <div>
            <div className="header-title">Router Health Monitor</div>
            <div className="header-subtitle">College ISP · Fleet Intelligence Dashboard</div>
          </div>
        </div>
        <div className="header-status" aria-live="polite">
          <div className="status-dot" aria-hidden="true" />
          {routerCount !== null
            ? `${routerCount} routers monitored`
            : 'Connecting…'}
        </div>
      </header>

      {/* Main two-panel layout */}
      <main className="app-main" role="main">
        {/* Left: Rankings */}
        <nav className="panel-left" aria-label="Router rankings">
          <RankingsTable
            routers={routers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            error={error}
          />
        </nav>

        {/* Right: Detail */}
        <section className="panel-right" aria-label="Router detail">
          <RouterDetail routerId={selectedId} />
        </section>
      </main>
    </div>
  )
}
