import { NextResponse } from 'next/server';

import { createSession, isValidAdminCredentials, sessionCookie } from '@/lib/auth';
import { isRecord, jsonError, readJson } from '@/lib/api';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return jsonError('Origem da solicitação não autorizada.', 403);
  try {
    if (new URL(origin).host !== host) return jsonError('Origem da solicitação não autorizada.', 403);
  } catch {
    return jsonError('Origem da solicitação não autorizada.', 403);
  }

  const body = await readJson(request);
  if (body.response) return body.response;
  if (!isRecord(body.value) || typeof body.value.email !== 'string' || typeof body.value.password !== 'string') {
    return jsonError('Informe e-mail e senha.', 400);
  }

  try {
    if (!isValidAdminCredentials(body.value.email, body.value.password)) {
      return jsonError('E-mail ou senha incorretos.', 401);
    }

    const session = createSession(body.value.email.trim().toLowerCase());
    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionCookie, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    console.error('[admin-login] Authentication is not configured correctly', error);
    return jsonError('Autenticação indisponível. Verifique a configuração do servidor.', 500);
  }
}
