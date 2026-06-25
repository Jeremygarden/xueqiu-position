<template>
  <view class="asset-card card">
    <view class="asset-header">
      <text class="asset-title">持仓总览</text>
      <view class="asset-time" v-if="lastRefresh">
        <text>更新: {{ formatTime(lastRefresh) }}</text>
      </view>
    </view>
    <view class="asset-row">
      <view class="asset-item">
        <text class="asset-label">总资产</text>
        <text class="asset-value primary">{{ formatMoney(totalAssets) }}</text>
      </view>
      <view class="asset-item">
        <text class="asset-label">总收益</text>
        <text :class="['asset-value', totalProfit >= 0 ? 'text-buy' : 'text-sell']">
          {{ totalProfit >= 0 ? '+' : '' }}{{ formatMoney(totalProfit) }}
        </text>
      </view>
      <view class="asset-item">
        <text class="asset-label">收益率</text>
        <text :class="['asset-value', totalProfitPercent >= 0 ? 'text-buy' : 'text-sell']">
          {{ totalProfitPercent >= 0 ? '+' : '' }}{{ formatMoney(totalProfitPercent, 2) }}%
        </text>
      </view>
    </view>
    <view class="asset-row">
      <view class="asset-item">
        <text class="asset-label">今日盈亏</text>
        <text :class="['asset-value', todayProfit >= 0 ? 'text-buy' : 'text-sell']">
          {{ todayProfit >= 0 ? '+' : '' }}{{ formatMoney(todayProfit) }}
        </text>
      </view>
      <view class="asset-item">
        <text class="asset-label">持仓数</text>
        <text class="asset-value">{{ positionsCount }}</text>
      </view>
      <view class="asset-item">
        <text class="asset-label">总成本</text>
        <text class="asset-value">{{ formatMoney(totalCost) }}</text>
      </view>
    </view>
    <view class="refresh-btn" @click="$emit('refresh')">
      <text class="refresh-icon">↻</text>
      <text>{{ loading ? '刷新中...' : '刷新数据' }}</text>
    </view>
  </view>
</template>

<script setup>
import { formatMoney, formatTime } from '@/utils/helpers'

defineProps({
  totalAssets: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
  totalProfitPercent: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  todayProfit: { type: Number, default: 0 },
  positionsCount: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  lastRefresh: { type: Number, default: 0 }
})

defineEmits(['refresh'])
</script>

<style lang="scss" scoped>
.asset-card {
  margin-bottom: 0;
}

.asset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.asset-title {
  font-size: 32rpx;
  font-weight: 600;
}

.asset-time {
  font-size: 22rpx;
  color: $app-text-secondary;
}

.asset-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.asset-row:last-of-type {
  margin-bottom: 20rpx;
}

.asset-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.asset-label {
  font-size: 24rpx;
  color: $app-text-secondary;
  margin-bottom: 6rpx;
}

.asset-value {
  font-size: 32rpx;
  font-weight: 600;
}

.asset-value.primary {
  color: $app-color-primary;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
  background: $app-color-primary;
  border-radius: 8rpx;
  color: #fff;
  font-size: 26rpx;
}

.refresh-icon {
  margin-right: 8rpx;
  font-size: 28rpx;
}
</style>
