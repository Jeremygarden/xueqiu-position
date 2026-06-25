# 雪球持仓监控微信小程序 — OpenClaw Polish Loop

## 目标
项目初版已完成，用 openclaw-agent 做质量 polish。检查并修复以下问题，让项目达到真正可用的质量。

## Git 配置（必须）
每次 push 必须用带 token 的方式：
```bash
TOKEN=$(gh auth token)
git push https://Jeremygarden:${TOKEN}@github.com/Jeremygarden/xueqiu-position.git main
```
git user: Jeremygarden

## 当前项目状态
- 项目目录：./
- 已有文件：src/api/xueqiu.js, src/api/request.js, src/utils/indicators.js, src/utils/storage.js, src/stores/portfolio.js, src/pages/ (index/detail/add/settings/market/webview), src/components/
- npm install 可以运行

## 每轮 Checklist（按顺序）

### 1. 验证 indicators.js
运行 node 测试：
```bash
node -e "
import('./src/utils/indicators.js').then(m => {
  const prices = [10,11,12,11,10,9,10,11,13,14,15,14,13,12,11,10,11,12,13,14,15,16,17,18,19,20];
  const macd = m.calculateMACD(prices);
  const rsi = m.calculateRSI(prices);
  const bb = m.calculateBollingerBands(prices);
  console.log('MACD signal:', macd.signal);
  console.log('RSI:', rsi.value, 'status:', rsi.status);
  console.log('BB upper:', bb.upper, 'lower:', bb.lower, 'status:', bb.status);
});
"
```
如果报错，修复 indicators.js 导出，确保：
- calculateMACD(prices) → {macd, signal, histogram, trend} 
- calculateRSI(prices, period=14) → {value, status: 'overbought'|'oversold'|'neutral'}
- calculateBollingerBands(prices, period=20, multiplier=2) → {upper, middle, lower, status: 'above'|'below'|'inside'}
- getSignalScore(prices) → number (-2 to +2)

### 2. 检查并修复 src/pages/index/index.vue
确保：
- 显示总资产、总收益、今日盈亏卡片（AssetCard 组件）
- 持仓列表（PositionCard 组件）
- 分类 tab：全部/股票/基金/按市场/按收益
- 持仓点击跳转到 detail 页面
- 右上角刷新按钮

### 3. 检查并修复 src/pages/detail/detail.vue
确保：
- 显示标的名称、当前价、涨跌幅
- MACD/RSI/布林带信号标签（SignalTag 组件）
- 综合信号评分（-2 到 +2）
- 雪球社区帖子列表（PostList 组件）
- 帖子点击跳转 webview 页面

### 4. 检查并修复 src/pages/add/add.vue
确保：
- 输入字段：证券代码、持仓数量、成本价、买入日期、备注
- 市场选择：A股/港股/美股/基金
- 提交后保存到 storage 并跳回首页

### 5. 检查 src/api/xueqiu.js
确保：
- fetchQuote(symbol) 有正确的错误处理
- fetchKline(symbol, period='day', count=60) 返回 close 价格数组
- fetchFundNav(code) 返回 {nav, date}
- fetchCommunityPosts(symbol, count=10) 返回帖子数组
- 所有函数有 try/catch 和 fallback

### 6. 检查 src/stores/portfolio.js (Pinia)
确保：
- positions: 持仓数组（响应式）
- addPosition(pos), removePosition(symbol), updatePosition(symbol, data)
- fetchAllPrices() 批量拉取行情
- computed: totalAssets, totalProfit, todayProfit
- 按类型/市场/收益的过滤方法

### 7. 最终：更新 README.md
包含：
- 项目简介
- 功能列表（持仓管理、技术分析、社区精选）
- 安装和运行方式（npm install → npm run dev:mp-weixin）
- xq_a_token 配置说明
- 目录结构

## 完成标准
每轮：
1. 实现/修复上面某个 checklist 项目
2. 确认 node 测试通过（indicators.js）
3. git add -A && git commit -m "fix/feat: 具体描述"
4. TOKEN=$(gh auth token) && git push https://Jeremygarden:${TOKEN}@github.com/Jeremygarden/xueqiu-position.git main

所有 checklist 完成后输出：STATUS: COMPLETE
