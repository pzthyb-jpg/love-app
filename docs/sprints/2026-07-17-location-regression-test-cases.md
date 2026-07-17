# 位置共享功能回归测试案例

> **所属模块**: `/src/views/LocationShare.vue`、`/src/composables/useLocationShare.js`、`/src/composables/useLocation.js`、`/src/views/LocationManage.vue`
> **编写日期**: 2026-07-17
> **版本**: v1.0
> **测试范围**: 正向流程、反向流程、数据字段映射、UI 渲染、持久化、边界条件、高德 API 调用、CSP 合规性

---

## 一、测试环境前置条件

| 项 | 说明 |
|---|---|
| 认证状态 | 已登录（`currentUser.value.id` 存在） |
| 数据库 | Supabase 实例运行正常，`location_invites`、`location_shares`、`location_blacklist` 表已迁移 |
| 高德 API | `VITE_AMAP_KEY` 配置有效，余额充足 |
| 浏览器 | 支持 Geolocation API（Chrome/Safari） |
| 网络 | 正常或可按需模拟断网/超时 |

---

## 二、正向流程测试（P0）

### TC-001 | 地图正常加载

| 项 | 内容 |
|---|---|
| **编号** | TC-001 |
| **名称** | 地图 JSAPI 加载与初始化渲染 |
| **前置条件** | 进入 `/location-share` 页面，CS​P 允许 `webapi.amap.com` 和 `vdata.amap.com` |
| **操作步骤** | 1. 路由跳转到位置共享页面 2. 等待页面 `onMounted` 回调完成 3. 检查 `<div id="location-map">` 是否包含子元素 |
| **预期结果** | `AMap.Map` 实例化成功，地图容器出现 `.amap-maps` 子 div，地图瓦片渲染可见；`mapInstance` 不为 `null` |
| **严重级** | **P0** |
| **验证方式** | DOM 检查：`document.querySelector('#location-map .amap-maps') !== null`；视觉确认：地图瓦片已加载 |

---

### TC-002 | 获取当前位置（GPS 成功）

| 项 | 内容 |
|---|---|
| **编号** | TC-002 |
| **名称** | 浏览器 GPS 定位成功 |
| **前置条件** | 设备/模拟器 GPS 可用；浏览器已授权位置权限 |
| **操作步骤** | 1. 首次进入页面，触发 `initMap()` → `myGetLocation()` → `getGPSLocation()` 2. 授权弹框点击"允许" 3. 观察地图中心和自身标记 |
| **预期结果** | 1. `navigator.geolocation.getCurrentPosition` 回调 `position` 2. `myLat`/`myLng` 更新为 GPS 坐标（非 0） 3. `selfMarker` 出现在地图上 4. 地图 `center` 设为当前位置 5. `showPermissionTip` 为 `false` |
| **严重级** | **P0** |
| **验证方式** | `myLat.value !== 0 && myLng.value !== 0`；地图中心 `mapInstance.getCenter()` 与 GPS 一致；视觉确认蓝色标记（mark_b.png）可见 |

---

### TC-003 | GPS 失败降级 ip-api.com

| 项 | 内容 |
|---|---|
| **编号** | TC-003 |
| **名称** | GPS 定位失败 → 降级 IP 定位（ip-api） |
| **前置条件** | 浏览器拒绝位置权限或 GPS 不可用；ip-api.com 可达 |
| **操作步骤** | 1. 进入页面时点击"拒绝"位置授权 2. 等待 `getGPSLocation()` 返回 `null` 3. 自动进入 `getLocationByIpApi()` |
| **预期结果** | 1. `getGPSLocation()` 回调 err，返回 `null` 2. `getLocationByIpApi()` 请求 `https://ip-api.com/json/?lang=zh-CN` 3. 返回 `status === 'success'` 4. `myLat`/`myLng` 更新为 IP 纬度经度 5. `showPermissionTip` 为 `false`（因为 ip 定位成功） |
| **严重级** | **P0** |
| **验证方式** | Network 面板可见 `ip-api.com` 请求，`status: success`；Maps 中心切换至 IP 城市 |

---

### TC-004 | ip-api 失败降级高德 IP

| 项 | 内容 |
|---|---|
| **编号** | TC-004 |
| **名称** | ip-api 失败 → 降级高德 IP 定位 |
| **前置条件** | GPS 不可用；ip-api.com 不可达或返回 `status !== 'success'`；`VITE_AMAP_KEY` 有效 |
| **操作步骤** | 1. Mock `ip-api` 请求为失败（status: fail 或网络错误） 2. 观察自动降级至 `getLocationByIP()` |
| **预期结果** | 1. `getLocationByIpApi()` 返回 `null` 2. `getLocationByIP()` 请求 `https://restapi.amap.com/v3/ip?key=...` 3. 返回 `status === '1'` 4. `rectangle` 解析为 `lat`/`lon` 平均值 |
| **严重级** | **P1** |
| **验证方式** | Network 面板可见 `restapi.amap.com/v3/ip` 请求；返回 `status: 1`；地图中心切换至高德 IP 城市 |

---

### TC-005 | 全链路 fallback 至北京

| 项 | 内容 |
|---|---|
| **编号** | TC-005 |
| **名称** | 所有定位方式均失败 |
| **前置条件** | GPS 拒绝、ip-api 失败、高德 IP 失败（或 AMAP_KEY 为空） |
| **操作步骤** | 1. Mock 全部定位来源返回 null 2. 进入页面 |
| **预期结果** | 1. `myLat = 0`, `myLng = 0` 2. `showPermissionTip = true`（权限提示条显示） 3. 地图 fallback 中心设为 `[116.3974, 39.9088]`（北京天安门） 4. 页面仍可渲染不崩溃 |
| **严重级** | **P1** |
| **验证方式** | 视觉确认权限提示条出现；地图以北京为中心；Console 无未捕获异常 |

---

### TC-006 | 搜索用户（关键词 ≥ 2 字符）

| 项 | 内容 |
|---|---|
| **编号** | TC-006 |
| **名称** | 输入用户名搜索（正常返回结果） |
| **前置条件** | `app_users` 表中存在匹配用户；搜索者已登录 |
| **操作步骤** | 1. 点击搜索输入框 2. 输入至少 2 个字符（如"小皮"） 3. 等待防抖 300ms |
| **预期结果** | 1. `doSearch()` 触发 Supabase 请求：`/app_users?username=ilike.*小皮*&id=neq.uid&select=id,username,display_name,avatar&limit=20` 2. 返回用户列表（自动过滤黑名单用户） 3. 搜索结果下拉展示：头像 emoji 👤、`display_name`（或 `username`）、`@username` 4. `isSearching` 短暂为 `true` 后变回 `false` |
| **严重级** | **P0** |
| **验证方式** | Network 面板检查 `ilike` 查询语句；`searchResults.value.length > 0`；DOM 检查 `.search-item` 数量 |

---

### TC-007 | 搜索 < 2 字符不请求

| 项 | 内容 |
|---|---|
| **编号** | TC-007 |
| **名称** | 搜索关键词过短不触发请求 |
| **前置条件** | 已登录 |
| **操作步骤** | 1. 输入单个字符（如"a"） 2. 不继续输入，等待 500ms |
| **预期结果** | `doSearch()` 在 `keyword.length < 2` 时提前返回，`searchResults = []`，不发送 Supabase 请求 |
| **严重级** | **P1** |
| **验证方式** | Network 面板无 `/app_users` 请求发出 |

---

### TC-008 | 选择用户发送邀请

| 项 | 内容 |
|---|---|
| **编号** | TC-008 |
| **名称** | 搜索到用户后发送位置共享邀请 |
| **前置条件** | 搜索下拉中显示目标用户 |
| **操作步骤** | 1. 点击某个搜索结果项 2. 弹出确认弹窗（`showInviteConfirm = true`） 3. 弹窗显示用户名和"对方将能看到你的实时位置" 4. 点击"确认发送" |
| **预期结果** | 1. `selectedUser` 被赋值 2. Post 请求：`/location_invites` body `{sender_id: uid, receiver_id: selectedUser.id, status: 'pending'}` 3. 成功 Toast "邀请已发送 💕" 4. 弹窗关闭，`selectedUser = null` 5. 搜索框清空，`showResults = false` |
| **严重级** | **P0** |
| **验证方式** | Network 面板 POST `/location_invites` 200；数据库 `location_invites` 表新增 `status=pending` 记录；Toast 出现 |

