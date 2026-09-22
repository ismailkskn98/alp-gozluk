const express = require('express');
const controller = require('../controllers/customerAccountController');
const { createRateLimit } = require('../middlewares/rateLimit');

const router = express.Router();
const favoriteMutationRateLimit = createRateLimit({
  namespace: 'favorite-mutations',
  max: 120,
  windowSeconds: 60,
});

router.get('/', controller.overview);
router.patch('/profile', controller.updateProfile);
router.post('/addresses', controller.createAddress);
router.patch('/addresses/:addressId', controller.updateAddress);
router.delete('/addresses/:addressId', controller.deleteAddress);
router.get('/favorites', controller.listFavorites);
router.get('/favorites/ids', controller.listFavoriteIds);
router.put('/favorites/:productId', favoriteMutationRateLimit, controller.addFavorite);
router.delete('/favorites/:productId', favoriteMutationRateLimit, controller.removeFavorite);
router.post('/favorites/merge', favoriteMutationRateLimit, controller.mergeFavorites);

module.exports = router;
