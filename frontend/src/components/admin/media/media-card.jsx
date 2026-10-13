'use client';

import { Edit3, ImageIcon, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { AdminButton } from '@/components/admin/ui/button';

const roleLabels = {
  gallery: 'Ürün galerisi',
  on_model: 'Model üzerinde',
  editorial: 'Editoryal',
};

export default function MediaCard({ media, product, onEdit, onDelete }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {media.url ? (
          <Image
            src={media.url}
            alt={media.altText || ''}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 31vw, 92vw"
            className={media.mediaRole === 'gallery' ? 'object-contain p-4' : 'object-cover'}
          />
        ) : (
          <ImageIcon className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-card/92 px-2 py-1 text-[0.68rem] font-medium shadow-sm backdrop-blur">
            {roleLabels[media.mediaRole] || media.mediaRole}
          </span>
          {media.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#172536] px-2 py-1 text-[0.68rem] font-medium text-white shadow-sm">
              <Star className="size-3 fill-current" />Öne çıkan
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{product?.name || `Ürün #${media.entityId}`}</h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {[product?.code, media.modelName || 'Model adı yok'].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-2 line-clamp-2 min-h-8 text-xs leading-4 text-muted-foreground">{media.altText || 'Alternatif metin girilmemiş.'}</p>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-[0.68rem] text-muted-foreground">
          <span>{media.width && media.height ? `${media.width} × ${media.height}` : 'Boyut bilinmiyor'}</span>
          <span>Sıra {media.sortOrder}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AdminButton variant="secondary" size="sm" onClick={() => onEdit(media)}><Edit3 className="size-3.5" />Düzenle</AdminButton>
          <AdminButton variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => onDelete(media)}><Trash2 className="size-3.5" />Sil</AdminButton>
        </div>
      </div>
    </article>
  );
}
