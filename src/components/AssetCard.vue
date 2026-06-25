<template>
  <view class="asset-card">
    <text class="placeholder">AssetCard — round 9</text>
  </view>
</template>

<script setup>
defineProps({
  totalValue: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
  totalProfitRate: { type: Number, default: 0 },
  todayProfit: { type: Number, default: 0 }
})
</script>

<style lang="scss" scoped>
.asset-card { padding: $space-md; }
.placeholder { color: $text-placeholder; }
</style>
