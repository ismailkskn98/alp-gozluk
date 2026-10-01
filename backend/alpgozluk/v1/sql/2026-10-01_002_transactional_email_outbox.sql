-- Sipariş e-postalarını ödeme callback'inden bağımsız ve idempotent teslim etmek için outbox.
-- MariaDB 10.6 ve 11.4 ile uyumludur; ikinci kez çalıştırılabilir.

CREATE TABLE IF NOT EXISTS transactional_email_outbox (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  template VARCHAR(64) NOT NULL,
  recipient_email VARCHAR(190) NOT NULL,
  locale CHAR(2) NOT NULL DEFAULT 'tr',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(6) NULL,
  locked_at DATETIME(6) NULL,
  sent_at DATETIME(6) NULL,
  provider_message_id VARCHAR(255) NULL,
  last_error VARCHAR(500) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_transactional_email_order_template (order_id, template),
  KEY idx_transactional_email_delivery (status, next_attempt_at, created_at),
  CONSTRAINT fk_transactional_email_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
