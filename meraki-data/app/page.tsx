import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/auth';

export const instant = false;

export default async function HomePage() {
  redirect(await getAdminSession() ? '/admin' : '/login');
}
