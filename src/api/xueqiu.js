/**
 * src/api/xueqiu.js — Xueqiu market & community data (round 16)
 *
 * All exports return safe fallbacks (empty array / null) on failure rather
 * than throwing, so the UI layer can render gracefully without try/catch.
 *
 * Endpoints used (unofficial, may need xq_a_token):
 *   GET https://stock.xueqiu.com/v5/stock/quote.json?symbol=XX,YY,...
 *   GET https://stock.xueqiu.com/v5/stock/chart/kline.json?symbol=XX&period=day&count=120
 *   GET https://stock.xueqiu.com/v5/stock/screener/quote/list.json?...
 *   GET https://danjuan.xueqiu.com/djapi/fund/detail/{symbol}
 *   GET https://xueqiu.com/v4/statuses/user_timeline.json?symbol=XX&count=10
 *   GET https://xueqiu.com/query/v1/suggest_stock.json?q=XX
 */

import { request, ENDPOINTS } from './request.js'
import { getMarketFromSymbol } from '@/utils/helpers.js'

// ---------- helpers --------------------------------------------------------
function _normalizeSymbol(symbol) {
  return String(symbol || '').trim().toUpperCase()
}

function _chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

/**
 * Classify a Xueqiu symbol into 'stock' | 'fund' | 'etf'.
 *
 * Rules:
 *   F000001          → fund    (open-end fund, Danjuan prefix)
 *   SH5xxxxx         → etf     (上交所 ETF / LOF 区段)
 *   SH588xxx         → etf     (科创板 ETF)
 *   SZ15xxxx/16xxxx  → etf     (深交所 ETF / LOF 区段)
 *   bare 6-digit:
 *     5xxxxx         → etf     (沪市 ETF, e.g. 510300)
 *     15xxxx/16xxxx  → etf     (深市 ETF / LOF)
 *     6xxxxx         → stock   (沪市主板)
 *     0xxxxx/3xxxxx  → stock   (深市主板 / 创业板)
 *     8xxxxx/4xxxxx  → stock   (北交所)
 *     others         → fund    (开放式基金 fallback)
 *   SH/SZ/BJ/HK + digits → stock
 *   ASCII letters    → stock   (美股)
 *   anything else    → stock
 */
function _toType(symbol) {
  const s = _normalizeSymbol(symbol)
  if (!s) return 'stock'

  // 1. Open-end fund (Danjuan F-prefixed canonical)
  if (/^F\d{6}$/.test(s)) return 'fund'

  // 2. Xueqiu-prefixed ETF / LOF
  if (/^SH5\d{5}$/.test(s) || /^SH588\d{3}$/.test(s)) return 'etf'
  if (/^SZ1[56]\d{4}$/.test(s)) return 'etf'

  // 3. Bare 6-digit codes — disambiguate by leading digit
  if (/^\d{6}$/.test(s)) {
    const head = s[0]
    const head2 = s.slice(0, 2)
    if (head === '5' || head2 === '15' || head2 === '16') return 'etf'
    if (head === '6' || head === '0' || head === '3' || head === '8' || head === '4') return 'stock'
    return 'fund' // 1xxxxx / 2xxxxx / 7xxxxx / 9xxxxx — open-end fund
  }

  // 4. Prefixed stocks (A股 / 港股)
  if (/^(SH|SZ|BJ|HK)\d+$/.test(s)) return 'stock'

  // 5. US tickers (1-5 ASCII letters, optional .CLASS suffix)
  if (/^[A-Z]{1,5}(\.[A-Z]+)?$/.test(s)) return 'stock'

  return 'stock'
}

function _safeNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// ---------- quote ---------------------------------------------------------
/**
 * Single-symbol quote.
 * @returns {Promise<Quote|null>}
 */
