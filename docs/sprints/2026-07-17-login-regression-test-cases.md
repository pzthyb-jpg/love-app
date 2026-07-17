# 登录/注册功能回归测试案例

> **项目**: 小皮爱情助手 (love-app)  
> **测试模块**: 登录/注册 (LoginPage.vue + useDatabase.js + Router Guard)  
> **文档版本**: v1.0  
> **创建日期**: 2026-07-17  
> **测试范围**: 正向流程、反向流程、表单校验、字段映射、localStorage、路由守卫

---

## 一、测试环境信息

| 项目 | 说明 |
|------|------|
| 前端框架 | Vue 3 + Vite |
| UI 组件库 | Vant (van-field, van-button, van-toast) |
| 路由 | Vue Router 4 (Hash 模式) |
| 状态管理 | Composition API (ref/computed) |
| 后端 | Supabase REST API |
| 密码加密 | PBKDF2-SHA256 (100000 iterations) |
| 本地存储 | localStorage (`love-app-current-user`) |

---

## 二、关键代码逻辑摘要

### 2.1 LoginPage.vue
- 双 Tab 切换：登录 / 注册
- 登录表单字段：`username`, `password`
- 注册表单字段：`username`, `password`, `displayName`（可选）
- `handleLogin()`: 空值校验 → 调用 `login()` → 成功跳转 `/`
- `handleRegister()`: 调用 `register()` → 成功跳转 `/`

### 2.2 useDatabase.js (Auth 部分)
- `register()`: 校验 username≥3字符、password≥6位 → PBKDF2 哈希 → POST `/app_users` → 存入 localStorage
- `login()`: GET `/app_users?username=eq.{username}` → 比对密码哈希 → 存入 localStorage
- `logout()`: 清空 `currentUser` + 移除 localStorage
- `isAuthenticated`: `computed(() => !!currentUser.value)`

### 2.3 Router Guard (beforeEach)
- 已登录访问 `/login` → 重定向 `/`
- 未登录访问非 `/login` 页面 → 重定向 `/login`

### 2.4 App.vue
- `showTabbar`: `isAuthenticated && route.path !== '/login'`
- 登录后自动调用 `dataStore.loadAllData()`

---

## 三、测试用例

### 模块 A：正向流程

---

#### TC-LOGIN-001 | 新用户注册成功

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-001 |
| **名称** | 新用户注册成功 |
| **严重级** | **P0** |
| **前置条件** | 1. 浏览器已打开应用<br>2. 当前无用户登录<br>3. 数据库中不存在用户名 `newuser01` |
| **操作步骤** | 1. 访问 `/login`<br>2. 点击「注册」Tab<br>3. 用户名输入 `newuser01`<br>4. 密码输入 `password123`<br>5. 昵称输入 `测试昵称`<br>6. 点击「注册账号」按钮 |
| **预期结果** | 1. 显示 Toast「注册成功！已自动登录 💕」<br>2. 页面跳转至 `/`（首页）<br>3. Tabbar 显示（已登录状态）<br>4. localStorage 中 `love-app-current-user` 存在且包含 `username: "newuser01"`、`display_name: "测试昵称"`<br>5. 数据库 `app_users` 表新增一条记录，`password_hash` 为 PBKDF2 哈希值，`salt` 存在 |
| **验证方式** | ✅ 手动测试 + 浏览器 DevTools Application 面板查看 localStorage + Supabase 控制台查看数据 |

---

#### TC-LOGIN-002 | 已有用户登录成功

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-002 |
| **名称** | 已有用户登录成功 |
| **严重级** | **P0** |
| **前置条件** | 1. 浏览器已打开应用<br>2. 当前无用户登录<br>3. 数据库已存在用户 `existinguser`，密码 `correctpass` |
| **操作步骤** | 1. 访问 `/login`<br>2. 确认当前为「登录」Tab<br>3. 用户名输入 `existinguser`<br>4. 密码输入 `correctpass`<br>5. 点击「立即登录」按钮 |
| **预期结果** | 1. 显示 Toast「登录成功 💕」<br>2. 页面跳转至 `/`（首页）<br>3. Tabbar 显示<br>4. localStorage 中 `love-app-current-user` 包含用户完整信息（id, username, display_name, created_at 等）<br>5. `isAuthenticated` 为 `true` |
| **验证方式** | ✅ 手动测试 + DevTools 查看 localStorage + Vue DevTools 查看响应式状态 |

---

