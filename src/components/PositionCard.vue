<template>
  <view class="position-card" @click="$emit('click', position)">
    <view class="row main">
      <view class="cell name">
        <text class="title">{{ position.name || position.symbol }}</text>
        <text class="sub">{{ displayCode }} · {{ position.market || '—' }}</text>
      </view>
      <view class="cell price">
        <text class="current">{{ fmtPrice(position.currentPrice) }}</text>
        <text class="percent" :class="cls(position.percent)">{{ fmtPercent(position.percent) }}</text>
      </view>
      <view class="cell value">
        <text class="market-value">{{ fmtPrice(marketValue) }}</text>
        <text class="profit" :class="cls(position.profit)">
          {{ fmtSigned(position.profit) }} ({{ fmtPercent(position.profitRate) }})
        </text>
      </view>
    </view>
    <view v-if="hasSignals" class="row signals">
      <SignalTag type="macd"
        :status="position.signals.macd && position.signals.macd.trend"
        :value="position.signals.macd && position.signals.macd.histogram" />
      <SignalTag type="rsi"
        :status="position.signals.rsi && position.signals.rsi.status"
        :value="position.signals.rsi && position.signals.rsi.value" />
      <SignalTag type="bb"
        :status="position.signals.bb && position.signals.bb.status"
        :value="position.signals.bb && position.signals.bb.bandwidth" />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { formatPrice, formatPercent, symbolToDisplayCode } from '@/utils/helpers.js'
import SignalTag from './SignalTag.vue'

const props = defineProps({ position: { type: Object, default: () => ({}) } })
defineEmits(['click'])

const displayCode = computed(() => symbolToDisplayCode(props.position.symbol))
const marketValue = computed(() => {
  const shares = Number(props.position.shares) || 0
  const price = Number(props.position.currentPrice ?? props.position.costPrice) || 0
  return shares * price
})
const hasSignals = computed(() => !!(props.position && props.position.signals))

const fmtPrice = (n) => formatPrice(n)
const fmtPercent = (n) => formatPercent(n)
const fmtSigned = (n) => {
  if (!Number.isFinite(Number(n))) return '--'
  const v = Number(n)
  return `${v > 0 ? '+' : ''}${formatPrice(v)}`
}
const cls = (n) => {
  const v = Number(n)
  if (!Number.isFinite(v) || v === 0) return 'text-flat'
  return v > 0 ? 'text-up' : 'text-down'
}
</script>

<style lang="scss" scoped>
.position-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $space-md;
  margin: $space-sm $space-md;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}
.row { display: flex; align-items: center; }
.main { justify-content: space-between; }
.cell { display: flex; flex-direction: column; flex: 1; }
.name { flex: 1.2; }
.price { flex: 1; align-items: center; }
.value { flex: 1.2; align-items: flex-end; }
.title { font-size: $font-md; font-weight: 600; color: $text-primary; }
.sub { font-size: $font-xs; color: $text-secondary; margin-top: 4rpx; }
.current { font-size: $font-md; font-weight: 600; color: $text-primary; }
.percent { font-size: $font-sm; margin-top: 4rpx; }
.market-value { font-size: $font-md; font-weight: 600; color: $text-primary; }
.profit { font-size: $font-xs; margin-top: 4rpx; }
.signals { margin-top: $space-sm; gap: $space-xs; flex-wrap: wrap; }
.text-up { color: $color-up; }
.text-down { color: $color-down; }
.text-flat { color: $color-flat; }
</style>
