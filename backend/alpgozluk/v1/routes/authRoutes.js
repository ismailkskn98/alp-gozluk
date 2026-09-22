const express = require('express');
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyToken');
const { createRateLimit } = require('../middlewares/rateLimit');
const { config } = require('../config/env');

const router = express.Router();
const authRateLimit = createRateLimit({
  namespace: 'auth',
  max: config.rateLimit.authMax,
  windowSeconds: config.rateLimit.windowSeconds,
});
const googleAuthRateLimit = createRateLimit({
  namespace: 'auth-google',
  max: config.rateLimit.authMax,
  windowSeconds: config.rateLimit.windowSeconds,
});

router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/2fa/setup', authRateLimit, authController.twoFactorSetup);
router.post('/2fa/verify', authRateLimit, authController.twoFactorVerify);
router.get('/google/nonce', googleAuthRateLimit, authController.googleNonce);
router.post('/google', googleAuthRateLimit, authController.google);
router.use(verifyToken);
router.get('/me', authController.me);
router.post('/logout', authController.logout);

module.exports = router;
