-- Google kimliklerini kullanıcı hesaplarına güvenli şekilde bağlar.

ALTER TABLE users
  MODIFY password_hash VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS user_auth_identities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_subject VARCHAR(255) NOT NULL,
  provider_email VARCHAR(190) NULL,
  last_used_at DATETIME(6) NOT NULL DEFAULT UTC_TIMESTAMP(6),
  created_at DATETIME(6) NOT NULL DEFAULT UTC_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT UTC_TIMESTAMP(6) ON UPDATE UTC_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_auth_provider_subject (provider, provider_subject),
  UNIQUE KEY uq_user_auth_user_provider (user_id, provider),
  KEY idx_user_auth_provider_email (provider, provider_email),
  CONSTRAINT fk_user_auth_identities_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
