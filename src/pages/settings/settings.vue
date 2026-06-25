<template>
  <view class="page-settings">
    <view class="card">
      <view class="section-title">雪球认证</view>
      <view class="form-section">
        <view class="form-label">xq_a_token</view>
        <u-input
          v-model="token"
          placeholder="输入雪球 Cookie 中的 xq_a_token"
          type="text"
          border="surround"
          :password="!showToken"
        ></u-input>
        <view class="token-hint">
          <text class="hint-text">从雪球网 (xueqiu.com) 登录后，在 Cookie 中获取 xq_a_token</text>
        </view>
      </view>
      <view class="flex-row" style="gap: 16rpx;">
        <u-button type="primary" shape="circle" @click="saveToken" :loading="saving">
          保存 Token
        </u-button>
        <u-button type="error" shape="circle" plain @click="showToken = !showToken">
          {{ showToken ? '隐藏' : '显示' }}
        </u-button>
      </view>
      <view v-if="saved" class="saved-tip">
        <u-icon name="checkmark-circle" color="#5ac725" size="28"></u-icon>
        <text class="saved-text">Token 已保存</text>
      </view>
    </view>

    <view class="card">
      <view class="section-title">刷新设置</view>
      <view class="form-section">
        <view class="form-label">自动刷新间隔（秒）</view>
        <u-input v-model="refreshInterval" placeholder="30" type="number" border="surround" />
      </view>
      <u-button type="primary" shape="circle" @click="saveSettings">保存设置</u-button>
    </view>

    <view class="card">
      <view class="section-title">数据管理</view>
      <view class="danger-zone">
        <view class="flex-between" style="margin-bottom: 16rpx;">
          <view>
            <text class="danger-title">清空所有持仓数据</text>
            <text class="danger-desc">此操作不可恢复</text>
          </view>
          <u-button type="error" size="small" plain @click="clearAllPositions">清空</u-button>
        </view>
        <view class="flex-between">
          <view>
            <text class="danger-title">导出持仓数据</text>
            <text class="danger-desc">JSON 格式导出</text>
          </view>
          <u-button type="primary" size="small" plain @click="exportData">导出</u-button>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="section-title">关于</view>
      <view class="about-info">
        <text class="about-item">雪球持仓监控 v1.0.0</text>
        <text class="about-item">数据来源：雪球非官方 API</text>
        <text class="about-item">仅供个人学习使用</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getToken, setToken, getAllPositions, savePositions, getSettings, saveSettings as storeSettings } from '@/utils/storage'

const token = ref('')
const showToken = ref(false)
const saving = ref(false)
const saved = ref(false)
const refreshInterval = ref('30')

onMounted(() => {
  token.value = getToken()
  const settings = getSettings()
  refreshInterval.value = String(settings.refreshInterval || 30)
})

function saveToken() {
  saving.value = true
  try {
    setToken(token.value.trim())
    saved.value = true
    uni.showToast({ title: 'Token 已保存', icon: 'success' })
    setTimeout(() => { saved.value = false }, 2000)
  } catch (err) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function saveSettings() {
  const interval = parseInt(refreshInterval.value)
  if (isNaN(interval) || interval < 10) {
    uni.showToast({ title: '刷新间隔不能小于10秒', icon: 'none' })
    return
  }
  storeSettings({ refreshInterval: interval })
  uni.showToast({ title: '设置已保存', icon: 'success' })
}

function clearAllPositions() {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有持仓数据吗？此操作不可恢复！',
    success: (res) => {
      if (res.confirm) {
        savePositions([])
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}

function exportData() {
  const positions = getAllPositions()
  if (positions.length === 0) {
    uni.showToast({ title: '没有持仓数据', icon: 'none' })
    return
  }
  const dataStr = JSON.stringify(positions, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  // Use clipboard as fallback for mini-program
  uni.setClipboardData({
    data: dataStr,
    success: () => {
      uni.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
    }
  })
}
</script>

<style lang="scss" scoped>
.page-settings {
  padding: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.form-section {
  margin-bottom: 20rpx;
}

.form-label {
  font-size: 26rpx;
  color: $app-text-regular;
  margin-bottom: 10rpx;
}

.token-hint {
  margin-top: 8rpx;
}

.hint-text {
  font-size: 22rpx;
  color: $app-text-secondary;
}

.saved-tip {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.saved-text {
  font-size: 24rpx;
  color: $app-buy-color;
  margin-left: 8rpx;
}

.danger-zone {
  padding: 8rpx 0;
}

.danger-title {
  font-size: 26rpx;
  font-weight: 500;
  display: block;
}

.danger-desc {
  font-size: 22rpx;
  color: $app-text-secondary;
}

.about-info {
  display: flex;
  flex-direction: column;
}

.about-item {
  font-size: 26rpx;
  color: $app-text-regular;
  margin-bottom: 8rpx;
}
</style>
