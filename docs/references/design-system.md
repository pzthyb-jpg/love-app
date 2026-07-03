# 🎨 设计系统参考 — Design System Reference

> 基于 Vant 4 组件库（Vue 3 移动端）
> 本文件供智能体在设计/编码时作为样式标准参考
> 替代手写 CSS 的低效模式

---

## 一、组件库选型：Vant 4

| 属性 | 值 |
|------|-----|
| **名称** | Vant 4 |
| **适用框架** | Vue 3 |
| **定位** | 移动端 H5 组件库 |
| **维护方** | 有赞 |
| **NPM** | `vant` |
| **文档** | https://vant-ui.github.io/vant/#/zh-CN |
| **许可证** | MIT |
| **按需引入** | 支持（通过 unplugin-vue-components） |
| **国内生态** | 成熟，中文文档，社区活跃 |

### 选型理由

| 对比项 | Vant 4 | Element Plus | NutUI |
|--------|--------|-------------|-------|
| 移动端优先 | ✅ 专为 H5 设计 | ❌ 桌面端 | ✅ |
| Vue 3 支持 | ✅ | ✅ | ✅ |
| 国内生态 | ✅ 有赞，中文文档 | ✅ 饿了么 | ✅ 京东 |
| 包大小 | ⭐⭐⭐⭐ 轻量 | ⭐⭐ 重 | ⭐⭐⭐ |
| 组件丰富度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| PWA 友好 | ✅ | ❌ 偏桌面 | ✅ |

---

## 二、组件映射：手写 → Vant 替换

### 全局组件

| 现有手写组件 | Vant 替代 | 说明 |
|-------------|----------|------|
| `TabBar.vue` | `van-tabbar` + `van-tabbar-item` | 底部导航，图标+文字，完全匹配 |
| `Toast.vue` | `van-toast` | 支持成功/失败/加载/纯文字，API 调用式 |
| `ConfirmDialog.vue` | `van-dialog` | 确认弹窗，支持自定义内容和按钮 |
| `LunchWheel.vue` | 保留手写 | Canvas 转盘，Vant 无对应组件 |

### 页面级组件建议

| 页面 | 建议使用的 Vant 组件 |
|------|---------------------|
| **Home.vue** | `van-grid`（状态三圆）、`van-progress`（周打卡进度）、`van-count-down`（在一起天数动画替代） |
| **Photo.vue** | `van-button`、`van-loading`（摄像头加载骨架屏）、`van-image`（照片墙缩略图）、`van-swipe`（全屏左右滑动） |
| **Lunch.vue** | `van-button`、`van-tag`（餐厅标签）、`van-collapse`（餐厅管理折叠） |
| **Wish.vue** | `van-field`（输入框）、`van-tab`（筛选栏）、`van-action-sheet`（长按操作菜单） |
| **Settings.vue** | `van-form`、`van-field`、`van-picker`（纪念日日期选择）、`van-switch`（通知开关）、`van-cell`（列表项） |
| **MessagesAdmin.vue** | `van-password-input`（密码输入）、`van-number-keyboard`（数字键盘） |

---

## 三、安装与配置

```bash
# 安装 Vant
npm install vant

# 安装按需引入插件
npm install -D unplugin-vue-components
```

### vite.config.js 配置

```javascript
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()]
    }),
    // ... 其他插件
  ]
})
```

按需引入后，在组件中直接使用 `<van-button>`、`<van-toast>` 等标签，插件自动注册，无需手动 import。

---

## 四、样式适配

### CSS 变量覆盖（保持 ZA Bank 风格）

Vant 4 使用 CSS 变量定制主题，可以在 `main.css` 中覆盖：

```css
:root {
  /* Vant 主色调覆盖为我们的粉色 */
  --van-primary-color: #FF6B9D;
  --van-primary-color-light: #FF8DBB;
  --van-primary-color-dark: #E5558A;
  
  /* 圆角覆盖 */
  --van-button-radius: 28px;
  --van-cell-radius: 20px;
  --van-dialog-border-radius: 26px;
  
  /* 字体 */
  --van-font-size-md: 15px;
  --van-font-size-lg: 16px;
  --van-font-weight-bold: 600;
  
  /* 安全区域 */
  --van-tabbar-height: 56px;
}
```

### 不需要删除手写 CSS

Vant 组件和现有 CSS 变量体系可以共存：
- Vant 负责组件级样式（按钮、弹窗、输入框、标签页）
- 手写 CSS 负责页面布局、动画、特殊样式
- 两者通过相同的 CSS 变量体系协调

---

## 五、改造路径

### Phase 1（基础替换，低风险）

```
✅ van-toast     → 替换 Toast.vue（API 调用式更简洁）
✅ van-dialog    → 替换 ConfirmDialog.vue
✅ van-button    → 替换所有手写按钮（统一样式）
✅ van-loading   → 替换 loading 动画
```

### Phase 2（页面集成，中等风险）

```
✅ van-tabbar    → 替换 TabBar.vue（底部导航）
✅ van-field     → 替换 Settings/Wish 的输入框
✅ van-switch    → 替换通知开关
✅ van-cell      → 替换设置页列表项
✅ van-picker    → 替换纪念日日期选择
```

### Phase 3（高级替换，需测试）

```
✅ van-swipe     → 照片墙全屏浏览
✅ van-tab       → 愿望池筛选栏
✅ van-action-sheet → 气泡长按菜单
✅ van-collapse  → 餐厅管理折叠
✅ van-number-keyboard → 留言管理密码键盘
```

---

## 六、注意事项

1. **不要一次性全部替换** — 每替换一个组件就 commit 一次，确保可回退
2. **保留 CSS 变量体系** — Vant 的 CSS 变量覆盖是保持设计一致性的关键
3. **LunchWheel.vue 保留手写** — Canvas 转盘无对应 Vant 组件
4. **TabBar 替换需谨慎** — 涉及路由和页面切换，替换后需完整测试导航流程
5. **Toast API 调用式** — `showToast('成功')` 而非 `<van-toast>` 标签，更简洁

---

> 本参考文档供设计智能体和代码智能体使用
> 每次迭代时据此选择合适的 Vant 组件
> 最后更新：2026-07-03