#### TC-LOGIN-003 | 已登录用户访问 /login 自动跳转首页

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-003 |
| **名称** | 已登录用户访问 /login 自动跳转首页 |
| **严重级** | **P0** |
| **前置条件** | 1. 用户已登录（localStorage 有 `love-app-current-user`）<br>2. 当前页面为 `/`（首页） |
| **操作步骤** | 1. 在浏览器地址栏输入 `#/login` 并回车<br>2. 或执行 `router.push('/login')` |
| **预期结果** | 1. 页面不显示登录表单<br>2. URL 自动变为 `#/`（首页）<br>3. 首页正常渲染，Tabbar 显示<br>4. 无 Toast 提示，无报错 |
| **验证方式** | ✅ 手动测试 + 观察 URL 变化 + 确认无控制台报错 |

---

#### TC-LOGIN-004 | 用户退出登录

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-004 |
| **名称** | 用户退出登录 |
| **严重级** | **P0** |
| **前置条件** | 1. 用户已登录<br>2. 当前页面为 `/settings`（设置页，有退出登录入口） |
| **操作步骤** | 1. 点击「退出登录」按钮（调用 `logout()`） |
| **预期结果** | 1. `currentUser.value` 变为 `null`<br>2. localStorage 中 `love-app-current-user` 被移除<br>3. `isAuthenticated` 变为 `false`<br>4. 路由自动跳转至 `/login`（触发守卫）<br>5. Tabbar 隐藏 |
| **验证方式** | ✅ 手动测试 + DevTools Application 面板确认 localStorage 已清除 + Vue DevTools 确认状态 |

---

#### TC-LOGIN-005 | 注册时昵称为空，自动使用用户名作为 display_name

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-005 |
| **名称** | 注册时昵称为空，自动使用用户名作为 display_name |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库中不存在用户名 `nonameuser` |
| **操作步骤** | 1. 访问 `/login` → 点击「注册」Tab<br>2. 用户名输入 `nonameuser`<br>3. 密码输入 `password123`<br>4. 昵称留空不填<br>5. 点击「注册账号」 |
| **预期结果** | 1. 注册成功，跳转首页<br>2. 数据库中 `display_name` 字段值为 `nonameuser`（与用户名相同）<br>3. localStorage 中 `display_name` 为 `nonameuser` |
| **验证方式** | ✅ 手动测试 + Supabase 控制台查看 `display_name` 字段 |

---

### 模块 B：反向流程

---

#### TC-LOGIN-006 | 登录时密码错误

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-006 |
| **名称** | 登录时密码错误 |
| **严重级** | **P0** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库已存在用户 `testuser`，密码 `correctpass` |
| **操作步骤** | 1. 访问 `/login`<br>2. 用户名输入 `testuser`<br>3. 密码输入 `wrongpass`<br>4. 点击「立即登录」 |
| **预期结果** | 1. 显示 Toast「账号或密码错误」<br>2. 页面停留在 `/login`<br>3. localStorage 中无 `love-app-current-user`<br>4. `isAuthenticated` 为 `false`<br>5. 密码输入框内容保留（方便修改） |
| **验证方式** | ✅ 手动测试 + 确认 Toast 文案 + DevTools 确认无 localStorage |

---

#### TC-LOGIN-007 | 登录时账号不存在

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-007 |
| **名称** | 登录时账号不存在 |
| **严重级** | **P0** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库中不存在用户名 `ghostuser` |
| **操作步骤** | 1. 访问 `/login`<br>2. 用户名输入 `ghostuser`<br>3. 密码输入 `anypassword`<br>4. 点击「立即登录」 |
| **预期结果** | 1. 显示 Toast「账号或密码错误」（不暴露账号是否存在）<br>2. 页面停留在 `/login`<br>3. localStorage 中无 `love-app-current-user`<br>4. 不显示「账号不存在」等区分性提示 |
| **验证方式** | ✅ 手动测试 + 确认错误提示模糊化处理（安全要求） |

---

#### TC-LOGIN-008 | 未登录访问任意页面跳转登录页

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-008 |
| **名称** | 未登录访问任意页面跳转登录页 |
| **严重级** | **P0** |
| **前置条件** | 1. 当前无用户登录（localStorage 无 `love-app-current-user`） |
| **操作步骤** | 1. 在浏览器地址栏分别输入以下 URL 并回车：<br>   - `#/`<br>   - `#/photo`<br>   - `#/lunch`<br>   - `#/location`<br>   - `#/wish`<br>   - `#/anniversary`<br>   - `#/settings`<br>   - `#/messages-admin` |
| **预期结果** | 1. 所有页面均跳转至 `#/login`<br>2. 登录页正常渲染<br>3. Tabbar 隐藏<br>4. 无控制台报错 |
| **验证方式** | ✅ 手动逐一测试所有路由 + 确认守卫逻辑覆盖全部非登录路由 |

