# 首页打卡回归测试案例

**日期**: 2026-07-17  
**测试文件**: `/src/views/Home.vue`  
**关联模块**: `useStreak.js`、`useDatabase.js`、`dataStore.js`  
**测试类型**: 回归测试（功能 / 边界 / UI / 数据一致性）

---

## 摘要

本文档定义了「小皮」App 首页打卡功能的完整回归测试用例，覆盖正向流程、反向流程、数据映射验证、UI 渲染验证、持久化验证和边界条件六大类，共 **30 个测试用例**。

---

## 一、正向流程（Happy Path）

### TC-HOME-001：正常快捷打卡

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-001 |
| **名称** | 未登录用户正常快捷打卡 |
| **前置条件** | 1. 用户已登录（currentUser 存在）<br>2. 今日尚未打卡<br>3. 网络正常 |
| **操作步骤** | 1. 打开首页 `/`<br>2. 找到「⚡ 立即打卡」按钮<br>3. 点击按钮 |
| **预期结果** | 1. 按钮文字变为「✓ 今日已打卡」<br>2. 按钮变为 disabled 状态<br>3. Toast 显示「✅ 已打卡」<br>4. `state.checkinHistory` 头部插入 `{ date: today, type: 'quick' }`<br>5. 连续打卡天数正确递增<br>6. Supabase `checkins` 表新增一条记录 |
| **验证方式** | ✅ 自动化：调用 `addQuickCheckin()` 并检查返回值<br>✅ 手动：观察 UI 变化和 Toast |
| **严重级** | **P0** |

---

### TC-HOME-002：打卡后累计打卡数更新

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-002 |
| **名称** | 打卡后累计打卡数正确累加 |
| **前置条件** | 已有 N 条打卡历史记录 |
| **操作步骤** | 1. 记录当前 `totalCheckins` 数值<br>2. 执行一次快捷打卡<br>3. 刷新页面 |
| **预期结果** | `totalCheckins` 数值 = 原值 + 1（去重后基于日期计算） |
| **验证方式** | ✅ 自动化：对比打卡前后 `new Set(state.checkinHistory.map(h => h.date)).size` |
| **严重级** | **P0** |

---

### TC-HOME-003：连续打卡天数正确计算-连续打卡

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-003 |
| **名称** | 连续打卡天数正确计算（连续打卡） |
| **前置条件** | 过去 5 天均有打卡记录（date 为 today, today-1, ..., today-4） |
| **操作步骤** | 1. 加载首页<br>2. 查看「🔥 连续打卡 X 天」 |
| **预期结果** | 连续打卡天数 = 6（包含今天） |
| **验证方式** | ✅ 自动化：`calculateStreak(state.checkinHistory)` 返回 6 |
| **严重级** | **P0** |

---

### TC-HOME-004：连续打卡天数正确计算-中断后恢复

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-004 |
| **名称** | 中断打卡后连续天数从 0 重新计算 |
| **前置条件** | 历史记录为：今天、前天、大前天（昨天未打卡） |
| **操作步骤** | 1. 加载首页<br>2. 查看连续打卡天数 |
| **预期结果** | 连续打卡天数 = 1（仅今天，昨天中断） |
| **验证方式** | ✅ 自动化：`calculateStreak()` 返回 1 |
| **严重级** | **P0** |

---

### TC-HOME-005：徽章里程碑达成提醒

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-005 |
| **名称** | 达成徽章里程碑（7 天/14 天/21 天/30 天） |
| **前置条件** | 连续打卡天数达到 7 天 |
| **操作步骤** | 1. 加载首页<br>2. 查看里程碑进度条和徽章名称 |
| **预期结果** | 1. `nextBadge.name` = '萌芽'，emoji = '🌱'<br>2. `nextBadge.progress` = 1.0<br>3. 进度条显示 7/7 天 |
| **验证方式** | ✅ 自动化：`getNextMilestone(7, [])` 返回正确徽章信息 |
| **严重级** | **P1** |

---

