# 纪念日模块 — 设计稿

> 版本：v1.0  
> 日期：2026-07-08  
> 范围：UI 线框、交互状态、配色方案、推送策略、路由配置

---

## 1. 新增页面与路由

### 1.1 路由配置

在 `src/router/index.js` 新增：

```js
{
  path: '/anniversary',
  name: 'Anniversary',
  component: () => import('../views/Anniversary.vue')
}
```

### 1.2 TabBar 扩展

App.vue 的 `<van-tabbar>` 新增一个 item：

```html
<van-tabbar-item to="/anniversary" icon="gift-o">纪念</van-tabbar-item>
```

> 注：Vant 内置 `gift-o` 图标语义最贴近「纪念日」。

---

## 2. 页面结构线框图

### 2.1 纪念日列表（主页面 — Anniversary.vue）

```
┌──────────────────────────────────────┐
│           🎂 纪念日           ⚙️    │  ← 页面标题 + 设置入口
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 💕 恋爱纪念日                  │  │  ← 卡片（类型颜色左边框）
│  │    2024-07-01                  │  │
│  │    相守 365 天  🎉             │  │  ← 相守天数（大字号）
│  │                   ❯ 展开       │  │  ← 展开/收起箭头
│  ├────────────────────────────────┤  │
│  │ 备注：在一起的第一天            │  │  ← 展开后显示
│  │ 提醒：提前 1/3/7 天            │  │
│  │ 创建于：2025-01-01              │  │
│  │                    [编辑] [删除]│  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🎂 小宝贝生日                  │  │
│  │    1998-03-15                  │  │
│  │    还有 15 天  🎁              │  │  ← 倒计时（未来日期）
│  │                   ❯ 展开       │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🎉 情人节 💘                   │  │
│  │    2026-02-14                  │  │
│  │    已过 145 天                 │  │  ← 已过去（原始日期在今年已过）
│  │                   ❯ 展开       │  │
│  └────────────────────────────────┘  │
│                                      │
│                          [ + 添加 ]  │  ← FAB 按钮（右下浮动）
└──────────────────────────────────────┘
```

### 2.2 空态（无纪念日）

```
┌──────────────────────────────────────┐
│           🎂 纪念日           ⚙️    │
├──────────────────────────────────────┤
│                                      │
│              🎂                      │
│                                      │
│       还没有纪念日                    │
│   点击下方按钮添加第一个吧             │
│                                      │
│         [ + 添加纪念日 ]              │
│                                      │
└──────────────────────────────────────┘
```

### 2.3 添加/编辑弹窗（Vant Dialog）

```
┌──────────────────────────────────────┐
│           💕 添加纪念日               │  ← 标题（编辑时：编辑纪念日）
├──────────────────────────────────────┤
│                                      │
│  名称  *                             │
│  ┌────────────────────────────────┐  │
│  │ 如：恋爱纪念日                  │  │  ← van-field 文本输入
│  └────────────────────────────────┘  │
│                                      │
│  日期  *                             │
│  ┌────────────────────────────────┐  │
│  │  📅 2024-07-01                 │  │  ← van-picker 日期选择器
│  └────────────────────────────────┘  │
│                                      │
│  类型  *                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│  ← van-radio-group 类型选择
│  │💕周年│ │🎂生日│ │🎉节日│ │🌟自定义││
│  └──────┘ └──────┘ └──────┘ └──────┘│
│                                      │
│  备注                                │
│  ┌────────────────────────────────┐  │
│  │ （ optional ）                  │  │
│  └────────────────────────────────┘  │
│                                      │
│  提前提醒                            │
│  ☑ 1 天前  ☑ 3 天前  ☐ 7 天前      │  ← van-checkbox 多选
│                                      │
├──────────────────────────────────────┤
│  [取消]                    [保存 💕]  │
└──────────────────────────────────────┘
```

### 2.4 删除确认弹窗

```
┌──────────────────────────────────────┐
│                 ⚠️                    │
├──────────────────────────────────────┤
│                                      │
│  确定要删除【恋爱纪念日】吗？          │
│  删除后无法恢复                       │
│                                      │
├──────────────────────────────────────┤
│  [取消]                    [确认删除] │
└──────────────────────────────────────┘
```

---

## 3. 交互状态定义

### 3.1 纪念日卡片状态

| 状态 | 视觉 | 触发 |
|------|------|------|
| **默认** | 白色卡片 + 左侧 4px 类型色条 | 列表加载 |
| **展开** | 卡片高度增加 inline 详情区 | 点击卡片主体 |
| **今天（_N=0_）** | 金色渐变边框 + 微动效 | nextOccurrence === today |
| **长按** | | 未实现（MVP 仅支持点击图标删除）|

### 3.2 添加/编辑弹窗状态

