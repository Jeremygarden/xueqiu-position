/**
 * tests/unit/storage.test.js
 * Unit tests for src/utils/storage.js
 * Round 3 of the test-loop.
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
} from '@/utils/storage.js'

// Reset in-memory store before each test
beforeEach(() => {
  uni._reset()
})

// ─────────────────────────────────────────────────────────────────────────────
describe('getPositions', () => {
  it('returns [] when nothing stored', () => {
    expect(getPositions()).toEqual([])
  })

  it('returns [] when stored value is empty string', () => {
    uni._store['xq_positions'] = ''
    expect(getPositions()).toEqual([])
  })

  it('returns [] when stored value is not valid JSON', () => {
    uni._store['xq_positions'] = 'not-json'
    expect(getPositions()).toEqual([])
  })

  it('parses JSON-serialized positions', () => {
    const list = [{ symbol: 'SH600519', shares: 10 }]
    uni._store['xq_positions'] = JSON.stringify(list)
    expect(getPositions()).toEqual(list)
  })

  it('returns [] when stored value is not an array', () => {
    uni._store['xq_positions'] = JSON.stringify({ symbol: 'SH600519' })
    expect(getPositions()).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('savePositions', () => {
  it('round-trips an array correctly', () => {
    const list = [
      { symbol: 'SH600519', name: '贵州茅台', shares: 10, costPrice: 1400 },
      { symbol: 'HK00700', name: '腾讯控股', shares: 200, costPrice: 350 }
    ]
    savePositions(list)
    expect(getPositions()).toEqual(list)
  })

  it('handles empty array', () => {
    savePositions([])
    expect(getPositions()).toEqual([])
  })

  it('saves non-array as empty array', () => {
    savePositions(null)
    expect(getPositions()).toEqual([])
    savePositions(undefined)
    expect(getPositions()).toEqual([])
    savePositions('string')
    expect(getPositions()).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('addPosition', () => {
  it('adds a new position', () => {
    addPosition({ symbol: 'SH600519', name: '贵州茅台', shares: 10 })
    expect(getPositions()).toHaveLength(1)
    expect(getPositions()[0].symbol).toBe('SH600519')
  })

  it('deduplicates by symbol (later entry wins)', () => {
    addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    addPosition({ symbol: 'SH600519', shares: 20, costPrice: 1350 })
    const list = getPositions()
    expect(list).toHaveLength(1)
    expect(list[0].shares).toBe(20)
    expect(list[0].costPrice).toBe(1350)
  })

  it('maintains other positions when adding new one', () => {
    addPosition({ symbol: 'SH600519', shares: 10 })
    addPosition({ symbol: 'HK00700', shares: 200 })
    expect(getPositions()).toHaveLength(2)
  })

  it('ignores null input', () => {
    addPosition(null)
    expect(getPositions()).toEqual([])
  })

  it('ignores position without symbol', () => {
    addPosition({ shares: 10, costPrice: 100 })
    expect(getPositions()).toEqual([])
  })

  it('returns the updated list', () => {
    const list = addPosition({ symbol: 'SH600519', shares: 10 })
    expect(Array.isArray(list)).toBe(true)
    expect(list[0].symbol).toBe('SH600519')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('removePosition', () => {
  beforeEach(() => {
    savePositions([
      { symbol: 'SH600519', shares: 10 },
      { symbol: 'HK00700', shares: 200 },
      { symbol: 'F000001', shares: 5000 }
    ])
  })

  it('removes the target symbol', () => {
    removePosition('SH600519')
    const list = getPositions()
    expect(list).toHaveLength(2)
    expect(list.find(p => p.symbol === 'SH600519')).toBeUndefined()
  })

  it('leaves remaining positions intact', () => {
    removePosition('HK00700')
    const list = getPositions()
    expect(list.find(p => p.symbol === 'SH600519')).toBeDefined()
    expect(list.find(p => p.symbol === 'F000001')).toBeDefined()
  })

  it('is a no-op for non-existent symbol', () => {
    removePosition('AAPL')
    expect(getPositions()).toHaveLength(3)
  })

  it('returns the updated list', () => {
    const list = removePosition('SH600519')
    expect(Array.isArray(list)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('updatePosition', () => {
  beforeEach(() => {
    savePositions([
      { symbol: 'SH600519', shares: 10, costPrice: 1400, notes: '' }
    ])
  })

  it('merges patch fields', () => {
    updatePosition('SH600519', { shares: 20, notes: 'doubled' })
    const pos = getPositions()[0]
    expect(pos.shares).toBe(20)
    expect(pos.notes).toBe('doubled')
  })

  it('preserves unpatched fields', () => {
    updatePosition('SH600519', { shares: 20 })
    expect(getPositions()[0].costPrice).toBe(1400)
  })

  it('is a no-op for non-existent symbol', () => {
    updatePosition('AAPL', { shares: 99 })
    expect(getPositions()[0].symbol).toBe('SH600519')
  })

  it('handles null patch gracefully', () => {
    updatePosition('SH600519', null)
    expect(getPositions()[0].shares).toBe(10)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('getToken / setToken', () => {
  it('returns empty string when unset', () => {
    expect(getToken()).toBe('')
  })

  it('round-trips a token', () => {
    setToken('abc123xyz')
    expect(getToken()).toBe('abc123xyz')
  })

  it('overwrites previous token', () => {
    setToken('old-token')
    setToken('new-token')
    expect(getToken()).toBe('new-token')
  })

  it('coerces number to empty string', () => {
    setToken(12345)
    expect(getToken()).toBe('')
  })

  it('coerces null to empty string', () => {
    setToken(null)
    expect(getToken()).toBe('')
  })

  it('accepts empty string', () => {
    setToken('some-token')
    setToken('')
    expect(getToken()).toBe('')
  })
})

// ── Round 5 additions: persistence across multiple operations ────────────────

describe('multi-operation persistence', () => {
  it('add → update → remove → empty', () => {
    addPosition({ symbol: 'SH600519', shares: 10, costPrice: 1400 })
    updatePosition('SH600519', { shares: 20 })
    expect(getPositions()[0].shares).toBe(20)
    removePosition('SH600519')
    expect(getPositions()).toHaveLength(0)
  })

  it('order is preserved when adding multiple distinct positions', () => {
    const syms = ['SH600519', 'HK00700', 'AAPL']
    for (const symbol of syms) addPosition({ symbol, shares: 1 })
    const list = getPositions()
    expect(list.map(p => p.symbol)).toEqual(syms)
  })

  it('updatePosition on non-existent symbol does not create entry', () => {
    updatePosition('GHOST', { shares: 999 })
    expect(getPositions()).toHaveLength(0)
  })

  it('savePositions with deeply nested objects survives JSON round-trip', () => {
    const list = [{ symbol: 'SH600519', meta: { tags: ['a', 'b'] }, shares: 5 }]
    savePositions(list)
    const loaded = getPositions()
    expect(loaded[0].meta.tags).toEqual(['a', 'b'])
  })
})
