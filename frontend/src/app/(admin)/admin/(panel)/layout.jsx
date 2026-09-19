import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/sidebar';
import MobileAdminHeader from '@/components/admin/mobile-header';
import { getSessionUser } from '@/lib/server-api';

export default async function AdminPanelLayout({ children }) {
  const user = await getSessionUser();
  if (!user || !user.roles?.some((role) => ['admin', 'super_admin'].includes(role))) redirect('/admin/login');
  return <div className="flex min-h-svh bg-background"><AdminSidebar user={user} /><div className="min-w-0 flex-1"><MobileAdminHeader /><main className="mx-auto w-full max-w-[90rem] p-4 sm:p-6 lg:p-8">{children}</main></div></div>;
}
