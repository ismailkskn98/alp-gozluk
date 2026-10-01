const locationService = require('../services/locationService');

const positiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const respond = (res, locations) => {
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.json({ status: true, message: 'Konum bilgileri listelendi.', data: { locations } });
};

exports.listProvinces = async (req, res, next) => {
  try {
    return respond(res, await locationService.listProvinces());
  } catch (error) {
    return next(error);
  }
};

exports.listDistricts = async (req, res, next) => {
  const provinceId = positiveInteger(req.params.provinceId);
  if (!provinceId) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    return respond(res, await locationService.listDistricts(provinceId));
  } catch (error) {
    return next(error);
  }
};

exports.listNeighborhoods = async (req, res, next) => {
  const districtId = positiveInteger(req.params.districtId);
  if (!districtId) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }
  try {
    return respond(res, await locationService.listNeighborhoods(districtId));
  } catch (error) {
    return next(error);
  }
};
