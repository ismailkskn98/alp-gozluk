const { config, validateConfig } = require('../alpgozluk/v1/config/env');
const { closeDatabase } = require('../alpgozluk/v1/models/db');
const paymentService = require('../alpgozluk/v1/services/iyzicoPaymentService');

const run = async () => {
  validateConfig();
  if (!config.payments.iyzico.enabled) {
    throw new Error('IYZICO_ENABLED=true olmadan ödeme uzlaştırması çalıştırılamaz.');
  }
  const summary = await paymentService.reconcilePendingPayments(100);
  process.stdout.write(
    `iyzico uzlaştırması: ${summary.checked} kontrol, ${summary.paid} ödendi, ` +
    `${summary.failed} başarısız, ${summary.pending} bekliyor, ${summary.errors} hata.\n`,
  );
  if (summary.errors > 0) process.exitCode = 1;
};

run()
  .catch((error) => {
    process.stderr.write(`iyzico uzlaştırması başarısız: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
