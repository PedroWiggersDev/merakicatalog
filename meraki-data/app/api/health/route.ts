import { connection } from 'next/server';

import { writerPool } from '@/lib/db';

export async function GET() {
  await connection();
  try {
    await writerPool().query('SELECT 1');
    return Response.json({ status: 'ok' });
  } catch (error) {
    console.error('[health] Database check failed', error);
    return Response.json({ status: 'unavailable' }, { status: 503 });
  }
}
