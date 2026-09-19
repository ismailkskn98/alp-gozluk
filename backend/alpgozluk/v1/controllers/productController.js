const productService = require('../services/productService');

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const codePattern = /^[A-Z0-9][A-Z0-9_-]{1,79}$/i;

const validCreatePayload = (body) => (
  codePattern.test(String(body.code || '')) &&
  ['draft', 'published', 'archived'].includes(body.status) &&
  Number.isFinite(body.taxRate) && body.taxRate >= 0 && body.taxRate <= 100 &&
  Array.isArray(body.translations) && body.translations.length > 0 &&
  body.translations.every((translation) =>
    ['tr', 'en'].includes(translation.locale) &&
    String(translation.name || '').trim().length >= 2 &&
    slugPattern.test(String(translation.slug || ''))
  ) &&
  Array.isArray(body.variants) && body.variants.length > 0 &&
  body.variants.every((variant) =>
    String(variant.sku || '').trim().length >= 2 && Number.isFinite(variant.price) && variant.price >= 0 &&
    Number.isInteger(variant.stockQuantity) && variant.stockQuantity >= 0 &&
    Number.isInteger(variant.lowStockThreshold) && variant.lowStockThreshold >= 0
  )
);

exports.list = async (req, res, next) => {
  try {
    const products = await productService.listPublished(req.query.locale);
    res.json({ status: true, message: req.t('products.listed'), data: { products } });
  } catch (error) { next(error); }
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
    const id = await productService.create(req.body, { userId: req.user.id, requestId: req.id, ip: req.ip || '' });
    return res.status(201).json({ status: true, message: req.t('products.created'), data: { id } });
  } catch (error) { return next(error); }
};