### TC-HOME-006：在一起天数正确计算

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-006 |
| **名称** | 基于纪念日的「在一起天数」正确显示 |
| **前置条件** | 设置 `loveAnniversary = '2025-01-01'` |
| **操作步骤** | 1. 加载首页<br>2. 查看「💖 在一起第 X 天」 |
| **预期结果** | 显示天数 = (today - 2025-01-01) + 1（包含当天） |
| **验证方式** | ✅ 自动化：`getLoveDays('2025-01-01')` 返回正确天数 |
| **严重级** | **P1** |

---

### TC-HOME-007：数字滚动动画执行

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-007 |
| **名称** | 在一起天数加载时执行数字滚动动画 |
| **前置条件** | `loveDays > 0`，页面已挂载 |
| **操作步骤** | 1. 打开首页<br>2. 观察数字区域 |
| **预期结果** | 1. `daysRef` 元素从 0 开始递增<br>2. 1200ms 后定格到目标值<br>3. 动画使用 easeOutCubic 缓动 |
| **验证方式** | ✅ 手动：目视检查动画<br>✅ 自动化：mock `requestAnimationFrame` 验证调用次数 |
| **严重级** | **P2** |

---

### TC-HOME-008：今日状态圆圈正确渲染

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-008 |
| **名称** | 今日状态圆圈根据状态正确渲染 |
| **前置条件** | 1. 今日已打卡<br>2. 今日已选午餐 |
| **操作步骤** | 1. 加载首页<br>2. 查看「📋 今日状态」卡片 |
| **预期结果** | 1. 打卡圆圈显示 📸 + 「已打卡」，class 包含 `done`<br>2. 午餐圆圈显示 🍽️ + 「已选」，class 包含 `done`<br>3. 愿望圆圈根据数量显示「N个新愿望」或「无新愿望」 |
| **验证方式** | ✅ 自动化：检查 computed `todayCheckedIn`、`todayLunchSelected`、`todayWishCount` |
| **严重级** | **P1** |

---

### TC-HOME-009：本周打卡日历正确显示

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-009 |
| **名称** | 本周打卡日历显示正确状态 |
| **前置条件** | 今天是周三，周一、周二已打卡 |
| **操作步骤** | 1. 加载首页<br>2. 查看「📅 本周打卡」卡片 |
| **预期结果** | 1. 周一、周二显示为 checked（绿色渐变）<br>2. 周三显示为 today（带边框）<br>3. 如果周一之前有未打卡则显示 missed（半透明）<br>4. 七天的展示从周一开始 |
| **验证方式** | ✅ 自动化：`getWeekDates()` 返回 7 天且顺序正确<br>✅ 手动：观察 UI 状态 |
| **严重级** | **P1** |

---

### TC-HOME-010：留言预览正确展示

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-010 |
| **名称** | 今日留言预览卡片正确展示 |
| **前置条件** | 1. messages 列表非空<br>2. `getTodaysMessage()` 返回有效留言 |
| **操作步骤** | 1. 加载首页<br>2. 查看留言预览区域 |
| **预期结果** | 1. 显示 💌 图标<br>2. 显示留言文本（已格式化 loveDays 占位符）<br>3. 显示作者和「查看更多 →」 |
| **验证方式** | ✅ 自动化：检查 `todayMessage` computed 返回值 |
| **严重级** | **P2** |

---

## 二、反向流程（Negative Path）

### TC-HOME-011：重复打卡拦截

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-011 |
| **名称** | 同日二次打卡被拦截 |
| **前置条件** | 今日已打卡 |
| **操作步骤** | 1. 加载首页<br>2. 观察打卡按钮状态 |
| **预期结果** | 1. 按钮显示「✓ 今日已打卡」<br>2. 按钮 disabled，无法点击<br>3. `addQuickCheckin` 内拦截逻辑触发，Toast「今天已打卡」<br>4. `state.checkinHistory` 不重复插入 |
| **验证方式** | ✅ 自动化：调用 `addQuickCheckin()` 返回 `false` |
| **严重级** | **P0** |

---

