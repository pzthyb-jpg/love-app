// dataStore.js — Supabase 响应式数据层 (从 localStorage 迁移)
import { showToast } from 'vant'
import { reactive, computed } from 'vue'
import { useDatabase } from '../composables/useDatabase.js'
import {
  STORAGE_KEYS,
  safeGetString,
  safeSetString,
  safeGetJSON,
  safeSetJSON,
} from '../composables/useStorage.js'
import { hashPassword as _hp, verifyPassword as _vp, validatePasswordStrength, isLegacyHashFormat } from '../composables/usecrypto.js'
import { checkMilestone } from '../composables/useStreak.js'

const db = useDatabase()

// ========== 响应式状态 ==========
const state = reactive({
  // 用户数据 (从 Supabase 加载)
  checkinHistory: [],
  wishes: [],
  messages: [],
  anniversaries: [],
  lunchHistory: [],
  restaurantPrefs: [],
  settings: null,           // user_settings 记录
  checkinStats: null,       // checkin_stats 记录

  // 另一半数据（情侣绑定后加载，用于照片墙共有）
  partnerInfo: null,        // 另一半用户信息 { id, username, display_name }
  partnerCheckins: [],      // 另一半的打卡记录

  // 本地设置 (保留 localStorage)
  restaurants: loadRestaurants(),
  adminPassword: { hash: '', salt: '', legacyHash: '' },

  // UI 状态
  isDataLoaded: false,
})

// ========== 本地存储保留项 (admin + defaults) ==========

function loadRestaurants() {
  return safeGetJSON(STORAGE_KEYS.RESTAURANTS, [
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
  ])
}

function safeGetPassword() {
  const stored = safeGetString(STORAGE_KEYS.ADMIN_PASSWORD, '')
  if (!stored) return { hash: '', salt: '', legacyHash: '' }
  if (stored.includes('.')) {
    const parts = stored.split('.')
    if (parts.length === 2) return { hash: parts[1], salt: parts[0], legacyHash: '' }
  }
  if (isLegacyHashFormat(stored)) {
    return { hash: '', salt: '', legacyHash: stored }
  }
  return { hash: '', salt: '', legacyHash: '' }
}

state.adminPassword = safeGetPassword()

// ========== 计算属性 ==========
const girlfriendName = computed(() => state.settings?.girlfriend_name || '')
const boyfriendName = computed(() => state.settings?.boyfriend_name || '男朋友')
const loveAnniversary = computed(() => state.settings?.love_anniversary || '')
const notificationEnabled = computed(() => state.settings?.notification_enabled !== false)
const themePref = computed(() => state.settings?.theme_pref || 'light')
const reminderTime = computed(() => state.settings?.reminder_time || 'noon')
const customReminderTime = computed(() => state.settings?.custom_reminder_time || '12:00')

// 打卡统计（优先从 checkin_stats 加载，否则从历史计算）
const checkinStreak = computed(() => {
  if (state.checkinStats) {
    return {
      streakDays: state.checkinStats.streak_days,
      lastCheckinDate: state.checkinStats.last_checkin_date,
      longestStreak: state.checkinStats.longest_streak,
      initialized: true
    }
  }
  // 从历史计算
  return calculateStreakFromHistory(state.checkinHistory)
})

// ========== 数据加载 ==========

async function loadAllData() {
  if (!db.isAuthenticated.value) {
    state.checkinHistory = []
    state.wishes = []
    state.messages = []
    state.anniversaries = []
    state.lunchHistory = []
    state.restaurantPrefs = []
    state.settings = null
    state.checkinStats = null
    state.partnerInfo = null
    state.partnerCheckins = []
    state.isDataLoaded = false
    return
  }

  try {
    const [checkins, wishes, messages, anniversaries, lunchHistory, prefs, settings, stats] = await Promise.all([
      db.getCheckins(),
      db.getWishes(),
      db.getMessages(),
      db.getAnniversaries(),
      db.getLunchHistory(),
      db.getRestaurantPrefs(),
      db.getSettings(),
      db.getCheckinStats(),
    ])

    state.checkinHistory = checkins || []
    state.wishes = wishes || []
    state.messages = messages || []
    state.anniversaries = anniversaries || []
    state.lunchHistory = lunchHistory || []
    state.restaurantPrefs = prefs || []
    state.settings = settings
    state.checkinStats = stats
    state.isDataLoaded = true

    // 情侣绑定：加载另一半信息 + 打卡照片（不阻塞主流程，失败静默）
    loadPartnerData(settings?.partner_id)
  } catch (e) {
    console.error('加载数据失败:', e)
    state.isDataLoaded = false
  }
}

