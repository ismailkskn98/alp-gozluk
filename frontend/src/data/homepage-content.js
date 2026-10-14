export const homepageImageFallbacks = {
  categoryPrimary: '/mockup-gozlukler/2@4x.png',
  categorySecondary: '/mockup-gozlukler/3@4x.png',
  frameStory: '/mockup-gozlukler/16@9x.png',
};

export const homepageContentDefaults = {
  tr: {
    hero: { title: 'Her bakış, kendine özgü.', description: 'Günlük stiline uyum sağlayan güneş gözlükleri ve optik çerçeveler.', primaryAction: 'Koleksiyonu keşfet', secondaryAction: 'Gözlük rehberi' },
    featured: { title: 'Her stile tanıdık bir çerçeve.', description: 'Yeni sezon seçkisinden öne çıkan modeller.', action: 'Tüm ürünleri gör' },
    modelShowcase: { title: 'Çerçeveyi, hayatın içinde gör.', description: 'Seçili modelleri gerçek oranları, farklı yüzler ve günlük stil içinde keşfet.', featured: 'Editoryal seçki', action: 'Ürünü keşfet' },
    categories: { title: 'Bakışına göre seç.', description: 'İhtiyacına ve stiline göre doğru kategoriden başla.', sunglasses: 'Güneş gözlükleri', sunglassesCopy: 'Güneşli günler için net bir karakter.', darkFrames: 'Koyu çerçeveler', darkFramesCopy: 'Günlük stile net bir ifade katan seçili güneş gözlükleri.', action: 'Kategoriyi keşfet', darkFramesAction: 'Seçkiyi gör' },
    frameStory: {
      title: 'İyi bir çerçeve, günün içinde kaybolur.',
      description: 'Doğru ölçü, dengeli form ve rahat kullanım. Seçimini görünüş kadar günlük alışkanlıklarına göre de yap.',
      action: 'Doğru çerçeveyi bul',
      visualLabel: 'Zemin üzerinde sergilenen güneş gözlükleri',
      points: [
        { title: 'Özenli seçki', description: 'Stil ve kullanım odağında seçilen modeller.' },
        { title: 'Yüz uyumu', description: 'Ölçüleri karşılaştırmaya yardımcı rehber.' },
        { title: 'Günlük konfor', description: 'Uzun kullanıma uygun seçim yaklaşımı.' },
        { title: 'Kolay destek', description: 'Sipariş öncesi ve sonrası ulaşılabilir iletişim.' },
      ],
    },
    services: [
      { title: 'Seçim rehberi', description: 'Yüz şekli ve ölçüleri karşılaştır.' },
      { title: 'Güvenli alışveriş', description: 'Ödeme bilgileri sunucu tarafında doğrulanır.' },
      { title: 'Sipariş desteği', description: 'İhtiyaç duyduğunda bize ulaş.' },
    ],
  },
  en: {
    hero: { title: 'Every perspective is personal.', description: 'Sunglasses and optical frames designed to move with your everyday style.', primaryAction: 'Explore the collection', secondaryAction: 'Eyewear guide' },
    featured: { title: 'A familiar frame for every style.', description: 'Selected highlights from the new collection.', action: 'View all products' },
    modelShowcase: { title: 'See the frame in real life.', description: 'Explore selected frames through real proportions, different faces and everyday styling.', featured: 'Editorial selection', action: 'Explore product' },
    categories: { title: 'Choose for your perspective.', description: 'Start with the category that fits your needs and style.', sunglasses: 'Sunglasses', sunglassesCopy: 'A clear point of view for brighter days.', darkFrames: 'Dark frames', darkFramesCopy: 'Selected sunglasses that bring a clear point of view to everyday style.', action: 'Explore category', darkFramesAction: 'View the edit' },
    frameStory: {
      title: 'A good frame disappears into your day.',
      description: 'The right measurements, a balanced shape and comfortable wear. Choose around your daily habits as much as your look.',
      action: 'Find the right frame',
      visualLabel: 'Sunglasses displayed on a textured plinth',
      points: [
        { title: 'Considered edit', description: 'Frames selected around style and daily use.' },
        { title: 'Face fit', description: 'A guide that helps compare measurements.' },
        { title: 'Daily comfort', description: 'A considered approach to longer wear.' },
        { title: 'Easy support', description: 'Accessible help before and after your order.' },
      ],
    },
    services: [
      { title: 'Selection guide', description: 'Compare face shape and frame measurements.' },
      { title: 'Secure shopping', description: 'Payment details are verified on the server.' },
      { title: 'Order support', description: 'Reach us whenever you need help.' },
    ],
  },
};

export function mergeHomepageContent(config = {}) {
  const merged = {};
  for (const locale of ['tr', 'en']) {
    const defaults = homepageContentDefaults[locale];
    const overrides = config[locale] || {};
    merged[locale] = {
      hero: { ...defaults.hero, ...(overrides.hero || {}) },
      featured: { ...defaults.featured, ...(overrides.featured || {}) },
      modelShowcase: { ...defaults.modelShowcase, ...(overrides.modelShowcase || {}) },
      categories: { ...defaults.categories, ...(overrides.categories || {}) },
      frameStory: {
        ...defaults.frameStory,
        ...(overrides.frameStory || {}),
        points: overrides.frameStory?.points?.length === 4 ? overrides.frameStory.points : defaults.frameStory.points,
      },
      services: overrides.services?.length === 3 ? overrides.services : defaults.services,
    };
  }
  return merged;
}
