// useDatabase.js — Supabase Auth + CRUD 封装
import { ref, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || ''

let supabase = null
let isInitialized = false

const user = ref(null)
const isAuthenticated = computed(() => !!user.value)
const isAnonymous = computed(() => user.value?.is_anonymous)
const isReady = ref(false)

function initSupabase() {
  if (isInitialized) return
  isInitialized = true

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase 未配置')
    isReady.value = true
    return
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'love-app-supabase',
      storage: {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: (key) => localStorage.removeItem(key),
      },
    },
  })

  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
  })

  supabase.auth.getSession().then(({ data: { session } }) => {
    user.value = session?.user || null
    if (!session) {
      supabase.auth.signInAnonymously().then(({ data }) => {
        user.value = data.user || null
      })
    }
    isReady.value = true
  })
}

// ========== Auth ==========

async function signInAnonymously() {
  if (!supabase) return { error: new Error('未初始化') }
  const { data, error } = await supabase.auth.signInAnonymously()
  if (!error) user.value = data.user
  return { data, error }
}

async function signUp(email, password) {
  if (!supabase) return { error: new Error('未初始化') }
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (!error) user.value = data.user
  return { data, error }
}

async function signIn(email, password) {
  if (!supabase) return { error: new Error('未初始化') }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) user.value = data.user
  return { data, error }
}

async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (!error) user.value = null
}

// ========== 数据迁移 (localStorage → Supabase) ==========

async function migrateLocalData(userId) {
  if (!supabase || !userId) return { error: new Error('未就绪') }
  try {
    if (localStorage.getItem('migration_status') === 'done') return { data: 'skipped' }

    const migrate = async (key, table, mapper) => {
      const raw = localStorage.getItem(key)
      if (!raw) return
      try {
        const items = JSON.parse(raw)
        if (!Array.isArray(items) || !items.length) return
        await supabase.from(table).upsert(items.map(i => mapper(i, userId)))
      } catch (e) { console.warn(`迁移 ${key} 失败:`, e) }
    }

    await migrate('checkin_history', 'checkins', (h) => ({ user_id: userId, date: h.date, type: h.type || 'quick' }))
    await migrate('wishes', 'wishes', (w) => ({ id: w.id, user_id: userId, text: w.text, type: w.type || 'wish', fulfilled: w.fulfilled || false, fulfilled_by: w.fulfilledBy || '' }))
    await migrate('lunch_history', 'lunch_history', (l) => ({ user_id: userId, restaurant_name: l.restaurant, date: l.date, time: l.time }))
    await migrate('favorite_restaurants', 'favorite_restaurants', (r) => ({ user_id: userId, name: r.name, emoji: r.emoji, rating: r.rating || 4, tags: r.tags || [], address: r.address || '', lat: r.lat || 0, lon: r.lon || 0, note: r.note || '' }))
    await migrate('anniversaries', 'anniversaries', (a) => ({ id: a.id, user_id: userId, name: a.name, date: a.date, type: a.type || 'custom' }))
    await migrate('messages', 'messages', (m) => ({ id: m.id, user_id: userId, author_name: m.author, content: m.text, is_displayed: m.isDisplayed || false }))
    await migrate('checkin_badges', 'checkin_badges', (b) => ({ user_id: userId, badge_type: b.type, earned_date: b.date }))

    try {
      const streakRaw = localStorage.getItem('checkin_streak')
      if (streakRaw) {
        const s = JSON.parse(streakRaw)
        await supabase.from('checkin_streaks').upsert({ user_id: userId, streak_days: s.streakDays || 0, last_checkin_date: s.lastCheckDate || '', longest_streak: s.longestStreak || 0 })
      }
    } catch (e) {}

    try {
      const loveDate = localStorage.getItem('love_anniversary')
      const gfName = localStorage.getItem('girlfriend_name') || ''
      const bfName = localStorage.getItem('boyfriend_name') || '男朋友'
      await supabase.from('relationship_settings').upsert({ user_id: userId, partner_nickname: gfName, my_nickname: bfName, love_start_date: loveDate || null, notification_enabled: localStorage.getItem('notification_enabled') !== 'false' })
    } catch (e) {}

    localStorage.setItem('migration_status', 'done')
    return { data: 'migrated' }
  } catch (e) {
    return { error: e }
  }
}

// ========== Composable ==========

export function useDatabase() {
  initSupabase()
  return {
    user, isAuthenticated, isAnonymous, isReady,
    signInAnonymously, signUp, signIn, signOut,
    migrateLocalData,
    get client() { return supabase },
  }
}
