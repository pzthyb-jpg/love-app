# 📝 Love App — UX-Text 质量审核流程

> **版本**: v1.0 | **日期**: 2026-07-07  
> **适用范围**: love-app 项目所有面向用户的文案（中文硬编码、Toast、通知、占位符、按钮、空状态、错误提示、对话框）  
> **配套文件**:  
> - `docs/UX_AUDIT_REPORT.md` — 已发现的问题清单  
> - `docs/UX_WRITING_QA.md` — 文案质量维度详细说明  
> - `scripts/ux-writing-lint.cjs` — 自动化文案 Lint 工具  
> - `scripts/check-text-consistency.cjs` — 文案一致性检查工具  

---

## 目录

1. [文案质量维度定义](#1-文案质量维度定义)
2. [审核触发时机](#2-审核触发时机)
3. [审核执行流程](#3-审核执行流程)
4. [文案 Lint 规则设计](#4-文案-lint-规则设计)
5. [文案风格指南](#5-文案风格指南)
6. [质量度量指标](#6-质量度量指标)
7. [修复工单模板](#7-修复工单模板)

---

## 1. 文案质量维度定义

love-app 文案质量从 **5 个核心维度** + **1 个辅助维度** 衡量。每个维度分为 **P0 必须满足 / P1 应该满足 / P2 锦上添花** 三级标准。

### 1.1 清晰度 (Clarity) 🔴 P0

> 用户一眼看懂，不需要思考。

| 级别 | 审核标准 | 检查方式 | 对应问题 |
|------|---------|---------|---------|
| P0 | 不使用技术术语（localStorage、API、Token、IndexedDB、QuotaExceededError） | 静态扫描 + 人工审查 | UX-P-001, TX-006 |
| P0 | 主动语态优先（「保存成功」而非「保存操作未被执行」） | 人工审查 | — |
| P0 | 操作结果明确告知（「导出成功」而非「导出完成」） | 人工审查 | — |
| P0 | 错误提示包含「问题 + 解决方案」（不能只说出错） | 静态扫描 + 人工审查 | AX-001, AX-002 |
| P1 | 信息层级：主标题 ≤ 12 字（中文），辅助说明 ≤ 30 字 | 静态扫描 | — |
| P1 | 按钮文案用动词开头（「保存」「删除」「导出」） | 静态扫描 | — |
| P2 | 关键操作前给预期（「保存后将刷新页面，请稍候」） | 人工审查 | — |

---

### 1.2 一致性 (Consistency) 🔴 P0

> 同一个概念、同一个操作，在整个 App 中用同样的词。

| 级别 | 审核标准 | 检查方式 | 对应问题 |
|------|---------|---------|---------|
| P0 | 同一概念用同一称呼（「愿望」vs「心愿」vs「wish」统一） | 跨文件静态扫描 | TX-002, TX-003 |
| P0 | 同一操作同一文案（不出现「保存成功」「已保存」「修改已保存」三种写法） | 跨文件去重扫描 | TX-001 |
| P0 | Toast 结构统一：emoji + 主语 + 结果（`🎉 打卡成功！`，不出现 `打卡好了`） | 正则匹配 | TX-002 |
| P1 | 错误文案结构统一：`问题 + 建议`（`无法打开摄像头，请在系统设置中允许权限`） | 正则匹配 | — |
| P1 | 空状态结构统一：`[emoji] + 现状 + 引导` | 正则匹配 | — |
| P1 | 弹窗按钮统一：`确定` / `取消` / `保存` / `删除`（动词开头） | 静态扫描 | — |
| P2 | 数字格式统一：距离用「X天」，数量用「X个」，时间用「YYYY-MM-DD」或「HH:mm」 | 正则扫描 | TX-004 |

---

### 1.3 情感化 (Emotional) 🟡 P1

> 情感化文案让用户感到被理解、被关怀，是 love-app 的核心竞争力。

| 级别 | 审核标准 | 检查方式 | 对应问题 |
|------|---------|---------|---------|
| P1 | 空状态不冷冰冰（禁止「暂无数据」「无数据」「空」） | 静态扫描 + 人工审查 | UX-H-003, UX-W-003 |
| P1 | 错误状态不吓人（禁止「系统错误」「致命异常」） | 静态扫描 | — |
| P1 | 成就时刻有庆祝感（达成里程碑时 🎉） | 人工审查 | UX-P-003 |
| P1 | 等待状态有安抚（「正在打开摄像头...」而非空白 loading） | 人工审查 | UX-L-001 |
| P2 | 确认弹窗删除留给用户退路（「删除前记得先备份哦」） | 人工审查 | — |
| P2 | 特殊日子文案有变化（生日、纪念日、节日） | 人工审查 | — |

---

### 1.4 无障碍 (Accessibility) 🟡 P1

> 让所有用户（包括视障用户、老年用户、非母语用户）都能理解文案。

| 级别 | 审核标准 | 检查方式 | 对应问题 |
|------|---------|---------|---------|
| P1 | 图标按钮必须有 `aria-label`（如编辑 `✏️` `aria-label="编辑"`） | DOM 静态扫描 | AX-001, AX-002, AX-003 |
| P1 | 图片/图标装饰性元素必须有 `aria-hidden="true"` | DOM 静态扫描 | — |
| P1 | 表单输入必须有 `label` 或 `placeholder` | DOM 静态扫描 | — |
| P1 | 错误提示不只用颜色区分（配合文字说明 `❌ 密码错误`） | 人工审查 | AX-003 |
| P1 | 动态内容变化（Toast、加载完成）使用 `aria-live` | DOM 扫描 + 人工审查 | AX-006 |
| P2 | 支持 `prefers-reduced-motion`：提供关闭动画的降级样式 | 人工审查 | AX-006, MI-004 |
| P2 | 点击区域 ≥ 44x44px，文案按钮区域足够大 | 人工审查 | AX-005 |

---

### 1.5 文化适切 (Cultural Appropriateness) 🟡 P1

> 文案符合中文语境，避免文化冲突或不自然的表达。

| 级别 | 审核标准 | 检查方式 | 对应问题 |
|------|---------|---------|---------|
| P1 | 默认昵称不硬编码为「泓博」，改为「男朋友」或空 | 静态扫描 | TX-008 |
| P1 | 无歧视性、冒犯性、暴力性表达 | 人工审查 | — |
| P1 | 不使用繁体中文（除非是特定设计需要） | 静态扫描 | — |
| P1 | 时间格式符合中文习惯（24小时制 + 「上午/下午」标注） | 人工审查 | TX-006 |
| P2 | 节日覆盖更广（520、双11、女生节等） | 人工审查 | — |
| P2 | 彩虹屁风格多样化（温柔/搞笑/文艺/土味），避免过于夸张 | 人工审查 | UX-S-001 |

---

### 1.6 格式规范 (Format) 🟢 P2

| 级别 | 审核标准 | 检查方式 |
|------|---------|---------|
| P2 | emoji 每句最多 1 个，放在句末或句首（不混用） | 正则扫描 |
| P2 | 标点：陈述句用句号，感叹句用感叹号，不用省略号（用「～」） | 正则扫描 |
| P2 | 引号使用中文引号「」或书名号，不用英文双引号包围中文 | 正则扫描 |
| P2 | 省略号使用「……」（两个），不用「。。。」 | 正则扫描 |
| P2 | 非中文内容（英文、数字）与中文之间加半角空格 | 正则扫描 |

---

## 2. 审核触发时机

```
┌─────────────────────────────────────────────────────────────────┐
│                  UX-Text 质量审核触发时机矩阵                      │
├──────────────┬──────────┬──────────┬──────────┬────────────────┤
│              │  强制    │ 自动执行 │ 拦截合并 │ 审核人         │
├──────────────┼──────────┼──────────┼──────────┼────────────────┤
│ 代码提交     │    ✅    │   ✅     │    ❌    │ 自动化 Lint    │
│ (git commit) │          │          │          │ (husky+lint-staged) │
├──────────────┼──────────┼──────────┼──────────┼────────────────┤
│ PR 合并前    │    ✅    │   ✅     │    ✅    │ CI Pipeline    │
│ (PR→main)   │          │          │          │ + 人工审查     │
├──────────────┼──────────┼──────────┼──────────┼────────────────┤
│ 版本发布前   │    ✅    │   ✅     │    ✅    │ 发布前专项审查 │
│ (tag v*)    │          │          │          │ (产品 + 开发)  │
├──────────────┼──────────┼──────────┼──────────┼────────────────┤
│ 定期巡检     │    ✅    │   ❌     │    ❌    │ 定期人工审查   │
│ (每 2 周)   │          │          │          │ (全量扫描)     │
└──────────────┴──────────┴──────────┴──────────┴────────────────┘
```

### 2.1 代码提交（本地 Pre-commit）

**目标**: 在开发者本地提交前，快速拦截明显的文案问题。

**实现工具**: `husky` + `lint-staged` + 自定义 Lint 脚本

**检查范围**: 本次提交修改的 `.vue` 和 `.js` 文件

**检查内容**: P0 规则（禁止词汇、技术术语、长度超限）

**行为**:  
- 发现 `error` 级别 → 阻止提交，输出问题清单和建议  
- 发现 `warning` 级别 → 警告但不阻止，输出建议

**配置文件**: `.husky/pre-commit`

---

### 2.2 PR 合并前（CI Pipeline）

**目标**: 在 PR 合并到 `main` 分支前，进行全面文案质量检查。

**实现工具**: GitHub Actions + ESLint 插件 + 自定义脚本

**检查范围**: PR 中所有新增/修改的 `.vue` 和 `.js` 文件 + 文案一致性全量扫描

**检查内容**:  
- 全部 P0 规则（静态扫描）  
- P1 规则（静态扫描 + 一致性检查）  
- 文案一致性评分（跨文件重复文案检测）  
- 与基线对比的「问题密度趋势」

**行为**:  
- 发现 P0 `error` → **合并拦截**（CI 失败）  
- 发现 P1 `warning` → 生成评审评论，显示在 PR 中  
- 所有 P2 → 作为 PR 建议（suggestion），不强制

**PR 评论模板**（自动评论）:
```
📝 UX-Text 审核报告

❌ 发现 2 个 Error（需修复）:
  - [src/views/Home.vue:88] 包含禁止词汇「暂无数据」→ 建议: 用空状态引导文案
  - [src/views/Photo.vue:234] Toast 无 emoji 开头

⚠️ 发现 1 个 Warning:
  - [src/views/Wish.vue:56] 按钮文案「🔁 再转（排除当前）」过长（9字，建议 ≤ 6 字）

📊 文案一致性评分: 94/100（较上次 +2）
📈 问题密度: 0.8 issues/文件（上次 1.2，↓ 33%）
```

---

### 2.3 版本发布前（Pre-release Gate）

**目标**: 在发版前进行全量文案审查，确保无遗漏。

**触发**: `git tag v*` 推送时

**检查范围**: 当前版本涉及的所有文案文件

**检查内容**:  
- 导出全量文案清单（CSV/JSON）  
- 人工审查全 5 个维度  
- 运行完整一致性扫描  
- 生成质量度量报告  
- 输出用户可见文案的完整校对清单

**产出**: `docs/UX_TEXT_QA_REPORT_{version}.md`

---

### 2.4 定期巡检（Bi-weekly Audit）

**目标**: 持续跟踪文案质量趋势，发现新增问题。

**频率**: 每 2 周一次

**执行人**: 项目 Owner / 产品负责人

**检查范围**: 全量 `.vue` 和 `.js` 文件

**检查内容**:
- 全量文案 Lint + 一致性扫描
- 与上次巡检对比：新增问题数 / 修复问题数 / 趋势变化
- 文案字典更新建议
- 用户反馈中的文案问题抽取

**产出**: 巡检报告 + 下两周修复计划

---

## 3. 审核执行流程

### 3.1 角色定义

| 角色 | 职责 | 触发场景 |
|------|------|---------|
| **开发者** | 遵守风格指南，在提交前本地自检 | 每次提交 |
| **自动化 Lint** | 静态扫描，拦截 P0 问题 | PR/提交时 |
| **PR 审查者** | 人工审查 P1/P2 问题，关注一致性 | PR 合并时 |
| **产品/设计** | 版本发布前专项审查，确认情感化适用性 | 发版前 |
| **项目 Owner** | 定期巡检，输出度量报告 | 每 2 周 |

### 3.2 工具链

```
┌──────────────────────────────────────────────────────────────────┐
│                        UX-Text 质量工具链                         │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Git Hook  │───▶│   Lint      │───▶│  GitHub     │          │
│  │   (husky)   │    │   (本地)    │    │  Actions    │          │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘          │
│       │                    │                   │                 │
│       ▼                    ▼                   ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   ESLint    │    │   自定义    │    │  静态分析   │          │
│  │   Plugin    │    │   Node脚本  │    │  + 报告生成 │          │
│  │ (eslint-    │    │ (ux-writing-│    │             │          │
│  │  plugin-    │    │  lint.cjs)  │    │             │          │
│  │  love-app)  │    │             │    │             │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│       │                    │                   │                 │
│       ▼                    ▼                   ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  一致性     │    │  长度检查   │    │  无障碍     │          │
│  │  检查       │    │  + emoji    │    │  属性扫描   │          │
│  │ (跨文件)    │    │  检测       │    │  (aria-*)   │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 本地自检流程（开发者）

```bash
# 1. 安装依赖（一次性）
npm install --save-dev husky lint-staged

# 2. 配置 husky（一次性）
npx husky install

# 3. 本地提交前自动运行
git add .
git commit -m "feat: 添加愿望池筛选功能"
# ↓ husky 自动触发
# ↓ lint-staged 运行自定义脚本
# ↓ 有 error 则阻止提交，无 error 则允许提交

# 4. 手动全量检查
node scripts/ux-writing-lint.cjs
```

### 3.4 PR 审查流程

```
[开发者发起 PR]
       │
       ▼
[GitHub Actions 触发: ux-text-qa.yml]
       │
       ├── Step 1: 安装依赖 (npm ci)
       ├── Step 2: 运行 ESLint + 自定义规则
       ├── Step 3: 运行一致性检查 (check-text-consistency.cjs)
       ├── Step 4: 计算质量评分
       ├── Step 5: 生成 PR 评论 (output as bot comment)
       └── Step 6: 判断是否拦截合并
              ├── 有 P0 error → ❌ 合并拦截
              ├── 仅 P1 warning → ⚠️ 警告，可合并
              └── 仅 P2 suggestion → ✅ 建议，可合并
       │
       ▼
[PR 审查者人工审查]
       │
       ├── 审查评论中的问题清单
       ├── 确认所有 P0 error 已修复
       ├── 评估 P1 warning 是否需要立即修复
       └── 批准合并 或 请求修改
```

### 3.5 GitHub Actions 工作流配置

**文件**: `.github/workflows/ux-text-qa.yml`

```yaml
name: UX-Text QA

on:
  pull_request:
    branches: [main]
    paths:
      - 'src/**/*.vue'
      - 'src/**/*.js'

jobs:
  ux-text-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2  # 用于对比基线

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run UX Writing Linter
        id: lint
        run: node scripts/ux-writing-lint.cjs
        continue-on-error: true

      - name: Run Consistency Check
        id: consistency
        run: node scripts/check-text-consistency.cjs
        continue-on-error: true

      - name: Compute Quality Score
        id: score
        run: |
          node scripts/compute-text-score.cjs \
            --lint-output ${{ steps.lint.outputs }} \
            --consistency-output ${{ steps.consistency.outputs }} \
            --output score.json

      - name: Comment PR
        uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const fs = require('fs');
            const lintOutput = fs.readFileSync('lint-report.md', 'utf8');
            const score = JSON.parse(fs.readFileSync('score.json', 'utf8'));
            const body = `## 📝 UX-Text QA Report\n\n${lintOutput}\n\n` +
              `**📊 一致性评分: ${score.total}/100**\n` +
              `**📈 问题密度: ${score.issueDensity} issues/文件**` +
              (score.trend ? ` (${score.trend})` : '');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

      - name: Fail on P0 errors
        if: steps.lint.outcome == 'failure'
        run: |
          echo "❌ UX-Text QA 发现 P0 错误，请修复后再合并"
          exit 1
```

---

## 4. 文案 Lint 规则设计

### 4.1 规则分类

| 规则编号 | 规则名称 | 维度 | 级别 | 类型 |
|---------|---------|------|------|------|
| UX-L-001 | 禁止技术术语 | 清晰度 | P0 | 静态扫描 |
| UX-L-002 | 禁止冷冰冰表达 | 情感化 | P1 | 静态扫描 |
| UX-L-003 | 不允许「您」(对你) | 一致性 | P0 | 静态扫描 |
| UX-L-004 | 时间格式一致性 | 一致性 | P1 | 静态扫描 |
| UX-L-005 | 长度上限检查 | 清晰度 | P1 | 静态扫描 |
| UX-L-006 | Toast emoji 规范 | 格式规范 | P2 | 静态扫描 |
| UX-L-007 | 标点使用规范 | 格式规范 | P2 | 静态扫描 |
| UX-L-008 | 硬编码昵称检测 | 文化适切 | P1 | 静态扫描 |
| UX-L-009 | aria-label 检查 | 无障碍 | P1 | DOM 扫描 |
| UX-L-010 | 变量拼接空状态检测 | 清晰度 | P1 | 静态扫描 |

### 4.2 规则详述与正则

#### UX-L-001: 禁止技术术语

```javascript
// 规则配置
{
  id: 'ux-forbidden-tech-terms',
  severity: 'error',  // P0
  pattern: /\b(localStorage|sessionStorage|IndexedDB|API|HTTP|HTTPS|Token|认证失败|权限不足|请求超时|服务器错误|数据库|缓存|QuotaExceededError)\b/,
  message: '对终端用户隐藏技术术语',
  suggestion: (match) => {
    const map = {
      'localStorage': '存储',
      'sessionStorage': '临时存储',
      'IndexedDB': '本地数据库',
      'API': '接口',
      'HTTP': '网络协议',
      'HTTPS': '安全协议',
      'Token': '令牌',
      '认证失败': '密码错误或登录失败',
      '权限不足': '需要相应权限才能操作',
      '请求超时': '网络有点慢，再试一次吧',
      '服务器错误': '出了点小问题，稍后再试',
      '数据库': '数据存储',
      '缓存': '临时数据'
    };
    return `建议替换为「${map[match] || '用户能理解的表达'}」`;
  }
}
```

#### UX-L-002: 禁止冷冰冰表达

```javascript
{
  id: 'ux-forbidden-cold-expressions',
  severity: 'error',
  pattern: /操作成功|操作失败|暂无数据|请稍后重试|系统错误|非法输入|确认提交/,
  message: '冷冰冰的文案，建议用更情感化的表达',
  suggestion: '用 emoji + 具体情境重新表达，如「🎉 打卡成功！」'
}
```

#### UX-L-003: 不允许「您」(对你)

```javascript
{
  id: 'ux-pronoun-consistency',
  severity: 'error',
  pattern: /您/g,
  message: 'love-app 用「你」不用「您」（亲密关系，不是客服）',
  suggestion: '将「您」替换为「你」或用户的昵称（如「宝贝」）'
}
```

#### UX-L-004: 时间格式一致性

```javascript
// 检查混用情况：同时出现「12:00」和「中午 12:00」
{
  id: 'ux-time-format-consistency',
  severity: 'warning',
  // 跨文件扫描：收集所有时间格式，检测混用
  detect: (allFiles) => {
    const timeFormats = [];
    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(/\b(中午|下午|傍晚|上午)\s*\(\d{1,2}:\d{2}\)/g) || [];
      const matches2 = content.match(/\b\d{1,2}:\d{2}\b/g) || [];
      timeFormats.push({ file, matches, matches2 });
    });
    // 如果两个都有，则报告不一致
    return timeFormats.filter(t => t.matches.length > 0 && t.matches2.length > 0);
  },
  message: '同一文案中时间格式不一致，建议统一使用「中午 (12:00)」或「中午 12:00」格式'
}
```

#### UX-L-005: 长度上限检查

```javascript
{
  id: 'ux-length-check',
  severity: 'warning',
  rules: [
    {
      type: 'toast',
      maxLength: 20,
      pattern: /showToast\(\s*\{[^}]*message:\s*['"`]([^'"`]+)['"`]/,
      message: (text, len) => `Toast 文案过长（${len} 字，建议 ≤ 20 字）`
    },
    {
      type: 'button',
      maxLength: 6,
      // 匹配 van-button 内部文字
      pattern: /<van-button[^>]*>\s*([^<]+?)\s*<\/van-button>/,
      message: (text, len) => `按钮文案过长（${len} 字，建议 ≤ 6 字）`
    },
    {
      type: 'dialog-title',
      maxLength: 12,
      pattern: /title:\s*['"`]([^'"`]+)['"`]/,
      message: (text, len) => `弹窗标题过长（${len} 字，建议 ≤ 12 字）`
    },
    {
      type: 'dialog-message',
      maxLength: 30,
      pattern: /message:\s*['"`]([^'"`]+)['"`]/,
      message: (text, len) => `弹窗正文过长（${len} 字，建议 ≤ 30 字）`
    },
    {
      type: 'empty-state',
      maxLength: 20,
      pattern: /<p class="[^"]*empty[^"]*"[^>]*>([^<]+)<\/p>/,
      message: (text, len) => `空状态文案过长（${len} 字，建议 ≤ 20 字）`
    }
  ]
}
```

#### UX-L-006: Toast emoji 规范

```javascript
{
  id: 'ux-toast-emoji',
  severity: 'suggestion',
  pattern: /showToast\(\s*\{[^}]*message:\s*['"`]([^'"`]+)['"`]/,
  validate: (text) => {
    const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{200D}\u{20E3}\u{FE0F}\u{E0020}-\u{E007F}✨🎉😤💾📥📤🕐⏰❌✅🔑🗑️👧👦💌❤️🎂🎊🔥💖🌟⭐🌈🦋💗💓💘💝💞💟❣️💔💕💙💚💛🧡💜🖤🤍🤎💯💢💥💫💦💨🕳️💣💬💭💤]/u;
    // 检查是否以 emoji 开头，或中间有多个 emoji
    const emojis = text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{200D}\u{20E3}\u{FE0F}\u{E0020}-\u{E007F}]/gu) || [];
    
    const issues = [];
    if (!emojiRegex.test(text)) {
      issues.push('Toast 文案建议以 emoji 开头');
    }
    if (emojis.length > 1) {
      issues.push(`一个 Toast 中有 ${emojis.length} 个 emoji，建议最多 1 个`);
    }
    return issues;
  }
}
```

#### UX-L-007: 标点使用规范

```javascript
{
  id: 'ux-punctuation',
  severity: 'warning',
  rules: [
    {
      pattern: /。。+/,
      message: '使用「……」（两个省略号）代替「。。。」',
    },
    {
      pattern: /([。！？])\1+/,
      message: '不用重复标点，保留一个即可',
    },
    {
      pattern: /"[^"]*"(?=[\u4e00-\u9fa5])/,
      message: '中文文案使用中文引号「」',
    },
    {
      pattern: /\.\s*$/,
      message: '中文句子末尾使用句号「。」，不要使用英文句号「.」',
    },
    {
      pattern: /\(\d+\)/,
      message: '使用括号包裹数字时，考虑用「X天」「X个」代替',
    }
  ]
}
```

#### UX-L-008: 硬编码昵称检测

```javascript
{
  id: 'ux-hardcoded-name',
  severity: 'error',
  pattern: /泓博|小皮/g,  // 当前项目硬编码的姓名
  message: '不允许硬编码真实姓名，应使用「男朋友」或用户设置的昵称',
  suggestion: '替换为「男朋友」、「宝贝」'
}
```

#### UX-L-009: aria-label 检查 (DOM 扫描)

```javascript
{
  id: 'ux-aria-label-missing',
  severity: 'warning',
  // 每个图标按钮/无文字按钮必须有 aria-label
  detect: (vueContent) => {
    const issues = [];
    // 扫描所有无文字内容的图标按钮
    const iconButtonRegex = /<[^>]*role=["']button["'][^>]*>([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✏️🗑️⚙️🏠])*?<\/[^>]*>/gu;
    
    // 扫描 van-button 中没有文字内容的
    const emptyButtons = vueContent.match(/<van-button[^>]*>\s*<\/van-button>/g) || [];
    emptyButtons.forEach(btn => {
      if (!btn.includes('aria-label') && !btn.includes('title')) {
        issues.push({
          element: btn.substring(0, 80) + '...',
          message: '按钮无文字且无 aria-label，屏幕阅读器无法识别'
        });
      }
    });
    
    // 扫描 van-tabbar-item 中使用纯 emoji 作为 title
    const tabItems = vueContent.match(/<van-tabbar-item[^>]*title=["']([^"']+)["'][^>]*>/g) || [];
    tabItems.forEach(item => {
      const titleMatch = item.match(/title=["']([^"']+)["']/);
      if (titleMatch && /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}]+$/u.test(titleMatch[1])) {
        issues.push({
          element: item,
          message: 'Tab 栏标题不能只有 emoji，需要配合文字说明'
        });
      }
    });
    
    return issues;
  }
}
```

#### UX-L-010: 变量拼接空状态检测

```javascript
{
  id: 'ux-empty-state-variables',
  severity: 'warning',
  // 检测 v-if 产生的空状态是否含有变量拼接，导致文案不完整
  detect: (vueContent) => {
    const issues = [];
    // 检测 v-if 中的变量拼接，如: `还没有{{ tab }}内容哦`
    const variableEmptyRegex = /v-if[^>]*>.*\{\{[^}]+\}\}.*还?没有/g;
    // 检测包含变量拼接的空状态
    const emptyWithVars = vueContent.match(/class="[^"]*empty[^"]*"[^>]*>[^<]*{{[^}]+}}/g) || [];
    emptyWithVars.forEach(match => {
      issues.push({
        code: match.substring(0, 100) + '...',
        message: '空状态文案含变量拼接，可能导致渲染后文案不完整（如「还没有」后面无内容）'
      });
    });
    return issues;
  }
}
```

### 4.3 ESLint 插件集成

创建自定义 ESLint 插件 `eslint-plugin-love-app-text`:

```
project-root/
├── .eslintrc.js
├── eslint-local-plugins/
│   └── love-app-text/
│       ├── package.json
│       ├── index.js
│       └── rules/
│           ├── no-tech-terms.js
│           ├── no-formal-pronoun.js
│           ├── toast-emoji.js
│           ├── length-check.js
│           └── aria-label.js
```

**`.eslintrc.js` 配置**:

```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'vue',
    'love-app-text',  // 本地插件
  ],
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        // P0: 禁止技术术语
        'love-app-text/no-tech-terms': 'error',
        // P0: 禁止正式称呼
        'love-app-text/no-formal-pronoun': 'error',
        // P1: Toast emoji 以 emoji 开头
        'love-app-text/toast-emoji': 'warn',
        // P1: 长度检查
        'love-app-text/length-check': 'warn',
        // P1: aria-label 缺失
        'love-app-text/aria-label': 'warn',
        // P2: 冷冰冰表达
        'love-app-text/no-cold-text': 'off',
        // P2: 标点规范
        'love-app-text/punctuation': 'off',
      },
    },
  ],
};
```

---

## 5. 文案风格指南

### 5.1 概述

love-app 的文案风格是**「男朋友在说话」**——温暖、甜蜜、有点调皮、永远支持。

> 想象一个宠女朋友但不油腻的男生在发微信，就对了。

### 5.2 人称规范

| 规范 | 正确 ✅ | 错误 ❌ | 说明 |
|------|--------|--------|------|
| 亲密度 | 统一使用「你」 | ❌ 您 | 不要客套，我们是男女朋友 |
| 对女生称呼 | 「宝贝」「{昵称}」（由用户设置） | ❌ 女朋友、用户、该用户 | 不带任何身份标签，只叫名字或默认「宝贝」 |
| 对男生称呼 | 「男朋友」「{昵称}」（由用户设置） | ❌ 你男朋友、用户 | 同上 |
| 「我们」用法 | 「我们在一起 X 天」「我们的愿望池」 | ❌ 你们在一起 X 天 | 强调「我们」，排除「你们/他们」 |
| 「自己」用法 | 「设置自己的昵称」 | ❌ 他自己、她自己 | 不用性别标签 |

**实施规则**:
- 「用户」仅在技术文档和代码注释中使用，不在 UI 文案中出现
- `{name}` 作为占位符时，默认为「宝贝」，不从代码中硬编码默认昵称

---

### 5.3 语气规范

| 场景 | 语气要求 | 正确示例 ✅ | 错误示例 ❌ |
|------|---------|-----------|-----------|
| 成功操作 | 开心、有成就感 | 🎉 打卡成功！今天的你超好看 | 操作成功 |
| 错误提示 | 不吓人，给解决方案 | 😢 摄像头打不开，请在设置中允许权限 | 摄像头错误 |
| 空状态 | 温暖引导，不冷冰冰 | 📸 还没有打卡记录哦，开始打卡吧 | 暂无数据 |
| 删除确认 | 提醒但不威胁 | 确定删除这条愿望吗？删除后就找不回来了 | 确认删除？数据将永久丢失 |
| 引导操作 | 温和鼓励 | 点击下方按钮开始拍照 | 请先执行拍照操作 |
| 等待状态 | 安抚情绪 | ⏳ 正在打开摄像头... | （无任何提示） |
| 成就/纪念日 | 热烈庆祝 | 🎉 连续打卡 30 天！爱情正在发芽 | 已实现目标 |
| 系统/通知 | 亲切、口语化 | 宝贝，该拍照打卡啦！ | 提醒用户执行打卡操作 |

**禁止语气**:
- 命令式：「必须」「不得」「禁止」「无法」「立即」
- 客服式：「请您进行」「您的操作已被」「如有疑问请联系」
- 威胁式：「此操作不可恢复」「后果自负」
- 技术式：「请检查 API 是否返回 200」「清理 localStorage」

---

### 5.4 Emoji 使用规范

#### 5.4.1 总则

| 规范 | 规则 |
|------|------|
| 数量 | 每句最多 1 个 emoji |
| 位置 | 放在句首或句尾，不放在中间 |
| 风格 | 统一使用 emoji，不使用颜文字（╰(*°▽°*)╲）或数字表情（Orz） |
| 语义 | emoji 与文案内容强相关 |
| 避免 | 不使用 ⚠️ ⛔ 🚫 等警告类 emoji 表达友好提示 |

#### 5.4.2 Emoji 语义表

| 语义 | 使用 emoji | 使用场景 | 不使用 |
|------|-----------|---------|--------|
| 庆祝/成功 | 🎉 ✨ | 打卡成功、愿望实现、成就达成 | ❌ 🎊（过于夸张） |
| 爱情 | ❤️ 💕 💖 | 纪念日、恋爱相关 | ❌ 💔（心碎，除非内容相关） |
| 可爱/夸赞 | 💫 🌟 ⭐ | 彩虹屁、夸赞文案 | ❌ 🌹（过于正式） |
| 错误/悲伤 | 😢 😞 | 错误提示、权限被拒绝 | ❌ ❌（太冷） |
| 警告/注意 | ⚠️ 💡 | 确认弹窗、功能说明 | ❌ ⛔（太严厉） |
| 功能指引 | 📸 📍 📥 📤 🔙 | 按钮前缀（可省略） | ❌ 🔀（太抽象） |
| 等待 | ⏳ ⌛ | 加载状态 | ❌ 🔄（表示刷新/加载，不表示等待） |
| 删除 | 🗑️ | 删除按钮 | ❌ ✖️（关闭按钮才用） |
| 设置 | ⚙️ | 设置入口 | ❌ 🛠️（太工具化） |
| 提醒 | ⏰ | 提醒相关 | 🔔（过于通用） |
| 完成 | ✅ | 筛选标签、状态 | ❌ ☑️（过于表单化） |
| 金币/成就 | 🏆 💰 | 成就系统 | 💎（过于物质化） |

#### 5.4.3 按钮 Emoji 规则

按钮中可选是否带 emoji，但同一功能的按钮必须统一：

| 按钮 | 带 emoji ✅ | 不带 emoji ✅ | 混用 ❌ |
|------|------------|--------------|--------|
| 主要操作 | 📸 咔嚓拍照 | 咔嚓拍照 | 一个带一个不带 |
| 次要操作 | ✨ 许愿 | 许愿 | — |
| 破坏性操作 | 🗑️ 删除 | 删除 | — |
| 取消 | 取消 | 取消 | ❌ 取消 💕 |
| 确认 | 保存 | 保存 | — |

---

### 5.5 标点规范

| 标点 | 使用规则 | 正确 ✅ | 错误 ❌ |
|------|---------|--------|--------|
| 句号「。」 | 陈述句结尾使用 | 已连续打卡 7 天。 | 已连续打卡 7 天 |
| 感叹号「！」 | 感叹句、庆祝场景使用，只用一个 | 太棒了！ | 太棒了！！！ |
| 波浪号「～」 | 空状态引导中使用，增加可爱感 | 开始打卡吧～ | 开始打卡吧... |
| 问号「？」 | 确认弹窗使用 | 确定删除？ | 确定删除吗？ |
| 省略号「……」 | 等待状态使用，两个字符组成 | 正在打开... | 正在打开。。。 |
| 中文引号「」 | 引用内容、强调时使用 | 「宝贝」的爱情助手 | "宝贝"的爱情助手 |
| 顿号「、」 | 中文并列使用 | 彩虹屁、夸赞、赞美 | 彩虹屁,夸赞,赞美 |
| 括号 | 中文括号「（）」用于补充说明 | 中午（12:00） | 中午(12:00) |

**禁止用法**:
- 不使用英文标点「, . ? ! ; :」在中文句子中
- 不使用连续感叹号「！！！」或问号「？？？」
- 不使用「~」（半角波浪号），使用「～」（全角）
- 不使用英文双引号「""」包裹中文

---

### 5.6 词汇规范

#### 统一词汇表

| 概念 | 统一词汇 | 禁止用法 |
|------|---------|---------|
| 对女生的默认称呼 | 宝贝 | 女朋友、女朋友昵称、UserGirl |
| 对男生的默认称呼 | 男朋友 | 男生、男友、UserBoy |
| 打卡记录 | 打卡 | 签到、check-in、chenckIn |
| 愿望和吐槽 | 愿望 / 吐槽 | 心愿、wish、vent（UI 中出现） |
| 存储位置 | 本地 | localStorage、IndexedDB |
| 清空数据 | 清除数据 | reset、清除缓存、格式化 |
| 备份文件 | 备份 | backup、导出文件 |
| 周年纪念日 | 周年纪念日 | 恋爱周年、恋爱纪念日 |

#### 词汇白名单与黑名单

**白名单**（鼓励使用）：
宝贝、打卡、愿望、吐槽、心愿、庆祝、夸夸、彩虹屁、合影、爱情、纪念日、心愿、实现、登录、设置

**黑名单**（禁止使用）：
操作成功、操作失败、暂无数据、系统错误、请稍后重试、非法输入、确认提交、认证失败、权限不足、请求超时、数据库、缓存、您、必须、无法、禁止

---

## 6. 质量度量指标

### 6.1 文案一致性评分 (Consistency Score)

衡量跨文件文案一致性的量化指标。

**计算公式**:

```
一致性评分 = 100 - (不一致文案数 / 总文案数 × 100 × 权重)
```

**检测维度与权重**:

| 维度 | 权重 | 检测方法 |
|------|------|---------|
| 同一概念用语一致 | 40% | 跨文件去重扫描（如「打卡」vs「签到」混用） |
| 同一操作结果一致 | 30% | 正则匹配（如「打卡成功」vs「打卡完成」） |
| Toast 结构一致 | 15% | 正则匹配（emoji + 主语 + 结果） |
| 称呼一致 | 15% | 跨文件扫描（「宝贝」vs「女朋友」vs「您」） |

**评分等级**:

| 分数 | 等级 | 动作 |
|------|------|------|
| 95-100 | 🟢 优秀 | 继续保持 |
| 85-94  | 🟡 良好 | 计划修复 < 15 个问题 |
| 70-84  | 🟠 一般 | 下一个 Sprint 安排修复 |
| 0-69   | 🔴 差 | 立即冻结发版，专项修复 |

**数据采集脚本**: `scripts/compute-text-score.cjs`

---

### 6.2 问题密度趋势 (Issue Density Trend)

衡量文案质量变化趋势。

**计算公式**:

```
问题密度 = 总 Lint 问题数 / 检查文件总数
```

**趋势解读**:

| 趋势 | 含义 | 行动 |
|------|------|------|
| ↓ 持续下降 | 文案质量在提升 | 保持当前流程 |
| → 基本持平 | 质量稳定 | 关注新增文件 |
| ↗️ 突然升高 | 某次 PR 引入了较多问题 | 回顾 PR 审查流程 |
| ↑ 持续恶化 | 流程执行不到位 | 加强本地 Pre-commit 拦截 |

**可视化**:

```
问题密度趋势 (单位: issues/文件)
  2.5 |
  2.0 |
  1.5 |        ●
  1.0 |     ●     ●
  0.5 |  ●           ●
  0.0 +──────────────────────
       W1   W2   W3   W4  (周)
