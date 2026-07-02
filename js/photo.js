/**
 * 📸 拍照打卡模块
 * 调用摄像头自拍 + 彩虹屁展示
 */

const PhotoModule = {
  stream: null,
  videoEl: null,
  canvasEl: null,
  isCameraOn: false,

  init() {
    this.videoEl = document.getElementById('camera-video');
    this.canvasEl = document.getElementById('camera-canvas');
  },

  // 打开摄像头
  async startCamera() {
    try {
      // 优先使用前置摄像头
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false
      });
      this.videoEl.srcObject = this.stream;
      this.isCameraOn = true;
      return true;
    } catch (err) {
      console.error('摄像头启动失败:', err);
      return false;
    }
  },

  // 关闭摄像头
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.videoEl.srcObject = null;
    this.isCameraOn = false;
  },

  // 拍照
  takePhoto() {
    if (!this.isCameraOn) return null;
    
    const video = this.videoEl;
    const canvas = this.canvasEl;
    
    // 设置 canvas 尺寸与视频一致
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    
    // 水平翻转（前置摄像头镜像）
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.85);
  },

  // 渲染主页
  async renderPage() {
    const container = document.getElementById('photo-content');
    const todayChecked = ComplimentEngine.hasCheckedInToday();
    const weekStatus = ComplimentEngine.getWeekStatus();
    
    container.innerHTML = `
      <div class="card card-gradient" style="text-align:center;padding:24px 20px;">
        <div style="font-size:42px;margin-bottom:8px;">📸</div>
        <div style="font-size:18px;font-weight:700;">今天的宝，有多漂亮？</div>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-top:4px;">${new Date().getFullYear()}年${new Date().getMonth()+1}月${new Date().getDate()}日 ${ComplimentEngine.getDayName()}</div>
      </div>

      <!-- 拍照区域 -->
      <div style="text-align:center;">
        <div class="photo-preview" id="photo-preview-area">
          <video id="camera-video" autoplay playsinline muted style="display:none;"></video>
          <canvas id="camera-canvas" style="display:none;"></canvas>
          <div class="placeholder-icon" id="photo-placeholder">
            ${todayChecked ? '❤️' : '😊'}
          </div>
        </div>
      </div>

      <!-- 按钮区 -->
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <button class="btn btn-primary btn-block" id="btn-take-photo">
          ${todayChecked ? '📸 再拍一张' : '📸 开始拍照打卡'}
        </button>
      </div>

      <!-- 彩虹屁区域 -->
      <div id="compliment-area" style="${todayChecked ? '' : 'display:none;'}">
        <div class="compliment-card" id="compliment-card">
          <div class="compliment-text" id="compliment-text">
            ${todayChecked ? this.getLastCompliment() : '✨ 拍完照就有彩虹屁哦~'}
          </div>
        </div>
      </div>

      <!-- 本周打卡状态 -->
      <div class="card">
        <div style="font-size:14px;font-weight:600;margin-bottom:12px;">📅 本周打卡 <span style="font-weight:400;color:var(--color-text-secondary);font-size:12px;">（坚持${this.getStreakDays()}天）</span></div>
        <div class="history-list" id="week-history">
          ${weekStatus.map(d => `
            <div class="history-item ${d.checked ? 'checked' : 'missed'}" style="${d.isToday ? 'border:2px solid var(--color-primary);' : ''}">
              <span>${d.checked ? '✅' : '⭕'}</span>
              <span>周${d.dayName}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 定时提醒开关 -->
      <div class="card">
        <div class="toggle-row">
          <span class="toggle-label">⏰ 中午打卡提醒</span>
          <div class="toggle-switch ${this.getNotificationEnabled() ? 'on' : ''}" id="toggle-notification"></div>
        </div>
        <div style="font-size:12px;color:var(--color-text-secondary);">每天 11:30 ~ 13:00 提醒宝贝拍照打卡 💕</div>
      </div>
    `;

    this.init();
    this.bindEvents();
  },

  getStreakDays() {
    const history = ComplimentEngine.getHistory();
    if (!history.length) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      if (history.some(h => h.date === dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  },

  getLastCompliment() {
    const history = ComplimentEngine.getHistory();
    const last = history[history.length - 1];
    return last ? last.compliment : '✨ 我的宝今天也超好看！';
  },

  getNotificationEnabled() {
    return localStorage.getItem('notification_enabled') === 'true';
  },

  async bindEvents() {
    const btn = document.getElementById('btn-take-photo');
    if (!btn) return;

    // 拍照按钮
    btn.addEventListener('click', async () => {
      btn.textContent = '📷 打开相机中...';
      btn.disabled = true;
      btn.classList.add('btn-disabled');

      const success = await this.startCamera();
      if (!success) {
        this.showToast('😢 无法打开摄像头，请允许相机权限');
        btn.textContent = '📸 开始拍照打卡';
        btn.disabled = false;
        btn.classList.remove('btn-disabled');
        return;
      }

      // 显示视频流
      const video = document.getElementById('camera-video');
      const placeholder = document.getElementById('photo-placeholder');
      video.style.display = 'block';
      placeholder.style.display = 'none';

      btn.textContent = '📸 咔嚓！拍照';
      btn.disabled = false;
      btn.classList.remove('btn-disabled');

      // 切换为拍照动作
      btn.onclick = () => this.handleTakePhoto(btn);
    });
  },

  handleTakePhoto(btn) {
    const photoDataUrl = this.takePhoto();
    if (!photoDataUrl) return;

    // 显示照片
    const video = document.getElementById('camera-video');
    const preview = document.getElementById('photo-preview-area');
    video.style.display = 'none';
    
    const img = document.createElement('img');
    img.src = photoDataUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    preview.appendChild(img);

    // 生成彩虹屁
    const compliment = ComplimentEngine.generate();
    
    // 保存打卡
    ComplimentEngine.saveCheckin(photoDataUrl, compliment);

    // 显示彩虹屁
    const complimentArea = document.getElementById('compliment-area');
    const complimentText = document.getElementById('compliment-text');
    complimentArea.style.display = 'block';
    complimentText.innerHTML = `
      <span class="emoji">💝</span><br>
      ${compliment.text.replace(/\n/g, '<br>')}
      <div class="compliment-time">${compliment.dayName} ${compliment.time} · 已存档</div>
    `;

    // 重新渲染本周状态
    const weekStatus = ComplimentEngine.getWeekStatus();
    const historyEl = document.getElementById('week-history');
    if (historyEl) {
      historyEl.innerHTML = weekStatus.map(d => `
        <div class="history-item ${d.checked ? 'checked' : 'missed'}" style="${d.isToday ? 'border:2px solid var(--color-primary);' : ''}">
          <span>${d.checked ? '✅' : '⭕'}</span>
          <span>周${d.dayName}</span>
        </div>
      `).join('');
    }

    // 关闭摄像头
    this.stopCamera();

    // 重置按钮
    btn.textContent = '📸 再拍一张';
    btn.disabled = false;
    btn.classList.remove('btn-disabled');
    btn.onclick = () => {
      // 移除旧照片
      const oldImg = preview.querySelector('img');
      if (oldImg) oldImg.remove();
      const placeholder = document.getElementById('photo-placeholder');
      placeholder.style.display = 'block';
      this.renderPage();
    };

    this.showToast('🎉 打卡成功！宝今天也超美！');
  },

  // 通知权限和定时
  setupNotification() {
    const toggle = document.getElementById('toggle-notification');
    if (!toggle) return;

    toggle.addEventListener('click', async () => {
      const isOn = toggle.classList.contains('on');
      if (isOn) {
        toggle.classList.remove('on');
        localStorage.setItem('notification_enabled', 'false');
        this.showToast('🔕 中午提醒已关闭');
      } else {
        // 请求通知权限
        if ('Notification' in window && Notification.permission === 'default') {
          const result = await Notification.requestPermission();
          if (result !== 'granted') {
            this.showToast('😅 需要允许通知才能提醒哦');
            return;
          }
        }
        toggle.classList.add('on');
        localStorage.setItem('notification_enabled', 'true');
        this.showToast('🔔 中午提醒已开启，11:30 见~ 💕');
      }
    });
  },

  // 检查并触发中午提醒
  checkLunchReminder() {
    if (!this.getNotificationEnabled()) return;
    if (!ComplimentEngine.shouldRemind()) return;
    if (ComplimentEngine.hasCheckedInToday()) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('💕 宝贝该打卡啦！', {
        body: '中午啦！让男朋友看看今天有多漂亮~ 📸✨',
        icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E💕%3C/text%3E%3C/svg%3E'
      });
    }
  },

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
};