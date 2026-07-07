# 📝 小皮爱情助手 — UX Writing 质量审核 (UX Writing QA)

> UX 文案是产品体验的核心组成部分。好的文案让用户感到被理解、被关怀。
> 本规范定义了 love-app 项目的文案质量维度、审核流程与工具集成方案。
> 版本：v1.0 | 日期：2026-07-07

---

## 一、为什么需要 UX Writing QA

love-app 是情感化产品，文案的质量直接决定用户（女朋友）的使用体验。
代码跑得再完美，如果「打卡成功」弹出「操作已完成」，体验就全毁了。

### 1.1 文案在 love-app 中的影响

| 场景 | 不好的文案 | 好的文案 | 影响 |
|------|-----------|---------|------|
| 打卡成功 | ✅ 操作成功 | 🎉 打卡成功！今天也超好看 | 成就感差异巨大 |
| 错误提示 | ❌ 摄像头错误 | 😢 无法打开摄像头，请检查权限设置 | 用户会不会恐慌 |
| 空状态 | 暂无数据 | 还没有打卡记录哦，开始打卡吧 📸 | 用户会不会继续操作 |
| 太长不读 | 您确定要删除所有数据吗？此操作不可恢复 | 确定删除？留下回忆可以导出备份哦 | 用户会不会点错 |

### 1.2 没有 QA 的文案常见问题

| 问题 | 示例 | 严重程度 |
|------|------|---------|
| 语气不一致 | 一个地方用「您」，一个地方用「你」 | 🟡 中 |
| 同一事物不同称呼 | 「彩虹屁」「夸夸」「夸奖」「赞美」 | 🔴 高 |
| 文案包含技术术语 | 「localStorage 已满，请清理存储空间」 | 🔴 高 |
| 文案太长 | 「如果点击取消按钮，您的所有数据都会被清空无法恢复」 | 🟡 中 |
| 文案与品牌调性不符 | 「请进行身份验证以继续操作」 | 🔴 高 |
| 缺少情感化表达 | 打卡成功 → 打卡成功！ | 🟡 中 |

---

## 二、UX 文案质量维度

love-app 的文案质量从以下 6 个维度衡量。每个维度有「必须满足 / 应该满足 / 锦上添花」三级标准。

---

### 2.1 清晰度 (Clarity)🔴

> 用户一眼看懂，不需要思考。

**必须满足：**

- ✅ 一句话能说明白，不用两句
- ✅ 不使用 technical jargon（localStorage、API、HTTP 等对终端用户隐藏）
- ✅ 主动语态优先（「保存失败」而非「保存操作未被执行」）
- ✅ 中文优先，英文/代码片段只在开发者调试中使用

**应该满足：**

- ✅ 信息层级：主标题 → 辅助说明。主标题 ≤ 12 字（中文），辅助说明 ≤ 30 字
- ✅ 操作结果明确告知（「导出成功」而非「导出完成」，前者更确定）
- ✅ 按钮文案用动词开头（「保存」「导出」「删除」而非「确认」）

**锦上添花：**

- 🔮 关键操作前给预期（「保存后将刷新页面，请稍候」）

**love-app 代码中的实例：**

| 位置 | 文案 | 评价 |
|------|------|------|
| `Settings.vue` 导出成功 | `📤 数据已导出` | ✅ 清晰 + emoji |
| `Settings.vue` 导入成功 | `📥 数据已导入，请刷新页面` | ✅ 清晰，说明后续操作 |
| `Wish.vue` 删除确认 | `确定删除？` | 🟡 可以更温暖 |
| `Wish.vue` 导入失败 | `⚠️ 格式不正确，导入失败` | ✅ 清晰 |
| `Wish.vue` 已存在 | `没有新的内容可导入` | 🟡 可以更友好 |

---

### 2.2 一致性 (Consistency)🔴

> 同一个概念、同一个操作，在整个 App 中用同样的词。

**必须满足：**

- ✅ 同一概念用同一称呼（不出现「愿望」「心愿」「愿望混用」）
- ✅ 同一操作同一文案（不出现「保存成功」「已保存」「修改已保存」三种写法）
- ✅ Toast 结构统一：emoji + 主语 + 结果（如 `👀 昵称已保存`，不出现 `保存好了昵称`）

**应该满足：**

- ✅ 错误文案结构统一：`问题 + 建议`（如 `无法打开摄像头，请检查权限设置`）
- ✅ 空状态结构统一：`[emoji] + 现状 + 引导`（如 `📸 还没有打卡记录哦，开始打卡吧`）
- ✅ 弹窗按钮动词开头、简短（「保存」「取消」「知道了」「删除」）

**锦上添花：**

- 🔮 建立「文案词典」：所有页面共享同一份文案常量，不重复发明

**love-app 代码中的不一致问题：**

