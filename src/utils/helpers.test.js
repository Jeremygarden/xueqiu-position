/**
 * src/utils/helpers.test.js — vitest suite for formatters + market detection.
 */

import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatPercent,
  formatProfit,
  getMarketFromSymbol,
  isMarketOpen,
  symbolToDisplayCode
} from './helpers.js'

describe('formatPrice', () => {
  it('formats with thousand separators + 2 decimals', () => {
    expect(formatPrice(1234567.891)).toBe('1,234,567.89')
    expect(formatPrice(0)).toBe('0.00')
  })
  it('handles negative numbers', () => {
    expect(formatPrice(-1234.5)).toBe('-1,234.50')
  })
  it('returns dashes for null / undefined / NaN', () => {
    expect(formatPrice(null)).toBe('--')
    expect(formatPrice(undefined)).toBe('--')
    expect(formatPrice('')).toBe('--')
    expect(formatPrice(NaN)).toBe('--')
  })
})

describe('formatPercent', () => {
  it('formats with sign + percent', () => {
    expect(formatPercent(1.234)).toBe('+1.23%')
    expect(formatPercent(-0.5)).toBe('-0.50%')
    expect(formatPercent(0)).toBe('0.00%')
  })
  it('safe-falls back on bad input', () => {
    expect(formatPercent(null)).toBe('--')
    expect(formatPercent(undefined)).toBe('--')
    expect(formatPercent(NaN)).toBe('--')
  })
})

describe('formatProfit', () => {
  it('returns text + class', () => {
    expect(formatProfit(123.4).cls).toBe('text-up')
    expect(formatProfit(-50).cls).toBe('text-down')
    expect(formatProfit(0).cls).toBe('text-flat')
  })
  it('signs the text', () => {
    expect(formatProfit(123.4).text).toBe('+123.40')
    expect(formatProfit(-50).text).toBe('-50.00')
  })
})

describe('getMarketFromSymbol', () => {
  it('recognises Xueqiu-prefixed symbols', () => {
    expect(getMarketFromSymbol('SH600519')).toBe('A股')
    expect(getMarketFromSymbol('SZ000858')).toBe('A股')
    expect(getMarketFromSymbol('BJ430047')).toBe('A股')
    expect(getMarketFromSymbol('HK00700')).toBe('港股')
    expect(getMarketFromSymbol('HK0700')).toBe('港股')
    expect(getMarketFromSymbol('F000001')).toBe('基金')
  })
  it('recognises bare A-share codes', () => {
    expect(getMarketFromSymbol('600519')).toBe('A股')
    expect(getMarketFromSymbol('000858')).toBe('A股')
    expect(getMarketFromSymbol('300750')).toBe('A股')
    expect(getMarketFromSymbol('510300')).toBe('基金')
  })
  it('recognises US tickers', () => {
    expect(getMarketFromSymbol('AAPL')).toBe('美股')
    expect(getMarketFromSymbol('NVDA')).toBe('美股')
    expect(getMarketFromSymbol('BRK.A')).toBe('美股')
  })
  it('defaults to 未知 on garbage / empty', () => {
    expect(getMarketFromSymbol('')).toBe('未知')
    expect(getMarketFromSymbol(null)).toBe('未知')
    expect(getMarketFromSymbol('???')).toBe('未知')
  })
})

describe('symbolToDisplayCode', () => {
  it('strips the prefix', () => {
    expect(symbolToDisplayCode('SH600519')).toBe('600519')
    expect(symbolToDisplayCode('HK00700')).toBe('00700')
    expect(symbolToDisplayCode('F000001')).toBe('000001')
  })
  it('passes through US tickers unchanged', () => {
    expect(symbolToDisplayCode('AAPL')).toBe('AAPL')
  })
})

describe('isMarketOpen', () => {
  it('returns true at 10:00 Asia/Shanghai on a weekday', () => {
    // 2026-06-23 (Tuesday) 10:00 CST  = 02:00 UTC
    expect(isMarketOpen(new Date('2026-06-23T02:00:00Z'))).toBe(true)
  })
  it('returns false outside trading hours', () => {
    // 16:00 CST = 08:00 UTC
    expect(isMarketOpen(new Date('2026-06-23T08:00:00Z'))).toBe(false)
    // 09:00 CST = 01:00 UTC (before open)
    expect(isMarketOpen(new Date('2026-06-23T01:00:00Z'))).toBe(false)
  })
  it('returns false on the weekend', () => {
    // 2026-06-21 (Sunday) 02:00 UTC
    expect(isMarketOpen(new Date('2026-06-21T02:00:00Z'))).toBe(false)
  })
})
