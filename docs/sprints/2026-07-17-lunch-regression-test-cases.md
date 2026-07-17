# 午餐功能回归测试案例文档

**功能模块**: Lunch.vue — 午餐转圈 + 附近餐厅搜索
**文档日期**: 2026-07-17
**版本**: v1.0
**创建者**: 测试团队

---

## 1. 模块概述

### 1.1 关联文件

| 文件 | 路径 | 职责 |
|------|------|------|
| Lunch.vue | `src/views/Lunch.vue` | 午餐功能主页面，包含转圈Tab和附近Tab |
| useRestaurants.js | `src/composables/useRestaurants.js` | 高德POI搜索、收藏管理、转圈逻辑 |
| useDatabase.js | `src/composables/useDatabase.js` | Supabase CRUD，午餐记录持久化 |
| useLocation.js | `src/composables/useLocation.js` | 多策略定位：GPS→ip-api→高德IP→fallback |
| dataStore.js | `src/stores/dataStore.js` | 响应式数据层，统一管理状态 |
| useStorage.js | `src/composables/useStorage.js` | localStorage 工具函数 |
| LunchWheel | `src/components/LunchWheel.vue` | 转盘组件（被Lunch.vue引用） |

### 1.2 核心数据流

```
用户打开 Lunch.vue
  └─ onMounted → locateAndSearch()
       ├─ getLocation()
       │    ├─ GPS定位(浏览器授权)
       │    ├─ ip-api.com IP定位
       │    ├─ 高德IP定位
       │    └─ fallback: 北京
       └─ searchNearby() → 高德POI周边搜索(3000m)

转圈逻辑:
  startSpin → onSpinStart → LunchWheel旋转 → spinWheel()随机 → onSpinEnd(winner)
    └─ addLunchRecord({restaurant_name, selected_at}) → db.addLunchRecord → state.lunchHistory.unshift

附近逻辑:
  分类筛选/搜索 → filteredRestaurants → 收藏toggleFavorite → localStorage + 实时UI
  切换城市 → handleChangeCity → searchNearby → 刷新列表
```

### 1.3 关键数据映射

| 前端字段 (dataStore) | Supabase字段 | 映射逻辑 |
|---------------------|-------------|---------|
| `date` | `selected_at` | `selected_at.slice(0, 10)` — 取ISO时间的前10位 |
| `restaurant` | `restaurant_name` | 直接赋值映射 |

---

## 2. 测试案例清单

### 编号规则

- **P0**: 核心功能，阻断性缺陷，必测
- **P1**: 重要功能，影响体验，高优先级
- **P2**: 边界/兼容性，低优先级但不可忽视

---

## 3. 正向流程测试

### TC-L001: 页面加载自动定位并搜索附近餐厅

| 项目 | 内容 |
|------|------|
| **编号** | TC-L001 |
| **名称** | 页面加载自动定位并搜索附近餐厅 |
| **前置条件** | 用户已登录；高德API Key有效；设备支持定位授权 |
| **操作步骤** | 1. 清除浏览器数据 2. 访问 `/lunch` 页面 |
| **预期结果** | 1. 进入时 `locating=true` 展示加载动画 2. 定位完成后根据GPS或IP获取坐标 3. 调用高德POI周边搜索API 4. 页面展示餐厅列表，包含emoji、名称、评分、距离、分类标签 5. `locating=false`，列表可交互 |
| **验证方式** | 手动检查 UI：加载动画出现→消失；餐厅卡片渲染正确；距离显示合理（如"1.2km"、"800m"） |
| **严重级** | **P0** |

---

### TC-L002: 转圈选餐厅完整流程

| 项目 | 内容 |
|------|------|
| **编号** | TC-L002 |
| **名称** | 转圈选餐厅完整流程 |
| **前置条件** | favoritesList中至少有2家收藏的餐厅 |
| **操作步骤** | 1. 切换到「转圈」Tab 2. 点击转盘中心触发 `startSpin` 3. 等待转盘停止 4. 观察结果弹窗 |
| **预期结果** | 1. `onSpinStart`: `showResult=false`，中奖结果清空 2. 转盘旋转期间不可重复触发 3. `onSpinEnd(winner)`: 弹窗展示中奖餐厅emoji+名称 4. 自动调用 `addLunchRecord({restaurant_name: winner.name, selected_at: ISOString})` 5. 释放 `HAPTIC_PATTERNS.SPIN_STOP` 触觉反馈 6. 触发 `launchConfetti()` 彩纸动画 |
| **验证方式** | 1. 验证弹窗展示 "好！去吃！🎉" 和 "🔁 再转（排除当前）" 按钮 2. 验证 `state.lunchHistory` 新增一条记录 3. 验证触觉反馈调用日志 |
| **严重级** | **P0** |

---

### TC-L003: 确认结果关闭弹窗

| 项目 | 内容 |
|------|------|
| **编号** | TC-L003 |
| **名称** | 确认结果关闭弹窗 |
| **前置条件** | TC-L002 完成后弹出结果弹窗 |
| **操作步骤** | 1. 点击「好！去吃！🎉」按钮 |
| **预期结果** | 1. `showResult=false` 关闭弹窗 2. 显示 Vant Toast: "🎉 去吃 {餐厅名}！" 3. `excludedIds` 重置为空数组 `[]` 4. UI 回到转圈页面，可继续转 |
| **验证方式** | 1. 弹窗关闭 2. Toast 出现 3. 再次转圈不受上次结果影响 |
| **严重级** | **P1** |

---

### TC-L004: 再转一次（排除当前餐厅）

| 项目 | 内容 |
|------|------|
| **编号** | TC-L004 |
| **名称** | 再转一次（排除当前餐厅） |
| **前置条件** | TC-L002 完成后弹出结果弹窗 |
| **操作步骤** | 1. 点击「🔁 再转（排除当前）」按钮 |
| **预期结果** | 1. 当前中奖餐厅ID被加入 `excludedIds.value` 2. `showResult=false`，弹窗关闭 3. 100ms 后自动调用 `wheelRef.value.startSpin()` 4. 第二次转圈时，`favoritesList` 已被过滤掉被排除的餐厅 |
| **验证方式** | 1. 第二次转圈不会选中刚被排除的餐厅 2. `favoritesList = favorites.filter(f => !excludedIds.includes(f.id))` 计算正确 |
| **严重级** | **P1** |

