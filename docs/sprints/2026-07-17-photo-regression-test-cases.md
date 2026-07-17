# 拍照功能回归测试案例

> 功能模块：Photo.vue（拍照打卡）  
> 编写日期：2026-07-17  
> 覆盖版本：v1.0  
> 测试范围：正向流程 / 反向流程 / 数据映射 / UI 渲染 / 持久化 / 边界条件

---

## 📋 测试环境说明

| 项目 | 说明 |
|------|------|
| 目标文件 | `src/views/Photo.vue` |
| 关联文件 | `src/composables/useDatabase.js`（getCheckins / addCheckin）、`src/stores/dataStore.js` |
| 运行条件 | 已登录用户（`currentUser` 不为空），摄像头可用 |
| 涉及字段映射 | `photo_url` ↔ `photo`、`compliment` → `note`、`time` → `checkin_time` |
| 浏览器要求 | Chrome / Safari / Firefox（需支持 `getUserMedia` + Canvas） |

---

## 一、正向流程测试

### PHOTO-P-001 | 完整拍照打卡流程

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-P-001 |
| **名称** | 完整拍照打卡流程（拍照 → 预览 → 确认打卡 → 打卡成功） |
| **前置条件** | 1. 用户已登录；2. 设备有前置/后置摄像头；3. 已授予摄像头权限；4. 今天未打卡 |
| **严重级** | **P0** |
| **操作步骤** | 1. 打开 Photo 页面<br>2. 确认摄像头状态为 `idle`，显示 "📸 咔嚓拍照" 按钮<br>3. 点击 "📸 咔嚓拍照" 按钮<br>4. 确认状态变为 `opening`，显示 loading 动画<br>5. 等待摄像头就绪，确认状态变为 `ready`，显示 video 预览<br>6. 点击 "📸 咔嚓！拍照" 按钮<br>7. 确认生成照片预览，同时显示随机彩虹屁文字<br>8. 确认预览界面显示 "重拍" 和 "确认打卡" 按钮<br>9. 点击 "✅ 确认打卡" 按钮<br>10. 确认 toast 提示 "🎉 打卡成功！"<br>11. 确认页面恢复正常初始状态 |
| **预期结果** | 1. `cameraState` 从 `idle → opening → ready → preview → idle`（成功打卡后重置）<br>2. 照片以 JPEG dataURL 形式保存（质量 0.7，尺寸 540×540）<br>3. `addCheckin` 被调用，参数包含 `date`（今天）、`time`（当前 HH:MM）、`photo`（dataURL）、`compliment`（生成的彩虹屁）、`timestamp`（毫秒时间戳）<br>4. `state.checkinHistory` 头部新增一条记录<br>5. 连续打卡天数正确更新<br>6. 如果达到里程碑，显示成就庆祝弹窗 |
| **验证方式** | 自动：单元测试验证 `cameraState` 转换、`addCheckin` 调用参数<br>手动：人工走查完整流程<br>数据层：检查 Supabase `checkins` 表是否新增记录 |

---

### PHOTO-P-002 | 重拍照片

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-P-002 |
| **名称** | 重拍照片（preview → 重新打开摄像头 → 再次拍照） |
| **前置条件** | 1. 用户已登录；2. 已完成第一次拍照，当前处于 `preview` 状态 |
| **严重级** | **P1** |
| **操作步骤** | 1. 在 preview 界面点击 "📸 重拍" 按钮<br>2. 确认状态回到 `opening`，loading 动画出现<br>3. 等待摄像头重新打开<br>4. 再次点击 "📸 咔嚓！拍照"<br>5. 确认新照片覆盖旧照片，彩虹屁重新生成 |
| **预期结果** | 1. `capturedPhoto` 被清空后置为新照片<br>2. `compliment` 被重新生成<br>3. `cameraState` 正确流转：`preview → opening → ready → preview`<br>4. 旧 MediaStream 被正确释放，新流正常获取 |
| **验证方式** | 截图对比前后照片；检查 MediaStream 引用是否更新 |

---

### PHOTO-P-003 | 再拍一张（captured 状态）

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-P-003 |
| **名称** | captured 状态下再拍一张 |
| **前置条件** | 1. 用户已登录；2. 当前处于 `captured` 状态（注：代码中 captured 状态时间极短，实际会快速进入 preview，此处测试逻辑覆盖） |
| **严重级** | **P2** |
| **操作步骤** | 1. 在 captured 状态下点击 "📸 再拍一张"<br>2. 确认调用 `retakePhoto()` 函数 |
| **预期结果** | 1. `cameraState` 变为 `opening`<br>2. `capturedPhoto` 清空为 null<br>3. `compliment` 清空为空字符串<br>4. 重新调用 `openCamera()` |
| **验证方式** | 单元测试：mock `retakePhoto` 调用后验证状态重置 |

