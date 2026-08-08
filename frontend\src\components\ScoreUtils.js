// components/ScoreUtils.js — shared score color/label helpers

export function getScoreColor(score) {
  if (score < 30) return 'var(--score-bad)'
  if (score < 50) return 'var(--score-mid)'
  if (score < 70) return 'var(--score-ok)'
  return 'var(--score-good)'
}

export function getScoreLabel(score) {
  if (score < 30) return 'Critical'
  if (score < 50) return 'Poor'
  if (score < 70) return 'Fair'
  return 'Healthy'
}

export function getFixClass(fix) {
  if (!fix || fix === 'none') return 'fix-none'
  if (fix.includes('firmware')) return 'fix-firmware'
  if (fix.includes('relocate')) return 'fix-relocate'
  if (fix.includes('replace')) return 'fix-replace'
  if (fix.includes('education')) return 'fix-education'
  return 'fix-firmware'
}

export function getFixIcon(fix) {
  if (!fix || fix === 'none') return '✅'
  if (fix.includes('firmware')) return '🔧'
  if (fix.includes('relocate')) return '📍'
  if (fix.includes('replace')) return '🔄'
  if (fix.includes('education')) return '📚'
  return '🔧'
}
