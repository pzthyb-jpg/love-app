# 📋 设计审核报告 — 小皮爱情助手 v2.0

> 审核版本：DESIGN.md (2026-07-03)
> 审核人：审核/质量智能体
> 审核日期：2026-07-03

---

## 一、审核综述

本次审核基于 DESIGN.md 设计方案，结合 `/Users/wanghongbo/love-app/` 完整源码的分析，从**需求完整性、技术可行性、交互一致性、优先级合理性**四个维度进行审查。

**整体评价：** 设计方案质量较高，痛点分析透彻，迭代路径清晰。以下审核意见旨在补充遗漏、识别风险、优化优先级，为后续 PRD 和代码实现提供参考。

---

## 二、需求完整性

### 2.1 遗漏需求

| # | 遗漏需求 | 严重程度 | 说明 | 建议方案 |
|---|---------|----------|------|----------|
| G-01 | 首次使用引导 / 初始化流程 | P1 重要 | 当前没有 onboarding 流程。第一次打开 App 的用户（女友）需要设置纪念日、填写昵称、了解三个功能。设计方案提到了"设置页"但未设计首次引导流程 | 首页初始化时检测是否已配置纪念日/昵称，若无则弹出引导卡片，引导完成一次拍照打卡、一次转盘、一条愿望 |
| G-02 | Service Worker / 离线缓存策略 | P1 重要 | manifest.json 已就绪但无实际 SW 注册。PWA 核心能力（离线访问、通知点击跳转页面）完全没有实现 | 新增 sw.js，注册 service worker，利用 notificationclick 事件实现通知点击跳转 |
| G-03 | localStorage 容量超限处理 | P1 重要 | base64 照片在 iOS Safari 上 localStorage 上限约 5MB，连续打卡 14 天可能超限，当前无任何容量预警 | 检测 localStorage 使用量，接近 80% 时提示导出备份。照片增加压缩率选项（0.6 quality） |
| G-04 | 设置页完整设计 | P1 重要 | 提到"设置入口在右上角"但未提供 UI 设计稿。设置内容包括纪念日、女友昵称、男友昵称、提醒时间、数据导入导出 | 补充设置页设计：列表式布局，按"个人信息""提醒设置""数据管理"分组 |
| G-05 | 男友端管理界面设计 | P0 阻塞 | F-03 的核心问题：男朋友通过什么界面写入留言？设计方案说"管理端预先写入"但完全没有定义 | 推荐方案 A：App 内隐藏入口（长按标题 3 秒触发密码弹窗），男友在同一台手机上写留言 |
| G-06 | iOS 兼容性清单 | P2 建议 | 大量使用 navigator.vibrate()（iOS 不支持）、backdrop-filter（老 iOS 不支持）等，缺少降级策略清单 | PRD 中增加兼容性矩阵，明确每个特性的降级方案 |
| G-07 | 隐私 / 敏感数据说明 | P2 建议 | App 使用摄像头、地理位置、通知权限，照片以 base64 存 localStorage，缺少隐私说明 | 设置页增加隐私说明卡片 |

### 2.2 边界情况

| # | 场景 | 严重程度 | 说明 |
|---|------|----------|------|
| E-01 | 跨年跨月连续打卡计算 | P2 | 成就系统的 7/14/21/30 天里程碑需确保跨年跨度准确 |
| E-02 | 转盘餐厅数量极值 | P1 | 至少 2 家、最多 12 家的限制需要明确 |
| E-03 | 同一天多次拍照 | P2 | 照片墙是否展示同一天的所有照片？设计方案未明确 |
| E-04 | 愿望池清空无二次确认 | P1 | 需加确认弹窗，避免误触 |
| E-05 | 数据导入冲突 | P1 | 覆盖还是合并？数据格式版本兼容校验 |

---

## 三、技术可行性

### 3.1 可行

| 方案 | 评估 | 备注 |
|------|------|------|
| 纯前端 + localStorage | 完全可行 | 当前架构已验证 |
| Canvas 转盘 + 排除重转 | 完全可行 | 排除只需从临时数组移除该餐厅 |
| 照片墙缩略图网格 | 完全可行 | CSS grid/flexbox |
| 全屏浏览左右滑动 | 完全可行 | CSS scroll-snap-type |
| 在一起天数动画 | 完全可行 | requestAnimationFrame |
| 成就里程碑检测 | 完全可行 | 从打卡历史计算 |
| 数据导出为 JSON | 完全可行 | Blob + URL.createObjectURL |
| 数据导入 | 完全可行 | FileReader |
| URI Scheme 导航到地图 | 完全可行 | window.location.href |
| 3 种类型 Toast | 完全可行 | CSS class 切换 |
| CSS confetti 庆祝效果 | 完全可行 | 纯 CSS keyframes |

### 3.2 有风险

| 方案 | 风险评估 | 建议 |
|------|----------|------|
| base64 照片墙性能 | 14 天照片约 2.8-7MB，localStorage 约 5MB（iOS），可能超限 | 压缩到 0.6 quality + 限制 480px。推荐使用 IndexedDB 替代 localStorage 存储照片 |
| 照片墙大图内存 | 一次性加载多张大图压力大 | 懒加载：只预加载当前+前后共 3 张 |
| 留言板管理界面安全性 | 隐藏入口需防误触 | 推荐连击 5 次触发密码弹窗，4位数字密码存 localStorage |
| 转盘真实餐厅数据 | 高德 API Key 纯前端暴露有安全风险 | 维持默认列表，P2 阶段再考虑 |
| 通知点击跳转 | SW 需接收 notificationclick 事件 | 通知携带 data.url 参数 |

### 3.3 不可行

| 方案 | 原因 |
|------|------|
| F-12 基于照片的 AI 分析 | 纯前端无法做图片分析 |
| F-15 情侣同屏模式 | WebRTC 需要信令服务器 |

---

## 四、交互一致性

### 4.1 导航流程问题

| # | 问题 | 严重程度 | 说明 | 建议 |
|---|------|----------|------|------|
| N-01 | 留言板入口不唯一 | P1 | 可从首页和愿望池两个入口进入，且 3.3.1 中写了"留言板（新增 tab）"与底部导航 4 tab 矛盾 | 统一入口，不新增第 5 个 tab |
| N-02 | 设置入口不明确 | P1 | "右上角"无 UI 示意，首页 header 区域已满 | 推荐 Header 右侧加齿轮图标 |
| N-03 | 返回路径不完整 | P1 | 全屏浏览、留言板详情、设置页缺少返回机制 | 统一使用左上角返回按钮 + 右滑返回 |
| N-04 | tab 切换滚动位置保持 | P2 | 当前每次 switchTab 重建 DOM | 首次渲染后缓存 DOM 或记录 scrollTop |
| N-05 | 拍照流程与设计不一致 | P1 | 设计有 4 状态（含"用这张"确认），代码只有 3 状态 | 按设计实现 4 状态流程 |

### 4.2 视觉细节

| # | 问题 | 严重程度 | 建议 |
|---|------|----------|------|
| V-01 | 空状态缺少情感化设计 | P2 | 为照片墙、成就、统计设计空状态插画 |
| V-02 | 成就里程碑重复触发 | P2 | 存 achieved_milestones 数组避免重复 |
| V-03 | iOS 触感降级 | P2 | 封装 haptics 工具函数，降级为 CSS 动画 |

---

## 五、优先级合理性

### 5.1 建议升级