```

---

### 6.3 其他辅助指标

| 指标 | 计算方式 | 目标值 |
|------|---------|--------|
| **硬编码文案抽检覆盖率** | 被 Lint 扫描的文案数 / 总文案数 | ≥ 95% |
| **P0 问题修复周期** | 从发现到修复的平均时长 | ≤ 24 小时 |
| **PR 文案拦截率** | 被拦截的 PR 数 / 总 PR 数 | ≤ 10%（太高说明开发阶段没自检） |
| **文案文件集中度** | 文案常量文件中的文案数 / 总文案数 | ≥ 80%（逐步迁移到文案常量文件） |

---

## 7. 修复工单模板

### 7.1 工单标题格式

```
[UX-Text] {维度} {问题简述}
```

**示例**:
- `[UX-Text] 清晰度 Wish.vue「谁实现的？(可选)」使用原生 prompt`
- `[UX-Text] 一致性 Home.vue 与 Photo.vue 打卡提醒文案重复`
- `[UX-Text] 无障碍 MessagesAdmin.vue 编辑按钮无 aria-label`

### 7.2 工单正文模板

```markdown
## 问题描述

**来源**: UX_AUDIT_REPORT.md 中编号 TX-008  
**文件**: `src/views/Wish.vue`  
**行号**: 293  
**当前文案**: `谁实现的？(可选)`  
**问题类型**: 清晰度 + 无障碍（原生 prompt 与 App 风格极不一致）

