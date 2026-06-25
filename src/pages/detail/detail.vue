<template>
  <view class="page-detail">
    <view v-if="loading" class="loading-state">
      <u-loading-icon size="40"></u-loading-icon>
    </view>

    <template v-if="!loading && position">
      <view class="card price-card">
        <view class="flex-between">
          <view>
            <text class="pos-name">{{ position.name }}</text>
            <text class="pos-code">{{ position.code }}</text>
          </view>
          <view class="price-section">
            <text :class="['price-big', (position.change || 0) >= 0 ? 'text-buy' : 'text-sell']">
              {{ formatMoney(position.currentPrice) }}
            </text>
            <text :class="['price-change', (position.change || 0) >= 0 ? 'text-buy' : 'text-sell']">
              {{ position.change >= 0 ? '+' : '' }}{{ formatMoney(position.change, 3) }}
              {{ position.percent >= 0 ? '+' : '' }}{{ formatMoney(position.percent, 2) }}%
            </text>
          </view>
        </view>
      </view>

      <view class="card detail-grid">
        <view class="grid-row">
          <view class="grid-item">
            <text class="grid-label">持仓成本</text>
            <text class="grid-value">{{ formatMoney(position.costPrice) }}</text>
          </view>
          <view class="grid-item">
            <text class="grid-label">持仓数量</text>
            <text class="grid-value">{{ position.shares }}</text>
          </view>
          <view class="grid-item">
            <text class="grid-label">市值</text>
            <text class="grid-value">{{ formatMoney(position.marketValue) }}</text>
          </view>
          <view class="grid-item">
            <text class="grid-label">成本价</text>
            <text class="grid-value">{{ formatMoney(position.costPrice) }}</text>
          </view>
        </view>
        <view class="grid-row">
          <view class="grid-item">
            <text class="grid-label">盈亏</text>
            <text :class="['grid-value', (position.profit || 0) >= 0 ? 'text-buy' : 'text-sell']">
              {{ position.profit >= 0 ? '+' : '' }}{{ formatMoney(position.profit) }}
            </text>
          </view>
          <view class="grid-item">
            <text class="grid-label">收益率</text>
            <text :class="['grid-value', (position.profitPercent || 0) >= 0 ? 'text-buy' : 'text-sell']">
              {{ position.profitPercent >= 0 ? '+' : '' }}{{ formatMoney(position.profitPercent, 1) }}%
            </text>
          </view>
          <view class="grid-item">
            <text class="grid-label">买入日期</text>
            <text class="grid-value">{{ position.buyDate || '--' }}</text>
          </view>
          <view class="grid-item">
            <text class="grid-label">类型</text>
            <text class="grid-value">{{ detectType(position.code) }}</text>
          </view>
        </view>
      </view>

      <view class="card signal-card" v-if="compositeSignal">
        <view class="section-title">技术信号</view>
        <view class="signal-overview flex-center">
          <text :class="['signal-score', `score-${compositeSignal.level}`]">
            {{ compositeSignal.score >= 0 ? '+' : '' }}{{ compositeSignal.score }}
          </text>
          <text :class="['signal-label', `score-${compositeSignal.level}`]">
            {{ compositeSignal.level === 'buy' ? '偏买入' : compositeSignal.level === 'sell' ? '偏卖出' : '中性' }}
          </text>
        </view>
        <view class="signal-details">
          <view v-for="sig in compositeSignal.signals" :key="sig.indicator" class="signal-row flex-between">
            <text class="signal-name">{{ sig.indicator }}</text>
            <text :class="['signal-status', sig.signal === 'buy' ? 'text-buy' : sig.signal === 'sell' ? 'text-sell' : 'text-neutral']">
              {{ sig.description }}
            </text>
          </view>
        </view>
      </view>

      <view class="card kline-card" v-if="klineData.length > 0">
        <view class="section-title">走势图</view>
        <view class="kline-tabs flex-row">
          <text v-for="tab in periodTabs" :key="tab.key" :class="['kline-tab', currentPeriod === tab.key ? 'active' : '']" @click="switchPeriod(tab.key)">
            {{ tab.label }}
          </text>
        </view>
        <view class="chart-container">
          <canvas canvas-id="klineCanvas" class="chart-canvas"></canvas>
        </view>
      </view>

      <view class="rsi-section" v-if="rsiData && rsiData.rsi.length > 0">
        <view class="section-title">RSI ({{ formatMoney(rsiData.rsi[rsiData.rsi.length - 1], 1) }})</view>
        <view class="rsi-bar">
          <view class="rsi-fill" :style="{ width: Math.min(100, (rsiData.rsi[rsiData.rsi.length - 1] || 50)) + '%' }" :class="rsiData.signal === 'overbought' ? 'rsi-high' : rsiData.signal === 'oversold' ? 'rsi-low' : 'rsi-normal'"></view>
        </view>
      </view>

      <PostList :posts="communityPosts" />
    </template>

    <view v-if="!loading && !position" class="error-state">
      <text>未找到持仓信息</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { usePortfolioStore } from '@/stores/portfolio'
import { fetchQuote, fetchKline, fetchFundNav, fetchTimeline } from '@/api/xueqiu'
import { calculateMACD, calculateRSI, calculateBollinger, calculateCompositeSignal } from '@/utils/indicators'
import { formatMoney, detectType } from '@/utils/helpers'
import PostList from '@/components/PostList.vue'