---

### TC-L005: 收藏附近餐厅

| 项目 | 内容 |
|------|------|
| **编号** | TC-L005 |
| **名称** | 收藏附近餐厅 |
| **前置条件** | 在「附近」Tab浏览餐厅列表 |
| **操作步骤** | 1. 点击某餐厅卡片的 ♡ 收藏按钮 |
| **预期结果** | 1. `toggleFavorite(r)` 被调用 2. `favorites` 数组新增该餐厅对象 `{id, name, emoji, distance, rating, tags, address, lat, lon, source}` 3. 按钮变为 ❤️（红色实心），样式添加 `.active` class 4. 自定义 Toast 显示 "已收藏，可以在「转圈」中选它了" 5. localStorage `STORAGE_KEYS.FAVORITE_RESTAURANTS` 同步更新 |
| **验证方式** | 1. 按钮状态变为已收藏 2. 切换到转圈Tab，该餐厅出现在 `favoritesList` 3. localStorage 可读取到更新后的收藏数组 |
| **严重级** | **P0** |

---

### TC-L006: 取消收藏

| 项目 | 内容 |
|------|------|
| **编号** | TC-L006 |
| **名称** | 取消收藏（从附近列表） |
| **前置条件** | 已在附近列表收藏了某餐厅 |
| **操作步骤** | 1. 点击已收藏餐厅的 ❤️ 按钮 |
| **预期结果** | 1. `toggleFavorite(r)` 从 `favorites` 数组中移除该餐厅 2. 按钮恢复为 ♡ 空心样式 3. Toast 显示 "已取消收藏" 4. localStorage 同步更新 |
| **验证方式** | 1. 按钮恢复到未收藏样式 2. 转圈Tab的 `favoritesList` 不再包含该餐厅 |
| **严重级** | **P1** |

---

### TC-L007: 从转圈Tab取消收藏

| 项目 | 内容 |
|------|------|
| **编号** | TC-L007 |
| **名称** | 从转圈Tab取消收藏 |
| **前置条件** | 转圈 Tab 的餐厅管理折叠面板可见，有已收藏的餐厅 |
| **操作步骤** | 1. 展开「🏪 餐厅管理」折叠面板 2. 点击某餐厅的 💔 按钮 |
| **预期结果** | 1. `handleUnfavorite(r)` → `toggleFavorite(r)` 从数组移除 2. Toast 显示 "已取消收藏" 3. 列表中该餐厅项消失 |
| **验证方式** | 1. 面板内餐厅项减少 2. localStorage 同步更新 |
| **严重级** | **P1** |

---

### TC-L008: 切换城市更新餐厅列表

| 项目 | 内容 |
|------|------|
| **编号** | TC-L008 |
| **名称** | 切换城市更新餐厅列表 |
| **前置条件** | 当前在某城市页面 |
| **操作步骤** | 1. 点击城市选择器打开弹窗 2. 选择可用城市列表中的另一城市 |
| **预期结果** | 1. `showCityPicker=false` 关闭弹窗 2. `locating=true` 展示加载态 3. `setLocation(city, 0, 0)` 设置城市名和坐标(0,0) 4. `await searchNearby()` — 因为坐标为0，走城市搜索URL分支 5. 加载完成 `locating=false` 6. Toast 显示 "已切换到 {city}" 7. 列表更新为所选城市的餐厅 |
| **验证结果** | 1. 城市名显示更新 2. 餐厅列表切换为新城市数据 3. URL格式为 `place/text?city={city}` (因为lat=lon=0) |
| **严重级** | **P1** |

---

### TC-L009: 分类筛选功能

| 项目 | 内容 |
|------|------|
| **编号** | TC-L009 |
| **名称** | 分类标签筛选餐厅 |
| **前置条件** | 附近列表已加载餐厅数据 |
| **操作步骤** | 1. 点击某个分类标签（如「火锅」） 2. 再点另一个 3. 再点「全部」 |
| **预期结果** | 1. `activeCategory` 更新 2. `filteredRestaurants` 计算属性被触发 3. 列表仅展示 tags 包含该分类的餐厅 4. 选中标签样式添加 `.active` class（红底白字） 5. 恢复「全部」时展示所有结果 |
| **验证方式** | 1. 列表项数与预期匹配 2. 标签高亮状态正确 |
| **严重级** | **P1** |

---

### TC-L010: 搜索关键词过滤

| 项目 | 内容 |
|------|------|
| **编号** | TC-L010 |
| **名称** | 搜索关键词过滤 |
| **前置条件** | 附近列表已加载 |
| **操作步骤** | 1. 在搜索框输入餐厅名称关键词 |
| **预期结果** | 1. `searchKeyword` 双向绑定更新 2. `filteredRestaurants` 过滤匹配 `name.toLowerCase().includes(q)` 或 `tags.some(t.includes(q))` 的餐厅 3. 实时更新列表 |
| **验证方式** | 输入 "拉面" 仅显示名称或标签含"拉面"的餐厅 |
| **严重级** | **P1** |

---

### TC-L011: 统计卡片数据更新

| 项目 | 内容 |
|------|------|
| **编号** | TC-L011 |
| **名称** | 统计卡片数据正确更新 |
| **前置条件** | `state.lunchHistory` 有历史数据 |
| **操作步骤** | 1. 转圈一次获得结果 2. 查看统计卡片 |
| **预期结果** | 1. `weekSpinCount`: 统计本周一开始的记录数（周一为周首） 2. `todaySpinCount`: 统计 `date === getTodayStr()` 的记录数 3. `totalSpinCount`: `state.lunchHistory.length` 4. `topRestaurants`: 频次最高的TOP3，展示 `emoji × count` 5. 转圈后统计数字立即更新 |
| **验证方式** | 1. 已知lunchHistory有5条，其中本周3条，今天1条 → 统计分别显示3/1/5 2. 若有餐厅名出现次数最高，TOP1显示正确 |
| **严重级** | **P1** |

---

### TC-L012: 收藏列表实时同步到转盘

