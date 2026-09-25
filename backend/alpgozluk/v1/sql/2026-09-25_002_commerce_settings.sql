INSERT INTO site_settings (setting_key, setting_value, value_type, is_public)
VALUES
  ('commerce.dispatch_min_days', '1', 'integer', 1),
  ('commerce.dispatch_max_days', '3', 'integer', 1),
  ('commerce.return_window_days', '14', 'integer', 1)
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);
