import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const authCookieName = 'alp_access_token';

export function getApiUrl() {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error('API_URL yapılandırılmamış.');
  return apiUrl.replace(/\/$/, '');
}

export const getSessionUser = cache(async function getSessionUserForRequest() {
  const token = (await cookies()).get(authCookieName)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${getApiUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()).data?.user || null;
  } catch {
    return null;
  }
});

export async function getAccountOverview() {
  const token = (await cookies()).get(authCookieName)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${getApiUrl()}/account`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()).data || null;
  } catch {
    return null;
  }
}