| 项目 | 内容 |
|------|------|
| **编号** | TC-L012 |
| **名称** | 收藏列表实时同步到转盘 |
| **前置条件** | 在附近Tab收藏了0家餐厅 |
| **操作步骤** | 1. 收藏1家餐厅 2. 再收藏1家 3. 切换到转圈Tab |
| **预期结果** | 1. 收藏1家时提示"至少需要 2 家餐厅才能转哟 🥟" 2. 收藏2家后提示消失 3. 转盘展示2家餐厅区块（按LunchWheel组件） |
| **验证方式** | `favoritesList` 计算属性返回过滤后的数组，长度=转盘扇区数 |
| **严重级** | **P0** |

---

## 4. 反向流程测试

### TC-L101: 无定位权限时的fallback

| 项目 | 内容 |
|------|------|
| **编号** | TC-L101 |
| **名称** | 无定位权限时的城市fallback |
| **前置条件** | 浏览器拒绝 `navigator.geolocation` 授权 |
| **操作步骤** | 1. 拒绝位置授权 2. 访问 Lunch 页面 |
| **预期结果** | 1. `getGPSLocation()` 返回 null 2. `getLocationByIpApi()` 尝试 ip-api.com 3. 如果 ip-api 成功，使用 ip-api 返回的城市 4. 如果 ip-api 也失败，使用高德 IP 定位 5. 全部失败时 fallback `{city: '北京', lat: 0, lon: 0, source: 'fallback'}` |
| **验证方式** | 1. 网络面板确认 ip-api.com 请求 2. 城市名 fallback 为北京 3. `locating` false，列表展示 |
| **严重级** | **P0** |

---

### TC-L102: 高德API未配置时的降级

| 项目 | 内容 |
|------|------|
| **编号** | TC-L102 |
| **名称** | 高德API Key未配置 |
| **前置条件** | `VITE_AMAP_KEY` 为空字符串 |
| **操作步骤** | 1. 清空环境变量 2. 访问 Lunch 页面 |
| **预期结果** | 1. `searchNearby()` 中 `AMAP_KEY` 为空判断触发 2. `console.warn('未配置高德 API Key')` 3. 返回空数组 `[]` 4. `restaurants.value = []` 5. 列表显示 "没有找到相关餐厅" |
| **验证方式** | 1. 控制台出现 warn 2. 列表为空，poi-empty 区域展示 |
| **严重级** | **P0** |

---

### TC-L103: 网络异常时的搜索失败

| 项目 | 内容 |
|------|------|
| **编号** | TC-L103 |
| **名称** | POI搜索API网络异常 |
| **前置条件** | 模拟高德 API 返回错误或网络不可达 |
| **操作步骤** | 1. 断开网络 2. 刷新 Lunch 页面 |
| **预期结果** | 1. `fetch(url)` 抛出异常 2. `catch(e)` 捕获后返回 `[]` 3. `restaurants.value = []`，列表展示空态 4. 控制台 `console.warn('POI search failed:', e)` |
| **验证方式** | 1. 列表显示空状态 2. 不产生页面崩溃 |
| **严重级** | **P0** |

---

### TC-L104: 未登录时转圈

| 项目 | 内容 |
|------|------|
| **编号** | TC-L104 |
| **名称** | 未登录状态下使用转圈 |
| **前置条件** | 用户未登录 |
| **操作步骤** | 1. 未登录访问 /lunch 2. 收藏2家餐厅（如果可收藏） 3. 切换到转圈Tab |
| **预期结果** | 1. favorites 数据来自 localStorage，仍可转圈 2. 转圈结果弹窗展示 3. 触发 `addLunchRecord()` 时，`db.addLunchRecord` 检测 `!currentUser.value` 返回 `{error: {message: '未登录'}}` 4. `state.lunchHistory` 不更新 5. 弹窗关闭后统计数字不变 |
| **验证方式** | 1. 网络面板确认 `/lunch_history` POST 请求返回 401 或错误 2. 统计卡片数字不增加 |
| **严重级** | **P1** |

---

### TC-L105: 高德API返回非status=1

| 项目 | 内容 |
|------|------|
| **编号** | TC-L105 |
| **名称** | 高德API返回异常状态码 |
| **前置条件** | 模拟高德 API 返回 `{status: '0', info: 'INVALID_PARAMS'}` |
| **操作步骤** | 1. Mock高德API返回失败状态 |
| **预期结果** | 1. `data.status === '1'` 判断不通过 2. 返回空数组 3. `restaurants.value` 保持上次结果（不更新） 4. 用户看到上次的列表 |
| **验证方式** | 1. 网络响应为 status:0 2. 列表不变 |
| **严重级** | **P1** |

---

### TC-L106: 设备不支持Geolocation API

| 项目 | 内容 |
|------|------|
| **编号** | TC-L106 |
| **名称** | 设备不支持Geolocation API |
| **前置条件** | 设备/浏览器不支持 `navigator.geolocation` |
| **操作步骤** | 1. 访问 Lunch 页面 |
| **预期结果** | 1. `getGPSLocation()` 中 `!navigator.geolocation` 判断触发 2. `resolve(null)` 返回 null 3. 降级到 ip-api.com 定位 4. 后续流程正常 |
| **验证方式** | 1. 不阻塞页面 2. 可正常定位到城市级 |
| **严重级** | **P1** |

---

### TC-L107: GPS定位超时

| 项目 | 内容 |
|------|------|
| **编号** | TC-L107 |
| **名称** | GPS定位超时（timeout=10000ms） |
| **前置条件** | GPS设备存在但信号差（超时场景） |
| **操作步骤** | 1. 访问 Lunch 页面 2. 授权定位 |
| **预期结果** | 1. 10秒内无响应触发 error 回调 2. `console.warn('GPS 定位失败:', err.message)` 3. GPS定位返回 null 4. 进入下一级ip-api定位降级 |
| **验证方式** | 1. 定位降级正常工作 2. 页面10秒内响应 |
| **严重级** | **P1** |

---

### TC-L108: 全部定位策略失败的最终fallback

| 项目 | 内容 |
|------|------|
| **编号** | TC-L108 |
| **名称** | 全部定位策略失败的最终fallback |
| **前置条件** | navigator.geolocation不存在 + ip-api.com请求失败 + 高德IP返回异常 |
| **操作步骤** | 1. 模拟全部失败 |
| **预期结果** | 1. 最终返回 `{city: '北京', region: '北京市', country: '中国', lat: 0, lon: 0, source: 'fallback'}` 2. `currentCity` 设为「北京」 3. `userLat/userLon=0` 走城市搜索分支 4. `searchNearby()` 调用高德 `place/text?city=北京` 获取餐厅 |
| **验证方式** | 1. 网络请求URL为 `place/text?city=北京` 2. 北京餐厅列表展示 |
| **严重级** | **P1** |

