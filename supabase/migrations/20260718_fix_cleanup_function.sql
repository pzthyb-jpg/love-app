-- 修复 cleanup_old_location_data() 函数
-- 原函数引用了不存在的 updated_at 列，location_invites 表只有 responded_at 和 closed_at
-- 修复方案：对 invites 使用 closed_at，对 shares 保持使用 created_at
-- 2026-07-18

DROP FUNCTION IF EXISTS cleanup_old_location_data();

CREATE OR REPLACE FUNCTION cleanup_old_location_data()
RETURNS void AS $$
BEGIN
  -- 清理 30 天前的位置记录（基于 created_at）
  DELETE FROM location_shares WHERE created_at < now() - interval '30 days';

  -- 清理 30 天前已关闭/拒绝/过期的邀请（基于 closed_at）
  -- 注意：pending 状态的邀请不应被清理，即使创建时间超过 30 天
  DELETE FROM location_invites
    WHERE status IN ('rejected', 'expired', 'closed')
    AND closed_at IS NOT NULL
    AND closed_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;
