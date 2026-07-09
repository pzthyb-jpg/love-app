# 后端 + 账号体系接入 技术调研 & 架构设计

> **文档版本：** v1.0
> **文档日期：** 2026-07-09
> **所属项目：** love-app（情侣 PWA 应用）
> **文档性质：** 技术调研 + 架构设计方案（不含代码实现）

---

## 1. 项目背景

| 属性 | 说明 |
|------|------|
| **应用类型** | PWA（Progressive Web App），Vue 3 + Vite 构建 |
| **部署方式** | 纯前端静态部署（无 Node 后端），托管于 CDN |
| **当前存储** | 全部数据存于浏览器 localStorage（共 14 个 STORAGE_KEY） |
| **功能模块** | 打卡（history/streak/badges）、愿望池、午餐转盘（历史/收藏）、时光相册、纪念日、留言板 |
| **目标用户** | 情侣二人，极低并发，免费优先 |
| **核心痛点** | 数据仅存于localStorage，换设备/清缓存即丢失；无账号体系，无法跨设备同步 |

---

## 2. 后端选型调研

### 2.1 候选方案对比

| 方案 | 免费额度 | 内置 Auth | 数据库 | 国内访问 | 前端直连 | 推荐度 |
|------|---------|-----------|--------|---------|---------|--------|
| **Supabase** | 500MB DB + 1GB Storage | ✅ 匿名+邮箱+OAuth | PostgreSQL + RLS | ⚠️ 部分 | ✅ anon key | ⭐⭐⭐⭐⭐ |
| **Cloudflare Workers + D1** | 10K req/day | ❌ 需自建 | SQLite (D1) | ✅ | ✅ | ⭐⭐⭐ |
| **Firebase** | 1GB Firestore | ✅ 匿名+邮箱 | Firestore (NoSQL) | ❌ 需翻墙 | ✅ | ⭐⭐ |
| **LeanCloud** | 1GB | ✅ | 对象存储 | ✅ 国内节点 | ✅ | ⭐⭐⭐ |
| **Vercel KV + Auth.js** | 10K req/day | ✅ | Redis (KV) | ✅ | ❌ 需 Next.js | ⭐⭐ |

### 2.2 推荐结论

**推荐 Supabase**，理由：

1. **免费额度充足** — 500MB 数据库 + 1GB 文件存储 + 50K 月活匿名用户，情侣二人使用绰绰有余
2. **内置完整 Auth** — 支持匿名登录、邮箱密码、OAuth（微信/Apple/Google），无需自建
3. **PostgreSQL + RLS** — 关系型数据库保证数据一致性，行级安全策略天然适配「用户只能看自己数据」
4. **前端直连** — 通过 anon key + RLS 直接从前端调用，无需 BFF 层，适合纯前端项目
5. **Realtime** — 预留能力，未来可实现「另一半打卡实时通知」等互动功能
6. **Storage** — 提供对象存储，可直接用于打卡照片

> ⚠️ **安全风险提示：** anon key 暴露在前端是 Supabase 的设计模式，安全性由 RLS 策略保障。须确保所有表都启用 RLS 并配置正确策略。

---

## 3. 账号体系设计

### 3.1 账号模式：匿名 + 可选绑定

采用「**渐进式账号体系**」，降低用户使用门槛，同时解决跨设备数据丢失问题。

```
┌─────────────────────────────────────────────────────────────┐
│                    用户生命周期状态机                          │
│                                                             │
│  [首次打开 App]                                             │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐    绑定邮箱     ┌─────────────┐           │
│  │  Anonymous  │ ──────────────► │  正式账号   │           │
│  │  (临时身份) │   signUp + 迁移  │  (邮箱+密码)│           │
│  └─────────────┘                 └─────────────┘           │
│       │                                                     │
│       │ 一直不绑定                                          │
│       ▼                                                     │
│  [数据仅存本设备，换设备丢失]                                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 匿名登录流程

1. 用户首次打开 App（无 localStorage 数据、无 Supabase session）
2. 调用 `supabase.auth.signInAnonymously()`，Supabase 自动生成 `anonymous` 用户
3. Session 存于 localStorage（Supabase JS SDK 自动管理），下次打开自动恢复
4. 此时数据仍写 localStorage（已有逻辑），后台异步同步到 Supabase

### 3.3 引导绑定策略

| 触发条件 | 交互 |
|----------|------|
| 匿名用户进入设置页 | 顶部黄条提示：「账号未绑定，数据仅存在本设备」 |
| 匿名用户使用超过 3 天 | 温和弹窗提醒：「绑定邮箱，换设备不丢数据」 |
| 用户点击「绑定邮箱密码」 | 弹出表单：邮箱 + 密码（6位以上） |

### 3.4 邮箱绑定流程

```
用户输入 email + password
        │
        ▼
