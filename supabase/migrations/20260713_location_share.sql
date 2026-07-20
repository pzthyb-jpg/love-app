-- 位置共享功能 数据库迁移
-- 2026-07-13

-- 1. 邀请表
CREATE TABLE IF NOT EXISTS location_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending/accepted/rejected/expired/closed
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_reason TEXT, -- user_initiated / auto_proximity / auto_schedule / blacklist
  UNIQUE(sender_id, receiver_id, status)
);

CREATE INDEX IF NOT EXISTS idx_invites_sender ON location_invites(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_invites_receiver ON location_invites(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_invites_status ON location_invites(status) WHERE status = 'pending';

-- 2. 位置记录表
CREATE TABLE IF NOT EXISTS location_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relationship_id UUID NOT NULL REFERENCES location_invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION, -- GPS 精度（米）
  is_matched BOOLEAN DEFAULT false, -- 双方距离 <100m
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shares_relationship ON location_shares(relationship_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shares_user ON location_shares(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shares_created ON location_shares(created_at);

-- 3. 黑名单表
CREATE TABLE IF NOT EXISTS location_blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_blacklist_user ON location_blacklist(user_id);

-- 4. RLS 策略
-- 注意：本项目使用自建认证（app_users + localStorage），不使用 Supabase Auth
-- 因此 RLS 策略统一使用 USING(true)，与 app_users/checkins/wishes 等表保持一致
-- 前端通过 user_id 过滤保证数据隔离

ALTER TABLE location_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own invites" ON location_invites;
DROP POLICY IF EXISTS "Users can insert invites" ON location_invites;
DROP POLICY IF EXISTS "Users can update their own invites" ON location_invites;
CREATE POLICY "location_invites_all" ON location_invites FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE location_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own shares" ON location_shares;
DROP POLICY IF EXISTS "Users can insert their own shares" ON location_shares;
CREATE POLICY "location_shares_all" ON location_shares FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE location_blacklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own blacklist" ON location_blacklist;
DROP POLICY IF EXISTS "Users can insert to their blacklist" ON location_blacklist;
DROP POLICY IF EXISTS "Users can delete from their blacklist" ON location_blacklist;
CREATE POLICY "location_blacklist_all" ON location_blacklist FOR ALL USING (true) WITH CHECK (true);

-- 5. 数据清理函数（30天过期）
CREATE OR REPLACE FUNCTION cleanup_old_location_data()
RETURNS void AS $$
BEGIN
  DELETE FROM location_shares WHERE created_at < now() - interval '30 days';
  DELETE FROM location_invites WHERE status IN ('rejected', 'expired', 'closed') AND created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;
