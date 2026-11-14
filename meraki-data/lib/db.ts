import { Pool } from 'pg';

declare global {
  var merakiWriterPool: Pool | undefined;
  var merakiReaderPool: Pool | undefined;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function createPool(role: 'writer' | 'reader') {
  const isReader = role === 'reader';
  return new Pool({
    host: requiredEnv('DB_HOST'),
    port: Number(process.env.DB_PORT ?? '5432'),
    database: requiredEnv('DB_NAME'),
    user: requiredEnv(isReader ? 'DB_READER_USER' : 'DB_WRITER_USER'),
    password: requiredEnv(isReader ? 'DB_READER_PASSWORD' : 'DB_WRITER_PASSWORD'),
    max: isReader ? 12 : 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
    ...(isReader ? { options: '-c default_transaction_read_only=on' } : {}),
    application_name: isReader ? 'meraki-catalog-api' : 'meraki-data-admin',
  });
}

export function writerPool(): Pool {
  globalThis.merakiWriterPool ??= createPool('writer');
  return globalThis.merakiWriterPool;
}

export function readerPool(): Pool {
  globalThis.merakiReaderPool ??= createPool('reader');
  return globalThis.merakiReaderPool;
}
