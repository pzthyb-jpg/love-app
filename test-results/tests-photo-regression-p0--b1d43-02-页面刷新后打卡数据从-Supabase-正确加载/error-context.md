# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/photo-regression-p0.spec.js >> PHOTO-S-002: 页面刷新后打卡数据从 Supabase 正确加载
- Location: tests/photo-regression-p0.spec.js:518:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.photo-wall, [class*="photoWall"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.photo-wall, [class*="photoWall"]')

```

```yaml
- text: 📸
- heading "拍照打卡" [level=2]
- text: 2026年7月17日 星期五 📸
- paragraph: 点击下方按钮开始拍照
- button "📸 咔嚓拍照"
- text: ⏰ 打卡提醒 中午提醒
- switch [checked]
- text: 时间
- combobox:
  - option "中午 12:00" [selected]
  - option "下午 15:00"
  - option "傍晚 18:00"
  - option "自定义"
- paragraph: ✅ 下次提醒 12:00
- heading "📅 回忆照片墙" [level=3]
- text: 最近 2 天
- img "2026-07-17"
- img "2026-07-16"
- heading "🏆 成就徽章" [level=3]
- text: "🌱 萌芽 7天 🌸 绽放 14天 🌺 盛放 21天 💎 永恒 30天 下一个: 萌芽 🌱 (还差 5 天)"
- tablist:
  - tab " 首页"
  - tab " 拍照" [selected]
  - tab " 位置"
  - tab " 午餐"
  - tab " 愿望"
  - tab " 纪念"
  - tab " 设置"
```

# Test source

```ts
  458 |   await page.route('**/rest/v1/checkins', async (route) => {
  459 |     const request = route.request();
  460 |     capturedRequest = {
  461 |       method: request.method(),
  462 |       url: request.url(),
  463 |       body: request.postDataJSON(),
  464 |       headers: request.headers(),
  465 |     };
  466 |     // 返回成功响应
  467 |     await route.fulfill({
  468 |       status: 201,
  469 |       contentType: 'application/json',
  470 |       body: JSON.stringify([{
  471 |         id: 999,
  472 |         user_id: 'test-user',
  473 |         date: '2026-07-17',
  474 |         type: 'photo',
  475 |         photo_url: 'data:image/jpeg;base64,test',
  476 |         note: '💬 测试彩虹屁',
  477 |         checkin_time: '10:00',
  478 |         created_at: new Date().toISOString(),
  479 |       }]),
  480 |     });
  481 |   });
  482 | 
  483 |   await page.goto(`${BASE_URL}/#/photo`);
  484 |   await page.waitForLoadState('networkidle');
  485 | 
  486 |   // 完成拍照打卡流程
  487 |   await page.locator('button:has-text("📸 咔嚓拍照")').click();
  488 |   await page.locator('button:has-text("📸 咔嚓！拍照")').click();
  489 | 
  490 |   const confirmBtn = page.locator('button:has-text("✅ 确认打卡")');
  491 |   await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  492 |   await confirmBtn.click();
  493 | 
  494 |   // 等待请求完成
  495 |   await page.waitForTimeout(2000);
  496 | 
  497 |   // 验证请求
  498 |   expect(capturedRequest).not.toBeNull();
  499 |   expect(capturedRequest.method).toBe('POST');
  500 |   expect(capturedRequest.url).toContain('/rest/v1/checkins');
  501 |   expect(capturedRequest.body).toHaveProperty('user_id');
  502 |   expect(capturedRequest.body).toHaveProperty('date');
  503 |   expect(capturedRequest.body.type).toBe('photo');
  504 |   expect(capturedRequest.body).toHaveProperty('photo_url');
  505 |   expect(capturedRequest.body).toHaveProperty('note');
  506 |   expect(capturedRequest.body).toHaveProperty('checkin_time');
  507 | 
  508 |   // 验证 toast
  509 |   const toast = page.locator('.van-toast--success');
  510 |   await expect(toast).toBeVisible({ timeout: 5000 });
  511 | 
  512 |   await context.close();
  513 | });
  514 | 
  515 | // ============================================================
  516 | // PHOTO-S-002: 打卡记录加载（页面刷新后数据恢复）
  517 | // ============================================================
  518 | test('PHOTO-S-002: 页面刷新后打卡数据从 Supabase 正确加载', async ({ browser }) => {
  519 |   const context = await browser.newContext(launchOptions);
  520 |   const page = await context.newPage();
  521 | 
  522 |   // 注入登录状态
  523 |   await page.addInitScript(() => {
  524 |     const mockUser = {
  525 |       id: 'test-user-001',
  526 |       username: 'testuser',
  527 |       display_name: 'Test User',
  528 |       created_at: new Date().toISOString(),
  529 |     };
  530 |     localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));
  531 |   });
  532 | 
  533 |   // Mock Supabase getCheckins 返回
  534 |   await page.route('**/rest/v1/checkins*', async (route) => {
  535 |     const url = route.request().url();
  536 |     if (route.request().method() === 'GET') {
  537 |       await route.fulfill({
  538 |         status: 200,
  539 |         contentType: 'application/json',
  540 |         body: JSON.stringify([
  541 |           { id: 1, user_id: 'test-user', date: '2026-07-17', type: 'photo', photo_url: 'https://example.com/photo1.jpg', note: '💬 真美', checkin_time: '10:00' },
  542 |           { id: 2, user_id: 'test-user', date: '2026-07-16', type: 'photo', photo_url: 'https://example.com/photo2.jpg', note: '💬 真棒', checkin_time: '09:00' },
  543 |         ]),
  544 |       });
  545 |     } else {
  546 |       await route.continue();
  547 |     }
  548 |   });
  549 | 
  550 |   await page.goto(`${BASE_URL}/#/photo`);
  551 |   await page.waitForLoadState('networkidle');
  552 | 
  553 |   // 等待数据加载
  554 |   await page.waitForTimeout(2000);
  555 | 
  556 |   // 验证照片墙显示历史照片
  557 |   const photoWall = page.locator('.photo-wall, [class*="photoWall"]');
