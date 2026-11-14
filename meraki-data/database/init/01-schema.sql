CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  model text NOT NULL,
  compatibility text NOT NULL DEFAULT '',
  voltage text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category_id text NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

INSERT INTO categories (name, description) VALUES
  ('Compressores', 'Compressores para sistemas de ar-condicionado automotivo.'),
  ('Condensadores', 'Condensadores e componentes para refrigeração automotiva.'),
  ('Filtros secadores', 'Filtros secadores para diversos sistemas automotivos.'),
  ('Mangueiras', 'Mangueiras e conexões para ar-condicionado automotivo.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, model, compatibility, voltage, description, category_id)
SELECT 'Compressor Sanden', 'Sanden 7H15', 'American 7H15 A2 12V Flex', '12V',
       'Compressor para sistemas de ar-condicionado automotivo. Consulte compatibilidade e aplicação com nossa equipe antes de fechar o pedido.',
       categories.id
FROM categories
WHERE categories.name = 'Compressores'
  AND NOT EXISTS (SELECT 1 FROM products WHERE model = 'Sanden 7H15');

INSERT INTO app_settings (key, value)
VALUES ('contact_phone', '(61) 98167-1870')
ON CONFLICT (key) DO NOTHING;

SELECT format('GRANT CONNECT ON DATABASE %I TO meraki_catalog_reader', current_database())
\gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO meraki_data', current_database())
\gexec
GRANT USAGE ON SCHEMA public TO meraki_catalog_reader;
GRANT SELECT ON TABLE categories, products, app_settings TO meraki_catalog_reader;
GRANT USAGE ON SCHEMA public TO meraki_data;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE categories, products, app_settings TO meraki_data;
