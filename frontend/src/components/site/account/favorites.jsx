'use client';

import Image from 'next/image';
import { Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import AccountSectionHeader from './section-header';
import { useAddCartItem } from '@/features/commerce';
import { announceCartItemAdded } from '@/components/site/commerce/events';

function formatPrice(product, locale) {
  const amount = product.priceAmount ?? product.currentPrice ?? product.price;
  if (amount === null || amount === undefined) return locale === 'tr' ? 'Fiyat bilgisi yakında' : 'Price coming soon';
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency', currency: product.currency || 'TRY', maximumFractionDigits: 0,
  }).format(Number(amount));
}

function favoriteImage(product) {
  return product.imageUrl || product.image || product.primaryImage?.url || product.images?.[0]?.url || product.images?.[0] || '';
}

export default function Favorites({ favorites, locale, onRemove, pending = false, error = false }) {
  const [removingId, setRemovingId] = useState(null);
  const addCartItem = useAddCartItem();
  const tr = locale === 'tr';
  const copy = tr ? {
    kicker: 'Sonra incelemek için kaydettiklerin',
    title: 'Favorilerim',
    description: favorites.length
      ? `${favorites.length} çerçeveyi karşılaştırmak veya ürün detayına dönmek için kaydettin.`
      : 'Beğendiğin modelleri burada bir arada tutabilirsin.',
    error: 'Favoriler şu anda güncellenemedi. Lütfen tekrar dene.',
    remove: (name) => `${name} ürününü favorilerden çıkar`,
    added: 'Favorilerine eklendi',
    emptyTitle: 'Henüz kaydettiğin bir çerçeve yok',
    emptyDescription: 'Ürünlerdeki kalp simgesini kullanarak karşılaştırmak istediğin modelleri burada topla.',
    explore: 'Gözlükleri keşfet',
    updating: 'Favori güncelleniyor.',
    adding: 'Ürün sepete ekleniyor.',
  } : {
    kicker: 'Frames saved for later',
    title: 'Favorites',
    description: favorites.length
      ? `You saved ${favorites.length} frame${favorites.length === 1 ? '' : 's'} to compare or revisit.`
      : 'Keep the frames you like together here.',
    error: 'Favorites could not be updated right now. Please try again.',
    remove: (name) => `Remove ${name} from favorites`,
    added: 'Added to favorites',
    emptyTitle: 'You have not saved a frame yet',
    emptyDescription: 'Use the heart icon on a product to keep the frames you want to compare here.',
    explore: 'Explore eyewear',
    updating: 'Updating favorites.',
    adding: 'Adding product to cart.',
  };

  async function removeFavorite(productId) {
    if (removingId) return;
    setRemovingId(productId);
    try {
      await onRemove(productId);
    } finally {
      setRemovingId(null);
    }
  }

  function addFavoriteToCart(product) {
    if (!product.defaultVariantId || Number(product.activeVariantCount) !== 1) return;
    addCartItem.mutate(
      { productId: Number(product.id), variantId: Number(product.defaultVariantId), quantity: 1 },
      { onSuccess: () => announceCartItemAdded({ productId: product.id, name: product.name }) },
    );
  }

  return (
    <section>
      <AccountSectionHeader
        kicker={copy.kicker}
        title={copy.title}
        description={copy.description}
      />
      {error ? <p className="mt-5 border border-danger/25 bg-danger/5 p-4 text-sm text-danger" role="alert">{copy.error}</p> : null}
      {favorites.length ? (
        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
          {favorites.map((product) => (
            <article key={product.id} className="group min-w-0">
              <div className="relative aspect-[4/5] overflow-hidden bg-white">
                {favoriteImage(product) ? (
                  <Image src={favoriteImage(product)} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw" className="object-contain transition-transform duration-500 group-hover:scale-[1.025]" />
                ) : null}
                <button
                  type="button"
                  onClick={() => removeFavorite(product.id)}
                  disabled={pending || removingId === product.id}
                  aria-label={copy.remove(product.name)}
                  className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full border border-black/8 bg-white/95 text-[#172536] transition-colors hover:bg-[#172536] hover:text-white disabled:cursor-wait disabled:opacity-55"
                >
                  <Heart className="size-4 fill-current" strokeWidth={1.4} />
                </button>
                {product.defaultVariantId && Number(product.activeVariantCount) === 1 ? (
                  <button
                    type="button"
                    onClick={() => addFavoriteToCart(product)}
                    disabled={addCartItem.isPending}
                    aria-label={locale === 'tr' ? `${product.name} sepete ekle` : `Add ${product.name} to cart`}
                    className="absolute bottom-2.5 right-2.5 grid size-9 place-items-center rounded-full border border-black/8 bg-white/95 text-[#172536] transition-colors hover:bg-[#172536] hover:text-white disabled:cursor-wait disabled:opacity-55"
                  >
                    <ShoppingBag className="size-4" strokeWidth={1.4} />
                  </button>
                ) : null}
              </div>
              <div className="mt-3 border-t border-[#d8ddd7] pt-3">
                <Link href={`/product/${product.slug}`} className="block truncate text-sm font-medium text-[#172536] hover:underline">{product.name}</Link>
                <p className="mt-1 truncate text-xs text-[#68736f]">{product.variant?.name || product.variant || copy.added}</p>
                <p className="mt-2 text-sm text-[#172536] tabular-nums">{formatPrice(product, locale)}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7 border-y border-[#d8ddd7] py-14 text-center">
          <Heart className="mx-auto size-6 text-[#7a8781]" strokeWidth={1.35} />
          <h3 className="mt-4 text-lg text-[#172536]">{copy.emptyTitle}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#68736f]">{copy.emptyDescription}</p>
          <Link href="/shop" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#172536]"><ShoppingBag className="size-4" /> {copy.explore}</Link>
        </div>
      )}
      <span className="sr-only" aria-live="polite">{removingId ? copy.updating : addCartItem.isPending ? copy.adding : ''}</span>
    </section>
  );
}
