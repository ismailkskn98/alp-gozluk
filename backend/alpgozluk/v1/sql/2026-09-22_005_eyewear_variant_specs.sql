-- Gözlük varyantlarının ölçü ve cam teknik bilgileri.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS origin_country_code CHAR(2) NULL AFTER tax_rate;

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS lens_width_mm DECIMAL(5,2) UNSIGNED NULL AFTER frame_size,
  ADD COLUMN IF NOT EXISTS bridge_width_mm DECIMAL(5,2) UNSIGNED NULL AFTER lens_width_mm,
  ADD COLUMN IF NOT EXISTS temple_length_mm DECIMAL(5,2) UNSIGNED NULL AFTER bridge_width_mm,
  ADD COLUMN IF NOT EXISTS lens_category VARCHAR(20) NULL AFTER lens_type,
  ADD COLUMN IF NOT EXISTS uv_protection VARCHAR(40) NULL AFTER lens_category;

INSERT INTO brands (code, name, slug, status, sort_order)
VALUES
  ('celine-paris', 'Celine Paris', 'celine-paris', 'active', 20),
  ('diana-korr', 'Diana Korr', 'diana-korr', 'active', 30),
  ('diana-kors', 'Diana Kors', 'diana-kors', 'active', 40),
  ('fendi', 'Fendi', 'fendi', 'active', 50),
  ('gucci', 'Gucci', 'gucci', 'active', 60),
  ('innoxlife', 'Innoxlife', 'innoxlife', 'active', 70),
  ('lacoste', 'Lacoste', 'lacoste', 'active', 80),
  ('no-brand', 'No Brand', 'no-brand', 'active', 90),
  ('prada', 'Prada', 'prada', 'active', 100),
  ('ray-ban', 'Ray-Ban', 'ray-ban', 'active', 110)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug),
  status = VALUES(status),
  sort_order = VALUES(sort_order);

INSERT INTO attribute_groups (code, scope, selection_mode, filterable, status, sort_order)
VALUES ('frame_type', 'product', 'single', 1, 'active', 35)
ON DUPLICATE KEY UPDATE
  scope = VALUES(scope),
  selection_mode = VALUES(selection_mode),
  filterable = VALUES(filterable),
  status = VALUES(status),
  sort_order = VALUES(sort_order);

INSERT INTO attribute_group_translations (attribute_group_id, locale, name)
SELECT id, 'tr', 'Çerçeve tipi' FROM attribute_groups WHERE code = 'frame_type'
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO attribute_group_translations (attribute_group_id, locale, name)
SELECT id, 'en', 'Frame type' FROM attribute_groups WHERE code = 'frame_type'
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO attribute_values (attribute_group_id, code, swatch_value, status, sort_order)
SELECT ag.id, seed.code, seed.swatch_value, 'active', seed.sort_order
FROM attribute_groups ag
INNER JOIN (
  SELECT 'frame_type' group_code, 'full-rim' code, NULL swatch_value, 10 sort_order UNION ALL
  SELECT 'frame_type', 'semi-rimless', NULL, 20 UNION ALL
  SELECT 'frame_type', 'rimless', NULL, 30 UNION ALL
  SELECT 'frame_shape', 'oval', NULL, 50 UNION ALL
  SELECT 'frame_shape', 'rectangle', NULL, 60 UNION ALL
  SELECT 'frame_shape', 'geometric', NULL, 70 UNION ALL
  SELECT 'frame_shape', 'wayfarer', NULL, 80 UNION ALL
  SELECT 'frame_shape', 'browline', NULL, 90 UNION ALL
  SELECT 'frame_color', 'white', '#f5f5f2', 40 UNION ALL
  SELECT 'frame_color', 'red', '#9f1e24', 50 UNION ALL
  SELECT 'frame_color', 'navy', '#17273d', 60 UNION ALL
  SELECT 'frame_color', 'green', '#254b3b', 70 UNION ALL
  SELECT 'lens_color', 'gray', '#55585c', 40 UNION ALL
  SELECT 'lens_color', 'purple', '#6b536f', 50 UNION ALL
  SELECT 'lens_color', 'blue', '#416987', 60 UNION ALL
  SELECT 'lens_color', 'yellow', '#c89b2a', 70
) seed ON seed.group_code = ag.code
ON DUPLICATE KEY UPDATE
  swatch_value = VALUES(swatch_value),
  status = VALUES(status),
  sort_order = VALUES(sort_order);