---

### TC-T109: 城市切换搜索失败

| 项目 | 内容 |
|------|------|
| **编号** | TC-T109 |
| **名称** | 城市切换时搜索失败 |
| **前置条件** | 切换城市时高德API不可用 |
| **操作步骤** | 1. 打开城市选择弹窗 2. 选择新城市 3. searchNearby() 抛异常 |
| **预期结果** | 1. `handleChangeCity` 中 `try...catch` 捕获异常 2. Toast 显示 "搜索失败，请稍后重试" 3. `locating=false` 关闭加载态 4. 页面不崩溃，展示空列表或上次结果 |
| **验证方式** | 1. Toast出现 2. 页面可继续交互 |
| **严重级** | **P2** |

---

## 5. 数据映射验证

### TC-D001: date字段映射（selected_at → date）

| 项目 | 内容 |
|------|------|
| **编号** | TC-D001 |
| **名称** | selected_at 切片映射到 date 字段 |
| **前置条件** | Supabase 返回 `selected_at: '2026-07-17T08:30:00.000Z'` |
| **操作步骤** | 1. 调用 `getLunchHistory()` 映射数据 |
| **预期结果** | 1. `row.selected_at.slice(0, 10)` 返回 `'2026-07-17'` 2. `date: '2026-07-17'` 存在于映射后的对象中 3. `restaurant: row.restaurant_name` 直接赋值 |
| **验证方式** | 断言映射结果含 `date: '2026-07-17'` 和 `restaurant: {餐厅名}` |
| **严重级** | **P0** |

---

### TC-D002: selected_at为空时的date映射

| 项目 | 内容 |
|------|------|
| **编号** | TC-D002 |
| **名称** | selected_at为空时的date映射（边界） |
| **前置条件** | row.selected_at = null |
| **操作步骤** | 映射数据 |
| **预期结果** | `date: ''`（空字符串），不抛错 |
| **验证方式** | 代码不崩溃，date为空字符串 |
| **严重级** | **P1** |

---

### TC-D003: restaurant字段映射（restaurant_name → restaurant）

| 项目 | 内容 |
|------|------|
| **编号** | TC-D003 |
| **名称** | restaurant_name 映射到 restaurant 字段 |
| **前置条件** | row.restaurant_name = '兰州拉面' |
| **操作步骤** | 映射数据 |
| **预期结果** | `restaurant: '兰州拉面'` |
| **验证方式** | 断言映射结果含 `restaurant: '兰州拉面'` |
| **严重级** | **P0** |

---

### TC-D004: restaurant_name为空时的映射

| 项目 | 内容 |
|------|------|
| **编号** | TC-D004 |
| **名称** | restaurant_name为空时的映射（边界） |
| **前置条件** | row.restaurant_name = null/undefined |
| **操作步骤** | 映射数据 |
| **预期结果** | `restaurant: ''`（空字符串 `|| ''` 兜底） |
| **验证方式** | 代码不崩溃，restaurant为空 |
| **严重级** | **P1** |

---

### TC-D005: addLunchRecord参数映射（前端→后端）

| 项目 | 内容 |
|------|------|
| **编号** | TC-D005 |
| **名称** | 前端addLunchRecord入参到Supabase字段映射 |
| **前置条件** | 前端入参 `{restaurant_name: '测试餐厅', selected_at: '2026-07-17T08:30:00.000Z'}` |
| **操作步骤** | 调用 `db.addLunchRecord(record)` |
| **预期结果** | 1. POST body 包含 `{restaurant_name: '测试餐厅', selected_at: '2026-07-17T08:30:00.000Z'}` 2. 网络请求中确认字段名与Supabase列名一致 |
| **验证方式** | 网络面板检查 POST body: `{user_id, restaurant_name, selected_at, rating: null, note: null}` |
| **严重级** | **P0** |

---

### TC-D006: Lunch.vue中onSpinEnd调用参数

| 项目 | 内容 |
|------|------|
| **编号** | TC-D006 |
| **名称** | onSpinEnd调用addLunchRecord的参数验证 |
| **前置条件** | winner.name = '火锅店' |
| **操作步骤** | 触发 `onSpinEnd(winner)` |
| **预期结果** | 调用 `{restaurant_name: '火锅店', selected_at: new Date().toISOString()}` |
| **验证方式** | 1. restaurant_name 应为 winner.name 2. selected_at 应为合法的ISO格式 |
| **严重级** | **P0** |

---

## 6. UI 渲染验证

### TC-U001: 餐厅卡片完整性渲染

| 项目 | 内容 |
|------|------|
| **编号** | TC-U001 |
| **名称** | POI卡片展示完整字段 |
| **前置条件** | 高德API返回完整POI数据 |
| **操作步骤** | 观察餐厅列表中单个卡片 |
| **预期结果** | 每个 `poi-card` 必须包含：1. `poi-name`: "{emoji} {name}" 2. `poi-meta`: "★{rating}" + "·" + "{distance}" + "·" + "{tags[0]}" 3. `poi-addr`: address文本 4. 右侧收藏按钮 ♡/♥ |
| **验证方式** | DOM检查各class存在且文本正确 |
| **严重级** | **P0** |

---

### TC-U002: 距离格式化展示

| 项目 | 内容 |
|------|------|
| **编号** | TC-U002 |
| **名称** | 距离格式化展示 |
| **前置条件** | haversineDistance计算后得到米数 |
| **操作步骤** | 验证不同距离值的展示 |
| **预期结果** | 1. `< 1000`: 展示 "{N}m"（如 "800m"） 2. `>= 1000`: 展示 "{X.X}km"（如 "1.5km"） 3. 无效值(NaN): 展示 "—" |
| **验证方式** | 验证 distance = 800 → "800m"；1500 → "1.5km"；NaN → "—" |
| **严重级** | **P1** |

---

### TC-U003: 评分展示

