const codePattern = /^[a-z0-9][a-z0-9_-]{1,99}$/;
const urlPattern = /^\/(?!\/)[^\s]{0,499}$/;

const normalizeNavigationPayload = (body = {}) => {
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) return null;
  const seenCodes = new Set();
  const items = [];

  for (const rawItem of body.items) {
    const code = String(rawItem.code || '').trim().toLowerCase();
    const parentCode = rawItem.parentCode ? String(rawItem.parentCode).trim().toLowerCase() : null;
    const itemType = String(rawItem.itemType || 'link').trim();
    const customUrl = rawItem.customUrl ? String(rawItem.customUrl).trim() : null;
    const columnPosition = Number(rawItem.columnPosition ?? 1);
    const sortOrder = Number(rawItem.sortOrder ?? 0);
    const status = String(rawItem.status || 'active').trim();
    if (!codePattern.test(code) || seenCodes.has(code) || (parentCode && !codePattern.test(parentCode))) return null;
    if (!['link', 'group', 'promo'].includes(itemType) || !['active', 'inactive'].includes(status)) return null;
    if (customUrl && !urlPattern.test(customUrl)) return null;
    if (!Number.isInteger(columnPosition) || columnPosition < 1 || columnPosition > 4) return null;
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100000) return null;

    const translations = Array.isArray(rawItem.translations)
      ? rawItem.translations.map((translation) => ({
        locale: String(translation.locale || '').trim().toLowerCase(),
        label: String(translation.label || '').trim(),
        description: translation.description ? String(translation.description).trim().slice(0, 320) : null,
        href: translation.href ? String(translation.href).trim() : null,
      }))
      : [];
    if (!translations.some((translation) => translation.locale === 'tr' && translation.label.length >= 2)) return null;
    if (translations.some((translation) =>
      !['tr', 'en'].includes(translation.locale) || translation.label.length < 2 || translation.label.length > 160 ||
      (translation.href && !urlPattern.test(translation.href))
    )) return null;

    seenCodes.add(code);
    items.push({ code, parentCode, itemType, customUrl, columnPosition, sortOrder, status, translations });
  }

  if (items.some((item) => item.parentCode && !seenCodes.has(item.parentCode))) return null;
  const parentByCode = new Map(items.map((item) => [item.code, item.parentCode]));
  for (const item of items) {
    const visited = new Set([item.code]);
    let parentCode = item.parentCode;
    while (parentCode) {
      if (visited.has(parentCode)) return null;
      visited.add(parentCode);
      parentCode = parentByCode.get(parentCode);
    }
  }
  return { items };
};

module.exports = { normalizeNavigationPayload };
