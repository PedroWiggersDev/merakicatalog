import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const cookieName = 'meraki_admin_session';
const sessionDurationSeconds = 60 * 60 * 12;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function signature(payload: string): string {
  const secret = requiredEnv('SESSION_SECRET');
  if (secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.');
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isValidAdminCredentials(email: string, password: string): boolean {
  const configuredEmail = requiredEnv('ADMIN_EMAIL').trim().toLowerCase();
  const configuredPassword = requiredEnv('ADMIN_PASSWORD');
  return safeEqual(email.trim().toLowerCase(), configuredEmail) &&
    safeEqual(password, configuredPassword);
}

export function createSession(email: string): { token: string; maxAge: number } {
  const payload = Buffer.from(JSON.stringify({
    email,
    expiresAt: Date.now() + sessionDurationSeconds * 1000,
  })).toString('base64url');
  return { token: `${payload}.${signature(payload)}`, maxAge: sessionDurationSeconds };
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, providedSignature, ...extra] = token.split('.');
  if (!payload || !providedSignature || extra.length > 0) return null;

  try {
    if (!safeEqual(providedSignature, signature(payload))) return null;
    const data: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      typeof data !== 'object' ||
      data === null ||
      !('email' in data) ||
      typeof data.email !== 'string' ||
      !('expiresAt' in data) ||
      typeof data.expiresAt !== 'number' ||
      data.expiresAt <= Date.now()
    ) return null;
    return data.email;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(cookieName)?.value);
}

export async function requireAdmin(): Promise<string | null> {
  return getAdminSession();
}

export const sessionCookie = cookieName;