> 558 |   await expect(photoWall).toBeVisible();
      |                           ^ Error: expect(locator).toBeVisible() failed
  559 | 
  560 |   // 验证照片元素存在
  561 |   const photos = page.locator('.photo-wall img, [class*="photoWall"] img, .photo-item img');
  562 |   const count = await photos.count();
  563 |   expect(count).toBeGreaterThanOrEqual(2);
  564 | 
  565 |   // 刷新页面
  566 |   await page.reload();
  567 |   await page.waitForLoadState('networkidle');
  568 |   await page.waitForTimeout(2000);
  569 | 
  570 |   // 验证数据重新加载
  571 |   const photosAfterReload = page.locator('.photo-wall img, [class*="photoWall"] img, .photo-item img');
  572 |   const countAfterReload = await photosAfterReload.count();
  573 |   expect(countAfterReload).toBeGreaterThanOrEqual(2);
  574 | 
  575 |   await context.close();
  576 | });
  577 | 
  578 | // ============================================================
  579 | // PHOTO-S-003: 打卡记录不跨用户泄露
  580 | // ============================================================
  581 | test('PHOTO-S-003: 打卡数据隔离（用户 A 看不到用户 B 的记录）', async ({ page }) => {
  582 |   await page.goto(`${BASE_URL}/#/photo`);
  583 |   await page.waitForLoadState('networkidle');
  584 | 
  585 |   const isolationCorrect = await page.evaluate(() => {
  586 |     // 模拟 useDatabase.js getCheckins 中的 user_id 过滤
  587 |     function buildQueryUrl(userId) {
  588 |       return `/checkins?user_id=eq.${userId}&select=*&order=date.desc`;
  589 |     }
  590 | 
  591 |     // 测试1: 用户 A 的查询包含 user_id 过滤
  592 |     const urlA = buildQueryUrl('user-a');
  593 |     const check1 = urlA.includes('user_id=eq.user-a');
  594 | 
  595 |     // 测试2: 用户 B 的查询包含 user_id 过滤
  596 |     const urlB = buildQueryUrl('user-b');
  597 |     const check2 = urlB.includes('user_id=eq.user-b');
  598 | 
  599 |     // 测试3: 两个查询不同
  600 |     const check3 = urlA !== urlB;
  601 | 
  602 |     // 测试4: 未登录时返回空数组
  603 |     const getCheckins = (currentUser) => {
  604 |       if (!currentUser) return [];
  605 |       return ['data'];
  606 |     };
  607 |     const check4 = getCheckins(null).length === 0;
  608 |     const check5 = getCheckins({ id: 'user-a' }).length === 1;
  609 | 
  610 |     return check1 && check2 && check3 && check4 && check5;
  611 |   });
  612 | 
  613 |   expect(isolationCorrect).toBe(true);
  614 | });
  615 | 
  616 | // ============================================================
  617 | // PHOTO-B-001: iOS Safari 兼容性 (playsinline 属性检查)
  618 | // ============================================================
  619 | test('PHOTO-B-001: video 元素包含 playsinline 属性（iOS 兼容）', async ({ browser }) => {
  620 |   const context = await browser.newContext({
  621 |     ...launchOptions,
  622 |     permissions: ['camera'],
  623 |     userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  624 |   });
  625 |   const page = await context.newPage();
  626 | 
  627 |   // Mock getUserMedia + 登录状态
  628 |   await page.addInitScript(() => {
  629 |     const mockUser = {
  630 |       id: 'test-user-001',
  631 |       username: 'testuser',
  632 |       display_name: 'Test User',
  633 |       created_at: new Date().toISOString(),
  634 |     };
  635 |     localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));
  636 | 
  637 |     const canvas = document.createElement('canvas');
  638 |     canvas.width = 540;
  639 |     canvas.height = 540;
  640 |     const ctx = canvas.getContext('2d');
  641 |     ctx.fillStyle = '#FF69B4';
  642 |     ctx.fillRect(0, 0, 540, 540);
  643 |     const stream = canvas.captureStream(30);
  644 |     navigator.mediaDevices.getUserMedia = async () => stream;
  645 |   });
  646 | 
  647 |   await page.goto(`${BASE_URL}/#/photo`);
  648 |   await page.waitForLoadState('networkidle');
  649 | 
  650 |   // 点击拍照按钮打开摄像头
  651 |   await page.locator('button:has-text("📸 咔嚓拍照")').click();
  652 | 
  653 |   // 等待 video 元素出现
  654 |   const videoEl = page.locator('video.video-preview');
  655 |   await expect(videoEl).toBeVisible({ timeout: 10000 });
  656 | 
  657 |   // 验证 playsinline 属性（iOS 必需）
  658 |   await expect(videoEl).toHaveAttribute('playsinline', '');
```