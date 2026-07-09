// dataStore.js — 响应式数据层
import { showToast } from 'vant'
import { reactive, toRefs } from 'vue'
import {
  STORAGE_KEYS,
  safeGetJSON,
  safeSetJSON,
  safeGetString,
  safeSetString,
  savePhoto,
  setSyncCheckinHistoryCallback
} from '../composables/useStorage.js'
import { hashPassword, verifyPassword, validatePasswordStrength, isLegacyHashFormat } from '../composables/usecrypto.js'

// 检查写入结果，失败时弹出 Toast 提示
function checkWriteResult(success, key) {
  if (!success) {
    showToast({ message: `💾 写入 ${STORAGE_KEYS[key] || key} 失败，存储空间可能已满`, type: 'fail' })
  }
  return success
}

// 响应式状态
const state = reactive({
  checkinHistory: safeGetJSON(STORAGE_KEYS.CHECKIN_HISTORY, []),
  wishes: safeGetJSON(STORAGE_KEYS.WISHES, []),
  girlfriendName: safeGetString('girlfriend_name', ''),
  boyfriendName: safeGetString('boyfriend_name', '男朋友'),
  restaurants: safeGetJSON(STORAGE_KEYS.RESTAURANTS, [
    { name: '饺子馆', emoji: '🥟', distance: '0.8km', rating: 4.5, tags: ['面食', '实惠'] },
    { name: '兰州拉面', emoji: '🍜', distance: '0.5km', rating: 4.2, tags: ['面食', '快餐'] },
    { name: '轻食沙拉', emoji: '🥗', distance: '1.2km', rating: 4.0, tags: ['健康', '轻食'] },
    { name: '日式拉面', emoji: '🍜', distance: '1.0km', rating: 4.6, tags: ['日料', '暖胃'] },
    { name: '烤肉拌饭', emoji: '🍚', distance: '0.6km', rating: 4.3, tags: ['韩式', '米饭'] },
    { name: '麻辣烫', emoji: '🌶️', distance: '0.3km', rating: 4.1, tags: ['辣', '暖身'] },
    { name: '披萨', emoji: '🍕', distance: '1.5km', rating: 4.4, tags: ['西式', '外卖'] },
    { name: '港式茶餐厅', emoji: '🍵', distance: '0.9km', rating: 4.7, tags: ['茶餐厅', '经典'] },
    { name: '越南河粉', emoji: '🍲', distance: '1.3km', rating: 4.2, tags: ['东南亚', '清淡'] },
    { name: '麻辣香锅', emoji: '🔥', distance: '0.7km', rating: 4.5, tags: ['辣', '川菜'] }
  ]),
  lunchHistory: safeGetJSON(STORAGE_KEYS.LUNCH_HISTORY, []),
  messages: safeGetJSON(STORAGE_KEYS.MESSAGES, []),
  checkinStreak: safeGetJSON(STORAGE_KEYS.CHECKIN_STREAK, {
    streakDays: 0,
    lastCheckinDate: '',
    longestStreak: 0,
    initialized: false
  }),
  checkinBadges: safeGetJSON(STORAGE_KEYS.CHECKIN_BADGES, []),
  loveAnniversary: safeGetString(STORAGE_KEYS.LOVE_ANNIVERSARY, ''),
  notificationEnabled: safeGetString(STORAGE_KEYS.NOTIFICATION_ENABLED, 'true') === 'true',
  anniversaries: safeGetJSON(STORAGE_KEYS.ANNIVERSARIES, []),
  // 密码哈希值（PBKDF2-SHA256 格式）
  adminPassword: { hash: '', salt: '', legacyHash: '' }
})

// 读取密码：新格式 { hash, salt } 字符串，或旧 SHA-256 迁移
function safeGetPassword() {
  const stored = safeGetString(STORAGE_KEYS.ADMIN_PASSWORD, '')
  if (!stored) {
    // 首次使用：返回空，需要管理员自行设置密码
    return { hash: '', salt: '', legacyHash: '' }
  }
  // 尝试解析新格式：Base64_salt.Base64_hash
  if (stored.includes('.')) {
    const parts = stored.split('.')
    if (parts.length === 2) {
      return { hash: parts[1], salt: parts[0], legacyHash: '' }
    }
  }
  // 检测到 old SHA-256 格式（旧哈希，需要迁移）
  if (isLegacyHashFormat(stored)) {
    // 异步将旧哈希升级到 PBKDF2
    const defaultSalt = new Uint8Array(16)
    for (let i = 0; i < 16; i++) defaultSalt[i] = i // 固定盐，待首次登录后替换
    hashPassword(stored, defaultSalt).then(({ hash, salt }) => {
      const newFormat = `${salt}.${hash}`
      safeSetString(STORAGE_KEYS.ADMIN_PASSWORD, newFormat)
      state.adminPassword = { hash, salt, legacyHash: '' }
    }).catch(() => {
      // 无法升级时抛出错误，不再保留明文或旧格式
      console.error('密码哈希升级失败')
    })
    return { hash: '', salt: '', legacyHash: stored }
  }
  return { hash: '', salt: '', legacyHash: '' }
}

