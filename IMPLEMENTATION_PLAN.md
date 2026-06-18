# IMPLEMENTATION_PLAN.md

## 项目: 雪球持仓监控微信小程序

STATUS: IN_PROGRESS

---

## 任务列表

### Phase 1: 项目脚手架
- [ ] 1.1 初始化 uni-app (Vue 3 + Vite) 项目结构
- [ ] 1.2 配置 uView-Plus、Pinia、uCharts 依赖
- [ ] 1.3 创建基础目录结构 (pages/api/utils/components/stores)
- [ ] 1.4 配置 tabBar 和路由
- [ ] 1.5 初始化 git 并推送

### Phase 2: 数据层 & API 封装
- [ ] 2.1 封装雪球 API (api/xueqiu.js): 行情接口、基金净值、社区帖子
- [ ] 2.2 封装本地存储 (utils/storage.js): 持仓 CRUD
- [ ] 2.3 技术指标计算 (utils/indicators.js): MACD/RSI/布林带

### Phase 3: 核心页面
- [ ] 3.1 Settings 页: xq_a_token 配置
- [ ] 3.2 添加持仓页 (pages/add): 表单验证 + 证券搜索
- [ ] 3.3 持仓总览页 (pages/index): 资产卡片 + 持仓列表
- [ ] 3.4 标的详情页 (pages/detail): 走势图 + 社区 + 技术信号

### Phase 4: 功能完善
- [ ] 4.1 多视角分类切换 (按类型/市场/收益)
- [ ] 4.2 技术信号可视化 (信号标签 + 评分)
- [ ] 4.3 社区精选展示 (帖子列表 + WebView)
- [ ] 4.4 实时价格刷新 (定时轮询/手动刷新)

### Phase 5: 收尾
- [ ] 5.1 README.md 项目文档
- [ ] 5.2 全量 lint + 错误修复
- [ ] 5.3 最终集成测试
