/**
 * tests/integration/store.test.js
 * Integration tests for src/stores/portfolio.js
 * Round 6 of the test-loop.
 *
 * Strategy: run the real Pinia store (createPinia + setActivePinia) with
 * mocked API calls. Tests verify actions, computed getters, and persistence.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio.js'

// We mock the API layer so no real HTTP calls happen
vi.mock('@/api/xueqiu.js', () => ({
  fetchBatchQuote: vi.fn(async () => []),
  fetchQuote: vi.fn(async () => null),
  fetchKline: vi.fn(async () => ({ timestamps: [], closes: [], volumes: [] }))
}))

import { fetchBatchQuote, fetchQuote, fetchKline } from '@/api/xueqiu.js'

// ── Sample data ───────────────────────────────────────────────────────────────
const MOUTAI = { symbol: 'SH600519', name: '贵州茅台', market: 'A股', type: 'stock', shares: 10, costPrice: 1400 }
const TENCENT = { symbol: 'HK00700', name: '腾讯控股', market: '港股', type: 'stock', shares: 100, costPrice: 350 }
const FUND_POS = { symbol: 'F000001', name: '华夏成长', market: '基金', type: 'fund', shares: 5000, costPrice: 1.1 }

const MOUTAI_QUOTE = { symbol: 'SH600519', current: 1500, percent: 1.2, lastClose: 1482.2 }
const TENCENT_QUOTE = { symbol: 'HK00700', current: 380, percent: -0.8, lastClose: 383 }

// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  setActivePinia(createPinia())
  uni._reset()
  vi.clearAllMocks()

  // Default: APIs return nothing
  fetchBatchQuote.mockResolvedValue([])
  fetchQuote.mockResolvedValue(null)
  fetchKline.mockResolvedValue({ timestamps: [], closes: [], volumes: [] })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('initial state', () => {
  it('positions starts empty', () => {
    const store = usePortfolioStore()
    expect(store.positions).toEqual([])
  })

  it('loading starts false', () => {
    expect(usePortfolioStore().loading).toBe(false)
  })

  it('filterType defaults to all', () => {
    expect(usePortfolioStore().filterType).toBe('all')
  })

  it('sortBy defaults to default', () => {
    expect(usePortfolioStore().sortBy).toBe('default')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('addPosition', () => {
  it('adds a position to the list', async () => {
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    expect(store.positions).toHaveLength(1)
    expect(store.positions[0].symbol).toBe('SH600519')
  })

  it('enriches with live quote when fetchQuote returns data', async () => {
    fetchQuote.mockResolvedValue(MOUTAI_QUOTE)
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    expect(store.positions[0].currentPrice).toBe(1500)
    expect(store.positions[0].percent).toBe(1.2)
  })

  it('still adds position even when fetchQuote fails', async () => {
    fetchQuote.mockRejectedValue(new Error('network'))
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    expect(store.positions).toHaveLength(1)
  })

  it('ignores null input', async () => {
    const store = usePortfolioStore()
    await store.addPosition(null)
    expect(store.positions).toHaveLength(0)
  })

  it('persists to storage', async () => {
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    // Check uni.setStorageSync was called (storage was written)
    expect(uni.setStorageSync).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('removePosition', () => {
  beforeEach(async () => {
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    await store.addPosition(TENCENT)
  })

  it('removes the correct position', async () => {
    const store = usePortfolioStore()
    await store.removePosition('SH600519')
    expect(store.positions).toHaveLength(1)
    expect(store.positions[0].symbol).toBe('HK00700')
  })

  it('is a no-op for non-existent symbol', async () => {
    const store = usePortfolioStore()
    await store.removePosition('AAPL')
    expect(store.positions).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('refreshPrices', () => {
  it('updates positions with live quotes', async () => {
    fetchBatchQuote.mockResolvedValue([MOUTAI_QUOTE])
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    vi.clearAllMocks()
    fetchBatchQuote.mockResolvedValue([MOUTAI_QUOTE])
    await store.refreshPrices()
    expect(store.positions[0].currentPrice).toBe(1500)
    expect(store.positions[0].percent).toBe(1.2)
  })

  it('sets loading = true during fetch, false when done', async () => {
    let loadingDuringFetch = false
    fetchBatchQuote.mockImplementation(async () => {
      loadingDuringFetch = usePortfolioStore().loading
      return []
    })
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    vi.clearAllMocks()
    fetchBatchQuote.mockImplementation(async () => {
      loadingDuringFetch = usePortfolioStore().loading
      return []
    })
    await store.refreshPrices()
    expect(loadingDuringFetch).toBe(true)
    expect(store.loading).toBe(false)
  })

  it('sets lastRefresh timestamp', async () => {
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    await store.refreshPrices()
    expect(store.lastRefresh).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('filteredPositions', () => {
  beforeEach(async () => {
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    await store.addPosition(TENCENT)
    await store.addPosition(FUND_POS)
  })

  it('returns all when filterType = all', () => {
    const store = usePortfolioStore()
    store.filterType = 'all'
    expect(store.filteredPositions).toHaveLength(3)
  })

  it('filters by type = stock', () => {
    const store = usePortfolioStore()
    store.filterType = 'stock'
    expect(store.filteredPositions.every(p => p.type === 'stock')).toBe(true)
    expect(store.filteredPositions).toHaveLength(2)
  })

  it('filters by type = fund', () => {
    const store = usePortfolioStore()
    store.filterType = 'fund'
    expect(store.filteredPositions.every(p => p.type === 'fund')).toBe(true)
    expect(store.filteredPositions).toHaveLength(1)
  })

  it('filters by market = A股', () => {
    const store = usePortfolioStore()
    store.filterType = 'A股'
    expect(store.filteredPositions.every(p => p.market === 'A股')).toBe(true)
    expect(store.filteredPositions).toHaveLength(1)
  })

  it('filters by market = 港股', () => {
    const store = usePortfolioStore()
    store.filterType = '港股'
    expect(store.filteredPositions.every(p => p.market === '港股')).toBe(true)
  })

  it('sorts by profit descending', async () => {
    fetchBatchQuote.mockResolvedValue([
      { ...MOUTAI_QUOTE, current: 1800 },  // profit: 4000
      { symbol: 'HK00700', current: 320, percent: -1, lastClose: 323.2 }  // profit: -3000
    ])
    const store = usePortfolioStore()
    await store.refreshPrices()
    store.sortBy = 'profit'
    const list = store.filteredPositions
    expect(list[0].profit).toBeGreaterThanOrEqual(list[1].profit)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('computed totals', () => {
  beforeEach(async () => {
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)   // cost: 10 * 1400 = 14000
    await store.addPosition(TENCENT) // cost: 100 * 350 = 35000
  })

  it('totalCost = Σ(shares × costPrice)', () => {
    const store = usePortfolioStore()
    expect(store.totalCost).toBe(10 * 1400 + 100 * 350)  // 49000
  })

  it('totalValue uses currentPrice when set, else costPrice', () => {
    const store = usePortfolioStore()
    // No quotes fetched; currentPrice is undefined → falls back to costPrice
    expect(store.totalValue).toBeCloseTo(store.totalCost, 0)
  })

  it('totalValue updates when prices are hydrated', async () => {
    fetchBatchQuote.mockResolvedValue([
      { ...MOUTAI_QUOTE, current: 1500 },
      { ...TENCENT_QUOTE, current: 380 }
    ])
    const store = usePortfolioStore()
    await store.refreshPrices()
    const expected = 10 * 1500 + 100 * 380  // 15000 + 38000 = 53000
    expect(store.totalValue).toBeCloseTo(expected, 0)
  })

  it('totalProfit = totalValue - totalCost', async () => {
    fetchBatchQuote.mockResolvedValue([{ ...MOUTAI_QUOTE, current: 1500 }])
    const store = usePortfolioStore()
    await store.refreshPrices()
    expect(store.totalProfit).toBeCloseTo(store.totalValue - store.totalCost, 1)
  })

  it('totalProfitRate = 0 when no cost', () => {
    const store = usePortfolioStore()
    store.positions = []
    expect(store.totalProfitRate).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('positionsByType', () => {
  it('groups positions correctly', async () => {
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    await store.addPosition(TENCENT)
    await store.addPosition(FUND_POS)
    const { stock, fund } = store.positionsByType
    expect(stock).toHaveLength(2)
    expect(fund).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('positionsByMarket', () => {
  it('groups positions by market', async () => {
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    await store.addPosition(TENCENT)
    const byMkt = store.positionsByMarket
    expect(byMkt['A股']).toHaveLength(1)
    expect(byMkt['港股']).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('refreshSignals', () => {
  it('calculates and attaches signals to the position', async () => {
    const closes = Array.from({ length: 40 }, (_, i) => 10 + i)
    fetchKline.mockResolvedValue({ timestamps: [], closes, volumes: [] })
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    const signals = await store.refreshSignals('SH600519')
    expect(signals).not.toBeNull()
    expect(signals).toHaveProperty('macd')
    expect(signals).toHaveProperty('rsi')
    expect(signals).toHaveProperty('bb')
    expect(signals).toHaveProperty('score')
    expect(signals).toHaveProperty('label')
    // Also attached to the in-memory position
    const pos = store.positions.find(p => p.symbol === 'SH600519')
    expect(pos.signals).toBeDefined()
  })

  it('returns null when kline is empty', async () => {
    const store = usePortfolioStore()
    await store.addPosition(MOUTAI)
    const signals = await store.refreshSignals('SH600519')
    expect(signals).toBeNull()
  })

  it('returns null for empty symbol', async () => {
    const store = usePortfolioStore()
    const signals = await store.refreshSignals('')
    expect(signals).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('loadPositions', () => {
  it('loads persisted positions and fires refreshPrices', async () => {
    // Pre-populate storage
    const stored = [{ symbol: 'SH600519', name: '贵州茅台', shares: 10, costPrice: 1400, market: 'A股', type: 'stock', buyDate: '', notes: '' }]
    uni._store['xq_positions'] = JSON.stringify(stored)
    const store = usePortfolioStore()
    store.loadPositions()
    // loadPositions is sync for the initial load but triggers async refreshPrices
    expect(store.positions).toHaveLength(1)
    expect(store.positions[0].symbol).toBe('SH600519')
  })
})

// ── Round 8 additions: edge cases for store persistence + updatePosition ─────

describe('updatePosition via store', () => {
  it('updates notes on existing position', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    store.updatePosition('SH600519', { notes: '关注中' })
    const pos = store.positions.find(p => p.symbol === 'SH600519')
    expect(pos.notes).toBe('关注中')
  })

  it('does not add phantom position for unknown symbol', () => {
    const store = usePortfolioStore()
    store.updatePosition('GHOST', { shares: 999 })
    expect(store.positions).toHaveLength(0)
  })
})

describe('sortBy = profitRate', () => {
  it('sorts by profitRate descending', async () => {
    fetchBatchQuote.mockResolvedValue([
      { symbol: 'SH600519', current: 1600, percent: 2 },    // profitRate high
      { symbol: 'HK00700', current: 300, percent: -5 }      // profitRate low
    ])
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    await store.addPosition({ symbol: 'HK00700', shares: 100, costPrice: 350 })
    await store.refreshPrices()
    store.sortBy = 'profitRate'
    const list = store.filteredPositions
    expect(list[0].profitRate).toBeGreaterThanOrEqual(list[list.length - 1].profitRate)
  })
})

describe('todayProfit calculation', () => {
  it('is positive when all positions have positive percent', async () => {
    fetchBatchQuote.mockResolvedValue([
      { symbol: 'SH600519', current: 1500, percent: 2, lastClose: 1470 }
    ])
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    await store.refreshPrices()
    expect(store.todayProfit).toBeGreaterThan(0)
  })

  it('is negative when positions have negative percent', async () => {
    fetchBatchQuote.mockResolvedValue([
      { symbol: 'SH600519', current: 1400, percent: -3, lastClose: 1443 }
    ])
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1450 })
    await store.refreshPrices()
    expect(store.todayProfit).toBeLessThan(0)
  })
})

// ── Round 11: updatePosition via store action + sortBy = profitRate ────────────

describe('store.updatePosition', () => {
  it('patches costPrice without touching other fields', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400, notes: 'hold' })
    store.updatePosition('SH600519', { costPrice: 1350 })
    const pos = store.positions.find(p => p.symbol === 'SH600519')
    expect(pos.costPrice).toBe(1350)
    expect(pos.notes).toBe('hold')    // unchanged
    expect(pos.shares).toBe(10)        // unchanged
  })

  it('recalculates profit after updatePosition', async () => {
    fetchBatchQuote.mockResolvedValue([
      { symbol: 'SH600519', current: 1500, percent: 0, lastClose: 1500 }
    ])
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    await store.refreshPrices()
    const profitBefore = store.positions[0].profit
    store.updatePosition('SH600519', { costPrice: 1600 })
    // At price 1500 with new costPrice 1600 → profit should be negative
    expect(store.positions[0].profit).not.toBe(profitBefore)
  })
})