---

### TC-009 | 接受位置共享邀请

| 项 | 内容 |
|---|---|
| **编号** | TC-009 |
| **名称** | 收到邀请 → 点击接受 |
| **前置条件** | `location_invites` 表中存在 `receiver_id=uid` 且 `status=pending` 的记录；邀请者 `app_users` 数据存在 |
| **操作步骤** | 1. 点击右上角铃铛 🔔 2. 弹窗展示邀请列表（头像、邀请者名、时间） 3. 点击"接受"按钮 |
| **预期结果** | 1. GET `/location_invites?receiver_id=eq.uid&status=eq.pending&select=*&order=created_at.desc` 2. GET `/app_users?id=eq.sender_id&select=username,display_name,avatar` 丰富每条 invite 3. 点击"接受" → PATCH `/location_invites?id=eq.{invite.id}` body `{status:'accepted', responded_at: ISO}` 4. Toast "已接受邀请 💖" 5. 重新调用 `loadPendingInvites()` 和 `loadActiveShares()` |
| **严重级** | **P0** |
| **验证方式** | Network 面板 PATCH 请求 status `accepted`；数据库 invite 记录 status 变更；`activeShares` 列表更新；底部抽屉从空状态变为显示共享卡片 |

---

### TC-010 | 拒绝位置共享邀请

| 项 | 内容 |
|---|---|
| **编号** | TC-010 |
| **名称** | 收到邀请 → 点击拒绝 |
| **前置条件** | 有 pending 邀请 |
| **操作步骤** | 1. 点击铃铛 2. 在邀请列表中点击"拒绝" |
| **预期结果** | 1. PATCH `/location_invites?id=eq.{id}` body `{status:'rejected', responded_at: ISO}` 2. Toast "已拒绝" 3. `loadPendingInvites()` 刷新后该邀请从列表移除 |
| **严重级** | **P0** |
| **验证方式** | Network 面板 PATCH 请求 status `rejected`；数据库记录 status 变更；弹窗中该邀请项消失 |

---

### TC-011 | 查看对方位置（共享激活后）

| 项 | 内容 |
|---|---|
| **编号** | TC-011 |
| **名称** | 接受邀请后查看对方实时位置 |
| **前置条件** | 双方已互相接受共享；对方 `location_shares` 表有位置记录 |
| **操作步骤** | 1. 接受共享邀请后，`loadActiveShares()` 加载 2. 遍历每个 share，调用 `getPartnerLocation(share.id, partnerId)` 3. 观察地图标记和底部卡片 |
| **预期结果** | 1. GET `/location_shares?relationship_id=eq.{id}&user_id=eq.{partnerId}&order=created_at.desc&limit=1` 2. 返回对方最新 `latitude`、`longitude`、`created_at` 3. 地图添加红色标记（mark_r.png, 36x36） 4. 底部卡片显示：对方名、距离（km/m）、时间、地址（逆地理编码后） 5. 若 `Date.now() - created_at < 5min`，显示绿色在线圆点 |
| **严重级** | **P0** |
| **验证方式** | 地图出现红色标记；底部卡片 `.card-name`、`.card-meta`、`.card-address` 正确渲染；距离计算 `calcDistance` 返回合理值 |

---

### TC-012 | 地图标记点击展示信息窗体

| 项 | 内容 |
|---|---|
| **编号** | TC-012 |
| **名称** | 点击对方标记弹出 InfoWindow |
| **前置条件** | 地图上有对方红色标记 |
| **操作步骤** | 1. 点击红色标记 |
| **预期结果** | 1. `AMap.InfoWindow` 打开 2. 内容包含：对方名（`getPartnerName`）、时间（`formatTime`）、距离（`formatDistance`） 3. InfoWindow 偏移 `Pixel(0, -40)` |
| **严重级** | **P1** |
| **验证方式** | 视觉确认 InfoWindow 弹出；DOM 检查 `.amap-info-content` 包含预期文本 |

---

### TC-013 | 关闭位置共享

| 项 | 内容 |
|---|---|
| **编号** | TC-013 |
| **名称** | 关闭与某人的位置共享 |
| **前置条件** | 存在活跃共享关系 |
| **操作步骤** | 1. 在底部卡片点击"关闭共享"按钮 2. 确认弹窗显示对方名 3. 点击"确认关闭" |
| **预期结果** | 1. `closingShare` 赋值 2. PATCH `/location_invites?id=eq.{id}` body `{status:'closed', closed_at: ISO, closed_reason:'user_initiated'}` 3. Toast "已关闭共享" 4. `loadActiveShares()` 刷新 5. `removePartnerMarker(share.id)` 移除地图标记 |
| **严重级** | **P0** |
| **验证方式** | Network 面板 PATCH status `closed`；数据库记录 `closed_reason='user_initiated'`；地图红色标记消失；底部卡片列表更新 |

---

### TC-014 | 导航跳转高德

| 项 | 内容 |
|---|---|
| **编号** | TC-014 |
| **名称** | 点击导航按钮跳转高德地图 |
| **前置条件** | 对方有位置数据 |
| **操作步骤** | 1. 点击卡片右侧 🧭 按钮 |
| **预期结果** | 1. `window.open` 调用 2. URL = `https://uri.amap.com/navigation?to={lng},{lat},{name}&mode=car&src=love-app` 3. 新标签页打开高德导航 |
| **严重级** | **P1** |
| **验证方式** | 拦截 `window.open` 调用，检查 URL 格式；或实际点击后确认新标签页 URL |

---

### TC-015 | 定位按钮回到自身

| 项 | 内容 |
|---|---|
| **编号** | TC-015 |
| **名称** | 点击定位按钮回到当前位置 |
| **前置条件** | 地图已加载，`myLat`/`myLng` 非 0 |
| **操作步骤** | 1. 拖动/缩放地图偏离中心 2. 点击右下角 📍 按钮 |
| **预期结果** | 1. `mapInstance.setCenter([myLng, myLat])` 2. `mapInstance.setZoom(15)` 3. 地图平滑回到自身位置 |
| **严重级** | **P1** |
| **验证方式** | 视觉确认地图回到蓝色标记位置；`mapInstance.getCenter()` 与 `[myLng, myLat]` 一致 |

---

### TC-016 | 底部抽屉展开/收起

| 项 | 内容 |
|---|------|
| **编号** | TC-016 |
| **名称** | 共享列表抽屉展开与收起 |
| **前置条件** | 存在活跃共享 |
| **操作步骤** | 1. 点击抽屉顶部把手 2. 再次点击收起 |
| **预期结果** | 1. 展开：`drawerExpanded = true`，`drawerHeight = min(vh*0.5, 400)` 2. 收起：`drawerExpanded = false`，`drawerHeight = 80` 3. 300ms 后 `adjustMapHeight()` 调整地图高度：`mapHeight = max(vh - 60 - drawerH - 20, 200)` |
| **严重级** | **P1** |
| **验证方式** | DOM 检查 `.bottom-drawer` 高度变化；`mapHeight` 值正确计算；地图 `setFitView` 被调用 |

---

### TC-017 | 铃铛角标计数

| 项 | 内容 |
|---|---|
| **编号** | TC-017 |
| **名称** | 待处理邀请角标显示 |
| **前置条件** | 有 N 条 pending 邀请 |
| **操作步骤** | 1. 进入页面，`loadPendingInvites()` 执行 2. 观察铃铛右上角 |
| **预期结果** | 1. `pendingCount = N` 2. 红色角标显示数字 N 3. 若 `N = 0`，角标隐藏（`v-if="pendingCount > 0"`） |
| **严重级** | **P1** |
| **验证方式** | DOM 检查 `.bell-badge` 文本为 N；`N=0` 时 `.bell-badge` 不存在 |

