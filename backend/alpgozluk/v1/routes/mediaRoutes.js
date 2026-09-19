const express = require('express');
const mediaController = require('../controllers/mediaController');
const { uploadImages, uploadSingleImage } = require('../middlewares/imageUpload');

const router = express.Router();

router.get('/list', mediaController.listMedia);
router.post('/upload', uploadImages, mediaController.uploadMedia);
router.put('/update/:id', mediaController.updateMedia);
router.put('/replace/:id', uploadSingleImage, mediaController.replaceMedia);
router.delete('/delete/:id', mediaController.deleteMedia);

module.exports = router;
