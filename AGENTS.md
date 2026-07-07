# 💕 小皮爱情助手 — 智能体配置

> 本文件是地图，不是百科全书。
> 约 100 行，作为内容目录，指向 deeper sources of truth。
> 最后更新：2026-07-03

---

## 一、流水线架构

```
用户需求
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ 🎨 设计智能体 (designer)                              │
│  docs/design-docs/  ← RESEARCH.md + DESIGN_THINKING   │
│  docs/PRD.md                                          │
│  docs/DESIGN.md                                       │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 🕵️ 审核智能体 (reviewer)                              │
│  ├─ 阶段一：设计审核 → docs/REVIEW_DESIGN.md §1        │
│  ├─ 阶段二：PRD审核  → docs/REVIEW_DESIGN.md §2        │
│  ├─ 阶段三：代码审核 → docs/REVIEW_DESIGN.md §3        │
│  │    + 安全审核 6 维度                                │
│  └─ 阶段四：经验沉淀 → docs/LESSONS.md                  │
│    发现问题 → [FEEDBACK] → 打回重做                    │
│    P2 问题 → 直接修复 + commit（不经主代理）           │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 💻 代码智能体 (coder)                                  │
│  每步：实现 → 自验证 → commit → 通知                   │
│  自验证包括：npm run build + npm run dev + curl 验证   │
│  内置安全与架构规则（见 docs/arch/SECURITY.md）         │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 🕵️ 审核智能体 (reviewer) — 阶段三：代码审核           │
│  5 维度：设计一致 + 代码质量 + Bug + 兼容 + 安全      │
│  P0/P1 → [FEEDBACK type:code_redo]                    │
│  P2 → 直接修复 + commit                               │
└──────────────────────────────────────────────────────┘

每日 9:00 ─── 🛡️ 巡检守护 (watchdog)
  ├─ docs vs 代码一致性检查
  ├─ 架构规则违反扫描（组件大小/CSS变量/命名规范）
  ├─ 质量评分更新 → docs/quality/QUALITY_SCORE.md
  └─ 发现问题 → 自动开修复分支 + commit
```

---

## 二、🎨 设计智能体 (designer)

| 属性 | 值 |
|------|-----|
| **代号** | `designer` |
| **职责** | 用户需求 → 竞品分析 → 设计思路 → PRD → 设计方案 |
| **触发** | 用户提出新功能/新项目 |
| **产出目录** | `docs/design-docs/` + `docs/PRD.md` + `docs/DESIGN.md` |

### 标准产出

| 产出 | 路径 | 说明 |
|------|------|------|
| 竞品分析 | `docs/design-docs/RESEARCH.md` | ≥5 款竞品，每款具体交互细节 |
| 设计思路 | `docs/design-docs/DESIGN_THINKING.md` | 用户场景拆解、方案演变、情感旅程 |
| 需求文档 | `docs/PRD.md` | 字段级 JSON 定义、数据流、异常矩阵、验收标准 |
| 设计方案 | `docs/DESIGN.md` | ASCII 线框图、色彩/字体/间距系统 |
| 执行计划 | `docs/exec-plans/active/` | 当前阶段的拆解步骤（新增） |

### 设计约束（从 OpenAI 学到）

1. **代理可读性优先** — 每个设计决策问：「这个信息智能体能读到吗？」
2. **AGENTS.md 是目录** — 约 100 行，纯指针，不放详细内容
3. **docs/ 分层** — design-docs/ + exec-plans/ + quality/ + arch/ + references/
4. **机械约束 > 文档约束** — 规则尽量写入 linter，不写入 .md

### 派发模板

```
delegate_task(
    role="leaf",
    context=f"""
    项目：{name}
    路径：{path}
    技术栈：{stack}
    已完成：{checkpoint}
    
    设计原则：
    1. 所有用户输入用 {{ }} 渲染，禁止 v-html
    2. 敏感权限在用户操作时请求
    3. 密码必须哈希，不存明文
    4. 数据字段遵循 PRD 定义
    """,
    goal="产出完整的设计文档集到 docs/design-docs/ 和 docs/ 下"
)
```

---

## 三、🕵️ 审核智能体 (reviewer)

| 属性 | 值 |
|------|-----|
| **代号** | `reviewer` |
| **职责** | 4 阶段审核 + 安全审查 + 经验沉淀 + P2 直接修复 |
| **触发** | 设计智能体完成 / 代码智能体完成 |
| **产出** | `docs/REVIEW_DESIGN.md`（追加）+ `docs/LESSONS.md` + `docs/quality/` |

### 四阶段工作流