| 功能 | 原优先级 | 建议 | 理由 |
|------|---------|------|------|
| F-11 数据备份/导出 | P1 | P0 | localStorage 数据脆弱，丢失无法挽回 |
| F-13 提醒自定义 | P2 | P1 | 学生/上班族中午不便自拍，投入小收益明确 |
| Toast 升级 | P2 | P1 | 全局基础组件，改动极小 |

### 5.2 建议调整

| 功能 | 原优先级 | 建议 | 理由 |
|------|---------|------|------|
| F-12 彩虹屁进阶 | P2 | 拆分 | 照片分析推迟，模板增强保留为 P2 |
| 转盘音效/触感 | P1 | 拆分 | 触感随 P0，音效放到 P2 |

### 5.3 修正后的优先级矩阵

```
P0（MVP）修正版
  F-01 首页仪表盘      F-02 照片墙
  F-03 男朋友留言板    F-04 纪念日与爱的数据
  F-05 打卡成就系统    拍照流程简化
  愿望池优化（分类+筛选） 删除二次确认
  F-11 数据备份/导出（从 P1 升级）
  Toast 升级（从 P2 升级）
  男友管理端界面 / 隐藏入口

P1（核心增强）
  F-06 午餐结果增强    F-07 排除重转
  F-08 午餐统计        F-09 愿望/吐槽视觉强化
  F-10 愿望已实现标记  设置页完整设计
  照片存储优化         转盘触感反馈
  提醒自定义（从 P2 升级）

P2（锦上添花）
  F-12a 彩虹屁模板增强  转盘音效
  F-14 小游戏彩蛋（可选） 默认餐厅本地化
  情侣同屏模式（远景）  F-12b 照片分析（推迟）
```

---

## 六、关键矛盾与待决议题

### 矛盾：AGENTS.md vs 实际代码

| 描述 | AGENTS.md | 实际代码 |
|------|-----------|----------|
| 地图 | 高德地图 JS API | 预设 10 家虚拟餐厅 |
| icons | assets/icons/ 目录 | 不存在，全部使用 emoji |
| 模板数 | 1000+ | 约 30 个基础模板 |

建议：更新 AGENTS.md 使其与代码一致。

### 待决议题 A：男友留言数据来源

- **本地写入**（推荐）：隐藏入口 + 密码保护
- **预设数据**：静态留言，缺乏灵活性
- **本地生成**：技术不可行

### 待决议题 B：照片存储方案

14 天照片约 2.8-14MB，iOS localStorage 上限约 5MB。推荐改用 IndexedDB。

---

## 七、对 PRD 编制的建议

1. 数据模型定义（完整字段）
2. 数据流图（拍照→保存→更新首页→检查成就）
3. localStorage Key 命名规范
4. 异常处理矩阵
5. 男友管理入口的具体交互设计
6. IndexedDB 方案评估

---

## 八、总结

| 维度 | 评分 | 关键问题数 |
|------|------|-----------|
| 需求完整性 | 4/5 | 遗漏 7 项，边界 5 项 |
| 技术可行性 | 4/5 | 3 项有风险，2 项不可行 |
| 交互一致性 | 3/5 | 导航 5 处问题，视觉 3 处 |
| 优先级合理性 | 4/5 | 2 项升级建议，2 项调整 |

**3 件最重要的事：**

1. P0：定义男友留言板的管理端入口
2. P0：照片存储改用 IndexedDB（或明确降级策略）
3. P0：数据备份/导出从 P1 升级到 P0

---

*本审核报告由审核/质量智能体自动生成*
*审核日期：2026-07-03*

---

## 阶段二：PRD 审核

> 基于 PRD.md (v2.0 Alpha, 2026-07-03) 审查
> 审核日期：2026-07-03

### 一、字段定义完整性

#### 1.1 已完成字段定义

| 数据实体 | 字段定义完整度 | 备注 |
|---------|--------------|------|
| `homePageData` | ⭐⭐⭐⭐ 完整 | 聚合数据结构，字段类型、注释清晰 |
| `checkin_history` | ⭐⭐⭐⭐ 完整 | 字段完备，含 date/time/photo/compliment/timestamp |
| `messages` | ⭐⭐⭐⭐⭐ 完整 | 字段清晰，enum 值（morning/evening/random/special）明确 |
| `checkin_streak` | ⭐⭐⭐⭐ 完整 | streakDays/lastCheckinDate/longestStreak 齐全 |
| `checkin_badges` | ⭐⭐⭐⭐ 完整 | id/name/emoji/earnedDate 完整 |
| `BADGE_DEFINITIONS` | ⭐⭐⭐⭐⭐ 完整 | 常量定义清晰，含颜色 |

#### 1.2 字段定义遗漏/不清晰

| # | 问题 | 位置 | 影响 | 建议 |
|---|------|------|------|------|
| F-01 | `weekStatus` 数组中 `isToday` 未定义类型 | §2.4 | 代码实现时需要自行推断 | 补充 `isToday: boolean` 类型标注 |
| F-01 | `date` 未使用，仅 `dayName` 和 `checked` | §2.4 | 前端无法用于日期比较，只能用当前日期推断 | 补充 `date: string` 字段（YYYY-MM-DD） |
| F-01 | `latestMessage` 中的 `time` 格式不明确 | §2.4 | 是 YYYY-MM-DD HH:mm 还是 HH:mm？ | 统一格式：`YYYY-MM-DD HH:mm` 或 ISO 8601 |
| F-02 | `galleryState.photos` 数组元素未定义完整结构 | §3.3 | 只列出了 `{ photo, compliment, date, time }`，缺少类型标注 | 补充完整字段定义，与 `checkin_history` 条目对齐 |
| F-03 | `messages` 中 `id` 类型不明确 | §4.3 | 示例中是数字 1/2/3，但 auto-increment 逻辑未说明 | 明确 `id: number`，使用 `Date.now()` 或计数器生成 |
| F-03 | `specialCondition` 枚举值不完整 | §4.3 | 只给了 `'anniversary' | 'festival'`，但 `null` 含义不明确 | 补充完整枚举：`'anniversary' | 'festival' | null` |
| F-05 | `checkin_streak.longestStreak` 在 PRD 的数据字段定义中提到但未见计算逻辑 | §6.3 / §10.1 | 代码段中未提供 longestStreak 计算方式 | 补充 `calculateLongestStreak()` 的伪代码或说明 |
| F-05 | `checkin_streak` 中缺少初始化标志 | §10.1 | 首次从 v1.0 升级时难以区分「从未计算过」和 streak=0 | 补充 `initialized: boolean` 字段或迁移标志 |
| §10 | `wishes` 字段 `fulfilled` 未定义 | §10.1 | PRD 中提到「已实现」但 wishes 数据结构中没有 `fulfilled` 字段 | 补充 `fulfilled: boolean`（默认 false）和 `fulfilledDate: string \| null` |

#### 1.3 默认值与边界值

| # | 问题 | 严重程度 | 说明 |
|---|------|----------|------|
| D-01 | `wishes` 的 `id` 生成方式 | P1 | 当前代码使用 `Date.now() + Math.random()`，但 PRD 未约束生成策略，可能导致重复 |
| D-02 | `restaurants` 最低/最高数量限制 | P1 | PRD 说「至少 2 家才能转」但未在字段定义中明确 min/max |
| D-03 | `love_anniversary` 格式校验 | P2 | 未定义无效日期（如 '2026-13-01'）的兜底 |
| D-04 | `messages.displayedDates` 上限 | P2 | 如果留言长期不更新，displayedDates 数组可能无限增长 |

