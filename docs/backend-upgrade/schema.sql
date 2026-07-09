-- ============================================================
-- love-app Supabase 数据库初始化脚本
-- 执行位置: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ========== 1. 用户资料表 ==========
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- ========== 2. 关系设置（情侣共享配置） ==========
CREATE TABLE IF NOT EXISTS relationship_settings (
  user_id uuid PRIMARY KEY,
  partner_nickname text DEFAULT '',
  my_nickname text DEFAULT '男朋友',
  love_start_date date,
  notification_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- ========== 3. 打卡记录 ==========
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  type text DEFAULT 'quick' CHECK (type IN ('quick', 'photo')),
  photo_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ========== 4. 连续打卡记录 ==========
CREATE TABLE IF NOT EXISTS checkin_streaks (
  user_id uuid PRIMARY KEY,
  streak_days integer DEFAULT 0,
  last_checkin_date text DEFAULT '',
  longest_streak integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- ========== 5. 打卡徽章 ==========
CREATE TABLE IF NOT EXISTS checkin_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_type text NOT NULL,
  earned_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- ========== 6. 愿望池 ==========
CREATE TABLE IF NOT EXISTS wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  text text NOT NULL,
  type text DEFAULT 'wish' CHECK (type IN ('wish', 'vent')),
  fulfilled boolean DEFAULT false,
  fulfilled_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ========== 7. 午餐历史 ==========
CREATE TABLE IF NOT EXISTS lunch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  restaurant_name text,
  date date NOT NULL,
  time text,
  created_at timestamptz DEFAULT now()
);

-- ========== 8. 收藏餐厅 ==========
CREATE TABLE IF NOT EXISTS favorite_restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text DEFAULT '🍽️',
  rating real DEFAULT 4.0,
  tags text[] DEFAULT '{}',
  address text DEFAULT '',
  lat double precision DEFAULT 0,
  lon double precision DEFAULT 0,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ========== 9. 纪念日 ==========
CREATE TABLE IF NOT EXISTS anniversaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  date date NOT NULL,
  type text DEFAULT 'custom' CHECK (type IN ('love', 'meeting', 'custom')),
  created_at timestamptz DEFAULT now()
);

-- ========== 10. 留言板 ==========
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  author_name text DEFAULT '男朋友',
  content text NOT NULL,
  is_displayed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS (Row Level Security) 安全策略
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- profiles 策略
CREATE POLICY "users_manage_own_profile" ON profiles FOR ALL USING (auth.uid() = id);

-- relationship_settings 策略
CREATE POLICY "users_manage_own_settings" ON relationship_settings FOR ALL USING (auth.uid() = user_id);

-- checkins 策略
CREATE POLICY "users_manage_own_checkins" ON checkins FOR ALL USING (auth.uid() = user_id);

-- checkin_streaks 策略
CREATE POLICY "users_manage_own_streak" ON checkin_streaks FOR ALL USING (auth.uid() = user_id);

-- checkin_badges 策略
CREATE POLICY "users_manage_own_badges" ON checkin_badges FOR ALL USING (auth.uid() = user_id);

-- wishes 策略
CREATE POLICY "users_manage_own_wishes" ON wishes FOR ALL USING (auth.uid() = user_id);

-- lunch_history 策略
CREATE POLICY "users_manage_own_lunch" ON lunch_history FOR ALL USING (auth.uid() = user_id);

-- favorite_restaurants 策略
CREATE POLICY "users_manage_own_favorites" ON favorite_restaurants FOR ALL USING (auth.uid() = user_id);

-- anniversaries 策略
CREATE POLICY "users_manage_own_anniversaries" ON anniversaries FOR ALL USING (auth.uid() = user_id);

-- messages 策略
CREATE POLICY "users_manage_own_messages" ON messages FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 索引优化
-- ============================================================

CREATE INDEX idx_checkins_user_date ON checkins(user_id, date DESC);
CREATE INDEX idx_wishes_user ON wishes(user_id);
CREATE INDEX idx_lunch_history_user ON lunch_history(user_id, date DESC);
CREATE INDEX idx_favorites_user ON favorite_restaurants(user_id);
CREATE INDEX idx_messages_user ON messages(user_id);
