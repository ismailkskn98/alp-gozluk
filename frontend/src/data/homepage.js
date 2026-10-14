import 'server-only';

const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

export async function fetchHomepageConfig() {
  if (!apiUrl) return null;
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/homepage`, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()).data?.config || null;
  } catch {
    return null;
  }
}
