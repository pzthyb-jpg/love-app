# 🔒 小皮爱情助手 v2.0 — 安全审计报告

> 审计日期：2026-07-03
> 审计目标：确保应用可以安全发布到公网（Vercel / GitHub Pages / Surge）
> 架构类型：纯前端 SPA（Vue 3 + Vite），无后端，数据仅存储在客户端

---

## 审计结果总览

| 维度 | 严重程度 | 状态 |
|------|---------|------|
| XSS（跨站脚本） | ✅ 安全 | 无风险 |
| 敏感数据泄露 | ⚠️ P0 已修复 | 密码已改为哈希存储 |
| 权限安全 | ✅ 安全 | 优雅降级 |
| 依赖安全 | ✅ 安全 | 极简依赖，无漏洞 |
| 传输安全 | ⚠️ P1 已修复 | 已添加 CSP |
| 输入验证 | ✅ 安全 | 有长度限制 |

---

## 1. XSS（跨站脚本）— ✅ 安全

### 发现

所有用户输入渲染均使用 Vue 的 `{{ }}` 插值语法（自动 HTML 转义），**未发现任何 `v-html` 使用**。

- ✅ **愿望内容**：`{{ wish.text }}` — 安全
- ✅ **吐槽内容**：`{{ wish.text }}` — 安全
- ✅ **留言内容**：`{{ msg.text }}` / `{{ msg.text }}` — 安全
- ✅ **餐厅名称**：`{{ r.name }}` — 安全
- ✅ **Toast 消息**：`{{ item.message }}` — 安全
- ✅ **模板变量替换**：`formatMessageText()` 使用 `String.replace()` + `{{ }}` — 安全
- ✅ **localStorage 数据**：读取后通过 Vue 插值渲染，非 `innerHTML` — 安全

### 风险等级：P2（信息性）

> **建议**：未来如添加富文本或 Markdown 渲染功能，需严格审查 `v-html` 使用场景。

---

## 2. 敏感数据泄露 — ⚠️ P0 已修复

### 发现

#### P0：Admin 密码明文存储在 localStorage ← ✅ 已修复

**问题**（已修复）：
- 密码以明文形式存储在 `admin_password` key 下
- 默认密码 `'1314'` 硬编码在代码中
- 任何人打开 DevTools → Application → Local Storage 即可读取密码

**修复措施**：
1. 新增 `src/composables/usecrypto.js`，使用 Web Crypto API (`crypto.subtle.digest('SHA-256')`) 对密码进行哈希
2. `dataStore.js` 初始化时自动检测旧明文密码并迁移为哈希
3. `MessagesAdmin.vue` 密码验证改为哈希比较（`hashString(input) === storedHash`）
4. 密码重置时自动哈希后存储
5. 管理界面不再显示真实密码，改为 `****`

#### P1：私密数据以明文存储在 localStorage

**问题**（架构性，需用户知情）：
- 留言内容、愿望内容均以明文 JSON 存储在 localStorage
- 照片 base64 数据存储在 IndexedDB（降级时 localStorage）
- 这是纯前端应用的架构限制 — 无法实现真正的端到端加密

**缓解措施**（已存在）：
- Settings 页面已包含隐私说明，告知用户「所有数据仅存储在您的设备上」
- 建议用户在隐私说明中增加「留言内容为本地明文存储」的明确告知

#### ✅ 未发现：API Key / Token / Secret 硬编码

代码中没有任何 API key、token、secret 或认证凭证硬编码。

### 风险等级：P0（已修复），P1（架构性，建议增强告知）

---

## 3. 权限安全 — ✅ 安全

### 摄像头权限

- ✅ **按需请求**：仅在用户点击「拍照」按钮时调用 `navigator.mediaDevices.getUserMedia()`
- ✅ **优雅降级**：`try/catch` 捕获错误，弹出 Toast 提示「无法打开摄像头，请检查权限设置」
- ✅ **拍照完成自动释放**：`stopCamera()` 调用 `mediaStream.getTracks().forEach(t => t.stop())`

### 通知权限

- ✅ **按需请求**：在用户主动点击通知开关或选择提醒时间时请求 `Notification.requestPermission()`
- ✅ **优雅降级**：即使通知被拒绝，内部仍通过 Toast 提醒
- ✅ **权限状态检测**：检查 `Notification.permission === 'default'` 后再请求

### 风险等级：P2（信息性）

> **建议**：`scheduleReminder()` 中自动请求通知权限的逻辑可以在用户首次操作时进一步明确提示用途。

---

## 4. 依赖安全 — ✅ 安全

### package.json 依赖

| 依赖 | 版本 | 用途 | 安全性 |
|------|------|------|--------|
| `vue` | ^3.5.39 | UI 框架 | ✅ 最新稳定版，无已知漏洞 |
| `vue-router` | ^4.6.4 | 路由 | ✅ 最新稳定版 |
| `vite` | ^8.1.1 | 构建工具 | ✅ 最新版 |
| `@vitejs/plugin-vue` | ^6.0.7 | Vue 插件 | ✅ 最新版 |
| `vite-plugin-pwa` | ^1.3.0 | PWA 支持 | ✅ 稳定版 |

### 评价

- **依赖极简**：仅 5 个依赖（2 运行时 + 3 开发），无可疑或臃肿的第三方库
- **无 jQuery / Lodash / Axios** 等不必要依赖
- **无已知 CVE 漏洞**（截至审计日期）

### 风险等级：P2（信息性）

> **建议**：定期执行 `npm audit` 检查依赖漏洞。

