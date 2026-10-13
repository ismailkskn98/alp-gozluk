const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const codePattern = /^[A-Z0-9][A-Z0-9_-]{1,79}$/i;

const validIdArray = (values, required = false) => (
  Array.isArray(values) && (!required || values.length > 0) &&
  values.every((id) => Number.isInteger(id) && id > 0) && new Set(values).size === values.length
);

const validOptionalText = (value, maxLength) => value === undefined || value === null || (
  typeof value === 'string' && value.trim().length <= maxLength
);

const validOptionalCountryCode = (value) => value === undefined || value === null || value === '' || (
  typeof value === 'string' && /^[A-Za-z]{2}$/.test(value.trim())
);

const validOptionalMeasurement = (value) => value === undefined || value === null || (
  Number.isFinite(value) && value > 0 && value <= 300
);

const validTranslation = (translation) => (
  translation &&
  ['tr', 'en'].includes(translation.locale) &&
  typeof translation.name === 'string' && translation.name.trim().length >= 2 && translation.name.trim().length <= 190 &&
  typeof translation.slug === 'string' && translation.slug.length <= 190 && slugPattern.test(translation.slug) &&
  validOptionalText(translation.shortDescription, 500) &&
  validOptionalText(translation.description, 20000) &&
  validOptionalText(translation.seoTitle, 190) &&
  validOptionalText(translation.seoDescription, 320)
);

const validVariant = (variant, allowVariantIds) => (
  variant &&
  (variant.id === undefined || (allowVariantIds && Number.isInteger(variant.id) && variant.id > 0)) &&
  typeof variant.sku === 'string' && variant.sku.trim().length >= 2 && variant.sku.trim().length <= 100 &&
  Number.isFinite(variant.price) && variant.price >= 0 &&
  (variant.compareAtPrice === undefined || variant.compareAtPrice === null || (Number.isFinite(variant.compareAtPrice) && variant.compareAtPrice >= 0)) &&
  Number.isInteger(variant.stockQuantity) && variant.stockQuantity >= 0 &&
  Number.isInteger(variant.lowStockThreshold) && variant.lowStockThreshold >= 0 && variant.lowStockThreshold <= 100000 &&
  ['barcode', 'colorCode', 'frameSize', 'lensType', 'lensCategory', 'uvProtection'].every((field) =>
    validOptionalText(variant[field], field === 'barcode' ? 100 : 80)
  ) &&
  ['lensWidthMm', 'bridgeWidthMm', 'templeLengthMm'].every((field) => validOptionalMeasurement(variant[field])) &&
  (variant.attributeValueIds === undefined || validIdArray(variant.attributeValueIds))
);

const validProductPayload = (body, { allowVariantIds = false } = {}) => {
  if (!body || typeof body !== 'object') return false;
  if (!codePattern.test(String(body.code || ''))) return false;
  if (!['draft', 'published', 'archived'].includes(body.status)) return false;
  if (typeof body.featured !== 'boolean') return false;
  if (!Number.isFinite(body.taxRate) || body.taxRate < 0 || body.taxRate > 100) return false;
  if (!validOptionalCountryCode(body.originCountryCode) || !validOptionalText(body.brand, 120)) return false;
  if (!Array.isArray(body.translations) || body.translations.length === 0) return false;
  if (new Set(body.translations.map((translation) => translation.locale)).size !== body.translations.length) return false;
  if (!body.translations.every(validTranslation)) return false;
  if (!validIdArray(body.audienceIds, true)) return false;
  if (body.brandId !== undefined && body.brandId !== null && (!Number.isInteger(body.brandId) || body.brandId <= 0)) return false;
  if (!['categoryIds', 'collectionIds', 'productAttributeValueIds'].every((field) =>
    body[field] === undefined || validIdArray(body[field])
  )) return false;
  if (!Array.isArray(body.variants) || body.variants.length === 0) return false;
  if (!body.variants.every((variant) => validVariant(variant, allowVariantIds))) return false;
  if (new Set(body.variants.map((variant) => variant.sku.trim())).size !== body.variants.length) return false;
  const variantIds = body.variants.filter((variant) => variant.id !== undefined).map((variant) => variant.id);
  return new Set(variantIds).size === variantIds.length;
};

module.exports = { validProductPayload };
