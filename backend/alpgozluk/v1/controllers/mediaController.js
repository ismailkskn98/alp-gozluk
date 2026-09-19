const mediaService = require('../services/mediaService');

const parsePositiveInteger = (value, fallback, max) => {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) return fallback;
  return Math.min(parsedValue, max);
};

exports.listMedia = async (req, res) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1, 100000);
    const limit = parsePositiveInteger(req.query.limit, 20, 100);
    const entityType = req.query.entityType
      ? String(req.query.entityType).trim().toLowerCase()
      : undefined;
    const entityId = req.query.entityId
      ? parsePositiveInteger(req.query.entityId, null, Number.MAX_SAFE_INTEGER)
      : undefined;
    const result = await mediaService.listMedia({ page, limit, entityType, entityId });

    return res.json({ status: true, message: req.t('media.listed'), data: result });
  } catch (error) {
    console.error('Medya listeleme hatası:', error);
    return res.status(error.statusCode || 500).json({
      status: false,
      message: error.statusCode ? req.t('validation.invalid_request') : req.t('errors.server_error'),
    });
  }
};

exports.uploadMedia = async (req, res) => {
  if (!req.files?.length) {
    return res.status(422).json({ status: false, message: req.t('validation.file_required') });
  }

  try {
    const records = await mediaService.uploadMedia({
      files: req.files,
      input: req.body,
      userId: req.user.id,
    });
    return res.status(201).json({ status: true, message: req.t('media.uploaded'), data: { records } });
  } catch (error) {
    console.error('Medya yükleme hatası:', error);
    return res.status(error.statusCode || 500).json({
      status: false,
      message: error.statusCode ? req.t('validation.invalid_file') : req.t('errors.server_error'),
    });
  }
};

exports.updateMedia = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_id') });
  }

  try {
    const record = await mediaService.updateMedia({ id, ...req.body });
    if (!record) return res.status(404).json({ status: false, message: req.t('media.not_found') });
    return res.json({ status: true, message: req.t('media.updated'), data: { record } });
  } catch (error) {
    console.error('Medya güncelleme hatası:', error);
    return res.status(error.statusCode || 500).json({
      status: false,
      message: error.statusCode ? req.t('validation.invalid_request') : req.t('errors.server_error'),
    });
  }
};

exports.replaceMedia = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_id') });
  }
  if (!req.file) {
    return res.status(422).json({ status: false, message: req.t('validation.file_required') });
  }

  try {
    const record = await mediaService.replaceMedia({ id, file: req.file, userId: req.user.id });
    if (!record) return res.status(404).json({ status: false, message: req.t('media.not_found') });
    return res.json({ status: true, message: req.t('media.replaced'), data: { record } });
  } catch (error) {
    console.error('Medya değiştirme hatası:', error);
    return res.status(error.statusCode || 500).json({
      status: false,
      message: error.statusCode ? req.t('validation.invalid_file') : req.t('errors.server_error'),
    });
  }
};

exports.deleteMedia = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_id') });
  }

  try {
    const deleted = await mediaService.deleteMedia(id);
    if (!deleted) return res.status(404).json({ status: false, message: req.t('media.not_found') });
    return res.json({ status: true, message: req.t('media.deleted'), data: {} });
  } catch (error) {
    console.error('Medya silme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};
