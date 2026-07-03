/**
 * 💌 小皮爱情助手 — 男朋友留言板 (F-03)
 * 留言 CRUD、条件匹配、管理后台
 */

const MessagesModule = {
  // ===== 留言数据结构定义 =====
  // {
  //   id: string,
  //   content: string,
  //   type: 'morning' | 'evening' | 'random' | 'special',
  //   date: string (YYYY-MM-DD, 精确日期),
  //   sender: '泓博',
  //   condition: 'anniversary' | 'festival' | null (触发条件),
  //   displayedDates: string[] (已展示的日期列表)
  // }

  /** 获取所有留言 */
  getMessages() {
    return AppUtils.safeGetJSON(AppStore.KEYS.MESSAGES, []);
  },

  /** 保存留言列表 */
  saveMessages(messages) {
    return AppUtils.safeSetJSON(AppStore.KEYS.MESSAGES, messages);
  },

  /**
   * 新增留言
   * @param {Object} msgData - 留言数据（不含 id）
   * @returns {Object} 完整的留言对象
   */
  addMessage(msgData) {
    const messages = this.getMessages();
    const msg = {
      id: AppUtils.generateId(),
      content: msgData.content || '',
      type: msgData.type || 'random',
      date: msgData.date || '',
      sender: '泓博',
      condition: msgData.condition || null,
      displayedDates: [],
    };
    messages.push(msg);
    this.saveMessages(messages);
    return msg;
  },

  /**
   * 更新留言
   * @param {string} id
   * @param {Object} updates
   * @returns {boolean}
   */
  updateMessage(id, updates) {
    const messages = this.getMessages();
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) return false;
    Object.assign(messages[idx], updates);
    this.saveMessages(messages);
    return true;
  },

  /**
   * 删除留言
   * @param {string} id
   * @returns {boolean}
   */
  deleteMessage(id) {
    const messages = this.getMessages();
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) return false;
    messages.splice(idx, 1);
    this.saveMessages(messages);
    return true;
  },

  /**
   * 获取今天的留言（带 retry 安全阀，最多 3 次）
   * @returns {Object|null}
   */
  getTodaysMessage() {
    const messages = this.getMessages();
    if (!messages.length) return null;

    const today = AppUtils.getToday();
    const todayDate = new Date();
    const month = todayDate.getMonth() + 1;
    const day = todayDate.getDate();
    const dayOfWeek = todayDate.getDay();

    // 优先级 1：精确日期匹配（date === today）
    const exactMatches = messages.filter(m => m.date === today);
    if (exactMatches.length > 0) {
      return this._pickWithRetry(exactMatches, 3);
    }

    // 优先级 2：条件匹配
    // 纪念日检查
    const anniversary = AppStore.getAnniversary();
    const isAnniversary = anniversary && (() => {
      const parts = anniversary.split('-');
      return parseInt(parts[1]) === month && parseInt(parts[2]) === day;
    })();

    if (isAnniversary) {
      const anniversaryMsgs = messages.filter(m => m.condition === 'anniversary');
      if (anniversaryMsgs.length > 0) {
        return this._pickWithRetry(anniversaryMsgs, 3);
      }
    }

    // 节日检查
    const isFestival = this._isFestival(month, day);
    if (isFestival) {
      const festivalMsgs = messages.filter(m => m.condition === 'festival');
      if (festivalMsgs.length > 0) {
        return this._pickWithRetry(festivalMsgs, 3);
      }
    }

    // 优先级 3：按 type 匹配时间
    const hour = todayDate.getHours();
    let timeType = null;
    if (hour >= 5 && hour < 12) timeType = 'morning';
    else if (hour >= 18 || hour < 5) timeType = 'evening';
    else timeType = 'random';

    const timeMatches = messages.filter(m => m.type === timeType);
    if (timeMatches.length > 0) {
      return this._pickWithRetry(timeMatches, 3);
    }

    // 优先级 4：无条件随机
    const fallback = messages.filter(m => !m.date && !m.condition);
    if (fallback.length > 0) {
      return this._pickWithRetry(fallback, 3);
    }

    // 最后：任意一条
    return this._pickWithRetry(messages, 3);
  },

  /**
   * 带 retry 安全阀的随机选取（避免同一条重复展示给同一天的用户）
   * @param {Array} candidates
   * @param {number} maxAttempts
   * @returns {Object|null}
   */
  _pickWithRetry(candidates, maxAttempts) {
    const today = AppUtils.getToday();
    let attempts = 0;

    // 找出今天还没展示过的
    let available = candidates.filter(m => !m.displayedDates || !m.displayedDates.includes(today));

    while (attempts < maxAttempts) {
      // 如果全部展示过了，重置
      if (available.length === 0) {
        available = [...candidates];
      }

      const pick = available[Math.floor(Math.random() * available.length)];
      if (!pick) return null;

      // 记录已展示
      if (!pick.displayedDates) pick.displayedDates = [];
      if (!pick.displayedDates.includes(today)) {
        pick.displayedDates.push(today);
        this.saveMessages(this.getMessages()); // 只持久化
      }

      return pick;
    }

    // 降级：随便返回一条
    return candidates.length > 0 ? candidates[0] : null;
  },

  /** 判断是否是节日 */
  _isFestival(month, day) {
    const festivals = [
      [1, 1],   // 元旦
      [2, 14],  // 情人节
      [3, 8],   // 妇女节
      [5, 1],   // 劳动节
      [5, 20],  // 520
      [6, 1],   // 儿童节
      [10, 1],  // 国庆节
      [12, 24], // 平安夜
      [12, 25], // 圣诞节
    ];
    return festivals.some(([m, d]) => m === month && d === day);
  },

  // ===== 管理后台 =====

  /** 密码管理 */
  _getPassword() {
    return localStorage.getItem('love_messages_pwd') || '1314'; // 默认密码
  },

  _setPassword(pwd) {
    localStorage.setItem('love_messages_pwd', pwd);
  },

  /** 显示密码弹窗 */
  showPasswordPrompt(callback) {
    const overlay = document.getElementById('password-overlay');
    const content = document.getElementById('password-content');
    if (!overlay || !content) return;

    overlay.classList.add('show');
    content.innerHTML = `
      <div style="text-align:center;padding:10px 0;">
        <div style="font-size:40px;margin-bottom:12px;">🔐</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:4px;">男朋友管理后台</div>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:20px;">请输入 4 位密码</div>

        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:20px;" id="password-dots">
          <span class="pwd-dot" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--color-border);display:inline-block;"></span>
          <span class="pwd-dot" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--color-border);display:inline-block;"></span>
          <span class="pwd-dot" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--color-border);display:inline-block;"></span>
          <span class="pwd-dot" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--color-border);display:inline-block;"></span>
        </div>

        <div class="pwd-numpad" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:240px;margin:0 auto;">
          ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(n => `
            <button class="btn btn-ghost pwd-key" data-key="${n}"
              style="width:64px;height:64px;border-radius:50%;font-size:24px;font-weight:600;padding:0;margin:auto;${n === '' ? 'visibility:hidden;' : ''}"
              ${n === '' ? 'disabled' : ''}>${n}</button>
          `).join('')}
        </div>

        <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;">
          <button class="btn btn-ghost btn-small" id="btn-pwd-cancel" style="color:var(--color-text-secondary);">取消</button>
          <button class="btn btn-ghost btn-small" id="btn-pwd-reset" style="color:#F87171;font-size:12px;">忘记密码？重置</button>
        </div>

        <div id="pwd-error" style="color:#F87171;font-size:12px;margin-top:8px;display:none;">密码错误，请重试</div>
      </div>
    `;

    let enteredPwd = '';

    const updateDots = () => {
      document.querySelectorAll('.pwd-dot').forEach((dot, i) => {
        dot.style.background = i < enteredPwd.length ? 'var(--color-primary)' : 'transparent';
        dot.style.borderColor = i < enteredPwd.length ? 'var(--color-primary)' : 'var(--color-border)';
      });
    };

    const checkPassword = () => {
      const errorEl = document.getElementById('pwd-error');
      if (errorEl) errorEl.style.display = 'none';

      if (enteredPwd.length === 4) {
        const correctPwd = this._getPassword();
        if (enteredPwd === correctPwd) {
          overlay.classList.remove('show');
          if (callback) callback();
        } else {
          enteredPwd = '';
          updateDots();
          if (errorEl) errorEl.style.display = 'block';
          AppUtils.hapticFeedback([50, 50, 50]);
        }
      }
    };

    // 绑定数字键盘
    document.querySelectorAll('.pwd-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key === '⌫') {
          enteredPwd = enteredPwd.slice(0, -1);
        } else if (key && enteredPwd.length < 4) {
          enteredPwd += key;
          AppUtils.hapticFeedback(10);
        }
        updateDots();
        checkPassword();
      });
    });

    document.getElementById('btn-pwd-cancel')?.addEventListener('click', () => {
      overlay.classList.remove('show');
    });

    document.getElementById('btn-pwd-reset')?.addEventListener('click', () => {
      this._setPassword('1314');
      enteredPwd = '';
      updateDots();
      AppUtils.showToast('密码已重置为 1314 💕', 'info');
    });
  },

  /** 打开留言管理界面 */
  openAdmin() {
    this.showPasswordPrompt(() => {
      this.renderAdmin();
    });
  },

  /** 渲染管理界面（占据整个 modal） */
  renderAdmin() {
    const overlay = document.getElementById('password-overlay');
    const content = document.getElementById('password-content');
    if (!overlay || !content) return;

    overlay.classList.add('show');
    this._renderAdminList(content, overlay);
  },

  _renderAdminList(content, overlay) {
    const messages = this.getMessages();

    content.innerHTML = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:20px;font-weight:700;">💌 留言管理</div>
        <div style="font-size:12px;color:var(--color-text-secondary);">共 ${messages.length} 条留言</div>
      </div>

      <div style="margin-bottom:12px;">
        <button class="btn btn-primary btn-block btn-small" id="btn-new-message">
          ✏️ 写新留言
        </button>
      </div>

      <div style="max-height:50vh;overflow-y:auto;-webkit-overflow-scrolling:touch;margin-bottom:12px;">
        ${messages.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">💌</div>
            <div class="empty-title">还没有留言</div>
            <div class="empty-desc">写下第一条给宝的留言吧~</div>
          </div>
        ` : messages.map(m => `
          <div class="card" style="padding:12px 16px;margin-bottom:8px;position:relative;">
            <div style="font-size:13px;line-height:1.5;margin-bottom:6px;${m.content.length > 60 ? 'max-height:40px;overflow:hidden;' : ''}">
              ${AppUtils.escapeHtml(m.content)}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--color-text-secondary);margin-bottom:4px;">
              <span class="msg-tag">${this._getTypeLabel(m.type)}</span>
              ${m.date ? `<span class="msg-tag">📅 ${m.date}</span>` : ''}
              ${m.condition ? `<span class="msg-tag">🎯 ${m.condition === 'anniversary' ? '纪念日' : '节日'}</span>` : ''}
            </div>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <button class="btn btn-ghost btn-small msg-edit-btn" data-id="${m.id}" style="padding:4px 10px;font-size:12px;">✏️</button>
              <button class="btn btn-ghost btn-small msg-del-btn" data-id="${m.id}" style="padding:4px 10px;font-size:12px;color:#F87171;">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>

      <button class="btn btn-ghost btn-block" id="btn-admin-close" style="color:var(--color-text-secondary);">关闭</button>
    `;

    // 绑定事件
    content.querySelector('#btn-new-message')?.addEventListener('click', () => {
      this._renderMessageForm(content, overlay, null);
    });

    content.querySelectorAll('.msg-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const msg = messages.find(m => m.id === id);
        if (msg) this._renderMessageForm(content, overlay, msg);
      });
    });

    content.querySelectorAll('.msg-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('确定删除这条留言吗？')) {
          this.deleteMessage(id);
          this._renderAdminList(content, overlay);
          AppUtils.showToast('已删除 💕', 'info');
        }
      });
    });

    content.querySelector('#btn-admin-close')?.addEventListener('click', () => {
      overlay.classList.remove('show');
    });
  },

  _renderMessageForm(content, overlay, existingMsg) {
    const isEdit = !!existingMsg;

    content.innerHTML = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:20px;font-weight:700;">${isEdit ? '✏️ 编辑留言' : '✏️ 写新留言'}</div>
        <div style="font-size:12px;color:var(--color-text-secondary);">写给宝的专属情话 💕</div>
      </div>

      <div class="input-group">
        <label>💬 留言内容</label>
        <textarea class="input" id="msg-content" placeholder="写一段给宝的话..." maxlength="500" style="min-height:100px;">${isEdit ? AppUtils.escapeHtml(existingMsg.content) : ''}</textarea>
        <div style="text-align:right;font-size:11px;color:var(--color-text-secondary);"><span id="msg-char-count">${isEdit ? existingMsg.content.length : 0}</span>/500</div>
      </div>

      <div class="input-group">
        <label>📂 留言类型</label>
        <select class="input" id="msg-type">
          <option value="random" ${isEdit && existingMsg.type === 'random' ? 'selected' : ''}>💫 随机</option>
          <option value="morning" ${isEdit && existingMsg.type === 'morning' ? 'selected' : ''}>🌅 早安</option>
          <option value="evening" ${isEdit && existingMsg.type === 'evening' ? 'selected' : ''}>🌙 晚安</option>
          <option value="special" ${isEdit && existingMsg.type === 'special' ? 'selected' : ''}>🎉 特殊</option>
        </select>
      </div>

      <div class="input-group">
        <label>📅 指定日期（可选）</label>
        <input class="input" type="date" id="msg-date" value="${isEdit && existingMsg.date ? existingMsg.date : ''}">
      </div>

      <div class="input-group">
        <label>🎯 触发条件（可选）</label>
        <select class="input" id="msg-condition">
          <option value="">无</option>
          <option value="anniversary" ${isEdit && existingMsg.condition === 'anniversary' ? 'selected' : ''}>💕 纪念日</option>
          <option value="festival" ${isEdit && existingMsg.condition === 'festival' ? 'selected' : ''}>🎊 节日</option>
        </select>
      </div>

      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="btn btn-primary btn-block" id="btn-save-message">💾 保存</button>
        <button class="btn btn-ghost btn-block" id="btn-back-to-list" style="color:var(--color-text-secondary);">← 返回</button>
      </div>
    `;

    // 字数统计
    const textarea = content.querySelector('#msg-content');
    const charCount = content.querySelector('#msg-char-count');
    if (textarea && charCount) {
      textarea.addEventListener('input', () => {
        charCount.textContent = textarea.value.length;
      });
    }

    content.querySelector('#btn-save-message')?.addEventListener('click', () => {
      const contentVal = textarea ? textarea.value.trim() : '';
      if (!contentVal) {
        AppUtils.showToast('写点内容呀~', 'error');
        return;
      }

      const type = content.querySelector('#msg-type')?.value || 'random';
      const date = content.querySelector('#msg-date')?.value || '';
      const condition = content.querySelector('#msg-condition')?.value || null;

      if (isEdit) {
        this.updateMessage(existingMsg.id, { content: contentVal, type, date, condition });
        AppUtils.showToast('已更新 💕', 'success');
      } else {
        this.addMessage({ content: contentVal, type, date, condition });
        AppUtils.showToast('留言已保存 💕', 'success');
      }

      this._renderAdminList(content, overlay);
    });

    content.querySelector('#btn-back-to-list')?.addEventListener('click', () => {
      this._renderAdminList(content, overlay);
    });
  },

  _getTypeLabel(type) {
    const labels = {
      morning: '🌅 早安',
      evening: '🌙 晚安',
      random: '💫 随机',
      special: '🎉 特殊',
    };
    return labels[type] || '💫 随机';
  },

  // ===== 弹窗展示留言详情 =====

  /** 展示留言详情弹窗 */
  showMessageDetail(message) {
    const overlay = document.getElementById('password-overlay');
    const content = document.getElementById('password-content');
    if (!overlay || !content || !message) return;

    overlay.classList.add('show');
    content.innerHTML = `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:48px;margin-bottom:12px;">💌</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:4px;">来自 ${AppUtils.escapeHtml(message.sender || '男朋友')} 的话</div>
        <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:20px;">
          ${message.date || AppUtils.getToday()}
        </div>
        <div style="font-size:17px;line-height:1.8;padding:16px;background:linear-gradient(135deg,#FFF0F6,#F3E8FF);border-radius:var(--radius-md);text-align:left;white-space:pre-wrap;word-break:break-word;">
          ${AppUtils.escapeHtml(message.content)}
        </div>
        <button class="btn btn-primary btn-block" style="margin-top:20px;" onclick="document.getElementById('password-overlay').classList.remove('show')">
          💕 收到啦~
        </button>
      </div>
    `;
  }
};

// 暴露到全局
window.MessagesModule = MessagesModule;