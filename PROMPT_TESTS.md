# 雪球持仓监控小程序 — 测试 Ralph Loop

## 任务
为 `/home/azureuser/.openclaw/workspace-investor/xueqiu-position/` 项目添加完整测试套件：
- 单元测试（vitest）
- 微信小程序集成测试
- 端到端测试

## 工作目录
`/home/azureuser/.openclaw/workspace-investor/xueqiu-position/`

## Git 推送
```bash
GH_TOKEN=$(gh auth token)
git add -A
git commit -m "test: <本轮描述>"
git push https://Jeremygarden:${GH_TOKEN}@github.com/Jeremygarden/xueqiu-position.git main
```

## 技术选型
- **单元测试**: Vitest + jsdom（已在 devDependencies）
- **Mock**: vitest 内置 vi.mock / vi.fn
- **集成测试**: 用 Vitest 测试组件行为（mock uni API）
- **E2E 思路**: 因小程序真机 E2E 需 devtools，改用「流程验证脚本」模拟完整用户流

## 每轮工作

### 第1轮：测试基础设施
1. 确认 `vitest` 已在 package.json devDeps
2. 创建 `vitest.config.js`：
```javascript
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: { provider: 'v8', reporter: ['text', 'json'] }
  }
})
```
3. 创建 `tests/` 目录结构：
```
tests/
  unit/
    indicators.test.js
    storage.test.js
    helpers.test.js
  integration/
    store.test.js
    api.test.js
  e2e/
    portfolio-flow.test.js
    signals-flow.test.js
  mocks/
    uni.mock.js         # uni-app API mock
    xueqiu.mock.js      # 雪球 API mock 数据
```
4. 创建 `tests/mocks/uni.mock.js`（mock 所有 uni.* API）：
```javascript
// mock uni.request, uni.getStorageSync, uni.setStorageSync, uni.showToast, uni.navigateTo 等
global.uni = {
  request: vi.fn(),
  getStorageSync: vi.fn(() => null),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  switchTab: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({ platform: 'mp-weixin', windowWidth: 375 })),
  // ... 其余需要的 uni API
}
```
5. 运行 `npm test`（此时应该 0 tests，但不报错）

### 第2轮：indicators 单元测试
创建 `tests/unit/indicators.test.js`，覆盖：
- EMA 计算正确性（已知答案验证）
- MACD：金叉/死叉检测，histogram 符号
- RSI：超买（>70）/ 超卖（<30）/ 中性判断
- 布林带：上轨 > 中线 > 下轨，带宽计算
- getSignalScore：范围 -2 到 +2
- getSignalLabel：返回 text + color + type
- 边界：空数组、单个值、所有值相同

### 第3轮：storage 单元测试
创建 `tests/unit/storage.test.js`，覆盖：
- getPositions：空时返回 []，有数据时 JSON parse 正确
- addPosition：追加、去重（相同 symbol 报错或更新）
- removePosition：删除指定 symbol
- updatePosition：局部 patch 合并
- getToken / setToken：读写 xq_a_token
- storage key 常量测试

### 第4轮：helpers 单元测试
创建 `tests/unit/helpers.test.js`，覆盖：
- formatPrice：小数位、千分位、负数
- formatPercent：+1.23% / -2.50%
- getMarketFromSymbol：SH/SZ/HK/US/基金 识别
- isMarketOpen：模拟不同时间
- symbolToDisplayCode：SH600519 → 600519

### 第5轮：API mock 和 API 测试
创建 `tests/mocks/xueqiu.mock.js`（标准化 mock 数据）：
```javascript
export const mockQuote = {
  symbol: 'SH600519', name: '贵州茅台', current: 1500.0,
  percent: 1.2, change: 17.8, high: 1520, low: 1490,
  open: 1495, lastClose: 1482.2, volume: 1234567,
  marketCap: 18900000000, type: 'stock'
}
export const mockKline = {
  timestamps: [1700000000000, 1700086400000],
  closes: [1480, 1495],
  volumes: [1000000, 1200000]
}
export const mockPosts = [
  { id: '123', title: '测试帖子', author: '张三', likeCount: 42, createdAt: Date.now(), url: 'https://...' }
]
```
创建 `tests/integration/api.test.js`：
- mock `uni.request`，测试 fetchQuote 数据解析
- 测试错误处理（网络超时，401 token 失效）
- 测试 fetchBatchQuote 自动分批（>20 个 symbol）
- 测试 fetchKline 返回格式正确

### 第6轮：Pinia Store 集成测试
创建 `tests/integration/store.test.js`（配合 Pinia createTestingPinia）：
- loadPositions：从 mock storage 读取，触发批量行情请求
- addPosition：调用 storage + API，更新 positions
- removePosition：从列表删除，持久化
- filteredPositions：各 filterType 正确过滤
- Computed：totalValue / totalProfit / todayProfit 计算正确
- refreshSignals：拉 K 线 → 计算指标 → 更新 position.signals

### 第7轮：持仓增删改查 E2E 流程测试
创建 `tests/e2e/portfolio-flow.test.js`（模拟完整用户流）：
```javascript
// 场景1：添加一只股票 → 查看总览 → 验证数据
// 场景2：添加一只基金 → 检查基金净值展示
// 场景3：删除持仓 → 验证总资产变化
// 场景4：多持仓分类筛选 → 验证过滤结果
// 场景5：手动刷新价格 → 验证 loading 状态
```

### 第8轮：技术信号 E2E 流程测试
创建 `tests/e2e/signals-flow.test.js`：
```javascript
// 场景1：持仓 K 线拉取 → 技术指标计算 → 信号标签展示
// 场景2：MACD 金叉 → 买入信号 → 评分 > 0
// 场景3：RSI 超买 → 卖出信号 → 评分 < 0
// 场景4：K 线数据不足（< 26 个点） → 优雅降级（不计算，显示"数据不足"）
// 场景5：综合评分边界测试（最强买入 +2，最强卖出 -2）
```

### 第9轮：错误处理和边界测试
- token 未设置时，所有 API 调用返回合理错误信息
- 网络超时时，ui 显示错误 toast
- 空持仓列表状态
- 非法证券代码（用户输入错误）
- 并发请求处理（同时刷新多只股票）

### 第10轮：测试覆盖率报告 + CI 配置
1. 运行 `npm run test` 查看所有测试通过
2. 运行 `npx vitest run --coverage` 查看覆盖率报告
3. 创建 `.github/workflows/test.yml`（CI 配置）
4. 确认测试覆盖率目标：
   - `utils/indicators.js` ≥ 90%
   - `utils/storage.js` ≥ 85%
   - `utils/helpers.js` ≥ 85%
   - `stores/portfolio.js` ≥ 75%
   - `api/xueqiu.js` ≥ 70%

### 第11-14轮：修复失败测试 + 完善覆盖
每轮：
1. 运行 `npm test 2>&1`
2. 修复所有失败的测试
3. 补充缺失的边界测试
4. git commit + push

### 第15轮：最终验证
1. `npm test` 全部通过（无 fail）
2. 生成覆盖率报告
3. 更新 README.md 加入 "测试" 章节（如何运行测试、覆盖率截图说明）
4. 最终 push

## 完成标准
所有轮次完成后输出 `STATUS: COMPLETE`：
1. `npm test` 全部通过
2. 单元测试覆盖 indicators / storage / helpers
3. 集成测试覆盖 store / api
4. E2E 流程测试覆盖持仓流程 + 技术信号流程
5. 错误处理测试存在
6. README 有测试说明
7. 15 轮全部有真实 commit + push
