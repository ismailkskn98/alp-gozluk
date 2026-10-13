const productService = require('../services/productService');
const { parseProductFilters } = require('../helpers/productFilters');
const { validProductPayload } = require('../helpers/productInput');

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const requestMeta = (req) => ({ userId: req.user.id, requestId: req.requestId, ip: req.ip || '' });

const sendAdminError = (error, req, res, next) => {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ status: false, message: req.t('products.duplicate') });
  }
  return next(error);
};

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

exports.adminDetail = async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(422).json({ status: false, message: req.t('validation.invalid_id') });
  try {
    const product = await productService.findAdminById(id);
    if (!product) return res.status(404).json({ status: false, message: req.t('products.not_found') });
    return res.json({ status: true, message: req.t('products.found'), data: { product } });
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
    if (!validProductPayload(req.body)) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
    const id = await productService.create(req.body, requestMeta(req));
    return res.status(201).json({ status: true, message: req.t('products.created'), data: { id } });
  } catch (error) { return sendAdminError(error, req, res, next); }
};

exports.update = async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id || !validProductPayload(req.body, { allowVariantIds: true })) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const updated = await productService.update(id, req.body, requestMeta(req));
    if (!updated) return res.status(404).json({ status: false, message: req.t('products.not_found') });
    return res.json({ status: true, message: req.t('products.updated'), data: {} });
  } catch (error) { return sendAdminError(error, req, res, next); }
};
