# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/photo-regression-p0.spec.js >> PHOTO-N-001: 摄像头权限拒绝时显示引导弹窗
- Location: tests/photo-regression-p0.spec.js:142:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.camera-guide-modal, [class*="camera-guide"], .van-dialog:has-text("相机权限"), .van-dialog:has-text("摄像头")')
Expected: visible
Error: strict mode violation: locator('.camera-guide-modal, [class*="camera-guide"], .van-dialog:has-text("相机权限"), .van-dialog:has-text("摄像头")') resolved to 5 elements:
    1) <div data-v-41739657="" class="dialog-box camera-guide-box">…</div> aka getByText('📸需要摄像头权限才能哦在系统设置中允许本应用使用摄像头')
    2) <div data-v-41739657="" class="camera-guide-emoji">📸</div> aka locator('div').filter({ hasText: /^📸$/ })
    3) <p data-v-41739657="" class="camera-guide-desc">在系统设置中允许本应用使用摄像头</p> aka getByText('在系统设置中允许本应用使用摄像头')
    4) <div data-v-41739657="" class="camera-guide-steps">…</div> aka getByText('iPhone: 设置 → 隐私 → 相机 → 找到本应用Android: 设置 → 应用 → 权限 → 相机')
    5) <div data-v-41739657="" class="camera-guide-actions">…</div> aka getByText('知道了前往设置')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.camera-guide-modal, [class*="camera-guide"], .van-dialog:has-text("相机权限"), .van-dialog:has-text("摄像头")')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - text: 📸
        - heading "拍照打卡" [level=2] [ref=e6]
      - generic [ref=e8]: 2026年7月17日 星期五
      - generic [ref=e9]:
        - generic [ref=e11]:
          - generic [ref=e12]: 📸
          - paragraph [ref=e13]: 点击下方按钮开始拍照
        - button "📸 咔嚓拍照" [ref=e15] [cursor=pointer]:
          - generic [ref=e17]: 📸 咔嚓拍照
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: ⏰
          - generic [ref=e21]: 打卡提醒
        - generic [ref=e22]:
          - generic [ref=e23]:
            - generic [ref=e24]: 中午提醒
            - switch [checked] [ref=e25] [cursor=pointer]
          - generic [ref=e27]:
            - generic [ref=e28]: 时间
            - combobox [ref=e29]:
              - option "中午 12:00" [selected]
              - option "下午 15:00"
              - option "傍晚 18:00"
              - option "自定义"
        - paragraph [ref=e30]: ✅ 下次提醒 12:00
      - generic [ref=e31]:
        - generic [ref=e32]:
          - heading "📅 回忆照片墙" [level=3] [ref=e33]
          - generic [ref=e34]: 最近 0 天
        - paragraph [ref=e36]: 还没有打卡记录哦，开始打卡吧 📸
      - generic [ref=e37]:
        - heading "🏆 成就徽章" [level=3] [ref=e38]
        - generic [ref=e39]:
          - generic [ref=e40]:
            - generic [ref=e41]: 🌱
            - generic [ref=e42]: 萌芽
            - generic [ref=e43]: 7天
          - generic [ref=e44]:
            - generic [ref=e45]: 🌸
            - generic [ref=e46]: 绽放
            - generic [ref=e47]: 14天
          - generic [ref=e48]:
            - generic [ref=e49]: 🌺
            - generic [ref=e50]: 盛放
            - generic [ref=e51]: 21天
          - generic [ref=e52]:
            - generic [ref=e53]: 💎
            - generic [ref=e54]: 永恒
            - generic [ref=e55]: 30天
        - generic [ref=e58]: "下一个: 萌芽 🌱 (还差 7 天)"
    - tablist [ref=e59]:
      - tab " 首页" [ref=e60] [cursor=pointer]:
        - generic [ref=e62]: 
        - generic [ref=e63]: 首页
      - tab " 拍照" [selected] [ref=e64] [cursor=pointer]:
        - generic [ref=e66]: 
        - generic [ref=e67]: 拍照
      - tab " 位置" [ref=e68] [cursor=pointer]:
        - generic [ref=e70]: 
        - generic [ref=e71]: 位置
      - tab " 午餐" [ref=e72] [cursor=pointer]:
        - generic [ref=e74]: 
        - generic [ref=e75]: 午餐
      - tab " 愿望" [ref=e76] [cursor=pointer]:
        - generic [ref=e78]: 
        - generic [ref=e79]: 愿望
      - tab " 纪念" [ref=e80] [cursor=pointer]:
        - generic [ref=e82]: 
        - generic [ref=e83]: 纪念
      - tab " 设置" [ref=e84] [cursor=pointer]:
        - generic [ref=e86]: 
        - generic [ref=e87]: 设置
  - generic [ref=e89]:
    - generic [ref=e90]: 📸
    - heading "需要摄像头权限才能哦" [level=3] [ref=e91]
    - paragraph [ref=e92]: 在系统设置中允许本应用使用摄像头
    - generic [ref=e93]:
      - paragraph [ref=e94]: "iPhone: 设置 → 隐私 → 相机 → 找到本应用"
      - paragraph [ref=e95]: "Android: 设置 → 应用 → 权限 → 相机"
    - generic [ref=e96]:
      - button "知道了" [ref=e97] [cursor=pointer]:
        - generic [ref=e99]: 知道了
      - button "前往设置" [ref=e100] [cursor=pointer]:
        - generic [ref=e102]: 前往设置
