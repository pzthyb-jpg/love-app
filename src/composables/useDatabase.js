// useDatabase.js — Supabase REST API 全量 CRUD (PBKDF2 + 真实网络调用)
import { ref, computed } from 'vue'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const CURRENT_USER_KEY = 'love-app-current-user'

// 状态
const currentUser = ref(null)
const isAuthenticated = computed(() => !!currentUser.value)
const isReady = ref(true)
const isLoading = ref(false)

// ========== 密码哈希 (PBKDF2-SHA256) ==========

async function hashPassword(password, saltHex = null) {
  const salt = saltHex
    ? Uint8Array.from(atob(saltHex), c => c.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(16))

  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )

  const hashHex = Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const saltB64 = saltHex
    ? saltHex
    : btoa(String.fromCharCode(...salt))

  return { hash: hashHex, salt: saltB64 }
}

// ========== Supabase REST API 基础封装 ==========

async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (!options.headers?.Prefer) {
    headers.Prefer = 'return=minimal'
  }
  const response = await fetch(url, { ...options, headers })
  return response
}

// ========== Auth (注册/登录) ==========

async function register(username, password, displayName = '') {
  if (!username || !password) return { error: { message: '请填写用户名和密码' } }
  if (username.length < 3) return { error: { message: '用户名至少 3 个字符' } }
  if (password.length < 6) return { error: { message: '密码至少 6 位' } }

  try {
    const { hash, salt } = await hashPassword(password)
    // 注册时返回完整的用户记录
    const response = await supabaseFetch('/app_users', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        username,
        password_hash: hash,
        salt,
        display_name: displayName || username,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (errorData.code === '23505') return { error: { message: '用户名已存在' } }
      return { error: { message: errorData.message || '注册失败' } }
    }

    const users = await response.json()
    const newUser = users?.[0]

    currentUser.value = newUser
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser))

    // 自动创建 user_settings
    await supabaseFetch('/user_settings', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ user_id: newUser.id }),
    })

    return { data: newUser }
  } catch (e) {
    return { error: { message: e.message || '注册失败' } }
  }
}

async function login(username, password) {
  if (!username || !password) return { error: { message: '请填写用户名和密码' } }

  try {
    const response = await supabaseFetch(
      `/app_users?username=eq.${encodeURIComponent(username)}&select=id,username,password_hash,salt,display_name,created_at`
    )

    if (!response.ok) return { error: { message: '登录失败，请检查网络' } }

    const users = await response.json()
    const user = users?.[0]

    if (!user) return { error: { message: '账号或密码错误' } }

    const { hash } = await hashPassword(password, user.salt)
    if (hash !== user.password_hash) return { error: { message: '账号或密码错误' } }

    currentUser.value = user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))

    return { data: user }
  } catch (e) {
    return { error: { message: e.message || '登录失败' } }
  }
}

function logout() {
  currentUser.value = null
  localStorage.removeItem(CURRENT_USER_KEY)
}

// ========== 用户设置 CRUD ==========

async function getSettings() {
  if (!currentUser.value) return null
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/user_settings?user_id=eq.${uid}&select=*`)
  if (!response.ok) return null
  const list = await response.json()
  return list?.[0] || null
}

async function updateSettings(updates) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/user_settings?user_id=eq.${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '更新设置失败' } }
  }
  return { data: true }
}

// ========== 打卡记录 CRUD ==========

async function getCheckins() {
  if (!currentUser.value) return []
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/checkins?user_id=eq.${uid}&select=*&order=date.desc`)
  if (!response.ok) return []
  return await response.json()
}

async function addCheckin(record) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch('/checkins', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      user_id: uid,
      date: record.date,
      type: record.type || 'photo',
      photo_url: record.photo_url || record.photo || null,
      note: record.note || null,
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '打卡失败' } }
  }
  const list = await response.json()
  return { data: list?.[0] }
}

async function updateCheckin(id, updates) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/checkins?id=eq.${id}&user_id=eq.${uid}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '更新失败' } }
  }
  const list = await response.json()
  return { data: list?.[0] }
}

// ========== 愿望清单 CRUD ==========

