-- ============================================================
-- 情侣绑定功能：user_settings 增加 partner_id 字段
-- 用于「回忆照片墙两人共有」——绑定后双方照片墙合并展示
--
-- 使用方法：在 Supabase Dashboard → SQL Editor 中粘贴执行
-- ============================================================

-- 1. user_settings 增加 partner_id（指向另一半的 app_users.id）
--    双向绑定：A 绑定 B 时，同时写入 A.partner_id=B 和 B.partner_id=A
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES app_users(id) ON DELETE SET NULL;

-- 2. RLS 说明：user_settings 已配置 USING(true) 策略（自建认证体系），
--    前端通过 user_id 过滤保证数据隔离，此处无需新增策略。

-- 3. 验证：执行后查看字段是否生效
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'user_settings' AND column_name = 'partner_id';
