/**
 * 💾 小皮爱情助手 — 数据访问层
 * 所有 localStorage key 常量、数据读写、业务计算
 */

const AppStore = {

  // ===== localStorage Key 常量 =====
  KEYS: {
    LOVE_ANNIVERSARY: 'love_anniversary',
    PARTNER_NAME: 'partner_name',
    SENDER_NAME: 'sender_name',
    CHECKIN_HISTORY: 'checkin_history',
    WISHES: 'wishes',
    LUNCH_HISTORY: 'lunch_history',
    RESTAURANTS: 'restaurants',
    MESSAGES: 'love_messages',
    NOTIFICATION_ENABLED: 'notification_enabled',
    ACHIEVEMENTS: 'achievements',
    APP_SETUP_COMPLETE: 'app_setup_complete',
    LAST_MESSAGE_DATE: 'last_message_date',
  },

  // ===== 纪念日相关 =====

  /** 获取纪念日 */
  getAnniversary() {
    return AppUtils.safeGetJSON(this.KEYS.LOVE_ANNIVERSARY, null);
  },

  /** 设置纪念日 */
  setAnniversary(dateStr) {
    return AppUtils.safeSetJSON(this.KEYS.LOVE_ANNIVERSARY, dateStr);
  },

  /** 计算在一起的天数 */
  getDaysTogether() {
    const anniversary = this.getAnniversary();
    if (!anniversary) return 0;
    return AppUtils.daysBetween(anniversary, new Date());
  },

  /** 获取对方称呼 */
  getPartnerName() {
    return localStorage.getItem(this.KEYS.PARTNER_NAME) || '宝';
  },

  /** 获取用户称呼 */
  getSenderName() {
    return localStorage.getItem(this.KEYS.SENDER_NAME) || '男朋友';
  },

  // ===== 打卡记录 =====

  /** 获取打卡历史 */
  getCheckinHistory() {
    return AppUtils.safeGetJSON(this.KEYS.CHECKIN_HISTORY, []);
  },

  /** 保存打卡记录 */
  saveCheckin(photoDataUrl, compliment) {
    const history = this.getCheckinHistory();
    const now = new Date();
    history.push({
      id: AppUtils.generateId(),
      date: AppUtils.formatDate(now),
      time: now.toTimeString().slice(0, 5),
      photo: photoDataUrl,
      compliment: compliment,
      timestamp: now.getTime()
    });
    // 只保留最近 30 条
    if (history.length > 30) {
      history.splice(0, history.length - 30);
    }
    AppUtils.safeSetJSON(this.KEYS.CHECKIN_HISTORY, history);
    return history;
  },

  /** 今日是否已打卡 */
  hasCheckedInToday() {
    const history = this.getCheckinHistory();
    const today = AppUtils.getToday();
    return history.some(h => h.date === today);
  },

  /** 获取本周打卡状态 */
  getWeekStatus() {
    const history = this.getCheckinHistory();
    const today = new Date();
    const weekStatus = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = AppUtils.formatDate(d);
      const dayName = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      const checked = history.some(h => h.date === dateStr);
      weekStatus.push({ date: dateStr, dayName, checked, isToday: i === 0 });
    }
    return weekStatus;
  },

  /** 获取累计打卡天数（去重） */
  getTotalCheckinDays() {
    const history = this.getCheckinHistory();
    const uniqueDates = new Set(history.map(h => h.date));
    return uniqueDates.size;
  },

  // ===== 连续打卡算法 =====

  /**
   * 计算连续打卡天数（从今天向前检查，同天多条算一次）
   * @param {Array} history 打卡历史记录
   * @returns {number} 连续打卡天数
   */
  calculateStreak(history) {
    if (!history || !history.length) return 0;

    // 获取所有打卡日期（去重）
    const dates = [...new Set(history.map(h => h.date))].sort().reverse();

    if (dates.length === 0) return 0;

    let streak = 0;
    const today = AppUtils.getToday();

    // 从今天开始检查
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = AppUtils.formatDate(expectedDate);

      if (dates[i] === expectedStr) {
        streak++;
      } else if (i === 0) {
        // 今天没打卡，连续从昨天算
        break;
      } else {
        break;
      }
    }

    return streak;
  },

  // ===== 成就系统 =====

  /** 成就徽章定义 */
  BADGES: [
    { id: 'seedling', name: '萌芽', days: 7, icon: '❤️', description: '连续打卡 7 天，爱在萌芽' },
    { id: 'bloom', name: '绽放', days: 14, icon: '🌸', description: '连续打卡 14 天，爱在绽放' },
    { id: 'full-bloom', name: '盛放', days: 21, icon: '🌺', description: '连续打卡 21 天，爱已盛放' },
    { id: 'eternal', name: '永恒', days: 30, icon: '💎', description: '连续打卡 30 天，爱是永恒' },
  ],

  /**
   * 计算已获得的成就
   * @param {Array} history 打卡历史
   * @param {number} streak 当前连续天数（可选，不传则自动计算）
   * @returns {Array} 已获得的成就列表
   */
  calculateAchievements(history, streak) {
    if (!streak) {
      streak = this.calculateStreak(history);
    }

    const achieved = [];
    for (const badge of this.BADGES) {
      if (streak >= badge.days) {
        achieved.push({ ...badge, achieved: true, achievedAt: streak });
      }
    }
    return achieved;
  },

  /** 获取下一个未达成的成就 */
  getNextBadge(streak) {
    for (const badge of this.BADGES) {
      if (streak < badge.days) {
        return { ...badge, progress: streak, remaining: badge.days - streak };
      }
    }
    return null; // 所有成就已达成
  },

  // ===== 愿望相关 =====

  /** 获取所有愿望 */
  getWishes() {
    return AppUtils.safeGetJSON(this.KEYS.WISHES, []);
  },

  /** 保存愿望列表 */
  saveWishes(wishes) {
    return AppUtils.safeSetJSON(this.KEYS.WISHES, wishes);
  },

  /** 获取愿望数量 */
  getWishCount() {
    return this.getWishes().length;
  },

  /** 获取已实现的愿望数量 */
  getFulfilledWishCount() {
    return this.getWishes().filter(w => w.fulfilled).length;
  },

  // ===== 午餐相关 =====

  /** 获取午餐历史 */
  getLunchHistory() {
    return AppUtils.safeGetJSON(this.KEYS.LUNCH_HISTORY, []);
  },

  /** 获取累计转盘次数 */
  getTotalSpins() {
    return this.getLunchHistory().length;
  },

  // ===== 留言相关 =====

  /** 获取留言列表 */
  getMessages() {
    return AppUtils.safeGetJSON(this.KEYS.MESSAGES, []);
  },

  /** 保存留言列表 */
  saveMessages(messages) {
    return AppUtils.safeSetJSON(this.KEYS.MESSAGES, messages);
  },

  /** 获取今天的留言（委托给 MessagesModule，以支持条件匹配和 retry 安全阀） */
  getTodaysMessage() {
    // 优先使用 MessagesModule 的增强版匹配逻辑
    if (typeof MessagesModule !== 'undefined' && MessagesModule.getMessages().length > 0) {
      return MessagesModule.getTodaysMessage();
    }
    // 降级：老版简单匹配
    const messages = this.getMessages();
    if (!messages.length) return null;
    return messages[Math.floor(Math.random() * messages.length)];
  },

  // ===== 首页数据聚合 =====

  /**
   * 获取首页展示所需的所有聚合数据
   * @returns {Object} 首页数据
   */
  getHomePageData() {
    const history = this.getCheckinHistory();
    const streak = this.calculateStreak(history);
    const achievements = this.calculateAchievements(history, streak);
    const nextBadge = this.getNextBadge(streak);

    return {
      daysTogether: this.getDaysTogether(),
      partnerName: this.getPartnerName(),
      senderName: this.getSenderName(),
      totalCheckins: this.getTotalCheckinDays(),
      totalSpins: this.getTotalSpins(),
      wishCount: this.getWishCount(),
      fulfilledWishes: this.getFulfilledWishCount(),
      streak: streak,
      hasCheckedInToday: this.hasCheckedInToday(),
      achievements: achievements,
      nextBadge: nextBadge,
      weekStatus: this.getWeekStatus(),
      latestMessage: this.getTodaysMessage(),
    };
  },

  // ===== 应用设置 =====

  /** 检查是否已完成初始设置 */
  isSetupComplete() {
    return localStorage.getItem(this.KEYS.APP_SETUP_COMPLETE) === 'true';
  },

  /** 标记设置完成 */
  markSetupComplete() {
    localStorage.setItem(this.KEYS.APP_SETUP_COMPLETE, 'true');
  },

  // ===== 数据备份/导出 =====

  /**
   * 导出全部数据为 JSON
   * @returns {Object} 包含所有应用数据
   */
  exportAllData() {
    const data = {
      version: '2.0',
      exportDate: AppUtils.getToday(),
      appName: '小皮爱情助手',
    };

    // 收集所有 AppStore KEYS 中的数据
    for (const [_, key] of Object.entries(this.KEYS)) {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) {
          data[key] = val;
        }
      } catch (e) {
        // 跳过读取失败的 key
      }
    }

    return data;
  },

  /**
   * 从备份 JSON 导入数据
   * @param {Object} data 备份数据
   * @returns {{success: boolean, message: string}} 导入结果
   */
  importAllData(data) {
    if (!data || data.version !== '2.0') {
      return { success: false, message: '数据格式版本不匹配，请确认备份文件来自本应用 2.0 版本' };
    }

    let imported = 0;
    for (const [_, key] of Object.entries(this.KEYS)) {
      if (data[key] !== undefined) {
        try {
          localStorage.setItem(key, data[key]);
          imported++;
        } catch (e) {
          console.warn('导入失败:', key, e);
        }
      }
    }

    return { success: true, message: `成功导入 ${imported} 项数据 💕` };
  }
};

// 暴露到全局命名空间
window.AppStore = AppStore;
