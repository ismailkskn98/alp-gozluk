const express = require('express');
const adminUserController = require('../controllers/adminUserController');

const router = express.Router();

router.get('/', adminUserController.list);
router.get('/roles', adminUserController.listRoles);
router.post('/', adminUserController.create);
router.put('/:id/roles', adminUserController.updateRoles);
router.put('/:id/status', adminUserController.updateStatus);
router.delete('/:id', adminUserController.remove);

module.exports = router;