### 二、数据流清晰度

#### 2.1 数据流图（§9）审核

**优点：**
- 清晰的读/写分离示意图（§9.1 → §9.3 两张表）
- 每个 key 的写入来源和读取页面均明确标注
- 首页作为聚合读取枢纽的设计合理

**不闭环的路径：**

| # | 数据流缺口 | 影响 | 建议 |
|---|-----------|------|------|
| DF-01 | **留言管理端数据流未闭环** | F-03 留言管理端的入口（连续点击标题 5 次或 `?admin=true`）在 PRD §4.4 描述，但数据流图（§9.1）中「留言板管理端→messages」的连接缺失 | 在数据流图中补充管理端写入 messages 的箭头 |
| DF-02 | **设置页的数据流缺失** | PRD 提到设置页面包含纪念日、昵称、提醒时间等，但完全没有任何数据流定义（写入什么 key？页面从哪里读取？） | 增加「设置页」的数据流，明确 love_anniversary、notification_enabled、昵称的写入流程 |
| DF-03 | **checkin_streak 的写入触发时机不完整** | §9.2 说「拍照后」触发，但 `calculateStreak()` 每次渲染时应从 `checkin_history` 重新计算，而不是依赖存储的 `streakDays` | 明确 streak 是「实时计算」还是「缓存值」：建议实时计算，checkin_streak 只作为展示加速 |
| DF-04 | **homePageData.weekStatus 的聚合逻辑未描述** | 首页的周打卡状态从 checkin_history 聚合的方式没有在数据流中明确 | 补充 weekStatus 的聚合规则 |
| DF-05 | **「清空愿望」操作在数据流中缺失** | §9.2 表格中没有「清空愿望→wishes」的写入行 | 补充完整 |
| DF-06 | **照片墙的读取数据流缺失「全屏浏览状态」** | galleryState 定义在 §3.3 但数据流图未体现 | 非关键，galleryState 为运行时状态无需持久化 |

#### 2.2 页面间导航数据传递

| 导航路径 | 数据传递方式 | 是否闭环 |
|---------|------------|---------|
| 首页→拍照 | 无数据传递，直接 tab 切换 | ✅ |
| 首页→午餐 | 无数据传递，直接 tab 切换 | ✅ |
| 首页→愿望 | 无数据传递，直接 tab 切换 | ✅ |
| 首页→留言板详情 | 通过路由状态或 tab 切换传递「展示留言」参数 | ⚠️ 未明确 |
| 拍照→全屏浏览 | 通过 galleryState 传递当前照片列表和索引 | ✅ |
| 留言管理→messages | 直接 CRUD localStorage | ⚠️ 管理端入口路径未在数据流中标注 |

### 三、异常覆盖度

#### 3.1 异常矩阵覆盖率

| 异常类别 | 条目数 | 覆盖度 | 评价 |
|---------|-------|--------|------|
| 摄像头异常 | 4 条 | ⭐⭐⭐⭐ | 覆盖权限、设备、资源占用、低光（低光选择不处理合理） |
| localStorage 异常 | 5 条 | ⭐⭐⭐⭐⭐ | 容量满、清除、隐私模式、低存储、数据损坏，非常全面 |
| 留言相关异常 | 5 条 | ⭐⭐⭐⭐⭐ | 无留言、循环耗尽、留言过少、格式错误、特殊日无 special，非常全面 |
| 网络相关异常 | 2 条 | ⭐⭐⭐ | 覆盖离线可用、地图 URI 无法打开，但缺少更细粒度的网络降级策略 |
| 成就系统异常 | 3 条 | ⭐⭐⭐ | 覆盖动画队列冲突、跨时区、数据迁移，但缺少以下场景 |

#### 3.2 缺失的异常场景

| # | 异常场景 | 类别 | 严重程度 | 建议 |
|---|---------|------|----------|------|
| E-01 | **拍照时浏览器标签页被切到后台（iOS 自动关闭摄像头）** | 摄像头 | P1 | 捕获 `NotAllowedError` 并自动重启摄像头流，而非让用户手动操作 |
| E-02 | **localStorage 写入失败但 safeSetJSON 返回 false 时，UI 无反馈** | localStorage | P1 | safeSetJSON 返回 false 时调用 showToast 通知用户 |
| E-03 | **连续打卡计算：同一天多次打卡** | 成就 | P2 | PRD F-02 提到「同一天所有照片」，但 streak 计算中同一天多条记录应只算一天。需明确 `hasCheckedInToday()` 返回 true 时重复拍照是否更新 streak |
| E-04 | **转盘指针计算结果偏差** | 午餐 | P1 | §6.3 `getResultIndex()` 中 `normalized` 计算使用了 `rotation % (2π)` 但旋转动画累计后可能因浮点精度产生偏移 |
| E-05 | **留言板循环重置的递归风险** | 留言 | P1 | §4.3 `getTodaysMessage()` 中所有留言展示完后的递归调用可能因 `messages.forEach(m => m.displayedDates = [])` 后仍然匹配失败而无限递归。需加安全阀（retry 上限） |
| E-06 | **safeGetJSON 的数据修复逻辑未闭环** | 通用 | P1 | 数据损坏时执行 `localStorage.removeItem(key)`，但丢失了原有数据，应尝试修复而非直接删除（如最后一条有效记录回退） |
| E-07 | **iOS 低存储模式 silent failure** | localStorage | P1 | §11.2 提到「捕获异常降级为内存存储」，但内存存储意味着页面关闭后数据丢失，应有显式提示 |
| E-08 | **留言管理端无认证失败兜底** | 留言 | P2 | 密码弹窗输入错误后如何处理？无限尝试还是 3 次锁定？ |
| E-09 | **数据导入格式不匹配** | 数据 | P1 | §11 未覆盖导入数据的格式校验和版本兼容性 |
| E-10 | **多个 tab 同时渲染时 checkin_streak 的计算冲突** | 成就 | P2 | 用户快速切换 tab 可能导致 streak 计算多次执行 |

#### 3.3 通用兜底策略审核

`safeGetJSON` / `safeSetJSON` 工具函数设计合理，包含：
- ✅ try-catch 捕获 JSON.parse 错误
- ✅ 数据损坏时自动修复（清除 key）
- ✅ QuotaExceededError 自动清理
- ✅ 重试机制
- ✅ 明确的返回值（boolean）

**改进建议：**
1. `safeSetJSON` 中 `autoCleanupStorage()` 函数未定义，应给出清理策略（按时间删除最旧的 checkin_history 条目）
2. `safeGetJSON` 中 `removeItem(key)` 后应记录日志或触发异常监控，以便排查数据损坏的根本原因

### 四、验收标准可测试性

#### 4.1 各功能验收标准评分

