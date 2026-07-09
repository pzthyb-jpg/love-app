// useStorage.js — 安全的 localStorage 读写封装 + IndexedDB 照片存储

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
  ADMIN_PASSWORD: 'admin_password',
  EXCLUDED_RESTAURANTS: 'excluded_restaurants',
  FAVORITE_RESTAURANTS: 'favorite_restaurants',
  DISPLAYED_DATES_CACHE: 'displayed_dates_cache',
  ANNIVERSARIES: 'anniversaries',
  ANNIV_NOTIFICATION_SENT: 'anniv_notification_sent'
}

export const KEY_GIRLFRIEND_NAME = 'girlfriend_name'
export const KEY_BOYFRIEND_NAME = 'boyfriend_name'
export const KEY_REMINDER_TIME = 'reminder_time'
export const KEY_CUSTOM_REMINDER_TIME = 'custom_reminder_time'
export const KEY_ANIMATION_DENSITY = 'animation_density'

// ========== localStorage 工具 ==========

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

/** autoCleanupStorage 同步回调；由 dataStore 注册 */
let _syncCheckinHistoryCallback = null

function setSyncCheckinHistoryCallback(fn) {
  _syncCheckinHistoryCallback = fn
}

function autoCleanupStorage() {
  // 清理最旧的 checkin_history 记录
  try {
    const history = safeGetJSON(STORAGE_KEYS.CHECKIN_HISTORY, [])
    if (history.length > 7) {
      const cleaned = history.slice(-7)
      localStorage.setItem(STORAGE_KEYS.CHECKIN_HISTORY, JSON.stringify(cleaned))
      // 同步响应式 state，确保 UI 立即反映清理后的数据
      if (_syncCheckinHistoryCallback) {
        _syncCheckinHistoryCallback(cleaned)
      }
    }
  } catch (e) {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHECKIN_HISTORY)
      if (_syncCheckinHistoryCallback) {
        _syncCheckinHistoryCallback([])
      }
    } catch (e2) {}
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

// ========== IndexedDB 照片存储 ==========

const DB_NAME = 'LoveAppDB'
const DB_VERSION = 1
const PHOTO_STORE = 'photos'

// 是否支持 IndexedDB
function supportsIndexedDB() {
  return !!window.indexedDB
}

// 打开数据库
function openDB() {
  return new Promise((resolve, reject) => {
    if (!supportsIndexedDB()) {
      reject(new Error('IndexedDB 不可用'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        const store = db.createObjectStore(PHOTO_STORE, { keyPath: 'date' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}

// 保存照片记录到 IndexedDB
async function savePhoto(record) {
  // 照片 base64 是最大消耗源，从 checkin_history 中分离
  // record: { date, photo (base64), timestamp }
  // 同时将不含照片的数据写入 localStorage
  try {
    // 先写 localStorage（不含照片的摘要数据）
    const history = safeGetJSON(STORAGE_KEYS.CHECKIN_HISTORY, [])
    const existingIdx = history.findIndex(h => h.date === record.date)
    const { photo, ...meta } = record

    if (existingIdx >= 0) {
      history[existingIdx] = { ...history[existingIdx], ...meta }
    } else {
      history.unshift(record)
    }

    // 仅保留非照片字段到 localStorage
    const historyLight = history.map(h => {
      const { photo: p, ...rest } = h
      return rest
    })
    safeSetJSON(STORAGE_KEYS.CHECKIN_HISTORY, historyLight)

    // 照片写入 IndexedDB（降级：localStorage）
    if (supportsIndexedDB()) {
      const db = await openDB()
      const tx = db.transaction(PHOTO_STORE, 'readwrite')
      const store = tx.objectStore(PHOTO_STORE)
      store.put({ date: record.date, photo: record.photo, timestamp: record.timestamp })
      await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = (e) => reject(e.target.error)
      })
      db.close()
    } else {
      // 降级：将照片存回 localStorage（完整数据）
      safeSetJSON(STORAGE_KEYS.CHECKIN_HISTORY, history)
    }
  } catch (e) {
    console.warn('IndexedDB 写入失败，降级到 localStorage:', e)
    // 降级：完整数据写回 localStorage
    const history = safeGetJSON(STORAGE_KEYS.CHECKIN_HISTORY, [])
    const existingIdx = history.findIndex(h => h.date === record.date)
    if (existingIdx >= 0) {
      history[existingIdx] = { ...history[existingIdx], ...record }
    } else {
      history.unshift(record)
    }
    safeSetJSON(STORAGE_KEYS.CHECKIN_HISTORY, history)
  }
}

// 获取照片（从 IndexedDB + localStorage 聚合）
async function getPhotos(dateStrs) {
  // dateStrs: 需要获取照片的日期数组
  // 返回: Map<date, photo_base64>
  const photoMap = new Map()

  if (supportsIndexedDB()) {
    try {
      const db = await openDB()
      const tx = db.transaction(PHOTO_STORE, 'readonly')
      const store = tx.objectStore(PHOTO_STORE)

      for (const date of dateStrs) {
        const req = store.get(date)
        const result = await new Promise((resolve, reject) => {
          req.onsuccess = () => resolve(req.result)
          req.onerror = (e) => reject(e.target.error)
        })
        if (result && result.photo) {
          photoMap.set(item.date, result.photo)
        }
      }
      db.close()
    } catch (e) {
      console.warn('IndexedDB 读取失败:', e)
    }
  }

  // 降级补充：从 localStorage 获取
  if (photoMap.size < dateStrs.length) {
    const history = safeGetJSON(STORAGE_KEYS.CHECKIN_HISTORY, [])
    for (const item of history) {
      if (item.photo && dateStrs.includes(item.date) && !photoMap.has(item.date)) {
        photoMap.set(item.date, item.photo)
      }
    }
  }

  return photoMap
}

// 删除旧照片（超过 14 天）
async function deleteOldPhotos() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`

  if (supportsIndexedDB()) {
    try {
      const db = await openDB()
      const tx = db.transaction(PHOTO_STORE, 'readwrite')
      const store = tx.objectStore(PHOTO_STORE)
      const index = store.index('timestamp')

      const range = IDBKeyRange.upperBound(new Date(cutoffStr).getTime())
      const req = index.openCursor(range)

      await new Promise((resolve, reject) => {
        req.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            store.delete(cursor.primaryKey)
            cursor.continue()
          } else {
            resolve()
          }
        }
        req.onerror = (e) => reject(e.target.error)
      })

      tx.oncomplete = () => {
        db.close()
      }
    } catch (e) {
      console.warn('IndexedDB 清理失败:', e)
    }
  }

  // 清理 localStorage 中的旧照片数据
  try {
    const history = safeGetJSON(STORAGE_KEYS.CHECKIN_HISTORY, [])
    const cleaned = history.filter(h => h.date >= cutoffStr)
    safeSetJSON(STORAGE_KEYS.CHECKIN_HISTORY, cleaned)
  } catch (e) {
    console.warn('localStorage 清理失败:', e)
  }
}

export {
  STORAGE_KEYS,
  safeGetJSON,
  safeSetJSON,
  safeGetString,
  safeSetString,
  clearAll,
  setSyncCheckinHistoryCallback,
  // IndexedDB
  openDB,
  savePhoto,
  getPhotos,
  deleteOldPhotos
}