---

## 三、反向流程测试（P1）

### TC-101 | 无 GPS 权限（用户拒绝）

| 项 | 内容 |
|---|---|
| **编号** | TC-101 |
| **名称** | 用户拒绝浏览器位置授权 |
| **前置条件** | 浏览器 Geolocation API 可用 |
| **操作步骤** | 1. 进入页面 2. 授权弹框点击"拒绝" |
| **预期结果** | 1. `getCurrentPosition` 回调 err，`err.code === 1`（PERMISSION_DENIED） 2. `getGPSLocation()` 返回 `null` 3. 自动降级至 ip-api 4. 若 ip-api 也失败，`showPermissionTip = true` 5. 提示条文案"📍 请开启位置权限以使用位置共享" |
| **严重级** | **P1** |
| **验证方式** | Console 输出 `'GPS 定位失败: ...'`；视觉确认黄色提示条出现；降级流程正常执行 |

---

### TC-102 | 网络异常（Supabase 不可达）

| 项 | 内容 |
|---|---|
| **编号** | TC-102 |
| **名称** | Supabase 服务不可达 |
| **前置条件** | 模拟 Supabase 域名无法访问（DNS 失败或超时） |
| **操作步骤** | 1. 断开网络或 Mock Supabase URL 为无效域名 2. 进入页面 |
| **预期结果** | 1. `supabaseFetch` 抛出网络错误 2. `getActiveShares()` 返回 `{ data: [] }`（catch 兜底） 3. `loadPendingInvites()` 返回 `{ data: [] }` 4. 页面不崩溃，地图仍可加载（高德走独立 CDN） 5. 搜索时 Toast "搜索失败" |
| **严重级** | **P0** |
| **验证方式** | 页面无白屏；Console 无未捕获异常；Toast 正确提示错误 |

---

### TC-103 | 搜索无结果

| 项 | 内容 |
|---|---|
| **编号** | TC-103 |
| **名称** | 搜索关键词无匹配用户 |
| **前置条件** | `app_users` 表中无匹配用户 |
| **操作步骤** | 1. 输入 "zzzznotexist" 2. 等待防抖 |
| **预期结果** | 1. Supabase 返回空数组 2. `searchResults = []` 3. `showResults = true` 且 `searchKeyword.length >= 2` 且 `!isSearching` 4. 显示"未找到用户"空状态 |
| **严重级** | **P1** |
| **验证方式** | DOM 检查 `.search-empty` 文本为"未找到用户" |

---

### TC-104 | 搜索用户不存在（特殊字符/SQL 注入）

| 项 | 内容 |
|---|---|
| **编号** | TC-104 |
| **名称** | 搜索含特殊字符或 SQL 注入 |
| **前置条件** | 已登录 |
| **操作步骤** | 1. 输入 `'; DROP TABLE--` 2. 输入 `%` 或 `_` 3. 等待防抖 |
| **预期结果** | 1. `encodeURIComponent` 对关键词编码 2. Supabase PostgREST 安全处理 3. 不抛出异常，返回空结果或正常匹配 |
| **严重级** | **P1** |
| **验证方式** | Network 面板检查 URL 编码正确；数据库表未被破坏 |

---

### TC-105 | 重复发送邀请（唯一约束冲突）

| 项 | 内容 |
|---|---|
| **编号** | TC-105 |
| **名称** | 向同一用户重复发送邀请 |
| **前置条件** | 已向目标用户发送过 pending 邀请 |
| **操作步骤** | 1. 搜索同一用户 2. 再次发送邀请 |
| **预期结果** | 1. POST `/location_invites` 触发唯一约束冲突 2. Supabase 返回 `code: '23505'` 3. Toast "你已经邀请过 ta 了" |
| **严重级** | **P1** |
| **验证方式** | Network 面板 POST 返回 409/23505；Toast 文案正确 |

---

### TC-106 | 邀请不存在的用户

| 项 | 内容 |
|---|---|
| **编号** | TC-106 |
| **名称** | 邀请已删除的用户 |
| **前置条件** | 目标用户已被删除（`app_users` 无此 ID） |
| **操作步骤** | 1. 构造邀请请求指向不存在的 `receiver_id` |
| **预期结果** | 1. 外键约束失败 2. Supabase 返回错误 3. Toast "邀请失败，请稍后重试" |
| **严重级** | **P1** |
| **验证方式** | Network 面板 POST 返回外键错误；Toast 提示 |

---

### TC-107 | 未登录访问

| 项 | 内容 |
|---|---|
| **编号** | TC-107 |
| **名称** | 未登录状态访问位置共享 |
| **前置条件** | `currentUser.value` 为 `null` |
| **操作步骤** | 1. 退出登录 2. 直接访问 `/location-share` |
| **预期结果** | 1. `searchUsers` 返回 `{ data: [] }`（uid 为空时提前返回） 2. `sendInvite` 返回 `{ error: { message: '未登录' } }` 3. `getActiveShares` 返回 `{ data: [] }` 4. 地图仍可加载（高德不依赖登录） |
| **严重级** | **P1** |
| **验证方式** | 页面不崩溃；操作触发 Toast "未登录" |

---

### TC-108 | 高德 API Key 无效

| 项 | 内容 |
|---|---|
| **编号** | TC-108 |
| **名称** | 高德 API Key 无效或过期 |
| **前置条件** | `VITE_AMAP_KEY` 配置为无效值 |
| **操作步骤** | 1. 进入页面 2. 地图脚本加载 |
| **预期结果** | 1. `typeof AMap === 'undefined'` 或地图功能异常 2. `initMap()` 中 `showToast('地图加载失败，请刷新重试')` 3. 页面不崩溃 |
| **严重级** | **P0** |
| **验证方式** | Toast "地图加载失败，请刷新重试" 出现；页面其他元素正常渲染 |

---

## 四、数据字段映射验证（P1）

### TC-201 | location_invites 表字段映射

| 项 | 内容 |
|---|---|
| **编号** | TC-201 |
| **名称** | 邀请表字段完整性与类型 |
| **前置条件** | 数据库已迁移 |
| **操作步骤** | 1. 发送邀请 2. 查询 `location_invites` 表 |
| **预期结果** | 字段：`id`(UUID)、`sender_id`(UUID)、`receiver_id`(UUID)、`status`(text, default 'pending')、`created_at`(timestamptz)、`responded_at`(timestamptz, nullable)、`closed_at`(timestamptz, nullable)、`closed_reason`(text, nullable)；唯一约束 `(sender_id, receiver_id, status)` |
| **严重级** | **P1** |
| **验证方式** | `SELECT * FROM location_invites LIMIT 1` 检查字段 |

---

### TC-202 | location_shares 表字段映射

| 项 | 内容 |
|---|---|
| **编号** | TC-202 |
| **名称** | 位置记录表字段完整性与类型 |
| **前置条件** | 数据库已迁移 |
| **操作步骤** | 1. 上传位置 2. 查询 `location_shares` 表 |
| **预期结果** | 字段：`id`(UUID)、`relationship_id`(UUID, FK→location_invites)、`user_id`(UUID)、`latitude`(double)、`longitude`(double)、`accuracy`(double, nullable)、`is_matched`(boolean, default false)、`created_at`(timestamptz) |
| **严重级** | **P1** |
| **验证方式** | `SELECT * FROM location_shares LIMIT 1` 检查字段 |

---

### TC-203 | app_users 搜索返回字段

| 项 | 内容 |
|---|---|
| **编号** | TC-203 |
| **名称** | 搜索接口返回字段映射 |
| **前置条件** | 已登录 |
| **操作步骤** | 1. 搜索用户 2. 检查返回数据 |
| **预期结果** | 返回对象包含：`id`、`username`、`display_name`、`avatar`；不包含密码等敏感字段 |
| **严重级** | **P1** |
| **验证方式** | Network 面板检查 Response 字段 |

---

### TC-204 | 黑名单表字段映射