---

### PHOTO-P-004 | 查看照片墙

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-P-004 |
| **名称** | 照片墙展示最近 14 天打卡照片 |
| **前置条件** | 1. 用户已登录；2. 过去 14 天内有多条带 photo 的打卡记录 |
| **严重级** | **P1** |
| **操作步骤** | 1. 打开 Photo 页面<br>2. 滚动到照片墙区域<br>3. 确认 PhotoWall 组件正确渲染<br>4. 验证照片数量不超过 14 张<br>5. 确认照片按日期倒序排列 |
| **预期结果** | 1. `recentPhotos` 计算属性返回 `state.checkinHistory` 中过去 14 天含 photo 的记录<br>2. 最多显示 14 张照片<br>3. 照片仅展示有 `photo` 字段的打卡记录<br>4. 日期显示格式正确 |
| **验证方式** | Mock checkinHistory 数据，验证 `recentPhotos` 过滤逻辑；手动检查 UI |

---

### PHOTO-P-005 | 全屏照片浏览

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-P-005 |
| **名称** | 点击照片进入全屏浏览模式 |
| **前置条件** | 1. 用户已登录；2. 照片墙有至少 1 张照片 |
| **严重级** | **P1** |
| **操作步骤** | 1. 点击照片墙中任意一张照片<br>2. 确认 GalleryOverlay 弹出<br>3. 验证初始显示的照片与点击的一致<br>4. 点击关闭按钮或遮罩层<br>5. 确认 GalleryOverlay 关闭 |
| **预期结果** | 1. `galleryOpen` 变为 true<br>2. `galleryPhotos` 包含所有 recentPhotos 映射后的数据（`{photo, date, compliment}`）<br>3. `galleryIndex` 为点击的照片索引<br>4. 关闭后 `galleryOpen` 回到 false |
| **验证方式** | 自动：单元测试验证 `openGallery` 函数的参数传递<br>手动：点击照片验证全屏展示 |

---

### PHOTO-P-006 | 成就徽章庆祝动画

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-P-006 |
| **名称** | 达成连续打卡里程碑时显示成就庆祝弹窗 |
| **前置条件** | 1. 用户已登录；2. 当前连续打卡天数即将达到里程碑（如 7 天、30 天、100 天）；3. 明天未打卡 |
| **严重级** | **P1** |
| **操作步骤** | 1. 完成今日打卡（使连续天数达到里程碑值）<br>2. 确认达成新徽章<br>3. 验证庆祝弹窗弹出（celebration-box）<br>4. 确认弹窗显示徽章 emoji、名称、连续天数<br>5. 点击 "太棒了！❤️" 按钮<br>6. 确认弹窗关闭 |
| **预期结果** | 1. `checkMilestone` 返回新的里程碑对象<br>2. `addBadge` 被调用，徽章加入用户统计<br>3. `showCelebration` 为 true，弹窗显示<br>4. `newBadge` 包含 `{emoji, days, name}`<br>5. 触发 `HAPTIC_PATTERNS.ACHIEVEMENT` 震动反馈<br>6. 关闭后 `showCelebration` 归位 false，`newBadge` 归位 null |
| **验证方式** | Mock `calculateStreak` 使连续天数达到里程碑阈值；单元测试验证弹窗逻辑 |

---

## 二、反向流程测试

### PHOTO-N-001 | 摄像头权限拒绝

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-N-001 |
| **名称** | 摄像头权限被拒绝（用户/系统拒绝） |
| **前置条件** | 1. 用户已登录；2. 浏览器已拒绝摄像头权限（或 mock `getUserMedia` 抛出异常） |
| **严重级** | **P0** |
| **操作步骤** | 1. 打开 Photo 页面<br>2. 点击 "📸 咔嚓拍照"<br>3. 模拟浏览器拒绝摄像头权限（`getUserMedia` 抛出 `NotAllowedError` 或 `DOMException`）<br>4. 确认状态变化 |
| **预期结果** | 1. `openCamera` catch 块触发<br>2. `cameraState` 恢复为 `idle`（不卡在 `opening`）<br>3. `showCameraGuide` 变为 true，显示相机权限引导弹窗<br>4. 页面不崩溃，视频区域保持占位状态<br>5. 用户可以查看使用说明并引导去设置 |
| **验证方式** | 自动：mock `navigator.mediaDevices.getUserMedia` 抛出异常，验证 `cameraState` 回退<br>手动：在浏览器中手动拒绝权限 |

