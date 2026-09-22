const colorPattern = /^#[0-9a-f]{6}$/i;

const optionalText = (value, maxLength) => {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  return text && text.length <= maxLength ? text : undefined;
};

const normalizeDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 23).replace('T', ' ');
};

const normalizeLink = (value) => {
  const link = optionalText(value, 500);
  if (link === null || link === undefined) return link;
  if (link.startsWith('/') && !link.startsWith('//')) return link;
  try {
    const url = new URL(link);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const normalizeAnnouncementPayload = (body = {}) => {
  const messageTr = String(body.messageTr || '').trim();
  const messageEn = optionalText(body.messageEn, 240);
  const linkLabelTr = optionalText(body.linkLabelTr, 80);
  const linkLabelEn = optionalText(body.linkLabelEn, 80);
  const linkUrl = normalizeLink(body.linkUrl);
  const backgroundColor = String(body.backgroundColor || '').trim().toUpperCase();
  const textColor = String(body.textColor || '').trim().toUpperCase();
  const durationSeconds = Number(body.durationSeconds);
  const sortOrder = Number(body.sortOrder ?? 0);
  const startsAt = normalizeDateTime(body.startsAt);
  const endsAt = normalizeDateTime(body.endsAt);

  if (messageTr.length < 2 || messageTr.length > 240) return null;
  if ([messageEn, linkLabelTr, linkLabelEn, linkUrl, startsAt, endsAt].includes(undefined)) return null;
  if (!colorPattern.test(backgroundColor) || !colorPattern.test(textColor)) return null;
  if (!Number.isInteger(durationSeconds) || durationSeconds < 3 || durationSeconds > 60) return null;
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100000) return null;
  if (startsAt && endsAt && startsAt >= endsAt) return null;

  return {
    messageTr,
    messageEn,
    linkLabelTr,
    linkLabelEn,
    linkUrl,
    linkUnderline: body.linkUnderline !== false,
    backgroundColor,
    textColor,
    durationSeconds,
    sortOrder,
    isActive: body.isActive !== false,
    startsAt,
    endsAt,
  };
};

const normalizeAnnouncementOrder = (body = {}) => {
  if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > 100) return null;
  const ids = body.ids.map(Number);
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) return null;
  if (new Set(ids).size !== ids.length) return null;
  return ids;
};

module.exports = { colorPattern, normalizeAnnouncementOrder, normalizeAnnouncementPayload, normalizeLink };
