# 雪球持仓监控微信小程序 — 全量重构 Ralph Loop

## 你的任务
对 https://github.com/Jeremygarden/xueqiu-position 的全部代码做**全量重构/翻新**。
假设现有代码存在幻觉、逻辑错误、API 调用错误、组件不完整等问题，**逐文件审查并重写**。

## 工作目录
`/home/azureuser/.openclaw/workspace-investor/xueqiu-position/`

## Git 推送（每轮必须用 token）
```bash
GH_TOKEN=$(gh auth token)
git add -A
git commit -m "refactor: <本轮描述>"
git push https://Jeremygarden:${GH_TOKEN}@github.com/Jeremygarden/xueqiu-position.git main
```

## 技术栈（不变）
- uni-app Vue 3 + Vite（微信小程序目标平台）
- uview-plus 3.x 组件库
- Pinia 状态管理
- 雪球非官方 API（xq_a_token cookie 认证）

## 每轮工作顺序

### 第1轮：彻底清理 + 重建脚手架
1. 删除所有 src/ 下旧代码（保留目录结构）
2. 重建 `package.json`（锁定正确版本）：
   ```json
   {
     "name": "xueqiu-position",
     "version": "2.0.0",
     "private": true,
     "scripts": {
       "dev:mp-weixin": "uni -p mp-weixin",
       "build:mp-weixin": "uni build -p mp-weixin",
       "dev:h5": "uni -p h5",
       "build:h5": "uni build -p h5",
       "test": "vitest run",
       "test:watch": "vitest"
     },
     "dependencies": {
       "@dcloudio/uni-app": "3.0.0-4020920241024001",
       "@dcloudio/uni-ui": "^1.5.6",
       "pinia": "^2.1.7",
       "uview-plus": "^3.4.31",
       "vue": "^3.4.21"
     },
     "devDependencies": {
       "@dcloudio/types": "^3.4.14",
       "@dcloudio/vite-plugin-uni": "3.0.0-4020920241024001",
       "@vitejs/plugin-vue": "^5.0.4",
       "sass": "^1.75.0",
       "vite": "^5.2.8",
       "vitest": "^1.6.0",
       "@vitest/coverage-v8": "^1.6.0"
     }
   }
   ```
3. 重建 `vite.config.js`
4. 重建 `src/manifest.json`（appid 用占位符）
5. 重建 `src/pages.json`（正确 tabBar + 路由）
6. 重建 `src/App.vue` + `src/main.js`
7. 重建 `src/uni.scss`（主题变量）

### 第2轮：API 层重构 — src/api/
重写 `src/api/request.js`：
- 封装 `uni.request` 为 Promise，自动带 Cookie header（xq_a_token）
- BASE_URL = `https://stock.xueqiu.com`，FUND_URL = `https://danjuan.xueqiu.com`
- 错误类型区分：网络错误 / API 错误 / token 失效（401）
- 请求去重（同一 symbol 并发请求合并）

重写 `src/api/xueqiu.js`：
- `fetchQuote(symbol)` → 返回标准化 Quote 对象
  - symbol 格式：SH600519 / SZ000858 / HK00700 / AAPL
  - 字段：symbol, name, current, percent, change, high, low, open, lastClose, volume, marketCap, type('stock'|'fund'|'etf')
- `fetchBatchQuote(symbols)` → 批量行情，单次最多 20 个，超过自动分批
- `fetchKline(symbol, period='day', count=120)` → 返回 `{timestamps: [], closes: [], volumes: []}`
- `fetchFundNav(symbol)` → 返回 `{nav, navDate, accNav, growthRate, unitNav}`
- `fetchTimeline(symbol, count=10)` → 返回社区帖子数组 `[{id, title, text, author, likeCount, createdAt, url}]`
- `searchStocks(keyword)` → 搜索，返回 `[{symbol, name, type, market}]`
- 所有函数都有 try/catch，fallback 返回空对象/空数组而非 throw

### 第3轮：工具函数重构 — src/utils/
重写 `src/utils/indicators.js`（纯函数，无副作用，需通过 `node` 测试）：
```javascript
// 必须导出的接口（ESM）：
export function calculateEMA(prices, period) // 返回数组
export function calculateMACD(prices, fast=12, slow=26, signal=9)
// → {macd: number, signal: number, histogram: number, trend: 'bullish'|'bearish'|'neutral', crossover: 'golden'|'death'|null}
export function calculateRSI(prices, period=14)
// → {value: number, status: 'overbought'|'oversold'|'neutral'}
export function calculateBollingerBands(prices, period=20, multiplier=2)
// → {upper: number, middle: number, lower: number, bandwidth: number, status: 'above'|'below'|'inside'}
export function getSignalScore(prices)
// → number -2 to +2（-2极度超买/卖出，+2极度超卖/买入）
export function getSignalLabel(score)
// → {text: string, color: string, type: 'buy'|'sell'|'neutral'}
```

