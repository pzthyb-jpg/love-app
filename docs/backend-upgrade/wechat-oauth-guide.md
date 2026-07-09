# 微信开放平台 OAuth 配置 & 部署指南

## 前置条件

| 项目 | 说明 |
|------|------|
| 微信开放平台账号 | https://open.weixin.qq.com（企业/个人均可，300元认证费） |
| 网站应用 | 通过审核后获得 AppID + AppSecret |
| Cloudflare 账号 | 免费计划即可 |
| 回调域名 | 你的 PWA 域名解析到 Cloudflare |

---

## 1. 微信开放平台设置

1. 登录 https://open.weixin.qq.com
2. 创建「网站应用」→ 填写应用名称、Logo、官网
3. 获取 **AppID** 和 **AppSecret**
4. 配置「授权回调域」：`你的域名`（如 `love-app.pages.dev`）

---

## 2. Cloudflare Worker 部署

### 2.1 创建 Worker

```bash
# 安装 wrangler（Cloudflare CLI）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建项目
mkdir wechat-oauth-worker && cd wechat-oauth-worker
wrangler init --template cloudflare-workers-http
```

### 2.2 替换 `src/index.js`


### 2.3 设置 Secret

```bash
wrangler secret put WECHAT_APPID
# 输入微信 AppID

wrangler secret put WECHAT_APPSECRET
# 输入微信 AppSecret

wrangler secret put SUPABASE_URL
# 输入 Supabase URL

wrangler secret put SUPABASE_SERVICE_KEY
# 输入 Supabase service_role key（注意：此 key 只在服务端使用）
```

### 2.4 部署

```bash
wrangler deploy
# 输出: https://wechat-oauth-worker.<subdomain>.workers.dev
```

### 2.5 配置自定义域名（可选）

Cloudflare Dashboard → Worker → Triggers → Add custom domain → `auth.yourdomain.com`

---

## 3. PWA 配置

### 3.1 更新 .env

```bash
# .env
VITE_WECHAT_WORKER_URL=https://wechat-oauth-worker.<subdomain>.workers.dev
VITE_WECHAT_APPID=你的AppID
```

### 3.2 授权回调 URL

微信开放平台配置回调 URL：
```
https://wechat-oauth-worker.<subdomain>.workers.dev/wechat/callback
```

---

## 4. 登录流程

```
PWA 用户点击「微信登录」
  → 生成 random state（防 CSRF）存入 sessionStorage
  → 跳转微信授权页（appid + redirect_uri = Worker /wechat/callback + state）
  → 用户在微信内扫码授权
  → 微信回调 Worker /wechat/callback?code=xxx&state=xxx
  → Worker 用 code 换 access_token + openid
  → Worker 调用 Supabase Admin API 创建/更新微信用户
  → Worker 生成 Supabase custom token（或用otp方式）
  → Worker 重定向回 PWA /auth/callback#token=xxx
  → PWA 解析 token → 调用 supabase.auth.signInWithCustomToken? → 写入 session
```

---

## 5. 注意事项

1. **微信登录必须 HTTPS**，Cloudflare Worker 默认支持
2. **openid 是唯一标识**，同一公众号下唯一，可关联 Supabase auth.users
3. **未认证账号**无法获取用户昵称头像（需微信认证）
4. 认证回调有效期 5 分钟，Worker 处理需快速返回
5. **使用微信内置浏览器访问**时可以直接唤起授权（jssdk），但 PWA 需要走 OAuth 网页授权
