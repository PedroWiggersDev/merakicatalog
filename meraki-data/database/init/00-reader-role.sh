#!/bin/bash
set -e

: "${MERAKI_CATALOG_DB_PASSWORD:?MERAKI_CATALOG_DB_PASSWORD must be set}"
: "${MERAKI_DATA_DB_PASSWORD:?MERAKI_DATA_DB_PASSWORD must be set}"

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=reader_password="$MERAKI_CATALOG_DB_PASSWORD" \
  --set=writer_password="$MERAKI_DATA_DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE meraki_data LOGIN PASSWORD %L', :'writer_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'meraki_data')
\gexec
ALTER ROLE meraki_data
  WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT
  PASSWORD :'writer_password';
SELECT format('CREATE ROLE meraki_catalog_reader LOGIN PASSWORD %L', :'reader_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'meraki_catalog_reader')
\gexec
ALTER ROLE meraki_catalog_reader
  WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT
  PASSWORD :'reader_password';
SQL
