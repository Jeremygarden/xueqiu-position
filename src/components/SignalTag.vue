<template>
  <view class="signal-tag" :class="['tag-' + type, statusClass]">
    <text class="tag-label">{{ typeLabel }}</text>
    <text class="tag-status">{{ statusLabel }}</text>
    <text v-if="hasValue" class="tag-value">{{ formattedValue }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'macd' },   // 'macd' | 'rsi' | 'bb'
  status: { type: String, default: 'neutral' },
  value: { type: [Number, String], default: '' }
})

const TYPE_LABEL = { macd: 'MACD', rsi: 'RSI', bb: 'BB' }
const typeLabel = computed(() => TYPE_LABEL[props.type] || props.type.toUpperCase())

const STATUS_LABEL = {
  // MACD trends
  bullish: '看多',
  bearish: '看空',
  // RSI
  overbought: '超买',
  oversold: '超卖',
  // BB
  above: '破上轨',
  below: '破下轨',
  inside: '区间内',
  // common
  neutral: '中性'
}
const statusLabel = computed(() => STATUS_LABEL[props.status] || '中性')

const statusClass = computed(() => {
  if (['bullish', 'oversold', 'below'].includes(props.status)) return 'is-buy'
  if (['bearish', 'overbought', 'above'].includes(props.status)) return 'is-sell'
  return 'is-neutral'
})

const hasValue = computed(() => {
  if (props.value === '' || props.value == null) return false
  const v = Number(props.value)
  return Number.isFinite(v)
})

const formattedValue = computed(() => {
  const v = Number(props.value)
  if (!Number.isFinite(v)) return ''
  if (props.type === 'rsi') return v.toFixed(1)
  if (props.type === 'bb') return (v * 100).toFixed(1) + '%'
  return v.toFixed(3)
})
</script>

<style lang="scss" scoped>
.signal-tag {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 4rpx $space-sm;
  border-radius: $radius-pill;
  font-size: $font-xs;
  border: 1rpx solid transparent;
}
.tag-label { font-weight: 600; }
.tag-status { font-weight: 500; }
.tag-value { opacity: 0.7; font-size: 20rpx; }
.is-buy {
  background: rgba(231, 76, 60, 0.1);
  color: $color-up;
  border-color: rgba(231, 76, 60, 0.3);
}
.is-sell {
  background: rgba(46, 204, 113, 0.1);
  color: $color-down;
  border-color: rgba(46, 204, 113, 0.3);
}
.is-neutral {
  background: $bg-tag;
  color: $text-secondary;
  border-color: $border-light;
}
</style>
