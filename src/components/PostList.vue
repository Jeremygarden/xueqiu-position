<template>
  <view class="post-list">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    <view v-else-if="!posts.length" class="empty">
      <text>暂无社区帖子</text>
    </view>
    <view v-else class="list">
      <view
        v-for="post in posts"
        :key="post.id"
        class="post-item"
        @click="$emit('post-click', post)"
      >
        <text class="title">{{ post.title || '(无标题)' }}</text>
        <text v-if="post.text" class="text">{{ post.text }}</text>
        <view class="meta">
          <text class="author">{{ post.author || '匿名' }}</text>
          <text class="dot">·</text>
          <text class="time">{{ formatTime(post.createdAt) }}</text>
          <view class="flex-spacer"></view>
          <text v-if="post.likeCount" class="likes">👍 {{ post.likeCount }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  posts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
defineEmits(['post-click'])

function formatTime(t) {
  if (!t) return ''
  if (typeof t === 'string') return t
  const ts = Number(t)
  if (!Number.isFinite(ts)) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style lang="scss" scoped>
.post-list { padding: 0 $space-md; }
.loading, .empty {
  padding: $space-xl;
  text-align: center;
  color: $text-placeholder;
  font-size: $font-sm;
}
.list { display: flex; flex-direction: column; gap: $space-sm; }
.post-item {
  background: $bg-card;
  padding: $space-md;
  border-radius: $radius-md;
  display: flex;
  flex-direction: column;
  gap: $space-xs;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.title { font-size: $font-md; font-weight: 600; color: $text-primary; }
.text {
  font-size: $font-sm;
  color: $text-secondary;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: $font-xs;
  color: $text-placeholder;
  margin-top: $space-xs;
}
.flex-spacer { flex: 1; }
.author { color: $primary; }
.likes { color: $text-secondary; }
</style>