---

### PHOTO-N-002 | 无摄像头设备

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-N-002 |
| **名称** | 设备无摄像头（getUserMedia 抛出 NotFoundError） |
| **前置条件** | 1. 用户已登录；2. 设备无摄像头或摄像头不可用 |
| **严重级** | **P1** |
| **操作步骤** | 1. 在桌面浏览器（无摄像头）中打开 Photo 页面<br>2. 点击拍照按钮<br>3. 确认 `getUserMedia` 抛出 `NotFoundError` 或 `OverconstrainedError`<br>4. 观察页面响应 |
| **预期结果** | 1. 状态回退到 `idle`<br>2. 显示 CameraGuideModal 权限引导弹窗<br>3. 不会持续 loading 或页面假死<br>4. 用户可手动关闭引导弹窗 |
| **验证方式** | mock `getUserMedia` 抛出 `NotFoundError`，验证状态回退和弹窗 |

---

### PHOTO-N-003 | 未登录用户访问

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-N-003 |
| **名称** | 未登录用户访问 Photo 页面 |
| **前置条件** | 1. 用户未登录（`currentUser` 为 null）；2. 通过 URL 直接访问 Photo 页面 |
| **严重级** | **P0** |
| **操作步骤** | 1. 清除 localStorage 中的用户信息<br>2. 刷新页面或跳转至 Photo 页面<br>3. 观察页面渲染 |
| **预期结果** | 1. 页面正常渲染，不报错<br>2. 照片墙为空（`recentPhotos` 返回空数组）<br>3. 点击拍照按钮时：`addCheckin` 返回 `{ error: { message: '未登录' } }`<br>4. `dataStore.addCheckin` 调用时由于 `db.addCheckin` 返回错误，显示错误 toast<br>5. 摄像头流可以正常打开/关闭（前置操作不依赖登录状态） |
| **验证方式** | mock `currentUser` 为 null；验证 `addCheckin` 不执行插入；检查 toast 提示"未登录"或相关错误 |

---

### PHOTO-N-004 | 网络异常（Supabase 不可达）

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-N-004 |
| **名称** | 网络异常时打卡操作 |
| **前置条件** | 1. 用户已登录；2. 网络断开或 Supabase 服务不可用 |
| **严重级** | **P0** |
| **操作步骤** | 1. 完成拍照流程至预览状态<br>2. 点击确认打卡<br>3. 模拟网络断开（Supabase POST 请求超时）<br>4. 确认 15s 超时后结果 |
| **预期结果** | 1. `supabaseFetch` 重试 2 次后抛出异常<br>2. `db.addCheckin` 返回 `{ error: { message: '网络异常，请检查网络后重试' } }`<br>3. `dataStore.addCheckin` 显示 fail toast<br>4. `state.checkinHistory` 不新增记录<br>5. 预览照片保留，用户可重试 |
| **验证方式** | mock `fetch` 抛出网络错误；验证重试机制（3 次请求）；验证 toast 错误提示 |

---

### PHOTO-N-005 | 存储空间不足（可选）

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-N-005 |
| **名称** | 本地存储空间不足时保存打卡记录 |
| **前置条件** | 1. 用户已登录；2. localStorage 配额已满（注：本应用主要使用 Supabase 存储，此场景接近极限环境） |
| **严重级** | **P2** |
| **操作步骤** | 1. 完成拍照确认打卡<br>2. 模拟 Supabase 返回 413 或 507 错误 |
| **预期结果** | 1. `addCheckin` 返回错误<br>2. 显示 fail toast<br>3. 照片数据不丢失（仍存在于 `capturedPhoto`）<br>4. 用户可手动重试 |
| **验证方式** | mock Supabase 返回空间不足错误码 |

---

### PHOTO-N-006 | 连续快速点击拍照按钮

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-N-006 |
| **名称** | 连续快速点击拍照按钮（防抖/竞态） |
| **前置条件** | 1. 用户已登录；2. 摄像头已就绪（`ready` 状态） |
| **严重级** | **P2** |
| **操作步骤** | 1. 在 `ready` 状态下快速连续点击 "📸 咔嚓！拍照" 按钮 5 次<br>2. 观察页面行为和 `takePhoto` 调用次数 |
| **预期结果** | 1. 代码中 `takePhoto` 每次触发都会执行 `canvas.toDataURL`，可能生成多张照片但只有最后一次生效<br>2. 第一次点击后状态进入 `preview`，按钮消失<br>3. 不会产生多个 canvas 元素残留<br>4. MediaStream 仅被停止一次 |
| **验证方式** | 快速连续点击，确认仅生成一张照片；检查 DOM 无多余 canvas |

