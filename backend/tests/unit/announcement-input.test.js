const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAnnouncementOrder, normalizeAnnouncementPayload, normalizeLink } = require('../../alpgozluk/v1/helpers/announcementInput');

const validPayload = {
  messageTr: '1.500 TL ve üzeri ücretsiz kargo.',
  messageEn: 'Free shipping over 1,500 TL.',
  linkLabelTr: 'Detaylar',
  linkUrl: '/teslimat',
  backgroundColor: '#E5E5DC',
  textColor: '#17191D',
  durationSeconds: 5,
  sortOrder: 0,
  isActive: true,
};

test('duyuru girdisini güvenli biçimde normalize eder', () => {
  const payload = normalizeAnnouncementPayload(validPayload);
  assert.equal(payload.messageTr, validPayload.messageTr);
  assert.equal(payload.linkUrl, '/teslimat');
  assert.equal(payload.durationSeconds, 5);
  assert.equal(payload.linkUnderline, true);
});

test('güvensiz link protokollerini ve şema dışı renkleri reddeder', () => {
  assert.equal(normalizeLink('javascript:alert(1)'), undefined);
  assert.equal(normalizeLink('//evil.example'), undefined);
  assert.equal(normalizeAnnouncementPayload({ ...validPayload, backgroundColor: 'red' }), null);
  assert.equal(normalizeAnnouncementPayload({ ...validPayload, backgroundColor: '#F00000', textColor: '#FFFFFF' }).backgroundColor, '#F00000');
  assert.equal(normalizeAnnouncementPayload({ ...validPayload, backgroundColor: '#FFFFFF', textColor: '#BBBBBB' }).textColor, '#BBBBBB');
});

test('rotasyon süresini 3 ile 60 saniye arasında sınırlar', () => {
  assert.equal(normalizeAnnouncementPayload({ ...validPayload, durationSeconds: 2 }), null);
  assert.equal(normalizeAnnouncementPayload({ ...validPayload, durationSeconds: 61 }), null);
});

test('duyuru sıralamasında benzersiz pozitif kimlikleri kabul eder', () => {
  assert.deepEqual(normalizeAnnouncementOrder({ ids: [3, 1, 2] }), [3, 1, 2]);
  assert.equal(normalizeAnnouncementOrder({ ids: [1, 1] }), null);
  assert.equal(normalizeAnnouncementOrder({ ids: [0, 2] }), null);
});
