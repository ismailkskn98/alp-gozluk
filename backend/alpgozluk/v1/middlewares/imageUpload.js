const path = require('node:path');
const multer = require('multer');
const { config } = require('../config/env');
const { imageFormats } = require('../helpers/imageFile');

const fileFilter = (req, file, callback) => {
  const format = imageFormats[file.mimetype];
  const extension = path.extname(file.originalname || '').toLowerCase();

  if (!format || !format.extensions.has(extension)) {
    return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  }

  return callback(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: config.storage.maxUploadSizeMb * 1024 * 1024,
    files: config.storage.maxUploadFiles,
    fields: 10,
    parts: config.storage.maxUploadFiles + 10,
  },
});

const uploadImages = upload.array('images', config.storage.maxUploadFiles);
const uploadSingleImage = upload.single('image');

module.exports = { uploadImages, uploadSingleImage };
