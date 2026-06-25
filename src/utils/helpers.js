/**
 * src/utils/helpers.js — round-1 baseline
 */

export function formatPrice(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return '--'
  const [intPart, decPart = '00'] = n.toFixed(2).split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withCommas}.${decPart}`
}

export function formatPercent(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return '--'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export function formatProfit(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return { text: '--', cls: 'text-flat' }
  const sign = n > 0 ? '+' : (n < 0 ? '' : '')
  const cls = n > 0 ? 'text-up' : (n < 0 ? 'text-down' : 'text-flat')
  return { text: `${sign}${formatPrice(n)}`, cls }
}

const MARKET_PATTERNS = [
  { re: /^SH\d{6}$/i, market: 'A股' },
  { re: /^SZ\d{6}$/i, market: 'A股' },
  { re: /^BJ\d{6}$/i, market: 'A股' },
  { re: /^HK\d{5}$/i, market: '港股' },
  { re: /^F\d{6}$/i,  market: '基金' },
  { re: /^\d{6}$/,    market: '基金' } // 6位纯数字默认基金代码
]

export function getMarketFromSymbol(symbol) {
  const s = String(symbol || '').trim().toUpperCase()
  if (!s) return '未知'
  for (const { re, market } of MARKET_PATTERNS) {
    if (re.test(s)) return market
  }
  // 字母开头(无前缀) → 美股
  if (/^[A-Z]{1,5}$/.test(s)) return '美股'
  return '未知'
}

export function isMarketOpen(date = new Date()) {
  const day = date.getUTCDay() // 0=Sunday, 6=Saturday
  if (day === 0 || day === 6) return false
  // A股: 北京 9:30-11:30, 13:00-15:00 = UTC 1:30-3:30, 5:00-7:00
  const h = date.getUTCHours()
  const m = date.getUTCMinutes()
  const t = h * 60 + m
  const morn = t >= 90 && t <= 210     // 1:30 - 3:30 UTC
  const aft  = t >= 300 && t <= 420    // 5:00 - 7:00 UTC
  return morn || aft
}

export function symbolToDisplayCode(symbol) {
  const s = String(symbol || '').trim().toUpperCase()
  if (!s) return ''
  return s.replace(/^(SH|SZ|BJ|HK|F)/i, '')
}
