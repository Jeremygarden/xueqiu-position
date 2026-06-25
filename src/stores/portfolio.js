/**
 * src/stores/portfolio.js — round 16 full implementation
 *
 * Pinia store that:
 *   - persists positions via @/utils/storage
 *   - hydrates them with live quotes (fetchBatchQuote)
 *   - computes per-position profit fields
 *   - lazily fetches kline + technical signals on demand
 *
 * State: positions, loading, lastRefresh, sortBy, filterType
 * Actions: loadPositions, refreshPrices, addPosition, removePosition, updatePosition, refreshSignals
 * Getters: filteredPositions, totalCost, totalValue, totalProfit, totalProfitRate,
 *          todayProfit, positionsByType, positionsByMarket
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getPositions,
  savePositions,
  addPosition as storageAdd,
  removePosition as storageRemove,
  updatePosition as storageUpdate
} from '@/utils/storage.js'
import { fetchBatchQuote, fetchKline, fetchQuote } from '@/api/xueqiu.js'
import {
  calculateMACD,
  calculateRSI,
  calculateBollingerBands,
  getSignalScore,
  getSignalLabel
} from '@/utils/indicators.js'

function _toNum(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function _computeProfit(pos) {
  const shares = _toNum(pos.shares)
  const cost = _toNum(pos.costPrice)
  const cur = _toNum(pos.currentPrice, cost)
  const marketValue = shares * cur
  const totalCost = shares * cost
  const profit = marketValue - totalCost
  const profitRate = totalCost === 0 ? 0 : (profit / totalCost) * 100
  return { marketValue, totalCost, profit, profitRate }
}

export const usePortfolioStore = defineStore('portfolio', () => {
  // ---------- state ----------
  const positions = ref([])           // Position[]
  const loading = ref(false)
  const lastRefresh = ref(null)       // timestamp ms
  const sortBy = ref('default')       // 'default' | 'profit' | 'percent' | 'profitRate'
  const filterType = ref('all')       // 'all' | 'stock' | 'fund' | 'A股' | '港股' | '美股'

  // ---------- internal ----------
  function _hydrate(stored) {
    return (stored || []).map((p) => {
      const computed = _computeProfit(p)
      return {
        ...p,
        marketValue: computed.marketValue,
        profit: computed.profit,
        profitRate: computed.profitRate
      }
    })
  }

  // ---------- actions ----------
  function loadPositions() {
    positions.value = _hydrate(getPositions())
    // Fire-and-forget refresh; don't block UI on first paint.
    refreshPrices().catch(() => { /* surfaced via loading flag only */ })
  }

  async function refreshPrices() {
    if (!positions.value.length) {
      lastRefresh.value = Date.now()
      return
    }
    loading.value = true
    try {
      const symbols = positions.value.map((p) => p.symbol).filter(Boolean)
      const quotes = await fetchBatchQuote(symbols)
      const quoteMap = new Map(quotes.map((q) => [q.symbol, q]))
      positions.value = positions.value.map((p) => {
        const q = quoteMap.get(p.symbol)
        if (!q) return p
        const merged = {
          ...p,
          name: p.name || q.name,
          currentPrice: q.current ?? p.currentPrice,
          percent: q.percent,
          lastClose: q.lastClose
        }
        const c = _computeProfit(merged)
        merged.marketValue = c.marketValue
        merged.profit = c.profit
        merged.profitRate = c.profitRate
        return merged
      })
      lastRefresh.value = Date.now()
    } finally {
      loading.value = false
    }
  }

  async function addPosition(pos) {
    if (!pos || !pos.symbol) return
    const next = storageAdd({
      symbol: pos.symbol,
      name: pos.name || pos.symbol,
      market: pos.market || '',
      type: pos.type || 'stock',
      shares: _toNum(pos.shares),
      costPrice: _toNum(pos.costPrice),
      buyDate: pos.buyDate || '',
      notes: pos.notes || ''
    })
    positions.value = _hydrate(next)
    // Immediately fetch quote for the new symbol
    try {
      const q = await fetchQuote(pos.symbol)
      if (q) {
        positions.value = positions.value.map((p) => {
          if (p.symbol !== pos.symbol) return p
          const merged = {
            ...p,
            name: p.name || q.name,
            currentPrice: q.current ?? p.currentPrice,
            percent: q.percent,
            lastClose: q.lastClose
          }
          const c = _computeProfit(merged)
          merged.marketValue = c.marketValue
          merged.profit = c.profit
          merged.profitRate = c.profitRate
          return merged
        })
      }
    } catch (_) { /* ignore */ }
  }

  async function removePosition(symbol) {
    const next = storageRemove(symbol)
    positions.value = _hydrate(next)
  }

  function updatePosition(symbol, patch) {
    const next = storageUpdate(symbol, patch || {})
    positions.value = _hydrate(next)
  }

  async function refreshSignals(symbol) {
    if (!symbol) return null
    const { closes } = await fetchKline(symbol, 'day', 120)
    if (!closes || closes.length === 0) return null
    const macd = calculateMACD(closes)
    const rsi = calculateRSI(closes)
    const bb = calculateBollingerBands(closes)
    const score = getSignalScore(closes)
    const label = getSignalLabel(score)
    const signals = { macd, rsi, bb, score, label }
    // attach to in-memory position (do not persist runtime signals)
    positions.value = positions.value.map((p) =>
      p.symbol === symbol ? { ...p, signals } : p
    )
    return signals
  }

  // ---------- getters ----------
  const filteredPositions = computed(() => {
    let list = positions.value.slice()
    if (filterType.value !== 'all') {
      list = list.filter((p) => {
        if (['stock', 'fund', 'etf'].includes(filterType.value)) return p.type === filterType.value
        return p.market === filterType.value
      })
    }
    switch (sortBy.value) {
      case 'profit':
        list.sort((a, b) => _toNum(b.profit) - _toNum(a.profit)); break
      case 'profitRate':
        list.sort((a, b) => _toNum(b.profitRate) - _toNum(a.profitRate)); break
      case 'percent':
        list.sort((a, b) => _toNum(b.percent) - _toNum(a.percent)); break
      default:
        break
    }
    return list
  })

  const totalCost = computed(() =>
    positions.value.reduce((sum, p) => sum + _toNum(p.shares) * _toNum(p.costPrice), 0)
  )

  const totalValue = computed(() =>
    positions.value.reduce(
      (sum, p) => sum + _toNum(p.shares) * _toNum(p.currentPrice, _toNum(p.costPrice)),
      0
    )
  )

  const totalProfit = computed(() => totalValue.value - totalCost.value)

  const totalProfitRate = computed(() => {
    const cost = totalCost.value
    return cost === 0 ? 0 : (totalProfit.value / cost) * 100
  })

  // Today's P/L ≈ Σ (marketValue * percent / (100 + percent))
  // (derives "what came from today's move" out of current market value)
  const todayProfit = computed(() =>
    positions.value.reduce((sum, p) => {
      const pct = _toNum(p.percent)
      const mv = _toNum(p.shares) * _toNum(p.currentPrice, _toNum(p.costPrice))
      if (mv === 0 || pct === 0) return sum
      return sum + (mv * pct) / (100 + pct)
    }, 0)
  )

  const positionsByType = computed(() => {
    const out = { stock: [], fund: [], etf: [] }
    for (const p of positions.value) {
      const key = ['stock', 'fund', 'etf'].includes(p.type) ? p.type : 'stock'
      out[key].push(p)
    }
    return out
  })

  const positionsByMarket = computed(() => {
    const out = {}
    for (const p of positions.value) {
      const key = p.market || '未知'
      if (!out[key]) out[key] = []
      out[key].push(p)
    }
    return out
  })

  return {
    // state
    positions, loading, lastRefresh, sortBy, filterType,
    // actions
    loadPositions, refreshPrices, addPosition, removePosition, updatePosition, refreshSignals,
    // getters
    filteredPositions, totalCost, totalValue, totalProfit, totalProfitRate,
    todayProfit, positionsByType, positionsByMarket
  }
})
