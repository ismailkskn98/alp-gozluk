const productImage = (folder, file = 'main.webp') => `/gozlukler/${folder}/${file}`;

const demoProducts = {
  celine: {
    id: 'demo-celine-cl40235u',
    slug: 'celine-paris-cl40235u-3h',
    name: 'Celine Paris CL40235U',
    variant: 'Altın · Koyu yeşil',
    priceAmount: 12490,
    currency: 'TRY',
    imageUrl: productImage('CELINE-PARIS_CL40235U_54-18-145'),
  },
  prada: {
    id: 'demo-prada-pr17ws',
    slug: 'prada-pr17ws-1ab5s0',
    name: 'Prada PR17WS',
    variant: 'Siyah · Füme',
    priceAmount: 10990,
    currency: 'TRY',
    imageUrl: productImage('PRADA_PR17WS_1AB5S0'),
  },
  rayban: {
    id: 'demo-rayban-rb3016',
    slug: 'ray-ban-rb3016-clubmaster-902-57',
    name: 'Ray-Ban RB3016 Clubmaster',
    variant: 'Siyah · G15 yeşil',
    priceAmount: 7290,
    currency: 'TRY',
    imageUrl: productImage('RAYBAN_RB3016_CLUBMASTER_902-57'),
  },
  fendi: {
    id: 'demo-fendi-fe4075us',
    slug: 'fendi-first-crystal-fe4075us-30a',
    name: 'Fendi FE4075US',
    variant: 'Havana · Kahverengi',
    priceAmount: 9890,
    currency: 'TRY',
    imageUrl: productImage('FENDI_FE4075US_30A_54-15-135'),
  },
};

const favorites = Object.values(demoProducts);

const orders = [
  {
    orderNumber: 'ALP-260918-1048',
    status: 'completed',
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    totalAmount: 19780,
    currency: 'TRY',
    placedAt: '2026-09-18T11:42:00+03:00',
    deliveredAt: '2026-09-21T14:18:00+03:00',
    itemCount: 2,
    shipment: { company: 'Yurtiçi Kargo', trackingNumber: 'ALP882104573' },
    items: [demoProducts.prada, demoProducts.fendi],
    address: 'Çankaya, Ankara',
  },
  {
    orderNumber: 'ALP-260907-0872',
    status: 'paid',
    paymentStatus: 'paid',
    fulfillmentStatus: 'shipped',
    totalAmount: 12490,
    currency: 'TRY',
    placedAt: '2026-09-07T16:05:00+03:00',
    itemCount: 1,
    shipment: { company: 'Aras Kargo', trackingNumber: 'AR204918662' },
    items: [demoProducts.celine],
    address: 'Kadıköy, İstanbul',
  },
  {
    orderNumber: 'ALP-260821-0641',
    status: 'completed',
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    totalAmount: 7290,
    currency: 'TRY',
    placedAt: '2026-08-21T10:28:00+03:00',
    deliveredAt: '2026-08-24T13:10:00+03:00',
    itemCount: 1,
    items: [demoProducts.rayban],
    address: 'Çankaya, Ankara',
  },
];

const returns = [
  {
    returnNumber: 'IA-260824-031',
    orderNumber: 'ALP-260821-0641',
    status: 'approved',
    requestedAt: '2026-08-25T09:16:00+03:00',
    updatedAt: '2026-08-28T15:40:00+03:00',
    reason: 'Çerçeve yüzüme beklediğimden geniş geldi.',
    refundAmount: 7290,
    currency: 'TRY',
    items: [demoProducts.rayban],
  },
];

const addresses = [
  {
    id: 'demo-address-home',
    title: 'Ev',
    firstName: 'İsmail',
    lastName: 'Keskin',
    phone: '0542 798 20 78',
    countryCode: 'TR',
    city: 'Ankara',
    district: 'Çankaya',
    postalCode: '06810',
    addressLine: 'Yaşamkent Mahallesi, 3125. Sokak No: 13, Daire 8',
    isDefault: true,
    isDemo: true,
  },
  {
    id: 'demo-address-work',
    title: 'İş',
    firstName: 'İsmail',
    lastName: 'Keskin',
    phone: '0542 798 20 78',
    countryCode: 'TR',
    city: 'Ankara',
    district: 'Sincan',
    postalCode: '06930',
    addressLine: 'Malıköy Mahallesi, Anadolu OSB 18. Cadde No: 4',
    isDefault: false,
    isDemo: true,
  },
];

export function withDemoAccount(account, user) {
  const source = account || {};
  return {
    ...source,
    profile: source.profile || user,
    addresses: source.addresses?.length ? source.addresses : addresses,
    orders: source.orders?.length ? source.orders : orders,
    returns: source.returns?.length ? source.returns : returns,
    favorites: source.favorites?.length ? source.favorites : favorites,
  };
}
