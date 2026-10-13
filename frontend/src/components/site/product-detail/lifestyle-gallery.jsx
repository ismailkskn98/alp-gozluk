import Image from 'next/image';
import { PRODUCT_IMAGE_QUALITY } from '@/lib/product-images';

export default function LifestyleGallery({ images = [], name, locale }) {
  const availableImages = images.filter((image) => image?.url).slice(0, 8);
  if (availableImages.length === 0) return null;

  const tr = locale === 'tr';
  const [primaryImage, ...secondaryImages] = availableImages;

  return (
    <section className="mt-[clamp(4rem,9vw,9rem)] border-t border-black/10 pt-[clamp(2rem,5vw,4.5rem)]" aria-labelledby="product-on-model-title">
      <div className="grid gap-5 md:grid-cols-[minmax(0,0.7fr)_minmax(18rem,0.3fr)] md:items-end">
        <h2 id="product-on-model-title" className="max-w-[13ch] text-[clamp(2rem,4vw,4.5rem)] font-normal leading-[0.95] tracking-[-0.05em]">
          {tr ? 'Çerçevenin gerçek duruşu.' : 'See the frame in context.'}
        </h2>
        <p className="max-w-md text-sm leading-6 text-muted-foreground md:justify-self-end">
          {tr ? `${name} modelinin oranlarını, yüz üzerindeki duruşunu ve farklı açılardaki karakterini inceleyin.` : `Explore the proportions, on-face fit and character of ${name} from different angles.`}
        </p>
      </div>

      <div className="mt-[clamp(2rem,4vw,4rem)] grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <figure className="relative min-h-[clamp(30rem,65vw,52rem)] overflow-hidden bg-[#f4f4f2]">
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText || `${name} ${tr ? 'editoryal görünüm' : 'editorial view'}`}
            fill
            quality={PRODUCT_IMAGE_QUALITY}
            sizes="(min-width: 1024px) 62vw, 96vw"
            className={primaryImage.role === 'editorial' ? 'object-contain' : 'object-cover'}
          />
        </figure>
        {secondaryImages.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {secondaryImages.slice(0, 3).map((image, index) => (
              <figure key={`${image.url}-${index}`} className="relative min-h-[26rem] overflow-hidden bg-[#ecebe8] lg:min-h-0 lg:aspect-[4/5]">
                <Image
                  src={image.url}
                  alt={image.altText || `${name} ${tr ? 'model görünümü' : 'on-model view'} ${index + 1}`}
                  fill
                  quality={PRODUCT_IMAGE_QUALITY}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 96vw"
                  className={image.role === 'editorial' ? 'object-contain' : 'object-cover'}
                />
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
