/**
 * Technical Analysis Indicators
 * Pure functions for computing MACD, RSI, and Bollinger Bands.
 *
 * Public API (per checklist):
 *   - calculateMACD(prices)          → { macd, signal, histogram, trend }
 *   - calculateRSI(prices, period)   → { value, status }
 *   - calculateBollingerBands(prices, period, multiplier) → { upper, middle, lower, status }
 *   - getSignalScore(prices)         → number in [-2, +2]
 *
 * Legacy aliases (kept for backward compatibility):
 *   - calculateBollinger              → same as calculateBollingerBands
 *   - calculateCompositeSignal(macd, rsi, bb) → { score, level, signals }
 */

// ----- internal helpers ---------------------------------------------------

function EMA(data, period) {
  const k = 2 / (period + 1)
  const result = []
  let ema = data[0]
  result.push(ema)
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k)
    result.push(ema)
  }
  return result
}

function SMA(data, period) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i])
    } else {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j]
      }
      result.push(sum / period)
    }
  }
  return result
}

function STDDEV(data, period) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0)
    } else {
      const slice = data.slice(i - period + 1, i + 1)
      const mean = slice.reduce((a, b) => a + b, 0) / period
      const squaredDiffs = slice.map(v => (v - mean) ** 2)
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period
      result.push(Math.sqrt(variance))
    }
  }
  return result
}

// ----- public API ---------------------------------------------------------

/**
 * Calculate MACD indicator.
 * @param {number[]} prices - closing prices
 * @param {number} [fastPeriod=12]
 * @param {number} [slowPeriod=26]
 * @param {number} [signalPeriod=9]
 * @returns {{macd:number, signal:number, histogram:number, trend:'bullish'|'bearish'|'neutral'}}
 *   Latest values + 'trend' derived from histogram sign / crossover.
 */
export function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return { macd: 0, signal: 0, histogram: 0, trend: 'neutral' }
  }

  // With short series, just return zeros instead of throwing.
  const need = slowPeriod + signalPeriod
  const tooShort = prices.length < need

  const emaFast = EMA(prices, fastPeriod)
  const emaSlow = EMA(prices, slowPeriod)
  const difArr = emaFast.map((v, i) => v - emaSlow[i])
  const deaArr = EMA(difArr, signalPeriod)
  const histArr = difArr.map((v, i) => 2 * (v - (deaArr[i] || 0)))

  const last = histArr.length - 1
  const prev = histArr.length - 2

  const macd = difArr[last] || 0
  const signal = deaArr[last] || 0
  const histogram = histArr[last] || 0

  let trend = 'neutral'
  if (!tooShort && prev >= 0) {
    if (histArr[prev] <= 0 && histArr[last] > 0) trend = 'bullish'
    else if (histArr[prev] >= 0 && histArr[last] < 0) trend = 'bearish'
    else if (histogram > 0) trend = 'bullish'
    else if (histogram < 0) trend = 'bearish'
  } else if (!tooShort) {
    if (histogram > 0) trend = 'bullish'
    else if (histogram < 0) trend = 'bearish'
  }

  return { macd, signal, histogram, trend }
}

/**
 * Calculate RSI indicator.
 * @param {number[]} prices - closing prices
 * @param {number} [period=14]
 * @returns {{value:number, status:'overbought'|'oversold'|'neutral'}}
 */
export function calculateRSI(prices, period = 14) {
  if (!Array.isArray(prices) || prices.length < period + 1) {
    return { value: 50, status: 'neutral' }
  }

  const gains = []
  const losses = []
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
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
  if (avgLoss === 0) {
    value = 100
  } else {
    const rs = avgGain / avgLoss
    value = 100 - 100 / (1 + rs)
  }
  value = Math.round(value * 100) / 100

  let status = 'neutral'
  if (value > 70) status = 'overbought'
  else if (value < 30) status = 'oversold'

  return { value, status }
}

/**
 * Calculate Bollinger Bands (latest band values + price status).
 * @param {number[]} prices - closing prices
 * @param {number} [period=20]
 * @param {number} [multiplier=2]
 * @returns {{upper:number, middle:number, lower:number, status:'above'|'below'|'inside'}}
 */
export function calculateBollingerBands(prices, period = 20, multiplier = 2) {
  if (!Array.isArray(prices) || prices.length < period) {
    const last = prices && prices.length ? prices[prices.length - 1] : 0
    return { upper: last, middle: last, lower: last, status: 'inside' }
  }

  const middleArr = SMA(prices, period)
  const stddevArr = STDDEV(prices, period)
  const upperArr = middleArr.map((v, i) => v + multiplier * stddevArr[i])
  const lowerArr = middleArr.map((v, i) => v - multiplier * stddevArr[i])

  const i = prices.length - 1
  const price = prices[i]
  const upper = upperArr[i]
  const middle = middleArr[i]
  const lower = lowerArr[i]

  let status = 'inside'
  if (price > upper) status = 'above'
  else if (price < lower) status = 'below'

  return { upper, middle, lower, status }
}

// Legacy alias to avoid breaking any callers that still use the old name.
export const calculateBollinger = calculateBollingerBands

/**
 * Composite signal score in [-2, +2] derived from MACD, RSI, and BB
 * computed off the supplied price series.
 * @param {number[]} prices - closing prices
 * @returns {number}
 */
export function getSignalScore(prices) {
  if (!Array.isArray(prices) || prices.length === 0) return 0

  const macd = calculateMACD(prices)
  const rsi = calculateRSI(prices)
  const bb = calculateBollingerBands(prices)

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

/**
 * Legacy composite-signal helper — kept for any callers that pass in
 * pre-computed indicator results. Prefer getSignalScore(prices) instead.
 */
export function calculateCompositeSignal(macd, rsi, bb) {
  let score = 0
  const signals = []

  const macdTrend = macd && macd.trend
  if (macdTrend === 'bullish') {
    score += 1
    signals.push({ indicator: 'MACD', signal: 'buy', description: '金叉' })
  } else if (macdTrend === 'bearish') {
    score -= 1
    signals.push({ indicator: 'MACD', signal: 'sell', description: '死叉' })
  } else {
    signals.push({ indicator: 'MACD', signal: 'neutral', description: '中性' })
  }

  const rsiStatus = rsi && rsi.status
  if (rsiStatus === 'oversold') {
    score += 1
    signals.push({ indicator: 'RSI', signal: 'buy', description: '超卖' })
  } else if (rsiStatus === 'overbought') {
    score -= 1
    signals.push({ indicator: 'RSI', signal: 'sell', description: '超买' })
  } else {
    signals.push({ indicator: 'RSI', signal: 'neutral', description: '中性' })
  }

  const bbStatus = bb && bb.status
  if (bbStatus === 'below') {
    score += 1
    signals.push({ indicator: '布林带', signal: 'buy', description: '触及下轨' })
  } else if (bbStatus === 'above') {
    score -= 1
    signals.push({ indicator: '布林带', signal: 'sell', description: '触及上轨' })
  } else {
    signals.push({ indicator: '布林带', signal: 'neutral', description: '中性' })
  }

  if (score > 2) score = 2
  if (score < -2) score = -2

  let level = 'neutral'
  if (score >= 1) level = 'buy'
  else if (score <= -1) level = 'sell'

  return { score, level, signals }
}
