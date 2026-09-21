-- Katalog hedef kitle, özellik, marka ve yönetilebilir navigasyon şeması.

CREATE TABLE IF NOT EXISTS brands (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_code (code),
  UNIQUE KEY uq_brands_slug (slug),
  KEY idx_brands_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audiences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_audiences_code (code),
  KEY idx_audiences_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audience_translations (
  audience_id BIGINT UNSIGNED NOT NULL,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  PRIMARY KEY (audience_id, locale),
  UNIQUE KEY uq_audience_translations_locale_slug (locale, slug),
  CONSTRAINT fk_audience_translations_audience
    FOREIGN KEY (audience_id) REFERENCES audiences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_audiences (
  product_id BIGINT UNSIGNED NOT NULL,
  audience_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, audience_id),
  KEY idx_product_audiences_audience (audience_id, product_id),
  CONSTRAINT fk_product_audiences_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_audiences_audience
    FOREIGN KEY (audience_id) REFERENCES audiences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attribute_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL,
  scope VARCHAR(20) NOT NULL DEFAULT 'product',
  selection_mode VARCHAR(20) NOT NULL DEFAULT 'multiple',
  filterable TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_attribute_groups_code (code),
  KEY idx_attribute_groups_status_sort (status, sort_order),
  CONSTRAINT chk_attribute_groups_scope CHECK (scope IN ('product', 'variant')),
  CONSTRAINT chk_attribute_groups_selection CHECK (selection_mode IN ('single', 'multiple'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attribute_group_translations (
  attribute_group_id BIGINT UNSIGNED NOT NULL,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(140) NOT NULL,
  PRIMARY KEY (attribute_group_id, locale),
  CONSTRAINT fk_attribute_group_translations_group
    FOREIGN KEY (attribute_group_id) REFERENCES attribute_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attribute_values (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attribute_group_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(100) NOT NULL,
  swatch_value VARCHAR(40) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_attribute_values_group_code (attribute_group_id, code),
  KEY idx_attribute_values_group_sort (attribute_group_id, status, sort_order),
  CONSTRAINT fk_attribute_values_group
    FOREIGN KEY (attribute_group_id) REFERENCES attribute_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attribute_value_translations (
  attribute_value_id BIGINT UNSIGNED NOT NULL,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(140) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  PRIMARY KEY (attribute_value_id, locale),
  UNIQUE KEY uq_attribute_value_translations_group_slug (locale, slug, attribute_value_id),
  CONSTRAINT fk_attribute_value_translations_value
    FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_attribute_values (
  product_id BIGINT UNSIGNED NOT NULL,
  attribute_value_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, attribute_value_id),
  KEY idx_product_attribute_values_value (attribute_value_id, product_id),
  CONSTRAINT fk_product_attribute_values_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_attribute_values_value
    FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS variant_attribute_values (
  variant_id BIGINT UNSIGNED NOT NULL,
  attribute_value_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (variant_id, attribute_value_id),
  KEY idx_variant_attribute_values_value (attribute_value_id, variant_id),
  CONSTRAINT fk_variant_attribute_values_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  CONSTRAINT fk_variant_attribute_values_value
    FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS navigation_menus (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL,
  location VARCHAR(80) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  starts_at DATETIME(6) NULL,
  ends_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_navigation_menus_code (code),
  KEY idx_navigation_menus_location_status (location, status, starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS navigation_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_id BIGINT UNSIGNED NOT NULL,
  parent_id BIGINT UNSIGNED NULL,
  code VARCHAR(100) NOT NULL,
  item_type VARCHAR(24) NOT NULL DEFAULT 'link',
  audience_id BIGINT UNSIGNED NULL,
  category_id BIGINT UNSIGNED NULL,
  collection_id BIGINT UNSIGNED NULL,
  attribute_value_id BIGINT UNSIGNED NULL,
  media_asset_id BIGINT UNSIGNED NULL,
  custom_url VARCHAR(500) NULL,
  column_position TINYINT UNSIGNED NOT NULL DEFAULT 1,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_navigation_items_menu_code (menu_id, code),
  KEY idx_navigation_items_parent_sort (parent_id, column_position, sort_order),
  CONSTRAINT fk_navigation_items_menu
    FOREIGN KEY (menu_id) REFERENCES navigation_menus(id) ON DELETE CASCADE,
  CONSTRAINT fk_navigation_items_parent
    FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_navigation_items_audience
    FOREIGN KEY (audience_id) REFERENCES audiences(id) ON DELETE SET NULL,
  CONSTRAINT fk_navigation_items_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_navigation_items_collection
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
  CONSTRAINT fk_navigation_items_attribute
    FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE SET NULL,
  CONSTRAINT fk_navigation_items_media
    FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL,
  CONSTRAINT chk_navigation_items_type CHECK (item_type IN ('link', 'group', 'promo'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS navigation_item_translations (
  navigation_item_id BIGINT UNSIGNED NOT NULL,
  locale VARCHAR(10) NOT NULL,
  label VARCHAR(160) NOT NULL,
  description VARCHAR(320) NULL,
  href VARCHAR(500) NULL,
  PRIMARY KEY (navigation_item_id, locale),
  CONSTRAINT fk_navigation_item_translations_item
    FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand_id BIGINT UNSIGNED NULL AFTER brand,
  ADD INDEX IF NOT EXISTS idx_products_brand (brand_id);

SET @brand_fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND CONSTRAINT_NAME = 'fk_products_brand'
);
SET @brand_fk_sql = IF(
  @brand_fk_exists = 0,
  'ALTER TABLE products ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE brand_fk_statement FROM @brand_fk_sql;
EXECUTE brand_fk_statement;
DEALLOCATE PREPARE brand_fk_statement;

INSERT INTO brands (code, name, slug, status, sort_order)
VALUES ('alp-gozluk', 'ALP Gözlük', 'alp-gozluk', 'active', 10)
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), status = VALUES(status), sort_order = VALUES(sort_order);

INSERT INTO audiences (code, status, sort_order)
VALUES
  ('women', 'active', 10),
  ('men', 'active', 20),
  ('kids', 'active', 30),
  ('unisex', 'active', 40)
ON DUPLICATE KEY UPDATE status = VALUES(status), sort_order = VALUES(sort_order);

INSERT INTO audience_translations (audience_id, locale, name, slug)
SELECT id, 'tr',
  CASE code WHEN 'women' THEN 'Kadın' WHEN 'men' THEN 'Erkek' WHEN 'kids' THEN 'Çocuk' ELSE 'Unisex' END,
  CASE code WHEN 'women' THEN 'kadin' WHEN 'men' THEN 'erkek' WHEN 'kids' THEN 'cocuk' ELSE 'unisex' END
FROM audiences WHERE code IN ('women', 'men', 'kids', 'unisex')
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug);

INSERT INTO audience_translations (audience_id, locale, name, slug)
SELECT id, 'en',
  CASE code WHEN 'women' THEN 'Women' WHEN 'men' THEN 'Men' WHEN 'kids' THEN 'Kids' ELSE 'Unisex' END,
  code
FROM audiences WHERE code IN ('women', 'men', 'kids', 'unisex')
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug);

INSERT INTO attribute_groups (code, scope, selection_mode, filterable, status, sort_order)
VALUES
  ('product_type', 'product', 'single', 1, 'active', 10),
  ('frame_material', 'product', 'multiple', 1, 'active', 20),
  ('frame_shape', 'product', 'multiple', 1, 'active', 30),
  ('lens_feature', 'product', 'multiple', 1, 'active', 40),
  ('frame_color', 'variant', 'single', 1, 'active', 50),
  ('lens_color', 'variant', 'single', 1, 'active', 60),
  ('frame_size', 'variant', 'single', 1, 'active', 70)
ON DUPLICATE KEY UPDATE scope = VALUES(scope), selection_mode = VALUES(selection_mode), filterable = VALUES(filterable), status = VALUES(status), sort_order = VALUES(sort_order);

INSERT INTO attribute_group_translations (attribute_group_id, locale, name)
SELECT id, 'tr', CASE code
  WHEN 'product_type' THEN 'Ürün tipi' WHEN 'frame_material' THEN 'Çerçeve materyali'
  WHEN 'frame_shape' THEN 'Çerçeve formu' WHEN 'lens_feature' THEN 'Cam özelliği'
  WHEN 'frame_color' THEN 'Çerçeve rengi' WHEN 'lens_color' THEN 'Cam rengi' ELSE 'Çerçeve ölçüsü' END
FROM attribute_groups
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO attribute_group_translations (attribute_group_id, locale, name)
SELECT id, 'en', CASE code
  WHEN 'product_type' THEN 'Product type' WHEN 'frame_material' THEN 'Frame material'
  WHEN 'frame_shape' THEN 'Frame shape' WHEN 'lens_feature' THEN 'Lens feature'
  WHEN 'frame_color' THEN 'Frame color' WHEN 'lens_color' THEN 'Lens color' ELSE 'Frame size' END
FROM attribute_groups
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO attribute_values (attribute_group_id, code, swatch_value, status, sort_order)
SELECT ag.id, seed.code, seed.swatch_value, 'active', seed.sort_order
FROM attribute_groups ag
INNER JOIN (
  SELECT 'product_type' group_code, 'sunglasses' code, NULL swatch_value, 10 sort_order UNION ALL
  SELECT 'product_type', 'optical', NULL, 20 UNION ALL
  SELECT 'frame_material', 'acetate', NULL, 10 UNION ALL
  SELECT 'frame_material', 'metal', NULL, 20 UNION ALL
  SELECT 'frame_material', 'mixed', NULL, 30 UNION ALL
  SELECT 'frame_shape', 'square', NULL, 10 UNION ALL
  SELECT 'frame_shape', 'round', NULL, 20 UNION ALL
  SELECT 'frame_shape', 'cat-eye', NULL, 30 UNION ALL
  SELECT 'frame_shape', 'aviator', NULL, 40 UNION ALL
  SELECT 'lens_feature', 'polarized', NULL, 10 UNION ALL
  SELECT 'lens_feature', 'gradient', NULL, 20 UNION ALL
  SELECT 'lens_feature', 'mirrored', NULL, 30 UNION ALL
  SELECT 'lens_feature', 'photochromic', NULL, 40 UNION ALL
  SELECT 'frame_color', 'black', '#171717', 10 UNION ALL
  SELECT 'frame_color', 'tortoise', '#6f4b32', 20 UNION ALL
  SELECT 'frame_color', 'gold', '#b08d57', 30 UNION ALL
  SELECT 'lens_color', 'black', '#171717', 10 UNION ALL
  SELECT 'lens_color', 'brown', '#654321', 20 UNION ALL
  SELECT 'lens_color', 'green', '#314b3a', 30 UNION ALL
  SELECT 'frame_size', 'small', NULL, 10 UNION ALL
  SELECT 'frame_size', 'medium', NULL, 20 UNION ALL
  SELECT 'frame_size', 'large', NULL, 30
) seed ON seed.group_code = ag.code
ON DUPLICATE KEY UPDATE swatch_value = VALUES(swatch_value), status = VALUES(status), sort_order = VALUES(sort_order);

INSERT INTO attribute_value_translations (attribute_value_id, locale, name, slug)
SELECT av.id, 'tr', CASE av.code
  WHEN 'sunglasses' THEN 'Güneş gözlüğü' WHEN 'optical' THEN 'Optik çerçeve'
  WHEN 'acetate' THEN 'Asetat / kemik' WHEN 'metal' THEN 'Metal' WHEN 'mixed' THEN 'Karma materyal'
  WHEN 'square' THEN 'Kare' WHEN 'round' THEN 'Yuvarlak' WHEN 'cat-eye' THEN 'Kedi gözü' WHEN 'aviator' THEN 'Pilot'
  WHEN 'polarized' THEN 'Polarize' WHEN 'gradient' THEN 'Degrade' WHEN 'mirrored' THEN 'Aynalı' WHEN 'photochromic' THEN 'Fotokromik'
  WHEN 'black' THEN 'Siyah' WHEN 'tortoise' THEN 'Havana' WHEN 'gold' THEN 'Altın' WHEN 'brown' THEN 'Kahverengi'
  WHEN 'green' THEN 'Yeşil' WHEN 'small' THEN 'Küçük' WHEN 'medium' THEN 'Orta' WHEN 'large' THEN 'Büyük' ELSE av.code END,
  CASE av.code WHEN 'sunglasses' THEN 'gunes-gozlugu' WHEN 'optical' THEN 'optik' WHEN 'acetate' THEN 'asetat-kemik'
    WHEN 'cat-eye' THEN 'kedi-gozu' WHEN 'photochromic' THEN 'fotokromik' WHEN 'tortoise' THEN 'havana'
    WHEN 'brown' THEN 'kahverengi' WHEN 'green' THEN 'yesil' WHEN 'small' THEN 'kucuk' WHEN 'medium' THEN 'orta' WHEN 'large' THEN 'buyuk'
    ELSE av.code END
FROM attribute_values av
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug);

INSERT INTO attribute_value_translations (attribute_value_id, locale, name, slug)
SELECT av.id, 'en', REPLACE(CONCAT(UCASE(LEFT(av.code, 1)), SUBSTRING(av.code, 2)), '-', ' '), av.code
FROM attribute_values av
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug);

INSERT INTO navigation_menus (code, location, status)
VALUES ('header-main', 'header', 'active')
ON DUPLICATE KEY UPDATE location = VALUES(location), status = VALUES(status);

INSERT INTO navigation_items (menu_id, code, item_type, audience_id, custom_url, sort_order, status)
SELECT nm.id, seed.code, seed.item_type, a.id, seed.custom_url, seed.sort_order, 'active'
FROM navigation_menus nm
CROSS JOIN (
  SELECT 'women' code, 'group' item_type, 'women' audience_code, '/shop/kadin' custom_url, 10 sort_order UNION ALL
  SELECT 'men', 'group', 'men', '/shop/erkek', 20 UNION ALL
  SELECT 'kids', 'group', 'kids', '/shop/cocuk', 30 UNION ALL
  SELECT 'collections', 'group', NULL, '/collection', 40 UNION ALL
  SELECT 'sale', 'link', NULL, '/shop?sale=true', 50
) seed
LEFT JOIN audiences a ON a.code = seed.audience_code
WHERE nm.code = 'header-main'
ON DUPLICATE KEY UPDATE item_type = VALUES(item_type), audience_id = VALUES(audience_id), custom_url = VALUES(custom_url), sort_order = VALUES(sort_order), status = VALUES(status);

INSERT INTO navigation_item_translations (navigation_item_id, locale, label, description, href)
SELECT ni.id, 'tr',
  CASE ni.code WHEN 'women' THEN 'Kadın' WHEN 'men' THEN 'Erkek' WHEN 'kids' THEN 'Çocuk' WHEN 'collections' THEN 'Koleksiyonlar' ELSE 'İndirim' END,
  NULL,
  CASE ni.code WHEN 'women' THEN '/shop/kadin' WHEN 'men' THEN '/shop/erkek' WHEN 'kids' THEN '/shop/cocuk'
    WHEN 'collections' THEN '/collection/yaz-seckisi' ELSE '/shop?sale=true' END
FROM navigation_items ni INNER JOIN navigation_menus nm ON nm.id = ni.menu_id WHERE nm.code = 'header-main'
ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description), href = VALUES(href);

INSERT INTO navigation_item_translations (navigation_item_id, locale, label, description, href)
SELECT ni.id, 'en',
  CASE ni.code WHEN 'women' THEN 'Women' WHEN 'men' THEN 'Men' WHEN 'kids' THEN 'Kids' WHEN 'collections' THEN 'Collections' ELSE 'Sale' END,
  NULL,
  CASE ni.code WHEN 'women' THEN '/shop/women' WHEN 'men' THEN '/shop/men' WHEN 'kids' THEN '/shop/kids'
    WHEN 'collections' THEN '/collection/summer-edit' ELSE '/shop?sale=true' END
FROM navigation_items ni INNER JOIN navigation_menus nm ON nm.id = ni.menu_id WHERE nm.code = 'header-main'
ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description), href = VALUES(href);

INSERT INTO collections (code, status, sort_order)
VALUES
  ('summer-edit', 'active', 10),
  ('four-seasons', 'active', 20),
  ('polarized-edit', 'active', 30)
ON DUPLICATE KEY UPDATE status = VALUES(status), sort_order = VALUES(sort_order);

INSERT INTO collection_translations (collection_id, locale, name, slug, description)
SELECT id, 'tr',
  CASE code WHEN 'summer-edit' THEN 'Yaz seçkisi' WHEN 'four-seasons' THEN 'Dört mevsim' ELSE 'Polarize seçki' END,
  CASE code WHEN 'summer-edit' THEN 'yaz-seckisi' WHEN 'four-seasons' THEN 'dort-mevsim' ELSE 'polarize' END,
  CASE code WHEN 'summer-edit' THEN 'Güneşli günler için seçilen çerçeveler.' WHEN 'four-seasons' THEN 'Her mevsime uyum sağlayan zamansız modeller.' ELSE 'Yansımayı azaltmaya yardımcı polarize modeller.' END
FROM collections WHERE code IN ('summer-edit', 'four-seasons', 'polarized-edit')
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), description = VALUES(description);

INSERT INTO collection_translations (collection_id, locale, name, slug, description)
SELECT id, 'en',
  CASE code WHEN 'summer-edit' THEN 'Summer edit' WHEN 'four-seasons' THEN 'Four seasons' ELSE 'Polarized edit' END,
  code,
  CASE code WHEN 'summer-edit' THEN 'Frames selected for brighter days.' WHEN 'four-seasons' THEN 'Timeless frames made for every season.' ELSE 'Polarized styles designed to help reduce glare.' END
FROM collections WHERE code IN ('summer-edit', 'four-seasons', 'polarized-edit')
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), description = VALUES(description);

INSERT INTO navigation_items (menu_id, parent_id, code, item_type, column_position, sort_order, status)
SELECT nm.id, root.id, CONCAT(root.code, '-', seed.suffix), 'group', seed.column_position, seed.sort_order, 'active'
FROM navigation_menus nm
INNER JOIN navigation_items root ON root.menu_id = nm.id AND root.code IN ('women', 'men', 'kids')
CROSS JOIN (
  SELECT 'highlights' suffix, 1 column_position, 10 sort_order UNION ALL
  SELECT 'types', 2, 20 UNION ALL
  SELECT 'styles', 3, 30
) seed
WHERE nm.code = 'header-main'
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id), item_type = VALUES(item_type), column_position = VALUES(column_position), sort_order = VALUES(sort_order), status = VALUES(status);

INSERT INTO navigation_item_translations (navigation_item_id, locale, label)
SELECT ni.id, 'tr', CASE
  WHEN ni.code LIKE '%-highlights' THEN 'Öne çıkanlar'
  WHEN ni.code LIKE '%-types' THEN 'Ürün tipi'
  ELSE 'Çerçeve ve cam' END
FROM navigation_items ni INNER JOIN navigation_menus nm ON nm.id = ni.menu_id
WHERE nm.code = 'header-main' AND ni.item_type = 'group' AND ni.parent_id IS NOT NULL
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO navigation_item_translations (navigation_item_id, locale, label)
SELECT ni.id, 'en', CASE
  WHEN ni.code LIKE '%-highlights' THEN 'Highlights'
  WHEN ni.code LIKE '%-types' THEN 'Product type'
  ELSE 'Frame and lens' END
FROM navigation_items ni INNER JOIN navigation_menus nm ON nm.id = ni.menu_id
WHERE nm.code = 'header-main' AND ni.item_type = 'group' AND ni.parent_id IS NOT NULL
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO navigation_items (menu_id, parent_id, code, item_type, column_position, sort_order, status)
SELECT nm.id, group_item.id, CONCAT(root.code, '-', seed.suffix), 'link', group_item.column_position, seed.sort_order, 'active'
FROM navigation_menus nm
INNER JOIN navigation_items root ON root.menu_id = nm.id AND root.code IN ('women', 'men', 'kids')
CROSS JOIN (
  SELECT 'highlights' group_suffix, 'all' suffix, 10 sort_order UNION ALL
  SELECT 'highlights', 'new', 20 UNION ALL
  SELECT 'highlights', 'sale', 30 UNION ALL
  SELECT 'types', 'sunglasses', 10 UNION ALL
  SELECT 'types', 'optical', 20 UNION ALL
  SELECT 'styles', 'acetate', 10 UNION ALL
  SELECT 'styles', 'metal', 20 UNION ALL
  SELECT 'styles', 'polarized', 30
) seed
INNER JOIN navigation_items group_item
  ON group_item.menu_id = nm.id AND group_item.code = CONCAT(root.code, '-', seed.group_suffix)
WHERE nm.code = 'header-main'
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id), item_type = VALUES(item_type), column_position = VALUES(column_position), sort_order = VALUES(sort_order), status = VALUES(status);

INSERT INTO navigation_item_translations (navigation_item_id, locale, label, href)
SELECT leaf.id, 'tr',
  CASE
    WHEN leaf.code LIKE '%-all' THEN 'Tüm ürünler' WHEN leaf.code LIKE '%-new' THEN 'Yeni gelenler'
    WHEN leaf.code LIKE '%-sale' THEN 'İndirimdekiler' WHEN leaf.code LIKE '%-sunglasses' THEN 'Güneş gözlükleri'
    WHEN leaf.code LIKE '%-optical' THEN 'Optik çerçeveler' WHEN leaf.code LIKE '%-acetate' THEN 'Asetat / kemik'
    WHEN leaf.code LIKE '%-metal' THEN 'Metal çerçeveler' ELSE 'Polarize' END,
  CONCAT(
    CASE root.code WHEN 'women' THEN '/shop/kadin' WHEN 'men' THEN '/shop/erkek' ELSE '/shop/cocuk' END,
    CASE
      WHEN leaf.code LIKE '%-new' THEN '?sort=newest' WHEN leaf.code LIKE '%-sale' THEN '?sale=true'
      WHEN leaf.code LIKE '%-sunglasses' THEN '/gunes-gozlugu' WHEN leaf.code LIKE '%-optical' THEN '/optik'
      WHEN leaf.code LIKE '%-acetate' THEN '?material=acetate' WHEN leaf.code LIKE '%-metal' THEN '?material=metal'
      WHEN leaf.code LIKE '%-polarized' THEN '?feature=polarized' ELSE '' END
  )
FROM navigation_items leaf
INNER JOIN navigation_items parent_group ON parent_group.id = leaf.parent_id
INNER JOIN navigation_items root ON root.id = parent_group.parent_id
INNER JOIN navigation_menus nm ON nm.id = leaf.menu_id
WHERE nm.code = 'header-main' AND leaf.item_type = 'link' AND root.code IN ('women', 'men', 'kids')
ON DUPLICATE KEY UPDATE label = VALUES(label), href = VALUES(href);

INSERT INTO navigation_item_translations (navigation_item_id, locale, label, href)
SELECT leaf.id, 'en',
  CASE
    WHEN leaf.code LIKE '%-all' THEN 'Shop all' WHEN leaf.code LIKE '%-new' THEN 'New arrivals'
    WHEN leaf.code LIKE '%-sale' THEN 'Sale' WHEN leaf.code LIKE '%-sunglasses' THEN 'Sunglasses'
    WHEN leaf.code LIKE '%-optical' THEN 'Optical frames' WHEN leaf.code LIKE '%-acetate' THEN 'Acetate frames'
    WHEN leaf.code LIKE '%-metal' THEN 'Metal frames' ELSE 'Polarized' END,
  CONCAT(
    CASE root.code WHEN 'women' THEN '/shop/women' WHEN 'men' THEN '/shop/men' ELSE '/shop/kids' END,
    CASE
      WHEN leaf.code LIKE '%-new' THEN '?sort=newest' WHEN leaf.code LIKE '%-sale' THEN '?sale=true'
      WHEN leaf.code LIKE '%-sunglasses' THEN '/sunglasses' WHEN leaf.code LIKE '%-optical' THEN '/optical'
      WHEN leaf.code LIKE '%-acetate' THEN '?material=acetate' WHEN leaf.code LIKE '%-metal' THEN '?material=metal'
      WHEN leaf.code LIKE '%-polarized' THEN '?feature=polarized' ELSE '' END
  )
FROM navigation_items leaf
INNER JOIN navigation_items parent_group ON parent_group.id = leaf.parent_id
INNER JOIN navigation_items root ON root.id = parent_group.parent_id
INNER JOIN navigation_menus nm ON nm.id = leaf.menu_id
WHERE nm.code = 'header-main' AND leaf.item_type = 'link' AND root.code IN ('women', 'men', 'kids')
ON DUPLICATE KEY UPDATE label = VALUES(label), href = VALUES(href);

INSERT INTO navigation_items (menu_id, parent_id, code, item_type, column_position, sort_order, status)
SELECT nm.id, root.id, CONCAT('collection-', c.code), 'link', 1, c.sort_order, 'active'
FROM navigation_menus nm
INNER JOIN navigation_items root ON root.menu_id = nm.id AND root.code = 'collections'
CROSS JOIN collections c
WHERE nm.code = 'header-main' AND c.code IN ('summer-edit', 'four-seasons', 'polarized-edit')
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id), item_type = VALUES(item_type), column_position = VALUES(column_position), sort_order = VALUES(sort_order), status = VALUES(status);

INSERT INTO navigation_item_translations (navigation_item_id, locale, label, href)
SELECT ni.id, ct.locale, ct.name, CONCAT('/collection/', ct.slug)
FROM navigation_items ni
INNER JOIN collections c ON ni.code = CONCAT('collection-', c.code)
INNER JOIN collection_translations ct ON ct.collection_id = c.id
INNER JOIN navigation_menus nm ON nm.id = ni.menu_id
WHERE nm.code = 'header-main'
ON DUPLICATE KEY UPDATE label = VALUES(label), href = VALUES(href);

INSERT INTO permissions (code, name)
VALUES
  ('catalog.manage', 'Katalog taksonomisi yönetimi'),
  ('navigation.manage', 'Site navigasyonu yönetimi')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'admin' AND p.code IN ('catalog.manage', 'navigation.manage');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'editor' AND p.code IN ('catalog.manage', 'navigation.manage');
