# 餐厅功能升级 + 后台数据库 — 技术调研文档

> **版本**: v1.0  
> **日期**: 2026-07-09  
> **作者**: 技术调研  
> **状态**: 调研完成，待评审  
> **关联项目**: love-app（Vue3 + Vite + PWA + Vant4）

---

## 目录

1. [背景与目标](#1-背景与目标)
2. [现状分析](#2-现状分析)
3. [A. 位置获取方案](#a-位置获取方案)
4. [B. 餐厅数据来源](#b-餐厅数据来源)
5. [C. 前后端架构评估](#c-前后端架构评估)
6. [D. 数据结构演进](#d-数据结构演进)
7. [E. 隐私与合规](#e-隐私与合规)
8. [F. 推荐方案](#f-推荐方案)
9. [风险与缓解](#10-风险与缓解)
10. [后续步骤](#11-后续步骤)

---

## 1. 背景与目标

### 1.1 项目背景

love-app 是一款面向情侣的 PWA 小工具，当前为纯前端静态应用，所有数据存于 localStorage。其中的「午餐大转盘」功能使用硬编码的 10 个示例餐厅，缺乏真实位置感知能力。

### 1.2 本轮需求

| # | 需求 | 优先级 |
|---|------|--------|
| R1 | 获取用户位置（城市/坐标） | P0 |
| R2 | 用户新增/收藏喜欢的餐厅 | P0 |
| R3 | 基于位置的真实餐厅推荐（转圈用） | P1 |
| R4 | 引入后台数据库，替代纯 localStorage | P1 |

### 1.3 约束条件

- **零成本优先**：项目为爱发电，无商业收入
- **低日活**：仅情侣二人使用，并发极低
- **PWA 场景**：需考虑离线/弱网体验
- **国内用户**：所有服务需在国内可用
- **渐进迁移**：不能破坏现有功能与数据

---

## 2. 现状分析

### 2.1 现有餐厅数据流

```
┌─────────────────────────────────────────────────────┐
│  dataStore.js (reactive state)                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ restaurants: [                                │  │
│  │   { name, emoji, distance, rating, tags },   │  │
│  │   ...10 个硬编码示例                          │  │
│  │ ]                                             │  │
│  └───────────────────────────────────────────────┘  │
│                         │                           │
│                         ▼                           │
│  useStorage.js (localStorage)                       │
│  KEY: 'restaurants' / 'excluded_restaurants'        │
│       'favorite_restaurants'                        │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Lunch.vue       │
              │  LunchWheel.vue  │
              │  (转圈逻辑)       │
              └──────────────────┘
```

### 2.2 现有数据结构

```javascript
// 当前餐厅对象
{
  name: '饺子馆',        // 名称
  emoji: '🥟',           // 表情图标
  distance: '0.8km',     // 距离（硬编码字符串）
  rating: 4.5,           // 评分
  tags: ['面食', '实惠']  // 标签数组
}
```

**问题**：
- `distance` 是硬编码字符串，非真实计算
- 无经纬度信息，无法做位置排序
- 无唯一 ID，名称即标识，易冲突
- 无数据来源标记，无法区分用户自建 vs POI 导入

### 2.3 现有存储层

| 存储方式 | 用途 | 容量限制 |
|----------|------|----------|
| localStorage | 餐厅列表、收藏、排除、打卡历史等 | ~5MB |
| IndexedDB | 照片存储（base64） | 较大，受磁盘限制 |

**localStorage 瓶颈**：
- 结构化查询能力弱（无索引、无过滤）
- 容量有限，照片等大数据已分离到 IndexedDB
- 无法跨设备同步
- 清除缓存即丢失

---

## A. 位置获取方案

### A.1 方案对比

| 方案 | 精度 | 成本 | 隐私 | 国内可用 | 离线 | 推荐度 |
|------|------|------|------|----------|------|--------|
| **高德 IP 定位** | 城市级（1-5km） | 免费 30万次/天 | 低风险 | ✅ | ❌ | ⭐⭐⭐⭐⭐ |
| **浏览器 Geolocation API** | 高精度（5-50m） | 免费 | 高风险（需授权） | ✅ | ❌ | ⭐⭐⭐ |
| **高德 GPS 定位** | 高精度 | 免费 | 高风险 | ✅ | ❌ | ⭐⭐⭐ |
| **第三方 IP 库**（ip2region 等） | 省级/城市 | 免费 | 低风险 | ✅ | ✅（本地库） | ⭐⭐⭐⭐ |
| **用户手动选择城市** | 城市级 | 免费 | 无风险 | ✅ | ✅ | ⭐⭐⭐⭐ |

### A.2 详细分析

#### 高德 IP 定位（推荐首选）

- **API**: `https://restapi.amap.com/v3/ip?key=<KEY>`
- **免费额度**: 30 万次/天（日活 2 人，绰绰有余）
- **返回**: 省份、城市、矩形边界（rectangle）
- **精度**: 城市级，IP 定位通常精确到区/县
- **优点**: 无需用户授权、调用简单、免费额度充足
- **缺点**: 依赖网络、VPN/代理会导致定位偏移

#### 浏览器 Geolocation API

- **调用**: `navigator.geolocation.getCurrentPosition()`
- **精度**: 5-50m（GPS）或 WiFi 定位
- **优点**: 精度最高
- **缺点**: 
  - 需用户明确授权（弹窗）
  - iOS Safari 要求 HTTPS
  - 用户拒绝后需降级处理
  - 室内可能无信号

#### 高德 Web 定位（GPS + IP 融合）

- **API**: `https://restapi.amap.com/v5/ip?key=<KEY>&type=4`
- **v5 版本**: 支持 IP + GPS 融合定位
- **优点**: 自动降级（GPS 失败回退 IP）
- **缺点**: 仍需用户授权 GPS

#### 本地 IP 库（ip2region）

- **原理**: 离线 IP 地址库，本地查询
- **精度**: 城市级（部分仅省级）
- **优点**: 完全离线、零网络依赖
- **缺点**: 库文件 ~5MB，需定期更新

### A.3 推荐策略

```
┌─────────────────────────────────────────────────────────┐
│                    位置获取策略                          │
│                                                         │
│  1. 首次加载 → 高德 IP 定位（城市级，无授权）           │
│     ↓ 成功                                              │
│     存储城市信息到 sessionStorage                       │
│     ↓                                                   │
│  2. 用户点击"精准定位" → 尝试 Geolocation API           │
│     ↓ 授权成功 → 获取经纬度 → 逆地理编码得详细地址      │
│     ↓ 拒绝/失败 → 保持 IP 定位结果                      │
│                                                         │
│  3. 用户可手动选择城市（覆盖自动定位）                   │
│                                                         │
│  降级链：GPS → IP 定位 → 手动选择 → 默认城市            │
└─────────────────────────────────────────────────────────┘
```

---

## B. 餐厅数据来源

### B.1 方案对比

| 方案 | 数据质量 | 成本 | 国内可用 | 免费额度 | 推荐度 |
|------|----------|------|----------|----------|--------|
| **用户自建库** | 取决于用户 | 免费 | ✅ | 无限 | ⭐⭐⭐⭐⭐ |
| **高德 POI 搜索** | 高 | 免费额度内免费 | ✅ | 30万次/天 | ⭐⭐⭐⭐ |
| **腾讯位置服务** | 高 | 免费额度内免费 | ✅ | 5千次/天 | ⭐⭐⭐ |
| **百度地图 POI** | 高 | 免费额度内免费 | ✅ | 2千次/天 | ⭐⭐⭐ |
| **Google Places** | 极高 | 需翻墙 | ❌ | $200/月免费 | ⭐ |
| **大众点评开放平台** | 高 | 商业合作 | ✅ | 严格限制 | ⭐ |
| **美团开放平台** | 高 | 收费 | ✅ | 无免费 | ⭐ |

### B.2 详细分析

#### 高德 POI 搜索 API（推荐）

- **API**: `https://restapi.amap.com/v3/place/text?key=<KEY>&keywords=餐厅&city=<城市>&offset=20`
- **免费额度**: 30 万次/天（共享配额，IP 定位 + POI 搜索共用）
- **返回**: 名称、地址、经纬度、电话、评分、类型等
- **优点**: 
  - 数据覆盖全国，含小城市
  - 免费额度对低日活项目极充裕
  - 与 IP 定位同平台，key 统一
- **缺点**: 
  - API Key 暴露风险（需后端代理）
  - 单次返回最多 20 条，分页最多 100 条

#### 腾讯位置服务

- **API**: `https://apis.map.qq.com/ws/place/v1/search?keyword=餐厅&boundary=region(<城市>,0)&key=<KEY>`
- **免费额度**: 5 千次/天（共享配额）
- **优点**: 数据质量与高德相当
- **缺点**: 免费额度较少，共享配额紧张

#### 用户自建库（核心方案）

- **原理**: 用户手动添加喜欢的餐厅，存储到数据库
- **优点**: 
  - 零成本、零依赖
  - 数据最贴合用户真实偏好
  - 无 API Key 暴露风险
- **缺点**: 
  - 初始数据为空，需用户积累
  - 缺少评分、距离等客观数据

### B.3 推荐策略

```
┌─────────────────────────────────────────────────────────┐
│                  餐厅数据来源策略                        │
│                                                         │
│  主数据源：用户自建库（零成本，最贴合偏好）              │
│     ↓                                                   │
│  补充数据源：高德 POI 搜索（按城市拉取周边餐厅）         │
│     ↓                                                   │
│  兜底：硬编码示例（首次使用无数据时展示）                │
│                                                         │
│  数据融合：                                              │
│  - 用户自建餐厅标记 source: 'user'                       │
│  - POI 导入餐厅标记 source: 'amap'                       │
│  - 用户可对 POI 结果"收藏"→ 转为自建                    │
└─────────────────────────────────────────────────────────┘
```

---

## C. 前后端架构评估

### C.1 方案对比

| 方案 | 成本 | 复杂度 | 可扩展性 | 维护成本 | 数据控制 | 推荐度 |
|------|------|--------|----------|----------|----------|--------|
| **纯前端 + API 直调** | 零 | 极低 | 差 | 零 | 差 | ⭐⭐ |
| **Supabase（BaaS）** | 免费 | 低 | 好 | 低 | 好 | ⭐⭐⭐⭐⭐ |
| **Firebase** | 免费 | 低 | 好 | 低 | 好 | ⭐⭐⭐ |
| **LeanCloud** | 免费 | 低 | 好 | 低 | 好 | ⭐⭐⭐⭐ |
| **CloudBase（腾讯）** | 免费 | 低 | 好 | 低 | 好 | ⭐⭐⭐⭐ |
| **自建 Node.js 后端** | 服务器成本 | 高 | 最好 | 高 | 最好 | ⭐⭐ |
| **Serverless（CF Workers）** | 免费 | 中 | 好 | 中 | 好 | ⭐⭐⭐⭐ |

### C.2 详细分析

#### 方案 1：纯前端 + 第三方 API 直调

```
┌──────────────┐     ┌─────────────────┐
│   love-app   │ ──→ │  高德 POI API   │
│  (纯前端)    │     │  (Key 暴露!)    │
└──────────────┘     └─────────────────┘
```

- **优点**: 零后端成本、部署简单
- **致命缺点**: 
  - API Key 暴露于前端代码，可被恶意刷量
  - 高德 Key 若被盗用，30 万次/天额度可短时间内耗尽
  - 无法做用户认证、数据隔离
- **结论**: 不推荐（Key 暴露风险不可接受）

#### 方案 2：Supabase（强烈推荐）

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   love-app   │ ──→ │  Supabase       │ ──→ │  PostgreSQL     │
│  (前端)      │     │  (REST/Realtime)│     │  (500MB 免费)   │
└──────────────┘     └─────────────────┘     └─────────────────┘
                            │
                            ▼
                     ┌─────────────────┐
                     │  Supabase Edge   │
                     │  Functions       │ ← 高德 API Key 存这里
                     │  (代理 POI 请求) │
                     └─────────────────┘
```

- **免费额度**: 
  - 500MB 数据库
  - 1GB 文件存储
  - 50MB/月 带宽
  - 50K 月活用户
  - 无限 API 请求
- **优点**: 
  - 开箱即用的 REST API + Realtime
  - 内置 Auth（可为情侣设账号）
  - Edge Functions 可代理高德 API（Key 不暴露）
  - 国内有节点（或可用海外节点）
  - 与 Vue/React 集成极佳
- **缺点**: 
  - 海外节点国内访问可能不稳定
  - 需评估网络延迟

#### 方案 3：LeanCloud（国内 BaaS）

- **免费额度**: 
  - 1GB 数据存储
  - 10GB 文件存储
  - 300 次/秒 请求（共享）
- **优点**: 
  - 国内服务器，访问稳定
  - 与微信小程序生态兼容
  - 有 JavaScript SDK
- **缺点**: 
  - 免费版有 LeanCloud 品牌标识
  - 功能较 Supabase 少（无 Realtime）

#### 方案 4：CloudBase（腾讯）

- **免费额度**: 
  - 5GB 数据库
  - 50GB 文件存储
  - 200 万次/月 云函数调用
- **优点**: 
  - 国内服务器
  - 与微信生态深度集成
  - 云函数可代理高德 API
- **缺点**: 
  - 腾讯云绑定
  - 文档/社区不如 Supabase 活跃

#### 方案 5：Serverless（Cloudflare Workers + D1/KV）

```
┌──────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   love-app   │ ──→ │  Cloudflare Workers │ ──→ │  D1 (SQLite)    │
│  (前端)      │     │  (代理 + API)       │     │  KV (缓存)      │
└──────────────┘     └─────────────────────┘     └─────────────────┘
```

- **免费额度**: 
  - 10 万次/天 Workers 请求
  - 5GB D1 存储
  - 无限 KV 读取
- **优点**: 
  - 零运维
  - 全球 CDN 加速
  - PWA 友好（Service Worker 同生态）
- **缺点**: 
  - D1 功能较 PostgreSQL 弱
  - 国内访问 Cloudflare 不稳定
  - 学习曲线较陡

#### 方案 6：自建最小后端

```
┌──────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   love-app   │ ──→ │  Node.js + Express  │ ──→ │  SQLite/MySQL   │
│  (前端)      │     │  (VPS/树莓派)       │     │                 │
└──────────────┘     └─────────────────────┘     └─────────────────┘
```

- **成本**: VPS 约 ¥30-50/月 或 树莓派一次性投入
- **优点**: 
  - 完全控制
  - 无供应商锁定
  - 可部署在内网（树莓派）
- **缺点**: 
  - 需维护服务器、SSL、备份
  - 需处理安全更新
  - 需公网 IP 或内网穿透

### C.3 架构推荐

```
┌─────────────────────────────────────────────────────────────────┐
│                        推荐架构                                  │
│                                                                 │
│  ┌─────────────┐                                                │
│  │  love-app   │  (Vue3 PWA，前端)                              │
│  │  前端代码   │                                                │
│  └──────┬──────┘                                                │
│         │                                                       │
│         │  HTTPS (REST API)                                     │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────┐                │
│  │  Supabase (BaaS)                            │                │
│  │  ├── PostgreSQL (500MB)                     │                │
│  │  │   ├── users (用户表)                     │                │
│  │  │   ├── restaurants (餐厅表)               │                │
│  │  │   ├── favorites (收藏表)                 │                │
│  │  │   ├── checkin_history (打卡历史)         │                │
│  │  │   └── lunch_history (转圈历史)           │                │
│  │  ├── Auth (JWT 认证)                        │                │
│  │  ├── Storage (照片/图片)                    │                │
│  │  └── Edge Functions (高德 API 代理)         │                │
│  │       └── /api/nearby-restaurants           │                │
│  │           ├── 接收: lat, lng, radius        │                │
│  │           ├── 调用高德 POI API (Key 存环境变量) │             │
│  │           └── 返回: 标准化餐厅列表           │                │
│  └─────────────────────────────────────────────┘                │
│                                                                 │
│  备选（国内访问不稳定时）:                                       │
│  ├── LeanCloud / CloudBase（国内 BaaS）                         │
│  └── Cloudflare Workers + D1（Serverless）                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## D. 数据结构演进

### D.1 目标数据模型

```sql
-- 用户表（Supabase Auth 内置，此处为扩展字段）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nickname TEXT,
  avatar_url TEXT,
  partner_id UUID REFERENCES profiles(id),  -- 关联伴侣
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 餐厅表
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🍽️',
  address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  rating DECIMAL(3, 2),
  price_level SMALLINT,  -- 1-4，人均消费等级
  tags TEXT[],           -- PostgreSQL 数组类型
  phone TEXT,
  source TEXT DEFAULT 'user',  -- 'user' | 'amap' | 'seed'
  amap_poi_id TEXT,            -- 高德 POI ID（如有）
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 收藏表
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
  note TEXT,  -- 用户备注（如"第一次约会的地方"）
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- 转圈历史表
CREATE TABLE lunch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  restaurant_id UUID REFERENCES restaurants(id),
  restaurant_name TEXT,  -- 冗余存储，防止餐厅被删后丢失历史
  date DATE NOT NULL,
  time TIME,
  is_excluded BOOLEAN DEFAULT false,  -- 是否被排除
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 打卡历史表（迁移自 localStorage）
CREATE TABLE checkin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  type TEXT DEFAULT 'quick',  -- 'quick' | 'photo'
  photo_url TEXT,  -- 照片存 Supabase Storage，此处存 URL
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 愿望表（迁移自 localStorage）
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  text TEXT NOT NULL,
  type TEXT DEFAULT 'wish',  -- 'wish' | 'vent'
  fulfilled BOOLEAN DEFAULT false,
  fulfilled_by TEXT,
  fulfilled_emoji TEXT DEFAULT '💖',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_restaurants_location ON restaurants USING GIST (
  ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_restaurants_source ON restaurants(source);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_lunch_history_user_date ON lunch_history(user_id, date);
CREATE INDEX idx_checkin_user_date ON checkin_history(user_id, date);
```

### D.2 现有数据结构映射

| 现有字段 | 目标字段 | 变更说明 |
|----------|----------|----------|
| `name` | `name` | 不变 |
| `emoji` | `emoji` | 不变 |
| `distance` (硬编码) | `latitude` + `longitude` | 改为真实坐标，前端计算距离 |
| `rating` | `rating` | 不变 |
| `tags` | `tags` | 数组 → PostgreSQL 数组 |
| — | `id` | 新增 UUID 主键 |
| — | `address` | 新增地址 |
| — | `source` | 新增数据来源标记 |
| — | `amap_poi_id` | 新增高德 POI 关联 |
| — | `created_by` | 新增创建者 |

### D.3 迁移策略

```
┌─────────────────────────────────────────────────────────────────┐
│                     渐进式迁移策略                               │
│                                                                 │
│  Phase 1: 双写（新增数据走 DB，旧数据保留本地）                  │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │  Frontend    │ ──┬──→  │  Supabase    │  ← 新增操作          │
│  │              │   │     └──────────────┘                      │
│  │              │   └──→  │  localStorage │  ← 历史数据只读     │
│  └──────────────┘         └──────────────┘                      │
│                                                                 │
│  Phase 2: 后台迁移（可选）                                       │
│  - 用户可选择"同步历史数据到云端"                                │
│  - 一次性将 localStorage 数据导入 Supabase                      │
│  - 导入后标记为 source: 'migrated'                              │
│                                                                 │
│  Phase 3: 完全切换（未来）                                       │
│  - 所有读写走 Supabase                                          │
│  - localStorage 仅作离线缓存                                    │
│  - 清除旧 localStorage 数据                                     │
└─────────────────────────────────────────────────────────────────┘
```

### D.4 距离计算

```sql
-- 使用 PostGIS 或 earthdistance 扩展计算距离
-- 示例：查找用户 5km 内的餐厅
SELECT *, earth_distance(
  ll_to_earth(latitude, longitude),
  ll_to_earth(:user_lat, :user_lng)
) AS distance_m
FROM restaurants
WHERE earth_box(ll_to_earth(:user_lat, :user_lng), 5000) @> ll_to_earth(latitude, longitude)
ORDER BY distance_m ASC;
```

```javascript
// 前端降级方案（无 PostGIS 时）
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // 距离（米）
}
```

---

## E. 隐私与合规

### E.1 《个人信息保护法》（PIPL）合规要点

| 条款 | 要求 | 本项目应对 |
|------|------|------------|
| **第 13 条** | 处理个人信息需取得用户同意 | 位置获取前弹窗说明用途 |
| **第 14 条** | 敏感个人信息需单独同意 | 精确位置（GPS）需单独授权 |
| **第 17 条** | 需公开处理规则 | 隐私政策页面 |
| **第 22 条** | 跨境传输需安全评估 | 若用海外 Supabase 节点需评估 |
| **第 47 条** | 删除权 | 提供数据导出/删除功能 |

### E.2 隐私政策必备内容

1. **收集的信息类型**：位置（城市级）、用户添加的餐厅、打卡记录
2. **收集目的**：提供基于位置的餐厅推荐、记录用餐历史
3. **信息存储**：数据存储在 Supabase（服务器位于 [地区]）
4. **信息共享**：不与第三方共享（高德 POI 搜索仅用于获取公开数据）
5. **用户权利**：查看、导出、删除个人数据
6. **位置权限**：说明 IP 定位（自动）与 GPS 定位（需授权）的区别

### E.3 合规建议

- **最小必要原则**：仅收集城市级位置，不收集精确 GPS（除非用户主动授权）
- **数据本地化**：优先选择国内节点（Supabase 海外节点需评估，或改用 LeanCloud/CloudBase）
- **用户控制**：提供"清除所有数据"按钮
- **透明告知**：首次使用时弹窗说明数据收集范围

### E.4 GDPR（如有海外用户）

- 若用户可能在海外使用，需额外遵守 GDPR
- 核心要求：明确同意、数据可携带权、被遗忘权
- 建议：初期仅服务国内用户，暂不考虑 GDPR

---

## F. 推荐方案

### F.1 总体推荐

| 维度 | 推荐方案 | 备选 |
|------|----------|------|
| **位置获取** | 高德 IP 定位（城市级） | 用户手动选择城市 |
| **位置升级** | 用户授权后启用 Geolocation API | — |
| **餐厅数据** | 用户自建库 + 高德 POI 补全 | 纯用户自建 |
| **后端架构** | Supabase（BaaS） | LeanCloud / CloudBase |
| **API 代理** | Supabase Edge Functions | 自建云函数 |
| **数据存储** | PostgreSQL（Supabase） | LeanCloud 数据存储 |
| **迁移策略** | 渐进式（新走 DB，旧可选迁移） | — |

### F.2 推荐架构详述

```
┌─────────────────────────────────────────────────────────────────────┐
│                         推荐技术栈                                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Frontend (PWA)                                               │  │
│  │  ├── Vue 3 + Vite + Vant 4                                    │  │
│  │  ├── @supabase/supabase-js (官方 SDK)                         │  │
│  │  ├── 高德 IP 定位 (直接调用，无需 Key)                         │  │
│  │  │   └── https://restapi.amap.com/v3/ip?key=***               │  │
│  │  │       ↑ Key 存 Supabase Edge Function 环境变量             │  │
│  │  └── Geolocation API (用户授权后)                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              │ HTTPS                                │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Supabase                                                      │  │
│  │  ├── Auth (JWT)                                                │  │
│  │  │   └── 情侣二人各一个账号                                    │  │
│  │  ├── PostgreSQL                                                │  │
│  │  │   ├── restaurants (餐厅表)                                  │  │
│  │  │   ├── favorites (收藏表)                                    │  │
│  │  │   ├── lunch_history (转圈历史)                              │  │
│  │  │   ├── checkin_history (打卡历史)                            │  │
│  │  │   └── wishes (愿望表)                                       │  │
│  │  ├── Storage (照片)                                            │  │
│  │  └── Edge Functions                                            │  │
│  │      └── /api/nearby                                           │  │
│  │          ├── 输入: lat, lng, radius, keyword                   │  │
│  │          ├── 调用高德 POI API (Key 存 Deno env)                │  │
│  │          └── 输出: 标准化餐厅列表                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  成本估算:                                                           │
│  - Supabase 免费档: ¥0/月                                           │
│  - 高德 API: ¥0/月（30万次/天额度内）                               │
│  - 域名（可选）: ¥50-100/年                                          │
│  - 总计: ¥0-100/年                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### F.3 实施路线图

```
Phase 1 (1-2 周): 基础架构搭建
├── 创建 Supabase 项目
├── 设计并创建数据库表结构
├── 配置 Auth（情侣账号）
├── 实现 Edge Function 代理高德 POI API
└── 前端集成 Supabase SDK

Phase 2 (1 周): 位置获取 + 餐厅搜索
├── 实现高德 IP 定位
├── 实现"附近餐厅"搜索（调用 Edge Function）
├── 实现用户自建餐厅 CRUD
└── 实现收藏功能

Phase 3 (1 周): 转圈功能升级
├── 转圈逻辑接入真实餐厅数据
├── 距离计算与排序
├── 排除/收藏功能对接 DB
└── 历史记录迁移

Phase 4 (可选): 数据迁移
├── 提供"同步历史数据"功能
├── 旧 localStorage 数据导入
└── 离线缓存策略
```

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Supabase 海外节点国内访问慢/不稳定 | 中 | 高 | 备选 LeanCloud/CloudBase；或自建后端 |
| 高德 API Key 被盗用 | 中 | 中 | Key 存 Edge Function 环境变量；设置调用额度告警 |
| 用户拒绝位置授权 | 高 | 低 | 降级到 IP 定位或手动选择城市 |
| localStorage 数据迁移失败 | 低 | 中 | 双写阶段保留本地数据；迁移前备份 |
| 数据库容量超限 | 低 | 中 | 500MB 对情侣场景极充裕；定期清理旧照片 |
| 隐私合规风险 | 低 | 高 | 编写隐私政策；最小必要原则；用户可控删除 |

---

## 11. 后续步骤

1. **评审本调研文档** — 确认推荐方案
2. **创建 Supabase 项目** — 注册并初始化
3. **编写 PRD** — 基于本调研产出产品需求文档
4. **编写 DESIGN 文档** — 详细设计（API 接口、前端组件、状态管理）
5. **实施 Phase 1** — 基础架构搭建

---

## 附录

### A. 高德 API 参考

- IP 定位: `https://restapi.amap.com/v3/ip?key=<KEY>`
- POI 搜索: `https://restapi.amap.com/v3/place/text?key=<KEY>&keywords=餐厅&city=北京`
- 逆地理编码: `https://restapi.amap.com/v3/geocode/regeo?key=<KEY>&location=116.397428,39.90923`

### B. Supabase 参考

- 官网: https://supabase.com
- JS SDK: https://supabase.com/docs/reference/javascript/start
- Edge Functions: https://supabase.com/docs/guides/functions
- 自托管: https://supabase.com/docs/guides/self-hosting

### C. 相关项目文件

- `src/stores/dataStore.js` — 当前数据层
- `src/composables/useStorage.js` — 当前存储层
- `src/views/Lunch.vue` — 转圈页面
- `src/components/LunchWheel.vue` — 转盘组件
