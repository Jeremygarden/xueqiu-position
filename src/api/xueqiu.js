import { get, BASE_URL, FUND_BASE_URL } from './request'

function mapMarket(symbol) {
  if (!symbol) return 'unknown'
  if (symbol.startsWith('6') || symbol.startsWith('0') || symbol.startsWith('3')) return 'SH'
  if (symbol.startsWith('5')) return 'SH'
  if (symbol.startsWith('159') || symbol.startsWith('510') || symbol.startsWith('511') || symbol.startsWith('512') || symbol.startsWith('513') || symbol.startsWith('514') || symbol.startsWith('515') || symbol.startsWith('516') || symbol.startsWith('517') || symbol.startsWith('518') || symbol.startsWith('519') || symbol.startsWith('520') || symbol.startsWith('521') || symbol.startsWith('522') || symbol.startsWith('523') || symbol.startsWith('524') || symbol.startsWith('525') || symbol.startsWith('526') || symbol.startsWith('527') || symbol.startsWith('528') || symbol.startsWith('580') || symbol.startsWith('588')) return 'SH'
  if (symbol.startsWith('16') || symbol.startsWith('15')) return 'SZ'
  return 'SH'
}

export function buildXueqiuSymbol(code, market = 'SH') {
  const m = market.toUpperCase()
  if (m === 'HK') return code
  if (m === 'US') return code
  return `${m}${code}`
}

export function buildFullSymbol(code, market) {
  const m = (market || mapMarket(code)).toUpperCase()
  if (m === 'HK') return `${code}`
  if (m === 'US') return `${code}`
  return `${m}${code}`
}

function formatKlineData(raw) {
  if (!raw || !raw.data || !raw.data.item) return []
  const { item, column } = raw.data
  return item.map(row => ({
    timestamp: row[column.indexOf('timestamp')] || row[0],
    open: row[column.indexOf('open')] || row[1],
    high: row[column.indexOf('high')] || row[2],
    low: row[column.indexOf('low')] || row[3],
    close: row[column.indexOf('close')] || row[4],
    volume: row[column.indexOf('volume')] || row[5],
    amount: row[column.indexOf('amount')] || row[6] || 0
  }))
}

export function fetchQuote(symbol) {
  const fullSymbol = buildFullSymbol(symbol)
  return get('/v5/stock/quote.json', {
    symbol: fullSymbol,
    extend: 'detail'
  }).then(res => {
    if (res && res.data) {
      const item = res.data
      return {
        symbol: item.symbol,
        name: item.name || symbol,
        current: item.current || item.last_close || 0,
        percent: item.percent || 0,
        change: item.change || 0,
        high: item.high || 0,
        low: item.low || 0,
        open: item.open || 0,
        lastClose: item.last_close || 0,
        volume: item.volume || 0,
        amount: item.amount || 0,
        marketCapital: item.market_capital || 0,
        pe: item.pe_ttm || 0,
        pb: item.pb || 0,
        amplitude: item.amplitude || 0,
        turnoverRate: item.turnover_rate || 0,
        timestamp: item.timestamp || Date.now()
      }
    }
    return null
  })
}

export function fetchBatchQuote(symbols) {
  if (!symbols || symbols.length === 0) return Promise.resolve([])
  const symbolStr = symbols.map(s => buildFullSymbol(s)).join(',')
  return get('/v5/stock/batch/quote.json', {
    symbol: symbolStr,
    extend: 'detail'
  }).then(res => {
    if (res && res.data && res.data.items) {
      return res.data.items.map(item => ({
        symbol: item.quote.symbol,
        name: item.quote.name || '',
        current: item.quote.current || 0,
        percent: item.quote.percent || 0,
        change: item.quote.change || 0,
        high: item.quote.high || 0,
        low: item.quote.low || 0,
        open: item.quote.open || 0,
        lastClose: item.quote.last_close || 0,
        volume: item.quote.volume || 0,
        amount: item.quote.amount || 0,
        marketCapital: item.quote.market_capital || 0,
        timestamp: item.quote.timestamp || Date.now()
      }))
    }
    if (res && res.data) {
      const items = res.data
      return Object.values(items).map(item => ({
        symbol: item.symbol,
        name: item.name || '',
        current: item.current || 0,
        percent: item.percent || 0,
        change: item.change || 0,
        high: item.high || 0,
        low: item.low || 0,
        open: item.open || 0,
        lastClose: item.last_close || 0,
        volume: item.volume || 0,
        amount: item.amount || 0,
        marketCapital: item.market_capital || 0,
        timestamp: item.timestamp || Date.now()
      }))
    }
    return []
  })
}

export function fetchKline(symbol, count = 60, period = 'day') {
  const fullSymbol = buildFullSymbol(symbol)
  const now = Date.now()
  const begin = now - count * 24 * 60 * 60 * 1000
  return get('/v5/stock/chart/kline.json', {
    symbol: fullSymbol,
    begin,
    period,
    count,
    indicator: 'kline'
  }).then(res => formatKlineData(res))
}

export function fetchFundNav(symbol, count = 60) {
  const code = symbol.replace(/^(SH|SZ)/, '')
  return get('/dj/open/fund/rh.json', {
    symbol: code,
    count
  }, {
    baseURL: 'https://fund.xueqiu.com'
  }).then(res => {
    if (res && res.data && res.data.rh) {
      return res.data.rh.map(item => ({
        timestamp: new Date(item.date).getTime(),
        nav: item.unit_nav || 0,
        accumulatedNav: item.accum_nav || 0,
        dailyPercent: item.daily_profit || 0
      }))
    }
    return []
  })
}

export function fetchTimeline(symbol) {
  const code = symbol.replace(/^(SH|SZ)/, '')
  const exchangeMap = { 'SH': 1, 'SZ': 2 }
  const exchange = symbol.startsWith('SH') ? 1 : symbol.startsWith('SZ') ? 2 : 1
  return get('/v5/stock/timeline.json', {
    symbol_id: `${exchange}${code}`,
    count: 20
  }).then(res => {
    if (res && res.data && res.data.items) {
      return res.data.items.map(item => ({
        id: item.id || '',
        text: item.text || item.title || '',
        title: item.title || '',
        description: item.description || '',
        user: item.user ? {
          id: item.user.id,
          screenName: item.user.screen_name || item.user.name || '',
          avatar: item.user.avatar || ''
        } : { screenName: '' },
        likeCount: item.like_count || item.likeCount || 0,
        replyCount: item.reply_count || item.replyCount || 0,
        createdAt: item.created_at || item.createdAt || '',
        target: item.target || '',
        type: item.type || 'status'
      }))
    }
    return []
  })
}

export function searchStocks(keyword) {
  return get('/v5/search/searchStock.json', {
    q: keyword,
    size: 20
  }).then(res => {
    if (res && res.data && res.data.stocks) {
      return res.data.stocks.map(item => ({
        symbol: item.symbol || item.code || '',
        name: item.name || '',
        code: item.code || item.symbol || '',
        exchange: item.exchange || '',
        type: item.type || 'stock'
      }))
    }
    return []
  })
}