---

### PHOTO-N-007 | 打卡过程中刷新页面

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-N-007 |
| **名称** | 打卡确认前刷新页面（数据丢失验证） |
| **前置条件** | 1. 用户已登录；2. 已完成拍照，处于 `preview` 状态，彩虹屁已生成 |
| **严重级** | **P1** |
| **操作步骤** | 1. 在 preview 状态下点击浏览器刷新<br>2. 确认页面重新加载 |
| **预期结果** | 1. `capturedPhoto` 和 `compliment` 不持久化（内存重置）<br>2. `cameraState` 回到 `idle`<br>3. MediaStream 未释放（浏览器层通常会自动回收）<br>4. `stopCamera` 在 `onUnmounted` 中调用（如果 Vue 触发 unmount 钩子） |
| **验证方式** | 手动刷新；确认无残留 MediaStream 调用 `console.log` 警告 |

---

## 三、数据映射验证

### PHOTO-D-001 | photo_url ↔ photo 字段映射（getCheckins）

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-D-001 |
| **名称** | getCheckins 返回数据 photo_url → photo 字段映射正确 |
| **前置条件** | 1. 用户已登录；2. Supabase `checkins` 表有 `photo_url` 字段的记录 |
| **严重级** | **P0** |
| **操作步骤** | 1. 调用 `db.getCheckins()`<br>2. 检查返回数据的字段名 |
| **预期结果** | 1. 返回数组每条记录包含 `photo` 字段（映射自 `photo_url`）<br>2. 若 `photo_url` 为 null，则 `photo` 也为 null<br>3. 其他字段（`id`, `user_id`, `date`, `type`, `note`, `checkin_time`）保留原值 |
| **验证方式** | 自动：mock Supabase 返回 `[{id:1, photo_url:"https://...", date:"2026-07-17"}]`，验证输出包含 `photo:"https://..."` |

---

### PHOTO-D-002 | compliment → note 字段映射（addCheckin）

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-D-002 |
| **名称** | addCheckin 中 compliment 合并到 note 字段 |
| **前置条件** | 1. 用户已登录；2. 传入 `compliment` 参数 |
| **严重级** | **P0** |
| **操作步骤** | 1. 调用 `addCheckin({ date, time, photo, compliment: "你的眼睛真美" })`<br>2. 检查发送到 Supabase 的 body |
| **预期结果** | 1. `note` 字段值为 `"💬 你的眼睛真美"`（前缀 emoji）<br>2. 若已有 `note` 参数，格式为 `"原有note/n/n💬 你的眼睛真美"`<br>3. `compliment` 字段不直接发送给后端（无独立列） |
| **验证方式** | 自动：mock fetch，检查 POST body 的 `note` 字段 |

---

### PHOTO-D-003 | time → checkin_time 字段映射

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-D-003 |
| **名称** | addCheckin 中 time 映射到 checkin_time 列 |
| **前置条件** | 1. 用户已登录；2. 传入 `time` 参数（格式 HH:MM） |
| **严重级** | **P0** |
| **操作步骤** | 1. 调用 `addCheckin({ date: "2026-07-17", time: "14:30", photo, compliment })`<br>2. 验证请求 body |
| **预期结果** | 1. body 包含 `checkin_time: "14:30"`<br>2. 若未传入 `time` 但有 `timestamp`，则 `checkin_time` 由 `timestamp` 自动转换 |
| **验证方式** | 自动：检查 fetch body；边界测试：仅有 timestamp 无 time 的场景 |

---

### PHOTO-D-004 | photo → photo_url 字段映射（addCheckin 写入）

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-D-004 |
| **名称** | addCheckin 中前端 photo 字段正确映射到后端 photo_url |
| **前置条件** | 1. 用户已登录；2. 传入 `photo` 参数（dataURL 格式） |
| **严重级** | **P0** |
| **操作步骤** | 1. 调用 `addCheckin({ date, photo: "data:image/jpeg;base64,..." })`<br>2. 验证发送的 body |
| **预期结果** | 1. body 包含 `photo_url: "data:image/jpeg;base64,..."`<br>2. 兼容旧代码：若传入 `photo_url` 字段也可正确处理（`record.photo_url || record.photo`） |
| **验证方式** | mock fetch 检查 POST body 中的 `photo_url` |

