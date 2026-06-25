<template>
  <view class="page">
    <text class="title">📈 标的详情</text>
    <text class="hint">round 8 will build full detail view.</text>
    <text v-if="symbol" class="symbol">symbol={{ symbol }}</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'
const symbol = ref('')
// uni: receive query param via onLoad
defineExpose({})
const onLoad = (q) => { symbol.value = q?.symbol || '' }
// uni-app picks this up from setup-script via plugin
// eslint-disable-next-line no-undef
if (typeof getCurrentPages === 'function') { /* runtime */ }
defineOptions({
  onLoad
})
</script>

<style lang="scss" scoped>
.page { padding: $space-lg; }
.title { font-size: $font-xl; font-weight: bold; display: block; margin-bottom: $space-md; }
.hint { color: $text-placeholder; display: block; }
.symbol { display: block; margin-top: $space-md; color: $text-secondary; }
</style>
