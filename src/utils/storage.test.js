/**
 * src/utils/storage.test.js — vitest suite for the local storage layer.
 * Uses the Node fallback shim (no uni runtime needed).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPositions,
  savePositions,
  addPosition,
  removePosition,
  updatePosition,
  getToken,
  setToken
} from './storage.js'

beforeEach(() => {
  savePositions([])
  setToken('')
})

describe('positions storage', () => {
  it('starts empty', () => {
    expect(getPositions()).toEqual([])
  })

  it('savePositions round-trip', () => {
    const list = [
      { symbol: 'SH600519', name: '贵州茅台', shares: 100, costPrice: 1800 },
      { symbol: 'HK00700', name: '腾讯控股', shares: 200, costPrice: 350 }
    ]
    savePositions(list)
    expect(getPositions()).toHaveLength(2)
    expect(getPositions()[0].symbol).toBe('SH600519')
  })

  it('addPosition deduplicates by symbol', () => {
    addPosition({ symbol: 'SH600519', shares: 100, costPrice: 1800 })
    addPosition({ symbol: 'SH600519', shares: 200, costPrice: 1700 })
    const list = getPositions()
    expect(list).toHaveLength(1)
    expect(list[0].shares).toBe(200)
    expect(list[0].costPrice).toBe(1700)
  })

  it('removePosition drops only the target', () => {
    addPosition({ symbol: 'SH600519', shares: 100 })
    addPosition({ symbol: 'HK00700', shares: 200 })
    removePosition('SH600519')
    const list = getPositions()
    expect(list).toHaveLength(1)
    expect(list[0].symbol).toBe('HK00700')
  })

  it('updatePosition merges a patch', () => {
    addPosition({ symbol: 'SH600519', shares: 100, costPrice: 1800 })
    updatePosition('SH600519', { shares: 250, notes: 'avg down' })
    const list = getPositions()
    expect(list[0].shares).toBe(250)
    expect(list[0].costPrice).toBe(1800)
    expect(list[0].notes).toBe('avg down')
  })

  it('ignores empty/invalid input gracefully', () => {
    addPosition(null)
    addPosition({})
    expect(getPositions()).toEqual([])
  })
})

describe('token storage', () => {
  it('returns empty string when unset', () => {
    expect(getToken()).toBe('')
  })
  it('round-trips a token', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })
  it('coerces non-strings to empty', () => {
    setToken(123)
    expect(getToken()).toBe('')
  })
})