| 项 | 内容 |
|---|---|
| **编号** | TC-204 |
| **名称** | 黑名单表字段完整性 |
| **前置条件** | 数据库已迁移 |
| **操作步骤** | 1. 拉黑用户 2. 查询 `location_blacklist` 表 |
| **预期结果** | 字段：`id`(UUID)、`user_id`(UUID)、`blocked_user_id`(UUID)、`created_at`(timestamptz)；唯一约束 `(user_id, blocked_user_id)` |
| **严重级** | **P1** |
| **验证方式** | `SELECT * FROM location_blacklist LIMIT 1` 检查字段 |

---

### TC-205 | 搜索自动过滤黑名单用户

| 项 | 内容 |
|---|---|
| **编号** | TC-205 |
| **名称** | 搜索结果中不含黑名单用户 |
| **前置条件** | 用户 A 已被当前用户拉黑；A 的 username 匹配搜索词 |
| **操作步骤** | 1. 搜索 A 的 username |
| **预期结果** | 1. `getBlacklist()` 返回 `blocked_user_id` 列表 2. `users.filter(u => !blockedIds.includes(u.id))` 过滤掉 A 3. 搜索结果中不出现 A |
| **严重级** | **P1** |
| **验证方式** | 搜索已拉黑用户，确认结果列表不含该用户 |

---

### TC-206 | 搜索排除自己

| 项 | 内容 |
|---|---|
| **编号** | TC-206 |
| **名称** | 搜索结果不含当前用户 |
| **前置条件** | 已登录 |
| **操作步骤** | 1. 搜索自己的 username |
| **预期结果** | 查询条件 `id=neq.{uid}` 排除自己；搜索结果不含当前用户 |
| **严重级** | **P1** |
| **验证方式** | Network 面板检查 URL 包含 `id=eq.{uid}` 的否定形式 |

---

## 五、UI 渲染验证（P1）

### TC-301 | 地图容器渲染

| 项 | 内容 |
|---|---|
| **编号** | TC-301 |
| **名称** | 地图容器尺寸与样式 |
| **前置条件** | 页面已加载 |
| **操作步骤** | 1. 检查 `#location-map` 元素 |
| **预期结果** | 1. 容器宽度 100% 2. 高度 = `mapHeight`px（动态计算：`vh - 60 - drawerH - 20`，最小 200） 3. 地图瓦片可见 4. 高德 logo 和版权信息可见 |
| **严重级** | **P1** |
| **验证方式** | DOM 检查 `.map` 尺寸；视觉确认地图渲染 |

---

### TC-302 | 搜索栏渲染

| 项 | 内容 |
|---|---|
| **编号** | TC-302 |
| **名称** | 搜索栏布局与交互 |
| **前置条件** | 页面已加载 |
| **操作步骤** | 1. 检查搜索栏区域 |
| **预期结果** | 1. 搜索栏绝对定位在顶部（`top: calc(var(--safe-top) + 8px)`） 2. 输入框有 `left-icon="search"` 3. 输入框 `clearable` 4. 铃铛按钮在右侧 5. 搜索栏 `z-index: 100` |
| **严重级** | **P2** |
| **验证方式** | DOM 检查 `.search-bar` 位置和子元素 |

---

### TC-303 | 搜索结果列表渲染

| 项 | 内容 |
|---|---|
| **编号** | TC-303 |
| **名称** | 搜索结果下拉列表样式 |
| **前置条件** | 搜索返回结果 |
| **操作步骤** | 1. 输入关键词触发搜索 |
| **预期结果** | 1. 下拉列表 `max-height: 220px`，`overflow-y: auto` 2. 每项显示 👤 emoji、`display_name`（或 `username`）、`@username` 3. 点击项有 `:active` 背景变化 4. `z-index: 99` |
| **严重级** | **P2** |
| **验证方式** | DOM 检查 `.search-results` 和 `.search-item` 结构 |

---

### TC-304 | 共享卡片列表渲染

| 项 | 内容 |
|---|---|
| **编号** | TC-304 |
| **名称** | 底部共享卡片样式 |
| **前置条件** | 存在活跃共享 |
| **操作步骤** | 1. 观察底部抽屉 |
| **预期结果** | 1. 卡片显示 👤 头像、绿色在线圆点（若在线） 2. 名称（`getPartnerName`） 3. 距离（`formatDistance`）和时间（`formatTime`） 4. 地址（`getPartnerAddress`）单行截断 5. 🧭 导航按钮 6. 红色"关闭共享"按钮 |
| **严重级** | **P1** |
| **验证方式** | DOM 检查 `.share-card` 子元素；视觉确认布局 |

---

### TC-305 | 权限提示条渲染

| 项 | 内容 |
|---|---|
| **编号** | TC-305 |
| **名称** | 定位权限提示条样式 |
| **前置条件** | `showPermissionTip = true` |
| **操作步骤** | 1. 触发无权限场景 |
| **预期结果** | 1. 黄色背景（`#FEF3C7`） 2. 文字"📍 请开启位置权限以使用位置共享" 3. "前往设置"按钮（深棕背景） 4. "✕"关闭按钮 5. `z-index: 98` |
| **严重级** | **P1** |
| **验证方式** | DOM 检查 `.permission-tip` 样式和子元素 |

---

### TC-306 | 空状态渲染

| 项 | 内容 |
|---|---|
| **编号** | TC-306 |
| **名称** | 无共享时的空状态 |
| **前置条件** | `activeShares.length === 0` |
| **操作步骤** | 1. 进入页面（无共享关系） |
| **预期结果** | 1. 底部显示空状态区域 2. 🗺️ emoji（40px） 3. 标题"还没人在共享位置" 4. 描述"搜索好友，邀请 TA 开始共享" |
| **严重级** | **P2** |
| **验证方式** | DOM 检查 `.empty-state` 子元素 |

---

### TC-307 | 邀请弹窗渲染

| 项 | 内容 |
|---|---|
| **编号** | TC-307 |
| **名称** | 邀请确认弹窗样式 |
| **前置条件** | 点击搜索结果 |
| **操作步骤** | 1. 观察弹窗 |
| **预期结果** | 1. `Teleport to="body"` 渲染到 body 2. 标题"发送位置共享邀请" 3. 描述"确定向 **用户名** 发送邀请？" 4. 提示"对方将能看到你的实时位置" 5. "取消"和"确认发送"按钮 |
| **严重级** | **P2** |
| **验证方式** | DOM 检查 `.dialog-overlay` 和 `.dialog-box` 内容 |

---

### TC-308 | 邀请列表弹窗渲染

| 项 | 内容 |
|---|---|
| **编号** | TC-308 |
| **名称** | 邀请列表弹窗样式 |
| **前置条件** | 点击铃铛 |
| **操作步骤** | 1. 观察弹窗 |
| **预期结果** | 1. 标题"位置共享邀请" 2. 无邀请时显示"暂无邀请" 3. 有邀请时显示列表：头像、邀请者名、时间、"接受"和"拒绝"按钮 4. 底部"关闭"按钮 |
| **严重级** | **P2** |
| **验证方式** | DOM 检查 `.invite-list` 和 `.invite-item` 结构 |

---

## 六、持久化验证（P2）

### TC-401 | 位置数据上传持久化

| 项 | 内容 |
|---|---|
| **编号** | TC-401 |
| **名称** | 位置上传写入 Supabase |
| **前置条件** | 存在活跃共享；GPS 位置变化 > 5m |
| **操作步骤** | 1. 移动位置超过 5m 2. `watchPosition` 回调触发 3. `uploadLocation` 执行 |
| **预期结果** | 1. POST `/location_shares` body `{relationship_id, user_id, latitude, longitude, accuracy}` 2. 数据库 `location_shares` 表新增记录 3. `created_at` 自动填充 |
| **严重级** | **P1** |
| **验证方式** | Network 面板 POST 200；`SELECT * FROM location_shares ORDER BY created_at DESC LIMIT 1` 确认记录存在 |

---

### TC-402 | 位置数据不重复上传（<5m 节流）