| 功能 | 条目数 | 可测试性评分 | 评价 |
|-----|-------|------------|------|
| F-01 首页仪表盘 | 6 条 | ⭐⭐⭐⭐ | 大部分量化（「默认进入首页」「包含当天」「跳转到对应功能页」）。#5「数据一致性」未量化 |
| F-02 照片墙 | 7 条 | ⭐⭐⭐⭐⭐ | 优秀，每条都可测试。**存储限制 14 天**和**旧照片不清除**覆盖了边界 |
| F-03 留言板 | 7 条 | ⭐⭐⭐⭐ | 良好。#3「早上展示早安」边界时间（11:59 vs 12:00）未明确，#5「循环机制」未给出循环周期 |
| F-04 纪念日 | 5 条 | ⭐⭐⭐⭐ | 良好，数字动画量化到 ease-out 缓动 |
| F-05 成就系统 | 9 条 | ⭐⭐⭐⭐⭐ | 非常全面，每个里程碑独立验收，#5 同里程碑不重复触发，#6 中断归零，#7 徽章保留，#9 进度显示 |
| F-09 愿望池升级 | 6 条 | ⭐⭐⭐ | 偏视觉验收（「紫粉渐变」「暖橙渐变」），缺少性能指标和异常边界 |
| 拍照流程简化 | 无独立验收表 | ⭐⭐ | 在 §8 中有状态机定义但没有独立的验收标准列表 |
| 通用验收 | 4 个维度（功能/兼容/性能/体验） | ⭐⭐⭐ | 各维度条目偏少，且部分不可测试（如「情感表达」） |

#### 4.2 不可测试/难以量化的验收项

| # | 验收条件 | 问题 | 建议 |
|---|---------|------|------|
| AC-01 | F-01 #5「数据一致性」 | 未定义「一致」的量化标准。是逐字段比对？还是视觉抽样？ | 改为「首页展示的打卡天数 = checkin_history 唯一日期数；首页展示的转盘次数 = lunch_history 长度」 |
| AC-02 | F-03 #3「早上展示早安」 | 6:00-11:59 的边界：11:59 展示早安，12:00 展示什么？ | 明确 12:00-17:59 为「随机」，与留言类型算法一致 |
| AC-03 | F-04 #3「数字动画」 | ease-out 缓动是主观感受，无法自动化测试 | 补充验收方式：观察动画时长（~1000ms）和终点值正确 |
| AC-04 | F-05 #8「弹跳动画」 | 与#3 同理，「弹跳」是视觉效果 | 改为「streak 数字从 N→N+1 有过渡动画」 |
| AC-05 | F-09 #6「留言入口」 | 只说「顶部显示最新留言预览」，未定义「最新」的标准 | 改为「按 createdAt 倒序第一条留言的 text 和 author」 |
| AC-06 | 数据迁移（§12.1） | 「v1.0 数据正常读取」没有验收用例 | 补充验收用例清单：逐一验证每个 v1.0 key 在 v2.0 下正确加载 |
| AC-07 | 体验验收（§12.4） | 「情感表达」「友好提示」「平滑动画」均为主观判断 | 改为检查清单：是否包含 emoji/是否显示中文提示/动画时间 < 300ms |

#### 4.3 验收标准覆盖缺口

| # | 缺少的验收 | 建议补充 |
|---|-----------|---------|
| GAP-01 | iOS Safari 兼容性专项验收 | 增加：`navigator.vibrate` 降级/CSS `backdrop-filter` 降级 |
| GAP-02 | localStorage 容量预警验收 | 增加：容量达 80% 时提示「备份数据」 |
| GAP-03 | 首次使用引导验收 | 增加：第一次打开时无纪念日/无留言/无打卡时的 UI 展示 |
| GAP-04 | 数据导出/导入验收 | PRD 未将此列为 P0，但 REVIEW_DESIGN.md 阶段一已建议升级为 P0 |
| GAP-05 | 留言管理端安全性验收 | 增加：隐藏入口/密码验证的成功与失败路径 |
| GAP-06 | 转盘数量极值验收 | 增加：餐厅<2 时禁用转盘按钮 + 提示 |
| GAP-07 | 拍照连续按多次 | 增加：连拍状态机不会卡在中间状态 |
| GAP-08 | 多 tab 切换时状态保持 | 增加：切到拍照→再切回来→拍照页不重新请求摄像头 |

### 五、PRD 整体评分

| 维度 | 评分 | 关键问题数 |
|------|------|-----------|
| 字段定义完整性 | 4/5 | 字段遗漏 3 处，边界未定义 4 处 |
| 数据流清晰度 | 4/5 | 数据流缺口 6 处，多为局部可补 |
| 异常覆盖度 | 4/5 | 缺失 10 个异常场景，但通用兜底策略优秀 |
| 验收标准可测性 | 4/5 | 不可测试 7 项，覆盖缺口 8 处 |

**综合评价：** PRD 质量较高，数据字段定义详尽（尤其是 messages 和 checkin_streak），异常矩阵远超同类项目标准，验收标准整体可测。主要问题集中在：设置页数据流缺失、留言管理端数据流未入图、部分验收标准主观不可测。这些问题均为补充性而非颠覆性。

### 六、PRD 与 DESIGN.md 的一致性审查

| 对比项 | DESIGN.md 描述 | PRD.md 描述 | 一致性 |
|-------|---------------|------------|--------|
| 照片墙存储天数 | 最近 7 天 | 最近 14 天 | ⚠️ 不一致 |
| checkin_history 存储上限 | 30 天 | 14 天 | ⚠️ 不一致（PRD 做了优化但未与 DESIGN 对齐） |
| 拍照流程 | 4 状态（含「用这张」确认） | 3 状态（无确认步骤，自动保存） | ⚠️ 不一致 |
| 设置页 | 有提及「纪念日、昵称、提醒」 | 仅在数据流中提到，无完整设计 | ✅ 一致（都未充分定义） |
| 留言板管理端 | 长按标题 3 秒 + 密码 | 连续点击 5 次 + `?admin=true` | ⚠️ 不一致 |
| 数据备份导出 | P1（建议升级 P0） | 未列为 P0 | ⚠️ PRD 未采纳阶段一建议 |

### 七、阶段二审核结论

**3 件最重要的事：**

1. **PRD 与 DESIGN 对齐**：统一照片墙存储天数（7 vs 14）、拍照流程步骤（3 vs 4）、留言管理端入口方式
2. **补充设置页数据流**：love_anniversary、昵称、提醒时间当前在 PRD 中无完整数据流定义
3. **修复递归风险**：§4.3 `getTodaysMessage()` 的无限递归需加 retry 上限

**PRD 整体成熟度：** 85/100 — 适合进入编码阶段，建议先修复上述 3 件最重要的事。

---

## 阶段三：代码审核

> 基于 `/Users/wanghongbo/love-app/src/` 完整源码审查
> 审核日期：2026-07-03
> 代码分支：`main`（已合并所有 feat-v2-step4 代码）

---

### 一、设计一致性

#### 1.1 页面结构与 DESIGN.md 线框图对照

| 页面 | DESIGN.md 线框图 | 代码实现 | 一致性 |
|------|-----------------|----------|--------|
| 🏠 首页仪表盘 | 包含：Header/爱的数据/今日状态/留言预览/本周打卡 | ✅ 完全匹配：4 个卡片 + 纪念日设置弹窗 | ✅ 一致 |
| 📸 拍照打卡 | 包含：日期/拍照区域(280px)/彩虹屁/照片墙/成就徽章/通知开关 | ⚠️ 预览区高度 280px vs DESIGN 220px，其他均实现 | ✅ 基本一致 |
| 🍽️ 午餐转盘 | 包含：转盘(300px)/统计/结果弹窗(导航+收藏+再转)/餐厅管理 | ✅ 完全匹配：所有元素均实现 | ✅ 一致 |
| ✨ 愿望池 | 包含：留言入口/输入区/筛选栏/气泡/导出导入/操作菜单 | ✅ 完全匹配：所有元素均实现 | ✅ 一致 |
| 💌 留言管理 | 包含：密码验证/新建留言/留言列表/密码重置 | ✅ 完全匹配：所有元素均实现 | ✅ 一致 |

