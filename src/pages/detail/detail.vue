<template>
  <view class="page">
    <view v-if="!position && !quote" class="status">
      <text>加载中…</text>
    </view>

    <template v-else>
      <!-- Header -->
      <view class="card header">
        <view class="row top">
          <view>
            <text class="name">{{ displayName }}</text>
            <text class="sub">{{ displaySymbol }} · {{ market }}</text>
          </view>
          <view class="price-block" :class="cls(currentPercent)">
            <text class="current">{{ fmtPrice(currentPrice) }}</text>
            <text class="percent">{{ fmtPercent(currentPercent) }}</text>
          </view>
        </view>
        <view v-if="position" class="row stats">
          <view class="stat"><text class="lbl">成本</text><text class="val">{{ fmtPrice(position.costPrice) }}</text></view>
          <view class="stat"><text class="lbl">市值</text><text class="val">{{ fmtPrice(marketValue) }}</text></view>
          <view class="stat" :class="cls(position.profit)">
            <text class="lbl">盈亏</text>
            <text class="val">{{ fmtSigned(position.profit) }}</text>
          </view>
          <view class="stat" :class="cls(position.profitRate)">
            <text class="lbl">收益率</text>
            <text class="val">{{ fmtPercent(position.profitRate) }}</text>
          </view>
        </view>
      </view>

      <!-- Signal card -->
      <view class="card signal-card">
        <view class="row title-row">
          <text class="title">📊 技术分析</text>
          <view v-if="signalLabel" class="label-pill" :style="{ background: signalLabel.color }">
            <text>{{ signalLabel.text }}</text>
          </view>
        </view>

        <view v-if="!signals" class="status">
          <text>正在计算…</text>
        </view>
        <template v-else>
          <view class="signal-row">
            <text class="signal-name">MACD</text>
            <text class="signal-val">{{ signals.macd.macd.toFixed(3) }}</text>
            <text class="signal-status" :class="trendCls(signals.macd.trend)">
              {{ macdLabel }}
            </text>
          </view>
          <view class="signal-row">
            <text class="signal-name">RSI(14)</text>
            <text class="signal-val">{{ signals.rsi.value }}</text>
            <text class="signal-status" :class="rsiCls">{{ rsiLabel }}</text>
          </view>
          <view class="signal-row">
            <text class="signal-name">布林带</text>
            <text class="signal-val">带宽 {{ (signals.bb.bandwidth * 100).toFixed(2) }}%</text>
            <text class="signal-status" :class="bbCls">{{ bbLabel }}</text>
          </view>

          <view class="score-block">
            <text class="score-lbl">综合评分 {{ signals.score }}</text>
            <view class="bar">
              <view class="bar-fill" :style="scoreBarStyle"></view>
              <view class="bar-zero"></view>
            </view>
          </view>
        </template>
      </view>

      <!-- Community -->
      <view class="card">
        <view class="row title-row">
          <text class="title">💬 雪球社区</text>
        </view>
        <PostList :posts="posts" :loading="postsLoading" @post-click="openPost" />
      </view>

      <view class="actions">
        <button class="btn" @click="reload">刷新数据</button>
        <button v-if="position" class="btn btn-danger" @click="confirmRemove">删除持仓</button>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PostList from '@/components/PostList.vue'
import { usePortfolioStore } from '@/stores/portfolio.js'
import { fetchQuote, fetchTimeline, fetchKline } from '@/api/xueqiu.js'
import {
  calculateMACD, calculateRSI, calculateBollingerBands,
  getSignalScore, getSignalLabel
} from '@/utils/indicators.js'
import {
  formatPrice, formatPercent, symbolToDisplayCode, getMarketFromSymbol
} from '@/utils/helpers.js'

const store = usePortfolioStore()

const symbol = ref('')
const quote = ref(null)
const signals = ref(null)
const posts = ref([])
const postsLoading = ref(false)

const position = computed(() => store.positions.find((p) => p.symbol === symbol.value) || null)
const displayName = computed(() => (position.value && position.value.name) || (quote.value && quote.value.name) || symbol.value)
const displaySymbol = computed(() => symbolToDisplayCode(symbol.value))
const market = computed(() => (position.value && position.value.market) || (quote.value && quote.value.market) || getMarketFromSymbol(symbol.value))
const currentPrice = computed(() => (quote.value && quote.value.current) ?? (position.value && position.value.currentPrice))
const currentPercent = computed(() => (quote.value && quote.value.percent) ?? (position.value && position.value.percent))
const marketValue = computed(() => {
  if (!position.value) return 0
  const shares = Number(position.value.shares) || 0
  const price = Number(currentPrice.value ?? position.value.costPrice) || 0
  return shares * price
})

const signalLabel = computed(() => signals.value ? signals.value.label : null)
const macdLabel = computed(() => {
  if (!signals.value) return ''
  const t = signals.value.macd.crossover
  if (t === 'golden') return '金叉'
  if (t === 'death') return '死叉'
  return signals.value.macd.trend === 'bullish' ? '看多' : (signals.value.macd.trend === 'bearish' ? '看空' : '中性')
})
const rsiLabel = computed(() => {
  if (!signals.value) return ''
  const s = signals.value.rsi.status
  return s === 'overbought' ? '超买' : (s === 'oversold' ? '超卖' : '中性')
})
const rsiCls = computed(() => {
  if (!signals.value) return ''
  const s = signals.value.rsi.status
  return s === 'overbought' ? 'text-down' : (s === 'oversold' ? 'text-up' : 'text-flat')
})
const bbLabel = computed(() => {
  if (!signals.value) return ''
  const s = signals.value.bb.status
  return s === 'above' ? '破上轨' : (s === 'below' ? '破下轨' : '区间内')
})
const bbCls = computed(() => {
  if (!signals.value) return ''
  const s = signals.value.bb.status
  return s === 'above' ? 'text-down' : (s === 'below' ? 'text-up' : 'text-flat')
})

