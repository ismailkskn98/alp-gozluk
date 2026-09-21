const audiencePaths = {
  tr: { women: 'kadin', men: 'erkek', kids: 'cocuk' },
  en: { women: 'women', men: 'men', kids: 'kids' },
};

const promoImages = {
  women: '/mockup-gozlukler/2@4x.png',
  men: '/mockup-gozlukler/4@4x.png',
  kids: '/mockup-gozlukler/5@4x.png',
  collections: '/mockup-gozlukler/6@4x.png',
};

export function buildFallbackNavigation(locale, t) {
  const paths = audiencePaths[locale] || audiencePaths.tr;
  const audienceItems = ['women', 'men', 'kids'].map((code) => {
    const basePath = `/shop/${paths[code]}`;
    return {
      code,
      label: t(code),
      href: basePath,
      imageUrl: promoImages[code],
      description: t(`${code}Promo`),
      children: [
        {
          code: `${code}-highlights`,
          label: t('highlights'),
          columnPosition: 1,
          children: [
            { code: `${code}-all`, label: t('allProducts'), href: basePath },
            { code: `${code}-new`, label: t('new'), href: `${basePath}?sort=newest` },
            { code: `${code}-sale`, label: t('discounted'), href: `${basePath}?sale=true` },
          ],
        },
        {
          code: `${code}-types`,
          label: t('productType'),
          columnPosition: 2,
          children: [
            { code: `${code}-sunglasses`, label: t('sunglasses'), href: `${basePath}/${locale === 'tr' ? 'gunes-gozlugu' : 'sunglasses'}` },
            { code: `${code}-optical`, label: t('optical'), href: `${basePath}/${locale === 'tr' ? 'optik' : 'optical'}` },
          ],
        },
        {
          code: `${code}-styles`,
          label: t('frameAndLens'),
          columnPosition: 3,
          children: [
            { code: `${code}-acetate`, label: t('acetate'), href: `${basePath}?material=acetate` },
            { code: `${code}-metal`, label: t('metal'), href: `${basePath}?material=metal` },
            { code: `${code}-polarized`, label: t('polarized'), href: `${basePath}?feature=polarized` },
          ],
        },
      ],
    };
  });

  return {
    code: 'header-main',
    items: [
      ...audienceItems,
      {
        code: 'collections',
        label: t('collections'),
        href: `/collection/${locale === 'tr' ? 'yaz-seckisi' : 'summer-edit'}`,
        imageUrl: promoImages.collections,
        description: t('collectionsPromo'),
        children: [
          {
            code: 'seasonal-collections',
            label: t('seasonalCollections'),
            columnPosition: 1,
            children: [
              { code: 'summer-edit', label: t('summerEdit'), href: `/collection/${locale === 'tr' ? 'yaz-seckisi' : 'summer-edit'}` },
              { code: 'four-seasons', label: t('fourSeasons'), href: `/collection/${locale === 'tr' ? 'dort-mevsim' : 'four-seasons'}` },
              { code: 'polarized-edit', label: t('polarizedEdit'), href: `/collection/${locale === 'tr' ? 'polarize' : 'polarized-edit'}` },
            ],
          },
        ],
      },
      { code: 'sale', label: t('sale'), href: '/shop?sale=true', children: [] },
    ],
  };
}

export function completeNavigation(menu, fallbackMenu) {
  if (!menu?.items?.length || !menu.items.some((item) => item.children?.length)) return fallbackMenu;
  const fallbackByCode = new Map(fallbackMenu.items.map((item) => [item.code, item]));
  return {
    ...menu,
    items: menu.items.map((item) => {
      const fallback = fallbackByCode.get(item.code);
      return {
        ...item,
        href: item.href || fallback?.href || '/shop',
        imageUrl: item.imageUrl || fallback?.imageUrl || null,
        description: item.description || fallback?.description || null,
      };
    }),
  };
}
