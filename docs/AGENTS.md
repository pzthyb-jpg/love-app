# 小皮爱情助手 — Agent 配置

> 本文件是地图，不是百科全书。约 100 行，纯指针，指向 deeper sources of truth。

---

## 流水线

```
用户需求 → 🎨 设计 → 🕵️ 审核 → 💻 代码 → 🕵️ 审核 → 🛡️ 巡检
```

---

## 文档索引

| 目录 | 内容 |
|------|------|
| `design-docs/` | PRD、设计方案、竞品调研、UX文案QA |
| `exec-plans/` | 当前迭代执行计划 |
| `quality/` | 质量评分、UX审计报告、审查流程 |
| `arch/` | 安全规则、技术架构审查 |
| `references/` | 设计系统、Agent 工作流规范 |
| `sprints/` | 按日期归档的迭代产出 |

---

## Agent 角色

| 代号 | 职责 | 产出目录 |
|------|------|----------|
| `designer` | 需求分析 → 调研 → 设计 | `design-docs/` |
| `reviewer` | 4阶段审核 + 安全 + 沉淀 | `quality/` + `REVIEW.md` |
| `coder` | 编码 + 自验证 + commit | `src/` |
| `watchdog` | 每日一致性 + 质量扫描 | `quality/` |

完整工作流：`docs/references/AGENTS.md`

---

## 安全编码规则（不可协商）

1. 用户输入 `{{ }}` 渲染，禁止 `v-html`
2. 密码 PBKDF2-SHA256 哈希 + 随机盐值（16字节） + 100,000 次迭代，不存明文
3. 输入有 `maxlength`
4. 权限在用户操作时请求
5. 不硬编码 API key（Supabase Key 和高德 Key 均通过 `.env` 注入）
6. CSP 已配置

完整规则：`docs/arch/SECURITY_REVIEW.md`

---

## 版本控制规范（不可协商）

### 隔离原则
- **禁止在 master/main 上直接修改**，所有变更必须在专属 worktree 中
- 分支命名：`agent-[领域]/[类型]/[英文简述]`，如 `agent-ui/feat/sprint7-8-animations`
- 严禁跨 worktree 越权操作

### 提交粒度
- 原子化：每完成一个功能闭环或修复一个错误点即 commit
- 允许多次试错 commit，但单 commit 逻辑必须内聚

### Commit Message 模板
```
🤖 [Agent: 角色名] [type]: 概述
• 修改明细 1
• 修改明细 2
• 验收结果：npm run build 验证通过
```

---

## 自验证步骤（每功能）

1. `npm run build` → 失败则自修复 ≤3 次
2. `npm run dev` + curl 验证
3. 安全 grep 检查
4. `git commit`（按上方版本控制规范）

---

## 技术栈

Vue 3 + Vite + PWA + Vant 4 | Composition API 优先 | Supabase 后端（PostgreSQL + 自建 app_users 认证） | 高德 POI 搜索 | localStorage + IndexedDB 持久化 | 手写 reactive 单例状态管理（dataStore.js）

### 关键数字（从代码统计）
- 彩虹屁模板：36 个基础模板（按 beauty/makeup/energy/special/morning/noon/evening 分类，通过时间段 + 随机组合生成变体）
- 餐厅数据：高德 POI 搜索实时获取（非预设数据）
- 视图组件：13 个 | 可复用组件：6 个 | Composables：14 个

---

## 快速启动

```bash
cat CHECKPOINT.md          # 流水线状态
git log --oneline -5       # 最近提交
npm run dev                # 开发
npm run build              # 构建验证
npx playwright test        # 运行测试
```

---

> 最后更新：2026-07-18 | 基于 Harness Engineering × OpenAI 方法论
