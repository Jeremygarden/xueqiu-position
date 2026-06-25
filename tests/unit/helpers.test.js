/**
 * tests/unit/helpers.test.js
 * Unit tests for src/utils/helpers.js
 * Round 4 of the test-loop.
 */

import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatPercent,
  formatProfit,
  getMarketFromSymbol,
  isMarketOpen,
  symbolToDisplayCode
} from '@/utils/helpers.js'

// ─────────────────────────────────────────────────────────────────────────────
describe('formatPrice', () => {
  it('formats a normal positive number to 2 decimal places', () => {
    expect(formatPrice(1234.567)).toBe('1,234.57')
    expect(formatPrice(100)).toBe('100.00')
    expect(formatPrice(0)).toBe('0.00')
  })

  it('adds thousands separator', () => {
    expect(formatPrice(1234567.89)).toBe('1,234,567.89')
    expect(formatPrice(1000000)).toBe('1,000,000.00')
  })

  it('handles negative numbers', () => {
    expect(formatPrice(-1234.5)).toBe('-1,234.50')
    expect(formatPrice(-0.01)).toBe('-0.01')
  })

  it('handles small decimals without truncation', () => {
    expect(formatPrice(0.001)).toBe('0.00')
    expect(formatPrice(0.009)).toBe('0.01')
  })

  it('returns -- for null', () => expect(formatPrice(null)).toBe('--'))
  it('returns -- for undefined', () => expect(formatPrice(undefined)).toBe('--'))
  it('returns -- for NaN', () => expect(formatPrice(NaN)).toBe('--'))
  it('returns -- for empty string', () => expect(formatPrice('')).toBe('--'))
  it('returns -- for non-numeric string', () => expect(formatPrice('abc')).toBe('--'))
})

