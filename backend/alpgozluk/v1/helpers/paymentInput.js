const CARD_NUMBER_PATTERN = /^\d{13,19}$/;
const CVC_PATTERN = /^\d{3,4}$/;
const IDENTITY_NUMBER_PATTERN = /^[A-Za-z0-9]{5,32}$/;
const PAYMENT_IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{16,190}$/;
const ORDER_NUMBER_PATTERN = /^AG-\d{2}-[A-Z2-9]{10}$/;
const SUPPORTED_INSTALLMENTS = new Set([1, 2, 3, 4, 6, 9, 12]);

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const passesLuhn = (cardNumber) => {
  let sum = 0;
  let doubleDigit = false;
  for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
    let digit = Number(cardNumber[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum > 0 && sum % 10 === 0;
};

const normalizeExpiryYear = (value) => {
  const raw = digitsOnly(value);
  if (raw.length === 2) return 2000 + Number(raw);
  if (raw.length === 4) return Number(raw);
  return 0;
};

const normalizePaymentCard = (input = {}, now = new Date()) => {
  const cardNumber = digitsOnly(input.cardNumber);
  const expireMonth = digitsOnly(input.expireMonth).padStart(2, '0');
  const expireYear = normalizeExpiryYear(input.expireYear);
  const cvc = digitsOnly(input.cvc);
  const cardHolderName = String(input.cardHolderName || '').trim().replace(/\s+/g, ' ');
  const month = Number(expireMonth);
  const expirationBoundary = new Date(Date.UTC(expireYear, month, 1));
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  if (!CARD_NUMBER_PATTERN.test(cardNumber) || !passesLuhn(cardNumber) ||
      cardHolderName.length < 2 || cardHolderName.length > 100 ||
      month < 1 || month > 12 || expireYear < 2000 || expirationBoundary <= currentMonth ||
      !CVC_PATTERN.test(cvc)) {
    return null;
  }

  return {
    cardHolderName,
    cardNumber,
    expireMonth,
    expireYear: String(expireYear),
    cvc,
    registerCard: 0,
  };
};

const normalizeIdentityNumber = (value) => {
  const normalized = String(value || '').trim().replace(/\s+/g, '');
  return IDENTITY_NUMBER_PATTERN.test(normalized) ? normalized : null;
};

const isValidBinNumber = (value) => /^\d{8}$/.test(String(value || ''));
const isValidOrderNumber = (value) => ORDER_NUMBER_PATTERN.test(String(value || ''));
const isValidPaymentIdempotencyKey = (value) => PAYMENT_IDEMPOTENCY_PATTERN.test(String(value || ''));
const isValidInstallment = (value) => SUPPORTED_INSTALLMENTS.has(Number(value));

module.exports = {
  isValidBinNumber,
  isValidInstallment,
  isValidOrderNumber,
  isValidPaymentIdempotencyKey,
  normalizeIdentityNumber,
  normalizePaymentCard,
  passesLuhn,
};
