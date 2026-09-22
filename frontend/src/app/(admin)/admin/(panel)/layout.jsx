import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/shell';
import { getSessionUser } from '@/lib/server-api';

export default async function AdminPanelLayout({ children }) {
  const user = await getSessionUser();
  if (!user || !user.roles?.some((role) => ['admin', 'editor', 'super_admin'].includes(role))) redirect('/admin/login');
  const compact = (await cookies()).get('alp_admin_sidebar')?.value === 'compact';
  return <AdminShell user={user} initialCompact={compact}>{children}</AdminShell>;
}
