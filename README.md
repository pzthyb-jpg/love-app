# 💕 小皮爱情助手

专属于女朋友的甜蜜 H5 小程序。

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 📸 **拍照打卡 + 彩虹屁** | 每天中午提醒自拍，拍完一顿猛夸！30+ 基础模板，每次随机组合不一样 |
| 🍽️ **午餐大转盘** | 附近餐厅大转盘，随机决定今天吃什么，支持自定义餐厅列表 |
| ✨ **愿望池** | 许愿 + 吐槽，彩色气泡展示，所有愿望都会闪闪发光 |

## 🎨 风格

参考 Za Bank 设计语言 — **简洁、干净、可爱**
- 柔和的粉紫渐变
- 圆润的卡片式布局
- 流畅的交互动画
- 移动优先设计

## 🛠️ 技术栈

- **前端**: Vue 3 + Vite + Vue Router
- **存储**: localStorage（safeGetJSON/safeSetJSON 模式）
- **PWA**: vite-plugin-pwa
- **样式**: Vant 4 组件库 + CSS 变量体系

## 📁 项目结构

```
love-app/
├── src/                    # 源码目录
│   ├── main.js             # 应用入口
│   ├── App.vue             # 根组件 + 底部导航
│   ├── router/index.js     # 路由配置
│   ├── composables/        # 可组合逻辑（存储/触感/打卡计算）
│   ├── stores/             # 响应式数据层
│   ├── views/              # 页面组件
│   ├── components/         # 通用组件
│   └── assets/styles/      # 全局样式
├── docs/                   # 设计文档
├── package.json
└── vite.config.js
```

## 🚀 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 📐 开发规范

### Git 提交规范
- **每完成一个功能/组件就 commit 一次**，不要攒一堆一起提交
- commit message 格式：`feat: 功能名` / `fix: 修复内容` / `refactor: 重构内容`
- 例：`feat: add Home page with love days counter`
- 例：`feat: implement photo wall component`

### 代码规范
- Vue 3 Composition API + `<script setup>`
- 不引入 UI 组件库，全部手写 CSS
- 组件文件名使用 PascalCase（如 `PhotoWall.vue`）
- composables 文件名使用 useXxx 命名（如 `useStorage.js`）
- 移动优先，以 375-414px 为设计基准，适配至 768px

## 📱 移动端使用

- **iOS Safari**: 打开后点击「分享」→「添加到主屏幕」
- **Android Chrome**: 打开后点击菜单 →「添加到主屏幕」
- 支持 PWA，添加后像原生应用一样使用