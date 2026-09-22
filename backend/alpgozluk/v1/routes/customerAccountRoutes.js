const express = require('express');
const controller = require('../controllers/customerAccountController');

const router = express.Router();

router.get('/', controller.overview);
router.patch('/profile', controller.updateProfile);
router.post('/addresses', controller.createAddress);
router.patch('/addresses/:addressId', controller.updateAddress);
router.delete('/addresses/:addressId', controller.deleteAddress);
router.delete('/favorites/:productId', controller.removeFavorite);

module.exports = router;
