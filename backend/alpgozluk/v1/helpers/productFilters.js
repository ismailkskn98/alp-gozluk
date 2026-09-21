const filterCodePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const parseCodeList = (value) => {
  if (!value) return [];
  const values = String(value).split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (values.length > 10 || values.some((item) => !filterCodePattern.test(item))) return null;
  return [...new Set(values)];
};

const parseProductFilters = (query = {}) => {
  const audience = query.audience ? String(query.audience).trim().toLowerCase() : null;
  const productType = query.type ? String(query.type).trim().toLowerCase() : null;
  const category = query.category ? String(query.category).trim().toLowerCase() : null;
  const collection = query.collection ? String(query.collection).trim().toLowerCase() : null;
  const search = query.search ? String(query.search).trim().slice(0, 100) : '';
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 24);
  const sort = String(query.sort || 'featured').trim().toLowerCase();
  const material = parseCodeList(query.material);
  const shape = parseCodeList(query.shape);
  const feature = parseCodeList(query.feature);

  if (audience && !['women', 'men', 'kids', 'unisex'].includes(audience)) return null;
  if (productType && !filterCodePattern.test(productType)) return null;
  if (category && !filterCodePattern.test(category)) return null;
  if (collection && !filterCodePattern.test(collection)) return null;
  if (!Number.isInteger(page) || page < 1 || page > 10000) return null;
  if (!Number.isInteger(limit) || limit < 1 || limit > 60) return null;
  if (!['featured', 'newest', 'price-asc', 'price-desc', 'popular'].includes(sort)) return null;
  if (material === null || shape === null || feature === null) return null;

  return {
    audience,
    productType,
    category,
    collection,
    material,
    shape,
    feature,
    search,
    sale: String(query.sale || '').toLowerCase() === 'true',
    sort,
    page,
    limit,
  };
};

const resolveAudienceCodes = (audience) => (
  ['women', 'men'].includes(audience) ? [audience, 'unisex'] : [audience]
);

module.exports = { parseProductFilters, resolveAudienceCodes };
