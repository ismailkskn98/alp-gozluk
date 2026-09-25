const express = require('express');
const settingsController = require('../controllers/settingsController');

const router = express.Router();
router.get('/commerce', settingsController.getCommerce);

module.exports = router;
