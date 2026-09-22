const express = require('express');
const announcementController = require('../controllers/announcementController');

const router = express.Router();
router.get('/', announcementController.adminList);
router.post('/', announcementController.create);
router.put('/reorder', announcementController.reorder);
router.put('/:id', announcementController.update);
router.delete('/:id', announcementController.remove);

module.exports = router;
