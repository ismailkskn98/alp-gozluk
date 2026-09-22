-- Sepet seçimi, fiyat değişikliği takibi, kupon ve güvenli/idempotent sepet birleştirme alanları.
-- MariaDB 10.6 ve 11.4 ile uyumludur; ikinci kez çalıştırılabilir.

DELIMITER $$

DROP PROCEDURE IF EXISTS alp_apply_cart_favorites_006$$
CREATE PROCEDURE alp_apply_cart_favorites_006()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND COLUMN_NAME = 'coupon_id'
  ) THEN
    ALTER TABLE carts ADD COLUMN coupon_id BIGINT UNSIGNED NULL AFTER currency;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND COLUMN_NAME = 'merged_into_cart_id'
  ) THEN
    ALTER TABLE carts ADD COLUMN merged_into_cart_id BIGINT UNSIGNED NULL AFTER status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND COLUMN_NAME = 'merged_at'
  ) THEN
    ALTER TABLE carts ADD COLUMN merged_at DATETIME(6) NULL AFTER merged_into_cart_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND COLUMN_NAME = 'active_user_id'
  ) THEN
    -- user_id ON DELETE SET NULL olduğu için MariaDB PERSISTENT generated column kabul etmez.
    ALTER TABLE carts
      ADD COLUMN active_user_id BIGINT UNSIGNED
      GENERATED ALWAYS AS (CASE WHEN status = 'active' THEN user_id ELSE NULL END) VIRTUAL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND INDEX_NAME = 'uq_carts_one_active_user'
  ) THEN
    ALTER TABLE carts ADD UNIQUE KEY uq_carts_one_active_user (active_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND INDEX_NAME = 'idx_carts_merged_into'
  ) THEN
    ALTER TABLE carts ADD KEY idx_carts_merged_into (merged_into_cart_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND CONSTRAINT_NAME = 'fk_carts_coupon'
  ) THEN
    ALTER TABLE carts ADD CONSTRAINT fk_carts_coupon
      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND CONSTRAINT_NAME = 'fk_carts_merged_into'
  ) THEN
    ALTER TABLE carts ADD CONSTRAINT fk_carts_merged_into
      FOREIGN KEY (merged_into_cart_id) REFERENCES carts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'is_selected'
  ) THEN
    ALTER TABLE cart_items ADD COLUMN is_selected TINYINT(1) NOT NULL DEFAULT 1 AFTER quantity;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'unit_price_snapshot'
  ) THEN
    ALTER TABLE cart_items ADD COLUMN unit_price_snapshot DECIMAL(12,2) NULL AFTER is_selected;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items'
      AND COLUMN_NAME = 'unit_price_snapshot' AND IS_NULLABLE = 'YES'
  ) THEN
    UPDATE cart_items ci
    INNER JOIN product_variants pv ON pv.id = ci.variant_id
    SET ci.unit_price_snapshot = pv.price
    WHERE ci.unit_price_snapshot IS NULL;

    ALTER TABLE cart_items MODIFY COLUMN unit_price_snapshot DECIMAL(12,2) NOT NULL;
  END IF;
END$$

CALL alp_apply_cart_favorites_006()$$
DROP PROCEDURE alp_apply_cart_favorites_006$$

DELIMITER ;
