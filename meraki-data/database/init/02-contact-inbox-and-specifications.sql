ALTER TABLE products
  ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE products
SET specifications = (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('property', legacy.property, 'value', legacy.value)),
    '[]'::jsonb
  )
  FROM (VALUES ('Compatibilidade', compatibility), ('Tensão', voltage)) AS legacy(property, value)
  WHERE btrim(legacy.value) <> ''
)
WHERE specifications = '[]'::jsonb
  AND (btrim(compatibility) <> '' OR btrim(voltage) <> '');

CREATE TABLE IF NOT EXISTS contact_messages (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON contact_messages (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE contact_messages TO meraki_data;
