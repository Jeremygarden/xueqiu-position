/**
 * tests/mocks/xueqiu.mock.js
 * Canonical mock data + factory helpers used by integration & E2E tests.
 */

// ── Quote ────────────────────────────────────────────────────────────────────
export const mockQuote = {
  symbol: 'SH600519',
  name: '贵州茅台',
  current: 1500.0,
  percent: 1.2,
  change: 17.8,
  high: 1520.0,
  low: 1490.0,
  open: 1495.0,
  lastClose: 1482.2,
  volume: 1234567,
  marketCap: 1890000000000,
  type: 'stock'
}

export const mockHKQuote = {
  symbol: 'HK00700',
  name: '腾讯控股',
  current: 380.0,
  percent: -0.8,
  change: -3.06,
  high: 386.0,
  low: 377.0,
  open: 383.0,
  lastClose: 383.06,
  volume: 8765432,
  marketCap: 36500000000000,
  type: 'stock'
}

export const mockFundQuote = {
  symbol: 'F000001',
  name: '华夏成长混合',
  current: 1.2345,
  percent: 0.45,
  change: 0.0056,
  high: 1.2345,
  low: 1.2345,
  open: 1.2289,
  lastClose: 1.2289,
  volume: 0,
  marketCap: 0,
  type: 'fund'
}

// ── Kline ────────────────────────────────────────────────────────────────────
export function makePrices(length = 40, startPrice = 100, trend = 'up') {
  const prices = []
  let p = startPrice
  for (let i = 0; i < length; i++) {
    const delta = trend === 'up' ? 1 + Math.random() * 0.5
      : trend === 'down' ? -(1 + Math.random() * 0.5)
      : (Math.random() - 0.5) * 0.3
    p = Math.max(0.01, p + delta)
    prices.push(Number(p.toFixed(2)))
  }
  return prices
}

export const mockKline = {
  timestamps: Array.from({ length: 40 }, (_, i) => 1700000000000 + i * 86400000),
  closes: makePrices(40, 1400, 'up'),
  volumes: Array.from({ length: 40 }, () => Math.floor(1000000 + Math.random() * 500000))
}

export const mockShortKline = {
  timestamps: [1700000000000, 1700086400000, 1700172800000],
  closes: [1480, 1490, 1495],
  volumes: [1000000, 1100000, 1200000]
}

// ── Posts ────────────────────────────────────────────────────────────────────
export const mockPosts = [
  {
    id: '1001',
    title: '贵州茅台Q3业绩超预期，机构纷纷上调目标价',
    text: '据公告，公司Q3营收同比增长18%，净利润同比增长22%。',
    author: '价值投资者',
    likeCount: 328,
    createdAt: Date.now() - 3600000,
    url: 'https://xueqiu.com/status/1001'
  },
  {
    id: '1002',
    title: '茅台股价分析：当前估值是否合理？',
    text: '当前PE约28倍，历史中位数25倍，略有溢价。',
    author: '量化分析师',
    likeCount: 156,
    createdAt: Date.now() - 86400000,
    url: 'https://xueqiu.com/status/1002'
  }
]

// ── Search results ───────────────────────────────────────────────────────────
export const mockSearchResults = [
  { symbol: 'SH600519', name: '贵州茅台', type: 'stock', market: 'A股' },
  { symbol: 'SH600900', name: '长江电力', type: 'stock', market: 'A股' },
  { symbol: 'HK00700', name: '腾讯控股', type: 'stock', market: '港股' }
]

// ── Positions (stored format, no runtime fields) ─────────────────────────────
export const mockStoredPositions = [
  {
    symbol: 'SH600519',
    name: '贵州茅台',
    market: 'A股',
    type: 'stock',
    shares: 10,
    costPrice: 1400,
    buyDate: '2024-01-15',
    notes: '长期持有'
  },
  {
    symbol: 'HK00700',
    name: '腾讯控股',
    market: '港股',
    type: 'stock',
    shares: 100,
    costPrice: 350,
    buyDate: '2024-02-20',
    notes: ''
  },
  {
    symbol: 'F000001',
    name: '华夏成长混合',
    market: '基金',
    type: 'fund',
    shares: 5000,
    costPrice: 1.1,
    buyDate: '2024-03-01',
    notes: '定投'
  }
]

// ── XueqiuError codes ────────────────────────────────────────────────────────
export const mockNetworkError = { errMsg: 'request:fail timeout' }
export const mock401Response = { statusCode: 401, data: { error_code: 401, error_description: 'Unauthorized' } }
export const mock400Response = { statusCode: 400, data: { error_code: 400, error_description: 'Bad Request' } }

// ── Batch quote map (symbol → quote) ─────────────────────────────────────────
export const mockBatchQuoteMap = {
  'SH600519': mockQuote,
  'HK00700': mockHKQuote,
  'F000001': mockFundQuote
}

// ── uni.request response builder ─────────────────────────────────────────────
export function makeUniSuccessResponse(data) {
  return { statusCode: 200, data }
}

export function makeXueqiuQuoteApiResponse(quotes) {
  // Mirrors the actual v5 batch-quote API shape
  return {
    data: {
      items: quotes.map(q => ({
        quote: {
          symbol: q.symbol,
          name: q.name,
          current: q.current,
          percent: q.percent,
          chg: q.change,
          high: q.high,
          low: q.low,
          open: q.open,
          last_close: q.lastClose,
          volume: q.volume,
          market_capital: q.marketCap,
          type: q.type
        }
      }))
    }
  }
}
