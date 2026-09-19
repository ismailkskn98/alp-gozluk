'use client';

import { useRouter } from 'next/navigation';

export default function AccountLogout({ locale }) {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace(`/${locale}`);
    router.refresh();
  }
  return <button type="button" onClick={logout} className="mt-3 text-sm font-semibold text-primary hover:underline">{locale === 'tr' ? 'Çıkış yap' : 'Sign out'}</button>;
}
