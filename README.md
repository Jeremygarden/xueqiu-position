# 雪球持仓监控微信小程序

基于 uni-app (Vue 3 + Vite) 构建的微信小程序，用于监控雪球持仓，支持股票和基金，提供技术分析信号、社区精选、丰富持仓数据展示。

## 功能

### 持仓管理
- 手动添加/删除持仓标的（股票 + 基金）
- 支持字段：证券代码、名称、持仓数量、成本价、买入日期
- 本地存储持仓数据

### 持仓数据展示
- 当前价格、涨跌幅实时刷新
- 持仓成本、现值、盈亏金额、收益率
- 持仓总览卡片：总资产、总收益、今日盈亏
- 多视角分类：按类型/市场/收益排序

### 技术分析信号
- MACD（12/26/9）：金叉死叉信号
- RSI（14日）：超买超卖信号
- 布林带（20日，2σ）：价格突破信号
- 综合信号评分（-2 到 +2）

### 雪球社区精选
- 每个标的详情页展示最新雪球帖子
- 显示：帖子标题、作者、点赞数、发布时间
- 可点击查看原帖（WebView）

## 技术栈

- **框架**: uni-app（Vue 3 + Vite）
- **UI**: uView-Plus 组件库
- **状态管理**: Pinia
- **数据来源**: 雪球非官方 API（xq_a_token Cookie 认证）

## 项目结构

```
src/
├── api/           # API 封装
│   ├── request.js    # HTTP 请求封装
│   └── xueqiu.js     # 雪球 API 接口
├── components/   # 公共组件
│   ├── AssetCard.vue    # 资产总览卡片
│   ├── PositionCard.vue # 持仓卡片
│   ├── SignalTag.vue    # 信号标签
│   └── PostList.vue     # 社区帖子列表
├── pages/        # 页面
│   ├── index/     # 持仓总览
│   ├── detail/    # 标的详情
│   ├── add/       # 添加持仓
│   ├── settings/  # 设置
│   ├── market/    # 市场
│   └── webview/   # WebView 容器
├── stores/       # Pinia 状态管理
│   └── portfolio.js
├── utils/        # 工具函数
│   ├── indicators.js # 技术指标计算
│   ├── storage.js    # 本地存储
│   └── helpers.js    # 辅助函数
├── App.vue
├── main.js
├── manifest.json
├── pages.json
└── uni.scss
```

## 使用方式

### 开发

```bash
# 安装依赖
npm install

# H5 开发
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin
```

### 构建

```bash
# H5 构建
npm run build:h5

# 微信小程序构建
npm run build:mp-weixin
```

### 配置 Token

1. 打开 [雪球网](https://xueqiu.com) 并登录
2. 打开浏览器开发者工具
3. 从 Cookie 中获取 `xq_a_token` 的值
4. 在小程序「设置」页面填入 Token 并保存

## 数据来源

本项目使用雪球非官方公开 API，数据仅供个人学习参考，不构成投资建议。

## License

MIT