supabase.auth.signUp({ email, password })
        │
        ▼
Supabase 自动将当前 anonymous 身份合并为新账号
  (anonymous user → authenticated user，user_id 不变)
        │
        ▼
localStorage 中的数据已关联正确 user_id（因为 user_id 未变）
        │
        ▼
更新 profiles 表：display_name, linked_partner_id 等
        │
        ▼
UI 状态更新为已绑定，隐藏黄条提示
```

> 📝 **关键：** Supabase 的 `signUp` 会将当前 anonymous session 转为正式 session，`auth.uid()` 保持不变，因此无需额外数据迁移操作。

### 3.5 情侣关联机制

```sql
-- profiles 表中的 linked_partner_id 用于关联另一半
-- 邀请流程：
-- 1. A 在自己的设置页点击「邀请另一半」→ 生成邀请码（用户ID 短码）
-- 2. B 在设置页输入邀请码 → 双方 profiles.linked_partner_id 互指
-- 3. 关联后可通过 RLS 策略让伴侣查看部分数据（如对方的打卡状态）
```

---

## 4. 数据库 Schema 设计

### 4.1 表总览

| 表名 | 用途 | 对应 localStorage key |
|------|------|----------------------|
| `profiles` | 用户档案（昵称、头像、伴侣关联） | — |
| `checkins` | 打卡记录 | `checkin_history`, `checkin_streak`, `checkin_badges` |
| `wishes` | 愿望池 | `wishes` |
| `favorite_restaurants` | 收藏餐厅 | `favorite_restaurants`, `excluded_restaurants` |
| `lunch_history` | 午餐转盘历史 | `lunch_history` |
| `messages` | 留言板 | `messages` |
| `anniversaries` | 纪念日 | `anniversaries`, `love_anniversary` |
| `relationship_settings` | 情侣共享配置 | `notification_enabled` |
| `offline_queue` | 离线操作队列 | — |

### 4.2 详细 Schema

```sql
-- 用户档案表（扩展 auth.users）
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  linked_partner_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 打卡记录
CREATE TABLE checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL DEFAULT 'quick' CHECK (type IN ('quick', 'photo')),
  photo_url text,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 打卡徽章
CREATE TABLE checkin_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  earned_date date DEFAULT CURRENT_DATE,
  UNIQUE(user_id, badge_type)
);

-- 打卡连续天数（由 trigger 或应用层维护）
CREATE TABLE checkin_streaks (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_checkin_date date,
  updated_at timestamptz DEFAULT now()
);

-- 愿望池
CREATE TABLE wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  type text NOT NULL DEFAULT 'wish' CHECK (type IN ('wish', 'vent', 'idea')),
  fulfilled boolean DEFAULT false,
  fulfilled_by text,          -- 谁完成的
  fulfilled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 收藏餐厅
CREATE TABLE favorite_restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text,
  rating real CHECK (rating >= 0 AND rating <= 5),
  tags text[],
  address text,
  lat double precision,
  lon double precision,
  note text,
  is_excluded boolean DEFAULT false,
  visit_count integer DEFAULT 0,
  last_visited timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 午餐转盘历史
CREATE TABLE lunch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_name text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time text,                   -- '12:00'
  spinning_duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- 留言板
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  mood text,                   // 心情标签
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 纪念日
CREATE TABLE anniversaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  type text DEFAULT 'custom' CHECK (type IN ('love', 'meeting', 'birthday', 'custom')),
  is_recurring boolean DEFAULT true,  -- 是否每年重复
  icon text,
  created_at timestamptz DEFAULT now()
);

