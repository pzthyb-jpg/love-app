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

## 🚀 部署

### 方式一：Vercel（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd love-app
vercel --prod
```

### 方式二：GitHub Pages

```bash
# 创建 GitHub 仓库，推送代码
# 在仓库 Settings > Pages 中选择 main 分支
```

### 方式三：本地预览

```bash
# Python 自带服务器
cd love-app
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 📱 移动端使用

- **iOS Safari**: 打开后点击「分享」→「添加到主屏幕」
- **Android Chrome**: 打开后点击菜单 →「添加到主屏幕」
- 支持 PWA，添加后像原生应用一样使用

## 🛠️ 技术栈

- 纯 HTML5 + CSS3 + JavaScript（零依赖）
- Canvas 绘制转盘动画
- localStorage 数据持久化
- Web API：摄像头、通知、地理位置

## 📁 项目结构

```
love-app/
├── index.html          # 主入口
├── manifest.json       # PWA 配置
├── css/
│   └── style.css       # Za Bank 风格样式
├── js/
│   ├── compliments.js  # 彩虹屁引擎
│   ├── photo.js        # 拍照打卡模块
│   ├── lunch.js        # 午餐转盘模块
│   ├── wish.js         # 愿望池模块
│   └── app.js          # 路由和导航
└── docs/
    └── AGENTS.md       # 项目文档
```