### TC-HOME-012：未登录用户打卡拦截

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-012 |
| **名称** | 未登录状态下打卡被拦截 |
| **前置条件** | 1. `currentUser = null`（未登录或已登出）<br>2. 直接调用打卡方法 |
| **操作步骤** | 1. 确保用户未登录<br>2. 调用 `addQuickCheckin()` 或直接调用 `db.addCheckin()` |
| **预期结果** | 1. `db.addCheckin()` 返回 `{ error: { message: '未登录' } }`<br>2. `state.checkinHistory` 不更新<br>3. Toast 显示错误消息 |
| **验证方式** | ✅ 自动化：mock `currentUser = null`，调用并检查返回值 |
| **严重级** | **P0** |

---

### TC-HOME-013：网络异常时打卡失败处理

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-013 |
| **名称** | 网络异常时的打卡失败处理 |
| **前置条件** | 1. 已登录<br>2. 模拟网络断开或 Supabase 不可达 |
| **操作步骤** | 1. 断开网络或 mock fetch 抛出错误<br>2. 点击打卡按钮 |
| **预期结果** | 1. `supabaseFetch` 经过 2 次重试后抛出异常<br>2. 返回 `{ error: { message: '网络异常，请检查网络后重试' } }`<br>3. UI 不崩溃，保持打卡前状态<br>4. Toast 显示错误 |
| **验证方式** | ✅ 自动化：mock fetch 抛出 TypeError，验证错误处理 |
| **严重级** | **P0** |

---

### TC-HOME-014：网络超时处理

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-014 |
| **名称** | 网络请求超时（15s）处理 |
| **前置条件** | 模拟 fetch 请求超过 15s 无响应 |
| **操作步骤** | 1. mock fetch 延迟超过 15s<br>2. 触发打卡操作 |
| **预期结果** | 1. AbortController 触发 abort<br>2. 第 1 次重试延迟 1s，第 2 次延迟 2s<br>3. 总耗时约 15+1+15+2+15 = 48s 后抛出错误 |
| **验证方式** | ✅ 自动化：mock AbortController 和 setTimeout 验证超时逻辑 |
| **严重级** | **P1** |

---

### TC-HOME-015：纪念日未设置时跳转到设置

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-015 |
| **名称** | 未设置纪念日时显示空状态并引导跳转 |
| **前置条件** | `loveAnniversary` 为空字符串或 null |
| **操作步骤** | 1. 加载首页<br>2. 观察「在一起天数」区域 |
| **预期结果** | 1. 不显示数字滚动动画<br>2. 显示 🎂 + 「去记录我们的第一天 →」<br>3. 点击后跳转到 `/anniversary` |
| **验证方式** | ✅ 自动化：`loveDays` computed 返回 0<br>✅ 手动：点击验证路由跳转 |
| **严重级** | **P1** |

---

## 三、数据映射验证（snake_case ↔ camelCase）

### TC-HOME-016：数据库读取时的字段映射

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-016 |
| **名称** | Supabase → 前端 checkins 字段映射正确 |
| **前置条件** | Supabase 返回 `{ photo_url: 'xxx', checkin_time: '08:00' }` |
| **操作步骤** | 1. 调用 `getCheckins()`<br>2. 检查返回的记录 |
| **预期结果** | 1. `row.photo_url` → `record.photo`<br>2. `checkin_time` 保持不变<br>3. 其他字段原样保留 |
| **验证方式** | ✅ 自动化：验证 `getCheckins()` 返回的每条记录有 `photo` 字段 |
| **严重级** | **P0** |

---

### TC-HOME-017：前端写入数据库时的字段映射

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-017 |
| **名称** | 前端 → Supabase checkins 字段映射正确 |
| **前置条件** | 调用 `addCheckin({ date: '2026-07-17', photo: 'url', compliment: 'test', timestamp: 1721200000000 })` |
| **操作步骤** | 1. 调用 `addCheckin()`<br>2. 检查请求体 |
| **预期结果** | 1. `record.photo` → body `photo_url: 'url'`<br>2. `record.compliment` 合并到 `note` 字段<br>3. `record.timestamp` → `checkin_time` 格式化为 hh:mm |
| **验证方式** | ✅ 自动化：mock `supabaseFetch` 捕获请求体并断言 |
| **严重级** | **P0** |

