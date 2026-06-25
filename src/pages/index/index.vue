<template>
  <view class="page">
    <text class="title">📊 我的持仓</text>
    <text class="hint">round 7 will build the full layout.</text>
  </view>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio.js'

const store = usePortfolioStore()
onMounted(() => store.loadPositions())
</script>

<style lang="scss" scoped>
.page { padding: $space-lg; }
.title { font-size: $font-xl; font-weight: bold; display: block; margin-bottom: $space-md; }
.hint { color: $text-placeholder; }
</style>