---

### PHOTO-D-005 | addCheckin 返回数据回写 checkinHistory

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-D-005 |
| **名称** | dataStore.addCheckin 成功后数据正确插入 checkinHistory |
| **前置条件** | 1. 用户已登录；2. `db.addCheckin` 成功返回 `{ data: {...} }` |
| **严重级** | **P1** |
| **操作步骤** | 1. 调用 `dataStore.addCheckin(record)`<br>2. 等待异步完成<br>3. 检查 `state.checkinHistory` |
| **预期结果** | 1. `state.checkinHistory` 头部（index 0）为返回的 record<br>2. 触发 `recalculateStreak()` 更新连续打卡统计<br>3. 显示 success toast "✅ 打卡成功" |
| **验证方式** | mock `db.addCheckin` 返回测试数据，验证数组头部插入；mock `recalculateStreak` 验证是否被调用 |

---

## 四、UI 渲染验证

### PHOTO-U-001 | 初始状态（idle）渲染

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-U-001 |
| **名称** | 初始状态 UI 渲染正确 |
| **前置条件** | 1. 用户已登录；2. 首次打开 Photo 页面 |
| **严重级** | **P1** |
| **操作步骤** | 1. 加载 Photo 页面<br>2. 观察初始 UI |
| **预期结果** | 1. 显示页面标题 "📸 拍照打卡"<br>2. 日期卡片显示当前日期（格式："2026年7月17日 星期X"）<br>3. 预览区域显示占位符（📸 + "点击下方按钮开始拍照"）<br>4. 摄像头状态区域显示 "📸 咔嚓拍照" 按钮<br>5. 提醒设置卡片正常渲染<br>6. 彩虹屁卡片正常渲染<br>7. 照片墙区域正常渲染（可能为空态） |
| **验证方式** | 手动截图对比；自动化测试通过选择器验证元素存在 |

---

### PHOTO-U-002 | 摄像头就绪（ready）状态渲染

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-U-002 |
| **名称** | 摄像头就绪状态 UI |
| **前置条件** | 1. 用户已登录；2. 摄像头权限已授予 |
| **严重级** | **P1** |
| **操作步骤** | 1. 点击 "📸 咔嚓拍照"<br>2. 等待摄像头打开<br>3. 观察 ready 状态的 UI |
| **预期结果** | 1. 预览区域显示 `<video>` 元素，视频流正常播放<br>2. video 元素包含 `autoplay` 和 `playsinline` 属性<br>3. video 的 `srcObject` 指向 MediaStream<br>4. 按钮变为 "📸 咔嚓！拍照"<br>5. preview area 尺寸固定 280px 高度，object-fit: cover |
| **验证方式** | 手动检查；验证 video 元素的属性 |

---

### PHOTO-U-003 | 照片预览（preview）状态渲染

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-U-003 |
| **名称** | 照片预览状态 UI |
| **前置条件** | 1. 用户已登录；2. 已完成拍照，处于 preview 状态 |
| **严重级** | **P1** |
| **操作步骤** | 1. 拍照完成后进入 preview<br>2. 验证 UI 元素 |
| **预期结果** | 1. 预览区显示拍摄的图片（`<img>` 元素，src 为 dataURL）<br>2. 图片下方有半透明渐变遮罩层（`preview-overlay`）<br>3. 遮罩层显示彩虹屁文字，字体白色居中<br>4. 两个按钮："📸 重拍" 和 "✅ 确认打卡"<br>5. 图片和预览容器各占 100% 宽高 |
| **验证方式** | 截图验证布局；检查 overlay 位置（absolute bottom） |

---

### PHOTO-U-004 | 照片墙空态

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-U-004 |
| **名称** | 照片墙无照片时的空态渲染 |
| **前置条件** | 1. 用户已登录；2. 过去 14 天内无任何带 photo 的打卡记录 |
| **严重级** | **P2** |
| **操作步骤** | 1. 确保 `recentPhotos` 为空数组<br>2. 打开 Photo 页面<br>3. 观察 PhotoWall 组件 |
| **预期结果** | 1. PhotoWall 组件渲染（可能显示空态提示）<br>2. 不报错<br>3. 其他区域正常渲染 |
| **验证方式** | 清空检查数据后加载；验证空数组传入 PhotoWall 的行为 |

