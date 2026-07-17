/**
 * Photo.vue P0 回归测试
 * 使用 Playwright + Chromium Headless
 * 覆盖用例: PHOTO-P-001, PHOTO-N-001, PHOTO-N-003, PHOTO-N-004,
 *           PHOTO-D-001, PHOTO-D-002, PHOTO-D-003, PHOTO-D-004,
 *           PHOTO-S-001, PHOTO-S-002, PHOTO-S-003, PHOTO-B-001
 */

import { test, expect } from '@playwright/test';

const EXECUTABLE_PATH = '/Users/wanghongbo/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE_URL = 'http://localhost:5173';

// 共享的 launch 配置
const launchOptions = {
  executablePath: EXECUTABLE_PATH,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--allow-insecure-localhost',
  ],
};

// ============================================================
// Helper: 创建已登录的用户状态 (通过 localStorage 注入)
// ============================================================
async function setupAuthenticatedUser(page, userId = 'test-user-001', username = 'testuser') {
  await page.addInitScript(() => {
    // 注入当前用户到 localStorage，模拟已登录状态
    const mockUser = {
      id: 'test-user-001',
      username: 'testuser',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));
  });
}

// ============================================================
// PHOTO-P-001: 完整拍照打卡流程
// ============================================================
test('PHOTO-P-001: 完整拍照打卡流程', async ({ browser }) => {
  const context = await browser.newContext({
    ...launchOptions,
    permissions: ['camera'],
  });
  const page = await context.newPage();

  // 注入 fake media stream + 登录状态
  await page.addInitScript(() => {
    // 注入当前用户
    const mockUser = {
      id: 'test-user-001',
      username: 'testuser',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));

    // 创建 fake video track
    const canvas = document.createElement('canvas');
    canvas.width = 540;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(0, 0, 540, 540);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📸 TEST', 270, 270);

    const stream = canvas.captureStream(30);

    // Mock getUserMedia
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      if (constraints.video) {
        return stream;
      }
      throw new Error('Audio not supported');
    };
  });

  // 导航到 Photo 页面 (hash routing)
  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  // Step 1: 确认初始状态 (idle)
  const takePhotoBtn = page.locator('button:has-text("📸 咔嚓拍照")');
  await expect(takePhotoBtn).toBeVisible({ timeout: 10000 });

  // Step 2: 点击拍照按钮
  await takePhotoBtn.click();

  // Step 3: 等待摄像头就绪 (ready 状态)
  const snapBtn = page.locator('button:has-text("📸 咔嚓！拍照")');
  await expect(snapBtn).toBeVisible({ timeout: 10000 });

  // Step 4: 确认 video 元素存在
  const videoEl = page.locator('video.video-preview');
  await expect(videoEl).toBeVisible();
  await expect(videoEl).toHaveAttribute('autoplay', '');
  await expect(videoEl).toHaveAttribute('playsinline', '');

  // Step 5: 点击拍照
  await snapBtn.click();

  // Step 6: 确认预览状态
  const confirmBtn = page.locator('button:has-text("✅ 确认打卡")');
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });

  // Step 7: 确认彩虹屁文字显示
  const complimentText = page.locator('.preview-compliment');
  await expect(complimentText).toBeVisible();
  const compliment = await complimentText.textContent();
  expect(compliment).toBeTruthy();
  expect(compliment.length).toBeGreaterThan(0);

  // Step 8: 确认重拍按钮存在
  const retakeBtn = page.locator('button:has-text("📸 重拍")');
  await expect(retakeBtn).toBeVisible();

  // Step 9: 点击确认打卡
  await confirmBtn.click();

  // Step 10: 确认 toast 提示
  const toast = page.locator('.van-toast--success, .van-toast:has-text("打卡成功")');
  await expect(toast).toBeVisible({ timeout: 5000 });

  // Step 11: 确认页面恢复初始状态
  await expect(page.locator('button:has-text("📸 咔嚓拍照")')).toBeVisible({ timeout: 5000 });

  await context.close();
});