**发现的问题：**

| # | 问题 | 类型 | 严重程度 |
|---|------|------|----------|
| DCC-01 | **拍照流程设计与代码不一致**：DESIGN.md 设计了 4 状态流程（IDLE→CAMERA_READY→PHOTO_CAPTURED→确认用这张），但代码实现了带「用这张」确认步骤的 4 状态流程（匹配 DESIGN，不匹配 PRD 的 3 状态） | 流程分歧 | P1 |

**分析**：PRD §8.1 描述的是 3 步流程（自动保存无确认），但实际代码中 Photo.vue 实现了 `captured` 状态后的两个按钮「再拍一张」和「用这张」，这是 DESIGN.md 中描述的 4 状态流程。代码选择了 DESIGN.md 的方案而非 PRD 的 3 步方案。这是一个需要 PRD 与 DESIGN 对齐的问题，代码本身行为合理。

| # | 问题 | 类型 | 严重程度 |
|---|------|------|----------|
| DCC-02 | **照片墙存储天数不一致**：PRD §10.3 明确说「最近 14 天」，DESIGN.md 说「最近 7 天」。代码实现了 14 天（`fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)`） | 存储阈值分歧 | P1 |

```
[FEEDBACK] type: design_redo
[FEEDBACK] severity: P1
[FEEDBACK] target: docs/DESIGN.md
[FEEDBACK] problem: 照片墙存储天数：DESIGN.md 说「最近 7 天」，而 PRD.md 说「最近 14 天」，代码按 14 天实现。跨文档不一致需统一
[FEEDBACK] solution: 统一为 14 天（PRD 优化方案），更新 DESIGN.md 中 §F-02 的「最近 7 天」为「最近 14 天」
```

#### 1.2 数据字段一致性（代码 vs PRD 定义）

| 数据实体 | PRD 定义字段 | 代码使用字段 | 一致性 |
|---------|-------------|-------------|--------|
| `checkin_history` | date/time/photo/compliment/timestamp | ✅ 完全一致 | ✅ |
| `wishes` | id/text/type/time/timeStr/dateStr | ✅ 代码额外实现了 `fulfilled`/`fulfilledBy` | ⚠️ PRD 未定义但代码已实现 |
| `messages` | id/text/type/author/createdAt/displayedDates/specialCondition | ✅ 完全一致 | ✅ |
| `checkin_streak` | streakDays/lastCheckinDate/longestStreak | ✅ 代码额外实现了 `initialized` 标志 | ⚠️ PRD 未定义 |
| `checkin_badges` | id/name/emoji/earnedDate | ✅ 完全一致 | ✅ |
| `love_anniversary` | YYYY-MM-DD | ✅ 一致 | ✅ |
| `notification_enabled` | 'true'/'false' | ✅ 一致 | ✅ |

**发现的问题：**

| # | 问题 | 严重程度 |
|---|------|----------|
| DCC-03 | `wishes` 中的 `fulfilled`/`fulfilledBy` 字段代码已实现但 PRD 中无定义。代码 `dataStore.js` 中的 `messages` 存储使用了 `STORAGE_KEYS.MESSAGES` 但 PRD 中 localStorage key 统一名为 `messages` — 一致 | P2 建议补充 PRD |

#### 1.3 localStorage Key 命名一致

| Key | PRD 定义 | 代码 (STORAGE_KEYS) | 一致性 |
|-----|---------|-------------------|--------|
| `checkin_history` | ✅ | ✅ | ✅ |
| `wishes` | ✅ | ✅ | ✅ |
| `restaurants` | ✅ | ✅ | ✅ |
| `lunch_history` | ✅ | ✅ | ✅ |
| `messages` | ✅ | ✅ | ✅ |
| `checkin_streak` | ✅ | ✅ | ✅ |
| `checkin_badges` | ✅ | ✅ | ✅ |
| `love_anniversary` | ✅ | ✅ | ✅ |
| `notification_enabled` | ✅ | ✅ | ✅ |
| `admin_password` | PRD 未定义 | ✅ 代码 STORAGE_KEYS.ADMIN_PASSWORD | ⚠️ PRD 遗漏 |

**发现的问题：**

| # | 问题 | 严重程度 |
|---|------|----------|
| DCC-04 | `admin_password` key 代码中已使用（STORAGE_KEYS.ADMIN_PASSWORD = 'admin_password'），但 PRD 中未定义该 localStorage key | P2 |

#### 1.4 功能行为一致性（代码 vs PRD 业务规则）

| PRD 业务规则 | 代码实现 | 一致性 |
|-------------|---------|--------|
| App 默认进入首页 | ✅ router 默认路由 `/` 指向 Home.vue | ✅ |
| 状态圆点击跳转到对应功能页 | ✅ Home.vue `goToTab(index)` 映射 `['/', '/photo', '/lunch', '/wish']` | ✅ |
| 在一起天数包含当天 | ✅ `getLoveDays()` 中 `Math.floor(...) + 1` | ✅ |
| 无纪念日时显示「设置纪念日 🎂」 | ✅ Home.vue `v-else` 分支显示 | ✅ |
| 留言展示按时间段匹配 | ✅ `getTodaysMessage()` 实现了完整规则 | ✅ |
| 留言不重复展示 | ✅ `displayedDates.includes(currentDateStr)` 过滤 | ✅ |
| 留言循环重置 | ✅ `getTodaysMessage()` 实现了重置逻辑 | ✅ |
| 愿望/吐槽气泡不同样式 | ✅ Wish.vue `wish-bubble.wish` 和 `.vent` CSS | ✅ |
| 筛选 tab（全部/愿望/吐槽/已实现） | ✅ filterTabs 数组 + filteredWishes computed | ✅ |
| 删除二次确认 | ✅ window.confirm() 用于删除餐厅和愿望 | ✅ |
| 成就里程碑 7/14/21/30 天 | ✅ BADGE_DEFINITIONS 常量 | ✅ |
| 照片墙 3 列缩略图 | ✅ `grid-template-columns: repeat(3, 1fr)` | ✅ |
| 缩略图尺寸约 80×80 | ⚠️ 缩略图使用 `aspect-ratio: 1` 自适应，未固定 80×80 | P2 建议 |
| 全屏浏览左右滑动 | ✅ gallery-overlay + scroll-snap-type | ✅ |
| 全屏照片下方显示彩虹屁 | ✅ `gallery-info` 显示 date + compliment | ✅ |

---

### 二、代码质量

#### 2.1 Vue 3 Composition API + `<script setup>` 使用

| 文件 | 使用 `<script setup>` | Composition API | 一致性 |
|------|---------------------|-----------------|--------|
| Home.vue | ✅ | ✅ ref/computed/onMounted/nextTick | ✅ |
| Photo.vue | ✅ | ✅ ref/computed/onMounted/onUnmounted/nextTick | ✅ |
| Lunch.vue | ✅ | ✅ ref/computed/nextTick | ✅ |
| Wish.vue | ✅ | ✅ ref/computed | ✅ |
| MessagesAdmin.vue | ✅ | ✅ ref/computed/onMounted | ✅ |
| TabBar.vue | ✅ | ✅ computed | ✅ |
| Toast.vue | ✅ | ✅ ref | ✅ |
| ConfirmDialog.vue | ✅ | ✅ ref | ✅ |
| LunchWheel.vue | ✅ | ✅ ref/onMounted/watch/nextTick | ✅ |

**评价**：✅ 所有组件一致使用 Vue 3 Composition API + `<script setup>`，无 Options API 遗留。

