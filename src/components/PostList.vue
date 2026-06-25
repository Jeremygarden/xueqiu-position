<template>
  <view class="post-list">
    <text class="placeholder">PostList — round 9</text>
  </view>
</template>

<script setup>
defineProps({
  posts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
defineEmits(['post-click'])
</script>

<style lang="scss" scoped>
.post-list { padding: $space-md; }
.placeholder { color: $text-placeholder; }
</style>
