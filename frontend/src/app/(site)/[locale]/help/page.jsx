import ContentPage from '@/components/site/content-page';

export default async function HelpPage({ params }) {
  const { locale } = await params; const tr = locale === 'tr';
  return <ContentPage eyebrow={tr ? 'Destek' : 'Support'} title={tr ? 'Nasıl yardımcı olabiliriz?' : 'How can we help?'} description={tr ? 'Sipariş, teslimat, iade ve ürün seçimi hakkında destek.' : 'Support for orders, delivery, returns and product selection.'}><p>{tr ? 'İletişim kanalları, çalışma saatleri ve iade koşulları firma tarafından doğrulandıktan sonra bu alanda yayınlanacaktır.' : 'Contact channels, opening hours and return terms will be published here after company approval.'}</p></ContentPage>;
}
