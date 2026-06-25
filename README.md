# 雪球持仓监控（xueqiu-position）

> uni-app Vue 3 微信小程序 — 实时雪球持仓行情、技术分析（MACD/RSI/布林带）、社区精选

[![version](https://img.shields.io/badge/version-2.0.0--alpha-blue)]()
[![status](https://img.shields.io/badge/status-WIP-orange)]()

## 当前状态

**v2.0.0 全量重构进行中**，采用多轮 Ralph Loop 模式逐文件重写：

| 轮次 | 内容 | 状态 |
|------|------|------|
| 1 | 清理 + 重建脚手架(package/vite/manifest/pages/App/main/uni.scss) | ✅ |
| 2 | API 层(request.js + xueqiu.js) | ⏳ |
| 3 | utils(indicators/storage/helpers) | ⏳ |
| 4 | Pinia store(portfolio) | ⏳ |
| 5 | settings 页(token 配置) | ⏳ |
| 6 | add 页(添加持仓) | ⏳ |
| 7 | index 页(总览) | ⏳ |
| 8 | detail 页(详情+技术分析) | ⏳ |
| 9 | components(AssetCard/PositionCard/SignalTag/PostList/EmptyState) | ⏳ |
| 10 | market 页 + webview 页 + tabBar | ⏳ |
| 11-18 | bug 修复+细节打磨 | ⏳ |
| 19-20 | 最终验证 + 文档 | ⏳ |

## 项目简介

- **持仓管理** — 添加/查看/删除 A股/港股/美股/基金持仓
- **实时行情** — 调用雪球非官方 API，定时刷新
- **技术分析** — MACD/RSI/布林带 三大指标 + 综合信号评分（-2 ~ +2）
- **社区精选** — 拉取每只标的雪球社区帖子流

## 技术栈

- [uni-app](https://uniapp.dcloud.net.cn/) Vue 3 + Vite
- [uview-plus](https://uview-plus.jiangruyi.com/) 3.x 组件库
- [Pinia](https://pinia.vuejs.org/) 状态管理
- 雪球非官方接口（需 `xq_a_token` cookie）

## 安装

```bash
git clone https://github.com/Jeremygarden/xueqiu-position.git
cd xueqiu-position
npm install
```

## 运行

```bash
# 微信小程序（推荐）
npm run dev:mp-weixin
# H5
npm run dev:h5
```

微信小程序：
1. 打开微信开发者工具
2. 导入 `dist/dev/mp-weixin` 目录作为项目
3. 在 `src/manifest.json` 填入你的 `mp-weixin.appid`

## 配置 xq_a_token

由于雪球 API 需要登录态，第一次启动后需在「设置」页粘贴 token：

1. 浏览器登录 https://xueqiu.com
2. F12 → Application → Cookies → 复制 `xq_a_token` 的值
3. 小程序「设置」页粘贴并保存

## 目录结构

```
xueqiu-position/
├── src/
│   ├── api/           # 雪球接口封装
│   │   ├── request.js
│   │   └── xueqiu.js
│   ├── components/    # 通用组件
│   ├── pages/         # 路由页面（与 pages.json 对应）
│   │   ├── index/     # 持仓总览
│   │   ├── detail/    # 标的详情
│   │   ├── add/       # 添加持仓
│   │   ├── market/    # 行情
│   │   ├── settings/  # 设置（token）
│   │   └── webview/   # 网页容器
│   ├── stores/        # Pinia store
│   ├── utils/         # 工具函数（含技术指标）
│   ├── App.vue
│   ├── main.js
│   ├── manifest.json
│   ├── pages.json
│   └── uni.scss       # 全局变量
├── package.json
├── vite.config.js
└── README.md
```

## License

MIT