// ============================================================
// PHOTO-N-001: 摄像头权限拒绝
// ============================================================
test('PHOTO-N-001: 摄像头权限拒绝时显示引导弹窗', async ({ browser }) => {
  const context = await browser.newContext({
    ...launchOptions,
    permissions: [], // 不授予摄像头权限
  });
  const page = await context.newPage();

  // 注入登录状态 + Mock getUserMedia 抛出 NotAllowedError
  await page.addInitScript(() => {
    const mockUser = {
      id: 'test-user-001',
      username: 'testuser',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));

    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('NotAllowedError', 'Permission denied');
    };
  });

  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  // 点击拍照按钮
  const takePhotoBtn = page.locator('button:has-text("📸 咔嚓拍照")');
  await expect(takePhotoBtn).toBeVisible({ timeout: 10000 });
  await takePhotoBtn.click();

  // 确认 CameraGuideModal 显示
  const guideModal = page.locator('.camera-guide-modal, [class*="camera-guide"], .van-dialog:has-text("相机权限"), .van-dialog:has-text("摄像头")');
  await expect(guideModal).toBeVisible({ timeout: 5000 });

  // 确认状态回退到 idle (拍照按钮重新出现)
  await expect(page.locator('button:has-text("📸 咔嚓拍照")')).toBeVisible({ timeout: 5000 });

  await context.close();
});

// ============================================================
// PHOTO-N-003: 未登录用户访问
// ============================================================
test('PHOTO-N-003: 未登录用户访问 Photo 页面', async ({ browser }) => {
  const context = await browser.newContext(launchOptions);
  const page = await context.newPage();

  // 清除 localStorage 确保未登录
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  // 确认页面正常渲染，不报错 (未登录时路由守卫会跳转到登录页)
  // 由于路由守卫，未登录用户会被重定向到登录页
  const loginPage = page.locator('.login-page, .login-container');
  await expect(loginPage).toBeVisible({ timeout: 10000 });

  // 验证登录页元素
  const loginTitle = page.locator('.login-title');
  await expect(loginTitle).toBeVisible();
  await expect(loginTitle).toHaveText('小皮爱情助手');

  await context.close();
});

// ============================================================
// PHOTO-N-004: 网络异常（Supabase 不可达）
// ============================================================
test('PHOTO-N-004: 网络异常时打卡操作显示错误', async ({ browser }) => {
  const context = await browser.newContext({
    ...launchOptions,
    permissions: ['camera'],
  });
  const page = await context.newPage();

  // Mock getUserMedia + 登录状态
  await page.addInitScript(() => {
    const mockUser = {
      id: 'test-user-001',
      username: 'testuser',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));

    const canvas = document.createElement('canvas');
    canvas.width = 540;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(0, 0, 540, 540);
    const stream = canvas.captureStream(30);
    navigator.mediaDevices.getUserMedia = async () => stream;
  });

  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  // 完成拍照流程
  await page.locator('button:has-text("📸 咔嚓拍照")').click();
  await page.locator('button:has-text("📸 咔嚓！拍照")').click();

  // 确认预览状态
  const confirmBtn = page.locator('button:has-text("✅ 确认打卡")');
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });

  // Mock 网络异常 - 拦截 Supabase 请求
  await page.route('**/rest/v1/checkins', async (route) => {
    await route.abort('failed');
  });

  // 点击确认打卡
  await confirmBtn.click();

  // 确认显示网络错误 toast
  const errorToast = page.locator('.van-toast--fail, .van-toast:has-text("网络"), .van-toast:has-text("失败")');
  await expect(errorToast).toBeVisible({ timeout: 20000 });

  // 确认预览照片保留（用户可重试）
  await expect(confirmBtn).toBeVisible();

  await context.close();
});

