<template>
  <view class="page">
    <view class="card hero">
      <text class="title">📰 行情速览</text>
      <text class="sub">常见指数与热门股票实时报价</text>
    </view>

    <view v-for="group in groups" :key="group.label" class="card">
      <view class="group-title">{{ group.label }}</view>
      <view v-if="loading && !group._loaded" class="status"><text>加载中…</text></view>
      <view v-else-if="!group.items.length" class="status"><text>暂无数据</text></view>
      <view v-else>
        <view
          v-for="q in group.items"
          :key="q.symbol"
          class="quote-row"
          @click="goDetail(q.symbol)"
        >
          <view class="cell name">
            <text class="qn">{{ q.name }}</text>
            <text class="qs">{{ q.symbol }}</text>
          </view>
          <view class="cell price">
            <text class="cur">{{ fmtPrice(q.current) }}</text>
          </view>
          <view class="cell percent" :class="cls(q.percent)">
            <text>{{ fmtPercent(q.percent) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { fetchBatchQuote } from '@/api/xueqiu.js'
import { formatPrice, formatPercent } from '@/utils/helpers.js'

const groups = reactive([
  { label: '🇨🇳 A股指数', symbols: ['SH000001', 'SZ399001', 'SZ399006'], items: [], _loaded: false },
  { label: '🔥 A股热门', symbols: ['SH600519', 'SH601318', 'SZ000858', 'SZ300750'], items: [], _loaded: false },
  { label: '🇭🇰 港股', symbols: ['HK00700', 'HK09988', 'HK03690'], items: [], _loaded: false },
  { label: '🇺🇸 美股', symbols: ['AAPL', 'MSFT', 'NVDA', 'TSLA'], items: [], _loaded: false }
])
const loading = ref(false)

async function reload() {
  loading.value = true
  try {
    await Promise.all(groups.map(async (g) => {
      const list = await fetchBatchQuote(g.symbols)
      g.items = list
      g._loaded = true
    }))
  } finally {
    loading.value = false
  }
}

function goDetail(symbol) {
  uni.navigateTo({ url: `/pages/detail/detail?symbol=${encodeURIComponent(symbol)}` })
}

const fmtPrice = (n) => formatPrice(n)
const fmtPercent = (n) => formatPercent(n)
const cls = (n) => {
  const v = Number(n)
  if (!Number.isFinite(v) || v === 0) return 'text-flat'
  return v > 0 ? 'text-up' : 'text-down'
}

onMounted(reload)
defineOptions({
  onPullDownRefresh() {
    reload().finally(() => uni.stopPullDownRefresh())
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
.hero { background: linear-gradient(135deg, #1989fa 0%, #1166c9 100%); color: #fff; }
.title { font-size: $font-lg; font-weight: 700; display: block; }
.sub { font-size: $font-sm; opacity: 0.9; margin-top: $space-xs; display: block; }
.group-title {
  font-size: $font-md;
  font-weight: 600;
  margin-bottom: $space-sm;
  color: $text-primary;
}
.status { padding: $space-md; text-align: center; color: $text-placeholder; font-size: $font-sm; }
.quote-row {
  display: flex;
  align-items: center;
  padding: $space-sm 0;
  border-bottom: 1rpx solid $border-light;
}
.quote-row:last-child { border-bottom: none; }
.cell { display: flex; flex-direction: column; flex: 1; }
.name { flex: 1.2; }
.qn { font-weight: 500; color: $text-primary; }
.qs { font-size: $font-xs; color: $text-secondary; margin-top: 2rpx; }
.price { align-items: center; }
.cur { font-weight: 600; }
.percent { align-items: flex-end; font-weight: 600; }
.text-up { color: $color-up; }
.text-down { color: $color-down; }
.text-flat { color: $color-flat; }
</style>
