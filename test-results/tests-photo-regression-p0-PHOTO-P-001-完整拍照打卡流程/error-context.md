# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/photo-regression-p0.spec.js >> PHOTO-P-001: 完整拍照打卡流程
- Location: tests/photo-regression-p0.spec.js:46:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.van-toast--success, .van-toast:has-text("打卡成功")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.van-toast--success, .van-toast:has-text("打卡成功")')

```

```yaml
- text: ⚠️
- heading "页面出了点问题" [level=2]
- paragraph: 请尝试刷新页面，如果问题持续，请联系开发者。
- button "🔄 刷新页面"
```

# Test source

```ts
  31  |   await page.addInitScript(() => {
  32  |     // 注入当前用户到 localStorage，模拟已登录状态
  33  |     const mockUser = {
  34  |       id: 'test-user-001',
  35  |       username: 'testuser',
  36  |       display_name: 'Test User',
  37  |       created_at: new Date().toISOString(),
  38  |     };
  39  |     localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));
  40  |   });
  41  | }
  42  | 
  43  | // ============================================================
  44  | // PHOTO-P-001: 完整拍照打卡流程
  45  | // ============================================================
  46  | test('PHOTO-P-001: 完整拍照打卡流程', async ({ browser }) => {
  47  |   const context = await browser.newContext({
  48  |     ...launchOptions,
  49  |     permissions: ['camera'],
  50  |   });
  51  |   const page = await context.newPage();
  52  | 
  53  |   // 注入 fake media stream + 登录状态
  54  |   await page.addInitScript(() => {
  55  |     // 注入当前用户
  56  |     const mockUser = {
  57  |       id: 'test-user-001',
  58  |       username: 'testuser',
  59  |       display_name: 'Test User',
  60  |       created_at: new Date().toISOString(),
  61  |     };
  62  |     localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));
  63  | 
  64  |     // 创建 fake video track
  65  |     const canvas = document.createElement('canvas');
  66  |     canvas.width = 540;
  67  |     canvas.height = 540;
  68  |     const ctx = canvas.getContext('2d');
  69  |     ctx.fillStyle = '#FF69B4';
  70  |     ctx.fillRect(0, 0, 540, 540);
  71  |     ctx.fillStyle = '#FFFFFF';
  72  |     ctx.font = '48px Arial';
  73  |     ctx.textAlign = 'center';
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
> 131 |   await expect(toast).toBeVisible({ timeout: 5000 });
      |                       ^ Error: expect(locator).toBeVisible() failed
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
```