| 概念 | 出现位置 | 文案 | 问题 |
|------|---------|------|------|
| 打卡提醒 | `Photo.vue` | `⏰ 中午打卡提醒` | — |
| 打卡提醒 | `Settings.vue` | `⏰ 中午打卡提醒` | ✅ 一致 |
| 提醒开关 | `Photo.vue` | `⏰ 中午打卡提醒` | — |
| 提醒开关 | `Settings.vue` | `⏰ 中午打卡提醒` | ✅ 一致 |
| 提醒已开启 | `Photo.vue` | `⏰ 提醒已开启` | — |
| 提醒已开启 | `Settings.vue` | `⏰ 提醒已开启` | ✅ 一致 |
| 提醒已关闭 | `Photo.vue` | `⏰ 提醒已关闭` | — |
| 提醒已关闭 | `Settings.vue` | `⏰ 提醒已关闭` | ✅ 一致 |
| 删除确认 | `Wish.vue` | `确定删除？` | — |
| 删除确认 | `Lunch.vue` | `确定删除？` | ✅ 一致 |
| 删除确认 | `MessagesAdmin.vue` | `确定删除？` | ✅ 一致 |
| 删除成功 | `Wish.vue` | `已删除` | 🟡 可以更温暖 |
| 删除成功 | `Lunch.vue` | `已删除 ${r.name}` | 🟡 可以更温暖 |
| 删除成功 | `MessagesAdmin.vue` | `🗑️ 留言已删除` | ✅ 有 emoji |
| 昵称保存 | `Settings.vue` | `👧 昵称已保存` | — |
| 昵称保存 | `Settings.vue` | `👦 昵称已保存` | ✅ 一致 |
| 纪念日设置 | `Settings.vue` | `🎂 纪念日已更新` | — |
| 纪念日设置 | `Home.vue` | `🎉 纪念日设置成功！` | 🔴 不一致！ |

**修复建议：** 将「纪念日设置成功！」统一为「🎂 纪念日已更新」

---

### 2.3 语气 (Tone)🔴

> love-app 的语气是「男朋友在说话」——温暖、甜蜜、有点调皮、永远支持。

**必须满足：**

- ✅ 用「你」不用「您」（亲密关系，不是客服）
- ✅ 正面表达为主（「保存成功」而非「没有报错」）
- ✅ 不命令、不指责（「请检查权限」而非「你权限没开」）
- ✅ 错误时给解决方案，不只说「出错了」

**应该满足：**

- ✅ 适当使用 emoji 增加温度（但不过度，一个 Toast 最多 1 个 emoji）
- ✅ 用口语化表达（「再转一次」而非「重新生成结果」）
- ✅ 用「我们」代替「你」（「我们在一起 365 天」而非「你们在一起 365 天」）

**锦上添花：**

- 🔮 根据时间段调整语气（早上更元气，晚上更温柔）
- 🔮 根据用户行为调整语气（连续打卡 7 天比第 1 天更热烈）

**love-app 语气规范：**

| 场景 | 正确 ✅ | 错误 ❌ |
|------|--------|--------|
| 打卡成功 | 🎉 打卡成功！今天也超好看 | 打卡操作已完成 |
| 愿望已许 | ✨ 愿望已许下！ | 数据已保存 |
| 吐槽已记 | 😤 吐槽已记录！ | 提交成功 |
| 无法拍照 | 😢 无法打开摄像头，请检查权限设置 | 摄像头错误 |
| 存储已满 | 💾 存储空间已满，建议导出备份 | QuotaExceededError |
| 密码错误 | ❌ 密码错误，请重试 | 认证失败 |

---

### 2.4 情感化 (Emotional)🟡

> 情感化文案让用户感到被理解、被关怀，是 love-app 的核心竞争力。

**必须满足：**

- ✅ 空状态不冷冰冰（「还没有打卡记录哦，开始打卡吧 📸」而非「暂无数据」）
- ✅ 错误状态不吓人（「无法打开摄像头，请检查权限设置」而非「摄像头错误」）
- ✅ 成就时刻有庆祝（「🎉 连续打卡 7 天！爱情萌芽 🌱」而非「连续打卡 7 天」）

**应该满足：**

- ✅ 重要操作有二次确认，且确认文案有温度（「确定删除？留下回忆可以导出备份哦」）
- ✅ 等待状态有安抚（「正在打开摄像头...」而非空白 loading）
- ✅ 数字出现时有动画配合文案（数字从 0 滚动到 365，配合「在一起第 365 天」）

**锦上添花：**

- 🔮 特殊日子的文案变化（情人节、生日、纪念日）
- 🔮 根据用户行为个性化文案（「今天换了新口红？」vs「今天也很可爱」）

**love-app 情感化实例：**

| 场景 | 当前文案 | 评价 |
|------|---------|------|
| 空愿望池 | `🌈 还没有内容哦` | ✅ 有 emoji，但可以更温暖 |
| 空照片墙 | `📸 还没有打卡记录哦，开始打卡吧` | ✅ 有引导 |
| 空留言 | `💌 还没有留言哦` | ✅ 有 emoji |
| 空留言管理 | `💌 还没有留言，添加第一条吧` | ✅ 有引导 |
| 存储已满 | `💾 写入失败，存储空间可能已满` | 🟡 可以更温暖 |
| 导入成功 | `📥 数据已导入，请刷新页面` | 🟡 可以更庆祝 |
| 密码错误 | `❌ 密码错误，请重试` | ✅ 清晰 |
| 密码错误 | `密码必须是4位数字` | ✅ 清晰 |

---

### 2.5 无障碍 (Accessibility)🟡

> 让所有用户都能理解文案，包括视障用户、老年用户、非母语用户。