-- 关系设置（情侣共享配置）
CREATE TABLE relationship_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  partner_nickname text,
  my_nickname text,
  love_start_date date,
  notification_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- 离线操作队列
CREATE TABLE offline_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation text NOT NULL,     -- 'INSERT' | 'UPDATE' | 'DELETE'
  table_name text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  synced boolean DEFAULT false,
  synced_at timestamptz
);
```

### 4.3 ER 关系图（简）

```
auth.users
    │
    ├── profiles (1:1)
    │       ├── checkins (1:N)
    │       ├── checkin_badges (1:N)
    │       ├── checkin_streaks (1:1)
    │       ├── wishes (1:N)
    │       ├── favorite_restaurants (1:N)
    │       ├── lunch_history (1:N)
    │       ├── messages (1:N)
    │       ├── anniversaries (1:N)
    │       ├── relationship_settings (1:1)
    │       └── offline_queue (1:N)
    │
    └── linked_partner_id → profiles.id (自关联)
```

---

## 5. 数据迁移策略

### 5.1 迁移时机

| 阶段 | 触发条件 | 行为 |
|------|---------|------|
| **首次迁移** | `migration_status !== 'done'` 且检测到 localStorage 有数据 | 将 14 个 KEY 的数据批量 upsert 到 Supabase |
| **双写过渡** | 首次登录后 7 天内 | 写入操作同时写 localStorage + Supabase |
| **纯云端期** | 过渡期结束后 | 读写全部走 Supabase，localStorage 仅作离线缓存 |

### 5.2 迁移流程图

```
App 启动
    │
    ▼
localStorage 有数据？
    │
    ├── 否 → 正常运行，从 Supabase 读
    │
    ├── 是 → migration_status === 'done'？
    │         │
    │         ├── 是 → 正常运行（优先 localStorage 读）
    │         │
    │         └── 否 → 开始迁移：
    │                   │
    │                   ▼
    │               遍历 14 个 STORAGE_KEYS
    │                   │
    │                   ▼
    │               逐表批量 upsert（带 user_id）
    │                   │
    │                   ▼
    │               全部成功？
    │                   │
    │                   ├── 是 → 标记 migration_status = 'done'
    │                   │
    │                   └── 否 → 不标记，下次继续
    │
    ▼
正常运行
```

### 5.3 迁移注意事项

1. **不删除旧 localStorage 数据** — 迁移后保留原始数据作为备份和离线缓存
2. **数据清洗** — 迁移时校验数据格式，修复历史脏数据
3. **冲突处理** — 如果 Supabase 已有该 user_id 的数据，走 `upsert`（冲突时取较新值）
4. **静默迁移** — 迁移过程不阻塞 UI，后台进行，完成后 Toast 提示「数据已同步到云端」

### 5.4 离线处理策略

```
正常模式:
  写操作 → Supabase ✓ → localStorage 缓存 ✓

离线模式 (navigator.onLine === false):
  写操作 → localStorage ✓ + offline_queue ✓
       │
       ▼ (恢复网络后)
  批量同步 offline_queue → Supabase
       │
       ▼
  清空已同步队列
