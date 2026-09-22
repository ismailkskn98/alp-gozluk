-- Daha önce 001 migration'ını çalıştıran ortamlar içindir.
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS link_underline TINYINT(1) NOT NULL DEFAULT 1 AFTER link_url;

