// Cloudflare Worker — 微信 OAuth 回调处理
// Cloudflare Dashboard → Workers & Pages → Create Worker → 复制此代码

export interface Env {
  WECHAT_APPID: string
  WECHAT_APPSECRET: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

// Step 1: 生成微信授权 URL
export function getWechatAuthUrl(appid: string, redirectUri: string, state: string) {
  const params = new URLSearchParams({
    appid,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'snsapi_login',
    state,
  })
  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`
}

// Step 2: code → access_token
export async function exchangeCodeForToken(
  code: string,
  appid: string,
  appsecret: string
): Promise<{ access_token: string; openid: string }> {
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${appsecret}&code=${code}&grant_type=authorization_code`
  const res = await fetch(url, { redirect: 'follow' })
  const data = await res.json()
  if (data.errcode) throw new Error(data.errmsg || '微信授权失败')
  return { access_token: data.access_token, openid: data.openid }
}

// Step 3: 获取微信用户信息
export async function getWechatUserInfo(accessToken: string, openid: string) {
  const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
  const res = await fetch(url, { redirect: 'follow' })
  const data = await res.json()
  if (data.errcode) throw new Error(data.errmsg || '获取用户信息失败')
  return { nickname: data.nickname, avatar_url: data.headimgurl, unionid: data.unionid }
}

// Step 4: 在 Supabase 创建/查找用户，返回 UUID
export async function upsertWechatUser(
  supabaseUrl: string,
  serviceKey: string,
  openid: string,
  nickname: string,
  avatarUrl: string
): Promise<{ userId: string; isNew: boolean }> {
  // 查找是否已存在
  const searchRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?filter=%22wechat_openid%22+eq.%22${openid}%22`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })
  const searchData = await searchRes.json()

  if (searchData.users?.length > 0) {
    return { userId: searchData.users[0].id, isNew: false }
  }

  // 不存在 → 创建新用户
  const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: `${openid}@wechat.local`,
      password: crypto.randomUUID(),
      user_metadata: {
        wechat_openid: openid,
        display_name: nickname,
        avatar_url: avatarUrl,
        wechat: true,
      },
      email_confirm: true,
    }),
  })

  if (!createRes.ok) {
    const errText = await createRes.text()
    throw new Error(`创建用户失败: ${errText}`)
  }

  const newUser = await createRes.json()
  return { userId: newUser.id, isNew: true }
}

// Step 5: 生成一次性登录 code，返回给前端
export async function createAuthCode(supabaseUrl: string, serviceKey: string, userId: string): Promise<string> {
  const code = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  await fetch(`${supabaseUrl}/rest/v1/auth_codes`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ code, user_id: userId, expires_at: expiresAt }),
  })

  return code
}

// ─── Worker 主入口 ───
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || ''

    // CORS 头（允许 PWA 请求）
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // ---- 路由 1: 生成授权 URL ----
    if (url.pathname === '/wechat/auth-url') {
      const redirectUri = url.searchParams.get('redirect_uri')
      if (!redirectUri) return new Response('Missing redirect_uri', { status: 400 })

      const state = crypto.randomUUID()
      const authUrl = getWechatAuthUrl(env.WECHAT_APPID, redirectUri, state)

      return new Response(JSON.stringify({ authUrl, state }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---- 路由 2: 微信回调 ----
    if (url.pathname === '/wechat/callback') {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const redirectBack = url.searchParams.get('redirect_back') || '/'

      if (!code) return new Response('Missing code', { status: 400 })

      try {
        // 1. 换 token
        const { access_token, openid } = await exchangeCodeForToken(
          code,
          env.WECHAT_APPID,
          env.WECHAT_APPSECRET
        )

        // 2. 获取用户信息
        const userInfo = await getWechatUserInfo(access_token, openid)

        // 3. 创建/查找用户
        const { userId, isNew } = await upsertWechatUser(
          env.SUPABASE_URL,
          env.SUPABASE_SERVICE_KEY,
          openid,
          userInfo.nickname,
          userInfo.avatar_url
        )

        // 4. 生成一次性 code
        const authCode = await createAuthCode(
          env.SUPABASE_URL,
          env.SUPABASE_SERVICE_KEY,
          userId
        )

        // 5. 重定向回 PWA
        const redirectUrl = new URL(redirectBack, url.origin)
        redirectUrl.searchParams.set('auth_code', authCode)

        return Response.redirect(redirectUrl.toString(), 302)
      } catch (e: any) {
        return new Response(`登录失败: ${e.message}`, { status: 500 })
      }
    }

    // ---- 路由 3: PWA 用 auth_code 换 Supabase session ----
    if (url.pathname === '/wechat/exchange' && request.method === 'POST') {
      const { code } = await request.json() as any
      if (!code) return new Response('Missing code', { status: 400 })

      try {
        // 查找 auth_code
        const codeRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/auth_codes?code=eq.${code}&select=user_id,expires_at&limit=1`,
          {
            headers: {
              apikey: env.SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            },
          }
        )
        const codes = await codeRes.json()

        if (!codes?.length) {
          return new Response('Invalid or expired code', { status: 401 })
        }

        const authCode = codes[0]

        // 检查过期
        if (new Date(authCode.expires_at) < new Date()) {
          return new Response('Code expired', { status: 401 })
        }

        // 仅验证，不生成 JWT（保持匿名 session）
        // 后续可根据需要提升为正式账号
        await fetch(`${env.SUPABASE_URL}/rest/v1/auth_codes?code=eq.${code}`, {
          method: 'DELETE',
          headers: {
            apikey: env.SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          },
        })

        return new Response(
          JSON.stringify({ success: true, userId: authCode.user_id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (e: any) {
        return new Response(`Exchange failed: ${e.message}`, { status: 500 })
      }
    }

    return new Response('Not Found', { status: 404 })
  },
}