```
阶段一：设计审核
  ├─ 需求完整性（功能遗漏？边界情况？空状态？输入端？）
  ├─ 技术可行性（纯前端？存储容量？iOS 兼容？）
  ├─ 交互一致性（导航断点？返回闭环？多入口统一？）
  └─ 优先级合理性（P0/P1/P2 划分合理？需升降级？）

阶段二：PRD 审核
  ├─ 字段完整性（JSON 类型/默认值/枚举明确？）
  ├─ 数据流清晰度（读写闭环？页面间传递完整？）
  ├─ 异常覆盖度（边界情况/错误路径有兜底？）
  ├─ 验收可测性（可量化可测试？）
  ├─ 设计一致性（PRD vs DESIGN 数字/行为一致？）
  └─ 容量预估（理想值/预期值/最坏值？）

阶段三：代码审核（5 维度）
  ├─ 设计一致性（代码 vs DESIGN.md + PRD.md）
  ├─ 代码质量（Composition API？死代码？组件拆分？）
  ├─ Bug 检测（边界/异步/导航闭环/XSS）
  ├─ 移动端兼容（iOS vibrate 降级/safe-area/PWA）
  └─ 🛡️ 安全审查（6 维度，见下文）

阶段四：经验沉淀
  └─ 写入 LESSONS.md（问题模式→根因→预防措施）
```

### 🛡️ 安全审查 6 维度（代码审核内置）

| 维度 | 检查项 | P0/P1 |
|------|--------|-------|
| **XSS** | 所有用户输入用 `{{ }}` 而非 `v-html`？localStorage 注入风险？ | P0 |
| **敏感数据** | 密码哈希？API key 硬编码？PII 泄露？ | P0 |
| **权限安全** | 摄像头/通知在用户操作时请求？拒绝时优雅降级？ | P1 |
| **依赖安全** | `npm audit` 干净？非必要依赖？已知漏洞？ | P1 |
| **传输安全** | CSP 配置？HTTPS？manifest scope 安全？ | P1 |
| **输入验证** | 长度限制？特殊字符？文件导入类型/大小校验？ | P1 |

### 反馈协议

```
# P0/P1 → 触发重做
[FEEDBACK] type: design_redo | code_redo
[FEEDBACK] severity: P0 | P1
[FEEDBACK] target: [文件路径]
[FEEDBACK] problem: [问题描述]
[FEEDBACK] solution: [修复方案]
---

# P2 → 直接修复，不阻塞，不经主代理
[FEEDBACK] severity: P2
[FEEDBACK] action: direct_fix
[FEEDBACK] fix: git commit -m "fix: ..."
```

### 派发模板

```
delegate_task(
    context=f"""
    阶段：{stage_name}
    审核维度：{dimensions_list}
    设计文档：docs/DESIGN.md + docs/PRD.md
    已有审核：docs/REVIEW_DESIGN.md
    安全规则：docs/arch/SECURITY.md
    
    规则：
    - P0/P1 → 输出 [FEEDBACK] 格式
    - P2 → 直接修复 + commit
    """,
    goal="执行 {stage_name}，追加写入 REVIEW_DESIGN.md"
)
```

---

## 四、💻 代码智能体 (coder)

| 属性 | 值 |
|------|-----|
| **代号** | `coder` |
| **职责** | 按设计文档 + PRD 实现功能，内置自验证 + 安全编码 |
| **触发** | 审核通过（无 P0 阻塞） |
| **产出** | 修改 `src/` 目录代码，每功能 commit |

### 安全编码规则（内置，不可协商）

```yaml
security_rules:
  - rule: "密码必须哈希存储"
    severity: P0
    check: "localStorage 中 password 值不以 $2b$ 开头则阻断"
    
  - rule: "所有用户输入用 {{ }} 渲染"
    severity: P0
    check: "禁止 v-html，grep -r 'v-html' src/ 有结果则失败"
    
  - rule: "敏感权限在用户操作时请求"
    severity: P1
    check: "Notification.requestPermission / getUserMedia 不在 mounted() 中调用"
    
  - rule: "用户输入有长度上限"
    severity: P1
    check: "所有 input/textarea 有 maxlength 属性"
    
  - rule: "不把 API key 硬编码到前端"
    severity: P0
    check: "grep -ri 'api[_-]?key\|apikey\|secret\|token' src/ --include='*.{js,vue}'"
    
  - rule: "CSP 已配置"
    severity: P1
    check: "index.html 中有 <meta http-equiv='Content-Security-Policy'>"
```

### 架构规则（机械强制执行）

```yaml
architecture_rules:
  - rule: "组件最大 500 行"
    check: "wc -l src/views/*.vue | awk '$1 > 500 {print}'"
    action: "标记需拆分，输出警告"
    
  - rule: "CSS 必须引用变量，不硬编码颜色"
    check: "grep -E '#[0-9a-fA-F]{3,6}' src/**/*.vue | grep -v 'var(--'"
    action: "标记需修复"
    
  - rule: "禁止 console.log（除临时调试）"
    check: "grep -r 'console\.log' src/ --include='*.{js,vue}'"
    action: "警告，提醒清理"
    
  - rule: "导入方向：component 可导入 composable，composable 不可导入 component"
    check: "grep 'from.*views' src/composables/*.js"
    action: "阻断"
```