## 问题分析

**影响维度**:
- 🔴 清晰度：原生 prompt 打断用户操作流程
- 🟡 无障碍：原生 prompt 在部分读屏软件中无法正确识别
- 🔴 一致性：与 Vant Dialog 风格不统一

**严重度**: P0

## 修复建议

替换为自定义弹窗组件 `MarkDoneDialog.vue`，使用 van-dialog + van-field。

**修复后效果**:
```vue
<!-- Before -->
const answer = prompt('谁实现的？(可选)');

<!-- After -->
showConfirmDialog({
  title: '✨ 愿望已实现！',
  message: '太棒了！是谁帮你实现的呢？（可选）',
  confirmButtonText: '记录',
  cancelButtonText: '跳过',
  beforeClose: (action) => {
    if (action === 'confirm') {
      // 打开二级弹窗或输入框
    }
  }
});
```

## 修复检查清单

- [ ] 替换原生 prompt 为自定义弹窗组件
- [ ] 弹窗风格和 Vant 一致
- [ ] 有充分的 aria-label 支持
- [ ] 不依赖原生浏览器组件
- [ ] 本地运行 `node scripts/ux-writing-lint.cjs` 无 error
- [ ] 截图或录屏验证效果
- [ ] 更新 `src/constants/messages.js`（如果涉及文案常量）

