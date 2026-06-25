<template>
  <view class="page-market">
    <view class="card">
      <view class="section-title">市场概览</view>
      <text class="market-desc">连接雪球 API 后自动获取市场数据</text>
    </view>

    <view class="card">
      <view class="section-title">快速添加</view>
      <view class="quick-stocks">
        <view v-for="stock in quickStocks" :key="stock.code" class="quick-stock" @click="addQuick(stock)">
          <text class="quick-name">{{ stock.name }}</text>
          <text class="quick-code">{{ stock.code }}</text>
          <u-icon name="plus-circle" size="24" color="#3c9cff"></u-icon>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="section-title">热门板块</view>
      <view class="sector-grid">
        <view v-for="sector in sectors" :key="sector.name" class="sector-item">
          <text class="sector-name">{{ sector.name }}</text>
          <text :class="['sector-change', sector.change >= 0 ? 'text-buy' : 'text-sell']">
            {{ sector.change >= 0 ? '+' : '' }}{{ sector.change }}%
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { usePortfolioStore } from '@/stores/portfolio'

const store = usePortfolioStore()

const quickStocks = [
  { name: '贵州茅台', code: 'SH600519' },
  { name: '腾讯控股', code: 'HK00700' },
  { name: '阿里巴巴', code: 'HK09988' },
  { name: '沪深300ETF', code: 'SH510300' },
  { name: '纳指ETF', code: 'SH513100' },
  { name: '苹果', code: 'AAPL.US' }
]

const sectors = [
  { name: '白酒', change: 1.2 },
  { name: '半导体', change: -0.8 },
  { name: '新能源', change: 2.1 },
  { name: '医药', change: -1.5 },
  { name: '金融', change: 0.3 },
  { name: '消费', change: 0.7 }
]

function addQuick(stock) {
  uni.navigateTo({
    url: `/pages/add/add?code=${stock.code}&name=${stock.name}`
  })
}
</script>

<style lang="scss" scoped>
.page-market {
  padding: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.market-desc {
  font-size: 26rpx;
  color: $app-text-secondary;
  text-align: center;
  padding: 20rpx 0;
}

.quick-stocks {
  display: flex;
  flex-direction: column;
}

.quick-stock {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $app-border-color;
}

.quick-stock:last-child {
  border-bottom: none;
}

.quick-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 500;
}

.quick-code {
  font-size: 24rpx;
  color: $app-text-secondary;
  margin-right: 16rpx;
}

.sector-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12rpx;
}

.sector-item {
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  text-align: center;
}

.sector-name {
  font-size: 24rpx;
  display: block;
  margin-bottom: 6rpx;
}

.sector-change {
  font-size: 28rpx;
  font-weight: 600;
}
</style>