测试命令（每轮必须运行，失败则修复）：
```bash
node --input-type=module << 'EOF'
import { calculateMACD, calculateRSI, calculateBollingerBands, getSignalScore, getSignalLabel } from './src/utils/indicators.js';
const prices = [10,11,12,11,10,9,10,11,13,14,15,14,13,12,11,10,11,12,13,14,15,16,17,18,19,20];
const m = calculateMACD(prices); console.assert(typeof m.macd === 'number', 'MACD fail');
const r = calculateRSI(prices); console.assert(['overbought','oversold','neutral'].includes(r.status), 'RSI fail');
const b = calculateBollingerBands(prices); console.assert(b.upper > b.middle, 'BB fail');
const s = getSignalScore(prices); console.assert(s >= -2 && s <= 2, 'Score fail: '+s);
const l = getSignalLabel(s); console.assert(l.text, 'Label fail');
console.log('All indicators OK:', {macd: m.macd.toFixed(2), rsi: r.value, bbStatus: b.status, score: s, label: l.text});
EOF
```

重写 `src/utils/storage.js`：
```javascript
// 必须导出：
export function getPositions()         // 返回 Position[] (从 uni.getStorageSync)
export function savePositions(list)    // 保存
export function addPosition(pos)       // 追加，去重（按 symbol）
export function removePosition(symbol) // 删除
export function updatePosition(symbol, patch) // 局部更新
export function getToken()             // 返回 xq_a_token string
export function setToken(token)        // 保存 token
```

Position 对象格式：
```typescript
{
  symbol: string      // SH600519
  name: string        // 贵州茅台
  market: 'A股'|'港股'|'美股'|'基金'
  type: 'stock'|'fund'|'etf'
  shares: number      // 持仓数量（基金为份额）
  costPrice: number   // 成本价
  buyDate: string     // YYYY-MM-DD
  notes: string       // 备注
  // 运行时字段（不存储，由 store 拉取后填充）：
  currentPrice?: number
  percent?: number    // 今日涨跌幅 %
  profit?: number     // 盈亏金额
  profitRate?: number // 收益率 %
  signals?: {macd, rsi, bb, score, label}
}
```

重写 `src/utils/helpers.js`：
- `formatPrice(num)` → 保留2位小数，千位分隔
- `formatPercent(num)` → `+1.23%` 带符号
- `formatProfit(num)` → 带+/-和颜色class
- `getMarketFromSymbol(symbol)` → 自动识别市场
- `isMarketOpen()` → 当前是否交易时间（A股9:30-15:00）
- `symbolToDisplayCode(symbol)` → `SH600519` → `600519`

### 第4轮：Pinia Store 重构 — src/stores/portfolio.js
```javascript
// defineStore('portfolio', () => { ... })
// State:
const positions = ref([])          // Position[]（含实时数据）
const loading = ref(false)
const lastRefresh = ref(null)      // timestamp
const sortBy = ref('default')      // 'profit'|'percent'|'default'
const filterType = ref('all')      // 'all'|'stock'|'fund'|'A股'|'港股'|'美股'

// Actions:
async function loadPositions()     // 从 storage 加载 + 拉取实时行情
async function refreshPrices()     // 刷新所有持仓价格（批量）
async function addPosition(pos)    // 添加持仓，立即拉价格
async function removePosition(symbol)
async function refreshSignals(symbol) // 拉 K 线并计算技术指标

// Getters:
const filteredPositions            // 根据 filterType + sortBy 过滤排序
const totalCost                    // 总成本
const totalValue                   // 总市值
const totalProfit                  // 总盈亏金额
const totalProfitRate              // 总收益率 %
const todayProfit                  // 今日盈亏（用 percent 估算）
const positionsByType              // 按 stock/fund/etf 分组
const positionsByMarket            // 按市场分组
```

### 第5轮：Settings 页 — src/pages/settings/settings.vue
功能：
- 输入框：输入 xq_a_token（password 类型，可显示/隐藏）
- 保存按钮：调用 setToken()，toast 提示
- 验证按钮：调用 fetchQuote('SH600519') 测试 token 是否有效，显示结果
- 说明文字：如何从浏览器获取 token（步骤说明）
- 底部显示：当前 token 状态（已设置/未设置）

