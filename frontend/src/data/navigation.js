import 'server-only';

const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

export async function fetchHeaderNavigation(locale) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !apiUrl) return null;
  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, '')}/navigation/header?locale=${encodeURIComponent(locale)}`,
      { next: { revalidate: 600, tags: ['header-navigation'] } },
    );
    if (!response.ok) return null;
    return (await response.json()).data?.menu || null;
  } catch {
    return null;
  }
}
