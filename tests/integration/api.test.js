/**
 * tests/integration/api.test.js
 * Integration tests for src/api/request.js + src/api/xueqiu.js
 * Round 5 of the test-loop.
 *
 * Strategy: intercept uni.request mock to simulate real network responses.
 * The tests verify that the API functions parse data correctly, chunk batches,
 * and return safe fallbacks on errors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { request, XueqiuError, ENDPOINTS } from '@/api/request.js'
import {
  fetchQuote,
  fetchBatchQuote,
  fetchKline,
  fetchFundNav,
  fetchTimeline,
  searchStocks
} from '@/api/xueqiu.js'
import {
  mockQuote,
  mockHKQuote,
  mockFundQuote,
  mockBatchQuoteMap,
  makeXueqiuQuoteApiResponse,
  makeUniSuccessResponse
} from '../mocks/xueqiu.mock.js'

// ── helpers ──────────────────────────────────────────────────────────────────

function mockUniRequest(responseData, statusCode = 200) {
  uni.request.mockImplementation(({ success }) => {
    success({ statusCode, data: responseData })
  })
}

function mockUniRequestFail(errMsg = 'request:fail timeout') {
  uni.request.mockImplementation(({ fail }) => {
    fail({ errMsg })
  })
}

beforeEach(() => {
  uni._reset()
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
describe('XueqiuError', () => {
  it('has name, code, statusCode properties', () => {
    const err = new XueqiuError('test', 'auth', { statusCode: 401 })
    expect(err.name).toBe('XueqiuError')
    expect(err.code).toBe('auth')
    expect(err.statusCode).toBe(401)
    expect(err instanceof Error).toBe(true)
  })

  it('defaults code to unknown', () => {
    const err = new XueqiuError('oops')
    expect(err.code).toBe('unknown')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('ENDPOINTS', () => {
  it('defines STOCK, FUND, XUEQIU urls', () => {
    expect(ENDPOINTS.STOCK).toContain('stock.xueqiu.com')
    expect(ENDPOINTS.FUND).toContain('danjuan.xueqiu.com')
    expect(ENDPOINTS.XUEQIU).toContain('xueqiu.com')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('request()', () => {
  it('resolves to response data on HTTP 200', async () => {
    mockUniRequest({ data: { value: 42 } })
    const result = await request({ url: '/test' })
    expect(result).toEqual({ value: 42 })
  })

  it('resolves to full body when no .data wrapper', async () => {
    mockUniRequest({ items: [1, 2, 3] })
    const result = await request({ url: '/test' })
    expect(result).toEqual({ items: [1, 2, 3] })
  })

  it('rejects with code=auth on 401', async () => {
    mockUniRequest({ error_code: 401 }, 401)
    await expect(request({ url: '/test' })).rejects.toMatchObject({ code: 'auth' })
  })

  it('rejects with code=auth on 403', async () => {
    mockUniRequest({}, 403)
    await expect(request({ url: '/test' })).rejects.toMatchObject({ code: 'auth' })
  })

  it('rejects with code=network on non-2xx status', async () => {
    mockUniRequest({ message: 'Server Error' }, 500)
    await expect(request({ url: '/test' })).rejects.toMatchObject({ code: 'network' })
  })

  it('rejects with code=network on uni fail', async () => {
    mockUniRequestFail()
    await expect(request({ url: '/test' })).rejects.toMatchObject({ code: 'network' })
  })

  it('rejects with code=api on Xueqiu error_code', async () => {
    mockUniRequest({ error_code: -1, error_description: 'bad symbol' })
    await expect(request({ url: '/test' })).rejects.toMatchObject({ code: 'api' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('fetchQuote', () => {
  it('returns a normalised Quote object', async () => {
    const raw = {
      quote: {
        symbol: 'SH600519', name: '贵州茅台',
        current: 1500, percent: 1.2, chg: 17.8,
        high: 1520, low: 1490, open: 1495, last_close: 1482.2,
        volume: 1234567, market_capital: 1890000000000
      }
    }
    mockUniRequest({ data: raw })
    const q = await fetchQuote('SH600519')
    expect(q).not.toBeNull()
    expect(q.symbol).toBe('SH600519')
    expect(q.name).toBe('贵州茅台')
    expect(q.current).toBe(1500)
    expect(q.percent).toBe(1.2)
    expect(typeof q.market).toBe('string')
    expect(typeof q.type).toBe('string')
  })

  it('returns null for empty symbol', async () => {
    const q = await fetchQuote('')
    expect(q).toBeNull()
  })

  it('returns null on network error (does not throw)', async () => {
    mockUniRequestFail()
    const q = await fetchQuote('SH600519')
    expect(q).toBeNull()
  })

  it('returns null on 401 auth error (does not throw)', async () => {
    mockUniRequest({ error_code: 401 }, 401)
    const q = await fetchQuote('SH600519')
    expect(q).toBeNull()
  })

  it('returns null when API response has no quote field', async () => {
    mockUniRequest({ data: { items: [] } })
    const q = await fetchQuote('SH600519')
    expect(q).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('fetchBatchQuote', () => {
  it('returns array of Quotes', async () => {
    const raw = {
      items: [
        { quote: { symbol: 'SH600519', name: '贵州茅台', current: 1500, percent: 1.2, chg: 17.8, high: 1520, low: 1490, open: 1495, last_close: 1482.2, volume: 1000000, market_capital: 1890000000000 } },
        { quote: { symbol: 'HK00700', name: '腾讯控股', current: 380, percent: -0.8, chg: -3, high: 386, low: 377, open: 383, last_close: 383, volume: 8000000, market_capital: 3600000000000 } }
      ]
    }
    mockUniRequest({ data: raw })
    const list = await fetchBatchQuote(['SH600519', 'HK00700'])
    expect(list).toHaveLength(2)
    expect(list[0].symbol).toBe('SH600519')
    expect(list[1].symbol).toBe('HK00700')
  })

  it('returns [] for empty input', async () => {
    expect(await fetchBatchQuote([])).toEqual([])
    expect(await fetchBatchQuote(null)).toEqual([])
  })

  it('auto-chunks >20 symbols (calls uni.request multiple times)', async () => {
    // 25 symbols → 2 chunks
    const symbols = Array.from({ length: 25 }, (_, i) => `SH60${String(i).padStart(4, '0')}`)
    mockUniRequest({ data: { items: [] } })  // empty result but multiple calls
    await fetchBatchQuote(symbols)
    expect(uni.request).toHaveBeenCalledTimes(2)
  })

  it('returns [] on network error', async () => {
    mockUniRequestFail()
    const list = await fetchBatchQuote(['SH600519'])
    expect(list).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('fetchKline', () => {
  it('returns { timestamps, closes, volumes }', async () => {
    const raw = {
      column: ['timestamp', 'close', 'volume'],
      item: [
        [1700000000000, 1480, 1000000],
        [1700086400000, 1490, 1100000],
        [1700172800000, 1500, 1200000]
      ]
    }
    mockUniRequest({ data: raw })
    const k = await fetchKline('SH600519')
    expect(k).toHaveProperty('timestamps')
    expect(k).toHaveProperty('closes')
    expect(k).toHaveProperty('volumes')
    expect(k.closes).toHaveLength(3)
    expect(k.closes[0]).toBe(1480)
    expect(k.timestamps[0]).toBe(1700000000000)
  })

  it('returns empty arrays for empty symbol', async () => {
    const k = await fetchKline('')
    expect(k.timestamps).toEqual([])
    expect(k.closes).toEqual([])
  })

  it('returns empty arrays on network error', async () => {
    mockUniRequestFail()
    const k = await fetchKline('SH600519')
    expect(k.closes).toEqual([])
  })

  it('accepts period and count params', async () => {
    mockUniRequest({ data: { column: ['timestamp', 'close', 'volume'], item: [] } })
    await fetchKline('SH600519', 'week', 60)
    const callArg = uni.request.mock.calls[0][0]
    expect(callArg.data.period).toBe('week')
    expect(callArg.data.count).toBe(-60)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('fetchFundNav', () => {
  it('returns nav data', async () => {
    const raw = {
      fund_detail: {
        unit_net_value: 1.2345,
        fund_nav_date: '2024-03-15',
        acc_net_value: 2.3456,
        day_growth_rate: 0.45
      }
    }
    mockUniRequest({ data: raw })
    const nav = await fetchFundNav('F000001')
    expect(nav).not.toBeNull()
    expect(nav.nav).toBe(1.2345)
    expect(nav.navDate).toBe('2024-03-15')
    expect(nav.growthRate).toBe(0.45)
  })

  it('returns null on empty symbol', async () => {
    expect(await fetchFundNav('')).toBeNull()
  })

  it('returns null on error', async () => {
    mockUniRequestFail()
    expect(await fetchFundNav('F000001')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('fetchTimeline', () => {
  it('returns array of posts', async () => {
    const raw = {
      statuses: [
        { id: '1001', title: '茅台分析', text: '当前估值合理', user: { screen_name: '投资者' }, like_count: 42, created_at: 1700000000000, target: '/status/1001' },
        { id: '1002', title: '', text: '关注白酒板块', user: { screen_name: '分析师' }, like_count: 15, created_at: 1700000000001, target: '/status/1002' }
      ]
    }
    mockUniRequest({ data: raw })
    const posts = await fetchTimeline('SH600519')
    expect(posts).toHaveLength(2)
    expect(posts[0]).toMatchObject({ id: '1001', author: '投资者', likeCount: 42 })
  })

  it('returns [] for empty symbol', async () => {
    expect(await fetchTimeline('')).toEqual([])
  })

  it('returns [] on network error', async () => {
    mockUniRequestFail()
    expect(await fetchTimeline('SH600519')).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('searchStocks', () => {
  it('returns array of { symbol, name, type, market }', async () => {
    const raw = [
      { code: 'SH600519', query: '贵州茅台' },
      { code: 'SH600900', query: '长江电力' }
    ]
    mockUniRequest({ data: raw })
    const list = await searchStocks('茅台')
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ symbol: 'SH600519', name: '贵州茅台' })
    expect(list[0]).toHaveProperty('type')
    expect(list[0]).toHaveProperty('market')
  })

  it('returns [] for empty keyword', async () => {
    expect(await searchStocks('')).toEqual([])
    expect(await searchStocks(null)).toEqual([])
  })

  it('returns [] on network error', async () => {
    mockUniRequestFail()
    expect(await searchStocks('茅台')).toEqual([])
  })
})