---

#### TC-LOGIN-009 | 注册时网络异常

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-009 |
| **名称** | 注册时网络异常 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 模拟网络断开（DevTools Network 面板设为 Offline 或断开 WiFi） |
| **操作步骤** | 1. 访问 `/login` → 点击「注册」Tab<br>2. 用户名输入 `networkuser`<br>3. 密码输入 `password123`<br>4. 点击「注册账号」 |
| **预期结果** | 1. 显示 Toast「网络异常，请检查网络后重试」<br>2. 页面停留在 `/login`<br>3. localStorage 中无 `love-app-current-user`<br>4. 按钮 loading 状态消失，可重新点击<br>5. 数据库中未创建该用户 |
| **验证方式** | ✅ 手动测试（断网模拟）+ 确认 Toast 文案 + 确认无数据写入 |

---

#### TC-LOGIN-010 | 登录时网络异常

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-010 |
| **名称** | 登录时网络异常 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 模拟网络断开 |
| **操作步骤** | 1. 访问 `/login`<br>2. 用户名输入 `testuser`<br>3. 密码输入 `password123`<br>4. 点击「立即登录」 |
| **预期结果** | 1. 显示 Toast「网络异常，请检查网络后重试」<br>2. 页面停留在 `/login`<br>3. localStorage 中无 `love-app-current-user`<br>4. 按钮 loading 状态消失 |
| **验证方式** | ✅ 手动测试（断网模拟）+ 确认 Toast 文案 |

---

#### TC-LOGIN-011 | 注册时用户名已存在

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-011 |
| **名称** | 注册时用户名已存在 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库已存在用户名 `duplicateuser` |
| **操作步骤** | 1. 访问 `/login` → 点击「注册」Tab<br>2. 用户名输入 `duplicateuser`<br>3. 密码输入 `password123`<br>4. 点击「注册账号」 |
| **预期结果** | 1. 显示 Toast「用户名已被使用，请换一个吧」<br>2. 页面停留在 `/login`<br>3. localStorage 中无 `love-app-current-user`<br>4. 数据库无重复记录 |
| **验证方式** | ✅ 手动测试 + 确认 Toast 文案 + 确认数据库无重复 |

---

### 模块 C：表单校验

---

#### TC-LOGIN-012 | 登录时用户名为空

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-012 |
| **名称** | 登录时用户名为空 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 访问 `/login`，当前为「登录」Tab |
| **操作步骤** | 1. 用户名留空<br>2. 密码输入 `password123`<br>3. 点击「立即登录」 |
| **预期结果** | 1. 显示 Toast「请填写用户名和密码」<br>2. 页面停留在 `/login`<br>3. 不发起网络请求 |
| **验证方式** | ✅ 手动测试 + DevTools Network 面板确认无请求发出 |

---

#### TC-LOGIN-013 | 登录时密码为空

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-013 |
| **名称** | 登录时密码为空 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 访问 `/login`，当前为「登录」Tab |
| **操作步骤** | 1. 用户名输入 `testuser`<br>2. 密码留空<br>3. 点击「立即登录」 |
| **预期结果** | 1. 显示 Toast「请填写用户名和密码」<br>2. 页面停留在 `/login`<br>3. 不发起网络请求 |
| **验证方式** | ✅ 手动测试 + DevTools Network 面板确认无请求发出 |

---

#### TC-LOGIN-014 | 登录时用户名和密码均为空

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-014 |
| **名称** | 登录时用户名和密码均为空 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 访问 `/login`，当前为「登录」Tab |
| **操作步骤** | 1. 用户名留空<br>2. 密码留空<br>3. 点击「立即登录」 |
| **预期结果** | 1. 显示 Toast「请填写用户名和密码」<br>2. 页面停留在 `/login`<br>3. 不发起网络请求 |
| **验证方式** | ✅ 手动测试 + DevTools Network 面板确认无请求发出 |

---

