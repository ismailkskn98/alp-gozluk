const multer = require('multer');

const notFound = (req, res) => {
  res.status(404).json({
    status: false,
    message: req.t('errors.not_found'),
  });
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const messageKey = error.code === 'LIMIT_FILE_SIZE'
      ? 'validation.file_too_large'
      : 'validation.invalid_file';

    return res.status(422).json({
      status: false,
      message: req.t(messageKey),
    });
  }

  console.error(`[${req.requestId || 'no-request-id'}]`, error);

  return res.status(error.statusCode || 500).json({
    status: false,
    message: error.publicMessage || req.t('errors.server_error'),
  });
};

module.exports = { notFound, errorHandler };
