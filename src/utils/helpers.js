/**
 * src/utils/helpers.js — formatting + market helpers (round 17 polish)
 *
 * formatPrice(num)              → "1,234.56"
 * formatPercent(num)            → "+1.23%" (signed)
 * formatProfit(num)             → { text, cls }  ('text-up'|'text-down'|'text-flat')
 * getMarketFromSymbol(symbol)   → 'A股'|'港股'|'美股'|'基金'|'未知'
 * isMarketOpen([date])          → boolean (A 股交易时段)
 * symbolToDisplayCode(symbol)   → strip SH/SZ/BJ/HK/F prefix
 */

export function formatPrice(num) {
  if (num === null || num === undefined || num === '') return '--'
  const n = Number(num)
  if (!Number.isFinite(n)) return '--'
  const [intPart, decPart = '00'] = Math.abs(n).toFixed(2).split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = n < 0 ? '-' : ''
  return `${sign}${withCommas}.${decPart}`
}

export function formatPercent(num) {
  if (num === null || num === undefined || num === '') return '--'
  const n = Number(num)
  if (!Number.isFinite(n)) return '--'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export function formatProfit(num) {
  if (num === null || num === undefined || num === '') return { text: '--', cls: 'text-flat' }
  const n = Number(num)
  if (!Number.isFinite(n)) return { text: '--', cls: 'text-flat' }
  const sign = n > 0 ? '+' : ''
  const cls = n > 0 ? 'text-up' : (n < 0 ? 'text-down' : 'text-flat')
  return { text: `${sign}${formatPrice(n)}`, cls }
}

/**
 * Market detection.
 *
 * Prefixed forms (preferred / what Xueqiu returns):
 *   SH600519, SZ000858, BJ430047 → A股
 *   HK00700                       → 港股
 *   F000001                       → 基金
 *   AAPL, NVDA                    → 美股
 *
 * Bare codes (typed by user, no prefix):
 *   6xxxxx                        → A股 (上证)
 *   0xxxxx / 3xxxxx               → A股 (深证 / 创业板)
 *   8xxxxx / 4xxxxx               → A股 (北交所)
 *   5/15/16 leading 6-digit       → 基金/ETF — labeled '基金' to avoid false promise
 *   1-5 letters                   → 美股
 */
export function getMarketFromSymbol(symbol) {
  const s = String(symbol || '').trim().toUpperCase()
  if (!s) return '未知'

  // 1. Prefixed (Xueqiu canonical)
  if (/^SH\d{6}$/.test(s) || /^SZ\d{6}$/.test(s) || /^BJ\d{6}$/.test(s)) return 'A股'
  if (/^HK\d{4,5}$/.test(s)) return '港股'
  if (/^F\d{6}$/.test(s)) return '基金'

  // 2. Bare 6-digit codes
  if (/^\d{6}$/.test(s)) {
    const head = s[0]
    if (head === '6') return 'A股'              // 沪市主板
    if (head === '0' || head === '3') return 'A股' // 深市主板 / 创业板
    if (head === '8' || head === '4') return 'A股' // 北交所
    if (head === '5' || head === '1') return '基金' // ETF / LOF
    return '基金'
  }

  // 3. 5-digit HK numeric
  if (/^\d{5}$/.test(s)) return '港股'

  // 4. Pure letters → US
  if (/^[A-Z]{1,5}$/.test(s)) return '美股'
  if (/^[A-Z]+\.[A-Z]+$/.test(s)) return '美股' // BRK.A

  return '未知'
}

/**
 * Is A-share market currently open?
 * Trading hours: 09:30-11:30, 13:00-15:00 Asia/Shanghai (UTC+8).
 * Returns a conservative `false` on weekends; does not handle holidays.
 */
export function isMarketOpen(date = new Date()) {
  // Convert to UTC+8 (Asia/Shanghai)
  const tzOffsetMs = 8 * 60 * 60 * 1000
  const shanghai = new Date(date.getTime() + tzOffsetMs)
  const day = shanghai.getUTCDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false
  const t = shanghai.getUTCHours() * 60 + shanghai.getUTCMinutes()
  // 09:30 ≤ t < 11:30  (close at exactly 11:30; inclusive start)
  // 13:00 ≤ t < 15:00  (close at exactly 15:00)
  const morn = t >= 9 * 60 + 30 && t < 11 * 60 + 30
  const aft = t >= 13 * 60 && t < 15 * 60
  return morn || aft
}

export function symbolToDisplayCode(symbol) {
  const s = String(symbol || '').trim().toUpperCase()
  if (!s) return ''
  return s.replace(/^(SH|SZ|BJ|HK|F)/, '')
}