---

### TC-HOME-018：wish 数据双向映射

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-018 |
| **名称** | wishes 表 snake_case ↔ camelCase 双向映射 |
| **前置条件** | 1. Supabase 返回 wish 含 `due_date`, `fulfilled_by`, `created_at`<br>2. 前端更新 wish 传 `dueDate`, `fulfilledBy` |
| **操作步骤** | 1. 读取 wish 检查映射<br>2. 更新 wish 检查请求体 |
| **预期结果** | ✅ 读取：`due_date`→`dueDate`, `fulfilled_by`→`fulfilledBy`, `created_at`→`dateStr`<br>✅ 更新：前端 `fulfilled=true`→body `status='fulfilled'`；`dueDate` 被删除（不在 schema 中） |
| **验证方式** | ✅ 自动化：分别验证 `getWishes()` 和 `updateWish()` 的字段映射 |
| **严重级** | **P1** |

---

### TC-HOME-019：消息数据字段映射

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-019 |
| **名称** | messages 表字段映射一致性 |
| **前置条件** | Supabase 返回 `{ content: 'xxx', author_name: '小宇', special_condition: 'birthday', displayed_dates: ['2026-07-17'] }` |
| **操作步骤** | 1. 调用 `getMessages()`<br>2. 检查映射结果 |
| **预期结果** | 1. `content` → `text`<br>2. `author_name` → `author`<br>3. `special_condition` → `specialCondition`<br>4. `displayed_dates` → `displayedDates` |
| **验证方式** | ✅ 自动化：验证映射后的字段名正确 |
| **严重级** | **P1** |

---

## 四、UI 渲染验证

### TC-HOME-020：页面加载时骨架内容正确占位

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-020 |
| **名称** | 数据加载前 UI 不崩溃 |
| **前置条件** | `state.isDataLoaded = false`（数据加载中） |
| **操作步骤** | 1. 刷新首页<br>2. 观察加载期间 UI |
| **预期结果** | 1. 所有 computed 返回默认值（0, false, []）<br>2. 不抛出 JavaScript 错误<br>3. 访客相关区域显示空状态 |
| **验证方式** | ✅ 自动化：清空 state 后验证 computed 默认值 |
| **严重级** | **P1** |

---

### TC-HOME-021：累计统计数据正确计算

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-021 |
| **名称** | love-stats 卡片数据统计正确 |
| **前置条件** | 1. `checkinHistory` 有 10 条不同日期的记录<br>2. `lunchHistory` 有 5 条记录<br>3. `wishes` 有 3 条 `fulfilled=true` |
| **操作步骤** | 1. 加载首页<br>2. 查看统计数据 |
| **预期结果** | 1. 已打卡 = 10（按日期去重后）<br>2. 已选 = 5<br>3. 已实现 = 3 |
| **验证方式** | ✅ 自动化：验证三个 computed 计算属性 |
| **严重级** | **P1** |

---

### TC-HOME-022：打卡按钮 disabled 状态切换

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-022 |
| **名称** | 打卡按钮 state 切换与 UI 同步 |
| **前置条件** | 今日未打卡 |
| **操作步骤** | 1. 加载首页，观察按钮<br>2. 点击打卡<br>3. 观察按钮变化 |
| **预期结果** | 1. 初始：按钮 enabled，文字「⚡ 立即打卡」<br>2. 打卡后：按钮 disabled，文字「✓ 今日已打卡」<br>3. CSS `:disabled` 样式生效（灰色背景） |
| **验证方式** | ✅ 自动化：验证 `todayCheckedIn` computed 变化<br>✅ 手动：观察按钮样式 |
| **严重级** | **P1** |

---

### TC-HOME-023：设置跳转按钮功能

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-023 |
| **名称** | 设置图标点击跳转到设置页 |
| **前置条件** | 首页已加载 |
| **操作步骤** | 1. 点击右上角 ⚙️ 图标 |
| **预期结果** | 路由跳转到 `/settings` |
| **验证方式** | ✅ 自动化：验证 `goToSettings()` 调用 `router.push('/settings')` |
| **严重级** | **P2** |

