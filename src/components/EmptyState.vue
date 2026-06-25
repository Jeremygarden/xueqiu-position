<template>
  <view class="empty-state">
    <view class="emoji">📭</view>
    <text class="msg">{{ message }}</text>
    <button
      v-if="actionText"
      class="btn"
      type="primary"
      size="mini"
      @click="$emit('action')"
    >{{ actionText }}</button>
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
  padding: $space-xl $space-lg;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.emoji { font-size: 80rpx; margin-bottom: $space-md; opacity: 0.6; }
.msg {
  color: $text-placeholder;
  font-size: $font-sm;
  display: block;
  margin-bottom: $space-lg;
}
.btn { display: inline-block; min-width: 240rpx; }
</style>
