// api/client.js — all API calls in one place

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const getRankings = () => apiFetch('/rankings')

export const getRouterDetail = (routerId) => apiFetch(`/routers/${encodeURIComponent(routerId)}`)

export const postCopilot = (routerId, question) =>
  apiFetch('/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ router_id: routerId, question }),
  })
