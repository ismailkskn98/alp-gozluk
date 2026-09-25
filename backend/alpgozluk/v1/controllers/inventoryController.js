const inventoryService = require('../services/inventoryService');

const reasonCodesByDirection = {
  increase: new Set(['stock_receipt', 'manual_correction', 'customer_return', 'other']),
  decrease: new Set(['manual_correction', 'damage', 'other']),
};
const statuses = new Set(['all', 'in_stock', 'low_stock', 'out_of_stock']);
const parseId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const requestMeta = (req) => ({ userId: req.user.id, requestId: req.requestId, ip: req.ip || '' });

exports.list = async (req, res, next) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 25);
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || 'all');
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100 || search.length > 100 || !statuses.has(status)) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const result = await inventoryService.list({ locale: req.query.locale, page, limit, search, status });
    return res.json({ status: true, message: req.t('inventory.listed'), data: result });
  } catch (error) { return next(error); }
};

exports.movements = async (req, res, next) => {
  const variantId = parseId(req.params.variantId);
  const limit = Number(req.query.limit || 20);
  if (!variantId || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const movements = await inventoryService.listMovements(variantId, limit);
    return res.json({ status: true, message: req.t('inventory.movements_listed'), data: { movements } });
  } catch (error) { return next(error); }
};

exports.adjust = async (req, res, next) => {
  const variantId = parseId(req.params.variantId);
  const direction = String(req.body.direction || '');
  const quantity = Number(req.body.quantity);
  const reasonCode = String(req.body.reasonCode || '');
  const note = String(req.body.note || '').trim();
  if (!variantId || !reasonCodesByDirection[direction] || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 100000 || !reasonCodesByDirection[direction].has(reasonCode) || note.length > 500) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const inventory = await inventoryService.adjust(variantId, { direction, quantity, reasonCode, note }, requestMeta(req));
    if (!inventory) return res.status(404).json({ status: false, message: req.t('inventory.not_found') });
    return res.status(201).json({ status: true, message: req.t('inventory.adjusted'), data: { inventory } });
  } catch (error) { return next(error); }
};

exports.updateThreshold = async (req, res, next) => {
  const variantId = parseId(req.params.variantId);
  const lowStockThreshold = Number(req.body.lowStockThreshold);
  if (!variantId || !Number.isSafeInteger(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 100000) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const inventory = await inventoryService.updateThreshold(variantId, lowStockThreshold, requestMeta(req));
    if (!inventory) return res.status(404).json({ status: false, message: req.t('inventory.not_found') });
    return res.json({ status: true, message: req.t('inventory.threshold_updated'), data: { inventory } });
  } catch (error) { return next(error); }
};