```

---

## 6. API 层设计

### 6.1 核心 Composable：`useDatabase`

采用 Vue 3 Composable 模式封装所有数据操作，对组件层屏蔽 localStorage/Supabase 差异。

```javascript
// useDatabase.js 对外接口（伪代码，不含实现）
export const useDatabase = () => {
  // ── 响应式状态 ──
  const user = ref(null)                  // Supabase 用户对象
  const profile = ref(null)               // profiles 表记录
  const isAuthenticated = computed(() => !!user.value)
  const isAnonymous = computed(() => user.value?.is_anonymous === true)
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)            // 同步状态指示

  // ── Auth 方法 ──
  const signInAnonymously = async () => { /* ... */ }
  const signUpWithEmail = async (email, password) => { /* ... */ }
  const signInWithEmail = async (email, password) => { /* ... */ }
  const signOut = async () => { /* ... */ }
  const linkPartner = async (inviteCode) => { /* ... */ }

  // ── 打卡模块 ──
  const getCheckins = async (filters = {}) => { /* ... */ }
  const addCheckin = async (data) => { /* ... */ }
  const getStreak = async () => { /* ... */ }
  const getBadges = async () => { /* ... */ }

  // ── 愿望池模块 ──
  const getWishes = async () => { /* ... */ }
  const addWish = async (text, type) => { /* ... */ }
  const fulfillWish = async (id) => { /* ... */ }

  // ── 午餐转盘模块 ──
  const getFavorites = async () => { /* ... */ }
  const addFavorite = async (restaurant) => { /* ... */ }
  const toggleExclude = async (id) => { /* ... */ }
  const getLunchHistory = async () => { /* ... */ }
  const addLunchHistory = async (restaurantName) => { /* ... */ }

  // ── 纪念日模块 ──
  const getAnniversaries = async () => { /* ... */ }
  const addAnniversary = async (data) => { /* ... */ }

  // ── 留言板模块 ──
  const getMessages = async () => { /* ... */ }
  const addMessage = async (content) => { /* ... */ }

  // ── 关系设置模块 ──
  const getRelationshipSettings = async () => { /* ... */ }
  const updateRelationshipSettings = async (data) => { /* ... */ }

  // ── 迁移 & 同步 ──
  const runMigration = async () => { /* ... */ }
  const syncOfflineQueue = async () => { /* ... */ }

  return {
    // 状态
    user, profile, isAuthenticated, isAnonymous, isOnline, isSyncing,
    // Auth
    signInAnonymously, signUpWithEmail, signInWithEmail, signOut, linkPartner,
    // 打卡
    getCheckins, addCheckin, getStreak, getBadges,
    // 愿望池
    getWishes, addWish, fulfillWish,
    // 午餐
    getFavorites, addFavorite, toggleExclude, getLunchHistory, addLunchHistory,
    // 纪念日
    getAnniversaries, addAnniversary,
    // 留言板
    getMessages, addMessage,
    // 关系
    getRelationshipSettings, updateRelationshipSettings,
    // 同步
    runMigration, syncOfflineQueue,
  }
}
```

### 6.2 新旧接口映射

| 旧 composable (useStorage.js) | 新 composable (useDatabase.js) | 变更说明 |
|-------------------------------|-------------------------------|---------|
| `getCheckinHistory()` | `getCheckins()` | 数据源从 localStorage → Supabase |
| `addCheckinRecord(data)` | `addCheckin(data)` | 增加双写逻辑 |
| `getWishes()` | `getWishes()` | 接口签名不变，内部重写 |
| `getRestaurants()` | `getFavorites()` | 语义更准确 |
| `getLoveAnniversary()` | `getAnniversaries()` | 支持多个纪念日 |
| `setAdminPassword(pwd)` | 移除 | 无后端管理员概念，由 RLS 替代 |

### 6.3 Supabase 客户端初始化

```javascript
// lib/supabase.js（伪代码）
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,       // session 存 localStorage
    detectSessionInUrl: true,
  },
})
```

---

## 7. 安全策略：Row Level Security (RLS)

### 7.1 RLS 设计原则

1. **默认拒绝** — 未配置 RLS 的表不允许任何操作
2. **最小权限** — 用户只能访问自己 `user_id` 的数据
3. **伴侣可读** — 关联的伴侣可读对方部分数据（如打卡状态、纪念日）

### 7.2 各表 RLS 策略

```sql
-- ── profiles ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile_select"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR auth.uid() = linked_partner_id);

CREATE POLICY "own_profile_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── checkins ──
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_checkins_select"
  ON checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own_checkins_modify"
  ON checkins FOR ALL
  USING (auth.uid() = user_id);

-- ── checkin_badges ──
ALTER TABLE checkin_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_badges_select"
  ON checkin_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own_badges_insert"
  ON checkin_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── checkin_streaks ──
ALTER TABLE checkin_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_streak"
  ON checkin_streaks FOR ALL
  USING (auth.uid() = user_id);

