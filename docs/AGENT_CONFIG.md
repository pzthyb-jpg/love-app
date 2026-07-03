# 🏗️ 多智能体流水线配置 — Agent Configuration

> 标准化定义每个代理角色的工作流、输入输出、质量门禁、派发模板
> 目标：配置化驱动，无需手写每次派发

---

## 一、架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                  多智能体流水线 (Pipeline)                    │
│                                                             │
│  用户需求                                                    │
│     │                                                        │
│     ▼                                                        │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐  │
│  │ 🎨 DESIGN │──▶│ 🕵️ REVIEW│──▶│ 💻 CODE  │──▶│ 🕵️ REVIEW│  │
│  │ (设计)    │   │ (审核)   │   │ (代码)   │   │ (再审核) │  │
│  └──────────┘   └────┬─────┘   └────┬─────┘   └────┬────┘  │
│       ▲              │              │              │       │
│       │   P0/P1 退回 │    P0/P1 退回│    P0/P1 退回│       │
│       └──────────────┘              └──────────────┘       │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 🛡️ WATCHDOG (巡检守护) — 每日 9:00 自动运行        │     │
│  │  扫描 docs/ vs 代码 → 发现不一致 → 创建分支修复     │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、🎨 Agent A: 设计智能体 (Design)

### 角色定义

| 属性 | 值 |
|------|-----|
| **代号** | `designer` |
| **职责** | 产品需求分析 → 竞品调研 → 设计思路 → PRD → 设计方案 |
| **触发条件** | 用户提出新功能/新项目需求 |
| **产出目录** | `{project_root}/docs/` |
| **前置依赖** | 无（可独立运行） |
| **后置依赖** | 审核智能体阶段一+二 |

### 标准工作流

```
1. 读取项目代码库（如已有项目）
2. 产出 RESEARCH.md（竞品分析，至少 5 款同类产品）
3. 产出 DESIGN_THINKING.md（设计思路、用户场景、决策记录）
4. 产出 PRD.md（产品需求文档，字段级定义）
5. 产出 DESIGN.md（最终设计方案，含 ASCII 线框图）
6. 产出 PROCESS.md（流水线协议，可选）
7. 每产出一份文档就 git commit
```

### 输入模板

```yaml
# dispatch 时填充此模板
context_template:
  project_name: "{project_name}"
  project_path: "{project_path}"
  existing_code: "{codebase_overview}"
  user_requirements: "{user_needs}"
  tech_stack: "{current_tech}"

goal_template: |
  为 {project_name} 产出完整的中间过程设计文档。
  先完整阅读整个代码库，然后依次产出以下文件到 docs/：
  1. RESEARCH.md — 竞品分析（至少 5 款同类产品，具体交互细节）
  2. DESIGN_THINKING.md — 设计思路、用户场景拆解、决策记录
  3. PRD.md — 产品需求文档（字段级 JSON 定义、数据流、异常处理）
  4. DESIGN.md — 最终设计方案（功能列表、UI 线框图、色彩/字体系统）
  5. PROCESS.md — 流水线协议（可选）
  所有文档用中文，每完成一份就 git commit。
```

### 验收标准

| 检查项 | 要求 |
|--------|------|
| RESEARCH.md | ≥5 款竞品，每款有具体交互细节（非笼统概括） |
| DESIGN_THINKING.md | 有用户场景拆解 + 功能 WHY-方案演变 + 情感旅程 |
| PRD.md | 字段级 JSON 定义 + 数据流图 + 异常矩阵 + 验收标准 |
| DESIGN.md | 含 ASCII 线框图 + 完整色彩/字体/间距/圆角系统 |
| 一致性 | 4 份文档间关键数字和事实一致 |

---

## 三、🕵️ Agent B: 审核智能体 (Review)

### 角色定义

| 属性 | 值 |
|------|-----|
| **代号** | `reviewer` |
| **职责** | 审查设计/PRD/代码质量，沉淀经验，触发反馈闭环 |
| **触发条件** | 设计智能体完成 / 代码智能体完成 |
| **产出** | `docs/REVIEW_DESIGN.md`（追加写入）+ `docs/LESSONS.md` |
| **前置依赖** | 设计智能体（阶段一/二）/ 代码智能体（阶段三） |
| **后置依赖** | 无（发现问题则触发 FEEDBACK 回退） |

### 四阶段工作流

