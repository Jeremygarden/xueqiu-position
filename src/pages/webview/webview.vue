<template>
  <web-view :src="postUrl"></web-view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const postUrl = ref('')

onMounted(() => {
  postUrl.value = uni.getStorageSync('post_url') || 'https://xueqiu.com'
})
</script>
