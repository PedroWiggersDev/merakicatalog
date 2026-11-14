import { authorizeMutation, isRecord, jsonError, readJson, reportDatabaseError } from '@/lib/api';
import { getAdminSession } from '@/lib/auth';
import { writerPool } from '@/lib/db';

export async function GET() {
  if (!await getAdminSession()) return jsonError('Autenticação necessária.', 401);
  try {
    const result = await writerPool().query("SELECT value FROM app_settings WHERE key = 'contact_phone'");
    return Response.json({ contactPhone: result.rows[0]?.value ?? '' });
  } catch (error) {
    return reportDatabaseError('admin-settings-read', error);
  }
}

export async function PATCH(request: Request) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (body.response) return body.response;
  if (!isRecord(body.value) || typeof body.value.contactPhone !== 'string') {
    return jsonError('Informe um telefone de contato.', 400);
  }
  const phone = body.value.contactPhone.trim();
  if (phone.length < 8 || phone.length > 30 || !/^[+()\d\s.-]+$/.test(phone)) {
    return jsonError('Informe um telefone válido.', 400);
  }

  try {
    const result = await writerPool().query(`
      INSERT INTO app_settings (key, value) VALUES ('contact_phone', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      RETURNING value
    `, [phone]);
    return Response.json({ contactPhone: result.rows[0].value });
  } catch (error) {
    return reportDatabaseError('admin-settings-update', error);
  }
}
