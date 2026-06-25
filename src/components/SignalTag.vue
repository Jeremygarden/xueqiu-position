<template>
  <view class="signal-tag">
    <text class="placeholder">SignalTag — round 9</text>
  </view>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'macd' },
  status: { type: String, default: 'neutral' },
  value: { type: [Number, String], default: '' }
})
</script>

<style lang="scss" scoped>
.signal-tag { padding: $space-xs $space-sm; }
.placeholder { color: $text-placeholder; }
</style>