---

### PHOTO-U-005 | 今日已打卡状态显示

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-U-005 |
| **名称** | 今日已打卡时 UI 反馈 |
| **前置条件** | 1. 用户已登录；2. 今天已有一条打卡记录 |
| **严重级** | **P2** |
| **操作步骤** | 1. 在今天已打卡的情况下打开 Photo 页面<br>2. 查看页面是否有已打卡提示 |
| **预期结果** | 1. `ComplimentCard` 组件显示当前彩虹屁和时间<br>2. 照片墙包含今天打卡的照片<br>3. 页面逻辑不阻止重复打卡（当前实现允许） |
| **验证方式** | 手动模拟当天打卡场景；或通过 `dataStore.addQuickCheckin` 快速打卡后查看 |

---

### PHOTO-U-006 | 成就庆祝弹窗

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-U-006 |
| **名称** | 成就庆祝弹窗 UI |
| **前置条件** | 1. 用户已登录；2. 打卡后触发里程碑 |
| **严重级** | **P2** |
| **操作步骤** | 1. 触发里程碑成就<br>2. 验证弹窗 UI |
| **预期结果** | 1. 弹窗通过 `<Teleport to="body">` 挂载到 body<br>2. 遮罩层 `dialog-overlay` 覆盖全屏<br>3. 弹窗居中显示<br>4. 显示徽章 emoji（64px，bounceIn 动画）<br>5. 显示 "🎉 成就达成！" 标题<br>6. 显示连续天数和徽章名称<br>7. 点击 "太棒了！❤️" 或遮罩关闭 |
| **验证方式** | 触发里程碑后截图；点击遮罩验证关闭逻辑 |

---

## 五、持久化验证

### PHOTO-S-001 | 打卡数据持久化到 Supabase

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-S-001 |
| **名称** | 打卡数据成功持久化到 Supabase |
| **前置条件** | 1. 用户已登录；2. 网络正常；3. Supabase 服务可用 |
| **严重级** | **P0** |
| **操作步骤** | 1. 完成完整的拍照打卡流程<br>2. 打开浏览器 DevTools Network 面板<br>3. 找到 POST /checkins 请求 |
| **预期结果** | 1. POST 请求发送到 `${SUPABASE_URL}/rest/v1/checkins`<br>2. Request Body 包含 `user_id`, `date`, `type: "photo"`, `photo_url`, `note`, `checkin_time`<br>3. Response 状态码 201<br>4. 返回数据包含完整的 checkin 记录（含 server 端生成的 id） |
| **验证方式** | 网络抓包；Supabase Studio 查看数据表 |

---

### PHOTO-S-002 | 打卡记录加载（页面刷新后数据恢复）

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-S-002 |
| **名称** | 页面刷新后打卡数据从 Supabase 正确加载 |
| **前置条件** | 1. 用户已登录；2. Supabase 有历史打卡记录 |
| **严重级** | **P0** |
| **操作步骤** | 1. 确保已有历史打卡记录<br>2. 刷新 Photo 页面<br>3. 等待数据加载 |
| **预期结果** | 1. `loadAllData` 调用 `db.getCheckins`<br>2. 返回数据中 `photo` 字段正确映射自 `photo_url`<br>3. `state.checkinHistory` 填充完整数据<br>4. 照片墙正确显示历史照片<br>5. ComplementCard 显示最近的打卡信息 |
| **验证方式** | 刷新页面后检查照片墙是否显示；验证 getCheckins 返回数据的字段映射 |

---

### PHOTO-S-003 | 打卡记录不跨用户泄露

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-S-003 |
| **名称** | 打卡数据隔离（A 用户看不到 B 的记录） |
| **前置条件** | 1. 用户 A 有打卡记录；2. 用户 B 有打卡记录 |
| **严重级** | **P0** |
| **操作步骤** | 1. 用户 A 登录，打卡，查看照片墙<br>2. 退出登录<br>3. 用户 B 登录，查看照片墙 |
| **预期结果** | 1. `getCheckins` 查询参数包含 `user_id=eq.${currentUser.id}`<br>2. 用户 B 仅看到自己的记录<br>3. `state.checkinHistory` 在登出后清空 |
| **验证方式** | mock `currentUser` 为不同用户 ID；验证查询参数 |

---

