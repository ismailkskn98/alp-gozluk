-- Super admin koruması, yönetici rol atamaları ve TOTP kimlik bilgileri.

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS is_system TINYINT(1) NOT NULL DEFAULT 0 AFTER name,
  ADD COLUMN IF NOT EXISTS is_assignable TINYINT(1) NOT NULL DEFAULT 1 AFTER is_system;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_protected TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

CREATE TABLE IF NOT EXISTS user_totp_credentials (
  user_id BIGINT UNSIGNED NOT NULL,
  secret_encrypted VARCHAR(512) NOT NULL,
  recovery_codes_json LONGTEXT NULL,
  enabled_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_used_step BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_totp_credentials_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (code, name, is_system, is_assignable)
VALUES ('super_admin', 'Süper Yönetici', 1, 0)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  is_system = VALUES(is_system),
  is_assignable = VALUES(is_assignable);

UPDATE roles
SET is_system = 1,
    is_assignable = CASE WHEN code IN ('admin', 'editor') THEN 1 ELSE 0 END
WHERE code IN ('admin', 'editor', 'customer');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin';
