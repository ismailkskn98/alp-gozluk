const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

export function turkishPhoneDigits(value) {
  let digits = digitsOnly(value);
  if (digits.startsWith('90')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function normalizeTurkishPhone(value) {
  const digits = turkishPhoneDigits(value);
  return digits ? `+90${digits}` : '';
}

export function formatTurkishPhone(value) {
  const digits = turkishPhoneDigits(value);
  const parts = [];
  if (digits.length) parts.push(`(${digits.slice(0, 3)}` + (digits.length >= 3 ? ')' : ''));
  if (digits.length > 3) parts.push(digits.slice(3, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 8));
  if (digits.length > 8) parts.push(digits.slice(8, 10));
  return parts.join(' ');
}

export function isTurkishMobilePhone(value) {
  return /^\+905\d{9}$/.test(normalizeTurkishPhone(value));
}
