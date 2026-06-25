/**
 * src/utils/indicators.js — round-1 baseline implementation.
 * Round 3 may refactor/extend; the API/signature below is locked.
 */

/* ---------- internal helpers ---------- */
function _toNumberArray(prices) {
  if (!Array.isArray(prices)) return []
  return prices
    .map((p) => (typeof p === 'number' ? p : Number(p)))
    .filter((p) => Number.isFinite(p))
}

function _ema(prices, period) {
  const out = []
  if (!prices.length) return out
  const k = 2 / (period + 1)
  let prev = prices[0]
  out.push(prev)
  for (let i = 1; i < prices.length; i++) {
    prev = prices[i] * k + prev * (1 - k)
    out.push(prev)
  }
  return out
}

function _sma(prices, period) {
  const out = []
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      out.push(NaN)
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += prices[j]
    out.push(sum / period)
  }
  return out
}

function _stddev(prices, period) {
  const out = []
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      out.push(NaN)
      continue
    }
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period
    out.push(Math.sqrt(variance))
  }
  return out
}

/* ---------- public API ---------- */

export function calculateEMA(prices, period = 12) {
  const p = _toNumberArray(prices)
  return _ema(p, period)
}

export function calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
  const p = _toNumberArray(prices)
  if (p.length === 0) {
    return { macd: 0, signal: 0, histogram: 0, trend: 'neutral', crossover: null }
  }
  const emaFast = _ema(p, fast)
  const emaSlow = _ema(p, slow)
  const difArr = emaFast.map((v, i) => v - emaSlow[i])
  const deaArr = _ema(difArr, signal)
  const histArr = difArr.map((v, i) => 2 * (v - (deaArr[i] || 0)))

  const last = histArr.length - 1
  const prev = last - 1
  const macd = difArr[last] || 0
  const sig = deaArr[last] || 0
  const histogram = histArr[last] || 0

  let crossover = null
  if (prev >= 0) {
    const prevHist = histArr[prev]
    if (prevHist <= 0 && histogram > 0) crossover = 'golden'
    else if (prevHist >= 0 && histogram < 0) crossover = 'death'
  }

  let trend = 'neutral'
  if (histogram > 0) trend = 'bullish'
  else if (histogram < 0) trend = 'bearish'

  return { macd, signal: sig, histogram, trend, crossover }
}

export function calculateRSI(prices, period = 14) {
  const p = _toNumberArray(prices)
  if (p.length < period + 1) return { value: 50, status: 'neutral' }

  const gains = []
  const losses = []
  for (let i = 1; i < p.length; i++) {
    const diff = p[i] - p[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
  }

  let value
  if (avgLoss === 0) value = 100
  else {
    const rs = avgGain / avgLoss
    value = 100 - 100 / (1 + rs)
  }
  value = Math.round(value * 100) / 100

  let status = 'neutral'
  if (value > 70) status = 'overbought'
  else if (value < 30) status = 'oversold'

  return { value, status }
}

export function calculateBollingerBands(prices, period = 20, multiplier = 2) {
  const p = _toNumberArray(prices)
  if (p.length < period) {
    const last = p.length ? p[p.length - 1] : 0
    return { upper: last, middle: last, lower: last, bandwidth: 0, status: 'inside' }
  }
  const midArr = _sma(p, period)
  const sdArr = _stddev(p, period)
  const last = p.length - 1
  const middle = midArr[last]
  const sd = sdArr[last]
  const upper = middle + multiplier * sd
  const lower = middle - multiplier * sd
  const bandwidth = middle === 0 ? 0 : (upper - lower) / middle

  const price = p[last]
  let status = 'inside'
  if (price > upper) status = 'above'
  else if (price < lower) status = 'below'

  return { upper, middle, lower, bandwidth, status }
}

export function getSignalScore(prices) {
  const p = _toNumberArray(prices)
  if (p.length === 0) return 0
  const macd = calculateMACD(p)
  const rsi = calculateRSI(p)
  const bb = calculateBollingerBands(p)

  let score = 0
  if (macd.trend === 'bullish') score += 1
  else if (macd.trend === 'bearish') score -= 1
  if (rsi.status === 'oversold') score += 1
  else if (rsi.status === 'overbought') score -= 1
  if (bb.status === 'below') score += 1
  else if (bb.status === 'above') score -= 1

  if (score > 2) score = 2
  if (score < -2) score = -2
  return score
}

export function getSignalLabel(score) {
  const s = Number(score) || 0
  if (s >= 2) return { text: '强烈买入', color: '#e74c3c', type: 'buy' }
  if (s === 1) return { text: '买入', color: '#ff7e6b', type: 'buy' }
  if (s === 0) return { text: '中性', color: '#909399', type: 'neutral' }
  if (s === -1) return { text: '卖出', color: '#52c41a', type: 'sell' }
  return { text: '强烈卖出', color: '#2ecc71', type: 'sell' }
}