-- ── wishes ──
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_wishes_select"
  ON wishes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own_wishes_modify"
  ON wishes FOR ALL
  USING (auth.uid() = user_id);

-- ── favorite_restaurants ──
ALTER TABLE favorite_restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_restaurants_select"
  ON favorite_restaurants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own_restaurants_modify"
  ON favorite_restaurants FOR ALL
  USING (auth.uid() = user_id);

-- ── lunch_history ──
ALTER TABLE lunch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_lunch_select"
  ON lunch_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own_lunch_insert"
  ON lunch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── messages ──
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_messages_select"
  ON messages FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT linked_partner_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "own_messages_modify"
  ON messages FOR ALL
  USING (auth.uid() = user_id);

-- ── anniversaries ──
ALTER TABLE anniversaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_anniversaries_select"
  ON anniversaries FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT linked_partner_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "own_anniversaries_modify"
  ON anniversaries FOR ALL
  USING (auth.uid() = user_id);

-- ── relationship_settings ──
ALTER TABLE relationship_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_relation_select"
  ON relationship_settings FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT linked_partner_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "own_relation_modify"
  ON relationship_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ── offline_queue ──
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_queue"
  ON offline_queue FOR ALL
  USING (auth.uid() = user_id);
```

### 7.3 安全审计 Checklist

- [ ] 所有业务表已启用 `ENABLE ROW LEVEL SECURITY`
- [ ] 每个表至少配置 SELECT + 写操作策略
- [ ] anon key 仅能执行 RLS 允许的操作
- [ ] 生产环境关闭 Supabase Dashboard 的公共访问
- [ ] 定期审查 RLS 策略（Schema 变更后同步更新）

---

## 8. 部署与环境配置

### 8.1 环境变量

```bash
# .env（开发 / 构建时注入）
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8.2 Supabase 项目配置

| 配置项 | 建议值 |
|--------|--------|
| 项目区域 | 选择 `Singapore` 或 `Tokyo`（兼顾国内与国际访问） |
| Auth Providers | 开启 Email；预留 Google/Apple（可选） |
| Token Expiry | 默认（3600s），可延长至 86400s（24h）减少重登录频率 |
| Refresh Token | 开启自动刷新 |
| Session Persistence | 开启（存 localStorage，刷新不丢失） |
| Email Confirm | 建议开启，防止滥用注册 |

### 8.3 Supabase 免费额度

| 资源 | 免费上限 | 是否够用 |
|------|---------|---------|
| 数据库容量 | 500MB | ✅ 足够（文本数据极小） |
| 文件存储 | 1GB | ✅ 只存打卡缩略图绰绰有余 |
| 月请求数 | 500K | ✅ 两人使用 |
| 匿名用户 | 50K/月 | ✅ |
| Realtime 连接 | 200 并发 | ✅ |

---

## 9. 实施路线图

### 9.1 Sprint 拆解

```
Sprint N ─────── 基础设施搭建 ──────────────
  │ • 创建 Supabase 项目 + 配置 Auth
  │ • 创建所有数据表 + 索引
  │ • 配置全部 RLS 策略
  │ • 搭建 useDatabase composable 骨架（空方法 + 状态管理）
  │
  ▼
Sprint N+1 ───── 双写与离线 ──────────────
  │ • 实现 localStorage 双写（写两边，读本地优先）
  │ • 实现 offline_queue 机制
  │ • 网络状态监听与自动同步
  │ • 双写期间的错误处理（Supabase 写入失败降级）
  │
  ▼
Sprint N+2 ───── 账号绑定与迁移 ───────────
  │ • 匿名登录对接
  │ • 邮箱绑定 UI + 流程
  │ • localStorage → Supabase 数据迁移脚本
  │ • 情侣关联功能（邀请码）
  │ • 关系设置页面迁移
  │
  ▼
Sprint N+3 ───── 文件存储集成 ─────────────
  │ • Supabase Storage 配置
  │ • 拍照打卡的照片上传
  │ • 照片压缩（前端压缩后再传）
  │ • 图片加载优化（CDN 缓存 + lazy load）
  │
  ▼
Sprint N+4 ───── 收尾与清理 ───────────────
  │ • 稳定运行一段时间（无 bug）后
  │ • 移除纯 localStorage 写入分支
  │ • 移除双写逻辑，统一走 Supabase
  │ • 保留 localStorage 作为离线降级缓存
  │ • 移除 migration_status 相关迁移代码
```