const scoreBarStyle = computed(() => {
  if (!signals.value) return ''
  // score range -2..+2, fill width from center to score; positive -> up, negative -> down
  const s = signals.value.score
  const pct = Math.min(100, Math.abs(s) * 25) // 1=25%, 2=50%
  const color = s > 0 ? '#e74c3c' : (s < 0 ? '#2ecc71' : '#909399')
  const align = s >= 0 ? 'left: 50%;' : `right: 50%;`
  return `${align} width: ${pct}%; background: ${color};`
})

function trendCls(t) {
  if (t === 'bullish') return 'text-up'
  if (t === 'bearish') return 'text-down'
  return 'text-flat'
}
function cls(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v === 0) return 'text-flat'
  return v > 0 ? 'text-up' : 'text-down'
}
const fmtPrice = (n) => formatPrice(n)
const fmtPercent = (n) => formatPercent(n)
const fmtSigned = (n) => {
  if (!Number.isFinite(Number(n))) return '--'
  const v = Number(n)
  return `${v > 0 ? '+' : ''}${formatPrice(v)}`
}

async function loadAll() {
  if (!symbol.value) return
  store.loadPositions()
  // run in parallel; UI shows skeleton until any data
  await Promise.allSettled([
    fetchQuote(symbol.value).then((q) => { if (q) quote.value = q }),
    loadSignals(),
    loadPosts()
  ])
}

async function loadSignals() {
  const { closes } = await fetchKline(symbol.value, 'day', 120)
  if (!closes || !closes.length) return
  const macd = calculateMACD(closes)
  const rsi = calculateRSI(closes)
  const bb = calculateBollingerBands(closes)
  const score = getSignalScore(closes)
  const label = getSignalLabel(score)
  signals.value = { macd, rsi, bb, score, label }
}

async function loadPosts() {
  postsLoading.value = true
  try {
    posts.value = await fetchTimeline(symbol.value, 10)
  } finally {
    postsLoading.value = false
  }
}

function reload() {
  signals.value = null
  posts.value = []
  loadAll()
}

function openPost(post) {
  if (!post || !post.url) return
  uni.navigateTo({
    url: `/pages/webview/webview?url=${encodeURIComponent(post.url)}`
  })
}

function confirmRemove() {
  if (!position.value) return
  uni.showModal({
    title: '删除持仓',
    content: `确认删除 ${position.value.name || symbol.value}?`,
    success(res) {
      if (res.confirm) {
        store.removePosition(symbol.value)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 600)
      }
    }
  })
}

onMounted(() => { if (symbol.value) loadAll() })

defineOptions({
  onLoad(query) {
    symbol.value = String((query && query.symbol) || '').toUpperCase()
    if (symbol.value) loadAll()
  },
  onPullDownRefresh() {
    reload()
    uni.stopPullDownRefresh()
  }
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $bg-page; padding: $space-md; }
.card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $space-md;
  margin-bottom: $space-md;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.row { display: flex; align-items: center; }
.top { justify-content: space-between; }
.name { font-size: $font-lg; font-weight: 700; color: $text-primary; display: block; }
.sub { font-size: $font-sm; color: $text-secondary; display: block; margin-top: 4rpx; }
.price-block { display: flex; flex-direction: column; align-items: flex-end; }
.current { font-size: 48rpx; font-weight: 700; }
.percent { font-size: $font-sm; margin-top: 4rpx; }
.stats { margin-top: $space-md; justify-content: space-between; }
.stat { display: flex; flex-direction: column; align-items: center; flex: 1; }
.lbl { font-size: $font-xs; color: $text-secondary; }
.val { font-size: $font-md; font-weight: 600; margin-top: 4rpx; }

.title-row { justify-content: space-between; margin-bottom: $space-md; }
.title { font-size: $font-md; font-weight: 600; color: $text-primary; }
.label-pill {
  padding: 4rpx $space-md;
  border-radius: $radius-pill;
  color: #fff;
  font-size: $font-xs;
}

.signal-card { padding: $space-md; }
.signal-row {
  display: flex;
  align-items: center;
  padding: $space-sm 0;
  border-bottom: 1rpx solid $border-light;
}
.signal-row:last-of-type { border-bottom: none; }
.signal-name { flex: 1; font-weight: 500; color: $text-primary; }
.signal-val { flex: 1; text-align: center; color: $text-secondary; font-size: $font-sm; }
.signal-status { flex: 1; text-align: right; font-weight: 600; font-size: $font-sm; }
.score-block { margin-top: $space-md; }
.score-lbl { display: block; font-size: $font-sm; color: $text-secondary; margin-bottom: $space-sm; }
.bar {
  position: relative;
  height: 12rpx;
  border-radius: 6rpx;
  background: $bg-tag;
  overflow: visible;
}
.bar-fill {
  position: absolute;
  top: 0; bottom: 0;
  border-radius: 6rpx;
}
.bar-zero {
  position: absolute;
  top: -6rpx; bottom: -6rpx;
  left: 50%;
  width: 2rpx;
  background: $border-base;
}

.actions {
  display: flex;
  gap: $space-md;
  margin-top: $space-lg;
}
.btn {
  flex: 1;
  background: $primary;
  color: #fff;
  border-radius: $radius-md;
}
.btn-danger { background: $color-down; }
.status { text-align: center; padding: $space-xl; color: $text-placeholder; }

.text-up { color: $color-up; }
.text-down { color: $color-down; }
.text-flat { color: $color-flat; }
</style>