| 项目 | 内容 |
|------|------|
| **编号** | TC-U003 |
| **名称** | 评分星星和数字展示 |
| **前置条件** | POI 有 rating 字段 |
| **操作步骤** | 观察评分区域 |
| **预期结果** | 1. ★ 符号 + rating数字（如 ★4.5） 2. 星星颜色 `#F5A623` 3. 无 rating 时默认 4.0 |
| **验证方式** | 检查 `.poi-star` 元素文本是否为 `★{数字}` |
| **严重级** | **P1** |

---

### TC-U004: 标签/分类高亮

| 项目 | 内容 |
|------|------|
| **编号** | TC-U004 |
| **名称** | 分类标签选中状态 |
| **前置条件** | categories数组渲染 |
| **操作步骤** | 点击某个分类标签 |
| **预期结果** | 1. 选中标签带 `.active` class 2. 背景色 `var(--primary)` 白色文字 3. 未选中标签白底灰字 4. `activeCategory` 更新触发计算 |
| **验证方式** | 检查选中标签的 CSS class 和样式 |
| **严重级** | **P1** |

---

### TC-U005: 无搜索结果的empty展示

| 项目 | 内容 |
|------|------|
| **编号** | TC-U005 |
| **名称** | 无搜索结果时的空态展示 |
| **前置条件** | `filteredRestaurants.length === 0` |
| **操作步骤** | 1. 搜索一个不可能存在的关键词（如 "xyz_not_exist_restaurant"） |
| **预期结果** | `.poi-empty` 展示，文本 "没有找到相关餐厅" |
| **验证方式** | DOM中存在 `.poi-empty` 元素 |
| **严重级** | **P1** |

---

### TC-U006: 转圈Tab的提示文案

| 项目 | 内容 |
|------|------|
| **编号** | TC-U006 |
| **名称** | 转圈Tab收藏不足时的提示文案 |
| **前置条件** | 转圈Tab的 `favoritesList.length < 2` |
| **操作步骤** | 1. 有0家收藏时切换到转圈Tab 2. 有1家收藏时切换到转圈Tab |
| **预期结果** | 1. 0家: "去「附近」收藏餐厅，开始转吧 🥟" 2. 1家: "至少需要 2 家餐厅才能转哟 🥟" |
| **验证方式** | `v-if="favoritesList.length < 2"` 检查文案正确 |
| **严重级** | **P1** |

---

### TC-U007: 结果弹窗渲染

| 项目 | 内容 |
|------|------|
| **编号** | TC-U007 |
| **名称** | 转圈结果弹窗UI渲染 |
| **前置条件** | 转圈结束，`showResult=true` |
| **操作步骤** | 观察弹窗 |
| **预期结果** | 1. `.dialog-overlay` 全屏遮罩 z-index:9999 2. `.result-box` 弹窗 3. `result-emoji` 展示中奖餐厅emoji 4. h3 标题展示餐厅名 5. 副标题 "今天就去吃这个吧 🎉" 6. 两个按钮：主按钮「好！去吃！🎉」+ 次按钮「🔁 再转（排除当前）」 |
| **验证方式** | DOM结构和文本正确 |
| **严重级** | **P0** |

---

### TC-U008: 城市选择弹窗渲染

| 项目 | 内容 |
|------|------|
| **编号** | TC-U008 |
| **名称** | 城市选择弹窗渲染 |
| **前置条件** | 点击城市选择器 |
| **操作步骤** | 观察城市选择弹窗 |
| **预期结果** | 1. 标题 "选择城市" 2. 3列网格布局 (`grid-template-columns: repeat(3, 1fr)`) 3. 可选项: 北京、上海、深圳、成都、杭州、宁波、温州、绍兴 4. 当前城市（北京）高亮显示 `.active` |
| **验证方式** | 检查 `city-grid` 包含8个城市按钮，当前城市有 `.active` class |
| **严重级** | **P1** |

---

### TC-U009: 本周统计-最常吃TOP3展示

| 项目 | 内容 |
|------|------|
| **编号** | TC-U009 |
| **名称** | TOP3最常吃餐厅展示 |
| **前置条件** | `state.lunchHistory` 含多次记录 |
| **操作步骤** | 查看统计卡片的TOP3区域 |
| **预期结果** | 1. `topRestaurants` 计算后按频次降序 2. 仅展示TOP3 3. 格式: `{emoji} {name} ×{count}` 4. 最多3个 `.top-tag` |
| **验证方式** | `topRestaurants.slice(0, 3)` 验证长度为3以内 |
| **严重级** | **P2** |

---

## 7. 持久化验证

### TC-P001: 收藏数据持久化到localStorage

| 项目 | 内容 |
|------|------|
| **编号** | TC-P001 |
| **名称** | 收藏餐厅持久化到localStorage |
| **前置条件** | 收藏一家餐厅 |
| **操作步骤** | 1. 在附近Tab收藏 2. 刷新页面 |
| **预期结果** | 1. `localStorage.getItem(STORAGE_KEYS.FAVORITE_RESTAURANTS)` 返回包含新收藏餐厅的数组 2. 页面恢复后 `favorites` 从localStorage读取，收藏状态保留 3. 转圈Tab仍能看到该收藏 |
| **验证方式** | 刷新页面后 localStorage 数据未丢失 |
| **严重级** | **P0** |

---

### TC-P002: 取消收藏后localStorage同步

| 项目 | 内容 |
|------|------|
| **编号** | TC-P002 |
| **名称** | 取消收藏后localStorage同步更新 |
| **前置条件** | 已收藏餐厅的localStorage |
| **操作步骤** | 1. 取消收藏 2. 检查localStorage |
| **预期结果** | `safeSetJSON` 被调用，localStorage中该餐厅被移除 |
| **验证方式** | `JSON.parse(localStorage.favorites).length` 减少1 |
| **严重级** | **P0** |

---

### TC-P003: 午餐记录持久化到Supabase

| 项目 | 内容 |
|------|------|
| **编号** | TC-P003 |
| **名称** | 午餐记录持久化到Supabase |
| **前置条件** | 用户已登录 |
| **操作步骤** | 1. 完成一次转圈 2. 关闭弹窗 3. 重新访问 Lunch 页面 4. 检查 `state.lunchHistory` |
| **预期结果** | 1. `db.addLunchRecord` POST 成功 2. `state.lunchHistory.unshift(result.data)` 添加到响应式状态 3. 页面重新加载时 `loadAllData()` 调用 `db.getLunchHistory()` 获取远程数据 4. 统计卡片展示实际记录数 |
| **验证方式** | 1. 网络面板确认 `/lunch_history` POST 200 2. 刷新后统计数字不变 |
| **严重级** | **P0** |

