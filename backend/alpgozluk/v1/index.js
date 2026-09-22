const express = require('express');
const { i18nMiddleware } = require('./config/i18n');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const productRoutes = require('./routes/productRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const navigationRoutes = require('./routes/navigationRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const adminCatalogRoutes = require('./routes/adminCatalogRoutes');
const adminNavigationRoutes = require('./routes/adminNavigationRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const verifyToken = require('./middlewares/verifyToken');
const requirePermission = require('./middlewares/requirePermission');
const requireRole = require('./middlewares/requireRole');

const router = express.Router();

router.use(i18nMiddleware);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/catalog', catalogRoutes);
router.use('/navigation', navigationRoutes);
router.use(
  '/admin/products',
  verifyToken,
  requirePermission('products.manage'),
  adminProductRoutes,
);
router.use(
  '/admin/media',
  verifyToken,
  requirePermission('media.manage'),
  mediaRoutes,
);
router.use(
  '/admin/catalog',
  verifyToken,
  requirePermission('catalog.manage'),
  adminCatalogRoutes,
);
router.use(
  '/admin/navigation',
  verifyToken,
  requirePermission('navigation.manage'),
  adminNavigationRoutes,
);
router.use(
  '/admin/users',
  verifyToken,
  requireRole('super_admin'),
  adminUserRoutes,
);

module.exports = router;