| 项 | 内容 |
|---|---|
| **编号** | TC-402 |
| **名称** | 位置变化 <5m 不上传 |
| **前置条件** | 存在活跃共享 |
| **操作步骤** | 1. 轻微移动位置（<5m） 2. `watchPosition` 回调 |
| **预期结果** | 1. `calcDistance(prevLat, prevLng, lat, lng) < 5` 2. 函数提前 return，不调用 `uploadLocation` 3. 不发送 POST 请求 |
| **严重级** | **P1** |
| **验证方式** | Network 面板无 POST `/location_shares` 请求 |

---

### TC-403 | 清除本地缓存

| 项 | 内容 |
|---|---|
| **编号** | TC-403 |
| **名称** | 清除本地位置缓存 |
| **前置条件** | `localStorage` 中存在 `location_cache` |
| **操作步骤** | 1. 进入 LocationManage 页面 2. 点击"删除全部位置数据" 3. 确认弹窗 |
| **预期结果** | 1. `localStorage.removeItem('location_cache')` 2. Toast "位置数据已清除" 3. 弹窗关闭 |
| **严重级** | **P2** |
| **验证方式** | `localStorage.getItem('location_cache')` 返回 `null` |

---

### TC-404 | 导出位置数据

| 项 | 内容 |
|---|---|
| **编号** | TC-404 |
| **名称** | 导出位置数据为 JSON |
| **前置条件** | 存在活跃共享和黑名单数据 |
| **操作步骤** | 1. 进入 LocationManage 页面 2. 点击"导出位置数据" |
| **预期结果** | 1. 生成 Blob 包含 `{activeShares, blacklist, exportedAt}` 2. 触发下载 `location-data-YYYY-MM-DD.json` 3. Toast "导出成功" |
| **严重级** | **P2** |
| **验证方式** | 拦截 `a.click()` 调用；检查 Blob 内容格式 |

---

### TC-405 | 邀请状态持久化

| 项 | 内容 |
|---|---|
| **编号** | TC-405 |
| **名称** | 邀请操作状态写入数据库 |
| **前置条件** | 有 pending 邀请 |
| **操作步骤** | 1. 接受或拒绝邀请 |
| **预期结果** | 1. PATCH 请求成功 2. 数据库 `location_invites` 表 `status` 更新为 `accepted`/`rejected` 3. `responded_at` 写入当前时间 |
| **严重级** | **P1** |
| **验证方式** | `SELECT status, responded_at FROM location_invites WHERE id = '{id}'` 确认更新 |

---

## 七、边界条件测试（P1）

### TC-501 | 无定位权限且所有 IP 定位失败

| 项 | 内容 |
|---|---|
| **编号** | TC-501 |
| **名称** | 完全无法定位的极端场景 |
| **前置条件** | GPS 拒绝、ip-api 不可达、高德 IP 失败 |
| **操作步骤** | 1. Mock 全部定位来源返回 null |
| **预期结果** | 1. `myLat = 0`, `myLng = 0` 2. `showPermissionTip = true` 3. 地图以北京为中心（`39.9088, 116.3974`） 4. 页面不崩溃 |
| **严重级** | **P1** |
| **验证方式** | 页面正常渲染；权限提示条可见；地图显示北京 |

---

### TC-502 | 快速连续点击发送邀请

| 项 | 内容 |
|---|---|
| **编号** | TC-502 |
| **名称** | 快速连续点击"确认发送"按钮 |
| **前置条件** | 邀请确认弹窗已打开 |
| **操作步骤** 1. 快速连续点击"确认发送"按钮 3 次 |
| **预期结果** | 1. 第一次点击触发 `confirmSendInvite` 2. `showInviteConfirm = false` 关闭弹窗 3. 后续点击无效（弹窗已关闭） 4. 数据库仅插入一条邀请记录 |
| **严重级** | **P1** |
| **验证方式** | Network 面板仅一条 POST `/location_invites` 请求；数据库无重复记录 |

---

### TC-503 | 地图标记泄漏（关闭共享后）

| 项 | 内容 |
|---|---|
| **编号** | TC-503 |
| **名称** | 关闭共享后地图标记正确移除 |
| **前置条件** | 地图上有多个对方标记 |
| **操作步骤** | 1. 关闭其中一个共享 2. 检查地图标记 |
| **预期结果** | 1. `removePartnerMarker(share.id)` 调用 2. `marker.setMap(null)` 移除标记 3. `partnerMarkers.value[share.id]` 被 delete 4. 其他共享标记不受影响 |
| **严重级** | **P1** |
| **验证方式** | 地图红色标记数量减一；`Object.keys(partnerMarkers.value).length` 正确 |

---

### TC-504 | 搜索防抖（快速输入）

| 项 | 内容 |
|---|---|
| **编号** | TC-504 |
| **名称** | 快速连续输入搜索词 |
| **前置条件** | 搜索框聚焦 |
| **操作步骤** | 1. 快速输入 "a" → "ab" → "abc" → "abcd"（间隔 <300ms） |
| **预期结果** | 1. 每次输入重置 `searchTimer` 2. 仅最后一次输入后 300ms 触发 `doSearch` 3. 仅发送一次 Supabase 请求 |
| **严重级** | **P1** |
| **验证方式** | Network 面板仅一条 `/app_users` 请求 |

---

### TC-505 | 搜索框 blur 后点击结果项

| 项 | 内容 |
|---|---|
| **编号** | TC-505 |
| **名称** | blur 延迟隐藏与点击冲突 |
| **前置条件** | 搜索下拉显示结果 |
| **操作步骤** | 1. 点击搜索结果项（触发 blur） |
| **预期结果** | 1. `onSearchBlur` 设置 200ms 延迟隐藏 2. `onSelectUser` 使用 `@mousedown.prevent=""` 阻止 blur 3. 点击正常触发选中逻辑 |
| **严重级** | **P1** |
| **验证方式** | 点击搜索结果项后弹窗正常弹出；`showResults` 正确关闭 |

---

### TC-506 | 抽屉展开时地图高度自适应

| 项 | 内容 |
|---|---|
| **编号** | TC-506 |
| **名称** | 抽屉展开/收起时地图高度计算 |
| **前置条件** | 存在活跃共享 |
| **操作步骤** | 1. 展开抽屉 2. 收起抽屉 |
| **预期结果** | 1. 展开：`drawerHeight = min(vh*0.5, 400)` 2. 收起：`drawerHeight = 80` 3. 300ms 后 `mapHeight = max(vh - 60 - drawerH - 20, 200)` 4. 地图 `setFitView` 重新适配 |
| **严重级** | **P2** |
| **验证方式** | DOM 检查 `.map` 高度变化；`mapHeight` 值正确 |

---

### TC-507 | 同时存在多个共享关系

| 项 | 内容 |
|---|---|
| **编号** | TC-507 |
| **名称** | 多人位置共享 |
| **前置条件** | 与 3 个用户同时共享 |
| **操作步骤** | 1. 进入页面 2. 观察地图和底部卡片 |
| **预期结果** | 1. 地图显示 1 个蓝色自身标记 + 3 个红色对方标记 2. `mapInstance.setFitView` 包含全部 4 个标记 3. 底部抽屉显示 3 张共享卡片 4. 每张卡片显示各自的距离、时间、地址 |
| **严重级** | **P1** |
| **验证方式** | 地图标记数量 = 4；`.share-card` 数量 = 3；`setFitView` 参数包含全部标记 |

---

### TC-508 | 对方位置数据为空

| 项 | 内容 |
|---|---|
| **编号** | TC-508 |
| **名称** | 对方从未上传过位置 |
| **前置条件** | 共享关系已接受；对方 `location_shares` 无记录 |
| **操作步骤** | 1. 加载共享关系 |
| **预期结果** | 1. `getPartnerLocation` 返回 `null` 2. `partnerLocations.value[share.id]` 不设置 3. 地图不添加该对方标记 4. 底部卡片显示对方名，但距离和时间显示为空/默认值 |
| **严重级** | **P1** |
| **验证方式** | 地图仅自身标记；底部卡片无距离信息；Console 无异常 |

---

