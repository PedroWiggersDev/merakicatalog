import { NextResponse } from 'next/server';

import { authorizeMutation } from '@/lib/api';
import { sessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;

  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookie, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