#### TC-LOGIN-015 | 注册时用户名少于 3 个字符

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-015 |
| **名称** | 注册时用户名少于 3 个字符 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 访问 `/login` → 点击「注册」Tab |
| **操作步骤** | 1. 用户名输入 `ab`（2 字符）<br>2. 密码输入 `password123`<br>3. 点击「注册账号」 |
| **预期结果** | 1. 显示 Toast「用户名至少 3 个字符」<br>2. 页面停留在 `/login`<br>3. 不发起网络请求 |
| **验证方式** | ✅ 手动测试 + DevTools Network 面板确认无请求发出 |

---

#### TC-LOGIN-016 | 注册时密码少于 6 位

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-016 |
| **名称** | 注册时密码少于 6 位 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 访问 `/login` → 点击「注册」Tab |
| **操作步骤** | 1. 用户名输入 `validuser`<br>2. 密码输入 `12345`（5 位）<br>3. 点击「注册账号」 |
| **预期结果** | 1. 显示 Toast「密码至少 6 位」<br>2. 页面停留在 `/login`<br>3. 不发起网络请求 |
| **验证方式** | ✅ 手动测试 + DevTools Network 面板确认无请求发出 |

---

#### TC-LOGIN-017 | 注册时用户名和密码均为空

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-017 |
| **名称** | 注册时用户名和密码均为空 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 访问 `/login` → 点击「注册」Tab |
| **操作步骤** | 1. 用户名留空<br>2. 密码留空<br>3. 点击「注册账号」 |
| **预期结果** | 1. 显示 Toast「请填写用户名和密码」<br>2. 页面停留在 `/login`<br>3. 不发起网络请求 |
| **验证方式** | ✅ 手动测试 + DevTools Network 面板确认无请求发出 |

---

#### TC-LOGIN-018 | 注册时用户名为 3 字符边界值

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-018 |
| **名称** | 注册时用户名为 3 字符边界值 |
| **严重级** | **P2** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库中不存在用户名 `abc` |
| **操作步骤** | 1. 访问 `/login` → 点击「注册」Tab<br>2. 用户名输入 `abc`（恰好 3 字符）<br>3. 密码输入 `password123`<br>4. 点击「注册账号」 |
| **预期结果** | 1. 注册成功，跳转首页<br>2. 数据库新增用户记录 |
| **验证方式** | ✅ 手动测试 + 确认边界值通过 |

---

#### TC-LOGIN-019 | 注册时密码为 6 位边界值

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-019 |
| **名称** | 注册时密码为 6 位边界值 |
| **严重级** | **P2** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库中不存在用户名 `boundaryuser` |
| **操作步骤** | 1. 访问 `/login` → 点击「注册」Tab<br>2. 用户名输入 `boundaryuser`<br>3. 密码输入 `123456`（恰好 6 位）<br>4. 点击「注册账号」 |
| **预期结果** | 1. 注册成功，跳转首页<br>2. 数据库新增用户记录 |
| **验证方式** | ✅ 手动测试 + 确认边界值通过 |

---

### 模块 D：数据字段映射验证

---

#### TC-LOGIN-020 | 注册返回用户字段完整性验证

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-020 |
| **名称** | 注册返回用户字段完整性验证 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库中不存在用户名 `fieldcheck` |
| **操作步骤** | 1. 注册新用户 `fieldcheck`，密码 `password123`，昵称 `字段测试`<br>2. 注册成功后检查 localStorage |
| **预期结果** | localStorage 中 `love-app-current-user` 包含以下字段：<br>- `id` (UUID)<br>- `username`: `"fieldcheck"`<br>- `display_name`: `"字段测试"`<br>- `password_hash` (PBKDF2 哈希)<br>- `salt` (Base64 编码)<br>- `created_at` (ISO 时间戳) |
| **验证方式** | ✅ DevTools Application 面板查看 localStorage 数据结构 |

---

#### TC-LOGIN-021 | 登录返回用户字段完整性验证

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-021 |
| **名称** | 登录返回用户字段完整性验证 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库已存在用户 `loginfield`，密码 `password123` |
| **操作步骤** | 1. 使用 `loginfield` 登录<br>2. 登录成功后检查 localStorage |
| **预期结果** | localStorage 中 `love-app-current-user` 包含：<br>- `id`<br>- `username`: `"loginfield"`<br>- `password_hash`<br>- `salt`<br>- `display_name`<br>- `created_at` |
| **验证方式** | ✅ DevTools Application 面板查看 localStorage 数据结构 |

---

