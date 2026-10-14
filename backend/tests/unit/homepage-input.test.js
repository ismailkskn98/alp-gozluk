const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeHomepagePayload } = require('../../alpgozluk/v1/helpers/homepageInput');

const localeContent = {
  hero: { title: 'Başlık', description: 'Açıklama', primaryAction: 'Keşfet', secondaryAction: 'Rehber' },
  featured: { title: 'Ürünler', description: 'Açıklama', action: 'Tümü' },
  modelShowcase: { title: 'Model', description: 'Açıklama', featured: 'Seçki', action: 'İncele' },
  categories: { title: 'Kategoriler', description: 'Açıklama', sunglasses: 'Güneş', sunglassesCopy: 'Güneş açıklaması', darkFrames: 'Koyu', darkFramesCopy: 'Koyu açıklaması', action: 'Keşfet', darkFramesAction: 'Gör' },
  frameStory: {
    title: 'Hikâye', description: 'Açıklama', action: 'Rehber', visualLabel: 'Görsel açıklaması',
    points: Array.from({ length: 4 }, (_, index) => ({ title: `Bilgi ${index}`, description: 'Bilgi açıklaması' })),
  },
  services: Array.from({ length: 3 }, (_, index) => ({ title: `Hizmet ${index}`, description: 'Hizmet açıklaması' })),
};

test('anasayfa içeriği yalnız bilinen alanlar ve bağlı görsel kimlikleriyle normalize edilir', () => {
  const result = normalizeHomepagePayload({
    tr: localeContent,
    en: localeContent,
    images: { categoryPrimary: 10, categorySecondary: null, frameStory: 12 },
  });
  assert.equal(result.images.categoryPrimary, 10);
  assert.equal(result.images.categorySecondary, null);
  assert.equal(result.tr.frameStory.points.length, 4);
});

test('anasayfa içeriği eksik kartları ve biçimsiz görsel kimliklerini reddeder', () => {
  assert.equal(normalizeHomepagePayload({
    tr: { ...localeContent, services: localeContent.services.slice(0, 2) },
    en: localeContent,
    images: { categoryPrimary: 10, categorySecondary: null, frameStory: 12 },
  }), null);
  assert.equal(normalizeHomepagePayload({
    tr: localeContent,
    en: localeContent,
    images: { categoryPrimary: '1 OR 1=1', categorySecondary: null, frameStory: 12 },
  }), null);
});