---

### TC-P004: getLunchHistory排序验证

| 项目 | 内容 |
|------|------|
| **编号** | TC-P004 |
| **名称** | 午餐历史按时间倒序排列 |
| **前置条件** | Supabase中有多条lunch_history记录 |
| **操作步骤** | 1. 调用 `db.getLunchHistory()` |
| **预期结果** | SQL 查询包含 `order=selected_at.desc`，返回的记录按时间从新到旧 |
| **验证方式** | 网络请求URL含 `order=selected_at.desc` |
| **严重级** | **P1** |

---

## 8. 边界条件测试

### TC-B001: 无定位权限但可正常使用

| 项目 | 内容 |
|------|------|
| **编号** | TC-B001 |
| **名称** | 无定位权限时的完整体验 |
| **前置条件** | 彻底拒绝定位 |
| **操作步骤** | 1. 访问 Lunch 2. 收藏2家餐厅 3. 转圈选餐厅 |
| **预期结果** | 1. 定位降级到 ip-api 或 fallback 2. 附近列表基于城市名展示（`place/text` 分支） 3. 转圈正常，收藏正常 4. 全流程无阻断 |
| **验证方式** | 核心流程走通 |
| **严重级** | **P1** |

---

### TC-B002: 空餐厅列表

| 项目 | 内容 |
|------|------|
| **编号** | TC-B002 |
| **名称** | POI返回空结果 |
| **前置条件** | 高德API返回 `{status: '1', pois: []}` |
| **操作步骤** | 1. 访问 /lunch |
| **预期结果** | 1. `restaurants.value = []` 2. `.poi-empty` 展示 "没有找到相关餐厅" 3. 不崩溃，不阻塞 |
| **验证方式** | 空态正常渲染 |
| **严重级** | **P1** |

---

### TC-B003: 只有一个收藏，无法转圈

| 项目 | 内容 |
|------|------|
| **编号** | TC-B003 |
| **名称** | 收藏不足2家时不能转 |
| **前置条件** | favorites.length = 1 |
| **操作步骤** | 1. 切换到转圈Tab |
| **预期结果** | 1. 提示 "至少需要 2 家餐厅才能转哟 🥟" 2. 转盘不可操作（LunchWheel组件行为） |
| **验证方式** | 文案展示，转盘无响应 |
| **严重级** | **P1** |

---

### TC-B004: 全部收藏被排除后转圈

| 项目 | 内容 |
|------|------|
| **编号** | TC-B004 |
| **名称** | 全部收藏被排除后的边界 |
| **前置条件** | favorites有2家，连续转2次并点击「排除当前」 |
| **操作步骤** | 1. 第一次转 → 排除 → 第二次转 → 排除 |
| **预期结果** | 1. `favoritesList` 过滤后为空 2. `spinWheel(excludedIds)` 返回 `null`（candidates.length=0） 3. 转圈无结果弹窗（取决于LunchWheel的winner=null处理） |
| **验证方式** | `spinWheel` 返回 null 不抛错 |
| **严重级** | **P1** |

---

### TC-B005: 快速连续转圈

| 项目 | 内容 |
|------|------|
| **编号** | TC-B005 |
| **名称** | 快速连续点击转圈按钮 |
| **前置条件** | favorites >= 2 |
| **操作步骤** | 1. 连续快速点击转盘中心多次 |
| **预期结果** | 1. `onSpinStart` 重置状态 2. 仅最后一次点击触发实际 spin 3. 不产生重复记录 |
| **验证方式** | `addLunchRecord` 仅调用1次 |
| **严重级** | **P2** |

---

### TC-B006: 城市列表遍历

| 项目 | 内容 |
|------|------|
| **编号** | TC-B006 |
| **名称** | 验证所有可用城市 |
| **前置条件** | 弹窗打开 |
| **操作步骤** | 遍历 `['北京', '上海', '深圳', '成都', '杭州', '宁波', '温州', '绍兴']` 每个城市 |
| **预期结果** | 每个城市选择后：1. 弹窗关闭 2. `locating=true` → `false` 3. Toast 提示 "已切换到 {city}" 4. high德搜索执行 |
| **验证方式** | 每个城市均有对应API调用 |
| **严重级** | **P2** |

---

### TC-B007: 在结果弹窗打开时切换Tab

| 项目 | 内容 |
|------|------|
| **编号** | TC-B007 |
| **名称** | 弹窗打开时切换到「附近」Tab |
| **前置条件** | 转圈结果弹窗打开 |
| **操作步骤** | 切换到「附近」Tab |
| **预期结果** | 弹窗属于 `<Teleport to="body">`，不受Tab切换影响，仍然可见 |
| **验证方式** | 弹窗仍悬浮在页面 |
| **严重级** | **P2** |

---

## 9. 高德 API 调用参数和返回解析

### TC-A001: 周边搜索API参数（有坐标时）

| 项目 | 内容 |
|------|------|
| **编号** | TC-A001 |
| **名称** | 高德POI周边搜索API参数验证 |
| **前置条件** | `userLat.value=39.9, userLon.value=116.4` |
| **操作步骤** | 监控 `searchNearby()` 网络请求 |
| **预期结果** | URL: `https://restapi.amap.com/v3/place/around?key={AMAP_KEY}&location=116.4,39.9&keywords=餐厅&radius=3000&offset=20&page=1&extensions=all` |
| **验证方式** | 网络面板检查URL参数 `location={lon},{lat}`（注意：经度在前！） |
| **严重级** | **P0** |

---

### TC-A002: 城市搜索API参数（无坐标时）

| 项目 | 内容 |
|------|------|
| **编号** | TC-A002 |
| **名称** | 高德POI城市搜索API参数验证 |
| **前置条件** | `userLat=0, userLon=0, currentCity='北京'` |
| **操作步骤** | 触发 `searchNearby()` |
| **预期结果** | URL: `https://restapi.amap.com/v3/place/text?key={AMAP_KEY}&keywords=餐厅&city=北京&offset=20&page=1&extensions=all` |
| **验证方式** | URL为 `place/text` 分支，含 `city=` 参数 |
| **严重级** | **P0** |