### TC-509 | 逆地理编码失败

| 项 | 内容 |
|---|---|
| **编号** | TC-509 |
| **名称** | 高德逆地理编码 API 失败 |
| **前置条件** | 对方有位置数据；Mock `restapi.amap.com/v3/geocode/regeo` 返回失败 |
| **操作步骤** | 1. 加载共享关系 |
| **预期结果** | 1. `reverseGeocode` 返回 `null` 2. `partnerAddresses.value[share.id]` 不设置 3. 底部卡片不显示地址行（`v-if="getPartnerAddress(share)"`） 4. 其他信息正常显示 |
| **严重级** | **P2** |
| **验证方式** | 底部卡片无地址行；Console 无未捕获异常 |

---

### TC-510 | 高德地图脚本未加载

| 项 | 内容 |
|---|---|
| **编号** | TC-510 |
| **名称** | `AMap` 全局对象不存在 |
| **前置条件** | 高德脚本加载失败（网络错误或 CSP 阻止） |
| **操作步骤** | 1. 进入页面 |
| **预期结果** | 1. `typeof AMap === 'undefined'` 2. `showToast('地图加载失败，请刷新重试')` 3. `initMap` 提前 return 4. 页面其他元素正常渲染 |
| **严重级** | **P0** |
| **验证方式** | Toast 出现；页面不崩溃；搜索栏、铃铛等正常 |

---

## 八、高德 API 调用参数和返回解析（P1）

### TC-601 | 高德地图 JSAPI 加载

| 项 | 内容 |
|---|---|
| **编号** | TC-601 |
| **名称** | 高德地图脚本加载参数 |
| **前置条件** | `index.html` 包含高德脚本标签 |
| **操作步骤** | 1. 检查 `index.html` head 中的脚本标签 |
| **预期结果** | `<script src="https://webapi.amap.com/maps?v=1.4.15&key=594219bb4b4c1debb39cfe5e4613e64d"></script>` |
| **严重级** | **P0** |
| **验证方式** | DOM 检查 `script[src*="webapi.amap.com"]` 存在 |

---

### TC-602 | 高德 IP 定位 API 调用

| 项 | 内容 |
|---|---|
| **编号** | TC-602 |
| **名称** | 高德 IP 定位请求与响应解析 |
| **前置条件** | GPS 和 ip-api 均失败 |
| **操作步骤** | 1. 触发高德 IP 定位 |
| **预期结果** | 1. 请求 URL：`https://restapi.amap.com/v3/ip?key={AMAP_KEY}` 2. 返回 `status === '1'` 3. `rectangle` 格式 `"lon1,lat1;lon2,lat2"` 解析为平均值 4. `city` 去除末尾"市"字 5. 返回 `{city, region, country:'中国', lat, lon}` |
| **严重级** | **P1** |
| **验证方式** | Network 面板检查请求 URL；Mock 返回验证解析逻辑 |

---

### TC-603 | 高德逆地理编码 API 调用

| 项 | 内容 |
|---|---|
| **编号** | TC-603 |
| **名称** | 逆地理编码请求与响应解析 |
| **前置条件** | 有 GPS 坐标 |
| **操作步骤** | 1. 触发 `reverseGeocode(lat, lon)` |
| **预期结果** | 1. 请求 URL：`https://restapi.amap.com/v3/geocode/regeo?key={AMAP_KEY}&location={lon},{lat}&extensions=base` 2. 返回 `status === '1'` 3. 解析 `regeocode.addressComponent.city`（处理数组和"市"后缀） 4. 返回 `{city, province, district, formattedAddress}` |
| **严重级** | **P1** |
| **验证方式** | Network 面板检查请求 URL；Mock 返回验证解析逻辑 |

---

### TC-604 | 高德地图初始化配置

| 项 | 内容 |
|---|---|
| **编号** | TC-604 |
| **名称** | AMap.Map 构造参数 |
| **前置条件** | `AMap` 已加载 |
| **操作步骤** | 1. 检查 `new AMap.Map` 调用参数 |
| **预期结果** | 1. 容器 ID：`'location-map'` 2. `zoom: 15` 3. `center: [myLng, myLat]` 4. `mapStyle: 'amap://styles/normal'` |
| **严重级** | **P1** |
| **验证方式** | 拦截 `AMap.Map` 构造函数检查参数 |

---

### TC-605 | 高德标记（Marker）配置

| 项 | 内容 |
|---|---|
| **编号** | TC-605 |
| **名称** | 自身与对方标记样式 |
| **前置条件** | 地图已初始化 |
| **操作步骤** | 1. 检查标记创建参数 |
| **预期结果** | 自身标记：icon `mark_b.png`（30x30），offset `(-15, -30)`；对方标记：icon `mark_r.png`（36x36），offset `(-18, -36)` |
| **严重级** | **P2** |
| **验证方式** | 拦截 `AMap.Marker` 构造函数检查参数 |

---

### TC-606 | 高德 InfoWindow 配置

| 项 | 内容 |
|---|---|
| **编号** | TC-606 |
| **名称** | 信息窗体配置 |
| **前置条件** | 点击对方标记 |
| **操作步骤** | 1. 检查 `AMap.InfoWindow` 参数 |
| **预期结果** | 1. `content` 包含对方名、时间、距离 2. `offset: Pixel(0, -40)` 3. `open(mapInstance, [lng, lat])` |
| **严重级** | **P2** |
| **验证方式** | 拦截 `AMap.InfoWindow` 构造函数检查参数 |

---

### TC-607 | 高德导航 URL 构造

| 项 | 内容 |
|---|---|
| **编号** | TC-607 |
| **名称** | 导航跳转 URL 格式 |
| **前置条件** | 点击导航按钮 |
| **操作步骤** | 1. 检查 `window.open` URL |
| **预期结果** | `https://uri.amap.com/navigation?to={lng},{lat},{name}&mode=car&src=love-app` |
| **严重级** | **P1** |
| **验证方式** | 拦截 `window.open` 检查 URL 格式 |

---

### TC-608 | ip-api.com 请求参数

| 项 | 内容 |
|---|---|
| **编号** | TC-608 |
| **名称** | ip-api 请求与响应解析 |
| **前置条件** | GPS 失败 |
| **操作步骤** | 1. 触发 ip-api 定位 |
| **预期结果** | 1. 请求 URL：`https://ip-api.com/json/?lang=zh-CN` 2. 返回 `status === 'success'` 3. `city` 去除末尾"市"字 4. 返回 `{city, region, country, lat, lon}` |
| **严重级** | **P1** |
| **验证方式** | Network 面板检查请求 URL；Mock 返回验证解析逻辑 |

---

### TC-609 | 浏览器 Geolocation API 参数

| 项 | 内容 |
|---|---|
| **编号** | TC-609 |
| **名称** | GPS 定位 API 参数 |
| **前置条件** | 浏览器支持 Geolocation |
| **操作步骤** | 1. 检查 `getCurrentPosition` 调用参数 |
| **预期结果** | 1. `enableHighAccuracy: true` 2. `timeout: 10000`（10s） 3. `maximumAge: 300000`（5min 缓存） |
| **严重级** | **P1** |
| **验证方式** | 拦截 `navigator.geolocation.getCurrentPosition` 检查参数 |

---

### TC-610 | Supabase 请求超时

| 项 | 内容 |
|---|---|
| **编号** | TC-610 |
| **名称** | Supabase 请求 15s 超时 |
| **前置条件** | 网络延迟 >15s |
| **操作步骤** | 1. 触发任意 Supabase 请求 |
| **预期结果** | 1. `AbortController` 15s 后 `abort()` 2. `fetch` 抛出 AbortError 3. 函数返回 `{ data: [] }` 或 `{ error: {...} }` 兜底 |
| **严重级** | **P1** |
| **验证方式** | Network 面板请求 15s 后取消；页面不崩溃 |

---

## 九、CSP 合规性验证（P0）

### TC-701 | CSP script-src 覆盖高德所有子域名