```
阶段一：设计审核
  ├─ 需求完整性（功能遗漏？边界情况？空状态？输入缺失？）
  ├─ 技术可行性（纯前端能否实现？存储容量？iOS兼容性？）
  ├─ 交互一致性（导航有断点？返回路径闭环？多入口统一？）
  └─ 优先级合理性（P0/P1/P2 划分合理？需升级/降级？）

阶段二：PRD 审核
  ├─ 字段完整性（JSON 类型/默认值/枚举明确？）
  ├─ 数据流清晰度（读写路径闭环？页面间传递完整？）
  ├─ 异常覆盖度（边界情况/错误路径有兜底？）
  ├─ 验收可测性（验收标准可量化可测试？）
  ├─ 设计一致性（PRD vs DESIGN 数字/行为一致？）
  └─ 容量预估（理想值/预期值/最坏值都给了？）

阶段三：代码审核
  ├─ 设计一致性（代码 vs DESIGN.md/PRD.md）
  ├─ 代码质量（Vue 3 Composition API? 死代码？组件拆分？）
  ├─ Bug 检测（边界情况？异步错误？导航闭环？XSS？）
  ├─ 移动端兼容性（iOS vibrate 降级？safe-area？）
  └─ 安全审查（见下文）

阶段四：经验沉淀
  └─ 写入 LESSONS.md（问题模式 → 根因 → 预防措施）
```

### 安全审查维度（融入阶段三）

| 维度 | 检查项 | P0/P1 |
|------|--------|-------|
| **XSS** | 所有用户输入用 `{{ }}` 而非 `v-html`？localStorage 注入风险？ | P0 |
| **敏感数据** | 密码/Token 硬编码？API key 在前端？PII 泄露？ | P0 |
| **权限安全** | 摄像头/通知在用户操作时请求？拒绝时有优雅降级？ | P1 |
| **依赖安全** | `npm audit` 干净？非必要依赖？已知漏洞？ | P1 |
| **传输安全** | CSP 配置？HTTPS 强制？manifest scope 安全？ | P1 |
| **输入验证** | 长度限制？特殊字符过滤？文件导入类型/大小校验？ | P1 |

### 输入模板

```yaml
# 阶段三：代码审核 派发模板
context_template:
  project_name: "{project_name}"
  project_path: "{project_path}"
  tech_stack: "{tech_stack}"
  design_docs:
    - docs/DESIGN.md
    - docs/PRD.md
  previous_reviews:
    - docs/REVIEW_DESIGN.md (阶段一+二)
    - docs/LESSONS.md
  code_files: "{all_source_files}"
  checkpoint: CHECKPOINT.md

goal_template: |
  执行代码审核的 5 个维度：
  1. 设计一致性 — 比较代码 vs DESIGN.md + PRD.md
  2. 代码质量 — Vue 3 Composition API？死代码？组件拆分？
  3. Bug 检测 — 边界情况、异步错误、导航闭环
  4. 移动端兼容性 — iOS 降级、safe-area、PWA
  5. 安全审查 — XSS/敏感数据/权限/依赖/传输/输入验证
  
  每个问题标注 P0/P1/P2 严重程度。
  P0/P1 输出 [FEEDBACK] 格式触发反馈闭环。
  追加写入 docs/REVIEW_DESIGN.md §阶段三。
```

### 反馈协议

```
[FEEDBACK] type:    design_redo | code_redo
[FEEDBACK] severity: P0 | P1 | P2
[FEEDBACK] target:   [文件路径]
[FEEDBACK] problem:  [问题描述]
[FEEDBACK] solution: [建议修复方案]
```

- **P0/P1** → 触发重做 → 修正后重新进入审核
- **P2** → 记录不阻塞，标记 `[OPTIONAL]`

---

## 四、💻 Agent C: 代码智能体 (Code)

### 角色定义

| 属性 | 值 |
|------|-----|
| **代号** | `coder` |
| **职责** | 按设计文档 + PRD 实现功能代码 |
| **触发条件** | 审核智能体阶段一+二通过（无 P0 阻塞） |
| **产出** | 修改 `src/` `public/` 目录下的代码文件 |
| **前置依赖** | 审核智能体阶段一+二 |
| **后置依赖** | 审核智能体阶段三 |

### 标准工作流

```
1. 读取 CHECKPOINT.md → 确认已完成步骤
2. 读取 PRD.md + DESIGN.md → 理解完整需求
3. 读取现有代码 → 避免重复
4. 按步骤顺序实现（每步一个 git commit）
5. 每步完成后 npm run build 验证
6. 全部完成后合并到 main
```

### 安全编码规则（内建于代码智能体）

