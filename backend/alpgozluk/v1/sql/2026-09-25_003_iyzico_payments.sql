-- iyzico Direct API / zorunlu 3DS ödeme denemeleri ve mutabakat alanları.
-- PAN, CVC, kart sahibi adı veya 3DS HTML içeriği bu tablolarda saklanmaz.
-- MariaDB 10.6 ve 11.4 ile uyumludur; ikinci kez çalıştırılabilir.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS public_id CHAR(36) NULL AFTER id,
  ADD COLUMN IF NOT EXISTS base_amount DECIMAL(12,2) NULL AFTER refunded_amount,
  ADD COLUMN IF NOT EXISTS locale CHAR(2) NOT NULL DEFAULT 'tr' AFTER currency,
  ADD COLUMN IF NOT EXISTS installment TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER locale,
  ADD COLUMN IF NOT EXISTS payment_source VARCHAR(80) NULL AFTER installment,
  ADD COLUMN IF NOT EXISTS provider_status VARCHAR(40) NULL AFTER provider_basket_id,
  ADD COLUMN IF NOT EXISTS provider_error_group VARCHAR(100) NULL AFTER failure_message,
  ADD COLUMN IF NOT EXISTS md_status TINYINT NULL AFTER provider_error_group,
  ADD COLUMN IF NOT EXISTS fraud_status TINYINT NULL AFTER md_status,
  ADD COLUMN IF NOT EXISTS card_bin VARCHAR(8) NULL AFTER fraud_status,
  ADD COLUMN IF NOT EXISTS card_last_four CHAR(4) NULL AFTER card_bin,
  ADD COLUMN IF NOT EXISTS card_type VARCHAR(40) NULL AFTER card_last_four,
  ADD COLUMN IF NOT EXISTS card_association VARCHAR(40) NULL AFTER card_type,
  ADD COLUMN IF NOT EXISTS card_family VARCHAR(100) NULL AFTER card_association,
  ADD COLUMN IF NOT EXISTS callback_received_at DATETIME(6) NULL AFTER expires_at,
  ADD COLUMN IF NOT EXISTS signature_verified_at DATETIME(6) NULL AFTER callback_received_at,
  ADD COLUMN IF NOT EXISTS last_reconciled_at DATETIME(6) NULL AFTER signature_verified_at,
  ADD UNIQUE KEY IF NOT EXISTS uq_payments_public_id (public_id),
  ADD UNIQUE KEY IF NOT EXISTS uq_payments_provider_conversation (provider, provider_conversation_id),
  ADD KEY IF NOT EXISTS idx_payments_status_created (status, created_at);

UPDATE payments SET base_amount = amount WHERE base_amount IS NULL;

CREATE TABLE IF NOT EXISTS payment_item_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NULL,
  provider_item_id VARCHAR(190) NOT NULL,
  provider_transaction_id VARCHAR(190) NOT NULL,
  provider_status SMALLINT NULL,
  price DECIMAL(12,2) NOT NULL,
  paid_price DECIMAL(12,2) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_item_transactions_payment_item (payment_id, provider_item_id),
  UNIQUE KEY uq_payment_item_transactions_provider (provider_transaction_id),
  KEY idx_payment_item_transactions_order_item (order_item_id),
  CONSTRAINT fk_payment_item_transactions_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_item_transactions_order_item
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE payment_webhook_events
  ADD COLUMN IF NOT EXISTS payment_id BIGINT UNSIGNED NULL AFTER id,
  ADD COLUMN IF NOT EXISTS signature_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN IF NOT EXISTS processing_error VARCHAR(500) NULL AFTER signature_verified,
  ADD KEY IF NOT EXISTS idx_payment_webhook_payment (payment_id);