async function getWishes() {
  if (!currentUser.value) return []
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/wishes?user_id=eq.${uid}&select=*&order=created_at.desc`)
  if (!response.ok) return []
  const rows = await response.json()
  // 将 Supabase 字段映射到前端模板期望的格式
  return rows.map(row => ({
    id: row.id,
    text: row.title || '',
    description: row.description || '',
    type: row.type || (row.status === 'vent' ? 'vent' : 'wish'),
    status: row.status || 'pending',
    fulfilled: row.status === 'completed' || row.status === 'fulfilled',
    priority: row.priority || 0,
    dueDate: row.due_date || null,
    timeStr: row.created_at
      ? new Date(row.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : '',
    dateStr: row.created_at
      ? new Date(row.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
      : '',
    fulfilledBy: row.fulfilled_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

async function addWish(wish) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const title = wish.title || wish.text || ''
  const isVent = wish.type === 'vent'
  const response = await supabaseFetch('/wishes', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      user_id: uid,
      title: title,
      description: wish.description || (isVent ? title : ''),
      // Supabase wishes 表无 type 列，vent 用 status=vent 标记
      status: wish.fulfilled ? 'completed' : (isVent ? 'vent' : (wish.status || 'pending')),
      priority: wish.priority || 0,
      due_date: wish.due_date || null,
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '添加愿望失败' } }
  }
  const list = await response.json()
  return { data: list?.[0] }
}

async function updateWish(id, updates) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  // 将前端字段映射到 Supabase 字段: fulfilled -> status='fulfilled'
  const mapped = { ...updates }
  if (mapped.fulfilled === true) {
    mapped.status = 'fulfilled'
  } else if (mapped.fulfilled === false) {
    mapped.status = 'pending'
  }
  // remove fields not in Supabase schema
  delete mapped.text
  delete mapped.type
  delete mapped.timeStr
  delete mapped.dateStr
  delete mapped.fulfilled
  delete mapped.fulfilledBy
  delete mapped.fulfilledEmoji
  delete mapped.id
  delete mapped.createdAt
  delete mapped.updatedAt
  delete mapped.dueDate
  if (mapped.fulfilledBy) mapped.fulfilled_by = mapped.fulfilledBy
  const response = await supabaseFetch(`/wishes?id=eq.${id}&user_id=eq.${uid}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(mapped),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '更新愿望失败' } }
  }
  const list = await response.json()
  return { data: list?.[0] }
}

async function deleteWish(id) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/wishes?id=eq.${id}&user_id=eq.${uid}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '删除愿望失败' } }
  }
  return { data: true }
}

// ========== 消息/留言 CRUD ==========

async function getMessages() {
  if (!currentUser.value) return []
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/messages?user_id=eq.${uid}&select=*&order=created_at.desc`)
  if (!response.ok) return []
  return await response.json()
}

async function addMessage(msg) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch('/messages', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      user_id: uid,
      content: msg.content,
      author_name: msg.author_name || '',
      icon: msg.icon || '💕',
      is_template: msg.is_template || false,
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '添加消息失败' } }
  }
  const list = await response.json()
  return { data: list?.[0] }
}

async function updateMessage(id, updates) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/messages?id=eq.${id}&user_id=eq.${uid}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '更新消息失败' } }
  }
  const list = await response.json()
  return { data: list?.[0] }
}

async function deleteMessage(id) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/messages?id=eq.${id}&user_id=eq.${uid}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '删除消息失败' } }
  }
  return { data: true }
}

// ========== 纪念日 CRUD ==========

async function getAnniversaries() {
  if (!currentUser.value) return []
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/anniversaries?user_id=eq.${uid}&select=*&order=date.asc`)
  if (!response.ok) return []
  return await response.json()
}

async function addAnniversary(data) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch('/anniversaries', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      user_id: uid,
      name: data.name,
      date: data.date,
      type: data.type || 'anniversary',
      emoji: data.emoji || '💕',
      remark: data.remark || '',
      remind_days: data.remind_days || [3],
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '添加纪念日失败' } }
  }
  const list = await response.json()
  return { data: list?.[0] }
}

