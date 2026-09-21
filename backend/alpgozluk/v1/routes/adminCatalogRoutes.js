const express = require('express');
const catalogController = require('../controllers/catalogController');

const router = express.Router();
router.get('/', catalogController.adminOverview);
router.get('/:resource', catalogController.list);
router.post('/:resource', catalogController.create);
router.put('/:resource/:id', catalogController.update);
router.delete('/:resource/:id', catalogController.remove);

module.exports = router;
