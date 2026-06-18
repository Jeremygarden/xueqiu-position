# 雪球持仓监控微信小程序 — Ralph Building Loop

## 目标
构建一个完整的微信小程序（uni-app 技术栈），用于监控雪球持仓，支持股票和基金，提供技术分析信号、社区精选、丰富持仓数据展示。

## 技术栈
- **框架**: uni-app（Vue 3 + Vite）
- **UI**: uView-Plus 组件库
- **状态管理**: Pinia
- **图表**: uCharts（uni-app 生态适配小程序)
- **数据来源**: 雪球非官方 API（xq_a_token Cookie 认证）

## 功能要求

### 1. 持仓管理
- 用户可手动添加/删除持仓标的（股票 + 基金）
- 持仓输入字段：证券代码、名称、持仓数量、成本价、买入日期
- 本地存储持仓数据（uni-app storage）
- 支持设置雪球 xq_a_token（Settings 页面）

### 2. 持仓数据展示（Rich Data）
- 当前价格、涨跌幅（实时刷新）
- 持仓成本、现值、盈亏金额、收益率（%）
- 持仓总览卡片：总资产、总收益、今日盈亏
- 分类视角（支持切换）：
  - 按类型（股票/基金）
  - 按市场（A股/港股/美股）
  - 按板块（从证券信息提取）
  - 按收益排序（盈亏榜）

### 3. 雪球社区精选信息
- 每个标的详情页展示最新雪球帖子摘要（调用雪球 timeline API）
- 显示：帖子标题、作者、点赞数、发布时间
- 可点击查看原帖（webview）

### 4. 技术分析买卖信号
- 对每只标的计算并展示：
  - **MACD**（12/26/9）：金叉死叉信号
  - **RSI**（14日）：超买（>70）超卖（<30）信号
  - **布林带**（20日，2σ）：价格突破上轨/下轨信号
- 综合信号评分（-2 到 +2，偏买/偏卖/中性）
- 在持仓列表和详情页展示信号标签（绿买/红卖/灰中性）

### 5. 页面结构
```
pages/
  index/        — 持仓总览（资产卡片 + 持仓列表）
  detail/       — 标的详情（走势图 + 社区 + 技术信号）
  add/          — 添加持仓
  settings/     — 设置 xq_a_token
tabBar: 持仓 / 市场 / 设置
```

## 代码规范
- 每个功能模块拆分到 `composables/` 或 `utils/`
- API 调用统一封装在 `api/` 目录，带错误处理和 loading 状态
- 技术指标计算放在 `utils/indicators.js`（纯函数，可测试）
- 组件放 `components/`
- 样式：统一 SCSS 变量，深色/浅色主题友好

## Git 规范（每轮必须）
- 每个 iteration 必须 `git add -A && git commit -m "feat/fix: 描述" && git push origin main`
- commit message 要描述本轮做了什么
- 远程 repo: https://github.com/Jeremygarden/xueqiu-position

## 完成标准
所有以下条件满足时输出 `STATUS: COMPLETE`：
1. uni-app 项目可以 `npm install` 无报错
2. 持仓增删改查功能完整
3. 技术指标（MACD/RSI/布林带）计算逻辑正确（有注释）
4. 雪球 API 封装完整（行情、基金净值、社区帖子）
5. 所有页面有完整 UI 实现
6. IMPLEMENTATION_PLAN.md 任务全部标记 done
7. README.md 包含项目说明和使用方法

## 当前状态
项目是空仓库，从零开始构建。

## 每轮工作模式
1. 查看 IMPLEMENTATION_PLAN.md 确认下一个任务
2. 实现该任务的完整代码
3. 运行必要的检验（`node -e "require('./src/utils/indicators.js')"` 等）
4. 更新 IMPLEMENTATION_PLAN.md 标记完成
5. `git add -A && git commit -m "..." && git push origin main`
6. 如所有任务完成，输出 `STATUS: COMPLETE`
