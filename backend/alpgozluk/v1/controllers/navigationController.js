const { normalizeNavigationPayload } = require('../helpers/navigationInput');
const navigationService = require('../services/navigationService');

exports.publicHeader = async (req, res, next) => {
  try {
    const menu = await navigationService.getHeader(req.query.locale, false);
    return res.json({ status: true, message: req.t('navigation.listed'), data: { menu } });
  } catch (error) { return next(error); }
};

exports.adminHeader = async (req, res, next) => {
  try {
    const menu = await navigationService.getHeaderEditor();
    return res.json({ status: true, message: req.t('navigation.listed'), data: { menu } });
  } catch (error) { return next(error); }
};

exports.updateHeader = async (req, res, next) => {
  const payload = normalizeNavigationPayload(req.body);
  if (!payload) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    await navigationService.saveHeader(payload, { userId: req.user.id, requestId: req.requestId, ip: req.ip || '' });
    return res.json({ status: true, message: req.t('navigation.updated'), data: {} });
  } catch (error) { return next(error); }
};
