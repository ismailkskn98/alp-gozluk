const express = require('express');
const catalogController = require('../controllers/catalogController');

const router = express.Router();
router.get('/facets', catalogController.publicFacets);

module.exports = router;
