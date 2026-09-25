const express = require('express');
const controller = require('../controllers/orderController');
const { createRateLimit } = require('../middlewares/rateLimit');

const router = express.Router();
const checkoutRateLimit = createRateLimit({
  namespace: 'checkout-orders',
  max: 20,
  windowSeconds: 60,
});

router.post('/orders', checkoutRateLimit, controller.prepare);
router.get('/orders/:orderNumber', controller.detail);
router.post('/orders/:orderNumber/cancel', checkoutRateLimit, controller.cancel);

module.exports = router;
