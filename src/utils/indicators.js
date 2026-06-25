/**
 * Technical Analysis Indicators
 * Pure functions for computing MACD, RSI, and Bollinger Bands
 */

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

/**
 * Calculate MACD indicator
 * @param {number[]} closes - Array of closing prices
 * @param {number} fastPeriod - Fast EMA period (default 12)
 * @param {number} slowPeriod - Slow EMA period (default 26)
 * @param {number} signalPeriod - Signal line period (default 9)
 * @returns {Object} { macd, signal, histogram, signal_buy, signal_sell }
 *   signal_buy: true when MACD crosses above signal (golden cross)
 *   signal_sell: true when MACD crosses below signal (death cross)
 */
export function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (closes.length < slowPeriod + signalPeriod) {
    return { macd: [], signal: [], histogram: [], signal_buy: false, signal_sell: false }
  }

  const emaFast = EMA(closes, fastPeriod)
  const emaSlow = EMA(closes, slowPeriod)

  const dif = emaFast.map((v, i) => v - emaSlow[i])
  const dea = EMA(dif, signalPeriod)
  const histogram = dif.map((v, i) => 2 * (v - (dea[i] || 0)))

  const lastIndex = histogram.length - 1
  const prevIndex = histogram.length - 2

  const signalBuy = prevIndex >= 0 && histogram[prevIndex] < 0 && histogram[lastIndex] >= 0
  const signalSell = prevIndex >= 0 && histogram[prevIndex] > 0 && histogram[lastIndex] <= 0

  return {
    macd: dif,
    signal: dea,
    histogram,
    signal_buy: signalBuy,
    signal_sell: signalSell
  }
}

/**
 * Calculate RSI indicator
 * @param {number[]} closes - Array of closing prices
 * @param {number} period - RSI period (default 14)
 * @returns {Object} { rsi, signal } 
 *   rsi: array of RSI values
 *   signal: 'overbought' (>70), 'oversold' (<30), or 'normal'
 */
export function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) {
    return { rsi: [], signal: 'normal' }
  }

  const gains = []
  const losses = []
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  const rsiValues = [avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)]

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    rsiValues.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs))
  }

  const latestRSI = rsiValues[rsiValues.length - 1]
  let signal = 'normal'
  if (latestRSI > 70) signal = 'overbought'
  else if (latestRSI < 30) signal = 'oversold'

  return { rsi: rsiValues, signal }
}

/**
 * Calculate Bollinger Bands
 * @param {number[]} closes - Array of closing prices
 * @param {number} period - Moving average period (default 20)
 * @param {number} multiplier - Standard deviation multiplier (default 2)
 * @returns {Object} { upper, middle, lower, bandwidth, signal }
 *   signal: 'upper_break' (price above upper), 'lower_break' (price below lower), 'normal'
 */
export function calculateBollinger(closes, period = 20, multiplier = 2) {
  if (closes.length < period) {
    return { upper: [], middle: [], lower: [], bandwidth: 0, signal: 'normal' }
  }

  const middle = SMA(closes, period)
  const stddev = STDDEV(closes, period)
  const upper = middle.map((v, i) => v + multiplier * stddev[i])
  const lower = middle.map((v, i) => v - multiplier * stddev[i])

  const lastIndex = closes.length - 1
  const latestClose = closes[lastIndex]
  const latestUpper = upper[lastIndex]
  const latestLower = lower[lastIndex]

  let signal = 'normal'
  if (latestClose >= latestUpper) signal = 'upper_break'
  else if (latestClose <= latestLower) signal = 'lower_break'

  const mid = middle[lastIndex] || 1
  const bandwidth = mid !== 0 ? ((latestUpper - latestLower) / mid) : 0

  return { upper, middle, lower, bandwidth, signal }
}

/**
 * Calculate composite signal score (-2 to +2)
 * Aggregates MACD, RSI, and Bollinger signals
 * @param {Object} macd - Result from calculateMACD
 * @param {Object} rsi - Result from calculateRSI
 * @param {Object} bollinger - Result from calculateBollinger
 * @returns {Object} { score, level, signals }
 *   score: -2 to +2
 *   level: 'buy' (>=1), 'sell' (<=-1), 'neutral'
 *   signals: detailed breakdown
 */
export function calculateCompositeSignal(macd, rsi, bollinger) {
  let score = 0
  const details = []

  if (macd.signal_buy) {
    score += 1
    details.push({ indicator: 'MACD', signal: 'buy', description: '金叉' })
  } else if (macd.signal_sell) {
    score -= 1
    details.push({ indicator: 'MACD', signal: 'sell', description: '死叉' })
  } else {
    details.push({ indicator: 'MACD', signal: 'neutral', description: '中性' })
  }

  if (rsi.signal === 'oversold') {
    score += 1
    details.push({ indicator: 'RSI', signal: 'buy', description: '超卖' })
  } else if (rsi.signal === 'overbought') {
    score -= 1
    details.push({ indicator: 'RSI', signal: 'sell', description: '超买' })
  } else {
    details.push({ indicator: 'RSI', signal: 'neutral', description: '中性' })
  }

  if (bollinger.signal === 'lower_break') {
    score += 1
    details.push({ indicator: '布林带', signal: 'buy', description: '触及下轨' })
  } else if (bollinger.signal === 'upper_break') {
    score -= 1
    details.push({ indicator: '布林带', signal: 'sell', description: '触及上轨' })
  } else {
    details.push({ indicator: '布林带', signal: 'neutral', description: '中性' })
  }

  score = Math.max(-2, Math.min(2, score))

  let level = 'neutral'
  if (score >= 1) level = 'buy'
  else if (score <= -1) level = 'sell'

  return { score, level, signals: details }
}
