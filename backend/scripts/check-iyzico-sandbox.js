const { config, validateConfig } = require('../alpgozluk/v1/config/env');
const { createIyzicoApiClient } = require('../alpgozluk/v1/services/iyzicoApiClient');

const run = async () => {
  validateConfig();
  if (!config.payments.iyzico.enabled || config.payments.iyzico.environment !== 'sandbox') {
    throw new Error('Bu kontrol için IYZICO_ENABLED=true ve IYZICO_ENVIRONMENT=sandbox olmalıdır.');
  }
  const conversationId = `SANDBOX-CHECK-${Date.now()}`;
  const response = await createIyzicoApiClient().retrieveInstallments({
    locale: 'tr',
    conversationId,
    binNumber: '55260800',
    price: '100.00',
  });
  if (response.status !== 'success' || response.conversationId !== conversationId) {
    throw new Error(`Sandbox doğrulanamadı: ${response.errorCode || response.status || 'unknown'}`);
  }
  const detail = response.installmentDetails?.[0] || {};
  process.stdout.write(
    `iyzico sandbox bağlantısı doğrulandı: ${detail.cardAssociation || 'kart'} / ` +
    `${detail.bankName || 'banka bilgisi yok'}, ${detail.installmentPrices?.length || 0} seçenek.\n`,
  );
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
