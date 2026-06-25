<template>
  <view v-if="signal" :class="['signal-tag', `signal-${signal.level}`]">
    <text class="signal-text">{{ signalText }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  signal: { type: Object, default: null }
})

const signalText = computed(() => {
  if (!props.signal) return ''
  if (props.signal.level === 'buy') return '买入'
  if (props.signal.level === 'sell') return '卖出'
  return '中性'
})
</script>

<style lang="scss" scoped>
.signal-tag {
  display: inline-flex;
  align-items: center;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  font-weight: 500;
}

.signal-buy {
  background: #f0f9eb;
  color: #5ac725;
  border: 1rpx solid #b7eb8f;
}

.signal-sell {
  background: #fef0f0;
  color: #f56c6c;
  border: 1rpx solid #fbc4c4;
}

.signal-neutral {
  background: #f4f4f5;
  color: #909399;
  border: 1rpx solid #dcdfe6;
}
</style>
