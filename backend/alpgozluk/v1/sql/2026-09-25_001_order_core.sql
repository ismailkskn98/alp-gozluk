-- Ödeme sağlayıcısından bağımsız sipariş çekirdeği ve kısa süreli stok rezervasyonu.
-- MariaDB 10.6 ve 11.4 ile uyumludur; ikinci kez çalıştırılabilir.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source_cart_id BIGINT UNSIGNED NULL AFTER coupon_id,
  ADD COLUMN IF NOT EXISTS checkout_idempotency_key VARCHAR(190) NULL AFTER source_cart_id,
  ADD COLUMN IF NOT EXISTS guest_access_token_hash CHAR(64) NULL AFTER checkout_idempotency_key,
  ADD COLUMN IF NOT EXISTS customer_first_name VARCHAR(80) NULL AFTER total_amount,
  ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(80) NULL AFTER customer_first_name,
  ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(80) NULL AFTER customer_phone,
  ADD COLUMN IF NOT EXISTS shipping_method_code VARCHAR(64) NOT NULL DEFAULT 'standard' AFTER coupon_code,
  ADD COLUMN IF NOT EXISTS shipping_method_name VARCHAR(160) NOT NULL DEFAULT 'Standart teslimat' AFTER shipping_method_code,
  ADD COLUMN IF NOT EXISTS reservation_expires_at DATETIME(6) NULL AFTER notes,
  ADD COLUMN IF NOT EXISTS cancelled_at DATETIME(6) NULL AFTER reservation_expires_at,
  ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500) NULL AFTER cancelled_at,
  ADD UNIQUE KEY IF NOT EXISTS uq_orders_checkout_idempotency (checkout_idempotency_key),
  ADD KEY IF NOT EXISTS idx_orders_guest_access_token (guest_access_token_hash),
  ADD KEY IF NOT EXISTS idx_orders_reservation_expiry (status, reservation_expires_at),
  ADD KEY IF NOT EXISTS idx_orders_source_cart (source_cart_id);

UPDATE orders SET status = 'pending_payment' WHERE status = 'pending';

ALTER TABLE orders
  MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'pending_payment';

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS source_cart_item_id BIGINT UNSIGNED NULL AFTER variant_id,
  ADD COLUMN IF NOT EXISTS product_code VARCHAR(80) NULL AFTER variant_id,
  ADD COLUMN IF NOT EXISTS brand_name VARCHAR(160) NULL AFTER product_code,
  ADD COLUMN IF NOT EXISTS color_code VARCHAR(64) NULL AFTER sku,
  ADD COLUMN IF NOT EXISTS frame_size VARCHAR(64) NULL AFTER color_code,
  ADD COLUMN IF NOT EXISTS image_storage_key VARCHAR(500) NULL AFTER frame_size,
  ADD COLUMN IF NOT EXISTS image_storage_driver VARCHAR(20) NULL AFTER image_storage_key,
  ADD COLUMN IF NOT EXISTS image_alt_text VARCHAR(255) NULL AFTER image_storage_driver,
  ADD COLUMN IF NOT EXISTS unit_tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER unit_price,
  ADD KEY IF NOT EXISTS idx_order_items_source_cart_item (source_cart_item_id);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS attempt_number INT UNSIGNED NOT NULL DEFAULT 1 AFTER order_id,
  ADD COLUMN IF NOT EXISTS provider_token VARCHAR(500) NULL AFTER provider_payment_id,
  ADD COLUMN IF NOT EXISTS provider_conversation_id VARCHAR(190) NULL AFTER provider_token,
  ADD COLUMN IF NOT EXISTS provider_basket_id VARCHAR(190) NULL AFTER provider_conversation_id,
  ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER amount,
  ADD COLUMN IF NOT EXISTS expires_at DATETIME(6) NULL AFTER failure_message,
  ADD COLUMN IF NOT EXISTS completed_at DATETIME(6) NULL AFTER paid_at,
  ADD UNIQUE KEY IF NOT EXISTS uq_payments_order_attempt (order_id, attempt_number),
  ADD KEY IF NOT EXISTS idx_payments_provider_token (provider, provider_token);

CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  order_status VARCHAR(32) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  fulfillment_status VARCHAR(32) NOT NULL,
  source VARCHAR(40) NOT NULL,
  note VARCHAR(500) NULL,
  metadata_json LONGTEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_order_status_history_order_created (order_id, created_at),
  CONSTRAINT fk_order_status_history_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_status_history_user
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  expires_at DATETIME(6) NOT NULL,
  committed_at DATETIME(6) NULL,
  released_at DATETIME(6) NULL,
  release_reason VARCHAR(160) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_stock_reservations_order_variant (order_id, variant_id),
  KEY idx_stock_reservations_expiry (status, expires_at),
  KEY idx_stock_reservations_variant_status (variant_id, status),
  CONSTRAINT fk_stock_reservations_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_reservations_order_item
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_reservations_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  CONSTRAINT chk_stock_reservations_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