#### 2.2 死代码、console.log、调试注释

| 检查项 | 结果 |
|--------|------|
| 搜索 `console.log` | ✅ 未找到任何 console.log 遗留 |
| 搜索 `v-html`/`innerHTML`/XSS 风险 | ✅ 未找到 |
| 搜索调试注释（`// TODO`, `// FIXME`, `// debug`） | ✅ 无未清理的调试注释 |

**评价**：✅ 代码干净，无死代码或调试遗留。

#### 2.3 组件拆分与 composables 复用

**组件结构：**

```
src/
├── components/
│   ├── TabBar.vue         — 底部导航（4 tab）
│   ├── Toast.vue          — 全局 Toast 系统（3 种类型）
│   ├── ConfirmDialog.vue  — 确认弹窗组件
│   └── LunchWheel.vue     — 转盘 Canvas 绘制 + 动画
├── views/
│   ├── Home.vue           — 首页仪表盘
│   ├── Photo.vue          — 拍照打卡（含照片墙、成就、全屏浏览）
│   ├── Lunch.vue          — 午餐转盘（含统计、餐厅管理）
│   ├── Wish.vue           — 愿望池（含留言弹窗、导入导出）
│   └── MessagesAdmin.vue  — 留言管理端（含密码验证）
├── composables/
│   ├── useStorage.js      — localStorage 安全读写
│   ├── useHaptics.js      — 触感反馈（降级）
│   ├── useStreak.js       — 连续打卡计算 + 成就
│   └── useMessages.js     — 留言匹配算法
├── stores/
│   └── dataStore.js       — 响应式数据层
└── router/
    └── index.js           — 5 路由配置
```

**评价**：
- ✅ 组件拆分合理：LunchWheel 作为独立组件从 Lunch.vue 抽离，复用性好
- ✅ composables 职责清晰：useStorage（存储抽象）、useHaptics（触感）、useStreak（打卡逻辑）、useMessages（留言逻辑）各司其职
- ✅ dataStore.js 作为单例状态管理，统一封装了所有 CRUD 操作
- ⚠️ 建议：ConfirmDialog 组件在代码中几乎没被使用（实际使用的 `window.confirm()` 是原生 API），存在但未通过 `defineExpose` 方式被引用

#### 2.4 CSS 变量体系

| 检查项 | 结果 |
|--------|------|
| CSS 变量定义 | ✅ `main.css` 定义了完整的变量体系：颜色/圆角/阴影/间距/字体/过渡/TabBar 高度/安全区域 |
| SCSS/CSS 变量混合使用 | ✅ 全部使用 CSS 变量（`var(--primary)` 等），无 sass/less 遗留 |
| 硬编码颜色值 | ⚠️ 存在少量硬编码值（详见下方） |

**硬编码值问题：**

| 位置 | 硬编码值 | 应使用变量 | 严重程度 |
|------|---------|-----------|----------|
| `LunchWheel.vue:58-62` | COLORS 数组 `'#FF6B9D', '#C084FC', '#FFD700'...` | 转盘颜色属于设计常量，可接受 | P2 建议 |
| `Wish.vue:506` | `background: linear-gradient(135deg, #F3E8FF, #E8F0FE)` | 与 PRD 定义一致，可接受 | ✅ 可接受 |
| `Wish.vue:516` | `background: linear-gradient(135deg, #FFE5D9, #FFF0F3)` | 与 PRD 定义一致，可接受 | ✅ 可接受 |
| `MessagesAdmin.vue` | msg-type-badge colors (硬编码 `#E3F2FD`, `#1565C0` 等) | 建议使用 CSS 变量 | P2 建议 |
| `Wish.vue` | `.wish-bubble.fulfilled` 中 `color: #F57F17` | 建议使用 CSS 变量 | P2 建议 |

#### 2.5 性能问题

| 检查项 | 评估 |
|--------|------|
| 首页 computed 依赖 | ✅ 所有首页数据通过 computed 从 state 聚合，响应式依赖追踪 |
| 照片墙懒加载 | ⚠️ 全屏浏览时一次性加载 `recentPhotos` 所有照片，未实现懒加载（但最多 14 张，影响可接受） |
| 转盘动画 | ✅ 使用 requestAnimationFrame，60fps 流畅 |
| 页面切换动画 | ✅ App.vue 使用 `<transition>`，smooth 切换 |
| localStorage 写入频率 | ✅ 每次操作仅写一次，无冗余写入 |
| confirmDialog 未使用 | ✅ 非性能问题，是 unused component |

**发现的问题：**

| # | 问题 | 严重程度 |
|---|------|----------|
| CQ-01 | **全屏画廊未实现懒加载**：`galleryPhotos` 一次性加载全部 `recentPhotos` 照片内存，虽然数据量不大（最多 14 张），但每张 base64 图片约 100-200KB，最坏情况约 2.8MB 内存 | P2 建议 |
| CQ-02 | **Photo.vue `cameraState` 缺少 `opening` 状态的 UI 反馈**：从 `idle`→`opening` 时按钮变为加载态，但 `cameraState` 值 'opening' 在模板中未对应任何按钮渲染（`v-if="cameraState === 'idle'"`、`v-else-if="cameraState === 'ready'"`、`v-else-if="cameraState === 'captured'"` — 没有 'opening' 分支）这意味着在摄像头加载期间按钮消失 | P1 |

```
[FEEDBACK] type: code_redo
[FEEDBACK] severity: P1
[FEEDBACK] target: src/views/Photo.vue
[FEEDBACK] problem: cameraState='opening' 时模板没有对应的按钮渲染，用户在摄像头加载期间看不到任何操作按钮，出现 UI 空白期
[FEEDBACK] solution: 在 camera-card 的 actions 区域增加 v-if="cameraState === 'opening'" 分支，显示「⏳ 正在打开摄像头...」加载态按钮（disabled）
```

| # | 问题 | 严重程度 |
|---|------|----------|
| CQ-03 | **未使用的 ConfirmDialog 组件**：`ConfirmDialog.vue` 已在项目中存在但未被任何视图引用，实际使用都是 `window.confirm()` 原生 API | P2 建议 |

---

### 三、Bug 检测

#### 3.1 边界情况处理

| 场景 | 代码处理 | 评价 |
|------|---------|------|
| 无打卡记录时照片墙 | ✅ `v-else` 显示「还没有打卡记录哦，开始打卡吧 📸」 | ✅ |
| 无留言时展示 | ✅ Home.vue `v-if="todayMessage"` 条件渲染 | ✅ |
| 无留言时管理端 | ✅ MessagesAdmin.vue 显示空状态「还没有留言，添加第一条吧」 | ✅ |
| 餐厅 < 2 时转盘禁用 | ✅ LunchWheel `:disabled="isSpinning \|\| restaurants.length < 2"` | ✅ |
| localStorage 数据损坏 | ✅ safeGetJSON try-catch + removeItem | ✅ |
| localStorage 容量满 | ✅ safeSetJSON QuotaExceededError + autoCleanupStorage | ✅ |

**发现的问题：**

| # | 问题 | 类型 | 严重程度 |
|---|------|------|----------|
| BUG-01 | **`autoCleanupStorage` 清理后未同步 state**：`useStorage.js:48-63` 中 `autoCleanupStorage()` 直接调用 `localStorage.setItem()` 操作的是 `checkin_history`，但不会更新 `state.checkinHistory` 响应式对象。写入成功返回 true 后，父级继续执行 `safeSetJSON(key, value)` 写入新数据。但被清理的 `checkin_history` 中旧的条目已在 localStorage 中被删除，而 `state.checkinHistory` 中仍保留着旧数据——**导致 state 与 localStorage 不同步** | 数据不一致 | P1 |

