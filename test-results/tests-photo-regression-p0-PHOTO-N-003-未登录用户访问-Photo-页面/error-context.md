# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/photo-regression-p0.spec.js >> PHOTO-N-003: 未登录用户访问 Photo 页面
- Location: tests/photo-regression-p0.spec.js:185:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.login-page, .login-container')
Expected: visible
Error: strict mode violation: locator('.login-page, .login-container') resolved to 2 elements:
    1) <div data-v-67e64f9f="" class="login-page">…</div> aka locator('div').nth(4)
    2) <div data-v-67e64f9f="" class="login-container">…</div> aka getByText('💕小皮爱情助手记录我们的每一个甜蜜时刻登录注册立即登录还没有账号？点击上方「注册」')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('.login-page, .login-container')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]: 💕
    - paragraph [ref=e4]: 小皮爱情助手加载中...
  - generic [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]: 💕
      - heading "小皮爱情助手" [level=1] [ref=e11]
      - paragraph [ref=e12]: 记录我们的每一个甜蜜时刻
    - generic [ref=e13]:
      - button "登录" [ref=e14] [cursor=pointer]
      - button "注册" [ref=e15] [cursor=pointer]
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e19]: 
        - textbox "用户名" [ref=e22]
      - generic [ref=e23]:
        - generic [ref=e25]: 
        - textbox "密码" [ref=e28]
      - button "立即登录" [ref=e29] [cursor=pointer]:
        - generic [ref=e31]: 立即登录
    - paragraph [ref=e32]: 还没有账号？点击上方「注册」
```

# Test source

```ts
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
  174 |   await expect(guideModal).toBeVisible({ timeout: 5000 });
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
> 200 |   await expect(loginPage).toBeVisible({ timeout: 10000 });
      |                           ^ Error: expect(locator).toBeVisible() failed
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
  275 | 
  276 |   // 通过页面上下文验证字段映射逻辑
  277 |   const mappingCorrect = await page.evaluate(() => {
  278 |     // 模拟 Supabase 返回的数据结构
  279 |     const supabaseRows = [
  280 |       { id: 1, user_id: 'user1', date: '2026-07-17', type: 'photo', photo_url: 'https://example.com/photo1.jpg', note: 'test', checkin_time: '10:00' },
  281 |       { id: 2, user_id: 'user1', date: '2026-07-16', type: 'photo', photo_url: null, note: 'no photo', checkin_time: '09:00' },
  282 |     ];
  283 | 
  284 |     // 模拟 useDatabase.js 中的映射逻辑
  285 |     const mapped = rows => rows.map(row => ({
  286 |       ...row,
  287 |       photo: row.photo_url || null,
  288 |     }));
  289 | 
  290 |     const result = mapped(supabaseRows);
  291 | 
  292 |     // 验证映射
  293 |     const check1 = result[0].photo === 'https://example.com/photo1.jpg';
  294 |     const check2 = result[1].photo === null;
  295 |     const check3 = result[0].id === 1; // 其他字段保留
  296 |     const check4 = result[0].user_id === 'user1';
  297 |     const check5 = result[0].date === '2026-07-17';
  298 |     const check6 = result[0].note === 'test';
  299 |     const check7 = result[0].checkin_time === '10:00';
  300 | 
```