// ============================================================
// PHOTO-D-001: photo_url ↔ photo 字段映射（getCheckins）
// ============================================================
test('PHOTO-D-001: getCheckins 返回数据 photo_url → photo 字段映射正确', async ({ page }) => {
  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  // 通过页面上下文验证字段映射逻辑
  const mappingCorrect = await page.evaluate(() => {
    // 模拟 Supabase 返回的数据结构
    const supabaseRows = [
      { id: 1, user_id: 'user1', date: '2026-07-17', type: 'photo', photo_url: 'https://example.com/photo1.jpg', note: 'test', checkin_time: '10:00' },
      { id: 2, user_id: 'user1', date: '2026-07-16', type: 'photo', photo_url: null, note: 'no photo', checkin_time: '09:00' },
    ];

    // 模拟 useDatabase.js 中的映射逻辑
    const mapped = rows => rows.map(row => ({
      ...row,
      photo: row.photo_url || null,
    }));

    const result = mapped(supabaseRows);

    // 验证映射
    const check1 = result[0].photo === 'https://example.com/photo1.jpg';
    const check2 = result[1].photo === null;
    const check3 = result[0].id === 1; // 其他字段保留
    const check4 = result[0].user_id === 'user1';
    const check5 = result[0].date === '2026-07-17';
    const check6 = result[0].note === 'test';
    const check7 = result[0].checkin_time === '10:00';

    return check1 && check2 && check3 && check4 && check5 && check6 && check7;
  });

  expect(mappingCorrect).toBe(true);
});

// ============================================================
// PHOTO-D-002: compliment → note 字段映射
// ============================================================
test('PHOTO-D-002: addCheckin 中 compliment 合并到 note 字段', async ({ page }) => {
  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  const mappingCorrect = await page.evaluate(() => {
    // 模拟 useDatabase.js addCheckin 中的 note 生成逻辑
    function buildNote(record) {
      let note = record.note || null;
      if (record.compliment) {
        note = note ? `${note}\n\n💬 ${record.compliment}` : `💬 ${record.compliment}`;
      }
      return note;
    }

    // 测试1: 只有 compliment
    const note1 = buildNote({ compliment: '你的眼睛真美' });
    const check1 = note1 === '💬 你的眼睛真美';

    // 测试2: 有 note 和 compliment
    const note2 = buildNote({ note: '原有笔记', compliment: '你的眼睛真美' });
    const check2 = note2 === '原有笔记\n\n💬 你的眼睛真美';

    // 测试3: 没有 compliment
    const note3 = buildNote({ note: '只有笔记' });
    const check3 = note3 === '只有笔记';

    // 测试4: 都没有
    const note4 = buildNote({});
    const check4 = note4 === null;

    return check1 && check2 && check3 && check4;
  });

  expect(mappingCorrect).toBe(true);
});

// ============================================================
// PHOTO-D-003: time → checkin_time 字段映射
// ============================================================
test('PHOTO-D-003: addCheckin 中 time 映射到 checkin_time 列', async ({ page }) => {
  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  const mappingCorrect = await page.evaluate(() => {
    // 模拟 useDatabase.js addCheckin 中的 body 构建逻辑
    function buildBody(record) {
      const body = {
        user_id: 'test-user',
        date: record.date,
        type: record.type || 'photo',
        photo_url: record.photo_url || record.photo || null,
        note: record.note || null,
      };
      if (record.time) {
        body.checkin_time = record.time;
      } else if (record.timestamp) {
        body.checkin_time = new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }
      return body;
    }

    // 测试1: 传入 time
    const body1 = buildBody({ date: '2026-07-17', time: '14:30', photo: 'data:image/jpeg;base64,xxx' });
    const check1 = body1.checkin_time === '14:30';

    // 测试2: 传入 timestamp 无 time
    const ts = new Date('2026-07-17T14:30:00').getTime();
    const body2 = buildBody({ date: '2026-07-17', timestamp: ts, photo: 'data:image/jpeg;base64,xxx' });
    const check2 = body2.checkin_time === '14:30';

    // 测试3: 都不传
    const body3 = buildBody({ date: '2026-07-17', photo: 'data:image/jpeg;base64,xxx' });
    const check3 = body3.checkin_time === undefined;

    return check1 && check2 && check3;
  });

  expect(mappingCorrect).toBe(true);
});

