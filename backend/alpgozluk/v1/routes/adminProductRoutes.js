const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();
router.get('/', productController.adminList);
router.post('/', productController.create);

module.exports = router;
