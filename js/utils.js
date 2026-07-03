/**
 * 🛠️ 小皮爱情助手 — 工具函数库
 * 安全数据操作、ID 生成、日期格式化、触感反馈
 */

const AppUtils = {

  /**
   * 安全读取 JSON 数据（带 try-catch）
   * @param {string} key localStorage key
   * @param {*} defaultVal 解析失败时的默认值
   * @returns {*} 解析后的数据
   */
  safeGetJSON(key, defaultVal) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultVal;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('safeGetJSON 解析失败:', key, e);
      return defaultVal;
    }
  },

  /**
   * 安全写入 JSON 数据（捕获 QuotaExceededError）
   * @param {string} key localStorage key
   * @param {*} val 要存储的数据
   * @returns {boolean} 是否写入成功
   */
  safeSetJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('localStorage 配额超限，尝试自动清理');
        this.autoCleanup();
        // 重试
        try {
          localStorage.setItem(key, JSON.stringify(val));
          return true;
        } catch (e2) {
          console.error('清理后仍然无法写入:', key, e2);
          return false;
        }
      }
      console.error('safeSetJSON 写入失败:', key, e);
      return false;
    }
  },

  /**
   * 自动清理 localStorage 中的大体积数据
   */
  autoCleanup() {
    // 清理策略：先删除最旧的打卡照片（保留最近 7 天）
    try {
      const history = this.safeGetJSON('checkin_history', []);
      if (history.length > 7) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoff = sevenDaysAgo.getTime();
        const kept = history.filter(h => h.timestamp >= cutoff);
        localStorage.setItem('checkin_history', JSON.stringify(kept));
      }
    } catch (e) {
      // 如果还是不行，清空所有非核心数据
      try {
        const keysToKeep = ['love_anniversary', 'partner_name', 'sender_name'];
        const saved = {};
        keysToKeep.forEach(k => {
          const v = localStorage.getItem(k);
          if (v) saved[k] = v;
        });
        localStorage.clear();
        Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
      } catch (e2) {
        console.error('自动清理失败:', e2);
      }
    }
  },

  /**
   * 生成唯一 ID
   * @returns {string} 基于时间戳和随机的唯一 ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  /**
   * 格式化日期为 YYYY-MM-DD
   * @param {Date|number} date 日期对象或时间戳
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /**
   * 获取今天的日期字符串
   * @returns {string} YYYY-MM-DD
   */
  getToday() {
    return this.formatDate(new Date());
  },

  /**
   * 触感反馈封装
   * @param {number|string|number[]} pattern 振动模式（同 navigator.vibrate）
   */
  hapticFeedback(pattern) {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
      // iOS 不支持 vibrate，静默降级
    } catch (e) {
      // iOS Safari 会抛异常，静默处理
    }
  },

  /**
   * 检查 localStorage 使用量
   * @returns {{used: number, total: number, percent: number}}
   */
  checkStorageQuota() {
    let used = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        used += (key ? key.length : 0) + (val ? val.length : 0);
      }
    } catch (e) {
      console.warn('检查存储配额失败:', e);
    }
    // 每个字符约 2 字节，localStorage 通常 5MB
    const total = 5 * 1024 * 1024;
    const bytes = used * 2;
    return {
      used: bytes,
      total: total,
      percent: (bytes / total) * 100
    };
  },

  /**
   * HTML 转义
   * @param {string} text 原始文本
   * @returns {string} 转义后的安全 HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * 获取星期名称
   * @param {number} dayIndex 0-6
   * @returns {string} 中文星期名
   */
  getDayName(dayIndex) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[dayIndex !== undefined ? dayIndex : new Date().getDay()];
  },

  /**
   * 计算两个日期之间的天数
   * @param {string|Date} date1 开始日期
   * @param {string|Date} date2 结束日期（默认今天）
   * @returns {number} 相差天数
   */
  daysBetween(date1, date2) {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : (date2 ? new Date(date2) : new Date());
    // 去除时间部分，只比较日期
    const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.floor((t2 - t1) / (1000 * 60 * 60 * 24));
  },

  /**
   * Toast 消息提示（升级版：支持多种类型）
   * @param {string} message 消息内容
   * @param {string} type toast 类型：'success' | 'error' | 'info'（默认 'info'）
   * @param {number} duration 显示时长 ms
   */
  showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 2500;

    let toastEl = document.getElementById('toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'toast';
      document.body.appendChild(toastEl);
    }

    // 移除旧的类型样式
    toastEl.classList.remove('toast-success', 'toast-error', 'toast-info');
    // 添加新类型样式
    toastEl.classList.add('toast-' + type);

    // 构建带图标的内容
    const icons = { success: '✅', error: '😅', info: '💕' };
    toastEl.innerHTML = `${icons[type] || '💕'} ${message}`;
    toastEl.classList.add('show');

    // 清除之前的定时器
    if (toastEl._hideTimer) clearTimeout(toastEl._hideTimer);
    toastEl._hideTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, duration);
  }
};

// 暴露到全局命名空间
window.AppUtils = AppUtils;
