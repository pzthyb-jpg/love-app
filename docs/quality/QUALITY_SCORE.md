# 📊 质量评分 — QUALITY_SCORE.md

> 每个模块评分（1-5 分）+ 趋势追踪
> 每次审核/巡检后更新

## 📈 综合评分

**综合评分：4.0/5.0** ｜ **趋势：🟡 待改进**

> 较上一轮下降 0.2，主因：1) Photo.vue 超 500 行需拆分 2) CSS 硬编码颜色治理未完成 3) 新增模块评分取均值后拉低综合分

## 📊 模块评分

| 模块 | 评分 | 设计一致 | 代码质量 | 安全等级 | 架构合规 | 文案质量 | 趋势 |
|------|:----:|:--------:|:--------:|:--------:|:--------:|:--------:|:----:|
| **Home.vue** 首页 | 4.5 | 5 | 4 | 5 | 4 | 4 | 🟢 |
| **Photo.vue** 拍照 | 3.5 | 4 | 3 | 4 | 3 | 4 | 🔴 超500行 |
| **Lunch.vue** 午餐 | 4.0 | 4 | 4 | 4 | 4 | 3.5 | 🟡 |
| **Wish.vue** 愿望池 | 4.5 | 5 | 4 | 5 | 4 | 4 | 🟢 |
| **Settings.vue** 设置 | 4.0 | 4 | 4 | 4 | 4 | 4 | 🟡 |
| **MessagesAdmin.vue** 留言管理 | 3.5 | 4 | 3 | 4 | 3 | 3.5 | 🟡 需拆分 |
| **Anniversary.vue** 纪念日 | 4.0 | 4 | 4 | 4 | 4 | 4 | 🟢 新增 |
| **LoginPage.vue** 登录页 | 4.0 | 4 | 4 | 5 | 4 | 4 | 🟢 新增 |
| **Composables** | 4.5 | 5 | 4 | 5 | 4 | — | 🟢 |
| **dataStore** | 4.0 | 4 | 4 | 4 | 4 | 3 | 🟡 |
| **全局样式** | 3.5 | 4 | 3 | 5 | 3 | — | 🔴 硬编码颜色 |
| **PWA 配置** | 4.0 | 4 | 4 | 5 | — | — | 🟢 |
| **安全审计** | 4.5 | — | — | 5 | — | — | 🟢 |
| **UX Writing QA** | 4.0 | — | — | — | — | 4 | 🟡 |

## 🔴 RED — 立即修复

| 编号 | 问题 | 位置 | 说明 |
|------|------|------|------|
| ARCH-001 | Photo.vue 超 500 行 | `src/views/Photo.vue` (1006行) | 违反「组件最大 500 行」架构规则，需拆分子组件 |
| STYLE-001 | CSS 硬编码颜色 | `src/App.vue`, `src/components/LunchWheel.vue` | 大量 `#hex` 颜色未使用 CSS 变量，违反架构规则 |

## 🟡 YELLOW — 改进建议

| 编号 | 问题 | 位置 | 说明 |
|------|------|------|------|
| ARCH-002 | MessagesAdmin.vue 接近上限 | `src/views/MessagesAdmin.vue` (452行) | 接近 500 行限制，新增功能时需同步拆分 |
| DOC-001 | README.md UI库声明过时 | `README.md:26` | 「纯手写 CSS（无 UI 组件库）」→ 实际使用 Vant 4 |
| QUAL-001 | QUALITY_SCORE.md 版本旧 | `QUALITY_SCORE.md` | 上次评分停留在 2026-07-03，缺少新增模块 |
| VER-001 | console.error/warn 残留 | `src/composables/*.js`, `src/App.vue` | 运行时日志应在生产环境消除（可用 Vite 构建时替换） |

## 🟢 GREEN — 良好实践

| 维度 | 表现 |
|------|------|
| 导入方向 | ✅ composables 不导入 views，方向正确 |
| console.log | ✅ 无 console.log，仅 warn/error 用于异常处理 |
| 高德 API | ✅ 完整接入 IP 定位 + 逆地理编码 + POI 搜索 |
| 安全编码 | ✅ 无 v-html、密码哈希、CSP 配置 |
| 架构分层 | ✅ 旧 js/*.js → 已迁移到 views/components/composables/stores |
| 模板系统 | ✅ 约 30 基础模板 + 6 分类（beauty/makeup/energy/special/morning/noon/evening），组合产生多样化输出 |
| Vant 4 | ✅ 通过 unplugin-vue-components 按需引入，配合自定义主题 |

## 📐 技术债务追踪

| 债务 | 优先级 | 预估工时 | 状态 |
|------|--------|----------|------|
| Photo.vue 拆分 | 🔴 高 | 4h | 待实施 |
| CSS 变量治理 | 🟡 中 | 3h | 待实施 |
| 运行时日志消除 | 🟡 低 | 1h | 待实施 |
| MessagesAdmin.vue 拆分 | 🟡 低 | 2h | 待规划 |

## 📋 架构规则合规检查

| 规则 | 状态 | 证据 |
|------|------|------|
| 组件最大 500 行 | ❌ 违反 | Photo.vue 1006 行 |
| CSS 必须引用变量 | ❌ 违反 | App.vue 12处 + LunchWheel.vue 20处硬编码 |
| 禁止 console.log | ✅ 合规 | 仅 warn/error |
| 导入方向规则 | ✅ 合规 | composables 无 views 引用 |
| 未使用 import | 🟡 待检 | 需做 dead code 检测 |

---

> 最后更新：2026-07-13 | 巡检：doc-watchdog
> 下一轮预期：处理 Photo.vue 拆分 + CSS 变量治理后，综合评分回升至 4.3
