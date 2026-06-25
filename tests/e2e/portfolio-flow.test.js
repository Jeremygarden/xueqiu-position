/**
 * tests/e2e/portfolio-flow.test.js
 * End-to-end "flow" tests — simulate complete user journeys through the
 * portfolio store + storage without a real UI or real network.
 * Round 7 of the test-loop.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio.js'
import { getPositions } from '@/utils/storage.js'

vi.mock('@/api/xueqiu.js', () => ({
  fetchBatchQuote: vi.fn(async () => []),
  fetchQuote: vi.fn(async () => null),
  fetchKline: vi.fn(async () => ({ timestamps: [], closes: [], volumes: [] }))
}))

import { fetchBatchQuote, fetchQuote } from '@/api/xueqiu.js'

// ── helpers ──────────────────────────────────────────────────────────────────
function mockQuoteFor(symbol, current, percent = 0) {
  return { symbol, current, percent, lastClose: current / (1 + percent / 100) }
}

beforeEach(() => {
  setActivePinia(createPinia())
  uni._reset()
  vi.clearAllMocks()
  fetchBatchQuote.mockResolvedValue([])
  fetchQuote.mockResolvedValue(null)
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景1: 添加股票 → 查看总览 → 验证数据', () => {
  it('adds a stock and shows it in filteredPositions', async () => {
    const store = usePortfolioStore()
    await store.addPosition({
      symbol: 'SH600519', name: '贵州茅台', market: 'A股', type: 'stock',
      shares: 10, costPrice: 1400, buyDate: '2024-01-01', notes: ''
    })
    expect(store.positions).toHaveLength(1)
    expect(store.filteredPositions).toHaveLength(1)
    expect(store.filteredPositions[0].name).toBe('贵州茅台')
  })

  it('asset card totals update after adding position', async () => {
    const store = usePortfolioStore()
    expect(store.totalCost).toBe(0)
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    expect(store.totalCost).toBe(14000)
    await store.addPosition({ symbol: 'HK00700', shares: 100, costPrice: 350 })
    expect(store.totalCost).toBe(14000 + 35000)
  })

  it('currentPrice defaults to costPrice before quote refresh', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    // No live quote — totalValue ≈ totalCost
    expect(store.totalValue).toBeCloseTo(store.totalCost, 0)
    expect(store.totalProfit).toBeCloseTo(0, 0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景2: 添加基金 → 检查基金数据展示', () => {
  it('adds a fund and shows type=fund in store', async () => {
    const store = usePortfolioStore()
    await store.addPosition({
      symbol: 'F000001', name: '华夏成长', market: '基金', type: 'fund',
      shares: 5000, costPrice: 1.1, buyDate: '', notes: '定投'
    })
    expect(store.positions[0].type).toBe('fund')
    expect(store.positionsByType.fund).toHaveLength(1)
    expect(store.positionsByType.stock).toHaveLength(0)
  })

  it('fund cost calculation uses costPrice × shares', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'F000001', shares: 5000, costPrice: 1.1 })
    expect(store.totalCost).toBeCloseTo(5500, 2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景3: 删除持仓 → 验证总资产变化', () => {
  it('removing a position decreases totalCost', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    await store.addPosition({ symbol: 'HK00700', shares: 100, costPrice: 350 })
    const costBefore = store.totalCost  // 14000 + 35000 = 49000
    await store.removePosition('SH600519')
    expect(store.totalCost).toBeLessThan(costBefore)
    expect(store.totalCost).toBeCloseTo(35000, 0)
  })

  it('removed position is not in filteredPositions', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    await store.removePosition('SH600519')
    expect(store.filteredPositions.find(p => p.symbol === 'SH600519')).toBeUndefined()
  })

  it('persists removal to storage', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    await store.removePosition('SH600519')
    expect(getPositions()).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景4: 多持仓分类筛选', () => {
  beforeEach(async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', name: 'A', market: 'A股', type: 'stock', shares: 10, costPrice: 100 })
    await store.addPosition({ symbol: 'HK00700', name: 'B', market: '港股', type: 'stock', shares: 100, costPrice: 10 })
    await store.addPosition({ symbol: 'AAPL', name: 'C', market: '美股', type: 'stock', shares: 5, costPrice: 200 })
    await store.addPosition({ symbol: 'F000001', name: 'D', market: '基金', type: 'fund', shares: 1000, costPrice: 1 })
    await store.addPosition({ symbol: 'SH510300', name: 'E', market: '基金', type: 'etf', shares: 500, costPrice: 5 })
  })

  it('filterType=all returns all 5 positions', () => {
    const store = usePortfolioStore()
    store.filterType = 'all'
    expect(store.filteredPositions).toHaveLength(5)
  })

  it('filterType=stock returns only type=stock (3 positions)', () => {
    const store = usePortfolioStore()
    store.filterType = 'stock'
    expect(store.filteredPositions).toHaveLength(3)
    store.filteredPositions.forEach(p => expect(p.type).toBe('stock'))
  })

  it('filterType=fund returns only type=fund', () => {
    const store = usePortfolioStore()
    store.filterType = 'fund'
    store.filteredPositions.forEach(p => expect(p.type).toBe('fund'))
  })

  it('filterType=etf returns only type=etf', () => {
    const store = usePortfolioStore()
    store.filterType = 'etf'
    store.filteredPositions.forEach(p => expect(p.type).toBe('etf'))
  })

  it('filterType=A股 returns only A股 market', () => {
    const store = usePortfolioStore()
    store.filterType = 'A股'
    store.filteredPositions.forEach(p => expect(p.market).toBe('A股'))
  })

  it('filterType=港股 returns only 港股 market', () => {
    const store = usePortfolioStore()
    store.filterType = '港股'
    store.filteredPositions.forEach(p => expect(p.market).toBe('港股'))
  })

  it('filterType=美股 returns only 美股 market', () => {
    const store = usePortfolioStore()
    store.filterType = '美股'
    store.filteredPositions.forEach(p => expect(p.market).toBe('美股'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景5: 手动刷新价格 → 验证 loading 状态', () => {
  it('loading transitions correctly during refreshPrices', async () => {
    let capturedLoading = false
    fetchBatchQuote.mockImplementation(async () => {
      capturedLoading = usePortfolioStore().loading
      return []
    })
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    vi.clearAllMocks()
    fetchBatchQuote.mockImplementation(async () => {
      capturedLoading = usePortfolioStore().loading
      return []
    })
    const refreshPromise = store.refreshPrices()
    await refreshPromise
    expect(capturedLoading).toBe(true)
    expect(store.loading).toBe(false)
  })

  it('price updates propagate to profit calculations', async () => {
    fetchBatchQuote.mockResolvedValue([mockQuoteFor('SH600519', 1600, 2.5)])
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    vi.clearAllMocks()
    fetchBatchQuote.mockResolvedValue([mockQuoteFor('SH600519', 1600, 2.5)])
    await store.refreshPrices()
    const pos = store.positions[0]
    expect(pos.currentPrice).toBe(1600)
    expect(pos.percent).toBe(2.5)
    expect(store.totalValue).toBeCloseTo(16000, 0)
    expect(store.totalProfit).toBeCloseTo(2000, 0)
  })

  it('todayProfit is non-zero when percent is set', async () => {
    fetchBatchQuote.mockResolvedValue([mockQuoteFor('SH600519', 1600, 2.5)])
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    vi.clearAllMocks()
    fetchBatchQuote.mockResolvedValue([mockQuoteFor('SH600519', 1600, 2.5)])
    await store.refreshPrices()
    expect(store.todayProfit).not.toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('sort order', () => {
  beforeEach(async () => {
    fetchBatchQuote.mockResolvedValue([
      mockQuoteFor('SH600519', 1600, 3.0),   // high gain
      mockQuoteFor('HK00700', 320, -2.0),    // loss
      mockQuoteFor('AAPL', 190, 1.0)         // moderate gain
    ])
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    await store.addPosition({ symbol: 'HK00700', shares: 100, costPrice: 350 })
    await store.addPosition({ symbol: 'AAPL', shares: 5, costPrice: 180 })
    await store.refreshPrices()
  })

  it('sortBy=profit → descending profit', () => {
    const store = usePortfolioStore()
    store.sortBy = 'profit'
    const list = store.filteredPositions
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].profit).toBeGreaterThanOrEqual(list[i].profit)
    }
  })

  it('sortBy=percent → descending percent', () => {
    const store = usePortfolioStore()
    store.sortBy = 'percent'
    const list = store.filteredPositions
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].percent).toBeGreaterThanOrEqual(list[i].percent)
    }
  })
})

// ── Round 9 additions: error-path E2E + edge cases ───────────────────────────

describe('场景6: API 失败时持仓列表仍可渲染', () => {
  it('positions remain after refreshPrices fails', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    vi.clearAllMocks()
    fetchBatchQuote.mockRejectedValue(new Error('network error'))
    await store.refreshPrices()
    // positions still present, just without live price
    expect(store.positions).toHaveLength(1)
    expect(store.positions[0].symbol).toBe('SH600519')
  })

  it('totalCost is unaffected by API failure', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    const costBefore = store.totalCost
    vi.clearAllMocks()
    fetchBatchQuote.mockRejectedValue(new Error('fail'))
    await store.refreshPrices()
    expect(store.totalCost).toBe(costBefore)
  })

  it('loading is false after API failure', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    vi.clearAllMocks()
    fetchBatchQuote.mockRejectedValue(new Error('timeout'))
    await store.refreshPrices()
    expect(store.loading).toBe(false)
  })
})

describe('场景7: 零成本 / 零份额边界', () => {
  it('position with 0 shares has 0 marketValue', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 0, costPrice: 1400 })
    expect(store.positions[0].marketValue).toBe(0)
  })

  it('totalProfitRate is 0 when costPrice is 0', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 0 })
    expect(store.totalProfitRate).toBe(0)
  })

  it('position with 0 costPrice has 0 profit calculation base', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 0 })
    expect(store.totalCost).toBe(0)
  })
})

describe('场景8: 多次重复刷新不产生重复持仓', () => {
  it('calling addPosition twice for same symbol leaves 1 position', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    await store.addPosition({ symbol: 'SH600519', shares: 20, costPrice: 1350 })
    expect(store.positions.filter(p => p.symbol === 'SH600519')).toHaveLength(1)
    expect(store.positions[0].shares).toBe(20)
  })

  it('refreshPrices called twice updates lastRefresh each time', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    await store.refreshPrices()
    const t1 = store.lastRefresh
    await new Promise(r => setTimeout(r, 2))
    await store.refreshPrices()
    const t2 = store.lastRefresh
    expect(t2).toBeGreaterThan(t1)
  })
})
