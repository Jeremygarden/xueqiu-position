<template>
  <view class="asset-card">
    <view class="row top">
      <view class="left">
        <text class="label">总资产 (元)</text>
        <text class="value-main">{{ fmtPrice(totalValue) }}</text>
      </view>
      <view class="right" :class="profitClass(totalProfit)">
        <text class="label">总盈亏</text>
        <text class="value-sec">{{ fmtSigned(totalProfit) }}</text>
        <text class="value-sub">{{ fmtPercent(totalProfitRate) }}</text>
      </view>
    </view>
    <view class="row bottom">
      <view class="cell">
        <text class="label">成本</text>
        <text class="cell-val">{{ fmtPrice(totalCost) }}</text>
      </view>
      <view class="cell" :class="profitClass(todayProfit)">
        <text class="label">今日盈亏</text>
        <text class="cell-val">{{ fmtSigned(todayProfit) }}</text>
      </view>
      <view class="cell">
        <text class="label">收益率</text>
        <text class="cell-val" :class="profitClass(totalProfitRate)">{{ fmtPercent(totalProfitRate) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { formatPrice, formatPercent } from '@/utils/helpers.js'

defineProps({
  totalValue: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
  totalProfitRate: { type: Number, default: 0 },
  todayProfit: { type: Number, default: 0 }
})

const fmtPrice = (n) => formatPrice(n)
const fmtPercent = (n) => formatPercent(n)
const fmtSigned = (n) => {
  if (!Number.isFinite(Number(n))) return '--'
  const v = Number(n)
  const sign = v > 0 ? '+' : ''
  return `${sign}${formatPrice(v)}`
}
const profitClass = (n) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return 'text-flat'
  if (v > 0) return 'text-up'
  if (v < 0) return 'text-down'
  return 'text-flat'
}
</script>

<style lang="scss" scoped>
.asset-card {
  background: linear-gradient(135deg, #1989fa 0%, #1166c9 100%);
  border-radius: $radius-lg;
  padding: $space-lg;
  color: #fff;
  margin: $space-md;
  box-shadow: 0 8rpx 24rpx rgba(25, 137, 250, 0.18);
}
.row { display: flex; }
.top { justify-content: space-between; align-items: flex-end; margin-bottom: $space-lg; }
.left, .right { display: flex; flex-direction: column; }
.right { text-align: right; align-items: flex-end; }
.label { font-size: $font-xs; opacity: 0.8; margin-bottom: $space-xs; }
.value-main { font-size: 56rpx; font-weight: 700; letter-spacing: 1rpx; }
.value-sec { font-size: $font-lg; font-weight: 600; }
.value-sub { font-size: $font-xs; opacity: 0.9; margin-top: $space-xs; }
.bottom {
  border-top: 1rpx solid rgba(255,255,255,0.2);
  padding-top: $space-md;
  justify-content: space-between;
}
.cell { display: flex; flex-direction: column; }
.cell-val { font-size: $font-md; font-weight: 600; }
/* Override colors when profit is positive/negative — keep visible on blue bg */
.text-up { color: #ffd9d4; }
.text-down { color: #c8f8df; }
.text-flat { color: #ffffffcc; }
</style>