// 初始化密码状态
state.adminPassword = safeGetPassword()

// 自动清理存储回调：安全替代 window.__syncCheckinHistory
setSyncCheckinHistoryCallback((cleaned) => {
  state.checkinHistory = cleaned
})

// 操作函数
function addCheckin(record) {
  state.checkinHistory.unshift(record)
  savePhoto(record)
}

function addQuickCheckin(dateStr) {
  const today = dateStr || getTodayStr()
  if (state.checkinHistory.some(h => h.date === today)) return false
  state.checkinHistory.unshift({ date: today, type: 'quick' })
  checkWriteResult(safeSetJSON(STORAGE_KEYS.CHECKIN_HISTORY, state.checkinHistory), 'CHECKIN_HISTORY')
  return true
}

function addWish(wish) {
  state.wishes.unshift(wish)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.WISHES, state.wishes), 'WISHES')
}

function updateWish(id, updates) {
  const idx = state.wishes.findIndex(w => w.id === id)
  if (idx !== -1) {
    state.wishes[idx] = { ...state.wishes[idx], ...updates }
    checkWriteResult(safeSetJSON(STORAGE_KEYS.WISHES, state.wishes), 'WISHES')
  }
}

function deleteWish(id) {
  state.wishes = state.wishes.filter(w => w.id !== id)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.WISHES, state.wishes), 'WISHES')
}

function addLunchRecord(record) {
  state.lunchHistory.unshift(record)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.LUNCH_HISTORY, state.lunchHistory), 'LUNCH_HISTORY')
}

function addRestaurant(restaurant) {
  state.restaurants.push(restaurant)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.RESTAURANTS, state.restaurants), 'RESTAURANTS')
}

function removeRestaurant(name) {
  state.restaurants = state.restaurants.filter(r => r.name !== name)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.RESTAURANTS, state.restaurants), 'RESTAURANTS')
}

function resetRestaurants() {
  state.restaurants = [
    { name: '饺子馆', emoji: '🥟', distance: '0.8km', rating: 4.5, tags: ['面食', '实惠'] },
    { name: '兰州拉面', emoji: '🍜', distance: '0.5km', rating: 4.2, tags: ['面食', '快餐'] },
    { name: '轻食沙拉', emoji: '🥗', distance: '1.2km', rating: 4.0, tags: ['健康', '轻食'] },
    { name: '日式拉面', emoji: '🍜', distance: '1.0km', rating: 4.6, tags: ['日料', '暖胃'] },
    { name: '烤肉拌饭', emoji: '🍚', distance: '0.6km', rating: 4.3, tags: ['韩式', '米饭'] },
    { name: '麻辣烫', emoji: '🌶️', distance: '0.3km', rating: 4.1, tags: ['辣', '暖身'] },
    { name: '披萨', emoji: '🍕', distance: '1.5km', rating: 4.4, tags: ['西式', '外卖'] },
    { name: '港式茶餐厅', emoji: '🍵', distance: '0.9km', rating: 4.7, tags: ['茶餐厅', '经典'] },
    { name: '越南河粉', emoji: '🍲', distance: '1.3km', rating: 4.2, tags: ['东南亚', '清淡'] },
    { name: '麻辣香锅', emoji: '🔥', distance: '0.7km', rating: 4.5, tags: ['辣', '川菜'] }
  ]
  checkWriteResult(safeSetJSON(STORAGE_KEYS.RESTAURANTS, state.restaurants), 'RESTAURANTS')
}

function addMessage(msg) {
  state.messages.push(msg)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.MESSAGES, state.messages), 'MESSAGES')
}

function updateMessage(id, updates) {
  const idx = state.messages.findIndex(m => m.id === id)
  if (idx !== -1) {
    state.messages[idx] = { ...state.messages[idx], ...updates }
    checkWriteResult(safeSetJSON(STORAGE_KEYS.MESSAGES, state.messages), 'MESSAGES')
  }
}

function deleteMessage(id) {
  state.messages = state.messages.filter(m => m.id !== id)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.MESSAGES, state.messages), 'MESSAGES')
}

/**
 * 标记某条消息在指定日期已展示
 * 更新 displayedDates 并持久化到 localStorage
 */
function markMessageDisplayed(messageId, dateStr) {
  const msg = state.messages.find(m => m.id === messageId)
  if (msg) {
    if (!msg.displayedDates) msg.displayedDates = []
    if (!msg.displayedDates.includes(dateStr)) {
      msg.displayedDates.push(dateStr)
      checkWriteResult(safeSetJSON(STORAGE_KEYS.MESSAGES, state.messages), 'MESSAGES')
    }
  }
}

function updateStreak(streakData) {
  Object.assign(state.checkinStreak, streakData)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.CHECKIN_STREAK, state.checkinStreak), 'CHECKIN_STREAK')
}