const store = usePortfolioStore()
const position = ref(null)
const positionId = ref('')
const loading = ref(true)
const klineData = ref([])
const communityPosts = ref([])
const currentPeriod = ref('day')
const rsiData = ref(null)

const periodTabs = [
  { key: 'day', label: '日K' },
  { key: 'week', label: '周K' },
  { key: 'month', label: '月K' }
]

onLoad(async (query) => {
  if (query.id) {
    positionId.value = query.id
    store.loadPositions()
    const pos = store.enrichedPositions.find(p => p.id === query.id)
    if (pos) {
      position.value = pos
      await loadData()
    }
  }
  loading.value = false
})

async function loadData() {
  if (!position.value) return

  const symbol = position.value.symbol

  try {
    const quote = await fetchQuote(symbol)
    if (quote) {
      position.value.currentPrice = quote.current
      position.value.change = quote.change
      position.value.percent = quote.percent
      position.value.high = quote.high
      position.value.low = quote.low
      position.value.open = quote.open
      position.value.lastClose = quote.lastClose
    }

    const isFund = detectType(position.value.code) === '基金'
    if (isFund) {
      const navData = await fetchFundNav(symbol, 60)
      klineData.value = navData
    } else {
      const klines = await fetchKline(symbol, 60, currentPeriod.value)
      klineData.value = klines
      calculateIndicators(klines.map(k => k.close))
    }

    const posts = await fetchTimeline(symbol)
    communityPosts.value = posts
  } catch (err) {
    console.error('Failed to load detail data:', err)
  }
}

function calculateIndicators(closes) {
  if (closes.length < 30) return
  const macd = calculateMACD(closes)
  const rsi = calculateRSI(closes)
  const bollinger = calculateBollinger(closes)
  rsiData.value = rsi
  compositeSignal.value = calculateCompositeSignal(macd, rsi, bollinger)
  macdData.value = macd
  bollingerData.value = bollinger
}

const macdData = ref(null)
const bollingerData = ref(null)
const compositeSignal = ref(null)

async function switchPeriod(period) {
  currentPeriod.value = period
  loading.value = true
  try {
    const isFund = detectType(position.value.code) === '基金'
    if (!isFund) {
      const klines = await fetchKline(position.value.symbol, 60, period)
      klineData.value = klines
      calculateIndicators(klines.map(k => k.close))
    }
  } catch (err) {
    console.error(err)
  }
  loading.value = false
}
</script>

<style lang="scss" scoped>
.page-detail {
  padding-bottom: 40rpx;
}

.loading-state, .error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: $app-text-secondary;
}

.price-card {
  margin-bottom: 0;
}

.pos-name {
  font-size: 36rpx;
  font-weight: 600;
}

.pos-code {
  font-size: 26rpx;
  color: $app-text-secondary;
  margin-left: 12rpx;
}

.price-section {
  text-align: right;
}

.price-big {
  font-size: 48rpx;
  font-weight: 700;
}

.price-change {
  font-size: 26rpx;
}

.detail-grid {
  margin-top: 0;
}

.grid-row {
  display: flex;
  margin-bottom: 16rpx;
}

.grid-row:last-child {
  margin-bottom: 0;
}

.grid-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.grid-label {
  font-size: 22rpx;
  color: $app-text-secondary;
  margin-bottom: 4rpx;
}

.grid-value {
  font-size: 28rpx;
  font-weight: 500;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.signal-card {
  margin-top: 16rpx;
}

.signal-overview {
  flex-direction: column;
  margin-bottom: 20rpx;
}

.signal-score {
  font-size: 60rpx;
  font-weight: 700;
}

.signal-label {
  font-size: 28rpx;
  margin-top: 8rpx;
}

.score-buy { color: $app-buy-color; }
.score-sell { color: $app-sell-color; }
.score-neutral { color: $app-neutral-color; }

.signal-details {
  border-top: 1rpx solid $app-border-color;
  padding-top: 12rpx;
}

.signal-row {
  padding: 8rpx 0;
}

.signal-name {
  font-size: 26rpx;
  color: $app-text-regular;
}

.signal-status {
  font-size: 26rpx;
  font-weight: 500;
}

.kline-card {
  margin-top: 16rpx;
}

.kline-tabs {
  margin-bottom: 16rpx;
}

.kline-tab {
  padding: 6rpx 20rpx;
  font-size: 24rpx;
  margin-right: 12rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
  color: $app-text-regular;
}

.kline-tab.active {
  background: $app-color-primary;
  color: #fff;
}

.chart-container {
  height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.rsi-section {
  background: $app-card-bg;
  border-radius: 12rpx;
  padding: 20rpx;
  margin: 16rpx;
}

.rsi-bar {
  height: 20rpx;
  background: #f0f0f0;
  border-radius: 10rpx;
  overflow: hidden;
}

.rsi-fill {
  height: 100%;
  border-radius: 10rpx;
  transition: width 0.3s;
}

.rsi-high { background: $app-sell-color; }
.rsi-low { background: $app-buy-color; }
.rsi-normal { background: $app-color-primary; }
</style>
