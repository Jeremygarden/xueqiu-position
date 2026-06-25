<template>
  <view class="position-card" @click="$emit('click', position)">
    <text class="placeholder">PositionCard — round 9</text>
  </view>
</template>

<script setup>
defineProps({ position: { type: Object, default: () => ({}) } })
defineEmits(['click'])
</script>

<style lang="scss" scoped>
.position-card { padding: $space-md; }
.placeholder { color: $text-placeholder; }
</style>