// 加载另一半数据（照片墙共有）
async function loadPartnerData(partnerId) {
  if (!partnerId) {
    state.partnerInfo = null
    state.partnerCheckins = []
    return
  }
  try {
    const [info, checkins] = await Promise.all([
      db.getUserById(partnerId),
      db.getPartnerCheckins(partnerId),
    ])
    state.partnerInfo = info
    state.partnerCheckins = checkins || []
  } catch (e) {
    console.error('加载另一半数据失败:', e)
  }
}

// ========== 设置操作 ==========

async function updateSettings(updates) {
  const result = await db.updateSettings(updates)
  if (!result.error && state.settings) {
    Object.assign(state.settings, updates)
  } else if (!result.error) {
    state.settings = { ...state.settings, ...updates }
  }
  return result
}

function setGirlfriendName(name) {
  updateSettings({ girlfriend_name: name })
}

function setBoyfriendName(name) {
  updateSettings({ boyfriend_name: name })
}

function setAnniversary(dateStr) {
  updateSettings({ love_anniversary: dateStr })
}

function setNotificationEnabled(enabled) {
  updateSettings({ notification_enabled: enabled })
}

function setThemePref(theme) {
  updateSettings({ theme_pref: theme })
}

// ========== 情侣绑定 (照片墙共有) ==========

async function bindPartner(partner) {
  const result = await db.bindPartner(partner.id)
  if (result.error) return result
  // 更新本地状态
  if (state.settings) state.settings.partner_id = partner.id
  state.partnerInfo = { id: partner.id, username: partner.username, display_name: partner.display_name }
  // 加载对方打卡照片
  await loadPartnerData(partner.id)
  showToast({ message: '💑 绑定成功，照片墙已合并', type: 'success' })
  return result
}

async function unbindPartner() {
  const partnerId = state.settings?.partner_id
  const result = await db.unbindPartner(partnerId)
  if (result.error) return result
  if (state.settings) state.settings.partner_id = null
  state.partnerInfo = null
  state.partnerCheckins = []
  showToast({ message: '已解除绑定', type: 'success' })
  return result
}

// ========== 打卡操作 ==========

async function addCheckin(record) {
  const result = await db.addCheckin(record)
  if (result.data) {
    state.checkinHistory.unshift(result.data)
    // 更新统计
    await recalculateStreak()
    showToast({ message: '✅ 打卡成功', type: 'success' })
  } else {
    showToast({ message: result.error?.message || '打卡失败', type: 'fail' })
  }
  return result
}

async function addQuickCheckin(dateStr) {
  const today = dateStr || getTodayStr()
  if (state.checkinHistory.some(h => h.date === today)) {
    showToast({ message: '今天已打卡', type: 'fail' })
    return false
  }
  const result = await db.addCheckin({ date: today, type: 'quick' })
  if (result.data) {
    state.checkinHistory.unshift(result.data)
    await recalculateStreak()
    showToast({ message: '✅ 打卡成功', type: 'success' })
    return true
  }
  return false
}

async function recalculateStreak() {
  const streakData = calculateStreakFromHistory(state.checkinHistory)
  if (!state.checkinHistory.length) return

  // fix: 同时检测并持久化新达成的徽章
  const existingBadges = state.checkinStats?.badges || []
  const newMilestone = checkMilestone(streakData.streakDays, existingBadges)
  const updatedBadges = newMilestone ? [...existingBadges, newMilestone] : existingBadges

  const statsData = {
    streak_days: streakData.streakDays,
    last_checkin_date: streakData.lastCheckinDate,
    longest_streak: streakData.longestStreak,
    total_checkins: state.checkinHistory.length,
    badges: updatedBadges,
  }

  const result = await db.updateCheckinStats(statsData)
  if (result.data) {
    state.checkinStats = result.data
  }
}

