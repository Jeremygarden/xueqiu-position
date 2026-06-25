<template>
  <view class="page-add">
    <view class="card">
      <view class="form-title">添加持仓标的</view>

      <view class="form-section">
        <view class="form-label">搜索证券</view>
        <u-search
          v-model="searchKeyword"
          placeholder="输入股票/基金代码或名称搜索"
          :show-action="false"
          @change="onSearchChange"
          @clear="searchResults = []"
        ></u-search>
        <view v-if="searchResults.length > 0" class="search-results">
          <view
            v-for="item in searchResults"
            :key="item.symbol"
            class="search-item flex-between"
            @click="selectStock(item)"
          >
            <view>
              <text class="search-name">{{ item.name }}</text>
              <text class="search-code">{{ item.symbol }}</text>
            </view>
            <text class="search-type">{{ item.type === 'fund' ? '基金' : '股票' }}</text>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="form-label">证券代码</view>
        <u-input v-model="form.code" placeholder="如 SH600519, HK00700" border="surround" />
      </view>

      <view class="form-section">
        <view class="form-label">证券名称</view>
        <u-input v-model="form.name" placeholder="如 贵州茅台" border="surround" />
      </view>

      <view class="form-section">
        <view class="form-label">持仓数量</view>
        <u-input v-model="form.shares" placeholder="请输入持仓数量" type="number" border="surround" />
      </view>

      <view class="form-section">
        <view class="form-label">成本价</view>
        <u-input v-model="form.costPrice" placeholder="请输入买入成本价" type="digit" border="surround" />
      </view>

      <view class="form-section">
        <view class="form-label">买入日期</view>
        <view class="date-picker" @click="showDatePicker = true">
          <text :class="['date-text', form.buyDate ? '' : 'placeholder']">
            {{ form.buyDate || '请选择买入日期' }}
          </text>
          <u-icon name="calendar" size="28" color="#909399"></u-icon>
        </view>
      </view>

      <view class="form-section">
        <view class="form-label">类型</view>
        <view class="type-selector flex-row">
          <text
            v-for="t in types"
            :key="t.key"
            :class="['type-option', form.type === t.key ? 'active' : '']"
            @click="form.type = t.key"
          >{{ t.label }}</text>
        </view>
      </view>

      <u-button type="primary" shape="circle" :loading="submitting" @click="handleSubmit">
        确认添加
      </u-button>
    </view>

    <u-datetime-picker
      :show="showDatePicker"
      v-model="dateValue"
      mode="date"
      @confirm="confirmDate"
      @close="showDatePicker = false"
    ></u-datetime-picker>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { searchStocks } from '@/api/xueqiu'

const store = usePortfolioStore()
const submitting = ref(false)
const showDatePicker = ref(false)
const dateValue = ref(Number(new Date()))
const searchKeyword = ref('')
const searchResults = ref([])

let searchTimer = null

const types = [
  { key: 'stock', label: '股票' },
  { key: 'fund', label: '基金' }
]

const form = reactive({
  code: '',
  name: '',
  shares: '',
  costPrice: '',
  buyDate: '',
  type: 'stock'
})

function onSearchChange() {
  if (searchTimer) clearTimeout(searchTimer)
  if (!searchKeyword.value || searchKeyword.value.length < 1) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const results = await searchStocks(searchKeyword.value)
      searchResults.value = results
    } catch (err) {
      console.error('Search failed:', err)
    }
  }, 300)
}

function selectStock(item) {
  form.code = item.symbol || item.code
  form.name = item.name
  form.type = item.type === 'fund' ? 'fund' : 'stock'
  searchKeyword.value = item.name
  searchResults.value = []
}

function confirmDate(e) {
  const d = new Date(e.value)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  form.buyDate = `${year}-${month}-${day}`
  showDatePicker.value = false
}

async function handleSubmit() {
  if (!form.code) {
    uni.showToast({ title: '请输入证券代码', icon: 'none' })
    return
  }
  if (!form.shares || Number(form.shares) <= 0) {
    uni.showToast({ title: '请输入有效的持仓数量', icon: 'none' })
    return
  }
  if (!form.costPrice || Number(form.costPrice) <= 0) {
    uni.showToast({ title: '请输入有效的成本价', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const position = {
      symbol: form.code,
      code: form.code,
      name: form.name || form.code,
      shares: Number(form.shares),
      costPrice: Number(form.costPrice),
      buyDate: form.buyDate,
      type: form.type
    }

    const result = store.addPosition(position)
    if (result) {
      uni.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 500)
    } else {
      uni.showToast({ title: '该标的已存在', icon: 'none' })
    }
  } catch (err) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-add {
  padding: 16rpx;
}

.form-title {
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 30rpx;
  text-align: center;
}

.form-section {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: $app-text-regular;
  margin-bottom: 10rpx;
}

.search-results {
  max-height: 400rpx;
  overflow-y: auto;
  border: 1rpx solid $app-border-color;
  border-radius: 8rpx;
  margin-top: 8rpx;
}

.search-item {
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid $app-border-color;
}

.search-item:last-child {
  border-bottom: none;
}

.search-name {
  font-size: 28rpx;
  font-weight: 500;
}

.search-code {
  font-size: 22rpx;
  color: $app-text-secondary;
  margin-left: 12rpx;
}

.search-type {
  font-size: 22rpx;
  color: $app-color-primary;
}

.date-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border: 1rpx solid $app-border-color;
  border-radius: 10rpx;
}

.date-text {
  font-size: 28rpx;
}

.date-text.placeholder {
  color: $app-text-secondary;
}

.type-selector {
  gap: 16rpx;
}

.type-option {
  padding: 12rpx 30rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  background: #f5f5f5;
  color: $app-text-regular;
}

.type-option.active {
  background: $app-color-primary;
  color: #fff;
}
</style>