**必须满足：**

- ✅ 所有图片/图标有 `alt` 文本（装饰性图标用 `aria-hidden="true"`）
- ✅ 表单输入有 `label` 或 `placeholder`
- ✅ 错误提示不只用颜色区分（配合文字说明）
- ✅ 按钮文字能独立理解（不依赖上下文）

**应该满足：**

- ✅ 使用 `aria-label` 补充简短按钮的语义（如「←」按钮加 `aria-label="返回"`）
- ✅ 动态内容变化用 `aria-live` 通知屏幕阅读器
- ✅ 文案长度适中（太短歧义，太长读不完）

**锦上添花：**

- 🔮 支持动态字号（跟随系统字号设置）
- 🔮 高对比度模式下的文案可读性

**love-app 无障碍现状：**

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 装饰性元素 `aria-hidden` | ✅ | `floating-hearts` 已加 |
| 表单 `label` | ✅ | `van-field` 自带 |
| 按钮文字独立理解 | ✅ | 「保存」「取消」「删除」都清晰 |
| 错误提示不只用颜色 | ✅ | 都有文字说明 |
| `aria-live` 动态通知 | ❌ | Toast 变化未通知屏幕阅读器 |
| 返回按钮 `aria-label` | ❌ | 缺少 |

---

### 2.6 长度控制 (Brevity)🟡

> 移动端屏幕有限，文案要精炼。

**必须满足：**

- ✅ Toast ≤ 20 字（不含 emoji）
- ✅ 按钮文字 ≤ 6 字
- ✅ 弹窗标题 ≤ 12 字
- ✅ 弹窗正文 ≤ 30 字

**应该满足：**

- ✅ 空状态引导 ≤ 20 字
- ✅ 错误提示 ≤ 30 字（含建议）
- ✅ 列表项标题 ≤ 10 字

**love-app 长度检查：**

| 位置 | 文案 | 长度 | 评价 |
|------|------|------|------|
| Toast 导出成功 | `📤 数据已导出` | 7 字 | ✅ |
| Toast 导入成功 | `📥 数据已导入，请刷新页面` | 12 字 | ✅ |
| Toast 打卡成功 | `🎉 打卡成功！` | 6 字 | ✅ |
| Toast 愿望已许 | `✨ 愿望已许下！` | 7 字 | ✅ |
| Toast 吐槽已记 | `😤 吐槽已记录！` | 7 字 | ✅ |
| Toast 存储已满 | `💾 写入 xxx 失败，存储空间可能已满` | 18 字 | ✅ |
| 按钮 许愿 | `✨ 许愿` | 4 字 | ✅ |
| 按钮 吐槽 | `😤 吐槽` | 4 字 | ✅ |
| 按钮 再转 | `🔁 再转（排除当前）` | 9 字 | 🟡 略长 |
| 弹窗标题 删除确认 | `确定删除？` | 5 字 | ✅ |
| 弹窗正文 删除确认 | `确定删除这条内容吗？` | 10 字 | ✅ |
| 空状态 愿望池 | `🌈 还没有内容哦` | 8 字 | ✅ |
| 空状态 照片墙 | `📸 还没有打卡记录哦，开始打卡吧` | 16 字 | ✅ |

---

## 三、主流 UX Writing Linting 工具

### 3.1 工具对比

| 工具 | 类型 | 语言支持 | 适用场景 | 推荐度 |
|------|------|---------|---------|--------|
| **Vale** | 风格指南 linter | 多语言（含中文） | 文档、Markdown、代码注释 | ⭐⭐⭐⭐⭐ |
| **write-good** | 英文写作检查 | 仅英文 | 英文文案、博客 | ⭐⭐⭐ |
| **alex** | 敏感词检查 | 仅英文 | 英文文案、文档 | ⭐⭐⭐ |
| **textlint** | 文本 linter | 多语言（含中文） | 日文/中文文档、代码 | ⭐⭐⭐⭐ |
| **ESLint plugin** | 代码内文案检查 | 多语言 | 代码中的硬编码文案 | ⭐⭐⭐⭐ |
| **自定义脚本** | 项目特定规则 | 任意 | 项目特定文案规范 | ⭐⭐⭐⭐⭐ |

### 3.2 Vale（强烈推荐）

**Vale** 是一个基于规则的写作风格检查工具，支持自定义规则集。

**安装：**

```bash
# macOS
brew install vale

# 或下载 binary
# https://github.com/errata-ai/vale/releases
```

**配置 `.vale.ini`（放在项目根目录）：**

```ini
# .vale.ini
StylesPath = .vale
MinAlertLevel = warning

[*.md]
BasedOnStyles = Google, write-good, love-app

[*.vue]
BasedOnStyles = love-app
TokenRegex = '([\w\.]+)'

# 忽略 node_modules 和 dist
[node_modules/**]
[dist/**]
```

**自定义规则集 `.vale/styles/love-app.yml`：**

```yaml
# .vale/styles/love-app.yml
extends: existence
message: "避免使用 '%s'，love-app 用更温暖的表达"
level: warning
tokens:
  - 操作成功
  - 操作失败
  - 暂无数据
  - 请稍后重试
  - 系统错误
  - 非法输入
  - 确认提交
```

**运行：**