| 状态 | 视觉/行为 |
|------|----------|
| **空值保存** | 点击保存时名称空 → 输入框红色边框 + 文案「请输入名称」|
| **名称过长** | 名称 > 20 字 → 输入框截断，禁止继续输入 |
| **保存中** | loading 按钮 |
| **保存成功** | Dialog close + Toast「已添加 💕」+ 列表刷新 |
| **保存失败** | Toast 提示「存储失败，请清理空间」|

### 3.3 空态 → 添加流程

1. 用户进入「纪念」Tab → 看到空态页面
2. 点击「+ 添加纪念日」→ 弹出添加弹窗
3. 保存成功 → 空态消失，列表区渲染第一条卡片

### 3.4 列表交互优先级

| 交互 | 优先级 | 说明 |
|------|--------|------|
| 卡片点击展开 | P0 | 必须支持 |
| 编辑按钮 | P0 | 必须支持 |
| 删除按钮 | P0 | 必须支持 |
| FAB 添加 | P0 | 必须支持 |
| 长按快捷操作 | P2 | MVP 不做 |
| 拖拽排序 | P2 | MVP 不做 |
| 左滑删除 | P2 | MVP 不做 |

---

## 4. 配色方案

### 4.1 纪念日模块专属色

```css
/* 纪念日金色 — 当天高亮、数字强调 */
--anniv-gold: #F4C765;
--anniv-gold-light: #FCE4A8;
--anniv-gold-bg: #FDF8E8;

/* 纪念日卡片左侧类型色条 */
--anniv-color-anniversary: #F4C765; /* 金色 */
--anniv-color-birthday:    #E8758A; /* 粉色（沿用主色）*/
--anniv-color-holiday:     #A78BFA; /* 紫色 */
--anniv-color-custom:      #60A5FA; /* 蓝色 */

/* 当天卡片特效 */
--anniv-today-shadow: 0 0 0 2px #F4C765, 0 4px 16px rgba(244, 199, 101, 0.25);
```

### 4.2 主题保持

| 元素 | 颜色变量 | 说明 |
|------|----------|------|
| 页面背景 | `--bg` | 沿用在 main.css |
| 卡片背景 | `--bg-card` | 白色 |
| 主要文字 | `--text` | #1D1D1F |
| 次要文字 | `--text-secondary` | #86868B |
| 主操作按钮 | `--primary` | #E8758A（粉色，与 App 统一）|
| 纪念日数字强调 | `--anniv-gold` | #F4C765（新增强调色）|
| 当天高亮 | `--anniv-gold-light` | #FCE4A8 |

### 4.3 暗色模式适配

```css
html[data-theme="dark"] {
  --anniv-gold: #D4A84B;
  --anniv-gold-light: #8B7535;
  --anniv-gold-bg: #2A2520;
  --anniv-today-shadow: 0 0 0 2px #D4A84B, 0 4px 16px rgba(212, 168, 75, 0.2);
}
```

---

## 5. 推送策略详细设计

### 5.1 推送时机

```
纪念日当天 00:00  → 不推送（不打扰）
提前 7 天         → 推送一次
提前 3 天         → 推送一次
提前 1 天         → 推送一次（最近的天数推送文案最紧迫）
```

### 5.2 推送文案模板

| 提前天数 | 文案模板 |
|----------|----------|
| 7 天 | 「💕 距离【恋爱纪念日】还有 7 天」|
| 3 天 | 「💕 距离【小宝贝生日】还有 3 天，准备礼物吧」|
| 1 天 | 「🎂 【小宝贝生日】就是明天！别忘了 🎉」|
| 当天（不推送）| — |

### 5.3 防重复推送

```js
// 推送记录存储 key
const KEY_ANNIV_NOTIFICATION_SENT = 'anniv_notification_sent'
// 值格式：{ "ann_123_2026-07-01": true }

function shouldNotify(anniversary, dateStr) {
  const records = safeGetJSON(KEY_ANNIV_NOTIFICATION_SENT, {})
  const notifyKey = `${anniversary.id}_${dateStr}`
  return !records[notifyKey]
}
```

### 5.4 推送权限

- 用户可在设置页开启/关闭「纪念日推送」
- App 不在启动时主动请求通知权限
- 设置页有引导按钮：点击后调用 `Notification.requestPermission()`

### 5.5 技术实现

使用原生 Notification API + Service Worker（PWA 已注册）：

```js
function sendAnniversaryNotification(title, body) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  navigator.serviceWorker?.ready.then(registration => {
    registration.showNotification(title, {
      body,
      icon: '/icons/anniversary-192.png',
      badge: '/icons/badge-72.png',
      tag: 'anniversary-' + Date.now(),
      renotify: false,
      data: { url: '/anniversary' }
    })
  })
}
```

---

## 6. 组件复用清单

