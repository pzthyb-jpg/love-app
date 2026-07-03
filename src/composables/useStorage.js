// useStorage.js — 安全的 localStorage 读写封装

const STORAGE_KEYS = {
  CHECKIN_HISTORY: 'checkin_history',
  WISHES: 'wishes',
  RESTAURANTS: 'restaurants',
  LUNCH_HISTORY: 'lunch_history',
  MESSAGES: 'messages',
  CHECKIN_STREAK: 'checkin_streak',
  CHECKIN_BADGES: 'checkin_badges',
  LOVE_ANNIVERSARY: 'love_anniversary',
  NOTIFICATION_ENABLED: 'notification_enabled',
  ADMIN_PASSWORD: 'admin_password'
}

function safeGetJSON(key, defaultValue) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : defaultValue
  } catch (e) {
    console.warn(`读取 ${key} 失败，使用默认值:`, e)
    localStorage.removeItem(key)
    return defaultValue
  }
}

function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('存储空间不足，尝试清理旧数据...')
      autoCleanupStorage()
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch (e2) {
        console.error('存储空间清理后仍然不足:', e2)
        return false
      }
    }
    console.error('写入 localStorage 失败:', e)
    return false
  }
}

function autoCleanupStorage() {
  // 清理最旧的 checkin_history 记录
  try {
    const history = safeGetJSON(STORAGE_KEYS.CHECKIN_HISTORY, [])
    if (history.length > 7) {
      const cleaned = history.slice(-7)
      localStorage.setItem(STORAGE_KEYS.CHECKIN_HISTORY, JSON.stringify(cleaned))
    }
  } catch (e) {
    // 如果清理也失败，清除所有照片数据
    try {
      localStorage.removeItem(STORAGE_KEYS.CHECKIN_HISTORY)
    } catch (e2) {
      // 实在没办法了
    }
  }
}

function safeGetString(key, defaultValue = '') {
  try {
    return localStorage.getItem(key) || defaultValue
  } catch (e) {
    return defaultValue
  }
}

function safeSetString(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    return false
  }
}

function clearAll() {
  Object.values(STORAGE_KEYS).forEach(key => {
    try { localStorage.removeItem(key) } catch (e) {}
  })
}

export {
  STORAGE_KEYS,
  safeGetJSON,
  safeSetJSON,
  safeGetString,
  safeSetString,
  clearAll
}
