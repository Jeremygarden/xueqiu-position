<template>
  <view class="page">
    <view class="card">
      <view class="form-row">
        <text class="label">证券代码</text>
        <view class="search-row">
          <input
            class="input"
            v-model="form.symbol"
            placeholder="如 SH600519、HK00700、AAPL"
            @input="onSearchInput"
          />
          <button class="btn-sm" size="mini" @click="doSearch">搜索</button>
        </view>
        <view v-if="searchResults.length" class="search-list">
          <view
            v-for="r in searchResults"
            :key="r.symbol"
            class="search-item"
            @click="pick(r)"
          >
            <text class="r-symbol">{{ r.symbol }}</text>
            <text class="r-name">{{ r.name }}</text>
            <text class="r-meta">{{ r.market }}·{{ r.type }}</text>
          </view>
        </view>
      </view>

      <view class="form-row">
        <text class="label">名称</text>
        <input class="input" v-model="form.name" placeholder="标的名称（搜索后自动填入）" />
      </view>

      <view class="form-row">
        <text class="label">市场</text>
        <view class="radio-group">
          <view
            v-for="m in markets"
            :key="m"
            class="radio"
            :class="{ active: form.market === m }"
            @click="form.market = m"
          >
            <text>{{ m }}</text>
          </view>
        </view>
      </view>

      <view class="form-row">
        <text class="label">持仓数量</text>
        <input class="input" v-model="form.shares" type="digit" placeholder="如 100" />
      </view>

      <view class="form-row">
        <text class="label">成本价</text>
        <input class="input" v-model="form.costPrice" type="digit" placeholder="如 1800.50" />
      </view>

      <view class="form-row">
        <text class="label">买入日期</text>
        <picker mode="date" :value="form.buyDate" @change="onDateChange">
          <view class="picker">{{ form.buyDate || '请选择日期' }}</view>
        </picker>
      </view>

      <view class="form-row">
        <text class="label">备注</text>
        <textarea class="input textarea" v-model="form.notes" placeholder="可选" />
      </view>

      <view class="form-row total-row">
        <text class="label">总成本</text>
        <text class="total">¥ {{ totalCost }}</text>
      </view>

      <button class="btn-primary" type="primary" @click="onSubmit">保存持仓</button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { searchStocks } from '@/api/xueqiu.js'
import { getMarketFromSymbol, formatPrice } from '@/utils/helpers.js'
import { usePortfolioStore } from '@/stores/portfolio.js'

const store = usePortfolioStore()
const markets = ['A股', '港股', '美股', '基金']

const form = reactive({
  symbol: '',
  name: '',
  market: 'A股',
  type: 'stock',
  shares: '',
  costPrice: '',
  buyDate: new Date().toISOString().slice(0, 10),
  notes: ''
})

const searchResults = ref([])
let searchTimer = null

function onSearchInput() {
  form.market = getMarketFromSymbol(form.symbol)
  if (searchTimer) clearTimeout(searchTimer)
  if (!form.symbol || form.symbol.length < 2) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(doSearch, 350)
}

async function doSearch() {
  if (!form.symbol) return
  try {
    searchResults.value = await searchStocks(form.symbol)
  } catch (_) {
    searchResults.value = []
  }
}

function pick(r) {
  form.symbol = r.symbol
  form.name = r.name
  form.market = r.market || form.market
  form.type = r.type || 'stock'
  searchResults.value = []
}

function onDateChange(e) { form.buyDate = e.detail.value }

const totalCost = computed(() => {
  const s = Number(form.shares) || 0
  const c = Number(form.costPrice) || 0
  return formatPrice(s * c)
})

async function onSubmit() {
  if (!form.symbol) return uni.showToast({ title: '请输入证券代码', icon: 'none' })
  if (!form.shares || Number(form.shares) <= 0) return uni.showToast({ title: '持仓数量无效', icon: 'none' })
  if (!form.costPrice || Number(form.costPrice) <= 0) return uni.showToast({ title: '成本价无效', icon: 'none' })

  await store.addPosition({
    symbol: form.symbol.toUpperCase(),
    name: form.name || form.symbol.toUpperCase(),
    market: form.market,
    type: form.type,
    shares: Number(form.shares),
    costPrice: Number(form.costPrice),
    buyDate: form.buyDate,
    notes: form.notes
  })
  uni.showToast({ title: '已添加', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 600)
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $bg-page; padding: $space-md; }
.card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $space-lg;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.form-row {
  margin-bottom: $space-lg;
  display: flex;
  flex-direction: column;
}
.label { font-size: $font-sm; color: $text-secondary; margin-bottom: $space-sm; }
.input {
  border: 1rpx solid $border-light;
  border-radius: $radius-sm;
  padding: $space-sm $space-md;
  font-size: $font-md;
  background: #fafbfc;
}
.textarea { min-height: 100rpx; }
.picker {
  border: 1rpx solid $border-light;
  border-radius: $radius-sm;
  padding: $space-sm $space-md;
  font-size: $font-md;
  background: #fafbfc;
  color: $text-primary;
}
.search-row { display: flex; gap: $space-sm; align-items: stretch; }
.search-row .input { flex: 1; }
.btn-sm { background: $primary; color: #fff; border-radius: $radius-sm; padding: 0 $space-md; }
.search-list {
  margin-top: $space-sm;
  border: 1rpx solid $border-light;
  border-radius: $radius-sm;
  background: #fff;
  max-height: 360rpx;
  overflow: auto;
}
.search-item {
  display: flex;
  align-items: center;
  gap: $space-sm;
  padding: $space-sm $space-md;
  border-bottom: 1rpx solid $border-light;
}
.search-item:last-child { border-bottom: none; }
.r-symbol { font-weight: 600; color: $primary; }
.r-name { flex: 1; }
.r-meta { font-size: $font-xs; color: $text-placeholder; }
.radio-group { display: flex; gap: $space-sm; flex-wrap: wrap; }
.radio {
  padding: 8rpx $space-md;
  border-radius: $radius-sm;
  border: 1rpx solid $border-light;
  background: #fafbfc;
  font-size: $font-sm;
}
.radio.active { background: $primary-light; color: $primary; border-color: $primary; }
.total-row { flex-direction: row; align-items: center; justify-content: space-between; }
.total { font-size: $font-lg; font-weight: 700; color: $color-up; }
.btn-primary { background: $primary; color: #fff; border-radius: $radius-md; }
</style>
