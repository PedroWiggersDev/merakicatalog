import { isRecord, jsonError, readJson, reportDatabaseError } from '@/lib/api';
import { writerPool } from '@/lib/db';

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body.response) return body.response;
  if (
    !isRecord(body.value) ||
    typeof body.value.name !== 'string' ||
    typeof body.value.phone !== 'string' ||
    typeof body.value.message !== 'string'
  ) return jsonError('Informe nome, telefone e mensagem.', 400);

  const name = body.value.name.trim();
  const phone = body.value.phone.trim();
  const message = body.value.message.trim();
  if (!name || name.length > 120 || !phone || phone.length > 40 || !message || message.length > 1000) {
    return jsonError('Confira os campos: nome, telefone e mensagem são obrigatórios.', 400);
  }

  try {
    const result = await writerPool().query(`
      INSERT INTO contact_messages (name, phone, message)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [name, phone, message]);
    return Response.json({ success: true, id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    return reportDatabaseError('public-contact-submit', error);
  }
}
