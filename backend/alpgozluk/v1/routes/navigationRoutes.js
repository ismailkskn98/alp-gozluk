const express = require('express');
const navigationController = require('../controllers/navigationController');

const router = express.Router();
router.get('/header', navigationController.publicHeader);

module.exports = router;
