const express = require('express');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

router.get('/', inventoryController.list);
router.get('/:variantId/movements', inventoryController.movements);
router.post('/:variantId/adjustments', inventoryController.adjust);
router.patch('/:variantId', inventoryController.updateThreshold);

module.exports = router;
