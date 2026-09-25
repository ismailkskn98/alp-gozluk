const productService = require('../services/productService');
const { parseProductFilters } = require('../helpers/productFilters');

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

const validCreatePayload = (body) => (
  codePattern.test(String(body.code || '')) &&
  ['draft', 'published', 'archived'].includes(body.status) &&
  Number.isFinite(body.taxRate) && body.taxRate >= 0 && body.taxRate <= 100 &&
  validOptionalCountryCode(body.originCountryCode) &&
  Array.isArray(body.translations) && body.translations.length > 0 &&
  new Set(body.translations.map((translation) => translation.locale)).size === body.translations.length &&
  body.translations.every((translation) =>
    ['tr', 'en'].includes(translation.locale) &&
    String(translation.name || '').trim().length >= 2 &&
    slugPattern.test(String(translation.slug || ''))
  ) &&
  validIdArray(body.audienceIds, true) &&
  (!body.brandId || (Number.isInteger(body.brandId) && body.brandId > 0)) &&
  ['categoryIds', 'collectionIds', 'productAttributeValueIds'].every((field) =>
    body[field] === undefined || validIdArray(body[field])
  ) &&
  Array.isArray(body.variants) && body.variants.length > 0 &&
  new Set(body.variants.map((variant) => String(variant.sku || '').trim())).size === body.variants.length &&
  body.variants.every((variant) =>
    String(variant.sku || '').trim().length >= 2 && Number.isFinite(variant.price) && variant.price >= 0 &&
    (variant.compareAtPrice === undefined || variant.compareAtPrice === null || (Number.isFinite(variant.compareAtPrice) && variant.compareAtPrice >= 0)) &&
    Number.isInteger(variant.stockQuantity) && variant.stockQuantity >= 0 &&
    (variant.lowStockThreshold === undefined || (Number.isInteger(variant.lowStockThreshold) && variant.lowStockThreshold >= 0 && variant.lowStockThreshold <= 100000)) &&
    ['barcode', 'colorCode', 'frameSize', 'lensType', 'lensCategory', 'uvProtection'].every((field) =>
      validOptionalText(variant[field], field === 'barcode' ? 100 : 80)
    ) &&
    ['lensWidthMm', 'bridgeWidthMm', 'templeLengthMm'].every((field) => validOptionalMeasurement(variant[field])) &&
    (variant.attributeValueIds === undefined || validIdArray(variant.attributeValueIds))
  )
);

exports.list = async (req, res, next) => {
  try {
    const filters = parseProductFilters(req.query);
    if (!filters) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
    const result = await productService.listPublished(req.query.locale, filters);
    return res.json({ status: true, message: req.t('products.listed'), data: result });
  } catch (error) { next(error); }
};

exports.adminList = async (req, res, next) => {
  try {
    const products = await productService.listAdmin(req.query.locale);
    return res.json({ status: true, message: req.t('products.listed'), data: { products } });
  } catch (error) { return next(error); }
};

exports.detail = async (req, res, next) => {
  try {
    if (!slugPattern.test(req.params.slug)) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
    const product = await productService.findPublishedBySlug(req.query.locale, req.params.slug);
    if (!product) return res.status(404).json({ status: false, message: req.t('products.not_found') });
    return res.json({ status: true, message: req.t('products.found'), data: { product } });
  } catch (error) { return next(error); }
};

exports.create = async (req, res, next) => {
  try {
    if (!validCreatePayload(req.body)) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
    const id = await productService.create(req.body, { userId: req.user.id, requestId: req.requestId, ip: req.ip || '' });
    return res.status(201).json({ status: true, message: req.t('products.created'), data: { id } });
  } catch (error) { return next(error); }
};
