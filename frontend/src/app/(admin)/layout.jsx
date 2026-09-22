import { cookies } from 'next/headers';
import AdminThemeProvider from '@/components/admin/theme-provider';

export const metadata = {
  title: { default: 'Yönetim Paneli', template: '%s | ALP Yönetim' },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }) {
  const themeCookie = (await cookies()).get('alp_admin_theme')?.value;
  const initialTheme = themeCookie === 'dark' ? 'dark' : 'light';
  return <AdminThemeProvider initialTheme={initialTheme}>{children}</AdminThemeProvider>;
}