function calculateStreakFromHistory(history) {
  if (!history || history.length === 0) {
    return { streakDays: 0, lastCheckinDate: '', longestStreak: 0, initialized: false }
  }

  const dates = [...new Set(history.map(h => h.date))].sort().reverse()
  const today = getTodayStr()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = formatDate(yesterday)

  let streakDays = 0
  let lastCheckinDate = dates[0] || ''

  // 只有今天或昨天打过卡才算连续
  if (lastCheckinDate === today || lastCheckinDate === yesterdayStr) {
    let checkDate = lastCheckinDate
    for (const d of dates) {
      if (d === checkDate) {
        streakDays++
        const prev = new Date(checkDate)
        prev.setDate(prev.getDate() - 1)
        checkDate = formatDate(prev)
      } else {
        break
      }
    }
  }

  // 计算最长连续
  let longestStreak = streakDays
  if (dates.length > 1) {
    let current = 1
    for (let i = 0; i < dates.length - 1; i++) {
      const d1 = new Date(dates[i])
      const d2 = new Date(dates[i + 1])
      const diff = (d1 - d2) / 86400000
      if (diff <= 1) {
        current++
        longestStreak = Math.max(longestStreak, current)
      } else {
        current = 1
      }
    }
  }

  return { streakDays, lastCheckinDate, longestStreak, initialized: true }
}

// ========== 愿望操作 ==========

async function addWish(wish) {
  const result = await db.addWish(wish)
  if (result.data) {
    state.wishes.unshift({
      ...wish,
      id: result.data.id,
    })
    showToast({ message: '✨ 愿望已添加', type: 'success' })
  } else {
    console.error('[addWish] Supabase 返回错误:', result.error)
    showToast({ message: result.error?.message || '添加失败', type: 'fail' })
  }
  return result
}

async function updateWish(id, updates) {
  const dbUpdates = { ...updates }
  if (updates.text !== undefined) {
    dbUpdates.title = updates.text
    delete dbUpdates.text
  }
  const result = await db.updateWish(id, dbUpdates)
  if (result.data) {
    const idx = state.wishes.findIndex(w => w.id === id)
    if (idx !== -1) state.wishes[idx] = { ...state.wishes[idx], ...updates }
    showToast({ message: '✅ 已更新', type: 'success' })
  } else {
    showToast({ message: result.error?.message || '更新失败', type: 'fail' })
  }
  return result
}

async function deleteWish(id) {
  const result = await db.deleteWish(id)
  if (result.data) {
    state.wishes = state.wishes.filter(w => w.id !== id)
    showToast({ message: '🗑️ 已删除', type: 'success' })
  } else {
    showToast({ message: result.error?.message || '删除失败', type: 'fail' })
  }
  return result
}

// ========== 消息操作 ==========

async function addMessage(msg) {
  const result = await db.addMessage(msg)
  if (result.data) {
    state.messages.unshift(result.data)
    showToast({ message: '💌 消息已添加', type: 'success' })
  } else {
    showToast({ message: result.error?.message || '添加失败', type: 'fail' })
  }
  return result
}

async function updateMessage(id, updates) {
  const result = await db.updateMessage(id, updates)
  if (result.data) {
    const idx = state.messages.findIndex(m => m.id === id)
    if (idx !== -1) state.messages[idx] = result.data
  }
  return result
}

async function deleteMessage(id) {
  const result = await db.deleteMessage(id)
  if (result.data) {
    state.messages = state.messages.filter(m => m.id !== id)
  }
  return result
}

async function markMessageDisplayed(messageId, dateStr) {
  const msg = state.messages.find(m => m.id === messageId)
  if (!msg) return
  if (!msg.displayed_dates) msg.displayed_dates = []
  if (!msg.displayed_dates.includes(dateStr)) {
    msg.displayed_dates.push(dateStr)
    // 异步同步到 Supabase
    await db.updateMessage(messageId, { displayed_dates: msg.displayed_dates })
  }
}

// ========== 纪念日操作 ==========

async function addAnniversary(data) {
  const result = await db.addAnniversary({
    name: data.name,
    date: data.date,
    type: data.type,
    emoji: data.emoji,
    remark: data.remark,
    remind_days: data.remindDays || data.remind_days || [3],
  })
  if (result.data) {
    state.anniversaries.unshift(result.data)
    showToast({ message: '💕 纪念日已添加', type: 'success' })
    // 按日期排序
    state.anniversaries.sort((a, b) => new Date(a.date) - new Date(b.date))
  } else {
    showToast({ message: result.error?.message || '添加失败', type: 'fail' })
  }
  return result
}

async function updateAnniversary(id, updates) {
  const dbUpdates = { ...updates }
  if (dbUpdates.remindDays !== undefined) {
    dbUpdates.remind_days = dbUpdates.remindDays
    delete dbUpdates.remindDays
  }
  const result = await db.updateAnniversary(id, dbUpdates)
  if (result.data) {
    const idx = state.anniversaries.findIndex(a => a.id === id)
    if (idx !== -1) state.anniversaries[idx] = result.data
  }
  return result
}

