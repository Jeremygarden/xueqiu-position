<template>
  <view class="page">
    <AssetCard
      :total-value="store.totalValue"
      :total-cost="store.totalCost"
      :total-profit="store.totalProfit"
      :total-profit-rate="store.totalProfitRate"
      :today-profit="store.todayProfit"
    />

    <view class="toolbar">
      <scroll-view class="tabs" scroll-x>
        <view
          v-for="tab in tabs"
          :key="tab.value"
          class="tab"
          :class="{ active: store.filterType === tab.value }"
          @click="store.filterType = tab.value"
        >
          <text>{{ tab.label }}</text>
        </view>
      </scroll-view>
      <view class="sort-actions">
        <view
          v-for="opt in sortOptions"
          :key="opt.value"
          class="sort-btn"
          :class="{ active: store.sortBy === opt.value }"
          @click="store.sortBy = opt.value"
        >
          <text>{{ opt.label }}</text>
        </view>
      </view>
    </view>

    <view v-if="store.loading && !store.positions.length" class="status">
      <text>加载中…</text>
    </view>

    <EmptyState
      v-else-if="!store.filteredPositions.length"
      :message="emptyMessage"
      action-text="添加持仓"
      @action="goAdd"
    />

    <view v-else class="list">
      <PositionCard
        v-for="pos in store.filteredPositions"
        :key="pos.symbol"
        :position="pos"
        @click="goDetail(pos)"
      />
    </view>

    <view class="fab" @click="goAdd">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import AssetCard from '@/components/AssetCard.vue'
import PositionCard from '@/components/PositionCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { usePortfolioStore } from '@/stores/portfolio.js'

const store = usePortfolioStore()

const tabs = [
  { label: '全部', value: 'all' },
  { label: '股票', value: 'stock' },
  { label: '基金', value: 'fund' },
  { label: 'ETF',  value: 'etf' },
  { label: 'A股',  value: 'A股' },
  { label: '港股', value: '港股' },
  { label: '美股', value: '美股' }
]

const sortOptions = [
  { label: '默认', value: 'default' },
  { label: '收益率', value: 'profitRate' },
  { label: '盈亏额', value: 'profit' },
  { label: '今日涨跌', value: 'percent' }
]

const emptyMessage = computed(() => {
  if (store.filterType === 'all') return '还没有持仓，去添加第一笔吧'
  return '当前筛选下暂无持仓'
})

function goAdd() {
  uni.navigateTo({ url: '/pages/add/add' })
}

function goDetail(pos) {
  if (!pos || !pos.symbol) return
  uni.navigateTo({
    url: `/pages/detail/detail?symbol=${encodeURIComponent(pos.symbol)}`
  })
}

onMounted(() => store.loadPositions())

defineOptions({
  onShow() { store.loadPositions() },
  onPullDownRefresh() {
    store.refreshPrices().finally(() => uni.stopPullDownRefresh())
  },
  onNavigationBarButtonTap() { store.refreshPrices() }
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $bg-page; padding-bottom: 120rpx; }
.toolbar { padding: 0 $space-md; }
.tabs { white-space: nowrap; padding: $space-sm 0; }
.tab {
  display: inline-block;
  padding: 6rpx $space-md;
  margin-right: $space-sm;
  font-size: $font-sm;
  color: $text-secondary;
  background: $bg-card;
  border-radius: $radius-pill;
  border: 1rpx solid $border-light;
}
.tab.active { background: $primary; color: #fff; border-color: $primary; }
.sort-actions {
  display: flex;
  gap: $space-sm;
  padding: $space-sm 0;
  flex-wrap: wrap;
}
.sort-btn {
  font-size: $font-xs;
  color: $text-secondary;
  padding: 4rpx $space-sm;
  border-radius: $radius-sm;
  background: $bg-card;
  border: 1rpx solid $border-light;
}
.sort-btn.active { color: $primary; border-color: $primary; }
.status { padding: $space-xl; text-align: center; color: $text-placeholder; }
.list { padding-bottom: $space-md; }
.fab {
  position: fixed;
  right: $space-lg;
  bottom: 80rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: $primary;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(25,137,250,0.4);
  z-index: 100;
}
.fab-icon { font-size: 56rpx; font-weight: 200; line-height: 1; color: #fff; }
</style>
