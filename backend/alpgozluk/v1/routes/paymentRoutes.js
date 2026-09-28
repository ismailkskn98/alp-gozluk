const express = require('express');
const controller = require('../controllers/paymentController');
const optionalAuth = require('../middlewares/optionalAuth');
const { createRateLimit } = require('../middlewares/rateLimit');

const router = express.Router();
const lookupRateLimit = createRateLimit({ namespace: 'payment-lookup', max: 60, windowSeconds: 60 });
const initializeRateLimit = createRateLimit({ namespace: 'payment-initialize', max: 10, windowSeconds: 60 });

router.post('/iyzico/installments', optionalAuth, lookupRateLimit, controller.installments);
router.post('/iyzico/3ds/initialize', optionalAuth, initializeRateLimit, controller.initializeThreeDs);
router.get('/iyzico/3ds/session/:publicId/:proof', controller.threeDsSession);
router.post('/iyzico/3ds/callback', controller.threeDsCallback);
router.post('/iyzico/webhook', controller.webhook);
router.get('/:publicId', optionalAuth, lookupRateLimit, controller.status);

module.exports = router;
