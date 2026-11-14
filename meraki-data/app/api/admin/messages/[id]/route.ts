import { authorizeMutation, isRecord, jsonError, readJson, reportDatabaseError } from '@/lib/api';
import { writerPool } from '@/lib/db';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (body.response) return body.response;
  if (!isRecord(body.value) || typeof body.value.read !== 'boolean') {
    return jsonError('Informe se a mensagem foi lida.', 400);
  }
  const { id } = await context.params;
  try {
    const result = await writerPool().query(`
      UPDATE contact_messages
      SET read_at = CASE WHEN $1 THEN COALESCE(read_at, now()) ELSE NULL END
      WHERE id = $2
      RETURNING id
    `, [body.value.read, id]);
    if (!result.rows[0]) return jsonError('Mensagem não encontrada.', 404);
    return Response.json({ success: true });
  } catch (error) {
    return reportDatabaseError('admin-message-update', error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;
  const { id } = await context.params;
  try {
    const result = await writerPool().query('DELETE FROM contact_messages WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) return jsonError('Mensagem não encontrada.', 404);
    return Response.json({ success: true });
  } catch (error) {
    return reportDatabaseError('admin-message-delete', error);
  }
}
