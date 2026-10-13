ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS media_role VARCHAR(32) NOT NULL DEFAULT 'gallery' AFTER alt_text,
  ADD COLUMN IF NOT EXISTS model_name VARCHAR(120) NULL AFTER media_role,
  ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER model_name;

CREATE INDEX IF NOT EXISTS idx_media_assets_product_role
  ON media_assets (entity_type, entity_id, media_role, is_featured, sort_order);
