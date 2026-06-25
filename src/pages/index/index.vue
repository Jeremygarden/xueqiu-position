<template>
  <view class="page-index">
    <AssetCard
      :total-assets="store.totalAssets"
      :total-profit="store.totalProfit"
      :total-profit-percent="store.totalProfitPercent"
      :total-cost="store.totalCost"
      :today-profit="store.todayProfit"
      :positions-count="store.positions.length"
      :loading="store.loading"
      :last-refresh="store.lastRefresh"
      @refresh="handleRefresh"
    />

    <view class="filter-bar flex-between">
      <view class="filter-tabs flex-row">
        <text
          v-for="tab in viewModes"
          :key="tab.key"
          :class="['filter-tab', store.viewMode === tab.key ? 'active' : '']"
          @click="switchView(tab.key)"
        >{{ tab.label }}</text>
      </view>
      <view class="sort-select" @click="showSortPicker = true">
        <text class="sort-text">{{ currentSortLabel }}</text>
        <u-icon name="arrow-down" size="20" color="#909399"></u-icon>
      </view>
    </view>

    <view v-if="store.filteredPositions.length === 0" class="empty-state">
      <u-icon name="bag" size="80" color="#dcdfe6"></u-icon>
      <text class="empty-text">暂无持仓数据</text>
      <text class="empty-sub">点击下方按钮添加持仓</text>
      <u-button type="primary" shape="circle" @click="goAdd">添加持仓</u-button>
    </view>

    <PositionCard
      v-for="pos in store.filteredPositions"
      :key="pos.id"
      :position="pos"
      @click="goDetail"
      @delete="handleDelete"
    />

    <view class="add-btn-fixed" @click="goAdd">
      <u-icon name="plus" size="40" color="#fff"></u-icon>
    </view>

    <u-action-sheet :show="showSortPicker" :actions="sortOptions" @close="showSortPicker = false" @select="selectSort"></u-action-sheet>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onPullDownRefresh } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { usePortfolioStore } from '@/stores/portfolio'
import AssetCard from '@/components/AssetCard.vue'
import PositionCard from '@/components/PositionCard.vue'

const store = usePortfolioStore()
const showSortPicker = ref(false)

const viewModes = [
  { key: 'all', label: '全部' },
  { key: 'stock', label: '股票' },
  { key: 'fund', label: '基金' },
  { key: 'a', label: 'A股' },
  { key: 'hk', label: '港股' },
  { key: 'us', label: '美股' }
]

const sortOptions = [
  { name: '默认排序', key: 'default' },
  { name: '收益最高', key: 'profit' },
  { name: '亏损最多', key: 'loss' },
  { name: '按类型', key: 'type' },
  { name: '按市场', key: 'market' }
]

const currentSortLabel = computed(() => {
  const found = sortOptions.find(o => o.key === store.sortBy)
  return found ? found.name : '默认排序'
})

onShow(() => {
  store.loadPositions()
  if (store.hasToken && store.positions.length > 0) {
    store.refreshQuotes()
  }
})

function switchView(mode) {
  store.setViewMode(mode)
}

function selectSort(action) {
  store.setSortBy(action.key)
  showSortPicker.value = false
}

async function handleRefresh() {
  await store.refreshQuotes()
}

function handleDelete(pos) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除 ${pos.name} 吗？`,
    success: (res) => {
      if (res.confirm) {
        store.removePosition(pos.id)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

function goDetail(pos) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${pos.id}` })
}

function goAdd() {
  uni.navigateTo({ url: '/pages/add/add' })
}

onPullDownRefresh(() => {
  if (store.hasToken && store.positions.length > 0) {
    store.refreshQuotes().finally(() => {
      uni.stopPullDownRefresh()
    })
  } else {
    uni.stopPullDownRefresh()
  }
})
</script>

<style lang="scss" scoped>
.page-index {
  padding-bottom: 120rpx;
}

.filter-bar {
  padding: 16rpx;
  background: $app-card-bg;
  margin: 0 16rpx 16rpx;
  border-radius: 12rpx;
}

.filter-tabs {
  flex-wrap: wrap;
}

.filter-tab {
  padding: 6rpx 16rpx;
  font-size: 24rpx;
  border-radius: 20rpx;
  margin-right: 8rpx;
  margin-bottom: 4rpx;
  color: $app-text-regular;
  background: #f5f5f5;
}

.filter-tab.active {
  background: $app-color-primary;
  color: #fff;
}

.sort-select {
  display: flex;
  align-items: center;
}

.sort-text {
  font-size: 24rpx;
  color: $app-text-secondary;
  margin-right: 4rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 32rpx;
  color: $app-text-secondary;
  margin: 20rpx 0 8rpx;
}

.empty-sub {
  font-size: 26rpx;
  color: $app-text-secondary;
  margin-bottom: 30rpx;
}

.add-btn-fixed {
  position: fixed;
  bottom: 140rpx;
  right: 30rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: $app-color-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(60, 156, 255, 0.4);
  z-index: 100;
}
</style>
