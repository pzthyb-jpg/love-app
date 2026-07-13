-- ============================================================
-- love-app 全量数据存储到 Supabase
-- 在 Dashboard SQL Editor 粘贴执行全部内容
-- ============================================================

-- 1. 用户表 (已建好则跳过)
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  salt text NOT NULL,
  display_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_anon_insert" ON app_users;
DROP POLICY IF EXISTS "allow_anon_select" ON app_users;

CREATE POLICY "allow_anon_insert" ON app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_anon_select" ON app_users FOR SELECT USING (true);

-- 2. 用户偏好设置（一对一）
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  girlfriend_name text DEFAULT '',
  boyfriend_name text DEFAULT '男朋友',
  love_anniversary date,
  theme_pref text DEFAULT 'light',
  notification_enabled boolean DEFAULT true,
  reminder_time text DEFAULT 'noon',
  custom_reminder_time text DEFAULT '12:00',
  animation_density text DEFAULT 'normal',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_settings_owner" ON user_settings;
CREATE POLICY "user_settings_owner" ON user_settings FOR ALL USING (true);

-- 3. 打卡记录
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text DEFAULT 'photo',
  photo_url text,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkins_owner" ON checkins;
CREATE POLICY "checkins_owner" ON checkins FOR ALL USING (true);

-- 4. 愿望清单
CREATE TABLE IF NOT EXISTS wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'pending',
  priority integer DEFAULT 0,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishes_owner" ON wishes;
CREATE POLICY "wishes_owner" ON wishes FOR ALL USING (true);

-- 5. 消息/留言
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_name text DEFAULT '',
  icon text DEFAULT '💕',
  is_template boolean DEFAULT false,
  displayed_dates jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_owner" ON messages;
CREATE POLICY "messages_owner" ON messages FOR ALL USING (true);

-- 6. 纪念日
CREATE TABLE IF NOT EXISTS anniversaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  type text DEFAULT 'anniversary',
  emoji text DEFAULT '💕',
  remark text DEFAULT '',
  remind_days integer[] DEFAULT '{3}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE anniversaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anniversaries_owner" ON anniversaries;
CREATE POLICY "anniversaries_owner" ON anniversaries FOR ALL USING (true);

-- 7. 餐厅收藏与排除
CREATE TABLE IF NOT EXISTS restaurant_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_favorite boolean DEFAULT false,
  is_excluded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE restaurant_prefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "restaurant_prefs_owner" ON restaurant_prefs;
CREATE POLICY "restaurant_prefs_owner" ON restaurant_prefs FOR ALL USING (true);

-- 8. 午餐记录
CREATE TABLE IF NOT EXISTS lunch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  restaurant_name text,
  selected_at timestamptz DEFAULT now(),
  rating integer,
  note text
);

ALTER TABLE lunch_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lunch_history_owner" ON lunch_history;
CREATE POLICY "lunch_history_owner" ON lunch_history FOR ALL USING (true);

-- 9. 打卡连续天数统计
CREATE TABLE IF NOT EXISTS checkin_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  streak_days integer DEFAULT 0,
  last_checkin_date date,
  longest_streak integer DEFAULT 0,
  total_checkins integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE checkin_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkin_stats_owner" ON checkin_stats;
CREATE POLICY "checkin_stats_owner" ON checkin_stats FOR ALL USING (true);

-- ============================================================
-- 索引（提升查询性能）
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_user_status ON wishes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_anniversaries_user ON anniversaries(user_id);
CREATE INDEX IF NOT EXISTS idx_lunch_history_user ON lunch_history(user_id, selected_at DESC);
CREATE INDEX IF NOT EXISTS idx_restaurant_prefs_user ON restaurant_prefs(user_id);

-- ============================================================
-- 验证（取消注释执行）
-- ============================================================
-- SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
