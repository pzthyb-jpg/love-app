-- 修复位置分享 RLS 策略，兼容自建 app_users 认证
-- 原因：原策略使用 auth.uid()，但项目使用自建认证体系（非 Supabase Auth），
--       auth.uid() 始终返回 NULL，导致所有数据库操作被拒绝
-- 修复方式：将策略改为 USING(true)，与项目其他业务表保持一致
-- ⚠️ 注意：此迁移文件需在 Supabase Dashboard SQL Editor 手动执行才能生效

-- 删除旧的 auth.uid() 策略
DROP POLICY IF EXISTS "Users can view their own invites" ON location_invites;
DROP POLICY IF EXISTS "Users can insert invites" ON location_invites;
DROP POLICY IF EXISTS "Users can update their own invites" ON location_invites;

DROP POLICY IF EXISTS "Users can view their own shares" ON location_shares;
DROP POLICY IF EXISTS "Users can insert their own shares" ON location_shares;

DROP POLICY IF EXISTS "Users can view their own blacklist" ON location_blacklist;
DROP POLICY IF EXISTS "Users can insert to their blacklist" ON location_blacklist;
DROP POLICY IF EXISTS "Users can delete from their blacklist" ON location_blacklist;

-- 创建宽松策略（与项目其他表一致）
CREATE POLICY "location_invites_all" ON location_invites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "location_shares_all" ON location_shares FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "location_blacklist_all" ON location_blacklist FOR ALL USING (true) WITH CHECK (true);