| 规则 | 说明 | 违反后果 |
|------|------|---------|
| 🔒 **密码哈希** | 不存明文密码，用 SHA-256 或更高 | P0 |
| 🔒 **{{ }} 渲染** | 所有用户输入用 Vue 插值，禁止 `v-html` | P0 |
| 🔒 **权限请求** | 摄像头/通知在用户点击时请求，非页面加载 | P1 |
| 🔒 **输入限制** | 用户输入有长度上限（maxlength） | P1 |
| 🔒 **CSP** | index.html 配置 Content-Security-Policy | P1 |
| 🔒 **无 API key** | 不把任何 API key/secret 硬编码到前端代码 | P0 |

### 输入模板

```yaml
context_template:
  project_name: "{project_name}"
  project_path: "{project_path}"
  tech_stack: "{tech_stack}"
  design_docs:
    - docs/PRD.md
    - docs/DESIGN.md
  checkpoint: CHECKPOINT.md
  already_done: "{completed_steps_and_commits}"
  pending_steps: "{remaining_steps}"
  security_rules: "{security_constraints}"

goal_template: |
  实现 {project_name} 的下一个步骤。
  已完成的步骤（跳过）：{done_steps}
  从 {next_step} 开始实现：{remaining_description}
  
  安全约束（必须遵守）：
  1. 密码必须哈希存储，不存明文
  2. 所有用户输入用 {{ }} 渲染，不用 v-html
  3. 敏感权限在用户操作时请求
  4. 用户输入有长度限制
  5. 不把任何 API key 硬编码到前端
  
  每完成一个功能就 git commit。完成后 npm run build 验证。
```

### 步骤定义（Phase 结构）

```yaml
phases:
  phase_1_p0:
    name: "核心功能 MVP"
    steps:
      - id: "init"
        desc: "初始化项目（技术栈脚手架）"
      - id: "infra"
        desc: "基础设施（路由/数据层/全局样式）"
      - id: "home"
        desc: "首页仪表盘"
      - id: "photo"
        desc: "拍照打卡 + 照片墙 + 成就系统"
      - id: "lunch"
        desc: "午餐转盘"
      - id: "wish"
        desc: "愿望池"
      - id: "messages"
        desc: "留言管理端"
      - id: "settings"
        desc: "设置页"
      - id: "global_enhance"
        desc: "全局增强（Toast/空状态/引导/触感）"
      - id: "security"
        desc: "安全加固（密码哈希/CSP/权限优化）"

  phase_2_p1:
    name: "核心增强"
    steps:
      - id: "indexeddb"
        desc: "IndexedDB 照片存储"
      - id: "reminder_custom"
        desc: "自定义提醒时间"
      - id: "lunch_enhance"
        desc: "午餐增强（导航/收藏/统计）"
      
  phase_3_p2:
    name: "锦上添花"
    steps:
      - id: "compliment_upgrade"
        desc: "彩虹屁模板增强"
      - id: "mini_game"
        desc: "小游戏彩蛋"
      - id: "real_restaurant"
        desc: "真实餐厅数据接入"
```

---

## 五、🛡️ Agent D: 巡检守护进程 (Watchdog)

### 角色定义

| 属性 | 值 |
|------|-----|
| **代号** | `watchdog` |
| **职责** | 每日自动扫描 docs/ vs 代码，修复不一致 |
| **触发条件** | cron 定时（每日 9:00） |
| **产出** | 巡检报告 + 修复分支 + commit |
| **前置依赖** | 项目已部署到服务器 |
| **后置依赖** | 无（独立运行） |

### 标准工作流

```
1. 运行巡检脚本 ~/.hermes/scripts/doc-watchdog.py
2. 分析脚本输出的不一致问题
3. 对每个问题：确认是真实不一致还是误报
4. 创建修复分支 docs-fix-YYYYMMDD
5. 修复文档（以代码为准，不改代码匹配文档）
6. commit + 输出巡检报告
7. 无问题 → 报告"一切正常"
```

### 配置

```yaml
name: "love-app-doc-watchdog"
schedule: "0 9 * * *"
workdir: "{project_path}"
script: "python3 ~/.hermes/scripts/doc-watchdog.py {project_path}"
skills:
  - "love-app-doc-watchdog"
toolsets:
  - "terminal"
  - "file"
```

### 修复原则

| 原则 | 说明 |
|------|------|
| 🎯 **修文档不修代码** | 代码是运行时事实，文档是描述 |
| 🎯 **不过度修复** | 只修明显不一致，规划性描述保留 |
| 🎯 **不删有用信息** | 规划中功能标注"待实现"而非删除 |

---

## 六、流水线标准执行流程

