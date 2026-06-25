<template>
  <view class="empty-state">
    <text class="msg">{{ message }}</text>
    <button v-if="actionText" class="btn" type="primary" size="mini" @click="$emit('action')">{{ actionText }}</button>
  </view>
</template>

<script setup>
defineProps({
  message: { type: String, default: '暂无数据' },
  actionText: { type: String, default: '' }
})
defineEmits(['action'])
</script>

<style lang="scss" scoped>
.empty-state {
  padding: $space-xl;
  text-align: center;
}
.msg { color: $text-placeholder; font-size: $font-sm; display: block; margin-bottom: $space-md; }
.btn { display: inline-block; }
</style>