## 关联工单

- [ ] #XX: 提取公共对话框组件
- [ ] #XX: 表单输入使用 van-field 而非原生 input

## 优先级

- [x] P0 — 立即修复
- [ ] P1 — 计划修复
- [ ] P2 — 有空修复

## 预估工时

30 分钟
```

### 7.3 批量修复工单模板

当同一维度存在多个相似问题时，使用批量修复工单。

```markdown
## 批量修复：{维度} 问题清理

**来源**: UX-UDIT_REPORT.md  
**涉及文件**: （以下VX-XXX 系列）

### 待修复清单

| # | 文件 | 行号 | 当前文案 | 目标文案 | 状态 |
|---|------|------|---------|---------|------|
| 1 | Home.vue | 293 | 🎉 纪念日设置成功！ | 🎂 纪念日已更新 | ⬜ |
| 2 | Wish.vue | 28 | 确定删除？ | 确定删除这个愿望吗？ | ⬜ |
| 3 | Settings.vue | 198 | 您 | 你 | ⬜ |
| ... | ... | ... | ... | ... | ... |

### 修复优先级

1. P0（error）：#1, #3
2. P1 (warning)：#2, #4, #5

### 修复批次

- [ ] 第一批：P0 问题（预计 1h）
- [ ] 第二批：P1 问题（预计 2h）
- [ ] 第三批：P2 问题（预计 1h）

