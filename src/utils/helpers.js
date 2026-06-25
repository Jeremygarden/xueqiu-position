export function formatMoney(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '--'
  return Number(value).toFixed(decimals)
}

export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '--'
  const sign = value > 0 ? '+' : ''
  return `${sign}${Number(value).toFixed(decimals)}%`
}

export function formatLargeNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '--'
  const abs = Math.abs(value)
  if (abs >= 1e8) return `${(value / 1e8).toFixed(2)}亿`
  if (abs >= 1e4) return `${(value / 1e4).toFixed(2)}万`
  return Number(value).toFixed(2)
}

export function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function detectMarket(code) {
  if (!code) return 'A股'
  const upper = code.toUpperCase()
  if (upper.startsWith('HK') || /^\d{5}$/.test(upper)) return '港股'
  if (upper.endsWith('.US') || /^[A-Z]{1,4}$/.test(upper)) return '美股'
  return 'A股'
}

export function detectType(code) {
  if (!code) return '股票'
  const upper = code.toUpperCase()
  const numeric = upper.replace(/^(SH|SZ|HK)/, '')
  const fundPatterns = /^(16|15|51|58|159|510|511|512|513|514|515|516|517|518|519|520|521|522|523|524|525|526|527|528|588)/
  if (fundPatterns.test(numeric)) return '基金'
  return '股票'
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = now - (typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return formatDate(timestamp)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
