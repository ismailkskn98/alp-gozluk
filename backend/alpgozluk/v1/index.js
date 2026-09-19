const express = require('express');
const { i18nMiddleware } = require('./config/i18n');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const productRoutes = require('./routes/productRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const verifyToken = require('./middlewares/verifyToken');
const requirePermission = require('./middlewares/requirePermission');

const router = express.Router();

router.use(i18nMiddleware);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
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

module.exports = router;