#### TC-LOGIN-022 | 注册时 display_name 字段映射正确

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-022 |
| **名称** | 注册时 display_name 字段映射正确 |
| **严重级** | **P1** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库中不存在用户名 `displaymap` |
| **操作步骤** | 1. 注册用户 `displaymap`，密码 `password123`，昵称 `我的昵称`<br>2. 检查数据库和 localStorage |
| **预期结果** | 1. 数据库 `app_users` 表 `display_name` 字段为 `我的昵称`<br>2. localStorage 中 `display_name` 为 `我的昵称`<br>3. 前端读取 `user.display_name` 显示正确 |
| **验证方式** | ✅ 手动测试 + Supabase 控制台 + DevTools 双重验证 |

---

### 模块 E：localStorage CURRENT_USER_KEY 验证

---

#### TC-LOGIN-023 | 注册成功后 localStorage 写入验证

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-023 |
| **名称** | 注册成功后 localStorage 写入验证 |
| **严重级** | **P0** |
| **前置条件** | 1. 当前无用户登录<br>2. localStorage 中无 `love-app-current-user` |
| **操作步骤** | 1. 注册新用户 `localtest`，密码 `password123`<br>2. 注册成功后打开 DevTools → Application → Local Storage |
| **预期结果** | 1. localStorage 中存在 key `love-app-current-user`<br>2. value 为 JSON 字符串，可解析为对象<br>3. 对象包含 `username: "localtest"` |
| **验证方式** | ✅ DevTools Application 面板直接查看 |

---

#### TC-LOGIN-024 | 登录成功后 localStorage 写入验证

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-024 |
| **名称** | 登录成功后 localStorage 写入验证 |
| **严重级** | **P0** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库已存在用户 `localuser`，密码 `password123` |
| **操作步骤** | 1. 使用 `localuser` 登录<br>2. 登录成功后打开 DevTools → Application → Local Storage |
| **预期结果** | 1. localStorage 中存在 key `love-app-current-user`<br>2. value 为 JSON 字符串，可解析为对象<br>3. 对象包含 `username: "localuser"` |
| **验证方式** | ✅ DevTools Application 面板直接查看 |

---

#### TC-LOGIN-025 | 退出登录后 localStorage 清除验证

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-025 |
| **名称** | 退出登录后 localStorage 清除验证 |
| **严重级** | **P0** |
| **前置条件** | 1. 用户已登录<br>2. localStorage 中存在 `love-app-current-user` |
| **操作步骤** | 1. 执行退出登录操作<br>2. 打开 DevTools → Application → Local Storage |
| **预期结果** | 1. localStorage 中 `love-app-current-user` 被移除<br>2. `localStorage.getItem('love-app-current-user')` 返回 `null` |
| **验证方式** | ✅ DevTools Application 面板 + Console 执行 `localStorage.getItem('love-app-current-user')` |

---

#### TC-LOGIN-026 | 页面刷新后登录状态持久化验证

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-026 |
| **名称** | 页面刷新后登录状态持久化验证 |
| **严重级** | **P1** |
| **前置条件** | 1. 用户已登录（localStorage 有 `love-app-current-user`） |
| **操作步骤** | 1. 登录成功后，刷新浏览器页面（F5 / Cmd+R） |
| **预期结果** | 1. 页面加载后仍保持登录状态<br>2. `isAuthenticated` 为 `true`<br>3. 不跳转至 `/login`<br>4. Tabbar 显示<br>5. 首页正常渲染 |
| **验证方式** | ✅ 手动测试 + 确认刷新后状态保持 |

---

#### TC-LOGIN-027 | localStorage 数据格式验证

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-027 |
| **名称** | localStorage 数据格式验证 |
| **严重级** | **P2** |
| **前置条件** | 1. 用户已登录 |
| **操作步骤** | 1. 打开 DevTools → Console<br>2. 执行 `JSON.parse(localStorage.getItem('love-app-current-user'))` |
| **预期结果** | 1. 返回值为对象类型<br>2. 对象包含 `id`, `username`, `display_name`, `password_hash`, `salt`, `created_at` 字段<br>3. 无 `undefined` 或 `null` 关键字段 |
| **验证方式** | ✅ Console 手动验证 |

---

### 模块 F：路由守卫逻辑验证

---

