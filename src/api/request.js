const BASE_URL = 'https://stock.xueqiu.com'
const FUND_BASE_URL = 'https://fund.xueqiu.com'

let loadingCount = 0

function showLoading() {
  if (loadingCount === 0) {
    uni.showLoading({ title: '加载中...', mask: true })
  }
  loadingCount++
}

function hideLoading() {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    uni.hideLoading()
  }
}

function getToken() {
  try {
    const token = uni.getStorageSync('xq_a_token')
    return token || ''
  } catch {
    return ''
  }
}

function request(options) {
  const { url, method = 'GET', data = {}, params = {}, showLoad = false, baseURL = BASE_URL } = options

  if (showLoad) showLoading()

  const token = getToken()

  return new Promise((resolve, reject) => {
    uni.request({
      url: baseURL + url,
      method,
      data: method === 'GET' ? params : data,
      header: {
        'Cookie': token ? `xq_a_token=${token}` : '',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://xueqiu.com/',
        'X-Requested-With': 'XMLHttpRequest'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          uni.showToast({ title: '认证失败，请检查 xq_a_token', icon: 'none' })
          reject(new Error('Authentication failed'))
        } else {
          uni.showToast({ title: `请求失败: ${res.statusCode}`, icon: 'none' })
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      },
      complete: () => {
        if (showLoad) hideLoading()
      }
    })
  })
}

export function get(url, params, options = {}) {
  return request({ ...options, url, method: 'GET', params })
}

export function post(url, data, options = {}) {
  return request({ ...options, url, method: 'POST', data })
}

export { BASE_URL, FUND_BASE_URL }
