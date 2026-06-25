<template>
  <web-view v-if="url" :src="url"></web-view>
  <view v-else class="page">
    <text class="hint">未提供 url 参数</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'
const url = ref('')
defineOptions({
  onLoad(query) {
    if (query && query.url) {
      url.value = decodeURIComponent(query.url)
    }
  }
})
</script>

<style lang="scss" scoped>
.page { padding: $space-lg; }
.hint { color: $text-placeholder; }
</style>