---

### TC-HOME-024：快捷打卡按钮点击跳转到对应 Tab

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-024 |
| **名称** | 状态圆圈点击跳转到对应 Tab 页 |
| **前置条件** | 首页已加载 |
| **操作步骤** | 1. 点击打卡圆圈 → 跳转 `/photo`<br>2. 点击午餐圆圈 → 跳转 `/lunch`<br>3. 点击愿望圆圈 → 跳转 `/wish` |
| **预期结果** | 路由正确跳转 |
| **验证方式** | ✅ 自动化：验证 `goToTab(index)` 调用 `router.push(paths[index])` |
| **严重级** | **P2** |

---

### TC-HOME-025：连续打卡进度条正确渲染

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-025 |
| **名称** | 进度条宽度与里程碑进度同步 |
| **前置条件** | 当前连续打卡 10 天，下一个里程碑 14 天（绽放） |
| **操作步骤** | 1. 加载首页<br>2. 查看进度条和文本 |
| **预期结果** | 1. `progress-fill` 宽度 = 71.4%（10/14）<br>2. 文本显示「10/14 天」<br>3. 里程碑名称显示「· 下一个: 绽放 🌸」 |
| **验证方式** | ✅ 自动化：`getNextMilestone(10, [])` 返回 progress ≈ 0.714<br>✅ 手动：视觉验证 |
| **严重级** | **P2** |

---

## 五、持久化验证

### TC-HOME-026：打卡数据持久化到 Supabase

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-026 |
| **名称** | 打卡记录持久化到 Supabase 数据库 |
| **前置条件** | 1. 已登录<br>2. 网络正常 |
| **操作步骤** | 1. 执行一次打卡<br>2. 刷新页面（触发 `loadAllData()`)<br>3. 检查 Supabase checkins 表 |
| **预期结果** | 1. 打卡后 Supabase `checkins` 表有新记录<br>2. 刷新后 `state.checkinHistory` 仍包含该记录<br>3. `todayCheckedIn` 仍为 true |
| **验证方式** | ✅ 自动化：调用 `addQuickCheckin()` 后立即查询数据库<br>✅ 手动：刷新页面验证数据一致 |
| **严重级** | **P0** |

---

### TC-HOME-027：Session 续期（localStorage currentUser）

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-027 |
| **名称** | 刷新页面后登录态保持 |
| **前置条件** | 用户已登录 |
| **操作步骤** | 1. 刷新页面<br>2. 检查 `initAuth()` 执行结果 |
| **预期结果** | 1. `localStorage.getItem('love-app-current-user')` 返回 JSON<br>2. `currentUser.value` 被正确恢复<br>3. 首页数据正常加载 |
| **验证方式** | ✅ 自动化：mock localStorage 验证 `initAuth` 恢复逻辑 |
| **严重级** | **P1** |

---

## 六、边界条件

### TC-HOME-028：跨天打卡（23:59 → 00:00）

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-028 |
| **名称** | 跨天后打卡状态重置 |
| **前置条件** | 昨天已打卡，今天尚未打卡 |
| **操作步骤** | 1. 模拟跨天（系统时间 +1 天）<br>2. 加载首页 |
| **预期结果** | 1. `todayCheckedIn` = false（新的一天）<br>2. 打卡按钮恢复 enabled 状态<br>3. 连续打卡天数根据昨天的记录决定 |
| **验证方式** | ✅ 自动化：mock `getTodayStr()` 返回新日期，验证 `todayCheckedIn` 为 false |
| **严重级** | **P1** |

---

### TC-HOME-029：时区处理（Date 对象默认时区）

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-029 |
| **名称** | 时区变化不影响打卡日期判断 |
| **前置条件** | 设备时区变更 |
| **操作步骤** | 1. 获取 `getTodayStr()`<br>2. 修改时区（mock Date）<br>3. 再次获取 `getTodayStr()` |
| **预期结果** | 1. `getTodayStr()` 使用本地时间（非 UTC）<br>2. 同一天内时区变更不会导致日期跳变（注意：JS Date 的 `getMonth/getDate` 是本地时间）<br>3. `calculateStreak` 的日期计算与 `getTodayStr()` 一致 |
| **验证方式** | ✅ 自动化：使用不同时区的 mock 验证本地日期计算 |
| **严重级** | **P1** |

