const { getDb, closeDatabase } = require('../alpgozluk/v1/models/db');

const email = String(process.argv[2] || '').trim().toLowerCase();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Kullanım: npm run admin:grant -- kullanici@example.com');
  process.exitCode = 1;
} else {
  (async () => {
    try {
      const [result] = await getDb().query(
        `INSERT IGNORE INTO user_roles (user_id, role_id)
         SELECT u.id, r.id FROM users u CROSS JOIN roles r
         WHERE u.email = ? AND r.code = 'admin'`,
        [email],
      );
      if (result.affectedRows === 0) throw new Error('Kullanıcı bulunamadı veya admin rolü zaten atanmış.');
      console.log(`Admin rolü atandı: ${email}`);
    } catch (error) {
      console.error(`Admin rolü atanamadı: ${error.message}`);
      process.exitCode = 1;
    } finally {
      await closeDatabase();
    }
  })();
}