### 9.2 关键里程碑

| 里程碑 | 验收条件 |
|--------|---------|
| **M1 — 可登录流失常使用** | 不绑定邮箱也能用，localStorage 兜底 |
| **M2 — 跨设备数据同步** | 绑定邮箱后换手机数据自动恢复 |
| **M3 — 情侣关联** | 双方数据可通过伴侣视角查看 |
| **M4 — 完全云端化** | 所有读写走 Supabase，无 localStorage 写入路径 |

---

## 10. 风险与应对

| 风险 | 影响 | 应对策略 |
|------|------|---------|
| Supabase 免费额度超限 | 服务不可用 | 设置用量告警（80% 阈值）；预留降级到 localStorage 模式 |
| anon key 泄露 + RLS 配置错误 | 数据写入安全问题 | RLS 严格限制写操作只允许 owned rows；定期审计策略 |
| 国内访问不稳定 | 加载慢/超时 | Supabase CDN 加速；考虑 LeanCloud 作为备选方案 |
| Email 确认邮件进垃圾箱 | 用户无法完成绑定 | 提供「未收到邮件」提示；支持 resend |
| 离线数据冲突 | 双向写入顺序错乱 | 使用时间戳 + last-wins 策略；冲突时提示用户 |
| 照片存储超限 | 上传失败 | 前端压缩至 800KB 以下；存储超限时提示清理旧照片 |

---

## 11. 附录

### 11.1 关键依赖

| 依赖 | 用途 | 安装 |
|------|------|------|
| `@supabase/supabase-js` | Supabase JS SDK | `npm install @supabase/supabase-js` |
| `vue` | 框架 | 已有 |
| `vite` | 构建工具 | 已有 |

### 11.2 参考资料

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 指南](https://supabase.com/docs/guides/auth)
- [Row Level Security 详解](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage 指南](https://supabase.com/docs/guides/storage)
- [Vue 3 Composables 最佳实践](https://vuejs.org/guide/reusability/composables.html)
- [PWA 离线最佳实践](https://web.dev/offline-cookbook/)

---

## 12. 决策记录 (ADR)

### ADR-001：为什么选 Supabase 而非 Firebase？

**状态：** 已接受

**背景：** 两者都是 BaaS 平台，都提供 Auth + DB + Storage。

**决策：** 选择 Supabase。

**原因：**
1. Firebase 在中国大陆访问不稳定，需翻墙，影响用户体验
2. Supabase 基于 PostgreSQL，关系型数据模型与现有 localStorage 数据结构更契合
3. Supabase 的 RLS 策略比 Firebase Security Rules 更直观（SQL 语法 vs 自定义 DSL）
4. Supabase 开源，可自部署，迁移成本低

### ADR-002：为什么保留 localStorage 双写过渡而非一步到位？

**状态：** 已接受

**背景：** 迁移期间用户可能离线且频繁切换网络。

**决策：** 保留 7 天双写过渡期。

**原因：**
1. 迁移后立即切纯云端，离线场景用户数据丢失，体验差
2. localStorage 作为离线降级兜底，保证基础可用性
3. 过渡期可暴露潜在同步 bug，正式上线前修复
4. 双写实现简单（非侵入式），移除也容易

### ADR-003：离线队列选择自建表而非 IndexedDB

**状态：** 已接受

**背景：** 需要持久化离线期间的写操作，确保换设备后不丢失。

**决策：** 使用 Supabase `offline_queue` 表存储离线操作。

**原因：**
1. 离线期间 Supabase 不可用，无法写 `offline_queue`
2. 所以实际需要两段：离线时暂存 localStorage（队列），恢复网络后再入 Supabase 或直接执行
3. Supabase `offline_queue` 表主要用于服务端幂等校验和审计
4. 客户端离线队列由 useDatabase composable 内部管理（内存 + localStorage）

---

*文档结束 — 待评审后进入开发 Sprint N。*
