const express = require('express');
const controller = require('../controllers/cartController');
const { createRateLimit } = require('../middlewares/rateLimit');

const router = express.Router();
const cartMutationRateLimit = createRateLimit({
  namespace: 'cart-mutations',
  max: 120,
  windowSeconds: 60,
});

router.get('/', controller.get);
router.get('/summary', controller.summary);
router.post('/items', cartMutationRateLimit, controller.addItem);
router.patch('/items/:itemId', cartMutationRateLimit, controller.updateItem);
router.delete('/items/:itemId', cartMutationRateLimit, controller.removeItem);
router.patch('/selection', cartMutationRateLimit, controller.updateSelection);
router.post('/coupon', cartMutationRateLimit, controller.applyCoupon);
router.delete('/coupon', cartMutationRateLimit, controller.removeCoupon);
router.post('/merge', cartMutationRateLimit, controller.merge);

module.exports = router;
