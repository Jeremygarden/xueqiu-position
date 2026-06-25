# 雪球持仓监控（xueqiu-position）

> uni-app Vue 3 微信小程序 — 实时雪球持仓行情、技术分析（MACD/RSI/布林带）、社区精选

[![version](https://img.shields.io/badge/version-2.0.0-blue)]()
[![platform](https://img.shields.io/badge/uni--app-Vue%203-42b883)]()

## 项目简介

`xueqiu-position` 是一款个人投资者用的轻量化持仓监控工具，跨端编译为微信小程序 / H5：

- 📊 **持仓管理** — 添加、删除、按市场/类型筛选 A股/港股/美股/基金持仓
- 💹 **实时行情** — 调用雪球公开 API 批量拉取报价，支持手动刷新与下拉刷新
- 🧠 **技术分析** — 内置 MACD / RSI / 布林带 三大经典指标，并融合为 -2 ~ +2 综合信号评分
- 📰 **社区精选** — 在标的详情页直接展示该标的的雪球用户动态
- 🔐 **本地保存** — 持仓数据与 `xq_a_token` 全部存于本地（`uni.setStorageSync`），不依赖任何后端

## 功能列表

| 模块 | 路径 | 主要功能 |
|------|------|---------|
| 持仓总览 | `pages/index` | 资产卡片 / 持仓列表 / 筛选 + 排序 / 浮动添加按钮 |
| 添加持仓 | `pages/add` | 代码搜索 + 自动识别市场 + 表单校验 + 本地保存 |
| 标的详情 | `pages/detail` | 大字行情 / MACD-RSI-BB 信号卡 / 综合评分进度条 / 社区帖子 |
| 行情速览 | `pages/market` | 指数 + A 股热门 + 港美股热门 |
| 设置中心 | `pages/settings` | `xq_a_token` 输入、保存、验证（fetchQuote 实测） |
| 社区帖子 | `pages/webview` | `web-view` 容器，渲染雪球原帖 URL |

## 技术栈

- [uni-app](https://uniapp.dcloud.net.cn/) `vue3` 频道 + [Vite](https://vitejs.dev/) 7
- [Pinia 2.x](https://pinia.vuejs.org/) — 持仓状态管理
- [uview-plus 3.x](https://uview-plus.jiangruyi.com/) — 移动端 UI 备用
- 雪球公开接口：
  - `https://stock.xueqiu.com/v5/stock/quote.json`
  - `https://stock.xueqiu.com/v5/stock/chart/kline.json`
  - `https://stock.xueqiu.com/v5/stock/batch/quote.json`
  - `https://danjuan.xueqiu.com/djapi/fund/detail/{symbol}`
  - `https://xueqiu.com/v4/statuses/user_timeline.json`
  - `https://xueqiu.com/query/v1/suggest_stock.json`

## 安装

需要 Node.js ≥ 18。

```bash
git clone https://github.com/Jeremygarden/xueqiu-position.git
cd xueqiu-position
npm install
```

## 运行

```bash
# 微信小程序（推荐）
npm run dev:mp-weixin
# 输出在 dist/dev/mp-weixin —— 用微信开发者工具导入该目录

# H5（浏览器调试）
npm run dev:h5
```

构建生产包：

```bash
npm run build:mp-weixin    # → dist/build/mp-weixin
npm run build:h5
```

微信小程序需要在 `src/manifest.json` 的 `mp-weixin.appid` 填入你自己的 AppID
（占位符为 `wxPLACEHOLDER0000000`）。

## 配置 `xq_a_token`

雪球未公开认证接口，所以行情/帖子接口需要登录态 cookie：

1. 浏览器登录 https://xueqiu.com
2. F12 → Application → Cookies → `xueqiu.com`
3. 找到 `xq_a_token` 行，复制其 **Value**（一串十六进制字符）
4. 打开小程序「设置」页 → 粘贴到输入框 → 点击「保存」→「验证」

> ⚠️ 微信小程序运行时不允许业务代码自定义 `Cookie` 头（白名单限制）。
> H5 与 App 平台不受影响。如果你在小程序端发现拉取失败，
> 推荐用 H5 模式开发联调，或在微信端通过自建反向代理透传 token。

## 测试

项目自带 Vitest 单测套件覆盖 `utils/`（indicators / helpers / storage）。

```bash
npm test           # vitest run --config vitest.config.js
npm run test:watch # 监听模式
```

如果只想快速验证技术指标，也可以直接用 Node：

```bash
node --input-type=module << 'EOF'
import { calculateMACD, calculateRSI, calculateBollingerBands, getSignalScore, getSignalLabel } from './src/utils/indicators.js';
const prices = [10,11,12,11,10,9,10,11,13,14,15,14,13,12,11,10,11,12,13,14,15,16,17,18,19,20];
console.log({
  macd: calculateMACD(prices),
  rsi:  calculateRSI(prices),
  bb:   calculateBollingerBands(prices),
  score: getSignalScore(prices),
  label: getSignalLabel(getSignalScore(prices))
});
EOF
```

## 目录结构

```
xueqiu-position/
├── src/
│   ├── api/
│   │   ├── request.js      # 通用 HTTP 封装、Cookie 注入、错误分类、in-flight 去重
│   │   └── xueqiu.js       # fetchQuote / fetchBatchQuote / fetchKline /
│   │                         fetchFundNav / fetchTimeline / searchStocks
│   ├── components/
│   │   ├── AssetCard.vue
│   │   ├── PositionCard.vue
│   │   ├── SignalTag.vue
│   │   ├── PostList.vue
│   │   └── EmptyState.vue
│   ├── pages/
│   │   ├── index/index.vue      # 持仓总览
│   │   ├── detail/detail.vue    # 标的详情 + 技术分析
│   │   ├── add/add.vue          # 添加持仓
│   │   ├── market/market.vue    # 行情速览（tabBar）
│   │   ├── settings/settings.vue# 设置（tabBar）
│   │   └── webview/webview.vue  # 社区帖子容器
│   ├── stores/
│   │   └── portfolio.js    # Pinia store — 持仓 CRUD + 价格刷新 + 信号计算
│   ├── utils/
│   │   ├── indicators.js   # MACD / RSI / Bollinger / 综合评分
│   │   ├── storage.js      # uni.storage 封装（持仓 + token）
│   │   └── helpers.js      # 数字格式化 + 市场识别 + 交易时段
│   ├── App.vue
│   ├── main.js
│   ├── manifest.json
│   ├── pages.json
│   └── uni.scss            # 全局 SCSS 变量
├── package.json
├── vite.config.js
└── README.md
```

## 变更记录

详见 [CHANGELOG.md](./CHANGELOG.md)。

## License

MIT