### 第6轮：添加持仓页 — src/pages/add/add.vue
功能：
- 证券代码输入框 + 搜索按钮（调用 searchStocks，显示下拉列表）
- 搜索结果点击自动填入：symbol, name, type
- 市场单选：A股 / 港股 / 美股 / 基金
- 持仓数量输入（数字，必填）
- 成本价输入（数字，必填）
- 买入日期选择器（date picker）
- 备注输入（可选）
- 实时显示：总成本 = 数量 × 成本价
- 提交：验证 → addPosition → toast → 返回首页

### 第7轮：持仓总览页 — src/pages/index/index.vue
布局：
- 顶部资产卡片（AssetCard）：总资产 / 总盈亏 / 今日盈亏 / 总收益率
- 筛选 tab（SegmentedControl）：全部 / 股票 / 基金 / A股 / 港股 / 美股
- 排序按钮：默认 / 按收益率 / 按盈亏金额
- 持仓列表（PositionCard × n）：
  - 左：股票名称 + 代码
  - 中：现价 + 涨跌幅（红涨绿跌）
  - 右：持仓市值 + 收益率
  - 底部信号条：MACD/RSI/BB 小标签
- 右上角刷新按钮（下拉刷新 + 手动）
- 空状态：无持仓时显示引导添加
- 点击任意持仓卡片 → 跳转 detail 页

### 第8轮：标的详情页 — src/pages/detail/detail.vue
布局：
- 头部：股票名称 + 代码 + 当前价 + 涨跌幅（大字）
- 持仓信息行：成本 | 市值 | 盈亏 | 收益率
- 技术分析卡片（SignalCard）：
  - MACD 状态（金叉/死叉/中性）+ 值
  - RSI 状态（超买/超卖/中性）+ 值
  - 布林带（突破上轨/下轨/区间内）+ 带宽
  - 综合评分进度条（-2 到 +2）
  - 买卖信号大标签（强烈买入/买入/中性/卖出/强烈卖出）
- 雪球社区精选（帖子列表）：
  - 帖子标题 + 作者 + 点赞 + 时间
  - 点击跳转 webview 页
- 刷新数据按钮
- 删除持仓按钮（底部，带确认弹窗）

### 第9轮：组件重构 — src/components/
重写以下组件（确保 props/emit 正确，样式完整）：

**AssetCard.vue**
```
props: { totalValue, totalCost, totalProfit, totalProfitRate, todayProfit }
```

**PositionCard.vue**
```
props: { position: Position }
emits: ['click']
显示：名称/代码 | 现价/涨跌 | 市值/盈亏率 | 信号标签
```

**SignalTag.vue**
```
props: { type: 'macd'|'rsi'|'bb', status: string, value: number }
```

**PostList.vue**
```
props: { posts: Post[], loading: boolean }
emits: ['post-click']
```

**EmptyState.vue**（新增）
```
props: { message: string, actionText: string }
emits: ['action']
```

### 第10轮：Market 页 + WebView 页 + tabBar
完成：
- `src/pages/market/market.vue`：简版行情页（热门股票列表）
- `src/pages/webview/webview.vue`：接收 url 参数，展示雪球帖子
- 确保 `pages.json` tabBar 正确：持仓/市场/设置
- 确保所有页面路由跳转正确

### 第11-18轮：逐轮审查、修复 bug、完善细节
每轮选择最重要的问题修复：
- API 调用错误处理是否完善
- 组件 props 类型是否正确
- 样式是否对齐（红涨绿跌、深色适配）
- 边界情况（数据为空、数字为 null 等）
- 性能优化（debounce 搜索、虚拟列表等）
- README.md 完整文档

### 第19-20轮：最终验证
1. 运行 `npm install`（无报错）
2. 确认所有文件 import 路径正确
3. indicators.js 测试通过
4. git 状态干净
5. 全量 push，更新 README.md，标注版本 v2.0.0

## 每轮提交规范
```bash
GH_TOKEN=$(gh auth token)
git add -A
git commit -m "refactor(轮次): <具体描述>"
git push https://Jeremygarden:${GH_TOKEN}@github.com/Jeremygarden/xueqiu-position.git main
```

## 完成标准
所有轮次完成后，满足以下条件输出 `STATUS: COMPLETE`：
1. `npm install` 无报错
2. `node` 测试 indicators.js 全部通过
3. 所有页面组件文件存在且内容完整（非空壳）
4. API 层有完整 try/catch
5. Store 有完整 actions + getters
6. 20 轮全部有真实 commit + push
7. README.md 包含项目简介、功能列表、安装使用、token 配置说明
