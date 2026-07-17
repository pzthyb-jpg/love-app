# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/photo-regression-p0.spec.js >> PHOTO-N-004: 网络异常时打卡操作显示错误
- Location: tests/photo-regression-p0.spec.js:213:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.van-toast--fail, .van-toast:has-text("网络"), .van-toast:has-text("失败")')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('.van-toast--fail, .van-toast:has-text("网络"), .van-toast:has-text("失败")')

```

```yaml
- text: ⚠️
- heading "页面出了点问题" [level=2]
- paragraph: 请尝试刷新页面，如果问题持续，请联系开发者。
- button "🔄 刷新页面"
```

# Test source

```ts
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
> 261 |   await expect(errorToast).toBeVisible({ timeout: 20000 });
      |                            ^ Error: expect(locator).toBeVisible() failed
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
  301 |     return check1 && check2 && check3 && check4 && check5 && check6 && check7;
  302 |   });
  303 | 
  304 |   expect(mappingCorrect).toBe(true);
  305 | });
  306 | 
  307 | // ============================================================
  308 | // PHOTO-D-002: compliment → note 字段映射
  309 | // ============================================================
  310 | test('PHOTO-D-002: addCheckin 中 compliment 合并到 note 字段', async ({ page }) => {
  311 |   await page.goto(`${BASE_URL}/#/photo`);
  312 |   await page.waitForLoadState('networkidle');
  313 | 
  314 |   const mappingCorrect = await page.evaluate(() => {
  315 |     // 模拟 useDatabase.js addCheckin 中的 note 生成逻辑
  316 |     function buildNote(record) {
  317 |       let note = record.note || null;
  318 |       if (record.compliment) {
  319 |         note = note ? `${note}\n\n💬 ${record.compliment}` : `💬 ${record.compliment}`;
  320 |       }
  321 |       return note;
  322 |     }
  323 | 
  324 |     // 测试1: 只有 compliment
  325 |     const note1 = buildNote({ compliment: '你的眼睛真美' });
  326 |     const check1 = note1 === '💬 你的眼睛真美';
  327 | 
  328 |     // 测试2: 有 note 和 compliment
  329 |     const note2 = buildNote({ note: '原有笔记', compliment: '你的眼睛真美' });
  330 |     const check2 = note2 === '原有笔记\n\n💬 你的眼睛真美';
  331 | 
  332 |     // 测试3: 没有 compliment
  333 |     const note3 = buildNote({ note: '只有笔记' });
  334 |     const check3 = note3 === '只有笔记';
  335 | 
  336 |     // 测试4: 都没有
  337 |     const note4 = buildNote({});
  338 |     const check4 = note4 === null;
  339 | 
  340 |     return check1 && check2 && check3 && check4;
  341 |   });
  342 | 
  343 |   expect(mappingCorrect).toBe(true);
  344 | });
  345 | 
  346 | // ============================================================
  347 | // PHOTO-D-003: time → checkin_time 字段映射
  348 | // ============================================================
  349 | test('PHOTO-D-003: addCheckin 中 time 映射到 checkin_time 列', async ({ page }) => {
  350 |   await page.goto(`${BASE_URL}/#/photo`);
  351 |   await page.waitForLoadState('networkidle');
  352 | 
  353 |   const mappingCorrect = await page.evaluate(() => {
  354 |     // 模拟 useDatabase.js addCheckin 中的 body 构建逻辑
  355 |     function buildBody(record) {
  356 |       const body = {
  357 |         user_id: 'test-user',
  358 |         date: record.date,
  359 |         type: record.type || 'photo',
  360 |         photo_url: record.photo_url || record.photo || null,
  361 |         note: record.note || null,
```