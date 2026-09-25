const settingsService = require('../services/settingsService');

const validCommerceSettings = (body) => (
  Number.isSafeInteger(body.dispatchMinDays) && body.dispatchMinDays >= 0 && body.dispatchMinDays <= 30
  && Number.isSafeInteger(body.dispatchMaxDays) && body.dispatchMaxDays >= body.dispatchMinDays && body.dispatchMaxDays <= 60
  && Number.isSafeInteger(body.returnWindowDays) && body.returnWindowDays >= 1 && body.returnWindowDays <= 365
);

exports.getCommerce = async (req, res, next) => {
  try {
    const settings = await settingsService.getCommerceSettings();
    return res.json({ status: true, message: req.t('settings.found'), data: { settings } });
  } catch (error) { return next(error); }
};

exports.updateCommerce = async (req, res, next) => {
  try {
    if (!validCommerceSettings(req.body)) {
      return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
    }
    const settings = await settingsService.updateCommerceSettings({
      dispatchMinDays: req.body.dispatchMinDays,
      dispatchMaxDays: req.body.dispatchMaxDays,
      returnWindowDays: req.body.returnWindowDays,
    }, {
      userId: req.user.id,
      requestId: req.requestId,
      ip: req.ip || '',
    });
    return res.json({ status: true, message: req.t('settings.updated'), data: { settings } });
  } catch (error) { return next(error); }
};
