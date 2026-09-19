import ContentPage from '@/components/site/content-page';

export default async function GuidePage({ params }) {
  const { locale } = await params; const tr = locale === 'tr';
  return <ContentPage eyebrow={tr ? 'ALP Rehber' : 'ALP Guide'} title={tr ? 'Doğru çerçeveyi bul' : 'Find the right frame'} description={tr ? 'Yüz şekli, ölçü ve kullanım alışkanlıklarına göre seçim yapın.' : 'Choose by face shape, fit and daily habits.'}><h2 className="text-xl font-semibold">{tr ? 'Ölçüleri anlamak' : 'Understanding measurements'}</h2><p>{tr ? 'Çerçeve sapında yer alan cam, köprü ve sap ölçülerini mevcut rahat bir gözlüğünüzle karşılaştırın.' : 'Compare the lens, bridge and temple measurements with a comfortable pair you already own.'}</p><h2 className="text-xl font-semibold">{tr ? 'Konfor önce gelir' : 'Comfort comes first'}</h2><p>{tr ? 'Gözlük burun üzerinde dengeli durmalı, şakaklara baskı yapmamalıdır.' : 'Frames should sit evenly on your nose without pressing on your temples.'}</p></ContentPage>;
}