```bash
# 检查单个文件
vale src/views/Home.vue

# 检查整个项目
vale src/ docs/

# 输出 JSON 格式（CI 集成用）
vale --output=JSON src/
```

### 3.3 textlint（中文友好）

**textlint** 是一个可插拔的文本 linter，对中文支持良好。

**安装：**

```bash
npm install --save-dev textlint
npm install --save-dev textlint-rule-ja-no-redundant-expression
npm install --save-dev textlint-rule-ja-no-successive-word
npm install --save-dev textlint-rule-max-todo
npm install --save-dev textlint-rule-preset-ja-technical-writing
npm install --save-dev textlint-rule-preset-jtf-style
```

**配置 `.textlintrc`：**

```json
{
  "rules": {
    "preset-ja-technical-writing": {
      "no-exclamation-question-mark": false,
      "ja-no-mixed-period": true,
      "max-kanji-continuous-len": 10
    },
    "preset-jtf-style": {
      "2.1.8.フォントの使用": false,
      "2.2.2.漢字とひらがなの混在": false,
      "3.1.1.全角文字と半角文字の間": true,
      "4.2.7.コロン(：)": true
    },
    "max-todo": false
  },
  "filters": {
    "comments": true
  }
}
```

### 3.4 自定义文案 Linter（推荐）

对于 love-app 这种中文情感化产品，**自定义脚本**是最实用的方案。

**`scripts/ux-writing-lint.js`：**

```javascript
#!/usr/bin/env node
/**
 * UX Writing Linter for love-app
 * 检查 Vue 文件中的文案是否符合规范
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  srcDir: path.join(__dirname, '..', 'src'),
  maxToastLength: 20,      // Toast 最大长度（不含 emoji）
  maxButtonLength: 6,      // 按钮最大长度
  maxTitleLength: 12,      // 弹窗标题最大长度
  maxBodyLength: 30,       // 弹窗正文最大长度
  maxEmptyStateLength: 20, // 空状态最大长度
};

// 禁止的词汇（技术术语、冷冰冰的表达）
const FORBIDDEN_WORDS = [
  { word: '操作成功', suggestion: '用更具体的表达，如「保存成功」「打卡成功」' },
  { word: '操作失败', suggestion: '用更具体的表达，如「保存失败」「网络错误」' },
  { word: '暂无数据', suggestion: '用空状态引导文案，如「还没有打卡记录哦」' },
  { word: '请稍后重试', suggestion: '用更温暖的表达，如「稍后再试试～」' },
  { word: '系统错误', suggestion: '用更友好的表达，如「出了点小问题」' },
  { word: '非法输入', suggestion: '用更友好的表达，如「输入内容不符合要求」' },
  { word: '确认提交', suggestion: '用动词开头，如「提交」「保存」' },
  { word: 'localStorage', suggestion: '对用户隐藏技术术语' },
  { word: 'API', suggestion: '对用户隐藏技术术语' },
  { word: 'HTTP', suggestion: '对用户隐藏技术术语' },
  { word: 'Token', suggestion: '对用户隐藏技术术语' },
  { word: '认证失败', suggestion: '用「密码错误」或「登录失败」' },
  { word: '权限不足', suggestion: '用「需要xxx权限」' },
];

// 语气检查规则
const TONE_RULES = [
  { pattern: /您/g, message: 'love-app 用「你」不用「您」' },
  { pattern: /请进行/g, message: '避免命令式语气，用更口语化的表达' },
  { pattern: /必须/g, message: '避免强制语气，用建议式表达' },
  { pattern: /不得/g, message: '避免否定式表达，用正面引导' },
];

// 提取 Vue 文件中的文案
function extractTextFromVue(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const results = [];

  // 匹配 template 中的文本内容
  // 匹配双引号中的中文文本
  const textRegex = /["']([^"']*[\u4e00-\u9fa5]+[^"']*)["']/g;
  let match;
  while ((match = textRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 0) {
      results.push({
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        text: text,
        type: 'template-text'
      });
    }
  }

  // 匹配 showToast 调用
  const toastRegex = /showToast\(\s*\{[^}]*message:\s*["']([^"']+)["']/g;
  while ((match = toastRegex.exec(content)) !== null) {
    results.push({
      file: filePath,
      line: content.substring(0, match.index).split('\n').length,
      text: match[1],
      type: 'toast'
    });
  }

  // 匹配 placeholder
  const placeholderRegex = /placeholder=["']([^"']+)["']/g;
  while ((match = placeholderRegex.exec(content)) !== null) {
    results.push({
      file: filePath,
      line: content.substring(0, match.index).split('\n').length,
      text: match[1],
      type: 'placeholder'
    });
  }

  // 匹配 title 属性
  const titleRegex = /title=["']([^"']+)["']/g;
  while ((match = titleRegex.exec(content)) !== null) {
    results.push({
      file: filePath,
      line: content.substring(0, match.index).split('\n').length,
      text: match[1],
      type: 'title'
    });
  }

  return results;
}

// 检查文案
function checkText(item) {
  const issues = [];
  const text = item.text;

  // 检查禁止词汇
  for (const { word, suggestion } of FORBIDDEN_WORDS) {
    if (text.includes(word)) {
      issues.push({
        severity: 'error',
        type: 'forbidden-word',
        message: `包含禁止词汇「${word}」`,
        suggestion: suggestion,
      });
    }
  }

  // 检查语气
  for (const { pattern, message } of TONE_RULES) {
    if (pattern.test(text)) {
      issues.push({
        severity: 'warning',
        type: 'tone',
        message: message,
      });
    }
  }

  // 检查长度
  const textLength = text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').length; // 排除 emoji
  if (item.type === 'toast' && textLength > CONFIG.maxToastLength) {
    issues.push({
      severity: 'warning',
      type: 'length',
      message: `Toast 文案过长（${textLength} 字，建议 ≤ ${CONFIG.maxToastLength} 字）`,
    });
  }

  // 检查是否缺少 emoji（Toast 应该以 emoji 开头）
  if (item.type === 'toast' && !/^[\uD800-\uDBFF]/.test(text) && !/^[✨🎉😤💾📥📤🕐⏰❌✅🔑🗑️👧👦💌❤️🎂🎊🔥💖🌟]/.test(text)) {
    issues.push({
      severity: 'suggestion',
      type: 'emoji',
      message: 'Toast 文案建议以 emoji 开头，增加情感化',
    });
  }

  return issues;
}

// 主函数
function main() {
  const files = execSync(`find ${CONFIG.srcDir} -name "*.vue" -o -name "*.js"`)
    .toString()
    .trim()
    .split('\n')
    .filter(f => !f.includes('node_modules'));

  let totalIssues = 0;
  const allIssues = [];

  for (const file of files) {
    const texts = extractTextFromVue(file);
    for (const item of texts) {
      const issues = checkText(item);
      for (const issue of issues) {
        totalIssues++;
        allIssues.push({
          ...issue,
          file: path.relative(process.cwd(), file),
          line: item.line,
          text: item.text,
        });
      }
    }
  }

  // 输出结果
  if (totalIssues === 0) {
    console.log('✅ 文案检查通过，没有发现问题！');
    process.exit(0);
  }

  // 按严重程度排序
  const severityOrder = { error: 0, warning: 1, suggestion: 2 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  console.log(`\n🔍 文案检查发现 ${totalIssues} 个问题：\n`);

  for (const issue of allIssues) {
    const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : '💡';
    console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.file}:${issue.line}`);
    console.log(`   文案: "${issue.text}"`);
    console.log(`   问题: ${issue.message}`);
    if (issue.suggestion) {
      console.log(`   建议: ${issue.suggestion}`);
    }
    console.log();
  }

  // 如果有 error，返回非零退出码
  const hasErrors = allIssues.some(i => i.severity === 'error');
  process.exit(hasErrors ? 1 : 0);
}

