/**
 * tests/unit/symbol-classification.test.js
 *
 * Regression coverage for the `_toType()` symbol classifier inside
 * `src/api/xueqiu.js`.  The helper is module-private (intentionally —
 * users should not depend on it), so we exercise it indirectly through
 * `fetchQuote()` whose returned object exposes the resolved `type` field.
 *
 * The classifier supports:
 *   - Open-end funds:       F000001, or 6-digit codes whose leading digit is
 *                           NOT 0/3/4/5/6/8 and NOT 15/16-prefixed.
 *   - A-share ETFs/LOFs:    SH5xxxxx, SH588xxx, SZ15xxxx, SZ16xxxx, and the
 *                           same bare 6-digit ranges.
 *   - Stocks:               SH/SZ/BJ/HK + digits (mainland + HK), bare 6-digit
 *                           codes in 0/3/4/6/8 leading-digit ranges (沪深京),
 *                           plus US tickers AAPL / BRK.B / NVDA etc.
 *
 * Each scenario stubs `uni.request` to return a minimal upstream payload so
 * that we can observe what _toType() decides for the input symbol.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { fetchQuote } from '@/api/xueqiu.js'

function mockUpstreamForSymbol(symbol, statusCode = 200) {
  uni.request.mockImplementation(({ success }) => {
    success({
      statusCode,
      data: {
        data: {
          items: [
            {
              quote: {
                symbol,
                name: `mock-${symbol}`,
                current: 10,
                percent: 0,
                chg: 0,
                high: 10,
                low: 10,
                open: 10,
                last_close: 10,
                volume: 0,
                market_capital: 0,
                // Note: upstream `type` is INTENTIONALLY wrong here.
                // The classifier should ignore it and decide from the symbol.
                type: 'this-should-be-ignored'
              }
            }
          ]
        }
      }
    })
  })
}

async function typeOf(symbol) {
  mockUpstreamForSymbol(symbol)
  const q = await fetchQuote(symbol)
  return q && q.type
}

beforeEach(() => {
  uni._reset()
})

// ─────────────────────────────────────────────────────────────────────────────
describe('_toType — open-end funds (Danjuan F-prefix)', () => {
  it('classifies F000001 as fund', async () => {
    expect(await typeOf('F000001')).toBe('fund')
  })

  it('classifies F110011 as fund', async () => {
    expect(await typeOf('F110011')).toBe('fund')
  })

  it('classifies F501000 as fund (F-prefix wins even with stock-looking digits)', async () => {
    // F + 501000 is still a Danjuan fund handle, not an ETF.  Treat any
    // F\d{6} as fund unconditionally.
    expect(await typeOf('F501000')).toBe('fund')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('_toType — Xueqiu-prefixed A-share ETFs / LOFs', () => {
  it('SH510300 → etf (沪深300 ETF)', async () => {
    expect(await typeOf('SH510300')).toBe('etf')
  })

  it('SH588000 → etf (科创50 ETF, SH588 special range)', async () => {
    expect(await typeOf('SH588000')).toBe('etf')
  })

  it('SH588080 → etf (科创板 ETF region)', async () => {
    expect(await typeOf('SH588080')).toBe('etf')
  })

  it('SZ159915 → etf (创业板 ETF / LOF range)', async () => {
    expect(await typeOf('SZ159915')).toBe('etf')
  })

  it('SZ161725 → etf (LOF range)', async () => {
    expect(await typeOf('SZ161725')).toBe('etf')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('_toType — bare 6-digit codes', () => {
  it('510300 → etf (5-prefix is 沪市 ETF)', async () => {
    expect(await typeOf('510300')).toBe('etf')
  })

  it('159915 → etf (159 LOF/ETF range)', async () => {
    expect(await typeOf('159915')).toBe('etf')
  })

  it('161725 → etf (16x LOF range)', async () => {
    expect(await typeOf('161725')).toBe('etf')
  })

  it('600519 → stock (6-prefix is 沪市主板)', async () => {
    expect(await typeOf('600519')).toBe('stock')
  })

  it('000858 → stock (0-prefix is 深市主板)', async () => {
    expect(await typeOf('000858')).toBe('stock')
  })

  it('300750 → stock (3-prefix is 创业板)', async () => {
    expect(await typeOf('300750')).toBe('stock')
  })

  it('830799 → stock (8-prefix is 北交所)', async () => {
    expect(await typeOf('830799')).toBe('stock')
  })

  it('430510 → stock (4-prefix is 北交所)', async () => {
    expect(await typeOf('430510')).toBe('stock')
  })

  it('110011 → fund (1-prefix but NOT 15/16, fallback to open-end fund)', async () => {
    expect(await typeOf('110011')).toBe('fund')
  })

  it('200001 → fund (2-prefix, open-end fund fallback)', async () => {
    expect(await typeOf('200001')).toBe('fund')
  })

  it('700001 → fund (7-prefix, open-end fund fallback)', async () => {
    expect(await typeOf('700001')).toBe('fund')
  })

  it('900001 → fund (9-prefix, open-end fund fallback)', async () => {
    expect(await typeOf('900001')).toBe('fund')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('_toType — prefixed stocks (mainland + HK)', () => {
  it('SH600519 → stock (贵州茅台)', async () => {
    expect(await typeOf('SH600519')).toBe('stock')
  })

  it('SZ000858 → stock (五粮液)', async () => {
    expect(await typeOf('SZ000858')).toBe('stock')
  })

  it('BJ430510 → stock (北交所代码)', async () => {
    expect(await typeOf('BJ430510')).toBe('stock')
  })

  it('HK00700 → stock (腾讯控股)', async () => {
    expect(await typeOf('HK00700')).toBe('stock')
  })

  it('HK09988 → stock (阿里巴巴)', async () => {
    expect(await typeOf('HK09988')).toBe('stock')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('_toType — US tickers (1-5 ASCII letters, optional .CLASS suffix)', () => {
  it('AAPL → stock', async () => {
    expect(await typeOf('AAPL')).toBe('stock')
  })

  it('NVDA → stock', async () => {
    expect(await typeOf('NVDA')).toBe('stock')
  })

  it('GOOGL → stock (5-letter ticker)', async () => {
    expect(await typeOf('GOOGL')).toBe('stock')
  })

  it('BRK.B → stock (with class suffix)', async () => {
    expect(await typeOf('BRK.B')).toBe('stock')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('_toType — fallback & robustness', () => {
  it('unknown garbage symbol → stock (safe default)', async () => {
    // Symbol doesn't match any of the rules.  We choose 'stock' as the safe
    // generic default rather than throwing — UI then shows raw values.
    expect(await typeOf('?$%@!')).toBe('stock')
  })

  it('mixed case symbol still classifies (sh600519 → stock)', async () => {
    // _normalizeSymbol upper-cases before pattern-matching.
    expect(await typeOf('sh600519')).toBe('stock')
  })
})
