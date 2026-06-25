/**
 * src/api/request.js — Xueqiu HTTP helper (round 16)
 *
 * - Wraps uni.request in a Promise (works in mp-weixin, h5, app).
 * - Auto-injects xq_a_token cookie when configured via utils/storage.js.
 * - Distinguishes network / API / auth errors via XueqiuError.code.
 * - In-flight request deduplication: identical (url + method + serialized
 *   params) requests within the same tick collapse to a single network call.
 *
 * Public:
 *   request({ url, method='GET', data, header, baseUrl, timeout })
 *     → Promise<any>  (resolves to the upstream JSON `data` field)
 *   ENDPOINTS — shorthand base-URL constants.
 *   XueqiuError — Error subclass with .code: 'network'|'api'|'auth'|'unknown'
 *
 * The whole module is safe to import in Node (vitest) because it falls back
 * to `globalThis.uni` and short-circuits when uni is missing.
 */

import { getToken } from '@/utils/storage.js'

export const ENDPOINTS = {
  STOCK: 'https://stock.xueqiu.com',
  FUND: 'https://danjuan.xueqiu.com',
  XUEQIU: 'https://xueqiu.com'
}

const DEFAULT_TIMEOUT = 12000
const DEFAULT_BASE = ENDPOINTS.STOCK

export class XueqiuError extends Error {
  constructor(message, code = 'unknown', extra = {}) {
    super(message)
    this.name = 'XueqiuError'
    this.code = code  // 'network' | 'api' | 'auth' | 'unknown'
    this.statusCode = extra.statusCode
    this.data = extra.data
  }
}

// ---------- in-flight dedupe ----------------------------------------------
const _inFlight = new Map()

function _dedupeKey(method, url, data) {
  let serialized = ''
  if (data) {
    try { serialized = JSON.stringify(data) } catch (_) { serialized = String(data) }
  }
  return `${method}|${url}|${serialized}`
}

// ---------- URL helpers ---------------------------------------------------
function _resolveUrl(baseUrl, url) {
  if (!url) return baseUrl || ''
  if (/^https?:\/\//i.test(url)) return url
  const base = (baseUrl || DEFAULT_BASE).replace(/\/$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  return base + path
}

function _buildHeader(custom) {
  const token = getToken()
  const cookie = token ? `xq_a_token=${token};u=${Date.now()}` : ''
  return {
    'Content-Type': 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 XueqiuMini/2.0',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://xueqiu.com/',
    ...(cookie ? { Cookie: cookie } : {}),
    ...(custom || {})
  }
}

// ---------- core ----------------------------------------------------------
function _doRequest(options) {
  const uniRef = typeof uni !== 'undefined' ? uni : (typeof globalThis !== 'undefined' ? globalThis.uni : null)
  if (!uniRef || typeof uniRef.request !== 'function') {
    return Promise.reject(new XueqiuError('uni.request not available', 'network'))
  }
  return new Promise((resolve, reject) => {
    uniRef.request({
      url: options.url,
      method: options.method,
      data: options.data,
      header: options.header,
      timeout: options.timeout,
      success(res) {
        const code = res.statusCode
        if (code === 401 || code === 403) {
          reject(new XueqiuError(
            'xq_a_token 已失效，请在「设置」页重新粘贴 cookie',
            'auth',
            { statusCode: code, data: res.data }
          ))
          return
        }
        if (code < 200 || code >= 300) {
          reject(new XueqiuError(
            `HTTP ${code}`,
            'network',
            { statusCode: code, data: res.data }
          ))
          return
        }
        // Xueqiu wraps payload in { data, error_code, error_description }
        const body = res.data
        if (body && typeof body === 'object' && 'error_code' in body && body.error_code !== 0 && body.error_code != null) {
          reject(new XueqiuError(
            body.error_description || body.error_msg || 'Xueqiu API error',
            'api',
            { statusCode: code, data: body }
          ))
          return
        }
        resolve(body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body)
      },
      fail(err) {
        reject(new XueqiuError(
          (err && (err.errMsg || err.message)) || 'Network error',
          'network',
          { data: err }
        ))
      }
    })
  })
}

export function request(opts) {
  const method = (opts && opts.method ? opts.method : 'GET').toUpperCase()
  const url = _resolveUrl(opts && opts.baseUrl, opts && opts.url)
  const data = opts ? opts.data : undefined
  const header = _buildHeader(opts && opts.header)
  const timeout = (opts && opts.timeout) || DEFAULT_TIMEOUT

  const key = _dedupeKey(method, url, data)
  if (_inFlight.has(key)) return _inFlight.get(key)

  const p = _doRequest({ url, method, data, header, timeout }).finally(() => {
    _inFlight.delete(key)
  })
  _inFlight.set(key, p)
  return p
}

export default request