### 自验证步骤（每功能执行）

```yaml
self_verification:
  1. build: "npm run build"
     on_fail: "分析错误 → 修复 → 重试，最多 3 次 → 仍失败则报主代理"
     
  2. dev_server: "npm run dev -- --host 0.0.0.0"
     check: "curl -s -o /dev/null -w '%{http_code}' http://localhost:5173"
     expect: "200"
     
  3. page_check: "curl -s http://localhost:5173 | grep -c 'app'"
     expect: ">0"
     
  4. security_check: "执行安全编码规则的 grep 检查"
     expect: "无违反"
     
  5. commit: "git add . && git commit -m 'feat: ...'"
     
  # 注意：步骤 2 和 3 需要先启动 dev server（background=true）
  # 验证完成后 kill dev server
```

### 自愈机制

```
# 构建失败时，不用等主代理
1. 读取错误输出
2. 分析根因（语法错误？缺失文件？依赖问题？）
3. 修复
4. 重试 npm run build
5. 最多 3 次重试
6. 3 次仍失败 → 输出 [FEEDBACK] 给主代理
```

---

## 五、🛡️ 巡检守护 (watchdog)

| 属性 | 值 |
|------|-----|
| **代号** | `watchdog` |
| **职责** | 每日扫描 docs vs 代码一致性 + 代码质量 + 架构规则 + 质量评分 |
| **触发** | cron 每日 9:00 |
| **产出** | 巡检报告 + 修复分支 + QUALITY_SCORE.md 更新 |

### 扫描范围（比之前扩展）

```yaml
scan_scope:
  # 原有：文档一致性
  doc_vs_code:
    script: "python3 ~/.hermes/scripts/doc-watchdog.py {project_path}"
    check: "docs/ 描述 vs 代码实现是否一致"
    fix: "修文档不修代码"
  
  # 新增：代码质量
  code_quality:
    - "组件行数 > 500 → 标记需拆分"
    - "CSS 硬编码颜色 → 标记需改用变量"
    - "console.log → 警告"
    - "未使用的 import → 警告"
  
  # 新增：架构规则
  architecture:
    - "导入方向违反 → 阻断并标记"
    - "命名规范违反 → 警告"
  
  # 新增：质量评分更新
  quality_score:
    output: "docs/quality/QUALITY_SCORE.md"
    dimensions:
      - "设计一致性"
      - "代码质量"
      - "安全等级"
      - "架构合规"
      - "测试覆盖（如有）"
    scoring: "1-5 分，记录趋势"
```

### 修复原则

1. **修文档不修代码** — 代码是运行时事实
2. **不过度修复** — 只修明显不一致，规划性描述保留
3. **不删有用信息** — 规划中功能标注「待实现」而非删除
4. **P2 直接修** — 不经主代理中转

---

## 六、文档树结构（参照 OpenAI 分层）

```
love-app/
├── AGENTS.md                ← 本文件（~100 行，纯目录）
├── CHECKPOINT.md            ← 流水线状态检查点
├── README.md                ← 项目说明（面向人类）
├── src/                     ← 源代码
├── scripts/                 ← 工具脚本
│   ├── ux-writing-lint.cjs  ← UX 文案 linter
│   └── check-text-consistency.cjs ← 文案一致性检查
├── docs/
│   ├── design-docs/
│   │   ├── RESEARCH.md      ← 竞品分析
│   │   └── DESIGN_THINKING.md ← 设计思路
│   ├── exec-plans/
│   │   ├── active/          ← 当前执行计划
│   │   └── completed/       ← 已完成计划归档
│   ├── quality/
│   │   └── QUALITY_SCORE.md ← 质量评分+趋势
│   ├── arch/
│   │   ├── ARCHITECTURE.md  ← 架构分层+依赖规则
│   │   └── LAYERING.md      ← layer 定义+规则
│   ├── references/
│   │   └── design-system.md ← 设计系统参考
│   ├── DESIGN.md            ← 最终设计方案
│   ├── PRD.md               ← 产品需求文档
│   ├── REVIEW_DESIGN.md     ← 审核记录（持续追加）
│   ├── LESSONS.md           ← 经验沉淀
│   ├── PROCESS.md           ← 流水线协议
│   ├── SECURITY.md          ← 安全策略
│   ├── UX_WRITING_QA.md     ← UX 文案质量审核规范
│   └── CROSS_COMPARISON.md  ← 与 OpenAI 文章比对
├── package.json
└── vite.config.js
```

---

## 七、快速启动

```bash
# 从检查点恢复
cat CHECKPOINT.md
git log --oneline -5

# 启动开发服务器
npm run dev

# 构建验证
npm run build
```

---

> 本配置基于小皮爱情助手 v2.0 实践 × OpenAI Harness Engineering 方法论融合
> 最后更新：2026-07-03