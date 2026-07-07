# Sprint 2026-07-07 迭代日志

## 迭代范围
- **日期**: 2026年7月7日
- **范围**: Sprint 1-6（安全加固 → 体验修复 → 文案治理 → 无障碍 → 性能跃升 → 功能增强）

---

## 产出清单

### Sprint 1-2: 安全加固 + 体验修复
- PBKDF2-SHA256 密码哈希（16字节随机盐 + 10万迭代）
- 全局错误边界防白屏
- 拍照预览/摄像头权限引导
- 长按进度环 + 操作面板
- showConfirmDialog 替代原生 prompt()
- excludedList/displayedDates 持久化

### Sprint 3-4: UX文案治理 + 无障碍合规
- 全局「您→宝贝」称呼统一
- 默认昵称「泓博→男朋友」
- Emoji前置 + 引号「」统一
- 对比度 3.8:1→5.7:1 (#2E7D32→#1B5E20)
- 图标按钮 aria-label 全覆盖
- prefers-reduced-motion 媒体查询

### Sprint 5-6: 性能跃升 + 功能增强
- App.vue 骨架屏加载
- Photo.vue 缩略图 loading=lazy
- Wish.vue ZIP 完整备份（JSZip）
- App.vue PWA 安装引导横幅
- useReminder 分层推送文案（温柔/撒娇/想念）
- 纪念日/里程碑检测

---

## Commit 记录
- `3f053d2` — Sprint 1-4: 安全加固 + 体验修复 + 文案治理 + 无障碍
- `79775c6` — Sprint 5-6: 性能跃升 + 功能增强
- `50c0aab` — 补全: 推送文案分层 + useReminder 导出

---

## 文档归档

### 调研类 (7份)
- `PRD.md` — 产品需求文档
- `COMPETITIVE_ANALYSIS.md` — 竞品分析
- `TECH_REVIEW.md` — 技术审计
- `UX_AUDIT_REPORT.md` — UX审计报告
- `CROSS_COMPARISON.md` — 交叉对比
- `RESEARCH.md` — 调研汇总
- `SECURITY_REVIEW.md` — 安全审查

### 设计类 (6份)
- `PRODUCT_ROADMAP.md` — 产品路线图
- `UX_TEXT_QA_PROCESS.md` — UX文案QA流程
- `UX_WRITING_QA.md` — UX写作QA
- `DESIGN.md` — 设计文档
- `DESIGN_THINKING.md` — 设计思考
- `REVIEW_DESIGN.md` — 设计评审

### 原型类 (3份)
- `sprint1-2-mock.html` — Sprint 1-2 交互原型
- `sprint3-4-mock.html` — Sprint 3-4 交互原型
- `sprint5-6-mock.html` — Sprint 5-6 交互原型