export async function fetchQuote(symbol) {
  const s = _normalizeSymbol(symbol)
  if (!s) return null
  try {
    const data = await request({
      url: '/v5/stock/quote.json',
      data: { symbol: s, extend: 'detail' }
    })
    const item = data && (data.quote || (data.items && data.items[0] && data.items[0].quote))
    if (!item) return null
    return _quoteFromRaw(item, s)
  } catch (err) {
    console.warn('[xueqiu] fetchQuote failed', s, err && err.message)
    return null
  }
}

function _quoteFromRaw(raw, fallbackSymbol) {
  const symbol = _normalizeSymbol(raw.symbol || fallbackSymbol)
  return {
    symbol,
    name: raw.name || raw.full_name || symbol,
    current: _safeNum(raw.current),
    percent: _safeNum(raw.percent),
    change: _safeNum(raw.chg ?? raw.change),
    high: _safeNum(raw.high),
    low: _safeNum(raw.low),
    open: _safeNum(raw.open),
    lastClose: _safeNum(raw.last_close),
    volume: _safeNum(raw.volume),
    marketCap: _safeNum(raw.market_capital),
    type: _toType(symbol),
    market: getMarketFromSymbol(symbol),
    currency: raw.currency || raw.currency_unit || ''
  }
}

/**
 * Batch quote — max 20 symbols per network call; auto-chunks.
 * @param {string[]} symbols
 * @returns {Promise<Quote[]>}
 */
export async function fetchBatchQuote(symbols) {
  const list = (Array.isArray(symbols) ? symbols : [])
    .map(_normalizeSymbol)
    .filter(Boolean)
  if (!list.length) return []
  const chunks = _chunk(list, 20)
  const results = []
  for (const chunk of chunks) {
    try {
      const data = await request({
        url: '/v5/stock/batch/quote.json',
        data: { symbol: chunk.join(',') }
      })
      const items = (data && (data.items || data.list)) || []
      for (const item of items) {
        const q = _quoteFromRaw(item.quote || item, item.symbol)
        if (q && q.symbol) results.push(q)
      }
    } catch (err) {
      console.warn('[xueqiu] fetchBatchQuote chunk failed', chunk, err && err.message)
    }
  }
  return results
}

// ---------- kline ---------------------------------------------------------
const PERIOD_MAP = {
  day: 'day',
  week: 'week',
  month: 'month',
  '1d': 'day',
  '1w': 'week',
  '1m': 'month'
}

/**
 * Historical kline. Returns parallel arrays for charting & indicators.
 * @returns {Promise<{timestamps:number[], closes:number[], volumes:number[]}>}
 */
export async function fetchKline(symbol, period = 'day', count = 120) {
  const s = _normalizeSymbol(symbol)
  const empty = { timestamps: [], closes: [], volumes: [] }
  if (!s) return empty
  const safePeriod = PERIOD_MAP[period] || 'day'
  try {
    const data = await request({
      url: '/v5/stock/chart/kline.json',
      data: {
        symbol: s,
        begin: Date.now(),
        period: safePeriod,
        type: 'before',
        count: -Math.abs(count),
        indicator: 'kline'
      }
    })
    if (!data || !Array.isArray(data.item) || !Array.isArray(data.column)) return empty
    const col = data.column
    const idx = {
      ts: col.indexOf('timestamp'),
      close: col.indexOf('close'),
      volume: col.indexOf('volume')
    }
    const timestamps = []
    const closes = []
    const volumes = []
    for (const row of data.item) {
      if (idx.ts >= 0) timestamps.push(_safeNum(row[idx.ts]))
      if (idx.close >= 0) closes.push(_safeNum(row[idx.close]))
      if (idx.volume >= 0) volumes.push(_safeNum(row[idx.volume]))
    }
    return { timestamps, closes: closes.filter((v) => v != null), volumes: volumes.filter((v) => v != null) }
  } catch (err) {
    console.warn('[xueqiu] fetchKline failed', s, err && err.message)
    return empty
  }
}

