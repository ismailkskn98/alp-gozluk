const nodemailer = require('nodemailer');
const { config } = require('../config/env');
const { getDb } = require('../models/db');
const { createOrderTrackingToken } = require('../helpers/orderTracking');
const orderService = require('./orderService');

const MAX_ATTEMPTS = 5;
let transporter;

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: { user: config.mail.user, pass: config.mail.password },
      disableFileAccess: true,
      disableUrlAccess: true,
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });
  }
  return transporter;
};

const formatMoney = (value, currency, locale) => new Intl.NumberFormat(
  locale === 'en' ? 'en-US' : 'tr-TR',
  { style: 'currency', currency, maximumFractionDigits: 2 },
).format(Number(value || 0));

const buildTrackingUrl = (order, locale) => {
  const pathname = locale === 'en' ? '/en/order-tracking' : '/order-tracking';
  const url = new URL(pathname, config.frontendUrl);
  url.searchParams.set('order', order.orderNumber);
  const token = createOrderTrackingToken({
    orderNumber: order.orderNumber,
    customerEmail: order.customer.email,
  });
  return `${url.toString()}#token=${encodeURIComponent(token)}`;
};

const buildOrderConfirmation = (order, locale) => {
  const english = locale === 'en';
  const trackingUrl = buildTrackingUrl(order, locale);
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px dashed #cfd6d2;">
        <strong style="display:block;color:#172536;">${escapeHtml(item.name)}</strong>
        <span style="color:#68736f;font-size:13px;">${escapeHtml([item.colorCode, item.frameSize].filter(Boolean).join(' · '))} · ${english ? 'Qty' : 'Adet'}: ${item.quantity}</span>
      </td>
      <td style="padding:14px 0;border-bottom:1px dashed #cfd6d2;text-align:right;white-space:nowrap;">${escapeHtml(formatMoney(item.totalAmount, order.currency, locale))}</td>
    </tr>`).join('');
  const subject = english
    ? `We received your order ${order.orderNumber}`
    : `${order.orderNumber} numaralı siparişini aldık`;
  const title = english ? 'Your order is confirmed.' : 'Siparişin onaylandı.';
  const intro = english
    ? 'Your payment was verified. Keep the order number below for support and tracking.'
    : 'Ödemen doğrulandı. Destek ve takip işlemleri için aşağıdaki sipariş numaranı sakla.';
  const trackLabel = english ? 'Track my order' : 'Siparişimi takip et';
  const totalLabel = english ? 'Total' : 'Toplam';

  const html = `<!doctype html>
  <html lang="${english ? 'en' : 'tr'}"><body style="margin:0;background:#f4f5f2;font-family:Arial,sans-serif;color:#172536;">
    <div style="max-width:620px;margin:0 auto;padding:32px 16px;">
      <div style="background:#172536;color:#fff;padding:22px 24px;">
        <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#cad2d9;">ALP Gözlük</div>
        <div style="margin-top:12px;font-size:13px;color:#cad2d9;">${english ? 'Order number' : 'Sipariş numarası'}</div>
        <div style="margin-top:4px;font-size:22px;font-weight:700;letter-spacing:.08em;">${escapeHtml(order.orderNumber)}</div>
      </div>
      <div style="background:#fff;padding:30px 24px;">
        <h1 style="margin:0;font-size:27px;font-weight:500;">${title}</h1>
        <p style="margin:12px 0 24px;color:#68736f;line-height:1.65;">${intro}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">${itemsHtml}</table>
        <div style="display:flex;justify-content:space-between;gap:16px;padding:20px 0;font-size:17px;font-weight:700;">
          <span>${totalLabel}</span><span>${escapeHtml(formatMoney(order.totalAmount, order.currency, locale))}</span>
        </div>
        <a href="${escapeHtml(trackingUrl)}" style="display:block;background:#172536;color:#fff;text-align:center;text-decoration:none;padding:15px 20px;font-weight:700;">${trackLabel}</a>
        <p style="margin:22px 0 0;color:#68736f;font-size:12px;line-height:1.6;">${english ? 'This private link provides guest access to this order. Do not share it.' : 'Bu özel bağlantı misafir siparişine erişim sağlar. Başkalarıyla paylaşma.'}</p>
      </div>
    </div>
  </body></html>`;

  const itemLines = order.items.map((item) =>
    `- ${item.name} x${item.quantity}: ${formatMoney(item.totalAmount, order.currency, locale)}`,
  ).join('\n');
  const text = `${title}\n\n${intro}\n\n${english ? 'Order number' : 'Sipariş numarası'}: ${order.orderNumber}\n\n${itemLines}\n\n${totalLabel}: ${formatMoney(order.totalAmount, order.currency, locale)}\n\n${trackLabel}: ${trackingUrl}`;
  return { subject, html, text };
};

const claimOutboxRow = async (database, { orderNumber = null, outboxId = null } = {}) => {
  const params = [];
  let filter = '';
  if (orderNumber) {
    filter = 'AND o.order_number = ?';
    params.push(orderNumber);
  } else if (outboxId) {
    filter = 'AND e.id = ?';
    params.push(outboxId);
  }
  const [rows] = await database.query(
    `SELECT e.id, e.order_id, e.recipient_email, e.locale
     FROM transactional_email_outbox e
     INNER JOIN orders o ON o.id = e.order_id
     WHERE e.template = 'order_confirmation' ${filter}
       AND e.attempts < ?
       AND ((e.status IN ('pending', 'failed')
         AND (e.next_attempt_at IS NULL OR e.next_attempt_at <= UTC_TIMESTAMP(6)))
         OR (e.status = 'processing' AND e.locked_at < DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 10 MINUTE)))
     ORDER BY e.created_at LIMIT 1`,
    [...params, MAX_ATTEMPTS],
  );
  const row = rows[0];
  if (!row) return null;

  const [claim] = await database.query(
    `UPDATE transactional_email_outbox
     SET status = 'processing', attempts = attempts + 1, locked_at = UTC_TIMESTAMP(6), last_error = NULL
     WHERE id = ? AND (status IN ('pending', 'failed')
       OR (status = 'processing' AND locked_at < DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 10 MINUTE)))`,
    [row.id],
  );
  return claim.affectedRows === 1 ? row : null;
};

const deliverClaimedRow = async (database, row) => {
  try {
    const order = await orderService.getOrderById(row.order_id, database);
    if (!order) throw new Error('order_not_found');
    const message = buildOrderConfirmation(order, row.locale);
    const info = await getTransporter().sendMail({
      from: { name: config.mail.fromName, address: config.mail.fromAddress },
      to: row.recipient_email,
      ...message,
    });
    await database.query(
      `UPDATE transactional_email_outbox
       SET status = 'sent', sent_at = UTC_TIMESTAMP(6), provider_message_id = ?, locked_at = NULL
       WHERE id = ?`,
      [String(info.messageId || '').slice(0, 255) || null, row.id],
    );
    return { sent: true, id: row.id };
  } catch (error) {
    await database.query(
      `UPDATE transactional_email_outbox
       SET status = 'failed', next_attempt_at = DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 5 MINUTE),
         last_error = ?, locked_at = NULL WHERE id = ?`,
      [String(error.code || error.message || 'mail_delivery_failed').slice(0, 500), row.id],
    );
    throw error;
  }
};

const dispatchOrderConfirmation = async (orderNumber, database = getDb()) => {
  if (!config.mail.enabled) return { skipped: true };
  const row = await claimOutboxRow(database, { orderNumber });
  if (!row) return { skipped: true };
  return deliverClaimedRow(database, row);
};

const dispatchPendingEmails = async (limit = 25, database = getDb()) => {
  if (!config.mail.enabled) return { checked: 0, sent: 0, failed: 0, disabled: true };
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));
  const summary = { checked: 0, sent: 0, failed: 0 };
  for (let index = 0; index < safeLimit; index += 1) {
    const row = await claimOutboxRow(database);
    if (!row) break;
    summary.checked += 1;
    try {
      await deliverClaimedRow(database, row);
      summary.sent += 1;
    } catch {
      summary.failed += 1;
    }
  }
  return summary;
};

const scheduleOrderConfirmation = (orderNumber) => {
  if (!config.mail.enabled) return;
  setImmediate(() => {
    dispatchOrderConfirmation(orderNumber).catch((error) => {
      console.error('Sipariş onay e-postası gönderilemedi:', error.code || error.message);
    });
  });
};

module.exports = {
  buildOrderConfirmation,
  dispatchOrderConfirmation,
  dispatchPendingEmails,
  scheduleOrderConfirmation,
};
