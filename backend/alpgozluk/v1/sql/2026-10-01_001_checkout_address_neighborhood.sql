ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100) NULL AFTER district;

ALTER TABLE order_addresses
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100) NULL AFTER district;
