/**
 * 🍽️ 午餐大转盘模块
 * 附近餐厅 + 幸运转盘
 */

const LunchModule = {
  restaurants: [],
  isSpinning: false,
  wheelCanvas: null,
  currentRotation: 0,

  // 默认推荐餐厅
  defaultRestaurants: [
    { name: '饺子馆', distance: '0.8km', rating: 4.5, tags: ['面食', '实惠'] },
    { name: '兰州拉面', distance: '0.5km', rating: 4.2, tags: ['面食', '快捷'] },
    { name: '快餐店', distance: '0.3km', rating: 4.0, tags: ['快餐', '便利'] },
    { name: '轻食沙拉', distance: '1.2km', rating: 4.6, tags: ['健康', '轻食'] },
    { name: '咖喱屋', distance: '1.5km', rating: 4.3, tags: ['日式', '浓郁'] },
    { name: '披萨店', distance: '2.0km', rating: 4.4, tags: ['西式', '分享'] },
    { name: '麻辣烫', distance: '0.6km', rating: 4.1, tags: ['麻辣', '随心选'] },
    { name: '寿司店', distance: '1.8km', rating: 4.7, tags: ['日料', '精致'] },
    { name: '火锅', distance: '2.5km', rating: 4.8, tags: ['聚餐', '热辣'] },
    { name: '煎饼果子', distance: '0.4km', rating: 4.3, tags: ['街头', '经典'] },
  ],

  // 转盘颜色
  wheelColors: [
    '#FF6B9D', '#FF8DBB', '#C084FC', '#A78BFA',
    '#F472B6', '#FB7185', '#E879F9', '#818CF8',
    '#F43F5E', '#EC4899',
  ],

  init() {
    this.loadRestaurants();
    this.wheelCanvas = document.getElementById('wheel-canvas');
  },

  loadRestaurants() {
    try {
      const saved = localStorage.getItem('restaurants');
      if (saved) {
        this.restaurants = JSON.parse(saved);
      } else {
        this.restaurants = [...this.defaultRestaurants];
        this.saveRestaurants();
      }
    } catch(e) {
      this.restaurants = [...this.defaultRestaurants];
    }
  },

  saveRestaurants() {
    localStorage.setItem('restaurants', JSON.stringify(this.restaurants));
  },

  addRestaurant(name, distance) {
    if (!name.trim()) return false;
    this.restaurants.push({
      name: name.trim(),
      distance: distance || '附近',
      rating: 4.0,
      tags: ['自定义']
    });
    this.saveRestaurants();
    return true;
  },

  removeRestaurant(index) {
    if (index >= 0 && index < this.restaurants.length) {
      this.restaurants.splice(index, 1);
      this.saveRestaurants();
      return true;
    }
    return false;
  },

  resetToDefaults() {
    this.restaurants = [...this.defaultRestaurants];
    this.saveRestaurants();
  },

  // 绘制转盘
  drawWheel(rotation = 0) {
    const canvas = this.wheelCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const count = this.restaurants.length;
    if (count === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#F3F4F6';
      ctx.beginPath();
      ctx.arc(150, 150, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('添加餐厅开始转盘', 150, 155);
      return;
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 5;
    const arcSize = (Math.PI * 2) / count;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < count; i++) {
      const startAngle = rotation + i * arcSize;
      const endAngle = startAngle + arcSize;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      const color = this.wheelColors[i % this.wheelColors.length];
      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 文字
      const midAngle = startAngle + arcSize / 2;
      const textRadius = radius * 0.65;
      const tx = cx + Math.cos(midAngle) * textRadius;
      const ty = cy + Math.sin(midAngle) * textRadius;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle);

      // 截取餐厅名（去掉表情符号，Canvas 不支持 emoji）
      let name = this.restaurants[i].name;
      const cleanName = name.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
      const displayName = cleanName.length > 5 ? cleanName.slice(0, 5) + '..' : cleanName;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px -apple-system, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3;
      ctx.fillText(displayName || '餐厅', 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // 内圈装饰
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,107,157,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
  },

  // 旋转转盘
  spinWheel() {
    if (this.isSpinning) return;
    if (this.restaurants.length < 2) {
      PhotoModule.showToast('至少需要 2 家餐厅才能转哦');
      return;
    }

    this.isSpinning = true;
    const spinBtn = document.getElementById('wheel-spin-btn');
    if (spinBtn) {
      spinBtn.textContent = '...';
      spinBtn.disabled = true;
    }

    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = Math.random() * Math.PI * 2;
    const totalRotation = extraSpins * Math.PI * 2 + targetAngle;
    const finalRotation = this.currentRotation + totalRotation;

    const startRotation = this.currentRotation;
    const duration = 4000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + totalRotation * eased;

      this.drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.currentRotation = finalRotation;
        this.isSpinning = false;
        if (spinBtn) {
          spinBtn.textContent = '转！';
          spinBtn.disabled = false;
        }

        const resultIndex = this.getResultIndex(finalRotation);
        this.showResult(resultIndex);
      }
    };

    requestAnimationFrame(animate);
  },

  getResultIndex(rotation) {
    const count = this.restaurants.length;
    const arcSize = (Math.PI * 2) / count;
    const normalized = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const pointerAngle = (3 * Math.PI / 2 - normalized + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor(pointerAngle / arcSize) % count;
    return index;
  },

  showResult(index) {
    const restaurant = this.restaurants[index];
    if (!restaurant) return;

    const overlay = document.getElementById('result-overlay');
    const modal = document.getElementById('result-modal');
    if (!overlay || !modal) return;

    modal.innerHTML = `
      <div class="result-icon">🎉</div>
      <div class="result-title">今天就吃这个！</div>
      <div style="font-size:24px;font-weight:700;margin:12px 0;color:var(--color-primary);">${restaurant.name}</div>
      <div class="result-desc">
        📍 ${restaurant.distance} · ⭐ ${restaurant.rating}
      </div>
      <div class="result-actions">
        <button class="btn btn-primary btn-small" onclick="document.getElementById('result-overlay').classList.remove('show')">好！就去这家 🎯</button>
        <button class="btn btn-secondary btn-small" onclick="LunchModule.spinWheel();document.getElementById('result-overlay').classList.remove('show')">再转一次 🔄</button>
      </div>
    `;

    overlay.classList.add('show');

    try {
      const history = JSON.parse(localStorage.getItem('lunch_history') || '[]');
      const now = new Date();
      history.push({
        restaurant: restaurant.name,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5)
      });
      if (history.length > 30) history.splice(0, history.length - 30);
      localStorage.setItem('lunch_history', JSON.stringify(history));
    } catch(e) {}
  },

  // 获取午餐历史 HTML
  getLunchHistoryHTML() {
    try {
      const history = JSON.parse(localStorage.getItem('lunch_history') || '[]');
      if (!history.length) return '';
      const recent = history.slice(-5).reverse();
      const today = new Date().toISOString().slice(0, 10);
      return `
      <div class="card">
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">📜 最近吃过的</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${recent.map(h => `
            <span style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:${h.date === today ? '#FFF0F6' : '#F9FAFB'};border-radius:12px;font-size:13px;${h.date === today ? 'border:1px solid var(--color-primary-light);' : ''}">
              ${h.date === today ? '❤️ ' : ''}${h.restaurant}
              <span style="color:var(--color-text-secondary);font-size:11px;">${h.date.slice(5)}</span>
            </span>
          `).join('')}
        </div>
      </div>`;
    } catch(e) {
      return '';
    }
  },

  // 渲染页面
  renderPage() {
    const container = document.getElementById('lunch-content');

    container.innerHTML = `
      <div class="card card-gradient" style="text-align:center;padding:24px 20px;">
        <div style="font-size:42px;margin-bottom:8px;">🍽️</div>
        <div style="font-size:18px;font-weight:700;">今天中午吃什么？</div>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-top:4px;">让命运的大转盘来帮你决定！</div>
      </div>

      <div style="text-align:center;">
        <div class="wheel-container">
          <div class="wheel-pointer">📍</div>
          <canvas id="wheel-canvas" class="wheel-canvas" width="300" height="300"></canvas>
          <button class="wheel-spin-btn" id="wheel-spin-btn">转！</button>
        </div>
      </div>

      <!-- 最近吃过的 -->
      ${this.getLunchHistoryHTML()}

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:14px;font-weight:600;">📋 附近餐厅 (${this.restaurants.length})</div>
          <button class="btn btn-ghost btn-small" id="btn-reset-restaurants" style="color:var(--color-text-secondary);">🔄 重置</button>
        </div>
        <div class="restaurant-list" id="restaurant-list">
          ${this.restaurants.map((r, i) => `
            <div class="restaurant-item">
              <div>
                <div class="r-name">${r.name}</div>
                <div class="r-distance">📍 ${r.distance}</div>
              </div>
              <button class="btn btn-ghost btn-small del-restaurant" data-index="${i}" style="color:#F87171;padding:4px 8px;min-height:auto;">✕</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">➕ 添加餐厅</div>
        <div style="display:flex;gap:8px;">
          <input class="input" id="input-restaurant-name" placeholder="输入餐厅名称" style="flex:1;">
          <button class="btn btn-primary btn-small" id="btn-add-restaurant">添加</button>
        </div>
        <input class="input" id="input-restaurant-distance" placeholder="距离（可选，如 1.5km）" style="margin-top:8px;font-size:13px;">
      </div>
    `;

    this.init();
    this.bindEvents();

    setTimeout(() => {
      this.drawWheel(this.currentRotation);
    }, 50);
  },

  bindEvents() {
    const spinBtn = document.getElementById('wheel-spin-btn');
    if (spinBtn) {
      spinBtn.addEventListener('click', () => this.spinWheel());
    }

    const addBtn = document.getElementById('btn-add-restaurant');
    const nameInput = document.getElementById('input-restaurant-name');
    const distInput = document.getElementById('input-restaurant-distance');

    if (addBtn && nameInput) {
      addBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) {
          PhotoModule.showToast('请输入餐厅名称');
          return;
        }
        const dist = distInput ? distInput.value.trim() || '附近' : '附近';
        if (this.addRestaurant(name, dist)) {
          nameInput.value = '';
          if (distInput) distInput.value = '';
          this.renderPage();
          PhotoModule.showToast('已添加 ' + name);
        }
      });

      nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addBtn.click();
      });
    }

    document.querySelectorAll('.del-restaurant').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const name = this.restaurants[index]?.name;
        if (this.removeRestaurant(index)) {
          this.renderPage();
          PhotoModule.showToast('已移除 ' + name);
        }
      });
    });

    const resetBtn = document.getElementById('btn-reset-restaurants');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetToDefaults();
        this.renderPage();
        PhotoModule.showToast('已恢复默认餐厅列表');
      });
    }
  }
};