INSERT INTO attribute_value_translations (attribute_value_id, locale, name, slug)
SELECT av.id, 'tr',
  CASE av.code
    WHEN 'full-rim' THEN 'Tam çerçeveli'
    WHEN 'semi-rimless' THEN 'Yarım çerçeveli'
    WHEN 'rimless' THEN 'Çerçevesiz'
    WHEN 'oval' THEN 'Oval'
    WHEN 'rectangle' THEN 'Dikdörtgen'
    WHEN 'geometric' THEN 'Geometrik'
    WHEN 'wayfarer' THEN 'Wayfarer'
    WHEN 'browline' THEN 'Browline'
    WHEN 'white' THEN 'Beyaz'
    WHEN 'red' THEN 'Kırmızı'
    WHEN 'navy' THEN 'Lacivert'
    WHEN 'green' THEN 'Yeşil'
    WHEN 'gray' THEN 'Gri'
    WHEN 'purple' THEN 'Mor'
    WHEN 'blue' THEN 'Mavi'
    WHEN 'yellow' THEN 'Sarı'
    ELSE av.code
  END,
  av.code
FROM attribute_values av
INNER JOIN attribute_groups ag ON ag.id = av.attribute_group_id
WHERE (ag.code = 'frame_type' AND av.code IN ('full-rim', 'semi-rimless', 'rimless'))
   OR (ag.code = 'frame_shape' AND av.code IN ('oval', 'rectangle', 'geometric', 'wayfarer', 'browline'))
   OR (ag.code = 'frame_color' AND av.code IN ('white', 'red', 'navy', 'green'))
   OR (ag.code = 'lens_color' AND av.code IN ('gray', 'purple', 'blue', 'yellow'))
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug);

INSERT INTO attribute_value_translations (attribute_value_id, locale, name, slug)
SELECT av.id,
  'en',
  CASE av.code
    WHEN 'full-rim' THEN 'Full rim'
    WHEN 'semi-rimless' THEN 'Semi-rimless'
    WHEN 'rimless' THEN 'Rimless'
    WHEN 'oval' THEN 'Oval'
    WHEN 'rectangle' THEN 'Rectangle'
    WHEN 'geometric' THEN 'Geometric'
    WHEN 'wayfarer' THEN 'Wayfarer'
    WHEN 'browline' THEN 'Browline'
    WHEN 'white' THEN 'White'
    WHEN 'red' THEN 'Red'
    WHEN 'navy' THEN 'Navy'
    WHEN 'green' THEN 'Green'
    WHEN 'gray' THEN 'Gray'
    WHEN 'purple' THEN 'Purple'
    WHEN 'blue' THEN 'Blue'
    WHEN 'yellow' THEN 'Yellow'
    ELSE av.code
  END,
  av.code
FROM attribute_values av
INNER JOIN attribute_groups ag ON ag.id = av.attribute_group_id
WHERE (ag.code = 'frame_type' AND av.code IN ('full-rim', 'semi-rimless', 'rimless'))
   OR (ag.code = 'frame_shape' AND av.code IN ('oval', 'rectangle', 'geometric', 'wayfarer', 'browline'))
   OR (ag.code = 'frame_color' AND av.code IN ('white', 'red', 'navy', 'green'))
   OR (ag.code = 'lens_color' AND av.code IN ('gray', 'purple', 'blue', 'yellow'))
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug);
