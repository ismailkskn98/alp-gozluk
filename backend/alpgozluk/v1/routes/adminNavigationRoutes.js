const express = require('express');
const navigationController = require('../controllers/navigationController');

const router = express.Router();
router.get('/header', navigationController.adminHeader);
router.put('/header', navigationController.updateHeader);

module.exports = router;
