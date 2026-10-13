const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();
router.get('/', productController.adminList);
router.get('/:id', productController.adminDetail);
router.post('/', productController.create);
router.put('/:id', productController.update);

module.exports = router;
