const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.roles?.some((role) => allowedRoles.includes(role))) {
    return res.status(403).json({ status: false, message: req.t('auth.forbidden') });
  }
  return next();
};

module.exports = requireRole;
