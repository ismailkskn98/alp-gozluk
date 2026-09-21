const codePattern = /^[a-z0-9][a-z0-9_-]{1,99}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const resources = new Set([
  'audiences',
  'brands',
  'categories',
  'collections',
  'attribute-groups',
  'attribute-values',
]);

const toOptionalId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

const normalizeDateTime = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().replace('T', ' ');
  return /^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}(?::\d{2})?)?$/.test(normalized) ? normalized : undefined;
};

const normalizeTranslations = (translations, needsSlug = true) => {
  if (!Array.isArray(translations) || translations.length === 0) return null;

  const normalized = [];
  const locales = new Set();
  for (const translation of translations) {
    const locale = String(translation.locale || '').trim().toLowerCase();
    const name = String(translation.name || '').trim();
    const slug = String(translation.slug || '').trim().toLowerCase();
    if (!['tr', 'en'].includes(locale) || locales.has(locale) || name.length < 2 || name.length > 160) return null;
    if (needsSlug && !slugPattern.test(slug)) return null;
    locales.add(locale);
    normalized.push({ locale, name, slug: needsSlug ? slug : undefined });
  }

  return locales.has('tr') ? normalized : null;
};

const normalizeCatalogPayload = (resource, body = {}) => {
  if (!resources.has(resource)) return null;

  const code = String(body.code || '').trim().toLowerCase();
  const status = String(body.status || 'active').trim().toLowerCase();
  const sortOrder = Number(body.sortOrder ?? 0);
  if (!codePattern.test(code) || !['active', 'inactive', 'draft', 'archived'].includes(status)) return null;
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100000) return null;

  if (resource === 'brands') {
    const name = String(body.name || '').trim();
    const slug = String(body.slug || '').trim().toLowerCase();
    if (name.length < 2 || name.length > 160 || !slugPattern.test(slug)) return null;
    return { code, name, slug, status, sortOrder };
  }

  const translations = normalizeTranslations(body.translations, resource !== 'attribute-groups');
  if (!translations) return null;

  if (resource === 'audiences') return { code, status, sortOrder, translations };

  if (resource === 'categories') {
    const parentId = toOptionalId(body.parentId);
    if (parentId === undefined) return null;
    return { code, parentId, status, sortOrder, translations };
  }

  if (resource === 'collections') {
    const startsAt = normalizeDateTime(body.startsAt);
    const endsAt = normalizeDateTime(body.endsAt);
    if (startsAt === undefined || endsAt === undefined || (startsAt && endsAt && startsAt > endsAt)) return null;
    return { code, status, sortOrder, startsAt, endsAt, translations };
  }

  if (resource === 'attribute-groups') {
    const scope = String(body.scope || '').trim();
    const selectionMode = String(body.selectionMode || '').trim();
    if (!['product', 'variant'].includes(scope) || !['single', 'multiple'].includes(selectionMode)) return null;
    return { code, scope, selectionMode, filterable: body.filterable !== false, status, sortOrder, translations };
  }

  const groupId = toOptionalId(body.groupId);
  const swatchValue = body.swatchValue ? String(body.swatchValue).trim().slice(0, 40) : null;
  if (!groupId) return null;
  return { code, groupId, swatchValue, status, sortOrder, translations };
};

module.exports = { normalizeCatalogPayload, resources, slugPattern };
