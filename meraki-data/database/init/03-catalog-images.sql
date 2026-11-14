ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS image_url text;
