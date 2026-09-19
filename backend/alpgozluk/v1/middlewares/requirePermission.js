const { getDb } = require('../models/db');

const requirePermission = (permissionCode) => async (req, res, next) => {
  try {
    const [rows] = await getDb().query(
      `SELECT 1
       FROM user_roles ur
       INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = ? AND p.code = ?
       LIMIT 1`,
      [req.user.id, permissionCode],
    );

    if (rows.length === 0) {
      return res.status(403).json({ status: false, message: req.t('auth.forbidden') });
    }

    return next();
  } catch (error) {
    console.error('Yetki kontrolü hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};

module.exports = requirePermission;
