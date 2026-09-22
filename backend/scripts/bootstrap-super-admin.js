const bcrypt = require('bcryptjs');
const { config } = require('../alpgozluk/v1/config/env');
const { getDb, closeDatabase } = require('../alpgozluk/v1/models/db');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{14,128}$/;

const run = async () => {
  const { email: rawEmail, password, firstName, lastName } = config.auth.bootstrapSuperAdmin;
  const email = String(rawEmail || '').trim().toLowerCase();

  if (!emailPattern.test(email)) throw new Error('SUPER_ADMIN_EMAIL geçerli bir e-posta olmalıdır.');
  if (!strongPasswordPattern.test(String(password || ''))) {
    throw new Error('SUPER_ADMIN_PASSWORD en az 14 karakter; büyük/küçük harf, rakam ve sembol içermelidir.');
  }
  if (firstName.trim().length < 2 || lastName.trim().length < 2) {
    throw new Error('SUPER_ADMIN_FIRST_NAME ve SUPER_ADMIN_LAST_NAME en az 2 karakter olmalıdır.');
  }

  const connection = await getDb().getConnection();
  let lockAcquired = false;
  try {
    const [lockRows] = await connection.query(
      "SELECT GET_LOCK('alpgozluk:bootstrap-super-admin', 10) AS acquired",
    );
    lockAcquired = Number(lockRows[0]?.acquired) === 1;
    if (!lockAcquired) throw new Error('Bootstrap kilidi alınamadı. Başka bir işlem çalışıyor olabilir.');

    await connection.beginTransaction();

    const [existingSuperAdmins] = await connection.query(
      `SELECT u.email
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.code = 'super_admin'
       LIMIT 1
       FOR UPDATE`,
    );
    if (existingSuperAdmins.length > 0) {
      await connection.rollback();
      console.log(`Süper yönetici zaten mevcut: ${existingSuperAdmins[0].email}`);
      return;
    }

    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1 FOR UPDATE', [email]);
    if (existingUsers.length > 0) {
      throw new Error('Bu e-posta zaten kullanılıyor; güvenlik nedeniyle mevcut hesap otomatik yükseltilmedi.');
    }

    const [roles] = await connection.query("SELECT id FROM roles WHERE code = 'super_admin' LIMIT 1");
    if (roles.length === 0) throw new Error('super_admin rolü bulunamadı. 003_admin_security.sql migration dosyasını çalıştırın.');

    const passwordHash = await bcrypt.hash(password, 12);
    const [userResult] = await connection.query(
      `INSERT INTO users
        (email, password_hash, first_name, last_name, status, is_protected, email_verified_at)
       VALUES (?, ?, ?, ?, 'active', 1, UTC_TIMESTAMP(6))`,
      [email, passwordHash, firstName.trim(), lastName.trim()],
    );
    await connection.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userResult.insertId, roles[0].id],
    );
    await connection.commit();
    console.log(`Süper yönetici oluşturuldu: ${email}`);
    console.log('Bootstrap sonrası SUPER_ADMIN_EMAIL ve SUPER_ADMIN_PASSWORD değerlerini env dosyasından temizleyin.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    try {
      if (lockAcquired) {
        await connection.query("SELECT RELEASE_LOCK('alpgozluk:bootstrap-super-admin')");
      }
    } finally {
      connection.release();
    }
  }
};

run()
  .catch((error) => {
    console.error(`Süper yönetici oluşturulamadı: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
