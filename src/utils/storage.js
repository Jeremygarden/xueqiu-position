/**
 * src/utils/storage.js — round-1 baseline
 * Persists positions + xq_a_token via uni.getStorageSync / setStorageSync.
 * Falls back to in-memory map outside uni runtime (so vitest works).
 */

const KEY_POSITIONS = 'xq_positions'
const KEY_TOKEN = 'xq_a_token'

// Fallback shim for node/vitest
const _mem = new Map()
const storage = {
  get(key) {
    if (typeof uni !== 'undefined' && uni.getStorageSync) {
      try { return uni.getStorageSync(key) } catch (_) { return '' }
    }
    return _mem.has(key) ? _mem.get(key) : ''
  },
  set(key, val) {
    if (typeof uni !== 'undefined' && uni.setStorageSync) {
      try { uni.setStorageSync(key, val) } catch (_) { /* noop */ }
      return
    }
    _mem.set(key, val)
  }
}

export function getPositions() {
  const raw = storage.get(KEY_POSITIONS)
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (_) {
    return []
  }
}

export function savePositions(list) {
  const arr = Array.isArray(list) ? list : []
  storage.set(KEY_POSITIONS, JSON.stringify(arr))
}

export function addPosition(pos) {
  if (!pos || !pos.symbol) return getPositions()
  const list = getPositions().filter((p) => p.symbol !== pos.symbol)
  list.push(pos)
  savePositions(list)
  return list
}

export function removePosition(symbol) {
  const list = getPositions().filter((p) => p.symbol !== symbol)
  savePositions(list)
  return list
}

export function updatePosition(symbol, patch) {
  const list = getPositions().map((p) => {
    if (p.symbol === symbol) return { ...p, ...(patch || {}) }
    return p
  })
  savePositions(list)
  return list
}

export function getToken() {
  const t = storage.get(KEY_TOKEN)
  return typeof t === 'string' ? t : ''
}

export function setToken(token) {
  storage.set(KEY_TOKEN, typeof token === 'string' ? token : '')
}