---

### TC-A003: POI返回数据解析 - 完整字段

| 项目 | 内容 |
|------|------|
| **编号** | TC-A003 |
| **名称** | POI返回数据完整解析 |
| **前置条件** | 高德返回标准POI JSON |
| **操作步骤** | Mock 返回数据验证解析逻辑 |
| **预期结果** | 解析规则: 1. `p.id || p.name` → id 2. `p.name` → name 3. `mapCategoryToEmoji(p.type)` → emoji 4. `p.location.split(',')[1]` → lat, `[0]` → lon 5. `haversineDistance` + `formatDistance` → distance文本 6. `p.rating ? parseFloat(p.rating) : 4.0` → rating 7. `p.type.split(';').slice(0,3)` → tags 数组 8. `p.address \|\| ''` → address |
| **验证方式** | 逐一验证各字段映射 |
| **严重级** | **P0** |

---

### TC-A004: 高德API返回非法location格式

| 项目 | 内容 |
|------|------|
| **编号** | TC-A004 |
| **名称** | POI location字段异常 |
| **前置条件** | `p.location = ""` 或 `null` |
| **操作步骤** | Mock数据验证 |
| **预期结果** | 1. `lat = parseFloat(undefined → 0)` → 0 2. `lon = 0` 3. `distance = '—'` (无坐标计算距离) |
| **验证方式** | 不抛错，优雅降级 |
| **严重级** | **P1** |

---

### TC-A005: 高德API Key为空时不发请求

| 项目 | 内容 |
|------|------|
| **编号** | TC-A005 |
| **名称** | AMAP_KEY为空时阻止API调用 |
| **前置条件** | `import.meta.env.VITE_AMAP_KEY = ""` |
| **操作步骤** | 访问页面 |
| **预期结果** | `if (!AMAP_KEY)` → `console.warn` → return `[]`。不发网络请求 |
| **验证方式** | 网络面板无 amap.com 请求 |
| **严重级** | **P0** |

---

### TC-A006: 高德IP定位API参数和解析

| 项目 | 内容 |
|------|------|
| **编号** | TC-A006 |
| **名称** | IP定位API参数和返回解析 |
| **前置条件** | 调用 `getLocationByIP()` |
| **操作步骤** | 1. 监控请求URL 2. 验证返回解析 |
| **预期结果** | 1. URL: `https://restapi.amap.com/v3/ip?key={AMAP_KEY}` 2. 解析 `data.status === '1'` 3. `data.rectangle` 分割为 `;` 再分割 `,` 计算中心点 4. `city` 去除尾"市"字 |
| **验证方式** | Mock返回验证 lat/lon 计算逻辑 |
| **严重级** | **P1** |

---

### TC-A007: 逆地理编码API调用

| 项目 | 内容 |
|------|------|
| **编号** | TC-A007 |
| **名称** | 逆地理编码API参数和解析 |
| **前置条件** | GPS定位成功后调用 |
| **操作步骤** | 监控 `reverseGeocode(lat, lon)` |
| **预期结果** | 1. URL: `https://restapi.amap.com/v3/geocode/regeo?key={AMAP_KEY}&location={lon},{lat}&extensions=base` 2. 解析 `data.regeocode.addressComponent` 3. `city` 取 `addr.city || addr.province`，去除尾"市" |
| **验证方式** | 验证URL中 location 格式 `{lon},{lat}` |
| **严重级** | **P1** |

---

## 10. 跨模块交互测试

### TC-X001: useRestaurants.favorites 与 Lunch.vue 同步

| 项目 | 内容 |
|------|------|
| **编号** | TC-X001 |
| **名称** | 收藏状态跨组件响应式同步 |
| **前置条件** | LunchWheel组件和Lunch.vue同时存在 |
| **操作步骤** | 1. 在附近Tab收藏 2. 转盘实时显示新收藏 |
| **预期结果** | `favorites` 是 `ref()` 响应式对象，LunchWheel 接收 prop 自动更新扇区 |
| **验证方式** | 收藏后立即切换转圈Tab，转盘扇区数+1 |
| **严重级** | **P0** |

---

### TC-X002: dataStore.lunchHistory统计联动

| 项目 | 内容 |
|------|------|
| **编号** | TC-X002 |
| **名称** | lunchHistory 变化驱动统计卡片更新 |
| **前置条件** | `state.lunchHistory` 已有数据 |
| **操作步骤** | 1. 转圈一次 2. 观察统计卡片 |
| **预期结果** | `addLunchRecord` 成功后 `state.lunchHistory.unshift(result.data)`，触发 computed 更新：`weekSpinCount`, `todaySpinCount`, `totalSpinCount`, `topRestaurants` 全部重新计算 |
| **验证方式** | 数字立即变化 |
| **严重级** | **P0** |

---

### TC-X003: CloseResult后弹窗关闭与excludedIds重置

| 项目 | 内容 |
|------|------|
| **编号** | TC-X003 |
| **名称** | 关闭弹窗时 excludedIds 重置 |
| **前置条件** | excludedIds 已被 push 一个餐厅ID |
| **操作步骤** | 1. 点击遮罩区域 `@click.self="closeResult"` |
| **预期结果** | 1. `showResult.value = false` 2. `excludedIds.value = []` 3. 下次转圈不包含历史排除记录 |
| **验证方式** | 验证 excludedIds 数组状态 |
| **严重级** | **P1** |

---

## 11. 性能与稳定性

### TC-S001: 定位超时保护

| 项目 | 内容 |
|------|------|
| **编号** | TC-S001 |
| **名称** | GPS定位10秒超时保护 |
| **前置条件** | useLocation 配置 `timeout: 10000` |
| **操作步骤** | 模拟GPS定位超过10秒 |
| **预期结果** | 1. `AbortController` 触发 `AbortError` 2. `console.warn` 打印 GPS 定位失败 3. 降级到下一级定位策略 |
| **验证方式** | 超时后GPS请求被abort |
| **严重级** | **P1** |

---

### TC-S002: MaximumAge缓存

