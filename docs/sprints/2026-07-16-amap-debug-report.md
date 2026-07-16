# 🗺️ 地图不显示问题 — 排查报告

## 修复状态

| 项目 | 状态 |
|------|------|
| CSP 添加 `'unsafe-eval'` | ✅ 已提交 + 部署 |
| 生产环境确认更新 | ✅ curl 验证通过 |
| 触发 SW 更新 | ✅ precache 清单已刷新 |

---

## 问题现象

```
Uncaught EvalError: Evaluating a string as JavaScript violates the following 
Content Security Policy directive because 'unsafe-eval' is not an allowed source 
of script: script-src 'self' 'unsafe-inline' blob: https://webapi.amap.com ...
```

---

## 根因

**高德地图 JS SDK v1.4.15 内部使用 `new Function()` / `eval()` 动态生成代码来初始化地图引擎。**

CSP 策略 `script-src` 未包含 `'unsafe-eval'` 时，浏览器会阻止这段代码执行，导致地图引擎崩溃，页面表现为：
- 地图容器 `#location-map` 存在但完全空白
- 无地图瓦片、无标记、无交互
- 浏览器控制台持续输出 `EvalError`

---

## 时间线

| 步骤 | 尝试 | 结果 |
|------|------|------|
| 1 | AMap v2.0 → v1.4.15（期望降级解决） | v1.4.15 仍然用 eval ❌ |
| 2 | CSP 添加 `vdata.amap.com` | 样式能加载了，但 eval 仍被阻 ❌ |
| 3 | CSP 添加 `'unsafe-eval'` | 地图渲染流程不再中断 ✅ |

---

## 为什么降级到 v1.4.15 不能解决问题？

在搜索高德文档和社区后发现：
- **v1.4.15 并非完全不用 eval** — 它的 `vectorlayer` 模块在初始化时仍会动态执行代码
- **v1.4.15 的"免 eval"版本**需要额外引入 `AMap.UI` 或使用 `vectorlayer==false` 的打包方式
- 简单降级无法绕过 CSP 限制

---

## 修复代码

```diff
// index.html
- script-src 'self' 'unsafe-inline' blob: https://webapi.amap.com ...
+ script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://webapi.amap.com ...
                                                    ^^^^^^^^^^^
```

---

## 安全影响评估

| 方面 | 影响 |
|------|------|
| `unsafe-eval` 允许 | 页面内可执行动态代码（如 `eval()`、`new Function()`） |
| 风险场景 | 如果页面存在 XSS 漏洞，攻击者可利用 eval 执行任意脚本 |
| 当前风险 | 低 — 页面无用户输入直接拼接 HTML 的场景，`{{ }}` 插值已用 `v-text` 替代 |
| 建议 | 地图组件加载后，可通过 JS 动态移除 CSP meta 标签（限制 eval 仅地图页可用）|

---

## 用户端如何生效

1. **强制刷新页面**: `Cmd + Shift + R`（Mac）/ `Ctrl + Shift + R`（Windows）
2. 或打开 DevTools → Network → 勾选 **Disable cache** → 刷新
3. 或清除浏览器缓存后重新访问

Service Worker 会自动在后台更新 precache 清单，下次访问时即为新版本。

---

## 配套修复（同期）

| 问题 | 修复 |
|------|------|
| 定位链 HTTP 被 Mixed Content 拦截 | `http://ip-api.com` → `https://ip-api.com` |
| 留言字段映射错误 | `content: msg.content \|\| msg.text` |
| 地图样式脚本被 CSP 阻止 | 添加 `vdata.amap.com` |
