<template>
  <view class="page">
    <view class="card">
      <view class="title">xq_a_token 配置</view>
      <view class="desc">
        雪球 API 需要登录态 cookie。请按以下步骤获取 token：
        <view class="step">1. 在浏览器打开 https://xueqiu.com 并登录</view>
        <view class="step">2. F12 打开开发者工具 → Application → Cookies → xueqiu.com</view>
        <view class="step">3. 找到 xq_a_token，复制其 Value 粘贴到下方输入框</view>
        <view class="step">4. 点击「保存」，再点「验证」确认 token 有效</view>
      </view>

      <view class="form-row">
        <text class="label">xq_a_token</text>
        <view class="input-row">
          <input
            class="input"
            v-model="token"
            :password="!visible"
            placeholder="粘贴 xq_a_token..."
          />
          <text class="toggle" @click="visible = !visible">{{ visible ? '隐藏' : '显示' }}</text>
        </view>
      </view>

      <view class="actions">
        <button class="btn" type="primary" @click="onSave">保存</button>
        <button class="btn" :loading="verifying" @click="onVerify">验证</button>
      </view>

      <view class="status-row">
        <text>状态：</text>
        <text :class="statusCls">{{ statusText }}</text>
      </view>

      <view v-if="verifyMessage" class="verify-msg" :class="verifySuccess ? 'ok' : 'err'">
        <text>{{ verifyMessage }}</text>
      </view>
    </view>

    <view class="card meta">
      <view class="meta-row">
        <text class="lbl">App 版本</text>
        <text class="val">v2.0.0</text>
      </view>
      <view class="meta-row">
        <text class="lbl">数据源</text>
        <text class="val">stock.xueqiu.com / danjuan.xueqiu.com</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getToken, setToken } from '@/utils/storage.js'
import { fetchQuote } from '@/api/xueqiu.js'

const token = ref('')
const visible = ref(false)
const verifying = ref(false)
const verifyMessage = ref('')
const verifySuccess = ref(false)

const statusText = computed(() => token.value ? '已设置' : '未设置')
const statusCls = computed(() => token.value ? 'text-up' : 'text-flat')

onMounted(() => {
  token.value = getToken() || ''
})

function onSave() {
  setToken(token.value.trim())
  uni.showToast({ title: '已保存', icon: 'success' })
}

async function onVerify() {
  verifyMessage.value = ''
  if (!token.value) {
    return uni.showToast({ title: '请先输入 token', icon: 'none' })
  }
  setToken(token.value.trim()) // make sure request picks up latest
  verifying.value = true
  try {
    const q = await fetchQuote('SH600519')
    if (q && q.name) {
      verifySuccess.value = true
      verifyMessage.value = `✅ token 有效：${q.name} 现价 ${q.current}`
    } else {
      verifySuccess.value = false
      verifyMessage.value = '⚠️ 返回空数据，token 可能失效或无权限'
    }
  } catch (err) {
    verifySuccess.value = false
    const code = err && err.code
    const msg = (err && err.message) || '未知错误'
    if (code === 'auth') {
      verifyMessage.value = `❌ token 无效或已过期：${msg}`
    } else {
      verifyMessage.value = `❌ 验证失败 (${code || 'unknown'})：${msg}`
    }
  } finally {
    verifying.value = false
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $bg-page; padding: $space-md; }
.card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $space-lg;
  margin-bottom: $space-md;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.title { font-size: $font-lg; font-weight: 700; margin-bottom: $space-md; }
.desc { font-size: $font-sm; color: $text-secondary; line-height: 1.7; }
.step { display: block; margin-top: 4rpx; }
.form-row { margin-top: $space-lg; }
.label { font-size: $font-sm; color: $text-secondary; display: block; margin-bottom: $space-sm; }
.input-row {
  display: flex;
  align-items: stretch;
  border: 1rpx solid $border-light;
  border-radius: $radius-sm;
  background: #fafbfc;
}
.input { flex: 1; padding: $space-sm $space-md; font-size: $font-md; }
.toggle {
  padding: $space-sm $space-md;
  font-size: $font-sm;
  color: $primary;
  border-left: 1rpx solid $border-light;
}
.actions {
  display: flex;
  gap: $space-md;
  margin-top: $space-md;
}
.btn { flex: 1; border-radius: $radius-md; }
.status-row { margin-top: $space-lg; font-size: $font-sm; color: $text-secondary; }
.verify-msg {
  margin-top: $space-md;
  padding: $space-md;
  border-radius: $radius-sm;
  font-size: $font-sm;
}
.verify-msg.ok { background: rgba(46, 204, 113, 0.1); color: #2ecc71; }
.verify-msg.err { background: rgba(231, 76, 60, 0.1); color: #e74c3c; }
.meta { padding: $space-md $space-lg; }
.meta-row {
  display: flex;
  justify-content: space-between;
  padding: $space-sm 0;
  font-size: $font-sm;
  border-bottom: 1rpx solid $border-light;
}
.meta-row:last-child { border-bottom: none; }
.lbl { color: $text-secondary; }
.val { color: $text-primary; }
.text-up { color: $color-up; font-weight: 600; }
.text-flat { color: $color-flat; }
</style>