```

# Test source

```ts
  74  |     ctx.fillText('📸 TEST', 270, 270);
  75  | 
  76  |     const stream = canvas.captureStream(30);
  77  | 
  78  |     // Mock getUserMedia
  79  |     navigator.mediaDevices.getUserMedia = async (constraints) => {
  80  |       if (constraints.video) {
  81  |         return stream;
  82  |       }
  83  |       throw new Error('Audio not supported');
  84  |     };
  85  |   });
  86  | 
  87  |   // 导航到 Photo 页面 (hash routing)
  88  |   await page.goto(`${BASE_URL}/#/photo`);
  89  |   await page.waitForLoadState('networkidle');
  90  | 
  91  |   // Step 1: 确认初始状态 (idle)
  92  |   const takePhotoBtn = page.locator('button:has-text("📸 咔嚓拍照")');
  93  |   await expect(takePhotoBtn).toBeVisible({ timeout: 10000 });
  94  | 
  95  |   // Step 2: 点击拍照按钮
  96  |   await takePhotoBtn.click();
  97  | 
  98  |   // Step 3: 等待摄像头就绪 (ready 状态)
  99  |   const snapBtn = page.locator('button:has-text("📸 咔嚓！拍照")');
  100 |   await expect(snapBtn).toBeVisible({ timeout: 10000 });
  101 | 
  102 |   // Step 4: 确认 video 元素存在
  103 |   const videoEl = page.locator('video.video-preview');
  104 |   await expect(videoEl).toBeVisible();
  105 |   await expect(videoEl).toHaveAttribute('autoplay', '');
  106 |   await expect(videoEl).toHaveAttribute('playsinline', '');
  107 | 
  108 |   // Step 5: 点击拍照
  109 |   await snapBtn.click();
  110 | 
  111 |   // Step 6: 确认预览状态
  112 |   const confirmBtn = page.locator('button:has-text("✅ 确认打卡")');
  113 |   await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  114 | 
  115 |   // Step 7: 确认彩虹屁文字显示
  116 |   const complimentText = page.locator('.preview-compliment');
  117 |   await expect(complimentText).toBeVisible();
  118 |   const compliment = await complimentText.textContent();
  119 |   expect(compliment).toBeTruthy();
  120 |   expect(compliment.length).toBeGreaterThan(0);
  121 | 
  122 |   // Step 8: 确认重拍按钮存在
  123 |   const retakeBtn = page.locator('button:has-text("📸 重拍")');
  124 |   await expect(retakeBtn).toBeVisible();
  125 | 
  126 |   // Step 9: 点击确认打卡
  127 |   await confirmBtn.click();
  128 | 
  129 |   // Step 10: 确认 toast 提示
  130 |   const toast = page.locator('.van-toast--success, .van-toast:has-text("打卡成功")');
  131 |   await expect(toast).toBeVisible({ timeout: 5000 });
  132 | 
  133 |   // Step 11: 确认页面恢复初始状态
  134 |   await expect(page.locator('button:has-text("📸 咔嚓拍照")')).toBeVisible({ timeout: 5000 });
  135 | 
  136 |   await context.close();
  137 | });
  138 | 
  139 | // ============================================================
  140 | // PHOTO-N-001: 摄像头权限拒绝
  141 | // ============================================================
  142 | test('PHOTO-N-001: 摄像头权限拒绝时显示引导弹窗', async ({ browser }) => {
  143 |   const context = await browser.newContext({
  144 |     ...launchOptions,
  145 |     permissions: [], // 不授予摄像头权限
  146 |   });
  147 |   const page = await context.newPage();
  148 | 
  149 |   // 注入登录状态 + Mock getUserMedia 抛出 NotAllowedError
  150 |   await page.addInitScript(() => {
  151 |     const mockUser = {
  152 |       id: 'test-user-001',
  153 |       username: 'testuser',
  154 |       display_name: 'Test User',
  155 |       created_at: new Date().toISOString(),
  156 |     };
  157 |     localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));
  158 | 
  159 |     navigator.mediaDevices.getUserMedia = async () => {
  160 |       throw new DOMException('NotAllowedError', 'Permission denied');
  161 |     };
  162 |   });
  163 | 
  164 |   await page.goto(`${BASE_URL}/#/photo`);
  165 |   await page.waitForLoadState('networkidle');
  166 | 
  167 |   // 点击拍照按钮
  168 |   const takePhotoBtn = page.locator('button:has-text("📸 咔嚓拍照")');
  169 |   await expect(takePhotoBtn).toBeVisible({ timeout: 10000 });
  170 |   await takePhotoBtn.click();
  171 | 
  172 |   // 确认 CameraGuideModal 显示
  173 |   const guideModal = page.locator('.camera-guide-modal, [class*="camera-guide"], .van-dialog:has-text("相机权限"), .van-dialog:has-text("摄像头")');