async function deleteAnniversary(id) {
  const result = await db.deleteAnniversary(id)
  if (result.data) {
    state.anniversaries = state.anniversaries.filter(a => a.id !== id)
  }
  return result
}

// ========== 餐厅操作 ==========

function addRestaurant(restaurant) {
  state.restaurants.push(restaurant)
  safeSetJSON(STORAGE_KEYS.RESTAURANTS, state.restaurants)
}

function removeRestaurant(name) {
  state.restaurants = state.restaurants.filter(r => r.name !== name)
  safeSetJSON(STORAGE_KEYS.RESTAURANTS, state.restaurants)
}

function resetRestaurants() {
  const defaults = loadRestaurants()
  state.restaurants = defaults
  safeSetJSON(STORAGE_KEYS.RESTAURANTS, defaults)
}

async function toggleFavoriteRestaurant(name) {
  const result = await db.upsertRestaurantPref(name, { is_favorite: true })
  if (result.data) {
    const idx = state.restaurantPrefs.findIndex(r => r.name === name)
    if (idx !== -1) state.restaurantPrefs[idx] = result.data
    else state.restaurantPrefs.push(result.data)
  }
  return result
}

async function toggleExcludeRestaurant(name) {
  const result = await db.upsertRestaurantPref(name, { is_excluded: true })
  if (result.data) {
    const idx = state.restaurantPrefs.findIndex(r => r.name === name)
    if (idx !== -1) state.restaurantPrefs[idx] = result.data
    else state.restaurantPrefs.push(result.data)
  }
  return result
}

// ========== 午餐操作 ==========

async function addLunchRecord(record) {
  const result = await db.addLunchRecord(record)
  if (result.data) {
    state.lunchHistory.unshift(result.data)
  }
  return result
}

// ========== Admin 密码 (本地保留) ==========

async function setAdminPassword(password) {
  const validation = validatePasswordStrength(password)
  if (!validation.valid) {
    showToast({ message: validation.message, type: 'fail' })
    return false
  }
  try {
    const { hash, salt } = await _hp(password)
    const storedFormat = `${salt}.${hash}`
    state.adminPassword = { hash, salt, legacyHash: '' }
    safeSetString(STORAGE_KEYS.ADMIN_PASSWORD, storedFormat)
    return true
  } catch (e) {
    showToast({ message: '密码设置失败：环境不支持 SubtleCrypto', type: 'fail' })
    return false
  }
}

async function verifyAdminPassword(password) {
  const pwd = state.adminPassword
  if (pwd.hash && pwd.salt) {
    return await _vp(password, pwd.hash, pwd.salt)
  }
  if (pwd.legacyHash) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    if (hashHex === pwd.legacyHash) {
      await setAdminPassword(password)
      return true
    }
  }
  return false
}

// ========== 纪念日计算函数 ==========

function getNextOccurrence(dateStr) {
  const original = new Date(dateStr)
  if (isNaN(original.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisYear = new Date(today.getFullYear(), original.getMonth(), original.getDate())
  return thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, original.getMonth(), original.getDate())
}

function getDaysUntil(dateStr) {
  const next = getNextOccurrence(dateStr)
  if (!next) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((next - today) / 86400000)
}

function getDaysSince(dateStr) {
  const original = new Date(dateStr)
  if (isNaN(original.getTime())) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - original) / 86400000)
}

// ========== 工具 ==========

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ========== 导出 ==========

export function useDataStore() {
  return {
    state,
    // 状态快捷访问
    girlfriendName,
    boyfriendName,
    loveAnniversary,
    notificationEnabled,
    themePref,
    reminderTime,
    customReminderTime,
    checkinStreak,
    // 加载
    loadAllData,
    // 设置
    updateSettings,
    setGirlfriendName,
    setBoyfriendName,
    setAnniversary,
    setNotificationEnabled,
    setThemePref,
    // 情侣绑定
    bindPartner,
    unbindPartner,
    // 打卡
    addCheckin,
    addQuickCheckin,
    recalculateStreak,
    // 愿望
    addWish,
    updateWish,
    deleteWish,
    // 消息
    addMessage,
    updateMessage,
    deleteMessage,
    markMessageDisplayed,
    // 纪念日
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    getNextOccurrence,
    getDaysUntil,
    getDaysSince,
    // 餐厅
    addRestaurant,
    removeRestaurant,
    resetRestaurants,
    toggleFavoriteRestaurant,
    toggleExcludeRestaurant,
    // 午餐
    addLunchRecord,
    // Admin
    setAdminPassword,
    verifyAdminPassword,
  }
}
