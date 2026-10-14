const { normalizeHomepagePayload } = require('../helpers/homepageInput');
const homepageService = require('../services/homepageService');

exports.getHomepage = async (req, res, next) => {
  try {
    const config = await homepageService.getHomepage();
    return res.json({ status: true, message: req.t('settings.found'), data: { config } });
  } catch (error) {
    return next(error);
  }
};

exports.updateHomepage = async (req, res, next) => {
  const input = normalizeHomepagePayload(req.body);
  if (!input) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const config = await homepageService.updateHomepage(input, {
      userId: req.user.id,
      requestId: req.requestId,
      ip: req.ip || '',
    });
    return res.json({ status: true, message: req.t('settings.updated'), data: { config } });
  } catch (error) {
    return next(error);
  }
};
