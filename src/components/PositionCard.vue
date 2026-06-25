<template>
  <view class="position-card card" @click="goDetail">
    <view class="position-main flex-between">
      <view class="position-info">
        <view class="flex-row">
          <text class="position-name">{{ position.name }}</text>
          <text class="position-code">{{ position.code }}</text>
        </view>
        <view class="flex-row">
          <text :class="['position-tag', `tag-${detectType(position.code) === '基金' ? 'fund' : 'stock'}`]">
            {{ detectType(position.code) }}
          </text>
          <text :class="['position-tag', `tag-${detectMarket(position.code) === '港股' ? 'hk' : detectMarket(position.code) === '美股' ? 'us' : 'a'}`]">
            {{ detectMarket(position.code) }}
          </text>
          <SignalTag :signal="signal" v-if="signal" />
        </view>
      </view>
      <view class="position-price flex-col">
        <text :class="['price-current', position.change >= 0 ? 'text-buy' : 'text-sell']">
          {{ formatMoney(position.currentPrice) }}
        </text>
        <text :class="['price-change', position.change >= 0 ? 'text-buy' : 'text-sell']">
          {{ position.change >= 0 ? '+' : '' }}{{ formatMoney(position.change, 3) }}
          {{ position.percent >= 0 ? '+' : '' }}{{ formatMoney(position.percent, 2) }}%
        </text>
      </view>
    </view>
    <view class="position-detail flex-between">
      <view class="detail-item">
        <text class="detail-label">成本</text>
        <text class="detail-value">{{ formatMoney(position.costPrice) }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">市值</text>
        <text class="detail-value">{{ formatMoney(position.marketValue) }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">盈亏</text>
        <text :class="['detail-value', position.profit >= 0 ? 'text-buy' : 'text-sell']">
          {{ position.profit >= 0 ? '+' : '' }}{{ formatMoney(position.profit) }}
        </text>
      </view>
      <view class="detail-item">
        <text class="detail-label">收益率</text>
        <text :class="['detail-value', position.profitPercent >= 0 ? 'text-buy' : 'text-sell']">
          {{ position.profitPercent >= 0 ? '+' : '' }}{{ formatMoney(position.profitPercent, 1) }}%
        </text>
      </view>
    </view>
    <view class="position-footer flex-between">
      <text class="footer-text">持仓 {{ position.shares }} 股</text>
      <text class="footer-text" v-if="position.buyDate">买入 {{ position.buyDate }}</text>
    </view>
    <view class="delete-btn" @click.stop="onDelete">
      <u-icon name="trash" size="28" color="#f56c6c"></u-icon>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { formatMoney } from '@/utils/helpers'
import { detectMarket, detectType } from '@/utils/helpers'
import { calculateCompositeSignal } from '@/utils/indicators'
import SignalTag from '@/components/SignalTag.vue'

const props = defineProps({
  position: { type: Object, required: true },
  macd: { type: Object, default: null },
  rsi: { type: Object, default: null },
  bollinger: { type: Object, default: null }
})

const emit = defineEmits(['delete', 'click'])

const signal = computed(() => {
  if (props.macd && props.rsi && props.bollinger) {
    return calculateCompositeSignal(props.macd, props.rsi, props.bollinger)
  }
  return null
})

function goDetail() {
  emit('click', props.position)
}

function onDelete() {
  emit('delete', props.position)
}
</script>

<style lang="scss" scoped>
.position-card {
  position: relative;
}

.position-main {
  margin-bottom: 16rpx;
}

.position-name {
  font-size: 30rpx;
  font-weight: 600;
  margin-right: 12rpx;
}

.position-code {
  font-size: 24rpx;
  color: $app-text-secondary;
}

.position-tag {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
  margin-right: 8rpx;
}

.tag-stock { background: #ecf5ff; color: #3c9cff; }
.tag-fund { background: #f0f9eb; color: #67c23a; }
.tag-a { background: #fdf6ec; color: #e6a23c; }
.tag-hk { background: #fef0f0; color: #f56c6c; }
.tag-us { background: #f0f0f0; color: #909399; }

.price-current {
  font-size: 34rpx;
  font-weight: 700;
  text-align: right;
}

.price-change {
  font-size: 24rpx;
  text-align: right;
}

.position-detail {
  margin-bottom: 12rpx;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.detail-label {
  font-size: 22rpx;
  color: $app-text-secondary;
  margin-bottom: 4rpx;
}

.detail-value {
  font-size: 26rpx;
  font-weight: 500;
}

.position-footer {
  border-top: 1rpx solid $app-border-color;
  padding-top: 12rpx;
}

.footer-text {
  font-size: 22rpx;
  color: $app-text-secondary;
}

.delete-btn {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  padding: 8rpx;
}

.flex-col {
  display: flex;
  flex-direction: column;
}
</style>