```
[FEEDBACK] type: code_redo
[FEEDBACK] severity: P1
[FEEDBACK] target: src/composables/useStorage.js
[FEEDBACK] problem: autoCleanupStorage() 清理 checkin_history 后未同步 state.checkinHistory，导致 state 和 localStorage 数据不一致
[FEEDBACK] solution: autoCleanupStorage 应通过回调或事件通知 dataStore 更新 state，或者清除操作直接在 dataStore 中触发
```

| # | 问题 | 类型 | 严重程度 |
|---|------|------|----------|
| BUG-02 | **`getWeekDates()` 的 `isToday` 计算逻辑错误**：`useStreak.js:93` 中计算 `isToday` 使用 `i === dayOfWeek + mondayOffset`，当 `dayOfWeek === 0`（周日）时 `mondayOffset = -6`，此时 `i=6`（周日）时 `isToday = 6 === (0 + (-6) + 6) = 6` 正确，但 `dayName` 数组 `['一', '二', '三', '四', '五', '六', '日']` 中周日对应 `i=6`，这没问题。但当 `dayOfWeek = 0` 且 `i=0`（周一）时，`isToday = 0 === (0 + (-6)) = 0`，这会错误地将周一标记为今天。Sunday 的 `dayOfWeek=0`，`mondayOffset = 1 - 0 = 1`，`isToday` 计算为 `i === 0 + 1 = 1`（周二）。实际上正确的公式是 `dayOfWeek === 0 ? i === 6 : i === dayOfWeek - 1` | 日期计算错误 | P1 |

```
[FEEDBACK] type: code_redo
[FEEDBACK] severity: P1
[FEEDBACK] target: src/composables/useStreak.js
[FEEDBACK] problem: getWeekDates() 中 isToday 计算在非周日情况下错误。当 dayOfWeek=3（周三），i=2（周三）时 mondayOffset=-2，isToday = i === dayOfWeek + mondayOffset = 2 === 3 + (-2) = 1 → false。正确公式应为：dayOfWeek === 0 ? i === 6 : i === dayOfWeek - 1
[FEEDBACK] solution: 修改 getWeekDates() 中 isToday 的计算逻辑
```

#### 3.2 异步操作异常处理

| 场景 | 处理方式 | 评价 |
|------|---------|------|
| 摄像头打开失败 | ✅ try-catch + showToast 友好提示 + 重置为 idle | ✅ |
| localStorage 写入失败 | ✅ safeSetJSON 返回 false，但上层未处理返回值 | ⚠️ 见下方 |
| FileReader 读取失败 | ✅ try-catch 包裹 JSON.parse | ✅ |
| Toast 不存在的优雅降级 | ✅ `window.__showToast?.()` 可选链 | ✅ |

**发现的问题：**

| # | 问题 | 严重程度 |
|---|------|----------|
| BUG-03 | **safeSetJSON 返回值被忽略**：`dataStore.js` 中所有 `safeSetJSON()` 调用均未检查返回值。当 localStorage 写入失败（如容量满或隐私模式）时，UI 显示成功但数据实际未持久化 | P1 |

```
[FEEDBACK] type: code_redo
[FEEDBACK] severity: P1
[FEEDBACK] target: src/stores/dataStore.js
[FEEDBACK] problem: 所有 safeSetJSON() 返回值未检查，写入静默失败时用户不知情
[FEEDBACK] solution: 在 dataStore.js 的写入操作中检查 safeSetJSON 返回值，失败时调用 window.__showToast?.('⚠️ 数据保存失败，请检查存储空间', 'error')
```

| # | 问题 | 严重程度 |
|---|------|----------|
| BUG-04 | **`Photo.vue:356` `safeSetString` 返回值未检查**：toggleNotification 中写入 `notification_enabled` 未检查写入是否成功 | P2 |

#### 3.3 导航逻辑

| 路由 | 入口 | 出口 | 闭环 |
|------|------|------|------|
| `/` (Home) | App 启动 | tab 切换 | ✅ |
| `/photo` | tab 切换 | tab 切换 | ✅ |
| `/lunch` | tab 切换 | tab 切换 | ✅ |
| `/wish` | tab 切换 | tab 切换 | ✅ |
| `/messages-admin` | 连击标题 5 次 | 按钮「返回首页」 | ✅ |

**发现的问题：**

| # | 问题 | 严重程度 |
|---|------|----------|
| BUG-05 | **MessagesAdmin.vue 缺少后退导航**：管理员页面有「返回首页」按钮（`router.push('/')`），但无浏览器后退支持。使用 `history: createWebHashHistory()` 意味着 `history.back()` 不可靠。建议同时增加 `onBeforeRouteLeave` 或在页面左上角增加返回按钮 | P2 |

#### 3.4 用户输入安全

| 输入点 | XSS 风险 | 处理方式 |
|--------|---------|---------|
| 愿望输入（textarea） | ❌ 无 v-html，使用 `{{ wish.text }}` 文本插值 | ✅ Vue 自动转义 |
| 留言输入（textarea） | ❌ 无 v-html，使用 `{{ msg.text }}` 文本插值 | ✅ Vue 自动转义 |
| 餐厅添加（input） | ❌ 无 v-html，文本插值 | ✅ Vue 自动转义 |
| 地图导航 | ⚠️ encodeURIComponent 处理后的 name 拼接 URL | ✅ 基本安全 |
| 数据导入 JSON.parse | ⚠️ 解析用户上传文件，但仅读取数据结构 | ✅ 有格式校验 |

**评价**：✅ 无 XSS 风险。所有用户输入都通过 Vue 模板插值 `{{ }}` 渲染，Vue 自动进行 HTML 转义。

---

### 四、移动端兼容性

#### 4.1 iOS Safari 兼容性

| 特性 | 使用位置 | iOS 支持 | 降级处理 |
|------|---------|---------|---------|
| `navigator.vibrate()` | useHaptics.js + 多个组件 | ❌ iOS 不支持 | ✅ `isIOS()` 检测跳过 |
| `backdrop-filter` | main.css:245 (toast) | ✅ iOS 8+ | ✅ 有 `-webkit-backdrop-filter` 前缀 |
| `scroll-snap-type` | main.css:537 (gallery) | ✅ iOS 11+ | ✅ 未加 `-webkit` 前缀，但 iOS 11+ 已支持标准属性 |
| `CSS Grid` | 照片墙 grid | ✅ iOS 10.3+ | ✅ |
| `env(safe-area-inset-bottom)` | main.css:70 | ✅ iOS 11+ | ✅ 有 fallback `0px` |

**发现的问题：**

| # | 问题 | 严重程度 |
|---|------|----------|
| MC-01 | **`scroll-snap-type` 缺少 `-webkit-` 前缀**：`main.css:537` 使用的是标准 `scroll-snap-type`，但 iOS Safari 15 之前需要 `-webkit-scroll-snap-type`。不过 iOS Safari 15+ 已支持标准属性，考虑到目标用户 iOS 15+，风险较低 | P2 建议 |
| MC-02 | **`Wish.vue:457` `-webkit-overflow-scrolling: touch` 在 iOS 13+ 已废弃**：该属性在 iOS 13+ 无效果，可移除 | P2 建议 |

#### 4.2 PWA 配置

