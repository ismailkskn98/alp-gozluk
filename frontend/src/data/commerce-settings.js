import 'server-only';

const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

const defaults = {
  dispatchMinDays: 1,
  dispatchMaxDays: 3,
  returnWindowDays: 14,
};

export async function getCommerceSettings() {
  if (!apiUrl) return defaults;
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/settings/commerce`, {
      cache: 'no-store',
    });
    if (!response.ok) return defaults;
    return { ...defaults, ...(await response.json()).data?.settings };
  } catch {
    return defaults;
  }
}
