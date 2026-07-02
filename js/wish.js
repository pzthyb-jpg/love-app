/**
 * ✨ 愿望池模块
 * 提交愿望 + 彩色气泡展示
 */

const WishModule = {
  wishes: [],

  init() {
    this.loadWishes();
  },

  loadWishes() {
    try {
      this.wishes = JSON.parse(localStorage.getItem('wishes') || '[]');
    } catch(e) {
      this.wishes = [];
    }
  },

  saveWishes() {
    localStorage.setItem('wishes', JSON.stringify(this.wishes));
  },

  addWish(text, type) {
    if (!text.trim()) return false;
    this.wishes.push({
      id: Date.now() + Math.random(),
      text: text.trim(),
      type: type || 'wish',  // 'wish' 或 'vent'
      time: new Date().toISOString(),
      timeStr: new Date().toTimeString().slice(0, 5),
      dateStr: new Date().toISOString().slice(0, 10)
    });
    this.saveWishes();
    return true;
  },

  deleteWish(id) {
    const index = this.wishes.findIndex(w => w.id === id);
    if (index !== -1) {
      this.wishes.splice(index, 1);
      this.saveWishes();
      return true;
    }
    return false;
  },

  renderPage() {
    const container = document.getElementById('wish-content');

    container.innerHTML = `
      <div class="card card-gradient" style="text-align:center;padding:24px 20px;">
        <div style="font-size:42px;margin-bottom:8px;">✨</div>
        <div style="font-size:18px;font-weight:700;">愿望池</div>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-top:4px;">所有的愿望，都会在这里闪闪发光 ✨</div>
      </div>

      <!-- 提交表单 -->
      <div class="card">
        <div style="font-size:14px;font-weight:600;margin-bottom:4px;">💭 写点什么</div>
        <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:12px;">愿望、吐槽、心情，随便写写~</div>
        <div class="input-group">
          <textarea class="input" id="wish-input" placeholder="许个愿吧 ✨ 或者吐槽一下 😤..." maxlength="200"></textarea>
          <div style="text-align:right;font-size:11px;color:var(--color-text-secondary);margin-top:4px;"><span id="wish-char-count">0</span>/200</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary btn-block" id="btn-wish-submit">✨ 许个愿</button>
          <button class="btn btn-secondary btn-block" id="btn-vent-submit">😤 吐个槽</button>
        </div>
      </div>

      <!-- 愿望池展示 -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:14px;font-weight:600;">🎈 愿望气泡 (${this.wishes.length})</div>
          ${this.wishes.length > 0 ? `<button class="btn btn-ghost btn-small" id="btn-clear-wishes" style="color:#F87171;font-size:12px;">清空</button>` : ''}
        </div>
        <div class="wish-pool" id="wish-pool">
        ${this.wishes.length === 0 ? `
          <div class="wish-empty">
            🌟 还没有愿望呢~<br>
            来写下第一个愿望吧！
          </div>
        ` : this.wishes.slice().reverse().map(w => `
          <div class="wish-bubble" data-id="${w.id}" style="position:relative;">
            ${w.type === 'vent' ? '😤 ' : '✨ '}${this.escapeHtml(w.text)}
            <span class="wish-time">${w.dateStr.slice(5)} ${w.timeStr}</span>
            <span class="wish-del-btn" data-id="${w.id}" style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#F87171;color:white;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0.6;">✕</span>
          </div>
        `).join('')}
        </div>
        </div>
    `;

    this.bindEvents();
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  bindEvents() {
    const input = document.getElementById('wish-input');
    const wishBtn = document.getElementById('btn-wish-submit');
    const ventBtn = document.getElementById('btn-vent-submit');
    const charCount = document.getElementById('wish-char-count');

    if (input && charCount) {
      input.addEventListener('input', () => {
        charCount.textContent = input.value.length;
      });
    }

    const submitWish = (type) => {
      if (!input) return;
      const text = input.value.trim();
      if (!text) {
        PhotoModule.showToast('写点什么再提交呀~');
        return;
      }
      if (this.addWish(text, type)) {
        input.value = '';
        if (charCount) charCount.textContent = '0';
        this.renderPage();
        const msg = type === 'vent' ? '😤 吐槽已投放！' : '✨ 愿望已许下！会实现的~';
        PhotoModule.showToast(msg);
      }
    };

    if (wishBtn) wishBtn.addEventListener('click', () => submitWish('wish'));
    if (ventBtn) ventBtn.addEventListener('click', () => submitWish('vent'));

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          wishBtn.click();
        }
      });
    }

    // 删除单个愿望
    document.querySelectorAll('.wish-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseFloat(e.target.dataset.id);
        if (this.deleteWish(id)) {
          this.renderPage();
        }
      });
    });

    // 清空全部
    const clearBtn = document.getElementById('btn-clear-wishes');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (this.wishes.length > 0) {
          this.wishes = [];
          this.saveWishes();
          this.renderPage();
          PhotoModule.showToast('✨ 愿望池已清空，等待新的愿望~');
        }
      });
    }
  }
};