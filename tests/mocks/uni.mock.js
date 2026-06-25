/**
 * tests/mocks/uni.mock.js
 * Global uni-app API shim injected as a vitest setupFile.
 * Every test file gets these stubs automatically.
 */

import { vi } from 'vitest'

// ──────────────────────────────────────────────────────────────────────────────
// In-memory storage backing (shared across all storage calls in one test run)
// ──────────────────────────────────────────────────────────────────────────────
const _store = {}

function _reset() {
  for (const k of Object.keys(_store)) delete _store[k]
}

// ──────────────────────────────────────────────────────────────────────────────
// uni global stub
// ──────────────────────────────────────────────────────────────────────────────
globalThis.uni = {
  // Storage
  getStorageSync: vi.fn((key) => _store[key] ?? ''),
  setStorageSync: vi.fn((key, val) => { _store[key] = val }),
  removeStorageSync: vi.fn((key) => { delete _store[key] }),
  clearStorageSync: vi.fn(() => _reset()),

  // Network
  request: vi.fn(({ success, fail } = {}) => {
    // Default: timeout/fail. Individual tests override with vi.fn().mockImplementation
    if (fail) fail({ errMsg: 'request:fail timeout' })
  }),

  // Navigation
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  switchTab: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),

  // UI
  showToast: vi.fn(),
  hideToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showModal: vi.fn(({ success } = {}) => {
    if (success) success({ confirm: true })
  }),
  showActionSheet: vi.fn(),

  // System
  getSystemInfoSync: vi.fn(() => ({
    platform: 'mp-weixin',
    windowWidth: 375,
    windowHeight: 667,
    statusBarHeight: 44,
    pixelRatio: 2,
    SDKVersion: '2.30.0'
  })),
  getSystemInfo: vi.fn(({ success } = {}) => {
    if (success) success({ platform: 'mp-weixin', windowWidth: 375 })
  }),

  // Misc
  setNavigationBarTitle: vi.fn(),
  setNavigationBarColor: vi.fn(),
  startPullDownRefresh: vi.fn(),
  stopPullDownRefresh: vi.fn(),
  pageScrollTo: vi.fn(),
  createSelectorQuery: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    boundingClientRect: vi.fn().mockReturnThis(),
    exec: vi.fn()
  })),
  getNetworkType: vi.fn(({ success } = {}) => {
    if (success) success({ networkType: 'wifi' })
  }),
  onNetworkStatusChange: vi.fn(),
  makePhoneCall: vi.fn(),
  setClipboardData: vi.fn(),
  getClipboardData: vi.fn(),
  openDocument: vi.fn(),
  previewImage: vi.fn(),
  chooseImage: vi.fn(),
  uploadFile: vi.fn(),

  // Web-view
  webViewObject: {},

  // ─── helper for tests ────────────────────────────────────────────────────
  _reset,
  _store
}
