import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { PRODUCT_IMAGE_QUALITY } from '@/lib/product-images';
import ModelCard from './model-card';

const maleModelNames = new Set(['ardahan', 'burak', 'buğra', 'özgün']);

function collectMedia(products) {
  const entries = products.flatMap((product) => (product.lifestyleImages || []).map((image) => ({ image, product })));
  return entries.sort((left, right) => Number(right.image.isFeatured) - Number(left.image.isFeatured));
}

function selectUniqueProducts(entries, limit, excludedProductIds = new Set()) {
  const selected = [];
  const productIds = new Set(excludedProductIds);

  for (const entry of entries) {
    if (selected.length >= limit) break;
    if (productIds.has(entry.product.id)) continue;
    selected.push(entry);
    productIds.add(entry.product.id);
  }

  return selected;
}

export default function ModelShowcase({ products, copy }) {
  const entries = collectMedia(products);
  const primary = entries[0];
  if (!primary) return null;

  const sideEntries = entries.filter((entry) => entry.image.role === 'on_model' && entry.image.url !== primary.image.url);
  const maleEntries = sideEntries.filter((entry) => maleModelNames.has(entry.image.modelName?.toLocaleLowerCase('tr-TR')));
  const leftEntries = selectUniqueProducts(maleEntries, 2, new Set([primary.product.id]));
  const usedProductIds = new Set([primary.product.id, ...leftEntries.map((entry) => entry.product.id)]);
  const rightEntries = selectUniqueProducts(sideEntries, 2, usedProductIds);

  return (
    <section className="home-deferred-section grid-container bg-[#efece7] py-[clamp(4rem,9vw,8rem)]" aria-labelledby="model-showcase-title">
      <div>
        <div className="grid gap-5 md:grid-cols-[minmax(0,0.75fr)_minmax(18rem,0.25fr)] md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#666a70]">ALP / On frame</p>
            <h2 id="model-showcase-title" className="mt-4 max-w-[13ch] text-balance text-[clamp(2.5rem,5vw,5.75rem)] font-normal leading-[0.92] tracking-[-0.055em]">{copy.title}</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#666a70] md:justify-self-end">{copy.description}</p>
        </div>

        <div className="mt-[clamp(2.5rem,5vw,5rem)] grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(13rem,0.66fr)_minmax(0,1.24fr)_minmax(13rem,0.66fr)]">
          {leftEntries.length > 0 ? (
            <div className="order-2 grid grid-cols-2 gap-3 md:grid-cols-1 lg:col-start-1 lg:row-start-1">
              {leftEntries.map((entry) => <ModelCard key={entry.image.url} entry={entry} imageLabel={copy.imageLabel} />)}
            </div>
          ) : null}

          <Link href={`/product/${primary.product.slug}`} className="group order-1 flex min-w-0 flex-col md:col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
            <div className="relative min-h-[clamp(28rem,112vw,42rem)] flex-1 overflow-hidden sm:min-h-[clamp(30rem,64vw,40rem)] lg:min-h-0">
              <Image
                src={primary.image.url}
                alt={primary.image.altText || `${primary.product.name} ${copy.imageLabel}`}
                fill
                quality={PRODUCT_IMAGE_QUALITY}
                sizes="(min-width: 1024px) 48vw, 96vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.015]"
              />
            </div>
            <div className="flex items-end justify-between gap-5 pt-3 text-[#232323]">
              <div><p className="text-xs text-[#666a70]">{copy.featured}</p><h3 className="mt-1 text-[clamp(1.35rem,2.2vw,2.35rem)] font-normal tracking-[-0.035em]">{primary.product.name}</h3></div>
              <span className="inline-flex shrink-0 items-center gap-2 border-b border-[#232323]/70 pb-1 text-sm font-medium">{copy.action}<ArrowUpRight className="size-4" /></span>
            </div>
          </Link>

          {rightEntries.length > 0 ? (
            <div className="order-3 grid grid-cols-2 gap-3 md:grid-cols-1 lg:col-start-3 lg:row-start-1">
              {rightEntries.map((entry) => <ModelCard key={entry.image.url} entry={entry} imageLabel={copy.imageLabel} />)}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
