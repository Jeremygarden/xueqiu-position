# Changelog

All notable changes to **xueqiu-position** are recorded here.
This project follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and uses [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-06-25

The 2.0.0 release is a **full ground-up rewrite** of the original prototype.
It was produced over a 20-round Ralph Wiggum refactor loop driven by an
AI agent: each round audited a slice of the codebase, applied focused
fixes, ran the test suite, and committed + pushed to GitHub.

### Added
- Full uni-app Vue 3 scaffold (Vite 7 + uview-plus 3) with mp-weixin & H5
  build targets.
- Pinia store `stores/portfolio.js` with positions CRUD, batch price
  refresh, signal calculation, and 7 computed getters (totals + grouping).
- Six pages: 持仓总览 (`index`), 标的详情 (`detail`), 添加持仓 (`add`),
  行情速览 (`market`), 设置 (`settings`), 帖子容器 (`webview`).
- Five reusable components: `AssetCard`, `PositionCard`, `SignalTag`,
  `PostList`, `EmptyState`.
- Pure-function technical indicator library
  (`utils/indicators.js`) — EMA, MACD, RSI, Bollinger Bands, and a
  composite −2…+2 buy/sell signal score.
- Helper + storage utilities with safe fallbacks for null/undefined
  inputs and a Node-friendly in-memory shim (so vitest can drive them
  without a uni runtime).
- Six Xueqiu API wrappers (`api/xueqiu.js`) with in-flight de-duplication
  and typed `XueqiuError` (`network` / `api` / `auth`).
- Vitest unit-test suite covering 41 cases across indicators, helpers,
  and storage. Runs via `npm test`.

### Fixed (during the refactor loop)
- `calculateMACD` now returns a neutral result when the input window is
  shorter than `slow + signal` (previously fabricated bullish/bearish
  on 3-element inputs).
- `calculateRSI` treats a flat series (no gain & no loss) as neutral 50
  instead of mis-reporting overbought 100.
- `getMarketFromSymbol` recognises bare 6-digit A-share codes
  (`600xxx` Shanghai, `000`/`300xxx` Shenzhen, `4`/`8xxxxx` BJ) in
  addition to the SH/SZ/BJ/HK/F prefixed Xueqiu canonical form.
- `isMarketOpen` switched to a proper `Asia/Shanghai` offset
  (UTC+8) so the trading-hour check works on hosts in any zone.
- Vite alias `@` rebuilt with `fileURLToPath` to avoid the
  Windows `/C:/...` leading-slash bug from the old
  `new URL().pathname` form.
- `npm test` no longer fails to boot — vitest got its own
  `vitest.config.js` so the uni Vite plugin isn't pulled in for
  unit tests.

### Documentation
- README expanded with feature list, install/run/build commands,
  step-by-step `xq_a_token` retrieval guide, test workflow, and the
  full project tree.

## [1.x.x] — pre-rewrite

Snapshot of the original scaffold; superseded by 2.0.0 and not
maintained.

## [2.0.1] — 2026-06-25 (test suite)

Added a complete Vitest test suite covering unit / integration / E2E layers.

### Added
- `tests/mocks/uni.mock.js` — global `uni` API stub (setupFile for all tests)
- `tests/mocks/xueqiu.mock.js` — canonical mock data & factory helpers
- `tests/unit/indicators.test.js` — 51 cases: EMA precision, MACD, RSI, BB, score/label
- `tests/unit/helpers.test.js` — 63 cases: formatters, market detection, isMarketOpen
- `tests/unit/storage.test.js` — 38 cases: CRUD, shim error paths, type coercion
- `tests/unit/error-handling.test.js` — 26 cases: empty portfolio, invalid codes, concurrency
- `tests/integration/api.test.js` — 49 cases: all xueqiu.js & request.js functions
- `tests/integration/store.test.js` — 38 cases: full Pinia store actions + getters
- `tests/e2e/portfolio-flow.test.js` — 28 scenarios: add/remove/filter/refresh/error-path
- `tests/e2e/signals-flow.test.js` — 22 scenarios: signal generation end-to-end
- `.github/workflows/test.yml` — CI running tests on Node 20 + 22
- Coverage thresholds enforced in `vitest.config.js`

### Metrics
- 357 tests, 11 test files, 0 failures
- Overall: 96.8% statements, 85.3% branch coverage