| 配置项 | 状态 | 评价 |
|--------|------|------|
| manifest.json | ✅ 通过 VitePWA 插件自动生成 | ✅ |
| 应用名称 | ✅ name/short_name 配置 | ✅ |
| 主题色/背景色 | ✅ theme_color/background_color 配置 | ✅ |
| 启动方式 | ✅ display: standalone | ✅ |
| 图标 | ⚠️ 引用了 `pwa-192x192.png` 和 `pwa-512x512.png` 但**文件不存在** | P0 |

**发现的问题：**

| # | 问题 | 严重程度 |
|---|------|----------|
| MC-03 | **PWA 图标文件缺失**：`vite.config.js:24-25` 配置了 `pwa-192x192.png` 和 `pwa-512x512.png`，但搜索整个项目（包括 `public/` 目录）均未找到这两个文件。这意味着 PWA 构建时会缺少图标，导致添加到主屏幕时使用默认占位图标 | **P0** |

```
[FEEDBACK] type: code_redo
[FEEDBACK] severity: P0
[FEEDBACK] target: vite.config.js + public/
[FEEDBACK] problem: vite-plugin-pwa 配置引用了 pwa-192x192.png 和 pwa-512x512.png，但这两个文件在项目中不存在
[FEEDBACK] solution: 在 public/ 目录下放置至少 192x192 和 512x512 两个尺寸的 PNG 图标，或使用 VitePWA 的 includeAssets 指向现有资源
```

| # | 问题 | 严重程度 |
|---|------|----------|
| MC-04 | **service worker 无 `notificationclick` 事件处理**：`vite.config.js` 使用 `workbox` 自动生成 SW，但没有配置 `notificationclick` 事件处理，意味着通知点击后无法跳转到对应页面 | P1 |

```
[FEEDBACK] type: code_redo
[FEEDBACK] severity: P1
[FEEDBACK] target: vite.config.js
[FEEDBACK] problem: vite-plugin-pwa 的 workbox 配置没有自定义 notificationclick 事件处理逻辑，通知点击后无法跳转到 App 内对应页面
[FEEDBACK] solution: 增加 customServiceWorker 或通过 VitePWA 的 customServiceWorkerScript 配置 notificationclick 事件监听，从 data.url 获取目标页面路径并调用 clients.openWindow
```

#### 4.3 视口设置与安全区域

| 设置 | 代码 | 评价 |
|------|------|------|
| viewport | ✅ `content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"` | ✅ 包含 `viewport-fit=cover` |
| safe-area-inset-bottom | ✅ `--safe-bottom: env(safe-area-inset-bottom, 0px)` | ✅ |
| TabBar 底部安全区域 | ✅ `height: calc(var(--tabbar-height) + var(--safe-bottom))` | ✅ |
| 页面底部 padding | ✅ `padding-bottom: calc(var(--space-3xl) + var(--safe-bottom))` | ✅ |
| 全屏模式 | ✅ `apple-mobile-web-app-capable: yes` | ✅ |
| 状态栏样式 | ✅ `apple-mobile-web-app-status-bar-style: default` | ✅ |

**评价**：✅ 视口和安全区域处理完整，所有页面都考虑了 safe-area。

#### 4.4 其他移动端问题

| # | 问题 | 严重程度 |
|---|------|----------|
| MC-05 | **未实现通知推送（Notification API 未调用）**：PRD 描述通知提醒需要 Notification API 和 Service Worker 配合，但代码中未调用 `Notification.requestPermission()` 或 `registration.showNotification()`。`Photo.vue` 的 `toggleNotification` 只是切换 `localStorage` 中的标记 | P1 |

```
[FEEDBACK] type: code_redo
[FEEDBACK] severity: P1
[FEEDBACK] target: src/views/Photo.vue
[FEEDBACK] problem: 通知开关仅切换 localStorage 标记，未实际调用 Notification API 注册定时提醒
[FEEDBACK] solution: 在 toggleNotification 中调用 Notification.requestPermission()，授权后使用 Service Worker registration.showNotification() 或 setInterval + new Notification() 实现定时提醒
```

---

### 五、阶段三审核结论

#### 关键发现汇总

| 分类 | # | 严重程度 | 简述 |
|------|---|----------|------|
| 设计 | DCC-01 | P1 | 拍照流程：代码 4 状态 vs PRD 3 状态，需统一文档 |
| 设计 | DCC-02 | P1 | 照片墙存储天数：DESIGN 7 天 vs PRD 14 天 vs 代码 14 天 |
| 代码质量 | CQ-02 | P1 | Photo.vue `cameraState='opening'` 时按钮消失，UI 空白期 |
| 代码质量 | CQ-03 | P2 | ConfirmDialog 组件未使用 |
| Bug | BUG-01 | P1 | `autoCleanupStorage` 清理后未同步 state，数据不一致 |
| Bug | BUG-02 | P1 | `getWeekDates()` 中 `isToday` 计算逻辑错误 |
| Bug | BUG-03 | P1 | safeSetJSON 返回值未检查，写入静默失败 |
| Bug | BUG-04 | P2 | toggleNotification 写入返回值未检查 |
| Bug | BUG-05 | P2 | MessagesAdmin 缺少浏览器后退支持 |
| 移动端 | MC-01 | P2 | scroll-snap-type 建议加 -webkit- 前缀 |
| 移动端 | MC-02 | P2 | -webkit-overflow-scrolling:touch 在 iOS 13+ 已废弃 |
| 移动端 | MC-03 | **P0** | PWA 图标文件（192x192, 512x512）缺失 |
| 移动端 | MC-04 | P1 | service worker 无 notificationclick 事件处理 |
| 移动端 | MC-05 | P1 | 通知开关未实际调用 Notification API |

#### P0 问题（必须修复）

1. **MC-03**: PWA 图标文件缺失 — `vite.config.js` 引用的 `pwa-192x192.png` 和 `pwa-512x512.png` 文件不存在

#### P1 问题（需要修复）

1. **CQ-02**: Photo.vue `opening` 状态无 UI 反馈，按钮空白期
2. **BUG-01**: `autoCleanupStorage()` 清理后 state 与 localStorage 不同步
3. **BUG-02**: `getWeekDates()` 中 `isToday` 计算逻辑错误
4. **BUG-03**: `dataStore.js` 忽略 `safeSetJSON` 返回值
5. **MC-04**: Service Worker 无 `notificationclick` 处理
6. **MC-05**: 通知开关未调用 Notification API
7. **DCC-01**: 拍照流程文档不一致
8. **DCC-02**: 照片墙存储天数跨文档不一致

#### 审核评分

| 维度 | 评分 | 关键问题数 |
|------|------|-----------|
| 设计一致性 | 4/5 | 3 处不一致 |
| 代码质量 | 4/5 | 3 个问题（1 P1 + 2 P2） |
| Bug 检测 | 3/5 | 5 个 Bug（3 P1 + 2 P2） |
| 移动端兼容性 | 3/5 | 5 个问题（1 P0 + 2 P1 + 2 P2） |

**综合评价：** 代码整体质量良好，架构清晰（Vue 3 Composition API + 响应式 Store + 独立 Composables），CSS 变量体系完整，移动端 safe-area 处理到位。主要问题集中在：PWA 图标文件缺失（P0）、几个数据一致性的 Bug、以及通知功能的缺失实现。建议修复所有 P0/P1 问题后部署。

---

*本审核报告由审核/质量智能体自动生成*
*审核日期：2026-07-03*