async function updateAnniversary(id, updates) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/anniversaries?id=eq.${id}&user_id=eq.${uid}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '更新纪念日失败' } }
  }
  const list = await response.json()
  return { data: list?.[0] }
}

async function deleteAnniversary(id) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/anniversaries?id=eq.${id}&user_id=eq.${uid}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '删除纪念日失败' } }
  }
  return { data: true }
}

// ========== 餐厅偏好 CRUD ==========

async function getRestaurantPrefs() {
  if (!currentUser.value) return []
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/restaurant_prefs?user_id=eq.${uid}&select=*`)
  if (!response.ok) return []
  return await response.json()
}

async function upsertRestaurantPref(name, updates) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const existing = await getRestaurantPrefs()
  const item = existing.find(r => r.name === name)
  
  if (item) {
    const response = await supabaseFetch(`/restaurant_prefs?id=eq.${item.id}&user_id=eq.${uid}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) return { error: { message: '更新餐厅偏好失败' } }
    const list = await response.json()
    return { data: list?.[0] }
  } else {
    const response = await supabaseFetch('/restaurant_prefs', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        user_id: uid,
        name,
        is_favorite: updates.is_favorite || false,
        is_excluded: updates.is_excluded || false,
      }),
    })
    if (!response.ok) return { error: { message: '添加餐厅偏好失败' } }
    const list = await response.json()
    return { data: list?.[0] }
  }
}

// ========== 午餐记录 CRUD ==========

async function getLunchHistory() {
  if (!currentUser.value) return []
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/lunch_history?user_id=eq.${uid}&select=*&order=selected_at.desc`)
  if (!response.ok) return []
  return await response.json()
}

async function addLunchRecord(record) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const response = await supabaseFetch('/lunch_history', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      user_id: uid,
      restaurant_name: record.restaurant_name,
      selected_at: record.selected_at || new Date().toISOString(),
      rating: record.rating || null,
      note: record.note || null,
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return { error: { message: err.message || '添加午餐记录失败' } }
  }
  const list = await response.json()
  return { data: list?.[0] }
}

// ========== 打卡统计 CRUD ==========

async function getCheckinStats() {
  if (!currentUser.value) return null
  const uid = currentUser.value.id
  const response = await supabaseFetch(`/checkin_stats?user_id=eq.${uid}&select=*`)
  if (!response.ok) return null
  const list = await response.json()
  return list?.[0] || null
}

async function updateCheckinStats(updates) {
  if (!currentUser.value) return { error: { message: '未登录' } }
  const uid = currentUser.value.id
  const existing = await getCheckinStats()
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  }
  
  if (existing) {
    const response = await supabaseFetch(`/checkin_stats?id=eq.${existing.id}&user_id=eq.${uid}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) return { error: { message: '更新打卡统计失败' } }
    const list = await response.json()
    return { data: list?.[0] }
  } else {
    const response = await supabaseFetch('/checkin_stats', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ user_id: uid, ...payload }),
    })
    if (!response.ok) return { error: { message: '创建打卡统计失败' } }
    const list = await response.json()
    return { data: list?.[0] }
  }
}

// ========== 初始化 ==========

function initAuth() {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY)
    if (stored) currentUser.value = JSON.parse(stored)
  } catch (e) {}
}

initAuth()

// ========== Composable ==========

export function useAuth() {
  return {
    currentUser,
    isAuthenticated,
    isReady,
    isLoading,
    register,
    login,
    logout,
  }
}

export function useDatabase() {
  return {
    currentUser,
    isAuthenticated,
    isLoading,
    // Auth
    register,
    login,
    logout,
    // Settings
    getSettings,
    updateSettings,
    // Checkins
    getCheckins,
    addCheckin,
    updateCheckin,
    getCheckinStats,
    updateCheckinStats,
    // Wishes
    getWishes,
    addWish,
    updateWish,
    deleteWish,
    // Messages
    getMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    // Anniversaries
    getAnniversaries,
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    // Restaurants
    getRestaurantPrefs,
    upsertRestaurantPref,
    // Lunch
    getLunchHistory,
    addLunchRecord,
  }
}