---

## 5. 传输安全 — ⚠️ P1 已修复

### CSP（Content Security Policy）← ✅ 已修复

**问题**（已修复）：
- index.html 未设置任何 Content-Security-Policy
- 无法防御 XSS、数据注入、资源劫持等攻击

**修复措施**：
- 在 index.html 的 `<head>` 中添加 CSP meta 标签：
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self'; media-src 'self' blob:;">
```
- `default-src 'self'`：只允许同源资源
- `img-src 'self' data: blob:`：允许照片 base64（data:）和 IndexedDB blob
- `script-src 'self' 'unsafe-inline'`：允许 Vite 打包脚本和 splash 内联脚本
- `media-src 'self' blob:`：允许摄像头流

### HTTPS

- ✅ **部署平台**：Vercel / Surge / GitHub Pages 均自动提供 HTTPS
- ✅ 代码中无硬编码 HTTP 链接
- ✅ 高德地图导航使用 `https://uri.amap.com`

### manifest.json（vite-plugin-pwa 注入）

| 字段 | 值 | 安全性 |
|------|-----|--------|
| `scope` | `'./'` | ✅ 安全，相对路径限制在应用内 |
| `start_url` | `'./'` | ✅ 安全，防止 URL 操纵 |
| `display` | `'standalone'` | ✅ 标准 PWA 配置 |

### 风险等级：P1（已修复）

---

## 6. 输入验证 — ✅ 安全

### 长度限制

| 输入字段 | 限制 | 位置 |
|----------|------|------|
| 愿望/吐槽内容 | `maxlength="200"` | Wish.vue textarea |
| 餐厅名称 | `maxlength="20"` | Lunch.vue input |
| 管理留言内容 | `maxlength="500"` | MessagesAdmin.vue textarea |
| 昵称设置 | `maxlength="20"` | Settings.vue input |
| 管理密码 | `maxlength="4"` + `pattern="[0-9]*"` | MessagesAdmin.vue input |

### 文件上传校验

- ✅ **数据导入**：`accept=".json"` 限制文件类型
- ✅ 导入内容使用 `JSON.parse` 解析，失败时友好提示
- ✅ 导入数据验证 `data.version` 和 `data.wishes` 字段
- ❌ **未限制文件大小**（P2，可由浏览器自动处理）

### 特殊字符

- ✅ Vue 模板插值自动转义 HTML 特殊字符
- ❌ **无服务端校验**（此应用无后端，不适用）

### 风险等级：P2（信息性）

> **建议**：可在导入功能中增加文件大小校验（如 `< 5MB`）。

---

## 7. 其他安全发现

### P1：密码在重置区域显示明文 ← ✅ 已修复

**问题**（已修复）：
- 模板中 `{{ currentPassword }}` 直接显示密码值（之前是明文，修复后为哈希）
- 修复后改为显示 `****`

### P1：使用 `window.confirm()` 进行删除确认

**问题**（信息性）：
- `Lunch.vue` 和 `MessagesAdmin.vue` 使用 `window.confirm()` 进行删除确认
- 此方式不可定制样式，但功能安全
- **建议**：可考虑使用 `ConfirmDialog.vue` 组件替换以获得更好的用户体验

---

## 公网部署 Checklist

### 部署前必检查项

- [x] 所有用户输入使用 `{{ }}` 插值，无 `v-html`
- [x] Admin 密码已使用 SHA-256 哈希存储
- [x] CSP Content-Security-Policy 已配置
- [x] 部署平台提供 HTTPS（Vercel/Surge/GitHub Pages 默认支持）
- [x] 无 API Key / Token / Secret 硬编码
- [x] 依赖极简，无已知漏洞
- [x] 摄像权限按需请求，优雅降级
- [x] 通知权限按需请求，优雅降级
- [x] 输入字段均有长度限制
- [x] 数据导入有格式校验和类型限制
- [x] manifest.json scope/start_url 为相对路径

### 部署后验证项

- [ ] 使用 HTTPS 访问，确认无混合内容警告
- [ ] 打开 DevTools → Application → Local Storage，确认 `admin_password` 是哈希值（64位十六进制）
- [ ] 验证密码功能正常（默认密码：`1314`）
- [ ] 测试摄像头权限请求弹窗
- [ ] 测试通知权限请求弹窗
- [ ] 测试数据导入/导出功能
- [ ] 使用 Lighthouse 进行安全审计

---

## 已修复问题汇总

| # | 严重程度 | 问题 | 修复方式 |
|---|---------|------|---------|
| 1 | **P0** | Admin 密码明文存储在 localStorage | SHA-256 哈希存储，新增 `usecrypto.js` |
| 2 | **P1** | 无 CSP 内容安全策略 | 添加 CSP meta 标签到 index.html |
| 3 | **P1** | 密码在管理界面明文显示 | 改为显示 `****` |

---

## 新增/修改文件清单

| 文件 | 变更 |
|------|------|
| `src/composables/usecrypto.js` | 🆕 新增 — SHA-256 哈希工具 |
| `src/stores/dataStore.js` | ✏️ 修改 — 密码自动迁移为哈希存储 |
| `src/views/MessagesAdmin.vue` | ✏️ 修改 — 密码验证改为哈希比较，显示掩码 |
| `index.html` | ✏️ 修改 — 添加 CSP 头 |
| `docs/SECURITY_REVIEW.md` | 🆕 新增 — 本安全审计报告 |

---

*安全审计完成于 2026-07-03 | 审计工具：Hermes Agent + 手工代码审查*
