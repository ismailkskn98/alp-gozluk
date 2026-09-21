import { Link } from '@/i18n/navigation';

const audienceLinks = {
  tr: [
    ['Tümü', '/shop'], ['Kadın', '/shop/kadin'], ['Erkek', '/shop/erkek'], ['Çocuk', '/shop/cocuk'],
  ],
  en: [
    ['All', '/shop'], ['Women', '/shop/women'], ['Men', '/shop/men'], ['Kids', '/shop/kids'],
  ],
};

export default function CatalogToolbar({ locale, activeAudience, basePath = '/shop' }) {
  const tr = locale === 'tr';
  const sunglassesHref = activeAudience ? `${basePath}/${tr ? 'gunes-gozlugu' : 'sunglasses'}` : '/shop?type=sunglasses';
  const opticalHref = activeAudience ? `${basePath}/${tr ? 'optik' : 'optical'}` : '/shop?type=optical';
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <nav aria-label={tr ? 'Hedef kitle filtreleri' : 'Audience filters'} className="flex flex-wrap gap-x-6 gap-y-3">
        {audienceLinks[locale].map(([label, href], index) => {
          const codes = [null, 'women', 'men', 'kids'];
          const active = activeAudience === codes[index];
          return <Link key={href} href={href} className={`border-b pb-1 text-sm ${active ? 'border-black text-black' : 'border-transparent text-muted-foreground hover:text-black'}`}>{label}</Link>;
        })}
      </nav>
      <div className="flex gap-5 text-sm">
        <Link href={sunglassesHref} className="text-muted-foreground hover:text-black">{tr ? 'Güneş' : 'Sunglasses'}</Link>
        <Link href={opticalHref} className="text-muted-foreground hover:text-black">{tr ? 'Optik' : 'Optical'}</Link>
      </div>
    </div>
  );
}