main();
```

---

## 四、CI/CD 集成方案

### 4.1 集成点

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline                           │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │  Commit  │───▶│  Build   │───▶│  Test    │───▶│ Deploy ││
│  └──────────┘    └──────────┘    └──────────┘    └────────┘│
│       │                │                │               │   │
│       ▼                ▼                ▼               ▼   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │ Pre-     │    │ ESLint   │    │ Unit     │    │ Smoke  ││
│  │ commit   │    │ Vue      │    │ Test     │    │ Test   ││
│  │ hook     │    │ lint     │    │          │    │        ││
│  │          │    │          │    │          │    │        ││
│  │ ★ UX     │    │ ★ UX     │    │          │    │        ││
│  │ Writing  │    │ Writing  │    │          │    │        ││
│  │ Lint     │    │ Lint     │    │          │    │        ││
│  └──────────┘    └──────────┘    └──────────┘    └────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 GitHub Actions 配置

```yaml
# .github/workflows/ux-writing.yml
name: UX Writing Quality Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ux-writing-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # 方案 A：自定义脚本
      - name: Run UX Writing Lint
        run: node scripts/ux-writing-lint.js

      # 方案 B：Vale（如果配置了）
      - name: Run Vale
        uses: errata-ai/vale-action@reviewdog
        with:
          files: 'src/,docs/'
          reporter: github-pr-review
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # 方案 C：检查文案一致性
      - name: Check text consistency
        run: node scripts/check-text-consistency.js
```

### 4.3 Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 检查 UX 文案质量..."

# 只检查暂存的 Vue 文件
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(vue|js)$' || true)

if [ -n "$STAGED_FILES" ]; then
  echo "$STAGED_FILES" | xargs node scripts/ux-writing-lint.js
fi
```

### 4.4 文案一致性检查脚本

