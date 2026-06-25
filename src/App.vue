<script>
export default {
  onLaunch() {
    console.log('App Launch - 雪球持仓 v2.0.0')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* uni-app 全局样式 */
page {
  background-color: $bg-page;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue',
    Helvetica, Arial, sans-serif;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.6;
}

view, text {
  box-sizing: border-box;
}

.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-1 { flex: 1; }

.text-up { color: $color-up; }
.text-down { color: $color-down; }
.text-flat { color: $text-secondary; }

.card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $space-md;
  margin-bottom: $space-md;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
</style>