function addBadge(badge) {
  state.checkinBadges.push(badge)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.CHECKIN_BADGES, state.checkinBadges), 'CHECKIN_BADGES')
}

function setAnniversary(dateStr) {
  state.loveAnniversary = dateStr
  safeSetString(STORAGE_KEYS.LOVE_ANNIVERSARY, dateStr)
}

function setNotificationEnabled(enabled) {
  state.notificationEnabled = enabled
  safeSetString(STORAGE_KEYS.NOTIFICATION_ENABLED, enabled ? 'true' : 'false')
}

async function setAdminPassword(password) {
  const validation = validatePasswordStrength(password)
  if (!validation.valid) {
    showToast({ message: validation.message, type: 'fail' })
    return false
  }
  try {
    const { hash, salt } = await hashPassword(password)
    const storedFormat = `${salt}.${hash}`
    state.adminPassword = { hash, salt, legacyHash: '' }
    safeSetString(STORAGE_KEYS.ADMIN_PASSWORD, storedFormat)
    return true
  } catch (e) {
    showToast({ message: '密码设置失败：环境不支持 SubtleCrypto', type: 'fail' })
    return false
  }
}

/**
 * 验证管理员密码
 * - 新 PBKDF2 格式：对比 salt + hash
 * - 旧 SHA-256 遗留格式：一次登录成功后自动迁移
 */
async function verifyAdminPassword(password) {
  const pwd = state.adminPassword
  // 新格式验证
  if (pwd.hash && pwd.salt) {
    const matched = await verifyPassword(password, pwd.hash, pwd.salt)
    return matched
  }
  // 旧格式：尝试旧 SHA-256 对比，成功后立即迁移
  if (pwd.legacyHash) {
    // 把旧 SHA-256 哈希当作明文再次哈希入库（等效迁移）
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    if (hashHex === pwd.legacyHash) {
      // 旧格式验证成功，立即升级到 PBKDF2
      await setAdminPassword(password)
      return true
    }
  }
  return false
}

function setGirlfriendName(name) {
  state.girlfriendName = name
  safeSetString('girlfriend_name', name)
}

function setBoyfriendName(name) {
  state.boyfriendName = name
  safeSetString('boyfriend_name', name)
}

// ========== 纪念日 CRUD ==========

/**
 * 计算某个纪念日的下次发生日期（今年或明年）
 */
function getNextOccurrence(dateStr) {
  const original = new Date(dateStr)
  if (isNaN(original.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisYear = new Date(today.getFullYear(), original.getMonth(), original.getDate())
  return thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, original.getMonth(), original.getDate())
}

/**
 * 计算距离下次发生的天数
 */
function getDaysUntil(dateStr) {
  const next = getNextOccurrence(dateStr)
  if (!next) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((next - today) / 86400000)
}

/**
 * 计算从原始日期到今天的总天数（相守天数）
 */
function getDaysSince(dateStr) {
  const original = new Date(dateStr)
  if (isNaN(original.getTime())) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - original) / 86400000)
}

/**
 * 添加纪念日
 * @param {Object} data - { name, date, type, emoji, remark, remindDays }
 */
function addAnniversary(data) {
  const now = new Date().toISOString()
  const item = {
    id: `ann_${Date.now()}`,
    name: data.name,
    date: data.date,
    type: data.type,
    emoji: data.emoji || '💕',
    remark: data.remark || '',
    remindDays: data.remindDays || [3],
    createdAt: now,
    updatedAt: now
  }
  state.anniversaries.unshift(item)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.ANNIVERSARIES, state.anniversaries), 'ANNIVERSARIES')
  return item
}

/**
 * 更新纪念日
 */
function updateAnniversary(id, updates) {
  const idx = state.anniversaries.findIndex(a => a.id === id)
  if (idx !== -1) {
    state.anniversaries[idx] = {
      ...state.anniversaries[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    checkWriteResult(safeSetJSON(STORAGE_KEYS.ANNIVERSARIES, state.anniversaries), 'ANNIVERSARIES')
  }
}

/**
 * 删除纪念日
 */
function deleteAnniversary(id) {
  state.anniversaries = state.anniversaries.filter(a => a.id !== id)
  checkWriteResult(safeSetJSON(STORAGE_KEYS.ANNIVERSARIES, state.anniversaries), 'ANNIVERSARIES')
}

export function useDataStore() {
  return {
    state,
    addCheckin,
    addQuickCheckin,
    addWish,
    updateWish,
    deleteWish,
    addLunchRecord,
    addRestaurant,
    removeRestaurant,
    resetRestaurants,
    addMessage,
    updateMessage,
    deleteMessage,
    markMessageDisplayed,
    updateStreak,
    addBadge,
    setAnniversary,
    setNotificationEnabled,
    setAdminPassword,
    verifyAdminPassword,
    setGirlfriendName,
    setBoyfriendName,
    // 纪念日
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    getNextOccurrence,
    getDaysUntil,
    getDaysSince
  }
}
