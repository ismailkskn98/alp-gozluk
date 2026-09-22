'use client';

import Image from 'next/image';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmActionDialog from '@/components/admin/ui/confirm-action-dialog';
import { Link } from '@/i18n/navigation';
import AccountSectionHeader from './section-header';

function formatPrice(product, locale) {
  if (product.priceAmount === null || product.priceAmount === undefined) return 'Fiyat bilgisi yakında';
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency', currency: product.currency || 'TRY', maximumFractionDigits: 0,
  }).format(product.priceAmount);
}

export default function Favorites({ favorites, locale, onRemove }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function removeFavorite() {
    if (!deleteTarget) return;
    setRemoving(true);
    await onRemove(deleteTarget.id);
    setRemoving(false);
    setDeleteTarget(null);
  }

  return (
    <section>
      <AccountSectionHeader
        kicker="Sonra incelemek için kaydettiklerin"
        title="Favorilerim"
        description={favorites.length ? `${favorites.length} çerçeveyi karşılaştırmak veya ürün detayına dönmek için kaydettin.` : 'Beğendiğin modelleri burada bir arada tutabilirsin.'}
      />
      {favorites.length ? (
        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
          {favorites.map((product) => (
            <article key={product.id} className="group min-w-0">
              <div className="relative aspect-[4/5] overflow-hidden bg-white">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw" className="object-contain transition-transform duration-500 group-hover:scale-[1.025]" />
                ) : null}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(product)}
                  aria-label={`${product.name} ürününü favorilerden çıkar`}
                  className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full border border-black/8 bg-white/95 text-[#172536] transition-colors hover:bg-[#172536] hover:text-white"
                >
                  <Heart className="size-4 fill-current" strokeWidth={1.4} />
                </button>
              </div>
              <div className="mt-3 border-t border-[#d8ddd7] pt-3">
                <Link href={`/product/${product.slug}`} className="block truncate text-sm font-medium text-[#172536] hover:underline">{product.name}</Link>
                <p className="mt-1 truncate text-xs text-[#68736f]">{product.variant || 'Favorilerine eklendi'}</p>
                <p className="mt-2 text-sm text-[#172536] tabular-nums">{formatPrice(product, locale)}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7 border-y border-[#d8ddd7] py-14 text-center">
          <Heart className="mx-auto size-6 text-[#7a8781]" strokeWidth={1.35} />
          <h3 className="mt-4 text-lg text-[#172536]">Henüz kaydettiğin bir çerçeve yok</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#68736f]">Ürünlerdeki kalp simgesini kullanarak karşılaştırmak istediğin modelleri burada topla.</p>
          <Link href="/shop" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#172536]"><ShoppingBag className="size-4" /> Gözlükleri keşfet</Link>
        </div>
      )}
      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={removeFavorite}
        title="Favorilerden çıkar"
        description="Bu çerçeve favori listenden kaldırılacak. İstersen ürün sayfasından tekrar ekleyebilirsin."
        itemName={deleteTarget?.name}
        confirmLabel="Favorilerden çıkar"
        pending={removing}
        icon={Trash2}
      />
    </section>
  );
}
