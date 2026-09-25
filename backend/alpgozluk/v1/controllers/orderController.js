const { hashGuestToken, isValidGuestToken } = require('../helpers/commerce');
const { hashOrderAccessToken, isValidOrderAccessToken, isValidOrderNumber } = require('../helpers/orderCore');
const orderService = require('../services/orderService');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const idempotencyPattern = /^[A-Za-z0-9._:-]{16,190}$/;

const normalizeText = (value) => String(value || '').trim();

const normalizeAddress = (input = {}) => ({
  firstName: normalizeText(input.firstName),
  lastName: normalizeText(input.lastName),
  phone: normalizeText(input.phone),
  countryCode: normalizeText(input.countryCode || 'TR').toUpperCase(),
  city: normalizeText(input.city),
  district: normalizeText(input.district),
  postalCode: normalizeText(input.postalCode),
  addressLine: normalizeText(input.addressLine),
});

const validAddress = (address) => (
  address.firstName.length >= 2 && address.firstName.length <= 80 &&
  address.lastName.length >= 2 && address.lastName.length <= 80 &&
  address.phone.length >= 7 && address.phone.length <= 32 &&
  /^[A-Z]{2}$/.test(address.countryCode) &&
  address.city.length >= 2 && address.city.length <= 100 &&
  address.district.length >= 2 && address.district.length <= 100 &&
  address.postalCode.length <= 20 &&
  address.addressLine.length >= 10 && address.addressLine.length <= 2000
);

const readCheckoutIdentity = (req) => {
  if (req.user) return { userId: req.user.id };
  const cartToken = req.get('x-cart-token');
  const orderToken = req.get('x-order-token');
  if (!isValidGuestToken(cartToken) || !isValidOrderAccessToken(orderToken)) {
    const error = new Error('guest_order_token_invalid');
    error.statusCode = 401;
    error.publicMessage = req.t('orders.access_denied');
    throw error;
  }
  return {
    cartTokenHash: hashGuestToken(cartToken),
    orderTokenHash: hashOrderAccessToken(orderToken),
  };
};

const readOrderIdentity = (req) => {
  if (req.user) return { userId: req.user.id };
  const orderToken = req.get('x-order-token');
  if (!isValidOrderAccessToken(orderToken)) {
    const error = new Error('guest_order_token_invalid');
    error.statusCode = 401;
    error.publicMessage = req.t('orders.access_denied');
    throw error;
  }
  return { orderTokenHash: hashOrderAccessToken(orderToken) };
};

exports.prepare = async (req, res, next) => {
  try {
    const idempotencyKey = normalizeText(req.get('idempotency-key'));
    const customer = {
      firstName: normalizeText(req.body.customer?.firstName),
      lastName: normalizeText(req.body.customer?.lastName),
      email: normalizeText(req.body.customer?.email).toLowerCase(),
      phone: normalizeText(req.body.customer?.phone),
    };
    const shippingAddress = normalizeAddress(req.body.shippingAddress);
    const billingAddress = req.body.billingSameAsShipping === false
      ? normalizeAddress(req.body.billingAddress)
      : shippingAddress;
    const notes = normalizeText(req.body.notes);

    const validCustomer = customer.firstName.length >= 2 && customer.firstName.length <= 80 &&
      customer.lastName.length >= 2 && customer.lastName.length <= 80 &&
      customer.email.length <= 190 && emailPattern.test(customer.email) &&
      customer.phone.length >= 7 && customer.phone.length <= 32;
    if (!idempotencyPattern.test(idempotencyKey) || !validCustomer ||
        !validAddress(shippingAddress) || !validAddress(billingAddress) || notes.length > 1000) {
      return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
    }

    const result = await orderService.prepareOrder({
      identity: readCheckoutIdentity(req),
      idempotencyKey,
      customer,
      shippingAddress,
      billingAddress,
      notes,
      locale: req.body.locale || req.query.locale,
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(result.reused ? 200 : 201).json({
      status: true,
      message: req.t(result.reused ? 'orders.reused' : 'orders.prepared'),
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

exports.detail = async (req, res, next) => {
  if (!isValidOrderNumber(req.params.orderNumber)) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const order = await orderService.getOrder({
      orderNumber: req.params.orderNumber,
      identity: readOrderIdentity(req),
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ status: true, message: req.t('orders.found'), data: { order } });
  } catch (error) {
    return next(error);
  }
};

exports.cancel = async (req, res, next) => {
  if (!isValidOrderNumber(req.params.orderNumber)) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    const result = await orderService.cancelOrder({
      orderNumber: req.params.orderNumber,
      identity: readOrderIdentity(req),
      reason: 'customer_cancelled_before_payment',
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ status: true, message: req.t('orders.cancelled'), data: result });
  } catch (error) {
    return next(error);
  }
};