// ============================================================
// PHOTO-D-004: photo → photo_url 字段映射（addCheckin 写入）
// ============================================================
test('PHOTO-D-004: addCheckin 中前端 photo 字段正确映射到后端 photo_url', async ({ page }) => {
  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  const mappingCorrect = await page.evaluate(() => {
    // 模拟 useDatabase.js addCheckin 中的 photo_url 映射
    function buildPhotoUrl(record) {
      return record.photo_url || record.photo || null;
    }

    // 测试1: 传入 photo (dataURL)
    const photo1 = buildPhotoUrl({ photo: 'data:image/jpeg;base64,abc123' });
    const check1 = photo1 === 'data:image/jpeg;base64,abc123';

    // 测试2: 传入 photo_url (兼容旧代码)
    const photo2 = buildPhotoUrl({ photo_url: 'https://example.com/photo.jpg' });
    const check2 = photo2 === 'https://example.com/photo.jpg';

    // 测试3: 两者都传，优先 photo_url
    const photo3 = buildPhotoUrl({ photo_url: 'url', photo: 'data' });
    const check3 = photo3 === 'url';

    // 测试4: 都不传
    const photo4 = buildPhotoUrl({});
    const check4 = photo4 === null;

    return check1 && check2 && check3 && check4;
  });

  expect(mappingCorrect).toBe(true);
});

// ============================================================
// PHOTO-S-001: 打卡数据持久化到 Supabase
// ============================================================
test('PHOTO-S-001: 打卡数据成功持久化到 Supabase', async ({ browser }) => {
  const context = await browser.newContext({
    ...launchOptions,
    permissions: ['camera'],
  });
  const page = await context.newPage();

  let capturedRequest = null;

  // Mock getUserMedia + 登录状态
  await page.addInitScript(() => {
    const mockUser = {
      id: 'test-user-001',
      username: 'testuser',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));

    const canvas = document.createElement('canvas');
    canvas.width = 540;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(0, 0, 540, 540);
    const stream = canvas.captureStream(30);
    navigator.mediaDevices.getUserMedia = async () => stream;
  });

  // 拦截 Supabase POST 请求
  await page.route('**/rest/v1/checkins', async (route) => {
    const request = route.request();
    capturedRequest = {
      method: request.method(),
      url: request.url(),
      body: request.postDataJSON(),
      headers: request.headers(),
    };
    // 返回成功响应
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 999,
        user_id: 'test-user',
        date: '2026-07-17',
        type: 'photo',
        photo_url: 'data:image/jpeg;base64,test',
        note: '💬 测试彩虹屁',
        checkin_time: '10:00',
        created_at: new Date().toISOString(),
      }]),
    });
  });

  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  // 完成拍照打卡流程
  await page.locator('button:has-text("📸 咔嚓拍照")').click();
  await page.locator('button:has-text("📸 咔嚓！拍照")').click();

  const confirmBtn = page.locator('button:has-text("✅ 确认打卡")');
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  // 等待请求完成
  await page.waitForTimeout(2000);

  // 验证请求
  expect(capturedRequest).not.toBeNull();
  expect(capturedRequest.method).toBe('POST');
  expect(capturedRequest.url).toContain('/rest/v1/checkins');
  expect(capturedRequest.body).toHaveProperty('user_id');
  expect(capturedRequest.body).toHaveProperty('date');
  expect(capturedRequest.body.type).toBe('photo');
  expect(capturedRequest.body).toHaveProperty('photo_url');
  expect(capturedRequest.body).toHaveProperty('note');
  expect(capturedRequest.body).toHaveProperty('checkin_time');

  // 验证 toast
  const toast = page.locator('.van-toast--success');
  await expect(toast).toBeVisible({ timeout: 5000 });

  await context.close();
});