| Vant 组件 | 用途 | 复用场景 |
|-----------|------|----------|
| `van-card` / `van-cell-group` | 纪念日卡片 | 列表中的每个纪念日条目 |
| `van-dialog` | 添加/编辑弹窗 | 添加、编辑、删除确认 |
| `van-field` | 输入框 | 名称、备注 |
| `van-picker` | 日期选择器 | 选择纪念日日期 |
van-radio-group | 类型选择 | 4 种类型单选 |
| `van-checkbox-group` | 提醒时机选择 | 1/3/7 天多选 |
| `van-button` | 操作按钮 | 保存、取消、删除 |
| `van-toast` | 成功/失败提示 | 所有操作反馈 |
| `van-empty` / 自定义 | 空态页面 | 无纪念日时 |
| `van-tag` | 类型标签 | 展开详情中显示类型 |

---

## 7. 文件结构与代码量预估

```
src/
├── views/
│   └── Anniversary.vue          ← 纪念日列表页面（~170 行）
├── composables/
│   └── useAnniversary.js        ← 纪念日逻辑（~120 行）
├── stores/
│   └── dataStore.js             ← 新增 anniversaries 状态 + 方法（+60 行）
├── composables/
│   └── useStorage.js            ← 新增 KEY_ANNIVERSARIES 常量（+2 行）
└── assets/styles/
    └── anniversary.css          ← 纪念日模块样式（~80 行）

预估总代码量：~432 行（核心功能 < 500 行）
```

### 7.1 Anniversary.vue 结构伪代码

```vue
<template>
  <div class="page anniversary-page">
    <div class="page-header">
      <h2>🎂 纪念日</h2>
    </div>

    <div v-if="!anniversaries.length" class="empty-state">
      <span class="icon">🎂</span>
      <p>还没有纪念日<br/>点击下方按钮添加第一个吧</p>
      <van-button type="primary" round @click="showAddDialog">+ 添加纪念日</van-button>
    </div>

    <div v-else class="anniv-list">
      <AnniversaryCard
        v-for="item in sortedList"
        :key="item.id"
        :data="item"
        :is-today="isToday(item)"
        @expand="toggleExpand"
        @edit="showEditDialog"
        @delete="confirmDelete"
      />
    </div>

    <van-button class="fab-add" type="primary" round icon="plus" @click="showAddDialog" />

    <van-dialog v-model:show="dialogVisible" :title="dialogTitle">
      <!-- 添加/编辑表单 -->
    </van-dialog>
  </div>
</template>
```

### 7.2 useAnniversary.js 核心composable伪代码

```js
import { computed, ref } from 'vue'
import { useDataStore } from '../stores/dataStore'

export function useAnniversary() {
  const { state, addAnniversary, updateAnniversary, deleteAnniversary } = useDataStore()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 计算某个纪念日的下次发生日期
  function getNextOccurrence(dateStr) {
    const original = new Date(dateStr)
    const thisYear = new Date(today.getFullYear(), original.getMonth(), original.getDate())
    return thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, original.getMonth(), original.getDate())
  }

  // 计算天数差
  function getDaysDiff(dateStr) {
    return Math.round((getNextOccurrence(dateStr) - today) / 86400000)
  }

  // 排序后的列表（最近的在前）
  const sortedList = computed(() => {
    return [...state.anniversaries].sort((a, b) => getNextOccurrence(a.date) - getNextOccurrence(b.date))
  })

  return { sortedList, getDaysDiff, addAnniversary, updateAnniversary, deleteAnniversary }
}
```

---

## 8. 实现检查清单

| 检查项 | 优先级 | 状态 |
|--------|--------|------|
| 路由 `/anniversary` 注册 | P0 | 🔲 |
| TabBar 新增「纪念」item | P0 | 🔲 |
| STORAGE_KEYS 新增 `ANNIVERSARIES` | P0 | 🔲 |
| dataStore 新增 `anniversaries` 响应式状态 | P0 | 🔲 |
| dataStore 新增 CRUD 方法 | P0 | 🔲 |
| Anniversary.vue 页面骨架 | P0 | 🔲 |
| useAnniversary composable | P0 | 🔲 |
| 空态页面 | P0 | 🔲 |
| 添加弹窗 + 表单验证 | P0 | 🔲 |
| 删除确认弹窗 | P0 | 🔲 |
| 相守天数 / 倒计时显示 | P0 | 🔲 |
| 当天卡片高亮样式 | P0 | 🔲 |
| localStorage 持久化 | P0 | 🔲 |
| 纪念日类型颜色映射 | P1 | 🔲 |
| 推送提醒逻辑 | P1 | 🔲 |
| 纪念日详情展开 | P1 | 🔲 |
| aria 标签无障碍 | P1 | 🔲 |

---

## 9. CSS 变量补充（需在 main.css 追加）

```css
/* 纪念日模块专属变量 */
:root {
  --anniv-gold: #F4C765;
  --anniv-gold-light: #FCE4A8;
  --anniv-gold-bg: #FDF8E8;
  --anniv-color-anniversary: #F4C765;
  --anniv-color-birthday:    #E8758A;
  --anniv-color-holiday:     #A78BFA;
  --anniv-color-custom:      #60A5FA;
  --anniv-today-shadow: 0 0 0 2px #F4C765, 0 4px 16px rgba(244, 199, 101, 0.25);
}
```
