const { closeDatabase } = require('../alpgozluk/v1/models/db');
const { expireReservations } = require('../alpgozluk/v1/services/orderService');

async function main() {
  const expiredCount = await expireReservations(200);
  console.log(`${expiredCount} siparişin süresi dolan stok rezervasyonu serbest bırakıldı.`);
}

main()
  .catch((error) => {
    console.error(`Stok rezervasyonları serbest bırakılamadı: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