// ─────────────────────────────────────────────────────────────────────────────
describe('formatPercent', () => {
  it('formats positive with + sign', () => {
    expect(formatPercent(1.23)).toBe('+1.23%')
    expect(formatPercent(0.005)).toBe('+0.01%')
  })

  it('formats negative with - sign', () => {
    expect(formatPercent(-2.5)).toBe('-2.50%')
    expect(formatPercent(-0.001)).toBe('-0.00%')
  })

  it('formats zero without sign prefix (0.00%)', () => {
    const r = formatPercent(0)
    expect(r).toBe('0.00%')
  })

  it('returns -- for null/undefined/NaN', () => {
    expect(formatPercent(null)).toBe('--')
    expect(formatPercent(undefined)).toBe('--')
    expect(formatPercent(NaN)).toBe('--')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('formatProfit', () => {
  it('returns an object with text and cls', () => {
    const r = formatProfit(100)
    expect(r).toHaveProperty('text')
    expect(r).toHaveProperty('cls')
  })

  it('positive profit → text-up class', () => {
    expect(formatProfit(123.4).cls).toBe('text-up')
    expect(formatProfit(0.01).cls).toBe('text-up')
  })

  it('negative profit → text-down class', () => {
    expect(formatProfit(-50).cls).toBe('text-down')
    expect(formatProfit(-0.01).cls).toBe('text-down')
  })

  it('zero profit → text-flat class', () => {
    expect(formatProfit(0).cls).toBe('text-flat')
  })

  it('positive text has + prefix', () => {
    expect(formatProfit(123.4).text).toBe('+123.40')
  })

  it('negative text has - prefix (no double dash)', () => {
    expect(formatProfit(-50).text).toBe('-50.00')
  })

  it('zero text has no prefix', () => {
    const { text } = formatProfit(0)
    expect(text).toBe('0.00')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('getMarketFromSymbol', () => {
  // Prefixed Xueqiu canonical codes
  it('SH prefix → A股', () => {
    expect(getMarketFromSymbol('SH600519')).toBe('A股')
    expect(getMarketFromSymbol('SH000001')).toBe('A股')
  })

  it('SZ prefix → A股', () => {
    expect(getMarketFromSymbol('SZ000858')).toBe('A股')
    expect(getMarketFromSymbol('SZ300750')).toBe('A股')
  })

  it('BJ prefix → A股', () => {
    expect(getMarketFromSymbol('BJ430047')).toBe('A股')
    expect(getMarketFromSymbol('BJ835229')).toBe('A股')
  })

  it('HK prefix (4-5 digits) → 港股', () => {
    expect(getMarketFromSymbol('HK00700')).toBe('港股')
    expect(getMarketFromSymbol('HK0700')).toBe('港股')
    expect(getMarketFromSymbol('HK09988')).toBe('港股')
  })

  it('F prefix → 基金', () => {
    expect(getMarketFromSymbol('F000001')).toBe('基金')
    expect(getMarketFromSymbol('F510300')).toBe('基金')
  })

  // Bare numeric codes
  it('bare 6-digit starting with 6 → A股 (Shanghai)', () => {
    expect(getMarketFromSymbol('600519')).toBe('A股')
    expect(getMarketFromSymbol('601318')).toBe('A股')
  })

  it('bare 6-digit starting with 0 or 3 → A股 (Shenzhen)', () => {
    expect(getMarketFromSymbol('000858')).toBe('A股')
    expect(getMarketFromSymbol('300750')).toBe('A股')
  })

  it('bare 6-digit starting with 4 or 8 → A股 (Beijing)', () => {
    expect(getMarketFromSymbol('430047')).toBe('A股')
    expect(getMarketFromSymbol('835229')).toBe('A股')
  })

  it('bare 6-digit starting with 5 or 1 → 基金 (ETF/LOF)', () => {
    expect(getMarketFromSymbol('510300')).toBe('基金')
    expect(getMarketFromSymbol('159915')).toBe('基金')
  })

  // US tickers
  it('pure A-Z letters → 美股', () => {
    expect(getMarketFromSymbol('AAPL')).toBe('美股')
    expect(getMarketFromSymbol('NVDA')).toBe('美股')
    expect(getMarketFromSymbol('TSLA')).toBe('美股')
    expect(getMarketFromSymbol('BRK')).toBe('美股')
  })

  it('letters.letters → 美股 (BRK.A, BRK.B)', () => {
    expect(getMarketFromSymbol('BRK.A')).toBe('美股')
    expect(getMarketFromSymbol('BRK.B')).toBe('美股')
  })

  // Unknown / edge
  it('empty string → 未知', () => expect(getMarketFromSymbol('')).toBe('未知'))
  it('null → 未知', () => expect(getMarketFromSymbol(null)).toBe('未知'))
  it('undefined → 未知', () => expect(getMarketFromSymbol(undefined)).toBe('未知'))
  it('gibberish → 未知', () => expect(getMarketFromSymbol('???')).toBe('未知'))
})

// ─────────────────────────────────────────────────────────────────────────────
describe('symbolToDisplayCode', () => {
  it('strips SH/SZ/BJ prefix', () => {
    expect(symbolToDisplayCode('SH600519')).toBe('600519')
    expect(symbolToDisplayCode('SZ000858')).toBe('000858')
    expect(symbolToDisplayCode('BJ430047')).toBe('430047')
  })

  it('strips HK prefix', () => {
    expect(symbolToDisplayCode('HK00700')).toBe('00700')
    expect(symbolToDisplayCode('HK0700')).toBe('0700')
  })

  it('strips F prefix', () => {
    expect(symbolToDisplayCode('F000001')).toBe('000001')
    expect(symbolToDisplayCode('F510300')).toBe('510300')
  })

  it('passes through US tickers unchanged', () => {
    expect(symbolToDisplayCode('AAPL')).toBe('AAPL')
    expect(symbolToDisplayCode('BRK.A')).toBe('BRK.A')
  })

  it('passes through bare codes unchanged', () => {
    expect(symbolToDisplayCode('600519')).toBe('600519')
  })

  it('handles null/empty gracefully', () => {
    expect(symbolToDisplayCode(null)).toBe('')
    expect(symbolToDisplayCode('')).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('isMarketOpen', () => {
  // Market: Asia/Shanghai UTC+8 (non-DST)
  // 9:30 CST = 01:30 UTC, 11:30 CST = 03:30 UTC
  // 13:00 CST = 05:00 UTC, 15:00 CST = 07:00 UTC

  const CST = 8 * 60  // minutes offset from UTC

  function makeCST(h, m, dayOfWeek = 2 /* Tuesday */) {
    // Build a UTC Date that represents the given CST wall-clock time
    // dayOfWeek: 0=Sun, 1=Mon, 2=Tue
    const baseMonday = new Date('2026-06-22T00:00:00Z') // Monday
    const d = new Date(baseMonday.getTime() + dayOfWeek * 86400000)
    d.setUTCHours(h - 8, m, 0, 0)
    return d
  }

  it('is open at 10:00 CST (morning session)', () => {
    expect(isMarketOpen(makeCST(10, 0))).toBe(true)
  })

  it('is open at 14:00 CST (afternoon session)', () => {
    expect(isMarketOpen(makeCST(14, 0))).toBe(true)
  })

  it('is closed before 9:30 CST', () => {
    expect(isMarketOpen(makeCST(9, 0))).toBe(false)
    expect(isMarketOpen(makeCST(9, 29))).toBe(false)
  })

  it('is closed at lunch 11:30–13:00 CST', () => {
    expect(isMarketOpen(makeCST(11, 31))).toBe(false)
    expect(isMarketOpen(makeCST(12, 0))).toBe(false)
    expect(isMarketOpen(makeCST(12, 59))).toBe(false)
  })

  it('is closed at/after 15:00 CST', () => {
    expect(isMarketOpen(makeCST(15, 0))).toBe(false)
    expect(isMarketOpen(makeCST(16, 0))).toBe(false)
  })

  it('is closed on Saturday (dayOfWeek=6)', () => {
    // Build a Saturday UTC
    const sat = new Date('2026-06-27T02:00:00Z') // 10:00 CST Saturday
    expect(isMarketOpen(sat)).toBe(false)
  })

  it('is closed on Sunday', () => {
    const sun = new Date('2026-06-28T02:00:00Z')
    expect(isMarketOpen(sun)).toBe(false)
  })

  it('no-arg call returns boolean', () => {
    expect(typeof isMarketOpen()).toBe('boolean')
  })
})