### 验证方式

```bash
node scripts/ux-writing-lint.cjs <file1> <file2> ...
# 输出: ✅ 文案检查通过，没有发现问题！
```
```

---

## 附录 A: 文件输出清单

```
love-app/
├── .eslintrc.js                          # ESLint 配置 + love-app-text 插件
├── .husky/
│   └── pre-commit                        # Git commit 前自动触发
├── .github/
│   └── workflows/
│       └── ux-text-qa.yml               # GitHub Actions CI
├── eslint-local-plugins/
│   └── love-app-text/                    # 自定义 ESLint 插件
├── scripts/
│   ├── ux-writing-lint.cjs               # 主 Lint 脚本（已存在）
│   ├── check-text-consistency.cjs        # 一致性检查（已存在）
│   ├── compute-text-score.cjs            # 质量评分脚本（新增）
│   └── generate-text-report.cjs          # 报告生成脚本（新增）
├── src/
│   └── constants/
│       └── messages.js                   # 文案常量（逐步迁移）
└── docs/
    ├── UX_AUDIT_REPORT.md                # 审计报告
    ├── UX_WRITING_QA.md                  # 文案质量规范
    └── UX_TEXT_QA_PROCESS.md             # 本文档（审核流程）
```

---

## 附录 B: 一键安装脚本

```bash
#!/bin/bash
# scripts/setup-ux-qa.sh
# 一键搭建 UX-Text QA 工具链