// ---------- fund nav ------------------------------------------------------
/**
 * Fund detail (uses Danjuan endpoint).
 *
 * Only accepts open-end fund codes:
 *   - 'F000001'   (Xueqiu canonical)
 *   - '000001'    (6 raw digits, treated as fund only when leading digit is not
 *                  a stock/ETF marker — i.e. NOT 6/0/3/8/4/5, NOT 15/16 prefix)
 * For prefixed stocks (SH/SZ/HK/BJ) or US tickers we return null without
 * hitting the network, since Danjuan would reject them anyway.
 *
 * @returns {Promise<{nav:number, navDate:string, accNav:number, growthRate:number, unitNav:number}|null>}
 */
export async function fetchFundNav(symbol) {
  const raw = _normalizeSymbol(symbol)
  if (!raw) return null

  // Reject anything that's clearly not an open-end fund.
  // Accept: F\d{6}  or  bare 6 digits whose _toType resolves to 'fund'.
  let code = ''
  if (/^F\d{6}$/.test(raw)) {
    code = raw.slice(1)
  } else if (/^\d{6}$/.test(raw) && _toType(raw) === 'fund') {
    code = raw
  } else {
    return null
  }

  try {
    const data = await request({
      url: `/djapi/fund/detail/${code}`,
      baseUrl: ENDPOINTS.FUND
    })
    const fd = (data && (data.fund_detail || data.fund_derived || data)) || null
    if (!fd) return null
    return {
      nav: _safeNum(fd.unit_net_value ?? fd.nav),
      navDate: fd.fund_nav_date || fd.end_date || '',
      accNav: _safeNum(fd.acc_net_value ?? fd.total_nav),
      growthRate: _safeNum(fd.day_growth_rate ?? fd.growth_rate ?? fd.percent),
      unitNav: _safeNum(fd.unit_net_value ?? fd.nav)
    }
  } catch (err) {
    console.warn('[xueqiu] fetchFundNav failed', symbol, err && err.message)
    return null
  }
}

// ---------- timeline (community posts) -----------------------------------
/**
 * Community timeline / status feed for a symbol.
 * @returns {Promise<Array<{id, title, text, author, likeCount, createdAt, url}>>}
 */
export async function fetchTimeline(symbol, count = 10) {
  const s = _normalizeSymbol(symbol)
  if (!s) return []
  try {
    const data = await request({
      url: '/v4/statuses/user_timeline.json',
      baseUrl: ENDPOINTS.XUEQIU,
      data: { symbol: s, count }
    })
    const list = (data && (data.statuses || data.list)) || []
    return list.map((post) => ({
      id: post.id || post.status_id,
      title: post.title || (post.text || '').replace(/<[^>]+>/g, '').slice(0, 40),
      text: (post.text || post.description || '').replace(/<[^>]+>/g, '').slice(0, 200),
      author: (post.user && (post.user.screen_name || post.user.name)) || '匿名',
      likeCount: _safeNum(post.like_count) || 0,
      createdAt: post.created_at || post.timeBefore || '',
      url: post.target ? `https://xueqiu.com${post.target}` : (post.id ? `https://xueqiu.com/status/${post.id}` : '')
    }))
  } catch (err) {
    console.warn('[xueqiu] fetchTimeline failed', s, err && err.message)
    return []
  }
}

// ---------- search --------------------------------------------------------
/**
 * Search securities by keyword.
 * @returns {Promise<Array<{symbol, name, type, market}>>}
 */
export async function searchStocks(keyword) {
  const q = String(keyword || '').trim()
  if (!q) return []
  try {
    const data = await request({
      url: '/query/v1/suggest_stock.json',
      baseUrl: ENDPOINTS.XUEQIU,
      data: { q }
    })
    const list = (data && (data.data || data.list || data)) || []
    return list.map((item) => {
      const symbol = _normalizeSymbol(item.code || item.symbol)
      return {
        symbol,
        name: item.query || item.name || symbol,
        type: _toType(symbol),
        market: getMarketFromSymbol(symbol)
      }
    }).filter((s) => s.symbol)
  } catch (err) {
    console.warn('[xueqiu] searchStocks failed', q, err && err.message)
    return []
  }
}