```javascript
// scripts/check-text-consistency.js
/**
 * 检查文案一致性
 * 1. 同一概念是否用同一称呼
 * 2. Toast 结构是否统一
 * 3. 空状态结构是否统一
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 提取所有 showToast 调用
function extractToasts(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const toasts = [];
  const regex = /showToast\(\s*\{[^}]*message:\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    toasts.push(match[1]);
  }
  return toasts;
}

// 检查 Toast 结构
function checkToastStructure(toasts) {
  const issues = [];
  
  for (const toast of toasts) {
    // 检查是否以 emoji 开头
    const startsWithEmoji = /^[\uD800-\uDBFF\uD83C-\uDB3F]/.test(toast);
    if (!startsWithEmoji) {
      issues.push({
        text: toast,
        issue: 'Toast 应以 emoji 开头',
      });
    }
  }
  
  return issues;
}

// 检查同一概念的不同称呼
function checkConceptConsistency(files) {
  const conceptMap = {
    '打卡': /打卡/g,
    '拍照': /拍照/g,
    '愿望': /愿望/g,
    '吐槽': /吐槽/g,
    '留言': /留言/g,
    '转盘': /转盘/g,
    '餐厅': /餐厅/g,
    '提醒': /提醒/g,
    '导出': /导出/g,
    '导入': /导入/g,
    '删除': /删除/g,
    '保存': /保存/g,
    '昵称': /昵称/g,
    '密码': /密码/g,
  };

  const issues = [];
  
  for (const [concept, regex] of Object.entries(conceptMap)) {
    // 检查是否有同义词混用
    const synonyms = {
      '打卡': ['签到', '记录'],
      '拍照': ['拍摄', '自拍', '照相'],
      '愿望': ['心愿', '希望'],
      '吐槽': ['抱怨', '不满'],
      '留言': ['消息', '便条'],
      '转盘': ['轮盘', '旋转'],
      '餐厅': ['饭店', '饭馆', '美食'],
      '提醒': ['通知', '闹钟'],
      '导出': ['下载', '输出'],
      '导入': ['上传', '恢复'],
      '删除': ['移除', '清除'],
      '保存': ['存储', '确认'],
      '昵称': ['名字', '称呼'],
      '密码': ['口令', '密钥'],
    };

    const allSynonyms = synonyms[concept] || [];
    for (const syn of allSynonyms) {
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes(syn)) {
          issues.push({
            file: path.relative(process.cwd(), file),
            issue: `使用了「${syn}」，建议统一为「${concept}」`,
          });
        }
      }
    }
  }
  
  return issues;
}

// 主函数
function main() {
  const files = execSync(`find src -name "*.vue" -o -name "*.js"`)
    .toString()
    .trim()
    .split('\n')
    .filter(f => !f.includes('node_modules'));

  let allToasts = [];
  for (const file of files) {
    allToasts = allToasts.concat(extractToasts(file));
  }

  const toastIssues = checkToastStructure(allToasts);
  const conceptIssues = checkConceptConsistency(files);

  const totalIssues = toastIssues.length + conceptIssues.length;
  
  if (totalIssues === 0) {
    console.log('✅ 文案一致性检查通过！');
    process.exit(0);
  }

  console.log(`\n🔍 发现 ${totalIssues} 个一致性问题：\n`);

  if (toastIssues.length > 0) {
    console.log('📱 Toast 结构问题：');
    for (const issue of toastIssues) {
      console.log(`  ⚠️ "${issue.text}" — ${issue.issue}`);
    }
    console.log();
  }

  if (conceptIssues.length > 0) {
    console.log('📝 概念一致性问题：');
    for (const issue of conceptIssues) {
      console.log(`  ⚠️ ${issue.file}: ${issue.issue}`);
    }
    console.log();
  }

  process.exit(1);
}

main();
```

---

## 五、love-app UX 文案质量审核流程

### 5.1 审核流程总览

```
┌─────────────────────────────────────────────────────────────┐
│              UX Writing QA 审核流程                         │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │ 1. 自动  │───▶│ 2. 人工  │───▶│ 3. 审核  │───▶│ 4. 上线││
│  │    检查  │    │    走查  │    │    确认  │    │        ││
│  └──────────┘    └──────────┘    └──────────┘    └────────┘│
│       │                │                │               │   │
│       ▼                ▼                ▼               ▼   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │ 语法/    │    │ 设计师   │    │ 产品     │    │ 监控   ││
│  │ 风格/    │    │ 逐页     │    │ 经理     │    │ 用户   ││
│  │ 一致性   │    │ 走查     │    │ 最终     │    │ 反馈   ││
│  │          │    │          │    │ 确认     │    │        ││
│  │ 阻断级   │    │ 体验级   │    │ 决策级   │    │ 迭代   ││
│  └──────────┘    └──────────┘    └──────────┘    └────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 阶段一：自动检查（每次 Commit）

**触发时机：** `git commit` 时自动执行（通过 husky pre-commit hook）

**检查内容：**

| 检查项 | 工具 | 阻断级别 |
|--------|------|---------|
| 禁止词汇（技术术语、冷冰冰表达） | 自定义脚本 | 🔴 阻断 |
| 语气检查（您、必须、不得） | 自定义脚本 | 🟡 警告 |
| 长度检查（Toast/按钮/标题） | 自定义脚本 | 🟡 警告 |
| 概念一致性（同义词混用） | 自定义脚本 | 🟡 警告 |
| 文案结构（Toast emoji 开头） | 自定义脚本 | 💡 建议 |

**执行命令：**

```bash
# 手动运行
node scripts/ux-writing-lint.js

# 只检查特定文件
node scripts/ux-writing-lint.js src/views/Home.vue
```

**输出示例：**

```
🔍 文案检查发现 3 个问题：

❌ [ERROR] src/views/Settings.vue:306
   文案: "操作成功"
   问题: 包含禁止词汇「操作成功」
   建议: 用更具体的表达，如「保存成功」「打卡成功」

