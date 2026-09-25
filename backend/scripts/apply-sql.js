const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { config, validateConfig } = require('../alpgozluk/v1/config/env');

const sqlRoot = path.resolve(__dirname, '../alpgozluk/v1/sql');

async function main() {
  validateConfig();
  const requestedFile = process.argv[2];
  if (!requestedFile) throw new Error('Uygulanacak SQL dosyasını belirtin.');

  const sqlPath = path.resolve(sqlRoot, requestedFile);
  if (!sqlPath.startsWith(`${sqlRoot}${path.sep}`)) throw new Error('SQL dizini dışına erişilemez.');
  const sql = await fs.readFile(sqlPath, 'utf8');
  if (/^\s*DELIMITER\b/im.test(sql)) {
    throw new Error('DELIMITER kullanan migration dosyaları bu yardımcıyla çalıştırılamaz.');
  }

  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    charset: 'utf8mb4',
    timezone: 'Z',
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log(`${requestedFile} başarıyla uygulandı.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`SQL uygulanamadı: ${error.message}`);
  process.exitCode = 1;
});
