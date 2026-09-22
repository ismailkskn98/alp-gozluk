const cartService = require('../services/cartService');
const {
  MAX_CART_LINE_QUANTITY,
  createGuestToken,
  hashGuestToken,
  isValidGuestToken,
} = require('../helpers/commerce');

const positiveId = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const readGuestToken = (req) => {
  const token = req.get('x-cart-token');
  if (!token) return null;
  if (!isValidGuestToken(token)) {
    const error = new Error('guest_token_invalid');
    error.statusCode = 422;
    error.publicMessage = req.t('cart.invalid_guest_token');
    throw error;
  }
  return token;
};

const identityForRequest = (req, { createGuest = false } = {}) => {
  if (req.user) return { identity: { userId: req.user.id }, issuedGuestToken: null };
  let guestToken = readGuestToken(req);
  let issuedGuestToken = null;
  if (!guestToken && createGuest) {
    guestToken = createGuestToken();
    issuedGuestToken = guestToken;
  }
  return {
    identity: { guestTokenHash: guestToken ? hashGuestToken(guestToken) : null },
    issuedGuestToken,
  };
};

const sendCart = (res, message, cart, issuedGuestToken = null, statusCode = 200) => {
  if (issuedGuestToken) res.setHeader('x-cart-token', issuedGuestToken);
  return res.status(statusCode).json({ status: true, message, data: { cart } });
};

exports.get = async (req, res, next) => {
  try {
    const { identity } = identityForRequest(req);
    const cart = await cartService.getCart(identity, req.query.locale);
    return sendCart(res, req.t('cart.loaded'), cart);
  } catch (error) { return next(error); }
};

exports.summary = async (req, res, next) => {
  try {
    const { identity } = identityForRequest(req);
    const cart = await cartService.getCart(identity, req.query.locale);
    return res.json({
      status: true,
      message: req.t('cart.loaded'),
      data: { summary: cart.summary, warnings: cart.warnings, updatedAt: cart.updatedAt },
    });
  } catch (error) { return next(error); }
};

exports.addItem = async (req, res, next) => {
  const variantId = positiveId(req.body.variantId);
  const quantity = Number(req.body.quantity ?? 1);
  if (!variantId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_CART_LINE_QUANTITY) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const { identity, issuedGuestToken } = identityForRequest(req, { createGuest: true });
    const cart = await cartService.addItem(identity, { variantId, quantity }, req.body.locale || req.query.locale);
    return sendCart(res, req.t('cart.item_added'), cart, issuedGuestToken, 201);
  } catch (error) { return next(error); }
};

exports.updateItem = async (req, res, next) => {
  const itemId = positiveId(req.params.itemId);
  const hasQuantity = req.body.quantity !== undefined;
  const hasSelected = req.body.selected !== undefined;
  const quantity = Number(req.body.quantity);
  if (!itemId || (!hasQuantity && !hasSelected) ||
      (hasQuantity && (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_CART_LINE_QUANTITY)) ||
      (hasSelected && typeof req.body.selected !== 'boolean')) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const { identity } = identityForRequest(req);
    const cart = await cartService.updateItem(identity, itemId, {
      quantity: hasQuantity ? quantity : undefined,
      selected: hasSelected ? req.body.selected : undefined,
    }, req.body.locale || req.query.locale);
    return sendCart(res, req.t('cart.item_updated'), cart);
  } catch (error) { return next(error); }
};

exports.removeItem = async (req, res, next) => {
  const itemId = positiveId(req.params.itemId);
  if (!itemId) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const { identity } = identityForRequest(req);
    const cart = await cartService.removeItem(identity, itemId, req.query.locale);
    return sendCart(res, req.t('cart.item_removed'), cart);
  } catch (error) { return next(error); }
};

exports.updateSelection = async (req, res, next) => {
  const itemIds = req.body.itemIds;
  const validIds = itemIds === undefined || (
    Array.isArray(itemIds) && itemIds.length > 0 && itemIds.length <= 100 &&
    itemIds.every((id) => positiveId(id)) && new Set(itemIds.map(Number)).size === itemIds.length
  );
  if (typeof req.body.selected !== 'boolean' || !validIds) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const { identity } = identityForRequest(req);
    const cart = await cartService.updateSelection(identity, {
      selected: req.body.selected,
      itemIds: itemIds?.map(Number),
    }, req.body.locale || req.query.locale);
    return sendCart(res, req.t('cart.selection_updated'), cart);
  } catch (error) { return next(error); }
};

exports.applyCoupon = async (req, res, next) => {
  const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
  if (!/^[A-Za-z0-9_-]{2,80}$/.test(code)) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const { identity, issuedGuestToken } = identityForRequest(req, { createGuest: true });
    const cart = await cartService.applyCoupon(identity, code, req.body.locale || req.query.locale);
    return sendCart(res, req.t('cart.coupon_applied'), cart, issuedGuestToken);
  } catch (error) { return next(error); }
};

exports.removeCoupon = async (req, res, next) => {
  try {
    const { identity } = identityForRequest(req);
    const cart = await cartService.removeCoupon(identity, req.query.locale);
    return sendCart(res, req.t('cart.coupon_removed'), cart);
  } catch (error) { return next(error); }
};

exports.merge = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ status: false, message: req.t('auth.unauthorized') });
  try {
    const guestToken = readGuestToken(req);
    const cart = await cartService.mergeGuestCart(
      req.user.id,
      guestToken ? hashGuestToken(guestToken) : null,
      req.body.locale || req.query.locale,
    );
    return res.json({ status: true, message: req.t('cart.merged'), data: { cart, clearGuestCart: Boolean(guestToken) } });
  } catch (error) { return next(error); }
};