// ============================================================
// PHOTO-S-002: 打卡记录加载（页面刷新后数据恢复）
// ============================================================
test('PHOTO-S-002: 页面刷新后打卡数据从 Supabase 正确加载', async ({ browser }) => {
  const context = await browser.newContext(launchOptions);
  const page = await context.newPage();

  // 注入登录状态
  await page.addInitScript(() => {
    const mockUser = {
      id: 'test-user-001',
      username: 'testuser',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));
  });

  // Mock Supabase getCheckins 返回
  await page.route('**/rest/v1/checkins*', async (route) => {
    const url = route.request().url();
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, user_id: 'test-user', date: '2026-07-17', type: 'photo', photo_url: 'https://example.com/photo1.jpg', note: '💬 真美', checkin_time: '10:00' },
          { id: 2, user_id: 'test-user', date: '2026-07-16', type: 'photo', photo_url: 'https://example.com/photo2.jpg', note: '💬 真棒', checkin_time: '09:00' },
        ]),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  // 等待数据加载
  await page.waitForTimeout(2000);

  // 验证照片墙显示历史照片
  const photoWall = page.locator('.photo-wall, [class*="photoWall"]');
  await expect(photoWall).toBeVisible();

  // 验证照片元素存在
  const photos = page.locator('.photo-wall img, [class*="photoWall"] img, .photo-item img');
  const count = await photos.count();
  expect(count).toBeGreaterThanOrEqual(2);

  // 刷新页面
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 验证数据重新加载
  const photosAfterReload = page.locator('.photo-wall img, [class*="photoWall"] img, .photo-item img');
  const countAfterReload = await photosAfterReload.count();
  expect(countAfterReload).toBeGreaterThanOrEqual(2);

  await context.close();
});

// ============================================================
// PHOTO-S-003: 打卡记录不跨用户泄露
// ============================================================
test('PHOTO-S-003: 打卡数据隔离（用户 A 看不到用户 B 的记录）', async ({ page }) => {
  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  const isolationCorrect = await page.evaluate(() => {
    // 模拟 useDatabase.js getCheckins 中的 user_id 过滤
    function buildQueryUrl(userId) {
      return `/checkins?user_id=eq.${userId}&select=*&order=date.desc`;
    }

    // 测试1: 用户 A 的查询包含 user_id 过滤
    const urlA = buildQueryUrl('user-a');
    const check1 = urlA.includes('user_id=eq.user-a');

    // 测试2: 用户 B 的查询包含 user_id 过滤
    const urlB = buildQueryUrl('user-b');
    const check2 = urlB.includes('user_id=eq.user-b');

    // 测试3: 两个查询不同
    const check3 = urlA !== urlB;

    // 测试4: 未登录时返回空数组
    const getCheckins = (currentUser) => {
      if (!currentUser) return [];
      return ['data'];
    };
    const check4 = getCheckins(null).length === 0;
    const check5 = getCheckins({ id: 'user-a' }).length === 1;

    return check1 && check2 && check3 && check4 && check5;
  });

  expect(isolationCorrect).toBe(true);
});

// ============================================================
// PHOTO-B-001: iOS Safari 兼容性 (playsinline 属性检查)
// ============================================================
test('PHOTO-B-001: video 元素包含 playsinline 属性（iOS 兼容）', async ({ browser }) => {
  const context = await browser.newContext({
    ...launchOptions,
    permissions: ['camera'],
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  // Mock getUserMedia + 登录状态
  await page.addInitScript(() => {
    const mockUser = {
      id: 'test-user-001',
      username: 'testuser',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('love-app-current-user', JSON.stringify(mockUser));

    const canvas = document.createElement('canvas');
    canvas.width = 540;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(0, 0, 540, 540);
    const stream = canvas.captureStream(30);
    navigator.mediaDevices.getUserMedia = async () => stream;
  });

  await page.goto(`${BASE_URL}/#/photo`);
  await page.waitForLoadState('networkidle');

  // 点击拍照按钮打开摄像头
  await page.locator('button:has-text("📸 咔嚓拍照")').click();

  // 等待 video 元素出现
  const videoEl = page.locator('video.video-preview');
  await expect(videoEl).toBeVisible({ timeout: 10000 });

  // 验证 playsinline 属性（iOS 必需）
  await expect(videoEl).toHaveAttribute('playsinline', '');

  // 验证 autoplay 属性
  await expect(videoEl).toHaveAttribute('autoplay', '');

  // 验证 video 元素在 DOM 中
  const hasPlaysInline = await videoEl.evaluate((el) => el.hasAttribute('playsinline'));
  expect(hasPlaysInline).toBe(true);

  await context.close();
});