| 项 | 内容 |
|---|---|
| **编号** | TC-701 |
| **名称** | CSP script-src 包含高德全部脚本域名 |
| **前置条件** | `index.html` 包含 CSP meta 标签 |
| **操作步骤** | 1. 检查 CSP `script-src` 指令 |
| **预期结果** | 必须包含：`https://webapi.amap.com`、`https://restapi.amap.com`、`https://jsapi.amap.com`、`https://jsapi-service.amap.com`、`https://vdata.amap.com` |
| **严重级** | **P0** |
| **验证方式** | 读取 `index.html` 第 10 行 CSP 内容，逐一确认域名存在 |

**当前 CSP script-src 解析：**
```
script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: 
  https://webapi.amap.com 
  https://restapi.amap.com 
  https://jsapi.amap.com 
  https://jsapi-service.amap.com 
  https://vdata.amap.com
```

**验证结果：** ✅ 全部覆盖

---

### TC-702 | CSP connect-src 覆盖高德所有 API 域名

| 项 | 内容 |
|---|---|
| **编号** | TC-702 |
| **名称** | CSP connect-src 包含高德全部 API 域名 |
| **前置条件** | `index.html` 包含 CSP meta 标签 |
| **操作步骤** | 1. 检查 CSP `connect-src` 指令 |
| **预期结果** | 必须包含：`https://restapi.amap.com`、`https://webapi.amap.com`、`https://jsapi.amap.com`、`https://jsapi-service.amap.com`、`https://vdata.amap.com`、`https://ip-api.com`、`http://ip-api.com`、`https://*.supabase.co`、`wss://*.supabase.co` |
| **严重级** | **P0** |
| **验证方式** | 读取 CSP 内容，逐一确认域名存在 |

**当前 CSP connect-src 解析：**
```
connect-src 'self' 
  https://restapi.amap.com 
  https://webapi.amap.com 
  https://jsapi.amap.com 
  https://jsapi-service.amap.com 
  https://vdata.amap.com 
  https://ip-api.com 
  http://ip-api.com 
  https://*.supabase.co 
  wss://*.supabase.co
```

**验证结果：** ✅ 全部覆盖

---

### TC-703 | CSP font-src 覆盖高德字体域名

| 项 | 内容 |
|---|---|
| **编号** | TC-703 |
| **名称** | CSP font-src 包含高德字体 CDN |
| **前置条件** | `index.html` 包含 CSP meta 标签 |
| **操作步骤** | 1. 检查 CSP `font-src` 指令 |
| **预期结果** | 必须包含：`https://at.alicdn.com`、`http://at.alicdn.com` |
| **严重级** | **P1** |
| **验证方式** | 读取 CSP 内容确认字体域名存在 |

**当前 CSP font-src 解析：**
```
font-src 'self' data: https://at.alicdn.com http://at.alicdn.com
```

**验证结果：** ✅ 覆盖

---

### TC-704 | CSP img-src 覆盖高德标记图片

| 项 | 内容 |
|---|---|
| **编号** | TC-704 |
| **名称** | CSP img-src 允许加载高德标记图片 |
| **前置条件** | `index.html` 包含 CSP meta 标签 |
| **操作步骤** | 1. 检查 CSP `img-src` 指令 |
| **预期结果** | 必须允许 `https://webapi.amap.com`（标记图片域名） |
| **严重级** | **P1** |
| **验证方式** | 读取 CSP 内容确认 `https://*` 通配符或具体域名存在 |

**当前 CSP img-src 解析：**
```
img-src 'self' data: blob: https://*
```

**验证结果：** ✅ `https://*` 通配符覆盖所有 HTTPS 域名

---

### TC-705 | CSP 不允许高德未覆盖的子域名

| 项 | 内容 |
|---|---|
| **编号** | TC-705 |
| **名称** | 高德可能使用的其他子域名 |
| **前置条件** | 了解高德地图 JSAPI 1.4.15 加载链 |
| **操作步骤** | 1. 加载页面 2. 检查 Console 是否有 CSP 违规警告 |
| **预期结果** | 无 CSP 违规 Console 警告；所有高德脚本、样式、API 请求均正常 |
| **严重级** | **P0** |
| **验证方式** | Console 面板无 "Refused to load..." 或 "violates the following Content Security Policy" 错误 |

**已知高德 v1.4.15 加载链：**
| 域名 | 用途 | CSP 覆盖 |
|---|---|---|
| `webapi.amap.com` | 主脚本入口 | ✅ script-src + connect-src |
| `vdata.amap.com` | 地图样式/主题 | ✅ script-src + connect-src |
| `jsapi.amap.com` | JSAPI 核心 | ✅ script-src + connect-src |
| `jsapi-service.amap.com` | 服务端接口 | ✅ script-src + connect-src |
| `restapi.amap.com` | REST API（IP定位/逆地理编码） | ✅ script-src + connect-src |
| `uri.amap.com` | 导航跳转（window.open） | ✅ 不受 CSP 限制 |
| `at.alicdn.com` | 字体文件 | ✅ font-src |

---

### TC-706 | CSP worker-src 支持高德 Web Worker

| 项 | 内容 |
|---|---|
| **编号** | TC-706 |
| **名称** | CSP worker-src 允许 blob Worker |
| **前置条件** | 高德地图内部使用 Web Worker |
| **操作步骤** | 1. 检查 CSP `worker-src` 指令 |
| **预期结果** | `worker-src 'self' blob:` |
| **严重级** | **P1** |
| **验证方式** | 读取 CSP 内容确认 `blob:` 存在 |

**当前 CSP worker-src 解析：**
```
worker-src 'self' blob:
```

**验证结果：** ✅ 支持 blob Worker

---

### TC-707 | CSP style-src 支持高德内联样式

| 项 | 内容 |
|---|---|
| **编号** | TC-707 |
| **名称** | CSP style-src 允许内联样式 |
| **前置条件** | 高德地图动态注入样式 |
| **操作步骤** | 1. 检查 CSP `style-src` 指令 |
| **预期结果** | `style-src 'self' 'unsafe-inline'` |
| **严重级** | **P1** |
| **验证方式** | 读取 CSP 内容确认 `'unsafe-inline'` 存在 |

**当前 CSP style-src 解析：**
```
style-src 'self' 'unsafe-inline'
```

**验证结果：** ✅ 支持内联样式

---

## 十、LocationManage 页面测试（P1）

### TC-801 | 位置精度设置切换

| 项 | 内容 |
|---|---|
| **编号** | TC-801 |
| **名称** | 位置精度 radio 切换 |
| **前置条件** | 进入 LocationManage 页面 |
| **操作步骤** | 1. 点击"精确"、"大致"、"关闭"三个选项 |
| **预期结果** | 1. `locationPrecision` 值随之变化 2. 选中项有 `.active` class 3. 选中项 radio-dot 变色 |
| **严重级** | **P2** |
| **验证方式** | DOM 检查 `.radio-item.active` 切换 |

---

### TC-802 | 智能关闭开关

| 项 | 内容 |
|---|---|
| **编号** | TC-802 |
| **名称** | 智能关闭 switch 切换 |
| **前置条件** | 进入 LocationManage 页面 |
| **操作步骤** | 1. 点击 van-switch |
| **预期结果** | 1. `autoCloseEnabled` 切换 true/false 2. Toast "智能关闭已开启"或"智能关闭已关闭" |
| **严重级** | **P2** |
| **验证方式** | DOM 检查 switch 状态；Toast 文案 |

---

### TC-803 | 关闭全部共享

| 项 | 内容 |
|---|---|
| **编号** | TC-803 |
| **名称** | 一键关闭全部共享 |
| **前置条件** | 存在多个活跃共享 |
| **操作步骤** | 1. 点击"关闭全部" 2. 确认弹窗 3. 点击"全部关闭" |
| **预期结果** | 1. 遍历 `activeShares` 逐个调用 `closeShare` 2. `activeShares = []` 3. Toast "已关闭全部共享" |
| **严重级** | **P1** |
| **验证方式** | Network 面板多条 PATCH 请求；数据库所有 share status 变为 `closed`；列表清空 |

---