---

### TC-HOME-030：历史数据为空时的首页展示

| 字段 | 内容 |
|------|------|
| **编号** | TC-HOME-030 |
| **名称** | 新用户（无历史数据）首页展示正确 |
| **前置条件** | 1. 用户已登录<br>2. 无任何打卡、午餐、愿望记录 |
| **操作步骤** | 1. 加载首页 |
| **预期结果** | 1. `loveDays` = 0（无纪念日）→ 显示空状态引导<br>2. `totalCheckins` = 0，`totalLunchSpins` = 0，`fulfilledWishes` = 0<br>3. `streakDays` = 0，无徽章进度条<br>4. `weekDays` 中仅今天高亮，其余全空 |
| **验证方式** | ✅ 自动化：传入空数组验证所有 computed 返回默认值 |
| **严重级** | **P1** |

---

## 附录 A：测试用例优先级汇总

| 优先级 | 用例编号 | 说明 |
|--------|----------|------|
| **P0** | TC-HOME-001, 002, 003, 004, 011, 012, 013, 016, 017, 026 | 核心功能，必跑 |
| **P1** | TC-HOME-005, 006, 008, 009, 014, 015, 018, 019, 020, 021, 022, 027, 028, 029, 030 | 重要功能/边界 |
| **P2** | TC-HOME-007, 010, 023, 024, 025 | UI 体验优化 |

---

## 附录 B：关键函数签名速查

```javascript
// useStreak.js
export function calculateStreak(history: Array<{date: string}>): number
export function getTodayStr(): string
export function getWeekDates(): Array<{dayName: string, dateStr: string, isToday: boolean}>
export function getLoveDays(anniversaryStr: string): number
export function getNextMilestone(streakDays: number, earnedBadges: Array): object | null
export function checkMilestone(streakDays: number, earnedBadges: Array): object | null

// useDatabase.js
async function addCheckin(record: {date, type?, photo_url?, note?, time?, timestamp?, compliment?}): {data?, error?}
async function getCheckins(): Array<{id, user_id, date, type, photo, photo_url, note, checkin_time}>

// dataStore.js
async function addQuickCheckin(dateStr: string): boolean
async function addCheckin(record): {data?, error?}
function calculateStreakFromHistory(history): {streakDays, lastCheckinDate, longestStreak, initialized}
```

---

## 附录 C：关键 Snake_case ↔ CamelCase 映射表

| Supabase 字段 | 前端字段 | 方向 | 模块 |
|---------------|----------|------|------|
| `photo_url` | `photo` | 读/写 | checkins |
| `checkin_time` | `checkin_time` | 读（保留） | checkins |
| `due_date` | `dueDate` | 读 | wishes |
| `fulfilled_by` | `fulfilledBy` | 读 | wishes |
| `status='fulfilled'` | `fulfilled=true` | 写 | wishes |
| `content` | `text` | 读/写 | messages |
| `author_name` | `author` | 读/写 | messages |
| `special_condition` | `specialCondition` | 读/写 | messages |
| `displayed_dates` | `displayedDates` | 读/写 | messages |
| `selected_at` | `date` (slice 0,10) | 读 | lunch_history |
| `restaurant_name` | `restaurant` | 读 | lunch_history |
| `streak_days` | `streakDays` | 读（computed） | checkin_stats |
| `last_checkin_date` | `lastCheckinDate` | 读（computed） | checkin_stats |
| `longest_streak` | `longestStreak` | 读（computed） | checkin_stats |
| `remind_days` | `remindDays` | 读/写 | anniversaries |
| `love_anniversary` | `loveAnniversary` | settings | settings |
| `girlfriend_name` | `girlfriendName` | settings | settings |

---

*文档版本: v1.0*  
*生成日期: 2026-07-17*  
*测试执行策略: P0 全量回归，P1 按需回归，P2 体验验证*
