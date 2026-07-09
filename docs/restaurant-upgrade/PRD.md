# 餐厅功能升级 — 产品需求文档（PRD）

> **版本**: v1.0
> **日期**: 2026-07-09
> **作者**: 产品需求
> **状态**: 待评审
> **关联项目**: love-app（Vue3 + Vite + PWA + Vant4）
> **前置文档**: [技术调研文档](./RESEARCH.md)

---

## 目录

1. [概述](#1-概述)
2. [功能需求](#2-功能需求)
3. [非功能需求](#3-非功能需求)
4. [数据模型](#4-数据模型)
5. [接口设计](#5-接口设计)
6. [验收标准](#6-验收标准)
7. [风险与依赖](#7-风险与依赖)

---

## 1. 概述

### 1.1 项目背景

love-app 是一款面向情侣的 PWA 小工具，当前为纯前端静态应用，所有数据存于 localStorage。其中的「午餐大转盘」功能使用硬编码的 10 个示例餐厅，用户手动输入名称即可添加，缺乏真实位置感知能力和数据来源可信度。

### 1.2 核心问题

| # | 问题 | 影响 |
|---|------|------|
| P1 | 餐厅数据为硬编码 + 手动输入，名称随意，无法验证真实性 | 转圈结果可能导向不存在的餐厅 |
| P2 | 无位置感知，无法展示"附近"的餐厅 | 用户体验受限，缺乏实用性 |
| P3 | localStorage 存储结构薄弱，无唯一标识 | 数据易冲突、无法跨设备同步 |
| P4 | 无数据来源区分，无法追溯餐厅来自 POI 还是自建 | 数据管理混乱 |

### 1.3 项目目标

| 目标 | 衡量标准 |
|------|----------|
| **真实 POI 来源** | 所有餐厅必须从高德 POI 搜索结果中选择或用户手动创建（手动创建需补充坐标） |
| **位置感知** | 能获取用户所在城市/坐标，展示附近餐厅 |
| **转圈数据可信** | 转圈仅从用户自建库（含 POI 收藏）中选择，排除硬编码示例 |
| **渐进迁移** | 现有功能不破坏，旧数据可选迁移 |

### 1.4 核心用户故事

**US-1：浏览附近餐厅**

> 作为情侣中的任意一方，我打开"附近餐厅"页面，应用自动定位到我的城市，展示附近的真实餐厅列表，我可以搜索关键词（如"火锅"、"日料"）来筛选。

**US-2：收藏 POI 餐厅**

> 作为用户，我在搜索结果中看到一家"海底捞"，点击"收藏"按钮，可以填写备注"第一次约会的地方"，它就被添加到我的自建库中。

**US-3：转圈选餐**

> 作为用户，我打开"午餐大转盘"，转盘从我的自建库（收藏的餐厅）中随机选择一家。我可以"排除近 3 天吃过的"，点击"重新转"换一家，或点击"就这个了"确认选择。

**US-4：管理自建库**

> 作为用户，我可以在"我的餐厅"页面查看所有收藏的餐厅，删除不再喜欢的，查看过往转圈历史记录。

**US-5：手动添加餐厅**

> 作为用户，如果搜索结果里没有我想要的餐厅，我可以手动添加，但需要填写名称、地址（或坐标）、选择分类，确保数据完整。

---

## 2. 功能需求

### F1. 位置获取

#### F1.1 首次加载定位

| 字段 | 说明 |
|------|------|
| **触发条件** | 用户首次进入"附近餐厅"页面或启用位置相关功能 |
| **输入** | 无（自动触发） |
| **处理流程** | 1. 调用高德 IP 定位 API `https://restapi.amap.com/v3/ip?key=<KEY>` |
| | 2. 解析返回的省份、城市编码（citycode）、矩形边界 |
| | 3. 将城市信息缓存至 sessionStorage（key: `user_location`） |
| **输出** | 城市名称、城市编码、经纬度（IP 定位中心点） |
| **降级策略** | IP 定位失败 → 提示用户手动选择城市 → 默认"北京" |

#### F1.2 GPS 精度升级

| 字段 | 说明 |
|------|------|
| **触发条件** | 用户点击"精准定位"按钮 |
| **输入** | 用户授权浏览器 Geolocation API |
| **处理流程** | 1. 弹出浏览器原生授权弹窗 |
| | 2. 授权成功 → `navigator.geolocation.getCurrentPosition()` 获取经纬度 |
| | 3. 调用高德逆地理编码 API 将坐标转为城市/地址 |
| | 4. 更新 sessionStorage 中的位置信息 |
| **输出** | 经纬度（高精度）、详细地址 |
| **降级策略** | 用户拒绝 → 保持 IP 定位结果；GPS 超时（10s）→ 提示并降级 |

#### F1.3 手动选择城市

| 字段 | 说明 |
|------|------|
| **触发条件** | 用户点击"切换城市"或 IP 定位失败 |
| **交互** | 城市选择器（省 → 市 → 区，级联选择） |
| **数据源** | 高德城市区域 API 或静态城市列表（省市级） |
| **输出** | 用户选择的城市编码和名称，覆盖自动定位结果 |
| **优先级** | 手动选择 > GPS 定位 > IP 定位 |

---

### F2. 附近餐厅浏览

#### F2.1 列表展示

| 字段 | 说明 |
|------|------|
| **触发条件** | 进入"附近餐厅"页面（需已有城市信息） |
| **数据源** | 高德 POI 搜索 API（通过 Supabase Edge Function 代理） |
| **展示字段** | 餐厅名称、分类（如"川菜"）、地址、距离（km）、评分（如有）、价格等级 |
| **排序** | 默认按距离升序，可选按评分降序 |
| **分页** | 上拉加载更多，每页 20 条，最多展示 100 条 |
| **空状态** | 无结果时显示"该分类下暂无餐厅，换个关键词试试？" |

#### F2.2 搜索功能

| 字段 | 说明 |
|------|------|
| **关键词搜索** | 输入关键词实时搜索（防抖 300ms），如"火锅"、"日料"、"麦当劳" |
| **分类筛选** | 标签栏快速筛选：全部、火锅、日料、韩料、西餐、咖啡、甜品、快餐等 |
| **分类数据源** | 高德 POI 分类代码（如 `050000` 为餐饮服务） |
| **排序切换** | 距离优先 / 评分优先 |

#### F2.3 地图模式（可选，P2 优先级）

| 字段 | 说明 |
|------|------|
| **触发条件** | 用户点击"地图"Tab 切换 |
| **技术方案** | 高德 JS API 2.0（需加载 SDK） |
| **展示** | 地图标记当前用户位置 + 附近 POI 标记点 |
| **交互** | 点击标记点 → 弹出信息窗（名称、地址、评分、操作按钮） |
| **性能** | 地图模式为可选功能，不加载时不引入 SDK（按需 import） |

---

### F3. 餐厅收藏

#### F3.1 收藏操作

| 字段 | 说明 |
|------|------|
| **触发条件** | 用户在 POI 搜索结果列表中点击"收藏"按钮 |
| **前置校验** | 检查是否已收藏（根据 `amap_poi_id` 或名称去重） |
| **处理流程** | 1. 弹出底部弹窗，显示餐厅信息预览 |
| | 2. 可选填备注（placeholder: "如：第一次约会的地方"，限 50 字） |
| | 3. 确认后写入 Supabase `restaurants` + `favorites` 表 |
| | 4. UI 更新：列表项"收藏"按钮变为"已收藏 ❤️" |
| **输出** | 该餐厅出现在用户自建库中，可参与转圈 |

#### F3.2 已收藏标记

| 字段 | 说明 |
|------|------|
| **逻辑** | 每次加载 POI 搜索结果时，对比用户 `favorites` 表，已收藏的餐厅标记为"已收藏" |
| **展示** | 收藏按钮变为实心爱心 ❤️，不可再次点击（或点击后取消收藏） |

#### F3.3 取消收藏

| 字段 | 说明 |
|------|------|
| **触发条件** | 用户在搜索结果或自建库页面点击"取消收藏" |
| **处理** | 删除 `favorites` 表对应记录，`restaurants` 表中的 POI 数据保留但标记为未收藏 |
| **提示** | Toast 提示"已取消收藏" |

---

### F4. 转圈选餐

#### F4.1 转盘数据源

| 字段 | 说明 |
|------|------|
| **数据来源** | 用户自建库（`favorites` 表关联的 `restaurants`） |
| **排除逻辑** | 默认排除近 N 天（默认 3 天）内转过的餐厅（查 `lunch_history` 表） |
| **最少数量** | 自建库排除后剩余 < 2 家时，提示"餐厅不够啦，去收藏几家吧" |
| **向后兼容** | 保留硬编码示例数据作为兜底，但仅当自建库为空时提示引导收藏 |

#### F4.2 转圈交互

| 字段 | 说明 |
|------|------|
| **触发** | 用户点击转盘中心按钮 🎡 |
| **动画** | 转盘旋转 4 秒，cubic-out 缓动减速 |
| **结果** | 弹出结果卡片，展示：餐厅 emoji、名称、备注（如有）、距离、评分 |
| **操作按钮** | ① "就这个了！" → 确认选择，记录到 `lunch_history` |
| | ② "重新转" → 不记录，重新旋转 |
| | ③ "排除这家再转" → 临时排除当前结果（本次会话有效） |
| **导航** | "📍 导航"按钮 → 调用高德 URI Scheme 跳转地图导航 |

#### F4.3 排除功能

| 字段 | 说明 |
|------|------|
| **近期排除** | 自动排除 `lunch_history` 中近 3 天的记录（可配置天数） |
| **手动排除** | 用户可点击"排除这家"手动加入当次排除列表 |
| **会话级排除** | 手动排除仅在当次进入转圈页面有效，刷新后重置 |

---

### F5. 自建库管理

#### F5.1 收藏列表

| 字段 | 说明 |
|------|------|
| **入口** | "附近餐厅"页面顶部 Tab"我的餐厅" 或底部导航新增入口 |
| **展示** | 卡片列表，展示：emoji、名称、备注（如有）、地址、距离（如有坐标） |
| **排序** | 默认按收藏时间倒序，可选按距离/名称排序 |
| **搜索** | 支持按名称/备注搜索 |

#### F5.2 删除收藏

| 字段 | 说明 |
|------|------|
| **触发** | 左滑删除或点击卡片进入详情后删除 |
| **确认** | 二次确认弹窗"确定不再收藏这家餐厅吗？" |
| **处理** | 删除 `favorites` 记录，不删除 `restaurants` 表中的 POI 数据 |

#### F5.3 转圈历史

| 字段 | 说明 |
|------|------|
| **展示** | 按日期分组，展示每次转圈的结果（餐厅名称、时间） |
| **详情** | 点击可查看当次转盘完整信息（是否被排除、备注等） |
| **统计** | 周/月统计转盘次数、最常吃 TOP3 |

---

## 3. 非功能需求

### 3.1 性能需求

| 指标 | 要求 | 说明 |
|------|------|------|
| **POI 搜索响应时间** | < 2s（P95） | 从用户发起搜索到结果展示 |
| **首次定位时间** | < 1.5s | IP 定位 API 返回时间 |
| **转盘启动延迟** | < 100ms | 点击按钮到动画开始 |
| **页面切换** | < 300ms | 路由切换无白屏 |
| **列表滚动** | 60fps | 搜索结果列表流畅滚动 |

### 3.2 离线需求

| 场景 | 方案 |
|------|------|
| **已收藏餐厅** | Service Worker 缓存自建库数据（Workbox 策略：StaleWhileRevalidate） |
| **转圈功能** | 自建库数据同步到 IndexedDB，离线时可正常转圈 |
| **POI 搜索** | 离线时展示"网络不可用，请连接后搜索"提示 |
| **位置信息** | 最后已知位置缓存到 sessionStorage，离线时可读取 |

### 3.3 隐私需求

| 要求 | 实现 |
|------|------|
| **位置数据本地存储** | GPS 经纬度不存储到服务器，仅存 sessionStorage |
| **不上传用户行为** | 转圈记录、收藏记录仅存本地 (localStorage/IndexedDB) |
| **API Key 不暴露** | 高德 Key 存 Supabase Edge Function 环境变量 |
| **数据可删除** | 提供"清除所有数据"按钮，一键清除 localStorage + IndexedDB |
| **最小必要原则** | 仅城市级位置默认收集，精确 GPS 需用户主动授权 |

### 3.4 兼容性

| 平台 | 要求 |
|------|------|
| **浏览器** | Chrome 90+、Safari 14+、微信内置浏览器 |
| **屏幕**：优先适配 375px-428px 宽度（手机），平板适配 768px+ |
| **PWA**：支持添加到主屏幕，iOS/Android 均支持 |

---

## 4. 数据模型

### 4.1 餐厅对象（POI 标准字段）

```javascript
// 前端餐厅对象 — 用于列表展示和转圈
{
  id: 'uuid',                    // 唯一标识（后端生成）
  name: '海底捞火锅(望京店)',     // 餐厅名称
  emoji: '🍲',                   // 展示图标（用户可自定义）
  address: '望京街 9 号',         // 详细地址
  latitude: 39.9087,             // 纬度
  longitude: 116.4983,            // 经度
  rating: 4.7,                   // 评分（高德/用户评分）
  price_level: 3,                // 价格等级 1-4
  tags: ['火锅', '24小时'],       // 标签数组
  phone: '010-12345678',         // 联系电话
  distance: 1.2,                 // 距离（km，前端计算）
  source: 'amap',                // 数据来源：'amap' | 'user' | 'seed'
  amap_poi_id: 'B000A8XK1C',    // 高德 POI ID（如有）
  note: '第一次约会的地方',       // 用户备注（收藏时填写）
  favorited_at: '2026-07-09T12:00:00Z', // 收藏时间
}
```

### 4.2 数据库表结构

#### profiles（用户表）

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nickname TEXT,
  avatar_url TEXT,
  partner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### restaurants（餐厅表）

```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🍽️',
  address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  rating DECIMAL(3, 2),
  price_level SMALLINT,
  tags TEXT[],
  phone TEXT,
  source TEXT DEFAULT 'user',  -- 'user' | 'amap' | 'seed'
  amap_poi_id TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_restaurants_source ON restaurants(source);
CREATE INDEX idx_restaurants_amap_poi_id ON restaurants(amap_poi_id) WHERE amap_poi_id IS NOT NULL;
```

#### favorites（收藏表）

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
```

#### lunch_history（转圈历史表）

```sql
CREATE TABLE lunch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  restaurant_id UUID REFERENCES restaurants(id),
  restaurant_name TEXT,  -- 冗余存储
  date DATE NOT NULL,
  time TIME,
  is_excluded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lunch_history_user_date ON lunch_history(user_id, date);
```

### 4.3 本地存储映射

| localStorage Key | 用途 | 迁移后状态 |
|-----------------|------|-----------|
| `restaurants` | 硬编码餐厅列表 | 移除（转用 Supabase + IndexedDB 缓存） |
| `excluded_restaurants` | 排除列表 | 移除（改用内存 + lunch_history 查询） |
| `favorite_restaurants` | 收藏列表 | 移除（改用 Supabase favorites 表） |
| `lunch_history` | 转圈历史 | 保留为离线缓存，后台同步到 Supabase |

### 4.4 距离计算

```javascript
// 前端 Haversine 公式（无 PostGIS 时降级）
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径(km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

---

## 5. 接口设计

### 5.1 Supabase Edge Function：高德 POI 代理

#### 接口：`/functions/v1/nearby-restaurants`

| 属性 | 值 |
|------|-----|
| **方法** | GET |
| **输入参数** | `lat` (float) — 纬度 |
| | `lng` (float) — 经度 |
| | `radius` (int, 默认 3000) — 搜索半径（米） |
| | `keyword` (string, 可选) — 搜索关键词 |
| | `type` (string, 可选) — POI 分类代码 |
| | `offset` (int, 默认 1) — 分页页码 |

**处理流程：**

1. 接收前端请求参数
2. 读取环境变量 `AMAP_API_KEY`
3. 调用高德 POI 搜索 API：
   ```
   https://restapi.amap.com/v3/place/around?key={AMAP_API_KEY}&location={lng},{lat}&radius={radius}&keywords={keyword}&types={type}&offset={offset}&page=1&extensions=all
   ```
4. 标准化响应数据，转换为前端餐厅对象格式
5. 返回 JSON 响应

**成功响应：**

```json
{
  "ok": true,
  "data": [
    {
      "id": "B000A8XK1C",
      "name": "海底捞火锅(望京店)",
      "address": "望京街 9 号",
      "location": "116.4983,39.9087",
      "rating": 4.7,
      "type": "餐饮服务;中餐厅",
      "tel": "010-12345678",
      "distance": 1200
    }
  ],
  "count": 15
}
```

**错误响应：**

```json
{
  "ok": false,
  "error": "搜索失败，请稍后重试"
}
```

### 5.2 Supabase Edge Function：高德 IP 定位代理

#### 接口：`/functions/v1/location-ip`

| 属性 | 值 |
|------|-----|
| **方法** | GET |
| **输入参数** | 无 |
| **处理流程** | 1. 调用 `https://restapi.amap.com/v3/ip?key={AMAP_API_KEY}` |
| | 2. 解析返回的省份、城市、矩形边界 |
| **返回** | `{ ok: true, data: { province, city, citycode, rectangle } }` |

### 5.3 数据库操作（通过 Supabase JS SDK）

#### 收藏餐厅

```javascript
// 写入 restaurants 表
const { data: restaurant, error: rError } = await supabase
  .from('restaurants')
  .upsert({
    name: poi.name,
    address: poi.address,
    latitude: poi.location.lat,
    longitude: poi.location.lng,
    rating: poi.rating,
    phone: poi.tel,
    source: 'amap',
    amap_poi_id: poi.id,
    created_by: user.id
  }, { onConflict: 'amap_poi_id' })
  .select()
  .single();

// 写入 favorites 表
const { error: fError } = await supabase
  .from('favorites')
  .upsert({
    user_id: user.id,
    restaurant_id: restaurant.id,
    note: userNote
  }, { onConflict: 'user_id,restaurant_id' });
```

#### 查询用户收藏（带去重标记）

```javascript
const { data: favorites } = await supabase
  .from('favorites')
  .select(`
    id, note, created_at,
    restaurant:restaurants (*)
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

#### 查询转圈候选（排除近期）

```javascript
const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

const { data: candidates } = await supabase
  .rpc('get_lunch_candidates', {
    p_user_id: user.id,
    p_exclude_since: threeDaysAgo.toISOString()
  });
```

**对应 SQL Function：**

```sql
CREATE OR REPLACE FUNCTION get_lunch_candidates(
  p_user_id UUID,
  p_exclude_since TIMESTAMPTZ
)
RETURNS TABLE (restaurant_id UUID, name TEXT, emoji TEXT, note TEXT) AS $$
  SELECT r.id, r.name, r.emoji, f.note
  FROM favorites f
  JOIN restaurants r ON f.restaurant_id = r.id
  WHERE f.user_id = p_user_id
  AND r.id NOT IN (
    SELECT restaurant_id FROM lunch_history
    WHERE user_id = p_user_id
    AND created_at >= p_exclude_since
  )
$$ LANGUAGE sql;
```

---

## 6. 验收标准

### F1. 位置获取

| # | 测试项 | 预期结果 |
|---|--------|----------|
| AC-F1-01 | 首次打开"附近餐厅"页面（无位置授权） | 1.5s 内返回城市级定位，展示该城市餐厅列表 |
| AC-F1-02 | IP 定位失败后点击"定位失败，手动选择" | 弹出城市选择器，选择后展示对应城市餐厅 |
| AC-F1-03 | 点击"精准定位"并授权 | 获取 GPS 坐标，重新按精确位置排序 |
| AC-F1-04 | 点击"精准定位"但拒绝授权 | Toast 提示"已使用城市级定位"，保持原结果 |
| AC-F1-05 | 切换城市后再切回自动定位 | 恢复 IP 定位结果 |

### F2. 附近餐厅浏览

| # | 测试项 | 预期结果 |
|---|--------|----------|
| AC-F2-01 | 进入页面加载默认列表 | 2s 内展示 20 条餐厅，含名称、地址、距离、评分 |
| AC-F2-02 | 输入关键词"火锅"搜索 | 列表仅展示名称/分类含"火锅"的餐厅 |
| AC-F2-03 | 点击分类标签"日料" | 列表仅展示日料分类的餐厅 |
| AC-F2-04 | 上拉加载更多 | 追加 20 条新数据，无重复 |
| AC-F2-05 | 切换城市后搜索 | 搜索结果基于新城市 |
| AC-F2-06 | 无网络状态进入 | 展示"网络不可用"提示，已收藏餐厅可查看 |

### F3. 餐厅收藏

| # | 测试项 | 预期结果 |
|---|--------|----------|
| AC-F3-01 | 点击未收藏餐厅的"收藏"按钮 | 弹出备注填写弹窗，确认后写入数据库，按钮变为"已收藏 ❤️" |
| AC-F3-02 | 收藏时填写备注"纪念日餐厅" | 收藏成功后，在自营库中展示该备注 |
| AC-F3-03 | 再次点击已收藏餐厅的"已收藏" | 取消收藏，按钮恢复"收藏" |
| AC-F3-04 | 重复收藏同一餐厅 | 提示"已收藏过这家餐厅"，不重复写入 |
| AC-F3-05 | 收藏后进入自建库页面 | 新收藏的餐厅出现在列表顶部 |

### F4. 转圈选餐

| # | 测试项 | 预期结果 |
|---|--------|----------|
| AC-F4-01 | 自建库有 5 家餐厅，点击转圈 | 转盘展示 5 家餐厅扇区，旋转后停在一家 |
| AC-F4-02 | 近 3 天已转过其中 2 家 | 转盘仅展示剩余 3 家，被排除的不出现 |
| AC-F4-03 | 点击"再转（排除当前）" | 将当前结果加入排除列表，重新旋转 |
| AC-F4-04 | 点击"就这个了" | 记录到 lunch_history，弹窗消失，Toast 提示"去吃 XXX！" |
| AC-F4-05 | 自建库仅 1 家餐厅 | 提示"至少需要 2 家餐厅才能转哟" |
| AC-F4-06 | 点击"📍 导航" | 成功跳转到高德地图，带入餐厅名称参数 |

### F5. 自建库管理

| # | 测试项 | 预期结果 |
|---|--------|----------|
| AC-F5-01 | 进入"我的餐厅"页面 | 展示所有已收藏餐厅，按收藏时间倒序 |
| AC-F5-02 | 搜索"纪念日" | 列表仅展示备注含"纪念日"的餐厅 |
| AC-F5-03 | 左滑删除一家餐厅 | 二次确认后删除，列表更新，餐厅不再出现在转圈候选 |
| AC-F5-04 | 进入"转圈历史"页面 | 按日期分组展示历史记录，含餐厅名称、时间 |

### 非功能验收

| # | 测试项 | 预期结果 |
|---|--------|----------|
| AC-NF-01 | POI 搜索响应时间 | 95% 请求 < 2s |
| AC-NF-02 | 刷新页面后恢复位置 | sessionStorage 中城市信息不丢失 |
| AC-NF-03 | 清除所有数据 | localStorage + IndexedDB 全部清空，恢复初始状态 |
| AC-NF-04 | 隐私合规 | 位置数据不通过 HTTP 请求发送到自建服务器 |

---

## 7. 风险与依赖

### 7.1 风险清单

| # | 风险 | 概率 | 影响 | 缓解措施 |
|---|------|------|------|----------|
| R1 | Supabase 海外节点国内访问慢/不稳定 | 中 | 高 | 1. 国内访问测试 → 如慢则迁移到 LeanCloud |  |
| | | | | 2. 使用 CDN 加速静态资源 |  |
| | | | | 3. 设置请求超时 5s，超时降级到缓存 |  |
| R2 | 高德 API Key 被盗用 | 中 | 中 | 1. Key 仅存 Edge Function 环境变量 |  |
| | | | | 2. 高德后台设置 IP 白名单/Referer 限制 |  |
| | | | | 3. 开启高德 API 调用监控告警 |  |
| R3 | 用户拒绝位置授权 | 高 | 低 | 降级到 IP 定位或手动选择城市，不阻断主流程 |
| R4 | POI 搜索额度耗尽 | 低 | 中 | 1. Edge Function 层做结果缓存（同城市+同关键词 1h） |  |
| | | | | 2. 提供"手动添加"兜底功能 |  |
| R5 | 数据库容量超限（500MB） | 低 | 中 | 1. 定期清理超过 1 年的 lunch_history |  |
| | | | | 2. 照片等大文件使用 Supabase Storage，不计入数据库 |
| R6 | 旧数据迁移失败 | 低 | 中 | 1. 双写阶段保留 localStorage 数据 |  |
| | | | | 2. 迁移前导出 JSON 备份 |  |
| | | | | 3. 迁移失败回滚，不影响现有功能 |
| R7 | PWA Service Worker 缓存过期 POI 数据 | 中 | 低 | 使用 Workbox StaleWhileRevalidate 策略，缓存时长 24h |

### 7.2 依赖项

| 依赖 | 类型 | 说明 |
|------|------|------|
| **高德 POI 搜索 API** | 外部服务 | 30 万次/天免费额度，需注册开发者账号 |
| **高德 IP 定位 API** | 外部服务 | 与 POI 共用配额 |
| **高德 JS API 2.0** | 外部 SDK | 地图模式按需加载 |
| **Supabase** | 后端服务 | 数据库 + Auth + Edge Functions |
| **Supabase JS SDK** | 前端依赖 | `@supabase/supabase-js` |
| **Deno** | 运行时 | Edge Functions 运行环境 |

### 7.3 里程碑

```
Phase 1 (1-2 周): 基础架构
├── Supabase 项目初始化
├── 数据库表结构创建
├── Edge Function: 高德 POI 代理
├── 前端集成 Supabase SDK
└── 注册高德 API Key

Phase 2 (1 周): 位置获取 + 餐厅浏览
├── IP 定位实现
├── GPS 授权升级
├── 城市选择器
├── 附近餐厅列表 + 搜索
└── 分类筛选

Phase 3 (1 周): 收藏 + 自建库
├── POI 收藏功能
├── 备注填写
├── 自建库 CRUD
└── 已收藏标记

Phase 4 (1 周): 转圈升级 + 历史
├── 转圈数据源切换为自建库
├── 排除逻辑升级
├── 转圈历史页面
└── 统计数据

Phase 5 (可选): 数据迁移
├── 旧 localStorage 数据导出
├── 一键迁移到 Supabase
└── 清理旧数据