#### TC-LOGIN-028 | 未登录访问首页跳转登录页

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-028 |
| **名称** | 未登录访问首页跳转登录页 |
| **严重级** | **P0** |
| **前置条件** | 1. 当前无用户登录 |
| **操作步骤** | 1. 在浏览器地址栏输入 `#/` 并回车 |
| **预期结果** | 1. URL 变为 `#/login`<br>2. 显示登录表单<br>3. Tabbar 隐藏 |
| **验证方式** | ✅ 手动测试 |

---

#### TC-LOGIN-029 | 未登录访问 /photo 跳转登录页

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-029 |
| **名称** | 未登录访问 /photo 跳转登录页 |
| **严重级** | **P0** |
| **前置条件** | 1. 当前无用户登录 |
| **操作步骤** | 1. 在浏览器地址栏输入 `#/photo` 并回车 |
| **预期结果** | 1. URL 变为 `#/login`<br>2. 显示登录表单 |
| **验证方式** | ✅ 手动测试 |

---

#### TC-LOGIN-030 | 未登录访问 /settings 跳转登录页

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-030 |
| **名称** | 未登录访问 /settings 跳转登录页 |
| **严重级** | **P0** |
| **前置条件** | 1. 当前无用户登录 |
| **操作步骤** | 1. 在浏览器地址栏输入 `#/settings` 并回车 |
| **预期结果** | 1. URL 变为 `#/login`<br>2. 显示登录表单 |
| **验证方式** | ✅ 手动测试 |

---

#### TC-LOGIN-031 | 已登录访问 /login 跳转首页

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-031 |
| **名称** | 已登录访问 /login 跳转首页 |
| **严重级** | **P0** |
| **前置条件** | 1. 用户已登录 |
| **操作步骤** | 1. 在浏览器地址栏输入 `#/login` 并回车 |
| **预期结果** | 1. URL 变为 `#/`<br>2. 显示首页内容<br>3. Tabbar 显示 |
| **验证方式** | ✅ 手动测试 |

---

#### TC-LOGIN-032 | 已登录访问 /login 不会闪烁登录表单

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-032 |
| **名称** | 已登录访问 /login 不会闪烁登录表单 |
| **严重级** | **P2** |
| **前置条件** | 1. 用户已登录 |
| **操作步骤** | 1. 在浏览器地址栏输入 `#/login` 并回车<br>2. 观察页面渲染过程 |
| **预期结果** | 1. 页面直接渲染首页<br>2. 无登录表单短暂出现（无闪烁）<br>3. 守卫在 beforeEach 阶段完成重定向 |
| **验证方式** | ✅ 手动测试 + 观察页面渲染 |

---

#### TC-LOGIN-033 | 守卫逻辑 — 登录后从 /login 跳转到原目标页面

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-033 |
| **名称** | 登录后从 /login 跳转到原目标页面 |
| **严重级** | **P2** |
| **前置条件** | 1. 当前无用户登录<br>2. 数据库已存在用户 `redirectuser`，密码 `password123` |
| **操作步骤** | 1. 直接访问 `#/wish`（被守卫拦截跳转 `/login`）<br>2. 在登录页输入 `redirectuser` / `password123`<br>3. 点击登录 |
| **预期结果** | 1. 登录成功后跳转至 `/`（首页）<br>2. 不自动跳转回 `/wish`（当前实现无 redirect 参数） |
| **验证方式** | ✅ 手动测试 + 确认当前行为（如需记住原目标需额外开发） |

---

### 模块 G：UI/交互验证

---

#### TC-LOGIN-034 | Tab 切换功能

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-034 |
| **名称** | Tab 切换功能 |
| **严重级** | **P2** |
| **前置条件** | 1. 访问 `/login` |
| **操作步骤** | 1. 默认显示「登录」Tab<br>2. 点击「注册」Tab<br>3. 再点击「登录」Tab |
| **预期结果** | 1. 默认「登录」Tab 高亮，显示登录表单<br>2. 点击「注册」后，Tab 高亮切换，显示注册表单<br>3. 点击「登录」后，Tab 高亮切换回登录表单<br>4. 切换时表单内容保留（不重置） |
| **验证方式** | ✅ 手动测试 |

---

#### TC-LOGIN-035 | 登录按钮 loading 状态

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-035 |
| **名称** | 登录按钮 loading 状态 |
| **严重级** | **P2** |
| **前置条件** | 1. 访问 `/login`<br>2. 输入有效用户名和密码 |
| **操作步骤** | 1. 点击「立即登录」<br>2. 观察按钮状态 |
| **预期结果** | 1. 点击后按钮立即进入 loading 状态（显示 loading 动画）<br>2. loading 期间按钮不可再次点击<br>3. 请求完成后 loading 消失<br>4. 成功则跳转，失败则恢复可点击 |
| **验证方式** | ✅ 手动测试 + 观察按钮状态变化 |

