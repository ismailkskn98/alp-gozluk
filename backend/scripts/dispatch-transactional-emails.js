const { validateConfig } = require('../alpgozluk/v1/config/env');
const { closeDatabase } = require('../alpgozluk/v1/models/db');
const { dispatchPendingEmails } = require('../alpgozluk/v1/services/transactionalEmailService');

async function main() {
  validateConfig();
  const summary = await dispatchPendingEmails(process.env.EMAIL_DISPATCH_LIMIT || 25);
  console.log('Transactional e-posta görevi tamamlandı:', summary);
}

main()
  .catch((error) => {
    console.error('Transactional e-posta görevi başarısız:', error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