> 174 |   await expect(guideModal).toBeVisible({ timeout: 5000 });
      |                            ^ Error: expect(locator).toBeVisible() failed
  175 | 
  176 |   // 确认状态回退到 idle (拍照按钮重新出现)
  177 |   await expect(page.locator('button:has-text("📸 咔嚓拍照")')).toBeVisible({ timeout: 5000 });
  178 | 
  179 |   await context.close();
  180 | });
  181 | 
  182 | // ============================================================
  183 | // PHOTO-N-003: 未登录用户访问
  184 | // ============================================================
  185 | test('PHOTO-N-003: 未登录用户访问 Photo 页面', async ({ browser }) => {
  186 |   const context = await browser.newContext(launchOptions);
  187 |   const page = await context.newPage();
  188 | 
  189 |   // 清除 localStorage 确保未登录
  190 |   await page.addInitScript(() => {
  191 |     localStorage.clear();
  192 |   });
  193 | 
  194 |   await page.goto(`${BASE_URL}/#/photo`);
  195 |   await page.waitForLoadState('networkidle');
  196 | 
  197 |   // 确认页面正常渲染，不报错 (未登录时路由守卫会跳转到登录页)
  198 |   // 由于路由守卫，未登录用户会被重定向到登录页
  199 |   const loginPage = page.locator('.login-page, .login-container');
  200 |   await expect(loginPage).toBeVisible({ timeout: 10000 });
  201 | 
  202 |   // 验证登录页元素
  203 |   const loginTitle = page.locator('.login-title');
  204 |   await expect(loginTitle).toBeVisible();
  205 |   await expect(loginTitle).toHaveText('小皮爱情助手');
  206 | 
  207 |   await context.close();
  208 | });
  209 | 
  210 | // ============================================================
  211 | // PHOTO-N-004: 网络异常（Supabase 不可达）
  212 | // ============================================================
  213 | test('PHOTO-N-004: 网络异常时打卡操作显示错误', async ({ browser }) => {
  214 |   const context = await browser.newContext({
  215 |     ...launchOptions,
  216 |     permissions: ['camera'],
  217 |   });
  218 |   const page = await context.newPage();
  219 | 
  220 |   // Mock getUserMedia + 登录状态
  221 |   await page.addInitScript(() => {
  222 |     const mockUser = {
  223 |       id: 'test-user-001',
  224 |       username: 'testuser',
  225 |       display_name: 'Test User',
  226 |       created_at: new Date().toISOString(),
  227 |     };
  228 |     localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));
  229 | 
  230 |     const canvas = document.createElement('canvas');
  231 |     canvas.width = 540;
  232 |     canvas.height = 540;
  233 |     const ctx = canvas.getContext('2d');
  234 |     ctx.fillStyle = '#FF69B4';
  235 |     ctx.fillRect(0, 0, 540, 540);
  236 |     const stream = canvas.captureStream(30);
  237 |     navigator.mediaDevices.getUserMedia = async () => stream;
  238 |   });
  239 | 
  240 |   await page.goto(`${BASE_URL}/#/photo`);
  241 |   await page.waitForLoadState('networkidle');
  242 | 
  243 |   // 完成拍照流程
  244 |   await page.locator('button:has-text("📸 咔嚓拍照")').click();
  245 |   await page.locator('button:has-text("📸 咔嚓！拍照")').click();
  246 | 
  247 |   // 确认预览状态
  248 |   const confirmBtn = page.locator('button:has-text("✅ 确认打卡")');
  249 |   await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  250 | 
  251 |   // Mock 网络异常 - 拦截 Supabase 请求
  252 |   await page.route('**/rest/v1/checkins', async (route) => {
  253 |     await route.abort('failed');
  254 |   });
  255 | 
  256 |   // 点击确认打卡
  257 |   await confirmBtn.click();
  258 | 
  259 |   // 确认显示网络错误 toast
  260 |   const errorToast = page.locator('.van-toast--fail, .van-toast:has-text("网络"), .van-toast:has-text("失败")');
  261 |   await expect(errorToast).toBeVisible({ timeout: 20000 });
  262 | 
  263 |   // 确认预览照片保留（用户可重试）
  264 |   await expect(confirmBtn).toBeVisible();
  265 | 
  266 |   await context.close();
  267 | });
  268 | 
  269 | // ============================================================
  270 | // PHOTO-D-001: photo_url ↔ photo 字段映射（getCheckins）
  271 | // ============================================================
  272 | test('PHOTO-D-001: getCheckins 返回数据 photo_url → photo 字段映射正确', async ({ page }) => {
  273 |   await page.goto(`${BASE_URL}/#/photo`);
  274 |   await page.waitForLoadState('networkidle');
```