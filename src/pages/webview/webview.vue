<template>
  <view class="page">
    <web-view v-if="url" :src="url"></web-view>
    <view v-else class="empty">
      <text class="msg">未提供 url 参数</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
const url = ref('')

defineOptions({
  onLoad(query) {
    if (query && query.url) {
      url.value = decodeURIComponent(query.url)
      uni.setNavigationBarTitle({ title: '雪球' })
    }
  }
})
</script>

<style lang="scss" scoped>
.page { width: 100%; height: 100vh; }
.empty {
  padding: $space-xl;
  text-align: center;
}
.msg { color: $text-placeholder; }
</style>