---

#### TC-LOGIN-036 | 注册按钮 loading 状态

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-036 |
| **名称** | 注册按钮 loading 状态 |
| **严重级** | **P2** |
| **前置条件** | 1. 访问 `/login` → 点击「注册」Tab<br>2. 输入有效注册信息 |
| **操作步骤** | 1. 点击「注册账号」<br>2. 观察按钮状态 |
| **预期结果** | 1. 点击后按钮立即进入 loading 状态<br>2. loading 期间按钮不可再次点击<br>3. 请求完成后 loading 消失 |
| **验证方式** | ✅ 手动测试 + 观察按钮状态变化 |

---

#### TC-LOGIN-037 | 密码输入框类型为 password（密文显示）

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-037 |
| **名称** | 密码输入框类型为 password（密文显示） |
| **严重级** | **P2** |
| **前置条件** | 1. 访问 `/login` |
| **操作步骤** | 1. 在密码输入框输入文本<br>2. 观察显示 |
| **预期结果** | 1. 输入的密码以圆点/星号显示<br>2. 不可见明文 |
| **验证方式** | ✅ 手动测试 |

---

#### TC-LOGIN-038 | 用户名最大长度限制（20 字符）

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-038 |
| **名称** | 用户名最大长度限制（20 字符） |
| **严重级** | **P2** |
| **前置条件** | 1. 访问 `/login` |
| **操作步骤** | 1. 在用户名输入框尝试输入超过 20 个字符 |
| **预期结果** | 1. 输入框最多接受 20 个字符（`maxlength="20"`）<br>2. 超出部分无法输入 |
| **验证方式** | ✅ 手动测试 |

---

#### TC-LOGIN-039 | 密码最大长度限制（32 字符）

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-039 |
| **名称** | 密码最大长度限制（32 字符） |
| **严重级** | **P2** |
| **前置条件** | 1. 访问 `/login` |
| **操作步骤** | 1. 在密码输入框尝试输入超过 32 个字符 |
| **预期结果** | 1. 输入框最多接受 32 个字符（`maxlength="32"`）<br>2. 超出部分无法输入 |
| **验证方式** | ✅ 手动测试 |

---

#### TC-LOGIN-040 | 提示文字动态切换

| 项目 | 内容 |
|------|------|
| **编号** | TC-LOGIN-040 |
| **名称** | 提示文字动态切换 |
| **严重级** | **P2** |
| **前置条件** | 1. 访问 `/login` |
| **操作步骤** | 1. 观察默认提示文字<br>2. 点击「注册」Tab，观察提示文字<br>3. 点击「登录」Tab，观察提示文字 |
| **预期结果** | 1. 登录 Tab 时显示「还没有账号？点击上方「注册」」<br>2. 注册 Tab 时显示「已有账号？点击上方「登录」」 |
| **验证方式** | ✅ 手动测试 |

---

## 四、测试用例汇总