### PHOTO-S-004 | 页面卸载时释放摄像头资源

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-S-004 |
| **名称** | 离开页面时 MediaStream 正确释放 |
| **前置条件** | 1. 用户已登录；2. 摄像头已打开（`ready` 状态） |
| **严重级** | **P1** |
| **操作步骤** | 1. 打开摄像头<br>2. 离开 Photo 页面（路由跳转或关闭浏览器）<br>3. 验证 MediaStream 状态 |
| **预期结果** | 1. `onUnmounted` 中 `stopCamera()` 被调用<br>2. `mediaStream.getTracks().forEach(t => t.stop())` 执行<br>3. MediaStream 停止，摄像头指示灯熄灭（如果硬件支持） |
| **验证方式** | mock MediaStream，验证 tracks 的 stop 被调用次数；浏览器开发者工具检查媒体设备占用 |

---

## 六、边界条件

### PHOTO-B-001 | iOS Safari 兼容性

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-B-001 |
| **名称** | iOS Safari 下拍照功能正常 |
| **前置条件** | 1. iOS 11+ Safari 浏览器；2. 已登录；3. 已授权摄像头 |
| **严重级** | **P0** |
| **操作步骤** | 1. 在 iOS Safari 中打开 Photo 页面<br>2. 点击拍照按钮<br>3. 确认 `getUserMedia` 调用成功<br>4. 完成拍照打卡 |
| **预期结果** | 1. video 元素包含 `playsinline` 属性，视频内联播放而非全屏<br>2. `canvas.drawImage` 正常工作<br>3. `toDataURL('image/jpeg', 0.7)` 正常返回 dataURL<br>4. iOS 权限引导弹窗（CameraGuideModal）点击后跳转到 `app-settings:` |
| **验证方式** | iOS 真机测试；或 BrowserStack 模拟测试 |

---

### PHOTO-B-002 | Android Chrome 兼容性

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-B-002 |
| **名称** | Android Chrome 下拍照功能正常 |
| **前置条件** | 1. Android Chrome 浏览器；2. 已登录 |
| **严重级** | **P1** |
| **操作步骤** | 1. 在 Android Chrome 中打开 Photo 页面<br>2. 完成拍照流程<br>3. 验证所有字段 |
| **预期结果** | 1. `facingMode: 'user'` 正确调用前置摄像头<br>2. 权限拒绝时引导弹窗点击后跳转 `package:` 协议<br>3. 照片保存流程正常 |
| **验证方式** | Android 真机测试或模拟器 |

---

### PHOTO-B-003 | 低版本浏览器不支持 getUserMedia

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-B-003 |
| **名称** | 低版本浏览器不支持 getUserMedia |
| **前置条件** | 1. 浏览器不支持 `navigator.mediaDevices.getUserMedia` |
| **严重级** | **P1** |
| **操作步骤** | 1. 在不支持的环境中打开 Photo 页面<br>2. 点击拍照按钮 |
| **预期结果** | 1. `getUserMedia` 调用抛出异常（TypeError 或 ReferenceError）<br>2. catch 块正常捕获<br>3. `cameraState` 回退到 `idle`<br>4. 显示 CameraGuideModal<br>5. 不阻塞页面其他功能 |
| **验证方式** | 通过 polyfill 移除或旧版浏览器测试 |

---

### PHOTO-B-004 | 前置摄像头画面水平翻转（镜像）

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-B-004 |
| **名称** | 自拍预览镜像显示 |
| **前置条件** | 1. 用户已登录；2. 使用前置摄像头（`facingMode: 'user'`） |
| **严重级** | **P2** |
| **操作步骤** | 1. 打开前置摄像头<br>2. 观察预览画面<br>3. 拍照后查看照片 |
| **预期结果** | 1. 预览（video）不做镜像处理（正面摄像头自然显示）<br>2. Canvas 绘制时通过 `ctx.translate(canvas.width, 0) + ctx.scale(-1, 1)` 实现水平翻转<br>3. 最终照片为镜像自拍效果（符合自拍习惯） |
| **验证方式** | 预览时举起文字显示正向（不镜像），拍照后照片中文字反向（镜像） |

---

### PHOTO-B-005 | 超长彩虹屁文字溢出

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-B-005 |
| **名称** | 超长彩虹屁文字在预览区域的显示 |
| **前置条件** | 1. 用户已登录；2. `generateCompliment` 返回超长文本（假设边界值 200 字） |
| **严重级** | **P2** |
| **操作步骤** | 1. mock `generateCompliment` 返回超长文本<br>2. 完成拍照<br>3. 观察 preview overlay 显示 |
| **预期结果** | 1. 文字在 overlay 区域正常换行显示<br>2. 不溢出到按钮区域<br>3. 背景渐变确保文字可读 |
| **验证方式** | mock 超长文本测试 |

