const mysql = require('mysql2/promise');
const { config } = require('../config/env');

let pool;

const getDb = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: config.database.connectionLimit,
      queueLimit: 0,
      charset: 'utf8mb4',
      decimalNumbers: false,
      timezone: 'Z',
    });
  }

  return pool;
};

const checkDatabase = async () => {
  await getDb().query('SELECT 1');
  return true;
};

const closeDatabase = async () => {
  if (!pool) return;
  await pool.end();
  pool = undefined;
};

module.exports = { getDb, checkDatabase, closeDatabase };
