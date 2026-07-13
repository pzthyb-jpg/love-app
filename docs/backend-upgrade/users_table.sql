-- ============================================================
-- love-app 自定义账号系统 SQL 脚本
-- 执行位置: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  salt text NOT NULL,
  display_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 允许任何人注册/登录（通过 anon key + RLS 控制）
CREATE POLICY "allow_anon_insert" ON app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_anon_select" ON app_users FOR SELECT USING (true);

-- 2. 插入测试账号 (admin / love1314)
INSERT INTO app_users (username, password_hash, salt, display_name)
VALUES (
  'admin',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  '',
  '管理员'
)
ON CONFLICT (username) DO NOTHING;

-- 3. 插入测试账号2 (test / 123456)
INSERT INTO app_users (username, password_hash, salt, display_name)
VALUES (
  'test',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  '',
  '测试账号'
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 验证数据
-- ============================================================
-- SELECT * FROM app_users;