### 首次启动

```yaml
sequence:
  - agent: designer
    dispatch: "立即"
    context: "用户原始需求 + 代码库现状"
    
  - agent: reviewer
    dispatch: "designer 完成"
    stage: 1+2
    context: "designer 的 4 份产出"
    
  - agent: coder
    dispatch: "reviewer 阶段一+二通过"
    phase: "phase_1_p0"
    context: "designer 产出 + reviewer 反馈"
    
  - agent: reviewer
    dispatch: "coder 阶段一完成"
    stage: 3
    context: "code 产出 + designer 产出"
    
  - agent: watchdog
    dispatch: "持续运行（cron 每日 9:00）"
    
  - repeat: "如有 P0/P1 反馈，回溯对应 agent"
```

### 中断恢复

```yaml
on_resume:
  1. read_memory: "检查点路径"
  2. read_file: "CHECKPOINT.md"
  3. terminal: "git log --oneline -5"
  4. compare: "CHECKPOINT.md vs git log 交叉验证"
  5. dispatch: "从下一步继续"
```

### 冲突处理

```yaml
conflicts:
  - case: "CHECKPOINT 比 git log 旧"
    action: "以 git log 为准，更新 CHECKPOINT"
  - case: "git log 比 CHECKPOINT 旧"
    action: "以 CHECKPOINT 下一步动作为准"
  - case: "两个子代理同时改同一文件"
    action: "取后 commit 版本，标记需重新审核"
```

---

## 七、技能映射

| Skill | 对应配置 |
|-------|---------|
| `multi-agent-design-pipeline` | 流水线核心配置（含反馈协议 + 审核维度 + 安全检查） |
| `checkpoint-recovery` | 容错配置（断点续跑 + 冲突处理） |
| `love-app-doc-watchdog` | 巡检配置（具体项目实现） |
| `requesting-code-review` | 代码审查门禁 |
| `plan` | 计划编写 |

---

## 八、YAML 化的代理配置（未来目标）

```yaml
# agents.yaml — 代理配置主文件
pipeline:
  name: "love-app"
  root: "/Users/wanghongbo/love-app"
  checkpoint: "CHECKPOINT.md"

global_rules:
  commit_frequency: "每功能一次"
  build_verify: "npm run build"
  language: "中文（文档）/ 英文（commit message）"
  tech_stack: "Vue 3 + Vite + Vue Router"
  design_style: "ZA Bank → 温暖恋人版（粉紫渐变 + 圆润卡片）"

designer:
  outputs:
    - "docs/RESEARCH.md"
    - "docs/DESIGN_THINKING.md"
    - "docs/PRD.md"
    - "docs/DESIGN.md"
  review_dimensions:
    - "需求完整性"
    - "技术可行性"
    - "交互一致性"
    - "优先级合理性"

reviewer:
  design_review_dimensions:
    - "需求完整性"
    - "技术可行性"
    - "交互一致性"
    - "优先级合理性"
  prd_review_dimensions:
    - "字段完整性"
    - "数据流清晰度"
    - "异常覆盖度"
    - "验收可测性"
    - "设计一致性"
    - "容量预估"
  code_review_dimensions:
    - "设计一致性"
    - "代码质量"
    - "Bug 检测"
    - "移动端兼容性"
    - "安全审查"
  feedback_format:
    type: "design_redo | code_redo"
    severity: "P0 | P1 | P2"
    fields: ["target", "problem", "solution", "context"]

coder:
  security_rules:
    - "密码哈希存储，不存明文"
    - "用户输入用 {{ }} 渲染，不用 v-html"
    - "敏感权限在用户操作时请求"
    - "输入有长度限制"
    - "不硬编码 API key"
    - "配置 CSP"
  phases:
    phase_1_p0:
      name: "核心功能 MVP"
      steps: ["init", "infra", "home", "photo", "lunch", "wish", "messages", "settings", "global", "security"]
    phase_2_p1:
      name: "核心增强"
      steps: ["indexeddb", "reminder", "lunch_enhance"]
    phase_3_p2:
      name: "锦上添花"
      steps: ["compliment", "mini_game", "real_restaurant"]

watchdog:
  schedule: "0 9 * * *"
  script: "python3 ~/.hermes/scripts/doc-watchdog.py"
  fix_principle: "修文档不修代码"
  max_retries: 3
```

---

> 最后更新：2026-07-03
> 基于：小皮爱情助手 v2.0 迭代实践
> 下一步：将此 YAML 配置集成到 Hermes 的代理调度系统，实现配置驱动而非手写驱动