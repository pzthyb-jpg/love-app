# 小皮爱情助手 — 用户旅程系统性测试报告

**测试日期**: 2026-07-16  
**测试环境**: GitHub Pages 生产环境 (https://pzthyb-jpg.github.io/love-app/)  
**测试方法**: Playwright 无头浏览器，iPhone 尺寸 (375×812)，完整用户旅程模拟  

---

## 📊 测试总览

| 指标 | 数值 |
|------|------|
| 测试步骤 | 18 |
| 截图证据 | 16 |
| 发现问题 | 6 |
| 严重 (CRITICAL) | 3 |
| 中等 (MEDIUM) | 2 |
| 轻微 (LOW) | 1 |

---

## 🔴 CRITICAL 问题

### [C1] 留言数据无法写入 Supabase（字段映射错误）

- **问题类型**: 数据持久化 / 字段映射
- **现象**: 在 MessageForm.vue 创建留言后，数据未写入 Supabase，重新登录后留言消失
- **根因**: `MessageForm.vue` 发送 `{ text: '内容' }`，但 `useDatabase.js` 的 `addMessage` 期望 `{ content: '内容' }`
- **代码位置**:
  - `src/views/MessageForm.vue` 第100行: `form = reactive({ text: '', ... })`
  - `src/composables/useDatabase.js` 第372行: `content: msg.content` — 收到 `undefined`
- **影响**: 所有留言数据无法保存到数据库
- **修复**: `db.addMessage` 中增加字段映射: `content: msg.content || msg.text || ''`

---

### [C2] 地图完全不渲染（CSP 阻止 AMap 样式脚本）

- **问题类型**: 地图 / CSP 策略
- **现象**: 位置共享页面 `#location-map` 容器存在但无子元素，地图空白
- **根因**: AMap v1.4.15 需要从 `https://vdata.amap.com` 加载地图样式，但 CSP `script-src` 未包含此域名
- **Console 错误**: `Loading the script 'https://vdata.amap.com/style?v=1.4.30&key=...' violates the following Content Security Policy directive`
- **代码位置**: `index.html` 第10行 CSP 策略
- **影响**: 位置共享功能完全不可用
- **修复**: CSP `script-src` 添加 `https://vdata.amap.com`

---

### [C3] 定位链被 HTTPS Mixed Content 策略完全阻断

- **问题类型**: 网络 / 定位
- **现象**: 使用 GitHub Pages (HTTPS) 时，`http://ip-api.com` 请求被浏览器自动阻止
- **根因**: `useLocation.js` 第42行使用 `http://ip-api.com/json/?lang=zh-CN`，HTTPS 页面不允许混合内容
- **Console 错误**: `Mixed Content: The page at '...' was loaded over HTTPS, but requested an insecure resource 'http://ip-api.com/...'`
- **影响**: 午餐页面、位置页面无法获取用户城市，附近餐厅/位置共享全部失效
- **修复**: 改为 `https://ip-api.com/json/?lang=zh-CN`（ip-api 支持 HTTPS）

---

## 🟡 MEDIUM 问题

### [M1] 404 资源加载失败

- **问题类型**: 资源加载
- **现象**: 页面加载时有一个 404 请求
- **根因**: 可能是 favicon 或某个动态导入的 chunk 文件
- **影响**: 控制台有错误但不影响功能
- **待排查**: 需要进一步确认具体是哪个 URL

---

### [M2] 愿望清单页面无明确的添加按钮

- **问题类型**: UI / 导航
- **现象**: Wish.vue 页面没有 FAB 按钮，只有一个 `van-button` 在卡片内
- **根因**: 设计时改用了按钮而非 FAB，但按钮不够醒目
- **影响**: 用户可能找不到添加入口
- **建议**: 改为 FAB 浮动按钮或更醒目的添加入口

---

## 🟢 LOW 问题

### [L1] 设置页退出登录后无明确确认

- **问题类型**: UX / 反馈
- **现象**: 点击退出登录后直接跳转，无确认弹窗
- **影响**: 用户可能误触退出
- **建议**: 增加 `showConfirm` 确认弹窗

---

## 📸 截图证据

| 步骤 | 截图 | 说明 |
|------|------|------|
| 1 | `/tmp/uj3-1-1-login.png` | 登录页 ✅ |
| 2 | `/tmp/uj3-2-2-register.png` | 注册表单 ✅ |
| 3 | `/tmp/uj3-3-3-after-register.png` | 注册成功跳转首页 ✅ |
| 4 | `/tmp/uj3-4-4-home.png` | 首页打卡 ✅ |
| 5 | `/tmp/uj3-5-5-checkin.png` | 打卡后状态 ✅ |
| 6 | `/tmp/uj3-6-6-wishlist.png` | 愿望清单（无 FAB）⚠️ |
| 7 | `/tmp/uj3-7-7-messages.png` | 留言列表 ✅ |
| 8 | `/tmp/uj3-8-8-anniversary.png` | 纪念日列表 ✅ |
| 9 | `/tmp/uj3-9-9-add-anniversary.png` | 添加纪念日表单 ✅ |
| 10 | `/tmp/uj3-10-10-location.png` | 位置共享（地图空白）❌ |
| 11 | `/tmp/uj3-11-11-lunch.png` | 午餐页面（城市可见）✅ |
| 12 | `/tmp/uj3-12-12-settings.png` | 设置页 ✅ |
| 13 | `/tmp/uj3-13-13-logout.png` | 退出登录 ✅ |
| 14 | `/tmp/uj3-14-14-after-login.png` | 重新登录 ✅ |

---

## 🔍 根因分析：为什么之前没发现这些问题？

### 问题类别 1: CSP / HTTPS 混合内容（C2, C3）
- **为什么没发现**: 本地开发使用 `http://localhost:5173`，不存在 Mixed Content 问题；CSP 在本地 dev server 下不生效
- **教训**: **必须在生产环境（HTTPS）下做最终验证**，本地 HTTP 环境无法暴露 Mixed Content 和 CSP 问题

### 问题类别 2: 字段映射不匹配（C1）
- **为什么没发现**: 之前测试只验证了"注册/登录"流程，没有端到端测试"创建数据→验证数据持久化"
- **教训**: **每个 CRUD 操作都必须验证写入→读取全链路**，不能只验证 API 返回 200

### 问题类别 3: 地图渲染（C2）
- **为什么无头浏览器没发现**: Playwright 无头浏览器没有 GPS 权限，地图初始化逻辑在 GPS 失败时直接显示权限提示，跳过了地图渲染
- **教训**: **无头浏览器无法测试 GPS/摄像头等硬件 API**，需要 mock 或手动测试

---

## 🛠️ 修复优先级

| 优先级 | 问题 | 预计修复时间 |
|--------|------|-------------|
| P0 | [C3] ip-api HTTP → HTTPS | 1 行代码 |
| P0 | [C2] CSP 添加 vdata.amap.com | 1 行代码 |
| P0 | [C1] MessageForm 字段映射 | 1 行代码 |
| P1 | [M1] 排查 404 资源 | 5 分钟 |
| P2 | [M2] 愿望清单 FAB 优化 | 10 分钟 |
| P3 | [L1] 退出确认弹窗 | 5 分钟 |

---

## 📝 经验总结（可更新到 Skill）

### 测试覆盖原则
1. **生产环境验证**: 本地 HTTP ≠ 生产 HTTPS，CSP/Mixed Content 必须在生产环境测试
2. **全链路数据验证**: 创建数据后必须重新拉取/刷新页面确认数据持久化
3. **字段映射审计**: 前后端字段名不一致是常见 bug，需要建立字段映射表
4. **无头浏览器限制**: GPS/摄像头/通知等 API 无法在无头浏览器中测试，需要 mock 或手动
5. **CSP 完整性**: 引入第三方脚本时，必须检查 CSP 是否包含其所有域名（包括子域名如 vdata.amap.com）
