// useWechat.js — 微信登录 composable
import { ref } from 'vue'

const WECHAT_WORKER_URL = import.meta.env?.VITE_WECHAT_WORKER_URL || ''
const WECHAT_APPID = import.meta.env?.VITE_WECHAT_APPID || ''

const isWechatLoading = ref(false)
const wechatError = ref('')

// 生成微信授权 URL
async function getWechatAuthUrl(redirectBack = window.location.origin + '/auth/callback') {
  if (!WECHAT_WORKER_URL || !WECHAT_APPID) {
    throw new Error('微信登录未配置 VITE_WECHAT_WORKER_URL / VITE_WECHAT_APPID')
  }

  const res = await fetch(
    `${WECHAT_WORKER_URL}/wechat/auth-url?redirect_uri=${encodeURIComponent(
      `${WECHAT_WORKER_URL}/wechat/callback?redirect_back=${encodeURIComponent(redirectBack)}`
    )}`
  )
  const data = await res.json()
  return data.authUrl
}

// 启动微信登录（跳转授权页）
export async function signInWithWechat() {
  isWechatLoading.value = true
  wechatError.value = ''

  try {
    const authUrl = await getWechatAuthUrl()
    // 保存 state 到 sessionStorage（回调时验证）
    const state = new URL(authUrl).searchParams.get('state')
    sessionStorage.setItem('wechat_oauth_state', state || '')

    // 跳转到微信授权页
    window.location.href = authUrl
  } catch (e) {
    wechatError.value = e.message || '微信登录启动失败'
    isWechatLoading.value = false
  }
}

// 处理微信回调（在 /auth/callback 页面调用）
export async function handleWechatCallback() {
  const params = new URLSearchParams(window.location.search)
  const authCode = params.get('auth_code')

  if (!authCode) {
    wechatError.value = '缺少授权码'
    return { success: false }
  }

  try {
    // 用 auth_code 换取用户信息
    const res = await fetch(`${WECHAT_WORKER_URL}/wechat/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: authCode }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(err || '验证失败')
    }

    const data = await res.json()

    // 清理 URL
    window.history.replaceState({}, '', window.location.pathname)

    return { success: true, userId: data.userId }
  } catch (e) {
    wechatError.value = e.message || '微信登录失败'
    return { success: false }
  }
}

export function useWechat() {
  return {
    isWechatLoading,
    wechatError,
    signInWithWechat,
    handleWechatCallback,
  }
}