### TC-804 | 黑名单解除

| 项 | 内容 |
|---|---|
| **编号** | TC-804 |
| **名称** | 解除黑名单用户 |
| **前置条件** | 黑名单中有用户 |
| **操作步骤** | 1. 点击"解除"按钮 |
| **预期结果** | 1. DELETE `/location_blacklist?user_id=eq.uid&blocked_user_id=eq.{id}` 2. Toast "已解除拉黑" 3. 该用户从黑名单列表移除 |
| **严重级** | **P1** |
| **验证方式** | Network 面板 DELETE 请求；数据库记录删除；列表更新 |

---

## 十一、测试用例汇总

| 编号 | 名称 | 严重级 | 分类 |
|---|---|---|---|
| TC-001 | 地图正常加载 | P0 | 正向流程 |
| TC-002 | 获取当前位置（GPS 成功） | P0 | 正向流程 |
| TC-003 | GPS 失败降级 ip-api.com | P0 | 正向流程 |
| TC-004 | ip-api 失败降级高德 IP | P1 | 正向流程 |
| TC-005 | 全链路 fallback 至北京 | P1 | 正向流程 |
| TC-006 | 搜索用户（关键词 ≥ 2 字符） | P0 | 正向流程 |
| TC-007 | 搜索 < 2 字符不请求 | P1 | 正向流程 |
| TC-008 | 选择用户发送邀请 | P0 | 正向流程 |
| TC-009 | 接受位置共享邀请 | P0 | 正向流程 |
| TC-010 | 拒绝位置共享邀请 | P0 | 正向流程 |
| TC-011 | 查看对方位置（共享激活后） | P0 | 正向流程 |
| TC-012 | 地图标记点击展示信息窗体 | P1 | 正向流程 |
| TC-013 | 关闭位置共享 | P0 | 正向流程 |
| TC-014 | 导航跳转高德 | P1 | 正向流程 |
| TC-015 | 定位按钮回到自身 | P1 | 正向流程 |
| TC-016 | 底部抽屉展开/收起 | P1 | 正向流程 |
| TC-017 | 铃铛角标计数 | P1 | 正向流程 |
| TC-101 | 无 GPS 权限（用户拒绝） | P1 | 反向流程 |
| TC-102 | 网络异常（Supabase 不可达） | P0 | 反向流程 |
| TC-103 | 搜索无结果 | P1 | 反向流程 |
| TC-104 | 搜索含特殊字符或 SQL 注入 | P1 | 反向流程 |
| TC-105 | 重复发送邀请（唯一约束冲突） | P1 | 反向流程 |
| TC-106 | 邀请不存在的用户 | P1 | 反向流程 |
| TC-107 | 未登录访问 | P1 | 反向流程 |
| TC-108 | 高德 API Key 无效 | P0 | 反向流程 |
| TC-201 | location_invites 表字段映射 | P1 | 数据字段映射 |
| TC-202 | location_shares 表字段映射 | P1 | 数据字段映射 |
| TC-203 | app_users 搜索返回字段 | P1 | 数据字段映射 |
| TC-204 | 黑名单表字段映射 | P1 | 数据字段映射 |
| TC-205 | 搜索自动过滤黑名单用户 | P1 | 数据字段映射 |
| TC-206 | 搜索排除自己 | P1 | 数据字段映射 |
| TC-301 | 地图容器渲染 | P1 | UI 渲染 |
| TC-302 | 搜索栏渲染 | P2 | UI 渲染 |
| TC-303 | 搜索结果列表渲染 | P2 | UI 渲染 |
| TC-304 | 共享卡片列表渲染 | P1 | UI 渲染 |
| TC-305 | 权限提示条渲染 | P1 | UI 渲染 |
| TC-306 | 空状态渲染 | P2 | UI 渲染 |
| TC-307 | 邀请弹窗渲染 | P2 | UI 渲染 |
| TC-308 | 邀请列表弹窗渲染 | P2 | UI 渲染 |
| TC-401 | 位置数据上传持久化 | P1 | 持久化 |
| TC-402 | 位置数据不重复上传（<5m 节流） | P1 | 持久化 |
| TC-403 | 清除本地缓存 | P2 | 持久化 |
| TC-404 | 导出位置数据 | P2 | 持久化 |
| TC-405 | 邀请状态持久化 | P1 | 持久化 |
| TC-501 | 无定位权限且所有 IP 定位失败 | P1 | 边界条件 |
| TC-502 | 快速连续点击发送邀请 | P1 | 边界条件 |
| TC-503 | 地图标记泄漏（关闭共享后） | P1 | 边界条件 |
| TC-504 | 搜索防抖（快速输入） | P1 | 边界条件 |
| TC-505 | 搜索框 blur 后点击结果项 | P1 | 边界条件 |
| TC-506 | 抽屉展开时地图高度自适应 | P2 | 边界条件 |
| TC-507 | 同时存在多个共享关系 | P1 | 边界条件 |
| TC-508 | 对方位置数据为空 | P1 | 边界条件 |
| TC-509 | 逆地理编码失败 | P2 | 边界条件 |
| TC-510 | 高德地图脚本未加载 | P0 | 边界条件 |
| TC-601 | 高德地图 JSAPI 加载 | P0 | 高德 API |
| TC-602 | 高德 IP 定位 API 调用 | P1 | 高德 API |
| TC-603 | 高德逆地理编码 API 调用 | P1 | 高德 API |
| TC-604 | 高德地图初始化配置 | P1 | 高德 API |
| TC-605 | 高德标记（Marker）配置 | P2 | 高德 API |
| TC-606 | 高德 InfoWindow 配置 | P2 | 高德 API |
| TC-607 | 高德导航 URL 构造 | P1 | 高德 API |
| TC-608 | ip-api.com 请求参数 | P1 | 高德 API |
| TC-609 | 浏览器 Geolocation API 参数 | P1 | 高德 API |
| TC-610 | Supabase 请求超时 | P1 | 高德 API |
| TC-701 | CSP script-src 覆盖高德所有子域名 | P0 | CSP 合规性 |
| TC-702 | CSP connect-src 覆盖高德全部 API 域名 | P0 | CSP 合规性 |
| TC-703 | CSP font-src 覆盖高德字体 CDN | P1 | CSP 合规性 |
| TC-704 | CSP img-src 覆盖高德标记图片 | P1 | CSP 合规性 |
| TC-705 | CSP 不允许高德未覆盖的子域名 | P0 | CSP 合规性 |
| TC-706 | CSP worker-src 支持高德 Web Worker | P1 | CSP 合规性 |
| TC-707 | CSP style-src 支持高德内联样式 | P1 | CSP 合规性 |
| TC-801 | 位置精度设置切换 | P2 | LocationManage |
| TC-802 | 智能关闭开关 | P2 | LocationManage |
| TC-803 | 关闭全部共享 | P1 | LocationManage |
| TC-804 | 黑名单解除 | P1 | LocationManage |

---

## 十二、测试执行建议

### 优先级执行顺序
1. **第一轮（冒烟）**: TC-001, TC-002, TC-006, TC-008, TC-009, TC-011, TC-013, TC-701, TC-702, TC-705
2. **第二轮（功能完整）**: 全部 P0 + P1 用例
3. **第三轮（回归）**: 全部用例

### Mock 策略
- **GPS**: 使用浏览器 DevTools Sensors 模拟位置或 Mock `navigator.geolocation`
- **网络**: Chrome DevTools Network 面板 Throttling 或 `cy.intercept`
- **高德 API**: Mock `fetch` 拦截 `restapi.amap.com` 和 `webapi.amap.com`
- **Supabase**: 使用真实测试环境或 Mock `fetch` 拦截 `/rest/v1` 路径

### 自动化建议
- TC-001 ~ TC-017: 适合 E2E（Playwright/Cypress）
- TC-201 ~ TC-206: 适合单元测试（Vitest + Supabase 测试实例）
- TC-601 ~ TC-610: 适合集成测试（Mock fetch）
- TC-701 ~ TC-707: 适合静态分析（读取 index.html 正则匹配）