---

### PHOTO-B-006 | 快速连续打卡（同一天多次）

| 项目 | 内容 |
|------|------|
| **编号** | PHOTO-B-006 |
| **名称** | 同一天多次拍照打卡 |
| **前置条件** | 1. 用户已登录；2. 今天已打卡 |
| **严重级** | **P2** |
| **操作步骤** | 1. 今日已完成一次拍照打卡<br>2. 再次打开摄像头拍照<br>3. 确认打卡 |
| **预期结果** | 1. 当前实现允许同一天多次打卡（无前端限制）<br>2. 每次打卡独立记录<br>3. 照片墙中可能出现同一天多张照片（取决于 recentPhotos 过滤逻辑） |
| **验证方式** | 完成两次打卡，检查 records 数量 |

---

## 七、回归测试优先级汇总

| 优先级 | 用例数量 | 覆盖范围 |
|--------|----------|----------|
| **P0** | 9 | 完整打卡流程、权限拒绝、未登录、网络异常、数据映射、持久化隔离 |
| **P1** | 13 | 重拍、照片墙、全屏浏览、成就弹窗、无摄像头、数据回写、UI 状态渲染、iOS兼容、Android兼容 |
| **P2** | 9 | captured 状态、空态、已打卡、双重点击、页面刷新、跨用户、资源释放、镜像、文字溢出、单日多次 |

---

## 八、测试用例与代码映射索引

| 用例编号 | 覆盖代码段 |
|----------|-----------|
| PHOTO-P-001 | `openCamera()` → `takePhoto()` → `confirmPhoto()` → `addCheckin()` |
| PHOTO-P-002 | `retakePhoto()` → `openCamera()` |
| PHOTO-P-003 | `retakePhoto()` 分支覆盖 |
| PHOTO-P-004 | `recentPhotos` computed → `PhotoWall` |
| PHOTO-P-005 | `openGallery()` → `GalleryOverlay` |
| PHOTO-P-006 | `confirmPhoto()` → `checkMilestone()` → `addBadge()` → celebration |
| PHOTO-N-001 | `openCamera()` catch 块 |
| PHOTO-N-002 | `getUserMedia` NotFoundError |
| PHOTO-N-003 | `db.addCheckin()` 未登录 guard |
| PHOTO-N-004 | `supabaseFetch()` 超时/重试 |
| PHOTO-N-005 | Supabase 507 错误 |
| PHOTO-N-006 | `takePhoto()` 多次触发保护 |
| PHOTO-N-007 | `onUnmounted` → `stopCamera()` |
| PHOTO-D-001 | `getCheckins()` 行 214-217 |
| PHOTO-D-002 | `addCheckin()` 行 225-227 |
| PHOTO-D-003 | `addCheckin()` 行 236-240 |
| PHOTO-D-004 | `addCheckin()` 行 232 |
| PHOTO-D-005 | `dataStore.addCheckin()` 行 168-179 |
| PHOTO-U-001 | Template 行 1-55 (idle UI) |
| PHOTO-U-002 | Template 行 21 (video) |
| PHOTO-U-003 | Template 行 23-36 (preview overlay) |
| PHOTO-U-004 | `recentPhotos` → `PhotoWall` 空态 |
| PHOTO-U-005 | `ComplimentCard` + `recentPhotos` |
| PHOTO-U-006 | Template 行 109-119 (celebration) |
| PHOTO-S-001 | `addCheckin()` → `supabaseFetch()` POST |
| PHOTO-S-002 | `loadAllData()` → `getCheckins()` |
| PHOTO-S-003 | `getCheckins()` 行 210 user_id filter |
| PHOTO-S-004 | `onUnmounted` → `stopCamera()` |
| PHOTO-B-001 | iOS `playsinline` + `app-settings:` |
| PHOTO-B-002 | Android `package:` 跳转 |
| PHOTO-B-003 | `getUserMedia` 不存在 |
| PHOTO-B-004 | Canvas 镜像绘制 行 241-243 |
| PHOTO-B-005 | `preview-compliment` CSS 溢出 |
| PHOTO-B-006 | 多次打卡无前端限制 |

---

> 文档版本：v1.0 | 最后更新：2026-07-17  
> 维护者：测试团队  
> 备注：本测试案例文档仅描述测试设计，不涉及代码修改。实际执行时需根据 CI 环境调整 mock 策略。