| 编号 | 名称 | 模块 | 严重级 |
|------|------|------|--------|
| TC-LOGIN-001 | 新用户注册成功 | 正向流程 | P0 |
| TC-LOGIN-002 | 已有用户登录成功 | 正向流程 | P0 |
| TC-LOGIN-003 | 已登录用户访问 /login 自动跳转首页 | 正向流程 | P0 |
| TC-LOGIN-004 | 用户退出登录 | 正向流程 | P0 |
| TC-LOGIN-005 | 注册时昵称为空，自动使用用户名作为 display_name | 正向流程 | P1 |
| TC-LOGIN-006 | 登录时密码错误 | 反向流程 | P0 |
| TC-LOGIN-007 | 登录时账号不存在 | 反向流程 | P0 |
| TC-LOGIN-008 | 未登录访问任意页面跳转登录页 | 反向流程 | P0 |
| TC-LOGIN-009 | 注册时网络异常 | 反向流程 | P1 |
| TC-LOGIN-010 | 登录时网络异常 | 反向流程 | P1 |
| TC-LOGIN-011 | 注册时用户名已存在 | 反向流程 | P1 |
| TC-LOGIN-012 | 登录时用户名为空 | 表单校验 | P1 |
| TC-LOGIN-013 | 登录时密码为空 | 表单校验 | P1 |
| TC-LOGIN-014 | 登录时用户名和密码均为空 | 表单校验 | P1 |
| TC-LOGIN-015 | 注册时用户名少于 3 个字符 | 表单校验 | P1 |
| TC-LOGIN-016 | 注册时密码少于 6 位 | 表单校验 | P1 |
| TC-LOGIN-017 | 注册时用户名和密码均为空 | 表单校验 | P1 |
| TC-LOGIN-018 | 注册时用户名为 3 字符边界值 | 表单校验 | P2 |
| TC-LOGIN-019 | 注册时密码为 6 位边界值 | 表单校验 | P2 |
| TC-LOGIN-020 | 注册返回用户字段完整性验证 | 字段映射 | P1 |
| TC-LOGIN-021 | 登录返回用户字段完整性验证 | 字段映射 | P1 |
| TC-LOGIN-022 | 注册时 display_name 字段映射正确 | 字段映射 | P1 |
| TC-LOGIN-023 | 注册成功后 localStorage 写入验证 | localStorage | P0 |
| TC-LOGIN-024 | 登录成功后 localStorage 写入验证 | localStorage | P0 |
| TC-LOGIN-025 | 退出登录后 localStorage 清除验证 | localStorage | P0 |
| TC-LOGIN-026 | 页面刷新后登录状态持久化验证 | localStorage | P1 |
| TC-LOGIN-027 | localStorage 数据格式验证 | localStorage | P2 |
| TC-LOGIN-028 | 未登录访问首页跳转登录页 | 路由守卫 | P0 |
| TC-LOGIN-029 | 未登录访问 /photo 跳转登录页 | 路由守卫 | P0 |
| TC-LOGIN-030 | 未登录访问 /settings 跳转登录页 | 路由守卫 | P0 |
| TC-LOGIN-031 | 已登录访问 /login 跳转首页 | 路由守卫 | P0 |
| TC-LOGIN-032 | 已登录访问 /login 不会闪烁登录表单 | 路由守卫 | P2 |
| TC-LOGIN-033 | 登录后从 /login 跳转到原目标页面 | 路由守卫 | P2 |
| TC-LOGIN-034 | Tab 切换功能 | UI/交互 | P2 |
| TC-LOGIN-035 | 登录按钮 loading 状态 | UI/交互 | P2 |
| TC-LOGIN-036 | 注册按钮 loading 状态 | UI/交互 | P2 |
| TC-LOGIN-037 | 密码输入框类型为 password（密文显示） | UI/交互 | P2 |
| TC-LOGIN-038 | 用户名最大长度限制（20 字符） | UI/交互 | P2 |
| TC-LOGIN-039 | 密码最大长度限制（32 字符） | UI/交互 | P2 |
| TC-LOGIN-040 | 提示文字动态切换 | UI/交互 | P2 |

---

## 五、严重级定义

| 级别 | 定义 | 说明 |
|------|------|------|
| **P0** | 核心功能阻塞 | 主流程无法通过，必须修复 |
| **P1** | 重要功能异常 | 影响用户体验或数据安全，需尽快修复 |
| **P2** | 次要问题 | 边界情况、UI 细节，可后续优化 |

---

## 六、测试执行建议

1. **冒烟测试**：优先执行全部 P0 用例（TC-001 ~ TC-004, TC-006 ~ TC-008, TC-023 ~ TC-025, TC-028 ~ TC-031），约 15 个用例，覆盖核心链路。
2. **全量回归**：执行全部 40 个用例，确保无回归问题。
3. **网络异常测试**：使用 Chrome DevTools → Network → Offline 模式模拟断网。
4. **localStorage 测试**：每次测试前清理 localStorage，避免数据干扰。
5. **数据库准备**：测试前确认 Supabase 数据库可访问，并准备测试账号。

---

## 七、风险与注意事项

1. **密码安全**：测试时注意 `password_hash` 和 `salt` 不应暴露给前端其他逻辑。
2. **错误提示模糊化**：登录失败统一提示「账号或密码错误」，不区分账号不存在或密码错误，防止枚举攻击。
3. **网络超时**：`supabaseFetch` 设置 15s 超时 + 2 次重试，测试时需考虑慢网络场景。
4. **localStorage 依赖**：应用依赖 localStorage 保持登录状态，需确认浏览器未禁用本地存储。
5. **路由模式**：使用 Hash 模式（`createWebHashHistory`），测试 URL 格式为 `#/path`。

---

*文档结束*
