/**
 * 🏠 小皮爱情助手 — 首页仪表盘
 * 在一起天数、爱的数据、今日状态、留言预览、本周打卡
 */

const HomeModule = {

  renderPage() {
    const container = document.getElementById('home-content');
    if (!container) return;

    const data = AppStore.getHomePageData();

    container.innerHTML = `
      <!-- 在一起天数（大号数字动画） -->
      <div class="card card-gradient days-together-card">
        <div class="days-label">💕 我们在一起</div>
        <div class="days-number" id="days-number">${this.animateNumber(0, data.daysTogether)}</div>
        <div class="days-unit">天</div>
      </div>

      <!-- 爱的数据统计 -->
      <div class="stats-row">
        <div class="stat-item" onclick="App.switchTab('photo')">
          <div class="stat-value">${data.totalCheckins}</div>
          <div class="stat-label">📸 累计打卡</div>
        </div>
        <div class="stat-item" onclick="App.switchTab('lunch')">
          <div class="stat-value">${data.totalSpins}</div>
          <div class="stat-label">🎡 转盘次数</div>
        </div>
        <div class="stat-item" onclick="App.switchTab('wish')">
          <div class="stat-value">${data.fulfilledWishes}</div>
          <div class="stat-label">✨ 愿望实现</div>
        </div>
      </div>

      <!-- 今日状态三圆 -->
      <div class="status-rings">
        <div class="status-ring ${data.hasCheckedInToday ? 'done' : ''}" onclick="App.switchTab('photo')">
          <span>${data.hasCheckedInToday ? '✅' : '📸'}</span>
          <span class="ring-label">打卡</span>
        </div>
        <div class="status-ring ${data.streak > 0 ? 'done' : ''}" onclick="App.switchTab('photo')">
          <span>🔥</span>
          <span class="ring-label">${data.streak}天</span>
        </div>
        <div class="status-ring ${data.latestMessage ? 'done' : ''}" onclick="App.switchTab('wish')">
          <span>💌</span>
          <span class="ring-label">留言</span>
        </div>
      </div>

      <!-- 留言预览卡片 -->
      <div class="card message-preview-card" onclick="App.switchTab('wish')" style="cursor:pointer;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:14px;font-weight:600;">💌 来自男朋友的话</span>
          <span style="font-size:11px;color:var(--color-text-secondary);">点击查看全部 →</span>
        </div>
        ${data.latestMessage ? `
          <div class="message-preview-text">${AppUtils.escapeHtml(data.latestMessage.content)}</div>
          <div class="message-preview-date">${data.latestMessage.date || '今日'}</div>
        ` : `
          <div class="message-preview-empty">还没有留言呢~等待惊喜到来 💕</div>
        `}
      </div>

      <!-- 本周打卡进度条 -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:14px;font-weight:600;">📅 本周打卡</span>
          <span style="font-size:12px;color:var(--color-text-secondary);">${data.weekStatus.filter(d => d.checked).length}/7 天</span>
        </div>
        <div class="week-progress-bar">
          <div class="week-progress-fill" style="width:${(data.weekStatus.filter(d => d.checked).length / 7) * 100}%"></div>
        </div>
        <div class="week-dots">
          ${data.weekStatus.map(d => `
            <div class="week-dot ${d.checked ? 'checked' : ''} ${d.isToday ? 'today' : ''}">
              <span class="dot-icon">${d.checked ? '✅' : '○'}</span>
              <span class="dot-label">周${d.dayName}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 成就进度 -->
      <div class="card" style="margin-bottom:10px;">
        <div style="font-size:14px;font-weight:600;margin-bottom:10px;">🏆 爱情成就</div>
        ${data.nextBadge ? `
          <div style="text-align:center;padding:8px 0;">
            <div style="font-size:36px;margin-bottom:4px;">${data.nextBadge.icon}</div>
            <div style="font-size:13px;font-weight:600;">${data.nextBadge.name}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:8px;">连续打卡 ${data.nextBadge.days} 天 · 还差 ${data.nextBadge.remaining} 天</div>
            <div class="achievement-progress-bar">
              <div class="achievement-progress-fill" style="width:${(data.nextBadge.progress / data.nextBadge.days) * 100}%"></div>
            </div>
          </div>
        ` : `
          <div style="text-align:center;padding:8px 0;">
            <div style="font-size:36px;margin-bottom:4px;">💎</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">🎉 所有成就已达成！你们是永恒的爱~</div>
          </div>
        `}
        <div class="achievement-badges">
          ${AppStore.BADGES.map(b => `
            <div class="badge-item ${data.achievements.some(a => a.id === b.id) ? 'unlocked' : 'locked'}">
              <span class="badge-icon">${b.icon}</span>
              <span class="badge-name">${b.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // 启动天数滚动动画
    this.startDayAnimation(data.daysTogether);

    // 绑定事件
    this.bindEvents();
  },

  /** 天数滚动动画（requestAnimationFrame） */
  animateNumber(from, to) {
    // 初始显示为从 0 滚动到目标值的状态
    return `<span class="day-number-inner" data-target="${to}">0</span>`;
  },

  startDayAnimation(target) {
    const el = document.querySelector('.day-number-inner');
    if (!el || target === 0) {
      if (el) el.textContent = target || '0';
      return;
    }

    const duration = Math.min(2000, 500 + target * 30);
    const startTime = performance.now();
    const startVal = 0;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out 缓动
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (target - startVal) * eased);
      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    };

    requestAnimationFrame(step);
  },

  bindEvents() {
    // 设置向导的纪念日字段（如果存在）
    const setupBtn = document.getElementById('btn-setup-complete');
    if (setupBtn) {
      // 已经通过 inline onclick 绑定在 app.js 中
    }
  }
};

// 暴露到全局命名空间
window.HomeModule = HomeModule;
