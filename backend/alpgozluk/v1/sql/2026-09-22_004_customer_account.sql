-- ALP Gözlük müşteri hesap alanı. Mevcut 10.6 MariaDB geliştirme ortamında güvenle uygulanabilir.

ALTER TABLE users
  ADD COLUMN birth_date DATE NULL AFTER phone,
  ADD COLUMN gender VARCHAR(24) NULL AFTER birth_date,
  ADD COLUMN marketing_email_opt_in TINYINT(1) NOT NULL DEFAULT 0 AFTER gender,
  ADD COLUMN marketing_sms_opt_in TINYINT(1) NOT NULL DEFAULT 0 AFTER marketing_email_opt_in;

CREATE TABLE IF NOT EXISTS customer_favorites (
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, product_id),
  KEY idx_customer_favorites_created (user_id, created_at),
  CONSTRAINT fk_customer_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer_favorites_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
