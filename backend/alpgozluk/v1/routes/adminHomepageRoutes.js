const express = require('express');
const homepageController = require('../controllers/homepageController');

const router = express.Router();
router.get('/', homepageController.getHomepage);
router.put('/', homepageController.updateHomepage);

module.exports = router;