⚠️ [WARNING] src/views/Wish.vue:306
   文案: "确定删除？"
   问题: love-app 用「你」不用「您」
   建议: 改为「确定删除吗？」

💡 [SUGGESTION] src/views/Home.vue:306
   文案: "纪念日设置成功！"
   问题: Toast 文案建议以 emoji 开头，增加情感化
   建议: 改为 "🎂 纪念日设置成功！"
```

### 5.3 阶段二：人工走查（每个功能开发完成）

**触发时机：** 代码智能体完成一个功能后，审核智能体进行代码审核时同步检查

**走查清单：**

#### 5.3.1 逐页走查清单

对每个页面，回答以下问题：

**首页 (Home.vue)**

- [ ] 「在一起 X 天」数字动画配合文案是否流畅？
- [ ] 状态圆文案（已打卡/未打卡/已选/未选）是否清晰？
- [ ] 留言预览文案是否截断合理？
- [ ] 周打卡进度文案（连续 X 天）是否激励？
- [ ] 空状态（未设置纪念日）引导是否明确？

**拍照打卡 (Photo.vue)**

- [ ] 拍照流程各状态文案是否清晰？（正在打开摄像头... → 咔嚓！拍照 → 再拍一张/用这张）
- [ ] 彩虹屁文案是否自然、不重复、有情感？
- [ ] 照片墙空状态是否温暖？
- [ ] 成就徽章文案是否有激励性？
- [ ] 提醒设置文案是否清晰？

**午餐转盘 (Lunch.vue)**

- [ ] 转盘结果文案是否有庆祝感？
- [ ] 「再转一次」按钮是否清晰表达「排除当前」？
- [ ] 统计文案是否有趣味性？
- [ ] 餐厅管理操作文案是否清晰？

**愿望池 (Wish.vue)**

- [ ] 输入引导文案是否温暖？
- [ ] 愿望/吐槽/已实现的视觉区分是否清晰？
- [ ] 空状态是否温暖？
- [ ] 删除确认是否有温度？
- [ ] 操作菜单文案是否清晰？

**设置 (Settings.vue)**

- [ ] 各设置项标签是否清晰？
- [ ] 危险操作（清除数据）是否有足够警告？
- [ ] 隐私说明文案是否让用户安心？
- [ ] 导入/导出文案是否清晰？

**留言管理 (MessagesAdmin.vue)**

- [ ] 密码输入提示是否清晰？
- [ ] 留言类型标签是否好理解？
- [ ] 空状态引导是否明确？

#### 5.3.2 跨页面一致性检查

- [ ] 同一操作在不同页面的 Toast 是否一致？
- [ ] 同一概念在不同页面的称呼是否一致？
- [ ] 空状态的结构是否统一？
- [ ] 错误提示的结构是否统一？
- [ ] 按钮文案的动词是否统一？

### 5.4 阶段三：审核确认（PR 提交前）

**触发时机：** 提交 PR 前，由审核智能体或人工审核

**审核内容：**

| 审核项 | 方法 | 通过标准 |
|--------|------|---------|
| 自动检查 | 运行 `ux-writing-lint.js` | 0 error，warning ≤ 3 |
| 人工走查 | 逐页走查清单 | 所有项通过 |
| 一致性检查 | 运行 `check-text-consistency.js` | 0 不一致 |
| 语气抽样 | 随机抽取 10 条文案评估 | 100% 符合品牌语气 |
| 长度检查 | 检查所有 Toast/按钮/标题 | 100% 符合长度限制 |

**审核报告模板：**

```markdown
## UX Writing QA 报告 — PR #XX

### 自动检查结果
- ❌ Error: 0
- ⚠️ Warning: 2
- 💡 Suggestion: 1

### 人工走查结果
- ✅ 首页: 通过
- ✅ 拍照打卡: 通过
- ⚠️ 午餐转盘: 「再转」按钮略长，建议改为「🔁 再转」
- ✅ 愿望池: 通过
- ✅ 设置: 通过
- ✅ 留言管理: 通过

### 一致性检查
- ✅ Toast 结构统一
- ✅ 概念称呼统一
- ⚠️ 发现 1 处「纪念日设置成功！」与「纪念日已更新」不一致

### 建议
1. 统一纪念日设置成功文案为「🎂 纪念日已更新」
2. 缩短午餐转盘「再转」按钮文案

