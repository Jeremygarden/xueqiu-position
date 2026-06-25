const STORAGE_KEYS = {
  POSITIONS: 'xq_positions',
  TOKEN: 'xq_a_token',
  SETTINGS: 'xq_settings'
}

export function getAllPositions() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.POSITIONS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function savePositions(positions) {
  try {
    uni.setStorageSync(STORAGE_KEYS.POSITIONS, JSON.stringify(positions))
    return true
  } catch {
    return false
  }
}

export function addPosition(position) {
  const positions = getAllPositions()
  const exists = positions.find(p => p.code === position.code)
  if (exists) return false
  positions.push({
    ...position,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: Date.now()
  })
  return savePositions(positions)
}

export function updatePosition(id, updates) {
  const positions = getAllPositions()
  const index = positions.findIndex(p => p.id === id)
  if (index === -1) return false
  positions[index] = { ...positions[index], ...updates }
  return savePositions(positions)
}

export function deletePosition(id) {
  const positions = getAllPositions()
  const filtered = positions.filter(p => p.id !== id)
  return savePositions(filtered)
}

export function getPosition(id) {
  const positions = getAllPositions()
  return positions.find(p => p.id === id) || null
}

export function getToken() {
  try {
    return uni.getStorageSync(STORAGE_KEYS.TOKEN) || ''
  } catch {
    return ''
  }
}

export function setToken(token) {
  try {
    uni.setStorageSync(STORAGE_KEYS.TOKEN, token)
    return true
  } catch {
    return false
  }
}

export function getSettings() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.SETTINGS)
    return data ? JSON.parse(data) : {
      refreshInterval: 30,
      darkMode: false,
      sortBy: 'default'
    }
  } catch {
    return { refreshInterval: 30, darkMode: false, sortBy: 'default' }
  }
}

export function saveSettings(settings) {
  try {
    uni.setStorageSync(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export { STORAGE_KEYS }
