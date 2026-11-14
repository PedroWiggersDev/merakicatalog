import { NextResponse } from 'next/server';

import { getAdminSession } from '@/lib/auth';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function authorizeMutation(request: Request): Promise<Response | null> {
  if (!await getAdminSession()) return jsonError('Autenticação necessária.', 401);

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return jsonError('Origem da solicitação não autorizada.', 403);

  try {
    if (new URL(origin).host !== host) return jsonError('Origem da solicitação não autorizada.', 403);
  } catch {
    return jsonError('Origem da solicitação não autorizada.', 403);
  }

  return null;
}

export async function readJson(request: Request): Promise<{ value?: unknown; response?: Response }> {
  try {
    return { value: await request.json() };
  } catch {
    return { response: jsonError('Corpo JSON inválido.', 400) };
  }
}

export function reportDatabaseError(operation: string, error: unknown): Response {
  console.error(`[${operation}] Database request failed`, error);
  return jsonError('Não foi possível concluir a operação. Tente novamente.', 500);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
