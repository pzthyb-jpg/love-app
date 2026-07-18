import { ref } from 'vue'
import { useAuth } from './useDatabase.js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const { currentUser } = useAuth()

const FETCH_TIMEOUT = 15000 // 15s timeout
const MAX_RETRIES = 2 // 最多重试 2 次（指数退避：1s, 2s）

// Supabase REST API 基础封装，含超时 + 重试策略
// 与 useDatabase.js 保持一致：15s AbortController 超时，2 次指数退避重试
async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (!options.headers?.Prefer) headers.Prefer = 'return=minimal'

  // Timeout + Retry wrapper（指数退避，仅对网络错误重试）
  let lastErr = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
      const response = await fetch(url, { ...options, headers, signal: controller.signal })
      clearTimeout(timer)
      return response
    } catch (e) {
      lastErr = e
      // 仅对网络错误重试，用户取消或非 fetch 错误直接跳出
      if (e.name === 'AbortError' || !e.message?.includes('fetch')) break
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
    }
  }
  throw lastErr
}

export function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function formatDistance(km) {
  if (km < 1) return Math.round(km * 1000) + 'm'
  if (km > 100) return '100km+'
  return km.toFixed(1) + 'km'
}

export function useLocationShare() {

  function fuzzyLocation(lat, lng) {
    return { lat: Math.round(lat * 10) / 10, lng: Math.round(lng * 10) / 10 }
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return '很久以前'
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return '刚刚'
    if (min < 60) return min + '分钟前'
    const hr = Math.floor(min / 60)
    if (hr < 24) return hr + '小时前'
    const day = Math.floor(hr / 24)
    if (day < 30) return day + '天前'
    return '很久以前'
  }

  function isOnline(dateStr) {
    return dateStr && (Date.now() - new Date(dateStr).getTime()) < 5 * 60 * 1000
  }

  async function getBlacklist() {
    const uid = currentUser.value?.id
    if (!uid) return { data: null, error: { message: '未登录' } }
    const res = await supabaseFetch(`/location_blacklist?user_id=eq.${uid}&select=blocked_user_id,id`)
    if (!res.ok) return { data: null, error: { message: '获取黑名单失败' } }
    return { data: await res.json(), error: null }
  }

  async function blockUser(blockedId) {
    const uid = currentUser.value?.id
    if (!uid) return { error: { message: '未登录' } }
    const res = await supabaseFetch('/location_blacklist', {
      method: 'POST',
      body: JSON.stringify({ user_id: uid, blocked_user_id: blockedId }),
    })
    return res.ok ? { data: true } : { error: { message: '拉黑失败' } }
  }

  async function unblockUser(blockedId) {
    const uid = currentUser.value?.id
    if (!uid) return { error: { message: '未登录' } }
    const res = await supabaseFetch(`/location_blacklist?user_id=eq.${uid}&blocked_user_id=eq.${blockedId}`, { method: 'DELETE' })
    return res.ok ? { data: true } : { error: { message: '解除失败' } }
  }

  async function searchUsers(keyword) {
    if (!keyword || keyword.length < 2) return { data: [] }
    const uid = currentUser.value?.id
    const res = await supabaseFetch(`/app_users?username=ilike.*${encodeURIComponent(keyword)}*&id=neq.${uid}&select=id,username,display_name,avatar&limit=20`)
    if (!res.ok) return { data: [], error: { message: '搜索失败' } }
    const users = await res.json()
    const { data: blacklist } = await getBlacklist()
    const blockedIds = blacklist ? blacklist.map(b => b.blocked_user_id) : []
    return { data: users.filter(u => !blockedIds.includes(u.id)), error: null }
  }

  async function sendInvite(receiverId) {
    const uid = currentUser.value?.id
    if (!uid) return { error: { message: '未登录' } }
    const res = await supabaseFetch('/location_invites', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ sender_id: uid, receiver_id: receiverId, status: 'pending' }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      if (err.code === '23505') return { error: { message: '你已经邀请过 ta 了' } }
      return { error: { message: '邀请失败，请稍后重试' } }
    }
    const data = await res.json()
    return { data: data?.[0], error: null }
  }

  // 批量查询用户信息，避免 N+1 问题（原实现对每条邀请逐一 fetch 用户）
  async function getPendingInvites() {
    const uid = currentUser.value?.id
    if (!uid) return { data: [] }
    const res = await supabaseFetch(`/location_invites?receiver_id=eq.${uid}&status=eq.pending&select=*&order=created_at.desc`)
    if (!res.ok) return { data: [] }
    const invites = await res.json()
    if (!invites.length) return { data: [] }

    // 收集所有 sender_id，一次批量查询替代 N 次单条查询
    const senderIds = [...new Set(invites.map(inv => inv.sender_id))]
    const userMap = await batchFetchUsers(senderIds)
    const enriched = invites.map(inv => ({
      ...inv,
      sender: userMap[inv.sender_id] || null,
    }))
    return { data: enriched }
  }

  async function respondInvite(id, action) {
    const status = action === 'accepted' ? 'accepted' : 'rejected'
    const res = await supabaseFetch(`/location_invites?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ status, responded_at: new Date().toISOString() }),
    })
    return res.ok ? { data: true } : { error: { message: '操作失败' } }
  }

  // 批量查询用户信息，避免 N+1 问题（原实现对每条分享逐一 fetch 用户）
  async function getActiveShares() {
    const uid = currentUser.value?.id
    if (!uid) return { data: [] }
    const res = await supabaseFetch(`/location_invites?or=(sender_id.eq.${uid},receiver_id.eq.${uid})&status=eq.accepted&select=*`)
    if (!res.ok) return { data: [] }
    const shares = await res.json()
    if (!shares.length) return { data: [] }

    // 收集所有 partner_id，一次批量查询替代 N 次单条查询
    const partnerIds = [...new Set(
      shares.map(inv => inv.sender_id === uid ? inv.receiver_id : inv.sender_id)
    )]
    const userMap = await batchFetchUsers(partnerIds)
    const enriched = shares.map(inv => {
      const partnerId = inv.sender_id === uid ? inv.receiver_id : inv.sender_id
      return { ...inv, partner: userMap[partnerId] || null, relationship_id: inv.id }
    })
    return { data: enriched }
  }

  // 批量查询用户信息（PostgREST in 过滤），返回 { userId: userInfo } 映射
  // 优化原因：避免 N+1 查询，将 N 次单条请求合并为 1 次批量请求
  async function batchFetchUsers(userIds) {
    if (!userIds.length) return {}
    const idFilter = userIds.join(',')
    const res = await supabaseFetch(`/app_users?id=in.(${idFilter})&select=id,username,display_name,avatar`)
    if (!res.ok) return {}
    const users = await res.json().catch(() => [])
    const map = {}
    users.forEach(u => { map[u.id] = u })
    return map
  }

  async function uploadLocation(relationshipId, lat, lng, accuracy) {
    const uid = currentUser.value?.id
    if (!uid) return { error: { message: '未登录' } }
    const res = await supabaseFetch('/location_shares', {
      method: 'POST',
      body: JSON.stringify({ relationship_id: relationshipId, user_id: uid, latitude: lat, longitude: lng, accuracy }),
    })
    return res.ok ? { data: true } : { error: { message: '上传失败' } }
  }

  async function getPartnerLocation(relationshipId, partnerId) {
    const res = await supabaseFetch(`/location_shares?relationship_id=eq.${relationshipId}&user_id=eq.${partnerId}&order=created_at.desc&limit=1`)
    if (!res.ok) return null
    const list = await res.json()
    return list?.[0] || null
  }

  async function clearCachedLocations() {
    try { localStorage.removeItem('location_cache') } catch(e) {}
  }

  async function closeShare(id, reason = 'user_initiated') {
    const res = await supabaseFetch(`/location_invites?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed', closed_at: new Date().toISOString(), closed_reason: reason }),
    })
    return res.ok ? { data: true } : { error: { message: '关闭失败' } }
  }

  return {
    fuzzyLocation,
    formatRelativeTime,
    isOnline,
    getBlacklist,
    blockUser,
    unblockUser,
    searchUsers,
    sendInvite,
    getPendingInvites,
    respondInvite,
    getActiveShares,
    uploadLocation,
    getPartnerLocation,
    clearCachedLocations,
    closeShare,
  }
}
