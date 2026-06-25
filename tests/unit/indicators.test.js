/**
 * tests/unit/indicators.test.js
 * Unit tests for src/utils/indicators.js
 * Rounds 2 of the test-loop.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateBollingerBands,
  getSignalScore,
  getSignalLabel
} from '@/utils/indicators.js'

// ── Shared data ───────────────────────────────────────────────────────────────
const TREND_UP_26 = [10,11,12,11,10,9,10,11,13,14,15,14,13,12,11,10,11,12,13,14,15,16,17,18,19,20]
const TREND_UP_40 = Array.from({ length: 40 }, (_, i) => 10 + i * 0.8)
const TREND_DOWN_40 = Array.from({ length: 40 }, (_, i) => 60 - i * 0.8)
const FLAT_40 = Array.from({ length: 40 }, () => 100)

// Bollinger-band breakout fixtures: 39 near-stable bars then a sharp spike/dip
// Ensures last price crosses the ±2σ band.
const BB_STABLE_BASE = Array.from({ length: 39 }, (_, i) => 100 + (i % 3 === 0 ? 0.5 : -0.5))
const BB_BREAKOUT_ABOVE = [...BB_STABLE_BASE, 115]   // spike → status='above'
const BB_BREAKOUT_BELOW = [...BB_STABLE_BASE, 85]    // dip   → status='below'

// ─────────────────────────────────────────────────────────────────────────────
describe('calculateEMA', () => {
  it('returns array of same length as input', () => {
    expect(calculateEMA(TREND_UP_26, 12)).toHaveLength(TREND_UP_26.length)
    expect(calculateEMA(TREND_UP_40, 12)).toHaveLength(40)
  })

  it('returns empty array for empty input', () => {
    expect(calculateEMA([], 12)).toEqual([])
  })

  it('returns single element for single input', () => {
    const result = calculateEMA([42], 12)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(42)
  })

  it('first value equals first price', () => {
    const prices = [100, 110, 120, 115, 105]
    const ema = calculateEMA(prices, 3)
    expect(ema[0]).toBe(100)
  })

  it('EMA rises when prices rise', () => {
    const ema = calculateEMA(TREND_UP_40, 12)
    expect(ema[ema.length - 1]).toBeGreaterThan(ema[0])
  })

  it('EMA falls when prices fall', () => {
    const ema = calculateEMA(TREND_DOWN_40, 12)
    expect(ema[ema.length - 1]).toBeLessThan(ema[0])
  })

  it('EMA stays flat on flat series', () => {
    const ema = calculateEMA(FLAT_40, 12)
    expect(ema[ema.length - 1]).toBeCloseTo(100, 1)
  })

  it('all values are finite numbers', () => {
    calculateEMA(TREND_UP_40, 12).forEach(v => {
      expect(Number.isFinite(v)).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('calculateMACD', () => {
  it('returns required shape', () => {
    const m = calculateMACD(TREND_UP_40)
    expect(m).toHaveProperty('macd')
    expect(m).toHaveProperty('signal')
    expect(m).toHaveProperty('histogram')
    expect(m).toHaveProperty('trend')
    expect(m).toHaveProperty('crossover')
  })

  it('trend is one of bullish / bearish / neutral', () => {
    const m = calculateMACD(TREND_UP_40)
    expect(['bullish', 'bearish', 'neutral']).toContain(m.trend)
  })

  it('crossover is golden, death, or null', () => {
    const m = calculateMACD(TREND_UP_40)
    expect([null, 'golden', 'death']).toContain(m.crossover)
  })

  it('all numeric fields are finite', () => {
    const m = calculateMACD(TREND_UP_40)
    expect(Number.isFinite(m.macd)).toBe(true)
    expect(Number.isFinite(m.signal)).toBe(true)
    expect(Number.isFinite(m.histogram)).toBe(true)
  })

  it('neutral when prices < slow EMA window', () => {
    const m = calculateMACD([1, 2, 3])
    expect(m.trend).toBe('neutral')
    expect(m.crossover).toBe(null)
    expect(m.macd).toBe(0)
  })

  it('returns computed macd but neutral trend in slow<=N<slow+signal range', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 10 + i)
    const m = calculateMACD(prices)
    expect(typeof m.macd).toBe('number')
    expect(m.trend).toBe('neutral')
    expect(m.crossover).toBe(null)
  })

  it('strong uptrend → bullish', () => {
    const m = calculateMACD(TREND_UP_40)
    expect(m.trend).toBe('bullish')
  })

  it('strong downtrend → bearish', () => {
    const m = calculateMACD(TREND_DOWN_40)
    expect(m.trend).toBe('bearish')
  })

  it('histogram sign matches trend', () => {
    const up = calculateMACD(TREND_UP_40)
    const dn = calculateMACD(TREND_DOWN_40)
    expect(up.histogram).toBeGreaterThan(0)
    expect(dn.histogram).toBeLessThan(0)
  })

  it('empty array → all-zero neutral fallback', () => {
    const m = calculateMACD([])
    expect(m).toEqual({ macd: 0, signal: 0, histogram: 0, trend: 'neutral', crossover: null })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('calculateRSI', () => {
  it('returns value and status', () => {
    const r = calculateRSI(TREND_UP_40)
    expect(r).toHaveProperty('value')
    expect(r).toHaveProperty('status')
  })

  it('status is overbought / oversold / neutral', () => {
    const r = calculateRSI(TREND_UP_40)
    expect(['overbought', 'oversold', 'neutral']).toContain(r.status)
  })

  it('value is in 0–100', () => {
    const r = calculateRSI(TREND_UP_40)
    expect(r.value).toBeGreaterThanOrEqual(0)
    expect(r.value).toBeLessThanOrEqual(100)
  })

  it('strong uptrend → overbought (>70)', () => {
    const r = calculateRSI(TREND_UP_40)
    expect(r.value).toBeGreaterThan(70)
    expect(r.status).toBe('overbought')
  })

  it('strong downtrend → oversold (<30)', () => {
    const r = calculateRSI(TREND_DOWN_40)
    expect(r.value).toBeLessThan(30)
    expect(r.status).toBe('oversold')
  })

  it('flat series → neutral 50', () => {
    const r = calculateRSI(FLAT_40)
    expect(r.status).toBe('neutral')
    expect(r.value).toBe(50)
  })

  it('too short for period → neutral fallback', () => {
    const r = calculateRSI([10, 11, 12], 14)
    expect(r.status).toBe('neutral')
    expect(r.value).toBe(50)
  })

  it('empty array → neutral 50', () => {
    const r = calculateRSI([])
    expect(r).toEqual({ value: 50, status: 'neutral' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('calculateBollingerBands', () => {
  it('returns required shape', () => {
    const b = calculateBollingerBands(TREND_UP_40)
    expect(b).toHaveProperty('upper')
    expect(b).toHaveProperty('middle')
    expect(b).toHaveProperty('lower')
    expect(b).toHaveProperty('bandwidth')
    expect(b).toHaveProperty('status')
  })

  it('upper > middle > lower when there is variance', () => {
    const b = calculateBollingerBands(TREND_UP_40)
    expect(b.upper).toBeGreaterThan(b.middle)
    expect(b.middle).toBeGreaterThan(b.lower)
  })

  it('bandwidth > 0 when there is variance', () => {
    const b = calculateBollingerBands(TREND_UP_40)
    expect(b.bandwidth).toBeGreaterThan(0)
  })

  it('status is above / below / inside', () => {
    const b = calculateBollingerBands(TREND_UP_40)
    expect(['above', 'below', 'inside']).toContain(b.status)
  })

  it('uptrend ending → status = above', () => {
    const b = calculateBollingerBands(BB_BREAKOUT_ABOVE)
    expect(b.status).toBe('above')
  })

  it('downtrend ending → status = below', () => {
    const b = calculateBollingerBands(BB_BREAKOUT_BELOW)
    expect(b.status).toBe('below')
  })

  it('flat → bandwidth near 0, status = inside', () => {
    const b = calculateBollingerBands(FLAT_40)
    expect(b.bandwidth).toBeCloseTo(0, 5)
    expect(b.status).toBe('inside')
  })

  it('too short → equal bands, inside', () => {
    const b = calculateBollingerBands([100, 110, 120], 20)
    expect(b.upper).toBe(b.middle)
    expect(b.lower).toBe(b.middle)
    expect(b.status).toBe('inside')
  })

  it('empty → zero fallback', () => {
    const b = calculateBollingerBands([])
    expect(b.upper).toBe(0)
    expect(b.middle).toBe(0)
    expect(b.lower).toBe(0)
    expect(b.bandwidth).toBe(0)
    expect(b.status).toBe('inside')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('getSignalScore', () => {
  it('returns number in [-2, +2]', () => {
    [TREND_UP_40, TREND_DOWN_40, FLAT_40, TREND_UP_26, []].forEach(prices => {
      const s = getSignalScore(prices)
      expect(s).toBeGreaterThanOrEqual(-2)
      expect(s).toBeLessThanOrEqual(2)
    })
  })

  it('strong uptrend → score ≤ 0 (overbought signals)', () => {
    expect(getSignalScore(TREND_UP_40)).toBeLessThanOrEqual(0)
  })

  it('strong downtrend → score ≥ 0 (oversold signals)', () => {
    expect(getSignalScore(TREND_DOWN_40)).toBeGreaterThanOrEqual(0)
  })

  it('empty array → 0', () => {
    expect(getSignalScore([])).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('getSignalLabel', () => {
  it('returns text, color, type', () => {
    const l = getSignalLabel(0)
    expect(l).toHaveProperty('text')
    expect(l).toHaveProperty('color')
    expect(l).toHaveProperty('type')
  })

  it('type is buy / sell / neutral', () => {
    [-2, -1, 0, 1, 2].forEach(score => {
      const { type } = getSignalLabel(score)
      expect(['buy', 'sell', 'neutral']).toContain(type)
    })
  })

  it('+2 → 强烈买入 / buy', () => {
    const l = getSignalLabel(2)
    expect(l.type).toBe('buy')
    expect(l.text).toContain('买入')
  })

  it('+1 → 买入', () => {
    const l = getSignalLabel(1)
    expect(l.type).toBe('buy')
  })

  it('0 → 中性 / neutral', () => {
    const l = getSignalLabel(0)
    expect(l.type).toBe('neutral')
  })

  it('-1 → 卖出', () => {
    const l = getSignalLabel(-1)
    expect(l.type).toBe('sell')
  })

  it('-2 → 强烈卖出', () => {
    const l = getSignalLabel(-2)
    expect(l.type).toBe('sell')
    expect(l.text).toContain('卖出')
  })

  it('non-number coerces to 0 → neutral', () => {
    const l = getSignalLabel('abc')
    expect(l.type).toBe('neutral')
  })
})

// ── Round 4 additions: EMA precision + MACD golden-cross scenario ──────────────

describe('calculateEMA precision', () => {
  it('3-period EMA on known sequence matches manual calc', () => {
    // k = 2/(3+1) = 0.5
    // prices: 10, 12, 11, 13, 15
    // EMA[0] = 10
    // EMA[1] = 12*0.5 + 10*0.5 = 11
    // EMA[2] = 11*0.5 + 11*0.5 = 11
    // EMA[3] = 13*0.5 + 11*0.5 = 12
    // EMA[4] = 15*0.5 + 12*0.5 = 13.5
    const ema = calculateEMA([10, 12, 11, 13, 15], 3)
    expect(ema[0]).toBe(10)
    expect(ema[1]).toBeCloseTo(11, 5)
    expect(ema[2]).toBeCloseTo(11, 5)
    expect(ema[3]).toBeCloseTo(12, 5)
    expect(ema[4]).toBeCloseTo(13.5, 5)
  })

  it('period-1 EMA equals input', () => {
    const prices = [5, 10, 15, 20]
    expect(calculateEMA(prices, 1)).toEqual(prices)
  })
})

describe('calculateMACD with enough data for crossover detection', () => {
  it('histogram > 0 implies bullish trend', () => {
    const prices = Array.from({ length: 40 }, (_, i) => 100 + i)
    const { trend, histogram } = calculateMACD(prices)
    expect(trend).toBe('bullish')
    expect(histogram).toBeGreaterThan(0)
  })

  it('histogram < 0 implies bearish trend', () => {
    const prices = Array.from({ length: 40 }, (_, i) => 200 - i)
    const { trend, histogram } = calculateMACD(prices)
    expect(trend).toBe('bearish')
    expect(histogram).toBeLessThan(0)
  })
})
