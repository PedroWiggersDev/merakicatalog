import { redirect } from 'next/navigation';

import { AdminWorkspace } from '@/components/admin-workspace';
import { getAdminSession } from '@/lib/auth';

export const instant = false;

export default async function AdminPage() {
  const email = await getAdminSession();
  if (!email) redirect('/login');
  return <AdminWorkspace email={email} />;
}
