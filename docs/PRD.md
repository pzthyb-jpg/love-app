# 📋 产品需求文档（PRD）

> 小皮爱情助手 v2.0 — 完整的 PRD，精确到字段级别
> 日期：2026-07-03
> 版本：v2.0 Alpha（P0 + 部分 P1）

---

## 目录

1. [功能清单与优先级](#1-功能清单与优先级)
2. [F-01: 首页仪表盘](#2-f-01-首页仪表盘)
3. [F-02: 照片墙/记忆画廊](#3-f-02-照片墙记忆画廊)
4. [F-03: 男朋友留言板](#4-f-03-男朋友留言板)
5. [F-04: 纪念日与爱的数据](#5-f-04-纪念日与爱的数据)
6. [F-05: 打卡成就系统](#6-f-05-打卡成就系统)
7. [F-09: 愿望池升级（分类+筛选）](#7-f-09-愿望池升级)
8. [拍照流程简化](#8-拍照流程简化)
9. [数据流与页面关系](#9-数据流与页面关系)
10. [localStorage 数据结构变更](#10-localstorage-数据结构变更)
11. [异常处理与兜底策略](#11-异常处理与兜底策略)
12. [验收标准汇总](#12-验收标准汇总)

---

## 1. 功能清单与优先级

| 功能 ID | 功能名称 | 优先级 | 复杂度 | 是否新增 |
|---------|---------|--------|--------|---------|
| F-01 | 首页仪表盘（今天摘要） | P0 | ⭐⭐⭐ | 新增 |
| F-02 | 照片墙 / 记忆画廊 | P0 | ⭐⭐⭐ | 新增 |
| F-03 | 男朋友留言板（预写入） | P0 | ⭐⭐⭐ | 新增 |
| F-04 | 纪念日与爱的数据 | P0 | ⭐⭐ | 新增 |
| F-05 | 打卡成就系统 | P0 | ⭐⭐ | 新增 |
| F-09 | 愿望池升级（分类+筛选+视觉优化） | P0 | ⭐⭐ | 优化 |
| — | 拍照流程简化 | P0 | ⭐⭐ | 优化 |
| — | 底部导航 3→4 tab | P0 | ⭐ | 优化 |
| — | Toast 组件升级（3种类型） | P1 | ⭐ | 优化 |
| — | 删除二次确认 | P1 | ⭐ | 优化 |

---

## 2. F-01: 首页仪表盘

### 2.1 功能描述

新增首页作为 App 的默认入口（替换原来的拍照页）。首页展示「我们」的整体状态：在一起天数、今天三个功能的状态摘要、男朋友留言预览、本周打卡进度。

### 2.2 业务规则

1. **默认入口**：App 启动后默认显示首页，而非拍照页
2. **数据实时性**：首页数据在每次页面渲染时从 localStorage 读取
3. **状态圆交互**：点击三个功能状态圆直接跳转到对应的功能页（拍照/午餐/愿望）
4. **在一起天数**：从设置的纪念日计算至今的天数
5. **留言预览**：从 localStorage 中读取符合当日条件的最新一条留言

### 2.3 页面布局（从上到下）

```
┌──────────────────────────────┐
│ Header: 💕 小皮爱情助手      │ ← 同现有 header，保持统一
│          宝贝专属甜蜜空间     │
├──────────────────────────────┤
│  ┌── 「爱的数据」卡片 ──────┐ │
│  │  💖 在一起 第 365 天     │ │ ← 大号数字 + 滚动动画
│  │  📸 已打卡 42 天         │ │
│  │  🍽️ 已转 18 次          │ │
│  └──────────────────────────┘ │
│                              │
│  ┌── 「今日状态」卡片 ──────┐ │
│  │  📸 已打卡 ✓   🍽️ 已选  │ │ ← 三个圆形状态指示器
│  │  ✨ 3 个新愿望           │ │
│  └──────────────────────────┘ │
│                              │
│  ┌── 「来自他的话」卡片 ────┐ │ ← F-03 留言预览
│  │  💌 \"今天的宝也超好看！\" │ │
│  │  — 泓博 · 查看更多 →    │ │
│  └──────────────────────────┘ │
│                              │
│  ┌── 「本周打卡」卡片 ──────┐ │ ← 现有周列表升级
│  │  [一][二]...[日] 更精致  │ │
│  │  连续打卡 3 天 🌱        │ │ ← F-05 成就状态
│  └──────────────────────────┘ │
│                              │
├──────────────────────────────┤
│ [🏠] [📸] [🍽️] [✨] 导航   │ ← 4 tab
└──────────────────────────────┘
```

### 2.4 数据字段定义

**首页数据源（从 localStorage 读取）：**

```javascript
// 首页渲染时使用的数据聚合
const homePageData = {
  // 爱的数据
  loveDays: 365,                    // 在一起天数（计算得来）
  totalCheckins: 42,                // 累计打卡天数（从 checkin_history 统计）
  totalLunchSpins: 18,              // 累计转盘次数（从 lunch_history 统计）

  // 今日状态
  todayCheckedIn: true,              // 今天是否已打卡（从 checkin_history 判断）
  todayLunchSelected: '饺子馆',     // 今天午餐选了啥（从 lunch_history 判断）
  todayWishCount: 3,                // 今天新增愿望数（从 wishes 按日期筛选）

  // 留言预览
  latestMessage: {                   // 最新一条留言
    text: '今天的宝也超好看！',
    author: '泓博',
    time: '2026-07-03 08:00',
    type: 'morning'
  },

  // 本周打卡
  weekStatus: [                      // 周打卡状态
    { dayName: '一', checked: true, isToday: false },
    // ...
  ],
  streakDays: 3                      // 连续打卡天数
}
```

### 2.5 验收标准

| # | 验收条件 | 预期结果 |
|---|---------|---------|
| 1 | App 启动后 | 默认进入首页，而非拍照页 |
| 2 | 在一起天数计算 | 从 love_anniversary 与当前日期精确计算，包含当天 |
| 3 | 状态圆交互 | 点击三个状态圆分别跳转到对应功能页 |
| 4 | 留言预览 | 展示符合当日条件的最新一条留言 |
| 5 | 数据一致性 | 首页显示的数据与各功能页数据保持一致 |
| 6 | 无数据状态 | 未设置纪念日时显示「设置纪念日 🎂」 |

---

## 3. F-02: 照片墙/记忆画廊

### 3.1 功能描述

在拍照打卡页增加「回忆照片墙」区域，以 3 列缩略图网格展示最近 14 天的打卡照片。点击缩略图进入全屏滑动浏览。

### 3.2 业务规则

1. **数据来源**：从 `checkin_history` 读取照片 base64（限制最近 14 天）
2. **显示规则**：最多显示最近 14 条记录的天数，不足 14 天按实际数量展示
3. **缩略图尺寸**：80×80px，圆角 12px
4. **全屏浏览**：点击缩略图后进入全屏遮罩模式，左右滑动切换不同天的照片
5. **滑动交互**：使用 CSS `scroll-snap-type: x mandatory` 实现
6. **照片+彩虹屁绑定**：全屏浏览时，照片下方展示当天的彩虹屁文字和日期
7. **空状态**：没有打卡记录时，展示提示「还没有打卡记录哦，开始打卡吧 📸」

### 3.3 数据字段定义

```javascript
// checkin_history 中每条记录（已有，不变）
{
  date: '2026-07-03',
  time: '10:30',
  photo: 'data:image/jpeg;base64,...',  // base64，压缩到 0.7 质量
  compliment: '宝今天的你太让人心动了！',
  timestamp: 1780000000000
}

// 全屏浏览状态
const galleryState = {
  isOpen: false,           // 是否在全屏模式
  currentIndex: 0,         // 当前浏览的照片在数组中的索引
  photos: [                // 全屏浏览的照片列表（按日期倒序）
    { photo, compliment, date, time },
    // ...
  ]
}
```

### 3.4 验收标准

| # | 验收条件 | 预期结果 |
|---|---------|---------|
| 1 | 有打卡记录时 | 照片墙展示 3 列缩略图网格 |
| 2 | 无打卡记录时 | 显示空状态提示 + 📸 引导按钮 |
| 3 | 点击缩略图 | 进入全屏浏览模式 |
| 4 | 全屏滑动 | 左右滑动切换不同天的照片 |
| 5 | 全屏照片信息 | 每张照片下方显示当天日期 + 彩虹屁文字 |
| 6 | 存储限制 | 只展示最近 14 天的照片 |
| 7 | 超过 14 天的旧照片 | 不展示在照片墙，但数据保留在 localStorage（静默不清除） |

---

## 4. F-03: 男朋友留言板（预写入）

### 4.1 功能描述

新增留言板功能：男朋友通过配置文件（或隐藏设置页）预写入留言，App 自动按条件展示。留言类型包括：早安、晚安、随机、特殊日触发。

### 4.2 业务规则

1. **留言存储**：存储在 localStorage 的 `messages` 键中
2. **留言类型**：`morning`（早安）、`evening`（晚安）、`random`（随机）、`special`（特殊日触发）
3. **留言展示规则**：
   - 每天首页和愿望池各展示一条留言
   - 6:00-11:59 优先展示 `morning` 类型
   - 18:00-23:59 优先展示 `evening` 类型
   - 其他时间段展示 `random` 类型
   - 如果当天是特殊日（节日/纪念日），优先展示 `special` 类型
4. **留言生命周期**：每天展示不同留言，不重复展示同一条
5. **留言管理**：通过隐藏设置页面添加/编辑/删除留言（仅男朋友可见）
6. **留言数据**：留言数组，每个留言有一个 `id`，已展示过的记录 `displayedDates` 数组

### 4.3 数据字段定义

```javascript
// localStorage 中的 messages 数据结构
[
  {
    id: 1,
    text: '早安宝贝！今天也要开心哦❤️',
    type: 'morning',           // 'morning' | 'evening' | 'random' | 'special'
    author: '泓博',
    createdAt: '2026-07-01',
    displayedDates: [           // 已展示过的日期（防止重复）
      '2026-07-01',
      '2026-07-02'
    ],
    specialCondition: null     // 特殊日条件，如 'anniversary' 或 'festival'
  },
  {
    id: 2,
    text: '宝，今天打卡了吗？想看看你😘',
    type: 'random',
    author: '泓博',
    createdAt: '2026-07-01',
    displayedDates: ['2026-07-01'],
    specialCondition: null
  },
  {
    id: 3,
    text: '纪念日快乐我的宝！今天是我们的第 {{days}} 天🎂💕',
    type: 'special',
    author: '泓博',
    createdAt: '2026-07-01',
    displayedDates: [],
    specialCondition: 'anniversary'  // 'anniversary' | 'festival'
  }
]

// 留言展示规则实现逻辑
function getTodaysMessage(messages, currentDate, currentHour, specialDay) {
  // 1. 筛选出今天还没展示过的留言
  const available = messages.filter(m => !m.displayedDates.includes(currentDate));
  if (available.length === 0) {
    // 所有留言都已展示过，重置 displayedDates 重新开始循环
    messages.forEach(m => m.displayedDates = []);
    return getTodaysMessage(messages, currentDate, currentHour, specialDay);
  }

  // 2. 特殊日优先展示 special 类型
  if (specialDay) {
    const specialMsg = available.find(m => m.type === 'special');
    if (specialMsg) return specialMsg;
  }

  // 3. 按时间段匹配留言类型
  if (currentHour >= 6 && currentHour < 12) {
    const morning = available.find(m => m.type === 'morning');
    if (morning) return morning;
  }
  if (currentHour >= 18 && currentHour < 24) {
    const evening = available.find(m => m.type === 'evening');
    if (evening) return evening;
  }

  // 4. 兜底：随机选一条
  const randomPool = available.filter(m => m.type === 'random');
  if (randomPool.length > 0) {
    return randomPool[Math.floor(Math.random() * randomPool.length)];
  }

  // 5. 最后兜底：任何类型都可以
  return available[Math.floor(Math.random() * available.length)];
}
```

### 4.4 留言管理（隐藏管理端）

入口：首页连续点击 App 标题 5 次（ Easter egg 式入口），或通过 URL 参数 `?admin=true` 访问。

管理端功能：
- 查看所有留言
- 新增留言（选择类型、填写内容）
- 编辑留言
- 删除留言
- 导出/导入留言 JSON

### 4.5 验收标准

| # | 验收条件 | 预期结果 |
|---|---------|---------|
| 1 | 无留言时 | 首页和愿望池不展示留言区域 |
| 2 | 有留言时 | 首页展示缩略版 + 愿望池展示完整版 |
| 3 | 时间匹配 | 早上展示早安留言，晚上展示晚安留言 |
| 4 | 不重复 | 同一天不展示同一条留言两次 |
| 5 | 循环机制 | 所有留言展示完后自动重置从头循环 |
| 6 | 特殊日触发 | 纪念日/节日自动展示 special 留言 |
| 7 | 管理端 | 通过隐藏入口可访问留言管理页面 |

---

## 5. F-04: 纪念日与爱的数据

### 5.1 功能描述

在首页展示「在一起 X 天」计数器 + 累计打卡天数 + 累计午餐转盘次数。

### 5.2 业务规则

1. **数据来源**：
   - `love_anniversary`：纪念日日期（YYYY-MM-DD 格式）
   - `checkin_history`：累计打卡天数
   - `lunch_history`：累计转盘次数
2. **在一起天数计算**：当天日期 - 纪念日日期，包含当天
3. **计数器动画**：页面渲染时数字从 0 滚动到实际值
4. **无纪念日配置**：首页显示「设置纪念日 🎂」，点击跳转设置页

### 5.3 数据字段定义

```javascript
// localStorage 中的纪念日配置
// 已有（来自 compliments.js 的读取）
localStorage.setItem('love_anniversary', '2025-07-03');  // YYYY-MM-DD

// 累计打卡天数（统计 checkin_history 中唯一日期的数量）
const totalCheckins = new Set(
  JSON.parse(localStorage.getItem('checkin_history') || '[]')
    .map(h => h.date)
).size;

// 累计午餐转盘次数
const totalLunchSpins = JSON.parse(
  localStorage.getItem('lunch_history') || '[]'
).length;

// 数字动画
function animateNumber(element, targetValue, duration = 1000) {
  const startTime = performance.now();
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out 缓动
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(eased * targetValue);
    element.textContent = currentValue;
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = targetValue;
    }
  };
  requestAnimationFrame(animate);
}
```

### 5.4 验收标准

| # | 验收条件 | 预期结果 |
|---|---------|---------|
| 1 | 设置了纪念日 | 在首页显示正确的在一起天数 |
| 2 | 未设置纪念日 | 显示「设置纪念日 🎂」占位引导 |
| 3 | 数字动画 | 数字从 0 滚动到实际值，ease-out 缓动 |
| 4 | 累计打卡 | 与 checkin_history 中的唯一日期数一致 |
| 5 | 累计转盘 | 与 lunch_history 中的记录数一致 |

---

## 6. F-05: 打卡成就系统

### 6.1 功能描述

新增连续打卡成就系统：连续打卡达到 7/14/21/30 天触发里程碑庆祝动画并获得徽章。每日打卡后在首页显示连续打卡天数的火焰进度动画。

### 6.2 业务规则

1. **连续打卡计算**：从 `checkin_history` 中计算最近的连续打卡天数
2. **里程碑定义**：
   - 7 天：萌芽 🌱（徽章文字：「爱情萌芽」）
   - 14 天：绽放 🌸（徽章文字：「美好绽放」）
   - 21 天：盛放 🌺（徽章文字：「热烈盛放」）
   - 30 天：永恒 💎（徽章文字：「爱的永恒」）
3. **里程碑触发**：每次打卡后检查是否达到新的里程碑
4. **庆祝动画**：全屏彩色粒子（CSS confetti）+ 徽章放大脉冲动画 + 手机震动
5. **里程碑仅触发一次**：每个里程碑每人只触发一次（不可重复获得）
6. **中断处理**：连续打卡中断后 streak 归零重新计数，已获得的徽章永久保留

### 6.3 数据字段定义

```javascript
// localStorage 中的成就数据（新增）
{
  streakDays: 3,                     // 当前连续打卡天数
  lastCheckinDate: '2026-07-03',     // 最近一次打卡日期
  earnedBadges: [                     // 已获得的徽章
    { id: '7days', name: '萌芽', emoji: '🌱', earnedDate: '2026-06-20' },
    // { id: '14days', name: '绽放', emoji: '🌸', earnedDate: null }  // 未获得
  ],
  nextBadge: {                        // 下一个里程碑
    id: '14days',
    daysNeeded: 14,
    remainingDays: 7,                 // 14 - 3 = 11? 不对，是还需几天的计算
    progress: 0.21                     // 3/14
  }
}

// 成就徽章定义（常量，不存 localStorage）
const BADGE_DEFINITIONS = [
  { id: '7days',  name: '萌芽', emoji: '🌱', days: 7,  color: '#A8E6CF' },
  { id: '14days', name: '绽放', emoji: '🌸', days: 14, color: '#FFD700' },
  { id: '21days', name: '盛放', emoji: '🌺', days: 21, color: '#FF8DBB' },
  { id: '30days', name: '永恒', emoji: '💎', days: 30, color: '#C084FC' },
];

// 计算连续打卡天数（核心算法）
function calculateStreak(history) {
  if (!history.length) return 0;
  
  let streak = 0;
  const today = new Date();
  
  // 从今天开始向前检查
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    const hasRecord = history.some(h => h.date === dateStr);
    if (hasRecord) {
      streak++;
    } else if (i > 0) {
      break;  // 今天没打卡也算连续（今天还没到截止时间）
    } else {
      break;  // 今天也没打卡
    }
  }
  return streak;
}
```

### 6.4 庆祝动画触发逻辑

```javascript
function checkMilestone(streakDays, earnedBadges, history) {
  // 检查每个里程碑是否首次达到
  for (const badgeDef of BADGE_DEFINITIONS) {
    const alreadyEarned = earnedBadges.some(b => b.id === badgeDef.id);
    if (!alreadyEarned && streakDays >= badgeDef.days) {
      // 触发庆祝
      const newBadge = {
        id: badgeDef.id,
        name: badgeDef.name,
        emoji: badgeDef.emoji,
        earnedDate: new Date().toISOString().slice(0, 10)
      };
      earnedBadges.push(newBadge);
      saveToLocalStorage('checkin_badges', earnedBadges);
      
      // 显示庆祝 UI
      showCelebration(badgeDef);
      
      // 触感反馈
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }
      
      return newBadge;  // 一次只触发一个新的里程碑
    }
  }
  return null;
}
```

### 6.5 验收标准

| # | 验收条件 | 预期结果 |
|---|---------|---------|
| 1 | 连续打卡 7 天 | 触发「萌芽 🌱」徽章庆祝动画 |
| 2 | 连续打卡 14 天 | 触发「绽放 🌸」徽章庆祝动画 |
| 3 | 连续打卡 21 天 | 触发「盛放 🌺」徽章庆祝动画 |
| 4 | 连续打卡 30 天 | 触发「永恒 💎」徽章庆祝动画 |
| 5 | 同里程碑再次达到 | 不会重复触发 |
| 6 | 打卡中断 | streak 归零重新开始 |
| 7 | 已获得的徽章 | 中断后仍然保留 |
| 8 | Streak 数字动画 | 每天打卡后数字+1 弹跳动画 |
| 9 | 进度条 | 显示「下一个里程碑还需要 X 天」 |

---

## 7. F-09: 愿望池升级（分类+筛选+视觉优化）

### 7.1 功能描述

对现有愿望池进行视觉和交互升级：(1) 愿望和吐槽使用不同的气泡样式；(2) 新增筛选 tab； (3) 新增「来自男朋友的话」入口区域。

### 7.2 业务规则

1. **气泡区分**：愿望用紫粉渐变气泡，吐槽用暖橙渐变气泡
2. **筛选 tab**：全部 | ✨ 愿望 | 😤 吐槽 | ✅ 已实现（预留）
3. **「来自他的话」入口**：在愿望池顶部展示最新一条留言，点击进入留言板详情页
4. **删除二次确认**：清空全部时弹窗确认

### 7.3 气泡视觉定义

```css
/* 愿望气泡 */
.wish-bubble.wish {
  background: linear-gradient(135deg, #F3E8FF, #E8F0FE);
  color: #7C3AED;
  border: 1px solid rgba(124, 58, 237, 0.15);
}

/* 吐槽气泡 */
.wish-bubble.vent {
  background: linear-gradient(135deg, #FFE5D9, #FFF0F3);
  color: #D63B5F;
  border: 1px solid rgba(214, 59, 95, 0.15);
}
```

### 7.4 验收标准

| # | 验收条件 | 预期结果 |
|---|---------|---------|
| 1 | 提交愿望 | 气泡显示为紫粉渐变 |
| 2 | 提交吐槽 | 气泡显示为暖橙渐变 |
| 3 | 筛选「全部」 | 显示所有气泡 |
| 4 | 筛选「愿望」 | 只显示愿望类型气泡 |
| 5 | 筛选「吐槽」 | 只显示吐槽类型气泡 |
| 6 | 留言入口 | 顶部显示最新留言预览 |

---

## 8. 拍照流程简化

### 8.1 改造目标

**v1.0 流程（5 步）：**
```
点击[开始拍照] → 等待摄像头 → 点击[咔嚓拍照] 
→ 保存 + 彩虹屁 → 点击[再拍一张]
```

**v2.0 流程（3 步）：**
```
点击[📸 咔嚓拍照] → 自动打开摄像头 → 点击拍照
→ 立即保存 + 彩虹屁（自动完成）
```

### 8.2 改造规则

1. 拍照按钮名称从「开始拍照打卡」简化为「📸 咔嚓拍照」
2. 按钮点击后直接启动摄像头（跳过中间状态提示）
3. 拍照完成后自动保存（不需要确认步骤）
4. 拍照后按钮直接变为「📸 再拍一张」
5. 保留连拍功能：在摄像头打开状态下，可以连续按快门拍多张

### 8.3 状态机

```
状态：IDLE
  - 显示「📸 咔嚓拍照」按钮
  - 预览区域显示占位图标
  - → 点击按钮 → CAMERA_OPENING

状态：CAMERA_OPENING
  - 正在请求摄像头权限
  - → 成功 → CAMERA_READY
  - → 失败 → ERROR（showToast）→ IDLE

状态：CAMERA_READY
  - 预览区域显示实时视频流
  - 按钮显示「📸 咔嚓！拍照」
  - 按钮无文字变化，直接触发拍照
  - → 点击 → PHOTO_CAPTURED

状态：PHOTO_CAPTURED
  - 照片显示在预览区
  - 彩虹屁自动生成并展示
  - Streak 自动更新
  - 按钮变为「📸 再拍一张」
  - → 点击 → 返回 CAMERA_READY（摄像头保持打开）
```

---

## 9. 数据流与页面关系

### 9.1 页面间数据流

```
                    ┌─────────────────────────────┐
                    │      localStorage            │
                    │                              │
                    │  checkin_history     ◄───────┼── 📸 拍照打卡页
                    │  love_anniversary            │     (写入打卡记录)
                    │  messages            ◄───────┼── 💌 留言板管理端
                    │  checkin_streak      ◄───────┤     (写入/编辑留言)
                    │  checkin_badges     ◄────────┤
                    │  restaurants         ◄───────┼── 🍽️ 午餐转盘页
                    │  lunch_history       ◄───────┤     (写入转盘结果)
                    │  wishes              ◄───────┼── ✨ 愿望池
                    │  notification_enabled        │     (写入愿望/吐槽)
                    │                              │
                    └──────┬──────────────────────┘
                           │ 读取
                           ▼
                    ┌────────────────┐
                    │  🏠 首页仪表盘  │ ← 从所有 localStorage 读取聚合数据
                    │                │
                    │  在一起天数 ← love_anniversary
                    │  今日打卡 ← checkin_history
                    │  今日午餐 ← lunch_history
                    │  今日愿望 ← wishes
                    │  最新留言 ← messages
                    │  Streak   ← checkin_streak
                    │  徽章     ← checkin_badges
                    └────────────────┘
```

### 9.2 写入数据流

| 操作 | 写入的 key | 写入的数据 | 触发时机 |
|------|-----------|-----------|---------|
| 拍照打卡 | `checkin_history` | 新打卡记录（date, time, photo, compliment） | 点击拍照按钮 |
| 拍照打卡 | `checkin_streak` | 更新 streak 天数、最后打卡日期 | 拍照后 |
| 拍照打卡 | `checkin_badges` | 新达成的徽章 | 触发里程碑时 |
| 午餐转盘 | `lunch_history` | 新转盘记录（restaurant, date, time） | 转盘停止时 |
| 提交愿望 | `wishes` | 新愿望/吐槽（text, type, time） | 点击提交按钮 |
| 留言管理 | `messages` | 新增/编辑/删除留言 | 管理端操作 |
| 设置 | `love_anniversary` | 纪念日日期 | 设置页面保存 |

### 9.3 读取数据流

| 页面 | 读取的 key | 用途 |
|------|-----------|------|
| 首页 | `love_anniversary`, `checkin_history`, `lunch_history`, `wishes`, `messages`, `checkin_streak`, `checkin_badges` | 展示全部数据摘要 |
| 拍照页 | `checkin_history`, `checkin_streak`, `checkin_badges` | 本周打卡、照片墙、成就 |
| 午餐页 | `restaurants`, `lunch_history` | 餐厅列表、历史记录 |
| 愿望池 | `wishes`, `messages` | 气泡列表、留言预览 |
| 留言管理 | `messages` | 留言列表 CRUD |

---

## 10. localStorage 数据结构变更

### 10.1 新旧结构对比

#### 已有结构（v1.0，保留不变）

```javascript
// 不变：打卡历史
checkin_history = [
  {
    date: '2026-07-03',
    time: '10:30',
    photo: 'data:image/jpeg;base64,...',
    compliment: '宝今天的你太让人心动了！',
    timestamp: 1780000000000
  }
]

// 不变：午餐历史
lunch_history = [
  {
    restaurant: '饺子馆',
    date: '2026-07-03',
    time: '12:00'
  }
]

// 不变：餐厅列表
restaurants = [
  { name: '饺子馆', distance: '0.8km', rating: 4.5, tags: ['面食', '实惠'] }
]

// 不变：愿望池
wishes = [
  {
    id: 1700000000000.123,
    text: '想去海边旅行',
    type: 'wish',
    time: '2026-07-02T10:00:00.000Z',
    timeStr: '10:00',
    dateStr: '2026-07-02'
  }
]

// 不变：通知设置
notification_enabled = 'true'  // 或 'false'

// 不变：纪念日
love_anniversary = '2025-07-03'  // YYYY-MM-DD
```

#### 新增结构（v2.0 新增）

```javascript
// 新增：连续打卡状态
checkin_streak = {
  streakDays: 3,                  // 当前连续打卡天数
  lastCheckinDate: '2026-07-03', // 最近一次打卡日期
  longestStreak: 7                // 历史最长连续打卡天数
}

// 新增：成就徽章
checkin_badges = [
  {
    id: '7days',
    name: '萌芽',
    emoji: '🌱',
    earnedDate: '2026-06-20'
  }
]

// 新增：留言板
messages = [
  {
    id: 1,
    text: '早安宝贝！今天也要开心哦❤️',
    type: 'morning',
    author: '泓博',
    createdAt: '2026-07-01',
    displayedDates: ['2026-07-01', '2026-07-02'],
    specialCondition: null
  },
  {
    id: 2,
    text: '纪念日快乐！这是我们的第 {{days}} 天💕',
    type: 'special',
    author: '泓博',
    createdAt: '2026-07-01',
    displayedDates: [],
    specialCondition: 'anniversary'
  }
]
```

### 10.2 存储容量预估

| 数据项 | 单条大小 | 数量上限 | 预估总大小 |
|--------|---------|---------|-----------|
| `checkin_history` | ~150KB（含 base64 照片） | 14 条 | ~2.1MB |
| `lunch_history` | ~100B | 30 条 | ~3KB |
| `wishes` | ~200B | 100 条 | ~20KB |
| `checkin_streak` | ~200B | 1 条 | ~0.2KB |
| `checkin_badges` | ~100B | 4 条 | ~0.4KB |
| `messages` | ~200B | 50 条 | ~10KB |
| **总计** | | | **~2.14MB** |

> localStorage 上限约 5MB，v2.0 预估使用 ~2.2MB，在安全范围内。照片 base64 是最大消耗源

### 10.3 照片存储优化

| 项目 | v1.0 | v2.0 |
|------|------|------|
| 照片质量 | 0.85 | 0.7 |
| 存储上限 | 30 天 | 14 天（严格） |
| 照片墙展示 | 无 | 最近 14 天 |
| 旧照片处理 | 30 天后覆盖 | 14 天后移除（静默清除 localStorage） |
| Canvas 尺寸 | 720×720 | 降低到 540×540 |

---

## 11. 异常处理与兜底策略

### 11.1 摄像头相关异常

| 异常场景 | 可能原因 | 兜底策略 |
|---------|---------|---------|
| 摄像头打不开 | 权限被拒绝、无摄像头设备 | showToast「😢 没有摄像头或权限被拒绝」 + 按钮恢复为「📸 尝试拍照」 |
| 摄像头权限首次请求 | iOS Safari 需要用户交互触发 getUserMedia | 按钮点击时捕获异常，显示友好提示引导用户去设置开启 |
| 多标签页同时拍照 | 摄像头资源被占用 | 捕获 `NotReadableError`，提示「摄像头被其他应用占用」 |
| 低光环境 | 光线不足，照片模糊 | 不处理（属于自然体验），未来可考虑加入闪光灯模式 |

### 11.2 localStorage 相关异常

| 异常场景 | 可能原因 | 兜底策略 |
|---------|---------|---------|
| localStorage 满 | 超过 5MB 上限（照片太多） | 捕获 `QuotaExceededError`，自动清理最旧的 checkin_history 记录直到有空间 |
| localStorage 被清除 | 用户手动清除浏览器数据 | 所有数据使用 `|| '[]'` 或 `|| '{}'` 兜底，App 正常启动 |
| 隐私模式 | Safari 无痕浏览、Chrome Incognito | localStorage 可用但页面关闭即消失，showToast 提示「当前为隐私模式，数据不会保存」|
| iOS 低存储模式 | 系统存储不足时 localStorage 可能受限 | 捕获异常，降级为内存存储（不保存），提示用户清理存储 |
| 数据损坏 | JSON.parse 失败 | 所有 `JSON.parse` 包裹在 try-catch 中，失败时重置为空数组/空对象 |

### 11.3 留言相关异常

| 异常场景 | 可能原因 | 兜底策略 |
|---------|---------|---------|
| 无留言 | 男朋友还没写 | 首页和愿望池不展示留言区域（不显示空卡片） |
| 所有留言均已展示 | 留言循环耗尽 | 自动重置 `displayedDates` 重新循环 |
| 留言数量过少 | 只写了 1-2 条 | 每条留言可以每天重复展示（如果少于 3 条，放宽不重复限制） |
| 留言 JSON 格式错误 | 手动编辑出错 | 重置为默认留言数组（内嵌 3 条备选） |
| 特殊日没有 special 留言 | 男朋友没写纪念日留言 | 降级展示 random 或 morning 类型留言 |

### 11.4 网络相关异常

| 异常场景 | 可能原因 | 兜底策略 |
|---------|---------|---------|
| 离线 | 无网络连接 | App 完全离线可用（纯前端读取 localStorage，无需任何网络请求） |
| 地图 URI 无法打开 | 未安装地图 App | 如果点击「导航去」后地图 URI 无响应，提示「请安装高德/百度地图 App」 |

### 11.5 成就系统异常

| 异常场景 | 可能原因 | 兜底策略 |
|---------|---------|---------|
| 庆祝动画播放时页面切换 | 用户在成就庆祝时切 tab | 使用队列机制：庆祝动画播放完后再允许 tab 切换 |
| 连续打卡计算边界 | 跨时区用户 | 使用本地时区（无需处理时区问题，对情侣 App 足够） |
| 历史数据迁移 | 从 v1.0 升级，`checkin_streak` 不存在 | 首次加载时从 `checkin_history` 自动计算初始 streak 值 |

### 11.6 通用兜底策略

```javascript
// 安全读取 localStorage 的工具函数
function safeGetJSON(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch(e) {
    console.warn(`读取 ${key} 失败，使用默认值:`, e);
    // 数据损坏时修复
    localStorage.removeItem(key);
    return defaultValue;
  }
}

function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch(e) {
    if (e.name === 'QuotaExceededError') {
      // 自动清理：删除最旧的 checkin_history 记录
      autoCleanupStorage();
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch(e2) {
        console.error('存储空间清理后仍然不足:', e2);
        return false;
      }
    }
    console.error('写入 localStorage 失败:', e);
    return false;
  }
}
```

---

## 12. 验收标准汇总

### 12.1 功能完整度验收

| 检查项 | 标准 |
|--------|------|
| 所有 P0 功能 | 完整实现，无遗漏 |
| 拍照流程 | 从 v1.0 的 5 步简化为 3 步 |
| 数据迁移 | v1.0 的 localStorage 数据在 v2.0 下正常读取 |
| 新增数据 | 新增的 storage key 不影响已有数据读取 |

### 12.2 兼容性验收

| 检查项 | 标准 |
|--------|------|
| 移动端 | iOS Safari 15+ / Android Chrome 90+ |
| 屏幕尺寸 | 375px - 414px 主设计范围，320px - 480px 无布局断裂 |
| 离线 | 全部功能无需网络 |
| 权限 | 摄像头权限异常有友好提示 |

### 12.3 性能验收

| 检查项 | 标准 |
|--------|------|
| 首页加载 | < 500ms（从点击到页面可交互） |
| 拍照启动 | < 2s（从点击到摄像头画面显示） |
| 转盘动画 | 60fps, 4s 旋转动画流畅无卡顿 |
| 照片墙滚动 | 60fps 无掉帧 |
| 存储 | 全部数据占用 < 5MB |

### 12.4 体验验收

| 检查项 | 标准 |
|--------|------|
| 情感表达 | 首页展示「在一起 X 天」+ 留言预览 |
| 引导 | 首次使用时展示简单的提示（非必须，P1） |
| 空状态 | 每个功能在无数据时展示友好的空状态提示 |
| 错误提示 | 所有异常场景有中文友好提示 |
| 动画 | 按钮点击、页面切换、成就庆祝有平滑动画 |

---

> 本文档由 AI 产品经理 王泓博 基于 v1.0 源码分析 + 竞品调研 + 用户场景拆解产出
> 日期：2026-07-03
> 版本：v2.0 产品需求文档（PRD）
> 代码库路径：`/Users/wanghongbo/love-app/`