echo "🔧 Setting up UX-Text QA Pipeline..."

# 1. 安装依赖
npm install --save-dev \
  eslint \
  eslint-plugin-vue \
  husky \
  lint-staged \
  @vue/eslint-config-prettier

# 2. 初始化 husky
npx husky install

# 3. 添加 pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# 4. 添加 lint-staged 配置到 package.json
node -e "
const pkg = require('./package.json');
pkg['lint-staged'] = {
  '*.{vue,js}': [
    'node scripts/ux-writing-lint.cjs',
    'eslint --fix'
  ]
};
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# 5. 创建 GitHub Actions 目录
mkdir -p .github/workflows

echo "✅ UX-Text QA Pipeline setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .github/workflows/ux-text-qa.yml to .github/workflows/"
echo "  2. Customize .eslintrc.js to include love-app-text plugin"
echo "  3. Run: node scripts/ux-writing-lint.cjs (verify baseline)"
echo ""
echo "Happy coding! 💕"
```

---

## 附录 C: 本流程与现有问题对应表

| 问题 | 本流程覆盖位置 |
|------|--------------|
| TX-001 「您」称呼不一致 | §5.2 人称规范 + UX-L-003 |
| TX-002 Toast emoji 不一致 | §5.4.3 + UX-L-006 |
| TX-003 按钮 emoji 混用 | §5.4.3 |
| TX-004 引号不统一 | §5.5 + UX-L-007 |
| TX-005 错误提示语气不一致 | §5.3 语气规范 |
| TX-006 时间格式不统一 | UX-L-004 |
| TX-007 提醒设置重复 | §6.1 一致性评分 |
| TX-008 「泓博」硬编码 | UX-L-008 |
| AX-001~AX-003 图标按钮无 aria-label | UX-L-009 |
| AX-004 转盘无状态说明 | §5.3 语气规范 |
| AX-005 长按无屏幕阅读器提示 | §1.4 无障碍 P1 |
| AX-006 prefers-reduced-motion | §1.4 无障碍 P2 |
| UX-P-001 摄像头权限无引导 | §1.1 清晰度 P1 + §5.3 语气规范 |
| UX-W-001 长按无视觉反馈 | §5.3 语气规范 |
| UX-W-002 原生 prompt | §7.2 工单模板 |
| UX-W-003 筛选 Tab 无数量 | §1.2 一致性 P1 |
| UX-L-001 转盘无进度提示 | §5.3 语气规范 |
| UX-L-002 再转不可逆无确认 | §5.3 语气规范 |
| UX-L-004 emoji 随机分配 | §5.4 Emoji 语义表 |
| UX-H-001 连点 5 次无提示 | §5.3 引导操作语气 |
| UX-S-001 重复提醒设置 | §6.1 一致性评分 |
| UX-S-003 清除数据 \n 换行 | §7.2 工单模板 |

---

> **本流程与 `docs/UX_WRITING_QA.md` 互补**:  
> - `UX_WRITING_QA.md` 侧重「为什么」和「是什么」（质量定义、维度说明）  
> - `UX_TEXT_QA_PROCESS.md` 侧重「怎么做」和「什么时候做」（流程、工具、度量、模板）  
> 两者一起构成完整的 UX-Text 质量管理体系。