### 结论
✅ 通过（有 2 个 warning，不阻塞上线）
```

### 5.5 阶段四：上线后监控

**监控指标：**

| 指标 | 方法 | 目标 |
|------|------|------|
| 文案相关用户反馈 | 用户反馈收集 | 0 投诉 |
| 操作完成率 | 埋点统计 | 不下降 |
| 错误操作率 | 埋点统计 | 不上升 |
| 用户留存 | 数据分析 | 不下降 |

**反馈收集方式：**

- 在设置页添加「意见反馈」入口（可简单到只复制邮箱）
- 关注用户在使用过程中是否有困惑（通过用户测试观察）

---

## 六、文案词典（Glossary）

### 6.1 核心概念称呼

| 概念 | 统一称呼 | 禁止用法 | 说明 |
|------|---------|---------|------|
| 拍照记录 | 打卡 | 签到、记录 | 每天拍照打卡 |
| 拍照 | 拍照 | 拍摄、自拍、照相 | 打开摄像头拍照 |
| 夸奖文案 | 彩虹屁 | 夸夸、夸奖、赞美 | 拍照后生成的夸奖 |
| 午餐选择 | 转盘 | 轮盘、旋转 | 午餐大转盘 |
| 愿望 | 愿望 | 心愿、希望 | 许下愿望 |
| 吐槽 | 吐槽 | 抱怨、不满 | 记录吐槽 |
| 留言 | 留言 | 消息、便条 | 男朋友的留言 |
| 提醒 | 提醒 | 通知、闹钟 | 打卡提醒 |
| 导出 | 导出 | 下载、输出 | 导出数据 |
| 导入 | 导入 | 上传、恢复 | 导入数据 |
| 删除 | 删除 | 移除、清除 | 删除操作 |
| 保存 | 保存 | 存储、确认 | 保存设置 |
| 昵称 | 昵称 | 名字、称呼 | 用户昵称 |
| 密码 | 密码 | 口令、密钥 | 管理密码 |
| 餐厅 | 餐厅 | 饭店、饭馆 | 午餐转盘餐厅 |
| 成就 | 成就 | 奖励、荣誉 | 打卡成就 |
| 连续打卡 | 连续打卡 | 连续签到 | 连续打卡天数 |

### 6.2 Toast 模板

| 场景 | 模板 | 示例 |
|------|------|------|
| 保存成功 | `🎂 ${内容}已保存` | `🎂 纪念日已保存` |
| 更新成功 | `✅ ${内容}已更新` | `✅ 昵称已更新` |
| 删除成功 | `🗑️ ${内容}已删除` | `🗑️ 餐厅已删除` |
| 导出成功 | `📤 数据已导出` | `📤 数据已导出` |
| 导入成功 | `📥 数据已导入，请刷新页面` | `📥 数据已导入，请刷新页面` |
| 打卡成功 | `🎉 打卡成功！` | `🎉 打卡成功！` |
| 愿望已许 | `✨ 愿望已许下！` | `✨ 愿望已许下！` |
| 吐槽已记 | `😤 吐槽已记录！` | `😤 吐槽已记录！` |
| 操作失败 | `❌ ${原因}，${建议}` | `❌ 密码错误，请重试` |
| 存储已满 | `💾 存储空间已满，建议导出备份` | `💾 存储空间已满，建议导出备份` |
| 网络错误 | `🌐 网络连接失败，请检查网络` | `🌐 网络连接失败，请检查网络` |
| 权限不足 | `🔒 需要${权限}权限` | `🔒 需要摄像头权限` |

### 6.3 空状态模板

| 场景 | 模板 |
|------|------|
| 无数据 | `[emoji] 还没有${内容}哦，${引导}` |
| 无照片 | `📸 还没有打卡记录哦，开始打卡吧` |
| 无愿望 | `🌈 还没有内容哦` |
| 无留言 | `💌 还没有留言哦` |
| 无餐厅 | `🍽️ 还没有添加餐厅哦` |
| 无成就 | `🏆 还没有获得成就，继续加油！` |

### 6.4 确认弹窗模板

| 场景 | 标题 | 正文 |
|------|------|------|
| 删除确认 | `确定删除？` | `确定删除这条内容吗？` |
| 清除数据 | `清除所有数据？` | `此操作不可恢复，建议先导出备份` |
| 重置列表 | `重置餐厅列表？` | `将恢复默认餐厅列表` |

---

## 七、实施计划

### Phase 1：基础建设（1-2 天）

- [ ] 创建 `scripts/ux-writing-lint.js`
- [ ] 创建 `scripts/check-text-consistency.js`
- [ ] 配置 husky pre-commit hook
- [ ] 修复现有不一致问题（纪念日设置成功文案）

### Phase 2：CI 集成（2-3 天）

- [ ] 创建 `.github/workflows/ux-writing.yml`
- [ ] 配置 GitHub Actions
- [ ] 测试 CI 流程

### Phase 3：流程落地（持续）

- [ ] 每次功能开发完成执行人工走查
- [ ] 每次 PR 提交前执行自动检查
- [ ] 每月回顾文案质量，更新规则

---

## 八、附录

### 8.1 相关文件

| 文件 | 说明 |
|------|------|
| `scripts/ux-writing-lint.js` | 文案 linter 主脚本 |
| `scripts/check-text-consistency.js` | 一致性检查脚本 |
| `.vale.ini` | Vale 配置（可选） |
| `.textlintrc` | textlint 配置（可选） |
| `.github/workflows/ux-writing.yml` | CI 配置 |
| `docs/UX_WRITING_QA.md` | 本文档 |

### 8.2 参考资料

- [Google Developer Documentation Style Guide](https://developers.google.com/style)
- [Apple Style Guide](https://help.apple.com/applestyleguide/)
- [Vale 官方文档](https://vale.sh/docs/)
- [textlint 官方文档](https://textlint.github.io/)
- [UX Writing Hub](https://uxwritinghub.com/)
- [Nielsen Norman Group — UX Writing](https://www.nngroup.com/articles/ux-writing/)

---

> 本规范由 Hermes Agent 基于 love-app v2.0 代码库分析生成
> 最后更新：2026-07-07
