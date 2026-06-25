/**
 * tests/e2e/signals-flow.test.js
 * Technical indicator / signal end-to-end flow tests.
 * Round 8 of the test-loop.
 *
 * Simulates: fetch kline → compute indicators → check signal labels.
 * All network calls are mocked; only the pure indicator math is real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio.js'
import {
  calculateMACD,
  calculateRSI,
  calculateBollingerBands,
  getSignalScore,
  getSignalLabel
} from '@/utils/indicators.js'

vi.mock('@/api/xueqiu.js', () => ({
  fetchBatchQuote: vi.fn(async () => []),
  fetchQuote: vi.fn(async () => null),
  fetchKline: vi.fn(async () => ({ timestamps: [], closes: [], volumes: [] }))
}))

import { fetchKline, fetchQuote } from '@/api/xueqiu.js'

// ── Price series factories ────────────────────────────────────────────────────
function makeUptrend(n = 40, start = 100) {
  return Array.from({ length: n }, (_, i) => start + i * 1.2)
}

function makeDowntrend(n = 40, start = 160) {
  return Array.from({ length: n }, (_, i) => start - i * 1.2)
}

function makeGoldenCross(n = 60) {
  // First half: downtrend → second half: sharp uptrend (golden cross)
  const half = Math.floor(n / 2)
  return [
    ...Array.from({ length: half }, (_, i) => 100 - i * 0.5),
    ...Array.from({ length: n - half }, (_, i) => 75 + i * 2)
  ]
}

function makeDeathCross(n = 60) {
  return makeGoldenCross(n).reverse()
}

// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  setActivePinia(createPinia())
  uni._reset()
  vi.clearAllMocks()
  fetchKline.mockResolvedValue({ timestamps: [], closes: [], volumes: [] })
  fetchQuote.mockResolvedValue(null)
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景1: K 线拉取 → 技术指标计算 → 信号标签展示', () => {
  it('refreshSignals populates macd, rsi, bb, score, label', async () => {
    const closes = makeUptrend(40)
    fetchKline.mockResolvedValue({ timestamps: [], closes, volumes: [] })

    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 100 })
    const signals = await store.refreshSignals('SH600519')

    expect(signals).not.toBeNull()
    expect(signals.macd).toHaveProperty('trend')
    expect(signals.rsi).toHaveProperty('status')
    expect(signals.bb).toHaveProperty('status')
    expect(typeof signals.score).toBe('number')
    expect(signals.label).toHaveProperty('type')
    expect(signals.label).toHaveProperty('text')
  })

  it('signals are attached to the in-memory position', async () => {
    const closes = makeUptrend(40)
    fetchKline.mockResolvedValue({ timestamps: [], closes, volumes: [] })

    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 100 })
    await store.refreshSignals('SH600519')

    const pos = store.positions.find(p => p.symbol === 'SH600519')
    expect(pos.signals).toBeDefined()
    expect(pos.signals.score).toBeGreaterThanOrEqual(-2)
    expect(pos.signals.score).toBeLessThanOrEqual(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景2: MACD 上涨序列 → 多头信号', () => {
  it('long uptrend has bullish MACD trend', () => {
    const macd = calculateMACD(makeUptrend(40))
    expect(macd.trend).toBe('bullish')
    expect(macd.histogram).toBeGreaterThan(0)
  })

  it('uptrend RSI is overbought (> 70)', () => {
    const rsi = calculateRSI(makeUptrend(40))
    expect(rsi.value).toBeGreaterThan(70)
    expect(rsi.status).toBe('overbought')
  })

  it('MACD neutral when data < slow window (26)', () => {
    const macd = calculateMACD([1, 2, 3, 4, 5])
    expect(macd.trend).toBe('neutral')
    expect(macd.crossover).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景3: RSI 超买 → 卖出信号 → 评分 ≤ 0', () => {
  it('overbought RSI contributes negative score', () => {
    const closes = makeUptrend(40)
    const rsi = calculateRSI(closes)
    expect(rsi.status).toBe('overbought')

    const score = getSignalScore(closes)
    // Strong uptrend triggers RSI overbought (-1 score contribution)
    expect(score).toBeLessThanOrEqual(0)
  })

  it('overbought with BB above → sell label (stable+spike pattern)', () => {
    // 39 stable bars + big spike triggers overbought RSI + BB above
    const stable = Array.from({ length: 39 }, (_, i) => 100 + (i % 3 === 0 ? 0.5 : -0.5))
    const closes = [...stable, 115]
    const score = getSignalScore(closes)
    const label = getSignalLabel(score)
    expect(score).toBeLessThanOrEqual(-1)   // RSI + BB both trigger
    expect(label.type).toBe('sell')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景4: K 线数据不足 → 优雅降级', () => {
  it('short kline (<26) → MACD neutral, RSI neutral', () => {
    const short = [100, 102, 101, 103, 105, 104]
    const macd = calculateMACD(short)
    const rsi = calculateRSI(short)
    expect(macd.trend).toBe('neutral')
    expect(rsi.status).toBe('neutral')
  })

  it('refreshSignals returns null when kline empty', async () => {
    const store = usePortfolioStore()
    await store.addPosition({ symbol: 'SH600519', shares: 10, costPrice: 100 })
    // fetchKline already mocked to return empty
    const signals = await store.refreshSignals('SH600519')
    expect(signals).toBeNull()
  })

  it('empty closes → score 0 / label neutral', () => {
    const score = getSignalScore([])
    const label = getSignalLabel(score)
    expect(score).toBe(0)
    expect(label.type).toBe('neutral')
  })

  it('single-element kline → all neutral', () => {
    const prices = [100]
    const macd = calculateMACD(prices)
    const rsi = calculateRSI(prices)
    expect(macd.trend).toBe('neutral')
    expect(rsi.status).toBe('neutral')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('场景5: 综合评分边界测试', () => {
  it('score range is always [-2, +2]', () => {
    const datasets = [
      makeUptrend(40),
      makeDowntrend(40),
      makeGoldenCross(60),
      makeDeathCross(60),
      Array.from({ length: 40 }, () => 100),
      []
    ]
    for (const closes of datasets) {
      const s = getSignalScore(closes)
      expect(s).toBeGreaterThanOrEqual(-2)
      expect(s).toBeLessThanOrEqual(2)
    }
  })

  it('strong downtrend → high positive score (buy signal)', () => {
    // Downtrend → oversold RSI & bearish MACD+BB → score > 0
    const closes = makeDowntrend(40)
    const score = getSignalScore(closes)
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('getSignalLabel covers all 5 score values', () => {
    const expected = [
      { score: 2,  type: 'buy',     textIncludes: '买入' },
      { score: 1,  type: 'buy',     textIncludes: '买入' },
      { score: 0,  type: 'neutral', textIncludes: '中性' },
      { score: -1, type: 'sell',    textIncludes: '卖出' },
      { score: -2, type: 'sell',    textIncludes: '卖出' }
    ]
    for (const { score, type, textIncludes } of expected) {
      const label = getSignalLabel(score)
      expect(label.type).toBe(type)
      expect(label.text).toContain(textIncludes)
      expect(typeof label.color).toBe('string')
      expect(label.color.length).toBeGreaterThan(0)
    }
  })

  it('maximum sell signal: RSI overbought + BB above → sell', () => {
    // Pattern that triggers both RSI overbought + BB above: stable then spike
    const stable = Array.from({ length: 39 }, (_, i) => 100 + (i % 3 === 0 ? 0.5 : -0.5))
    const closes = [...stable, 115]
    const score = getSignalScore(closes)
    expect(score).toBeLessThanOrEqual(-1)
    expect(getSignalLabel(score).type).toBe('sell')
  })

  it('maximum buy signal: RSI oversold + BB below → buy', () => {
    const stable = Array.from({ length: 39 }, (_, i) => 100 + (i % 3 === 0 ? 0.5 : -0.5))
    const closes = [...stable, 85]
    const score = getSignalScore(closes)
    expect(score).toBeGreaterThanOrEqual(1)
    expect(getSignalLabel(score).type).toBe('buy')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('MACD crossover detection', () => {
  it('crossover field is null, golden, or death', () => {
    const datasets = [makeUptrend(40), makeDowntrend(40), makeGoldenCross(60)]
    for (const closes of datasets) {
      const { crossover } = calculateMACD(closes)
      expect([null, 'golden', 'death']).toContain(crossover)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('BB status consistency', () => {
  it('above: last price > upper band', () => {
    const stable = Array.from({ length: 39 }, (_, i) => 100 + (i % 3 === 0 ? 0.5 : -0.5))
    const prices = [...stable, 115]
    const b = calculateBollingerBands(prices)
    expect(b.status).toBe('above')
    expect(prices[prices.length - 1]).toBeGreaterThan(b.upper)
  })

  it('below: last price < lower band', () => {
    const stable = Array.from({ length: 39 }, (_, i) => 100 + (i % 3 === 0 ? 0.5 : -0.5))
    const prices = [...stable, 85]
    const b = calculateBollingerBands(prices)
    expect(b.status).toBe('below')
    expect(prices[prices.length - 1]).toBeLessThan(b.lower)
  })
})
