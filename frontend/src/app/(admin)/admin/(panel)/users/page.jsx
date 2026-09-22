import { redirect } from 'next/navigation';
import AdminUserManagement from '@/components/admin/users';
import { getSessionUser } from '@/lib/server-api';

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user?.roles?.includes('super_admin')) redirect('/admin');
  return <AdminUserManagement />;
}
