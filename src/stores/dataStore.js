// dataStore.js — 响应式数据层
import { reactive, toRefs } from 'vue'
import {
  STORAGE_KEYS,
  safeGetJSON,
  safeSetJSON,
  safeGetString,
  safeSetString
} from '../composables/useStorage.js'

// 响应式状态
const state = reactive({
  checkinHistory: safeGetJSON(STORAGE_KEYS.CHECKIN_HISTORY, []),
  wishes: safeGetJSON(STORAGE_KEYS.WISHES, []),
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
  adminPassword: safeGetString(STORAGE_KEYS.ADMIN_PASSWORD, '1314')
})

// 操作函数
function addCheckin(record) {
  state.checkinHistory.unshift(record)
  safeSetJSON(STORAGE_KEYS.CHECKIN_HISTORY, state.checkinHistory)
}

function addWish(wish) {
  state.wishes.unshift(wish)
  safeSetJSON(STORAGE_KEYS.WISHES, state.wishes)
}

function updateWish(id, updates) {
  const idx = state.wishes.findIndex(w => w.id === id)
  if (idx !== -1) {
    state.wishes[idx] = { ...state.wishes[idx], ...updates }
    safeSetJSON(STORAGE_KEYS.WISHES, state.wishes)
  }
}

function deleteWish(id) {
  state.wishes = state.wishes.filter(w => w.id !== id)
  safeSetJSON(STORAGE_KEYS.WISHES, state.wishes)
}

function addLunchRecord(record) {
  state.lunchHistory.unshift(record)
  safeSetJSON(STORAGE_KEYS.LUNCH_HISTORY, state.lunchHistory)
}

function addRestaurant(restaurant) {
  state.restaurants.push(restaurant)
  safeSetJSON(STORAGE_KEYS.RESTAURANTS, state.restaurants)
}

function removeRestaurant(name) {
  state.restaurants = state.restaurants.filter(r => r.name !== name)
  safeSetJSON(STORAGE_KEYS.RESTAURANTS, state.restaurants)
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
  safeSetJSON(STORAGE_KEYS.RESTAURANTS, state.restaurants)
}

function addMessage(msg) {
  state.messages.push(msg)
  safeSetJSON(STORAGE_KEYS.MESSAGES, state.messages)
}

function updateMessage(id, updates) {
  const idx = state.messages.findIndex(m => m.id === id)
  if (idx !== -1) {
    state.messages[idx] = { ...state.messages[idx], ...updates }
    safeSetJSON(STORAGE_KEYS.MESSAGES, state.messages)
  }
}

function deleteMessage(id) {
  state.messages = state.messages.filter(m => m.id !== id)
  safeSetJSON(STORAGE_KEYS.MESSAGES, state.messages)
}

function updateStreak(streakData) {
  Object.assign(state.checkinStreak, streakData)
  safeSetJSON(STORAGE_KEYS.CHECKIN_STREAK, state.checkinStreak)
}

function addBadge(badge) {
  state.checkinBadges.push(badge)
  safeSetJSON(STORAGE_KEYS.CHECKIN_BADGES, state.checkinBadges)
}

function setAnniversary(dateStr) {
  state.loveAnniversary = dateStr
  safeSetString(STORAGE_KEYS.LOVE_ANNIVERSARY, dateStr)
}

function setNotificationEnabled(enabled) {
  state.notificationEnabled = enabled
  safeSetString(STORAGE_KEYS.NOTIFICATION_ENABLED, enabled ? 'true' : 'false')
}

function setAdminPassword(password) {
  state.adminPassword = password
  safeSetString(STORAGE_KEYS.ADMIN_PASSWORD, password)
}

export function useDataStore() {
  return {
    state,
    addCheckin,
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
    updateStreak,
    addBadge,
    setAnniversary,
    setNotificationEnabled,
    setAdminPassword
  }
}
