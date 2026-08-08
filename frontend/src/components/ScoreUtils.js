// components/ScoreUtils.js — Helper functions, status thresholds, failure pattern clustering

/**
 * Returns status category: 'critical' | 'warning' | 'healthy'
 */
export function getRouterStatus(score) {
  if (score < 30) return 'critical'
  if (score < 60) return 'warning'
  return 'healthy'
}

export function getStatusBadgeClass(score) {
  const status = getRouterStatus(score)
  if (status === 'critical') return 'badge-critical'
  if (status === 'warning') return 'badge-warning'
  return 'badge-healthy'
}

export function getStatusLabel(score) {
  const status = getRouterStatus(score)
  if (status === 'critical') return 'Critical'
  if (status === 'warning') return 'Warning'
  return 'Healthy'
}

export function getScoreColor(score) {
  const status = getRouterStatus(score)
  if (status === 'critical') return 'var(--color-critical)'
  if (status === 'warning') return 'var(--color-warning)'
  return 'var(--color-healthy)'
}

/**
 * Failure Pattern Clustering Engine
 * Classifies routers into human-readable failure patterns based on their metrics & complaints
 */
export function getFailurePattern(router) {
  const score = router.score ?? 100
  const signal = router.avg_signal ?? -50
  const packetLoss = router.avg_packet_loss ?? 0
  const disconnects = router.avg_disconnects ?? 0
  const latency = router.avg_latency ?? 20
  const speed = router.avg_speed ?? 50
  const complaints = router.complaints_count ?? 0

  if (score < 30 && signal < -70) {
    return {
      label: 'Signal Deadzone',
      code: 'DEADZONE',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      desc: 'Physical location blockage or extreme attenuation'
    }
  }

  if (packetLoss > 2.5 && disconnects > 2.5) {
    return {
      label: 'Firmware Instability',
      code: 'FIRMWARE',
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.12)',
      desc: 'Sustained packet loss & frequent re-authentications'
    }
  }

  if (latency > 80 || speed < 15) {
    return {
      label: 'High Evening Latency',
      code: 'LATENCY',
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.12)',
      desc: 'Channel congestion or bandwidth bottleneck'
    }
  }

  if (score >= 60 && complaints > 0) {
    return {
      label: 'User Expectation Gap',
      code: 'EXPECTATION',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.12)',
      desc: 'Healthy infrastructure; non-router user issue'
    }
  }

  if (score >= 60) {
    return {
      label: 'Optimal Performance',
      code: 'OPTIMAL',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      desc: 'All network metrics operating within normal range'
    }
  }

  return {
    label: 'General Degradation',
    code: 'DEGRADED',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    desc: 'Multiple minor metric deviations'
  }
}

export function getFixBadgeInfo(fix) {
  if (!fix || fix === 'none' || fix === 'null') {
    return { label: 'No Fix Required', class: 'badge-healthy', icon: 'CheckCircle' }
  }
  const lower = fix.toLowerCase()
  if (lower.includes('firmware')) return { label: 'Firmware Update', class: 'badge-warning', icon: 'RefreshCw' }
  if (lower.includes('relocate')) return { label: 'Relocate Router', class: 'badge-warning', icon: 'MapPin' }
  if (lower.includes('replace')) return { label: 'Replace Hardware', class: 'badge-critical', icon: 'AlertTriangle' }
  if (lower.includes('education')) return { label: 'User Education', class: 'theme-chip', icon: 'BookOpen' }
  return { label: fix, class: 'theme-chip', icon: 'Wrench' }
}
