import { jsonError, reportDatabaseError } from '@/lib/api';
import { getAdminSession } from '@/lib/auth';
import { writerPool } from '@/lib/db';

export async function GET() {
  if (!await getAdminSession()) return jsonError('Autenticação necessária.', 401);
  try {
    const result = await writerPool().query(`
      SELECT id, name, phone, message, created_at, read_at
      FROM contact_messages
      ORDER BY created_at DESC
      LIMIT 200
    `);
    return Response.json(result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      message: row.message,
      createdAt: row.created_at,
      readAt: row.read_at,
    })));
  } catch (error) {
    return reportDatabaseError('admin-messages-list', error);
  }
}
