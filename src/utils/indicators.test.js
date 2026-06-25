/**
 * src/utils/indicators.test.js — vitest suite for technical indicators.
 *
 * Run: npm test
 * These tests are pure-function only; they don't need a uni runtime.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateBollingerBands,
  getSignalScore,
  getSignalLabel
} from './indicators.js'

const trending = [
  10, 11, 12, 11, 10, 9, 10, 11, 13, 14,
  15, 14, 13, 12, 11, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20
]

describe('calculateEMA', () => {
  it('returns an array the same length as input', () => {
    const out = calculateEMA(trending, 12)
    expect(Array.isArray(out)).toBe(true)
    expect(out.length).toBe(trending.length)
  })

  it('the final EMA tracks the trend direction', () => {
    const out = calculateEMA(trending, 5)
    const last = out[out.length - 1]
    expect(Number.isFinite(last)).toBe(true)
    // strong uptrend → EMA(5) should be well above the starting price
    expect(last).toBeGreaterThan(trending[0])
  })

  it('returns null entries (or sane fallback) when input is too short', () => {
    const out = calculateEMA([], 12)
    expect(Array.isArray(out)).toBe(true)
    expect(out.length).toBe(0)
  })
})

describe('calculateMACD', () => {
  it('returns macd / signal / histogram / trend / crossover', () => {
    const m = calculateMACD(trending)
    expect(typeof m.macd).toBe('number')
    expect(typeof m.signal).toBe('number')
    expect(typeof m.histogram).toBe('number')
    expect(['bullish', 'bearish', 'neutral']).toContain(m.trend)
    expect([null, 'golden', 'death']).toContain(m.crossover)
  })

  it('uses neutral safely when prices are too short', () => {
    const m = calculateMACD([1, 2, 3])
    expect(m.trend).toBe('neutral')
    expect(m.crossover).toBe(null)
  })
})

describe('calculateRSI', () => {
  it('classifies a strong uptrend as overbought', () => {
    const r = calculateRSI(trending, 14)
    expect(r.status).toBe('overbought')
    expect(r.value).toBeGreaterThan(70)
  })

  it('returns neutral mid-50s on flat data', () => {
    const flat = Array.from({ length: 20 }, () => 100)
    const r = calculateRSI(flat, 14)
    expect(r.status).toBe('neutral')
    expect(r.value).toBeGreaterThanOrEqual(40)
    expect(r.value).toBeLessThanOrEqual(60)
  })

  it('uses safe defaults on empty input', () => {
    const r = calculateRSI([], 14)
    expect(r.status).toBe('neutral')
    expect(r.value).toBe(50)
  })
})

describe('calculateBollingerBands', () => {
  it('upper > middle > lower on real series', () => {
    const b = calculateBollingerBands(trending, 20, 2)
    expect(b.upper).toBeGreaterThan(b.middle)
    expect(b.middle).toBeGreaterThan(b.lower)
    expect(b.bandwidth).toBeGreaterThan(0)
  })

  it('marks strong uptrend close as above the upper band', () => {
    const b = calculateBollingerBands(trending, 20, 2)
    expect(b.status).toBe('above')
  })

  it('falls back to inside when window is insufficient', () => {
    const b = calculateBollingerBands([1, 2], 20, 2)
    expect(b.status).toBe('inside')
  })
})

describe('getSignalScore', () => {
  it('lives within [-2, +2]', () => {
    const s = getSignalScore(trending)
    expect(s).toBeGreaterThanOrEqual(-2)
    expect(s).toBeLessThanOrEqual(2)
  })

  it('signals "overheated" (negative score) on a strong uptrend', () => {
    expect(getSignalScore(trending)).toBeLessThanOrEqual(0)
  })

  it('returns 0 on empty input', () => {
    expect(getSignalScore([])).toBe(0)
  })
})

describe('getSignalLabel', () => {
  it('produces text + color + type for any score', () => {
    for (const s of [-2, -1, 0, 1, 2]) {
      const l = getSignalLabel(s)
      expect(typeof l.text).toBe('string')
      expect(l.text.length).toBeGreaterThan(0)
      expect(typeof l.color).toBe('string')
      expect(['buy', 'sell', 'neutral']).toContain(l.type)
    }
  })

  it('positive score → buy, negative → sell, zero → neutral', () => {
    expect(getSignalLabel(2).type).toBe('buy')
    expect(getSignalLabel(-2).type).toBe('sell')
    expect(getSignalLabel(0).type).toBe('neutral')
  })
})
