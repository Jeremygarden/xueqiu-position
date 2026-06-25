<template>
  <view class="post-list">
    <view class="section-title">社区精选</view>
    <view v-if="posts.length === 0" class="empty-state">
      <text>暂无社区帖子</text>
    </view>
    <view v-for="post in posts" :key="post.id" class="post-item" @click="openPost(post)">
      <view class="post-header flex-row">
        <image v-if="post.user.avatar" :src="post.user.avatar" class="post-avatar" mode="aspectFill" />
        <view class="post-user-info">
          <text class="post-author">{{ post.user.screenName }}</text>
          <text class="post-time">{{ formatRelativeTime(post.createdAt) }}</text>
        </view>
      </view>
      <view class="post-content">
        <text class="post-text" v-if="post.text">{{ truncateText(post.text, 100) }}</text>
        <text class="post-text" v-else-if="post.description">{{ truncateText(post.description, 100) }}</text>
      </view>
      <view class="post-footer flex-row">
        <view class="post-stat">
          <text class="stat-icon">❤</text>
          <text>{{ post.likeCount }}</text>
        </view>
        <view class="post-stat">
          <text class="stat-icon">💬</text>
          <text>{{ post.replyCount }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { formatRelativeTime } from '@/utils/helpers'

defineProps({
  posts: { type: Array, default: () => [] }
})

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function openPost(post) {
  if (post.target) {
    uni.setStorageSync('post_url', post.target)
    uni.navigateTo({
      url: '/pages/webview/webview'
    })
  } else if (post.id) {
    uni.setStorageSync('post_url', `https://xueqiu.com/${post.id}`)
    uni.navigateTo({
      url: '/pages/webview/webview'
    })
  }
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin: 20rpx 16rpx 12rpx;
}

.empty-state {
  text-align: center;
  padding: 40rpx;
  color: $app-text-secondary;
  font-size: 26rpx;
}

.post-item {
  background: $app-card-bg;
  border-radius: 12rpx;
  padding: 20rpx;
  margin: 0 16rpx 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.post-header {
  margin-bottom: 12rpx;
}

.post-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.post-user-info {
  display: flex;
  flex-direction: column;
}

.post-author {
  font-size: 26rpx;
  font-weight: 500;
}

.post-time {
  font-size: 20rpx;
  color: $app-text-secondary;
}

.post-content {
  margin-bottom: 12rpx;
}

.post-text {
  font-size: 26rpx;
  color: $app-text-regular;
  line-height: 1.5;
}

.post-footer {
  border-top: 1rpx solid $app-border-color;
  padding-top: 12rpx;
}

.post-stat {
  display: flex;
  align-items: center;
  margin-right: 24rpx;
  font-size: 22rpx;
  color: $app-text-secondary;
}

.stat-icon {
  margin-right: 4rpx;
}
</style>