| 项目 | 内容 |
|------|------|
| **编号** | TC-S002 |
| **名称** | GPS定位5分钟缓存(maximumAge: 300000) |
| **前置条件** | 已授权GPS定位 |
| **操作步骤** | 访问Lunch页面后5分钟内再次访问 |
| **预期结果** | 使用缓存坐标，不重新触发授权弹框 |
| **验证方式** | 不弹出位置授权提示 |
| **严重级** | **P2** |

---

## 12. 测试用例汇总

| 编号 | 名称 | 严重级 | 类别 |
|------|------|--------|------|
| TC-L001 | 页面加载自动定位并搜索 | P0 | 正向流程 |
| TC-L002 | 转圈选餐厅完整流程 | P0 | 正向流程 |
| TC-L003 | 确认结果关闭弹窗 | P1 | 正向流程 |
| TC-L004 | 再转一次（排除当前） | P1 | 正向流程 |
| TC-L005 | 收藏附近餐厅 | P0 | 正向流程 |
| TC-L006 | 取消收藏（附近Tab） | P1 | 正向流程 |
| TC-L007 | 取消收藏（转圈Tab） | P1 | 正向流程 |
| TC-L008 | 切换城市更新列表 | P1 | 正向流程 |
| TC-L009 | 分类筛选功能 | P1 | 正向流程 |
| TC-L010 | 搜索关键词过滤 | P1 | 正向流程 |
| TC-L011 | 统计卡片数据更新 | P1 | 正向流程 |
| TC-L012 | 收藏列表实时同步转盘 | P0 | 正向流程 |
| TC-L101 | 无定位权限fallback | P0 | 反向流程 |
| TC-L102 | 高德API Key未配置 | P0 | 反向流程 |
| TC-L103 | POI搜索API网络异常 | P0 | 反向流程 |
| TC-L104 | 未登录时转圈 | P1 | 反向流程 |
| TC-L105 | 高德API返回status≠1 | P1 | 反向流程 |
| TC-L106 | 设备不支持Geolocation | P1 | 反向流程 |
| TC-L107 | GPS定位超时 | P1 | 反向流程 |
| TC-L108 | 全定位策略失败fallback | P1 | 反向流程 |
| TC-T109 | 城市切换搜索失败 | P2 | 反向流程 |
| TC-D001 | selected_at→date映射 | P0 | 数据映射 |
| TC-D002 | selected_at为空时映射 | P1 | 数据映射 |
| TC-D003 | restaurant_name→restaurant映射 | P0 | 数据映射 |
| TC-D004 | restaurant_name为空时映射 | P1 | 数据映射 |
| TC-D005 | addLunchRecord入参映射 | P0 | 数据映射 |
| TC-D006 | onSpinEnd调用参数 | P0 | 数据映射 |
| TC-U001 | POI卡片完整渲染 | P0 | UI渲染 |
| TC-U002 | 距离格式化展示 | P1 | UI渲染 |
| TC-U003 | 评分展示 | P1 | UI渲染 |
| TC-U004 | 分类标签选中状态 | P1 | UI渲染 |
| TC-U005 | 无搜索结果空态 | P1 | UI渲染 |
| TC-U006 | 转圈Tab不足2家提示 | P1 | UI渲染 |
| TC-U007 | 结果弹窗渲染 | P0 | UI渲染 |
| TC-U008 | 城市选择弹窗渲染 | P1 | UI渲染 |
| TC-U009 | TOP3最常吃展示 | P2 | UI渲染 |
| TC-P001 | 收藏持久化localStorage | P0 | 持久化 |
| TC-P002 | 取消收藏同步更新 | P0 | 持久化 |
| TC-P003 | 午餐记录持久化Supabase | P0 | 持久化 |
| TC-P004 | getLunchHistory排序 | P1 | 持久化 |
| TC-B001 | 无定位权限完整体验 | P1 | 边界条件 |
| TC-B002 | POI返回空结果 | P1 | 边界条件 |
| TC-B003 | 收藏不足无法转圈 | P1 | 边界条件 |
| TC-B004 | 全部收藏被排除 | P1 | 边界条件 |
| TC-B005 | 快速连续转圈 | P2 | 边界条件 |
| TC-B006 | 所有可用城市遍历 | P2 | 边界条件 |
| TC-B007 | 弹窗打开时切换Tab | P2 | 边界条件 |
| TC-A001 | 周边搜索API参数 | P0 | 高德API |
| TC-A002 | 城市搜索API参数 | P0 | 高德API |
| TC-A003 | POI返回数据完整解析 | P0 | 高德API |
| TC-A004 | POI location字段异常 | P1 | 高德API |
| TC-A005 | AMAP_KEY为空不发请求 | P0 | 高德API |
| TC-A006 | IP定位API参数和解析 | P1 | 高德API |
| TC-A007 | 逆地理编码API | P1 | 高德API |
| TC-X001 | 收藏状态跨组件响应式同步 | P0 | 跨模块 |
| TC-X002 | lunchHistory统计联动 | P0 | 跨模块 |
| TC-X003 | closeResult后excludedIds重置 | P1 | 跨模块 |
| TC-S001 | GPS定位10秒超时保护 | P1 | 性能稳定性 |
| TC-S002 | GPS定位5分钟缓存 | P2 | 性能稳定性 |

**统计**: P0 = 18, P1 = 32, P2 = 8, 总计 58 个测试用例

---

## 13. 测试建议

### 测试环境准备
1. 准备有效的 `VITE_AMAP_KEY` 环境变量
2. 准备两个测试账户（已登录 + 未登录）
3. 准备 Mock 工具拦截高德API和 Supabase 请求

### 执行优先级
- **第一轮**：全部 P0 用例，验证核心流程可运行
- **第二轮**：P1 用例，验证异常场景有合理降级
- **第三轮**：P2 用例 + 兼容性（移动端/平板）

### 特别注意的高风险点
1. `location={lon},{lat}` — 经度在前，纬度在后，这是比较容易出bug的地方
2. `selected_at.slice(0, 10)` — 取前10位即 `YYYY-MM-DD` 格式，但需确认时区处理
3. `spinWheel` 中 `candidates[0]` — 如果全部排除后 candidates 为空数组，会返回 `undefined`
4. `removeEventListener` / `AbortController` 超时 — 防止内存泄漏
