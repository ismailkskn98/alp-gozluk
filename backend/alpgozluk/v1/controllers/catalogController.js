const { normalizeCatalogPayload, resources } = require('../helpers/catalogInput');
const catalogService = require('../services/catalogService');

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const requestMeta = (req) => ({ userId: req.user.id, requestId: req.requestId, ip: req.ip || '' });

const sendError = (error, req, res, next) => {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ status: false, message: req.t('catalog.duplicate') });
  }
  return next(error);
};

exports.publicFacets = async (req, res, next) => {
  try {
    const cached = await require('../services/cacheService').getJson('catalog', 'facets', req.query.locale || 'tr');
    if (cached) return res.json({ status: true, message: req.t('catalog.listed'), data: cached });
    const catalog = await catalogService.listCatalog(req.query.locale, false);
    await require('../services/cacheService').setJson(['catalog', 'facets', req.query.locale || 'tr'], catalog);
    return res.json({ status: true, message: req.t('catalog.listed'), data: catalog });
  } catch (error) { return next(error); }
};

exports.adminOverview = async (req, res, next) => {
  try {
    const catalog = await catalogService.listCatalog(req.query.locale || 'tr', true);
    return res.json({ status: true, message: req.t('catalog.listed'), data: catalog });
  } catch (error) { return next(error); }
};

exports.list = async (req, res, next) => {
  if (!resources.has(req.params.resource)) return res.status(404).json({ status: false, message: req.t('errors.not_found') });
  try {
    const records = await catalogService.listResource(req.params.resource, req.query.locale || 'tr');
    return res.json({ status: true, message: req.t('catalog.listed'), data: { records } });
  } catch (error) { return next(error); }
};

exports.create = async (req, res, next) => {
  const payload = normalizeCatalogPayload(req.params.resource, req.body);
  if (!payload) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const id = await catalogService.createResource(req.params.resource, payload, requestMeta(req));
    return res.status(201).json({ status: true, message: req.t('catalog.created'), data: { id } });
  } catch (error) { return sendError(error, req, res, next); }
};

exports.update = async (req, res, next) => {
  const id = parseId(req.params.id);
  const payload = normalizeCatalogPayload(req.params.resource, req.body);
  if (!id || !payload) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const updated = await catalogService.updateResource(req.params.resource, id, payload, requestMeta(req));
    if (!updated) return res.status(404).json({ status: false, message: req.t('catalog.not_found') });
    return res.json({ status: true, message: req.t('catalog.updated'), data: {} });
  } catch (error) { return sendError(error, req, res, next); }
};

exports.remove = async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id || !resources.has(req.params.resource)) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const archived = await catalogService.archiveResource(req.params.resource, id, requestMeta(req));
    if (!archived) return res.status(404).json({ status: false, message: req.t('catalog.not_found') });
    return res.json({ status: true, message: req.t('catalog.archived'), data: {} });
  } catch (error) { return next(error); }
};
