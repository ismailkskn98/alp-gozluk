const { normalizeAnnouncementOrder, normalizeAnnouncementPayload } = require('../helpers/announcementInput');
const announcementService = require('../services/announcementService');

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const requestMeta = (req) => ({ userId: req.user.id, requestId: req.requestId, ip: req.ip || '' });

exports.publicList = async (req, res, next) => {
  try {
    const announcements = await announcementService.listPublic(req.query.locale);
    return res.json({ status: true, message: req.t('announcements.listed'), data: { announcements } });
  } catch (error) { return next(error); }
};

exports.adminList = async (req, res, next) => {
  try {
    const announcements = await announcementService.listAdmin();
    return res.json({ status: true, message: req.t('announcements.listed'), data: { announcements } });
  } catch (error) { return next(error); }
};

exports.create = async (req, res, next) => {
  const payload = normalizeAnnouncementPayload(req.body);
  if (!payload) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const id = await announcementService.create(payload, requestMeta(req));
    return res.status(201).json({ status: true, message: req.t('announcements.created'), data: { id } });
  } catch (error) { return next(error); }
};

exports.update = async (req, res, next) => {
  const id = parseId(req.params.id);
  const payload = normalizeAnnouncementPayload(req.body);
  if (!id || !payload) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const updated = await announcementService.update(id, payload, requestMeta(req));
    if (!updated) return res.status(404).json({ status: false, message: req.t('announcements.not_found') });
    return res.json({ status: true, message: req.t('announcements.updated'), data: {} });
  } catch (error) { return next(error); }
};

exports.reorder = async (req, res, next) => {
  const ids = normalizeAnnouncementOrder(req.body);
  if (!ids) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const reordered = await announcementService.reorder(ids, requestMeta(req));
    if (!reordered) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
    return res.json({ status: true, message: req.t('announcements.reordered'), data: {} });
  } catch (error) { return next(error); }
};

exports.remove = async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const removed = await announcementService.remove(id, requestMeta(req));
    if (!removed) return res.status(404).json({ status: false, message: req.t('announcements.not_found') });
    return res.json({ status: true, message: req.t('announcements.deleted'), data: {} });
  } catch (error) { return next(error); }
};
