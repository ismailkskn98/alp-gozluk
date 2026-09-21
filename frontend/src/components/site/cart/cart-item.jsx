import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function CartItem({ item, labels, locale, formatCurrency, onQuantityChange, onRemove }) {
  const linePrice = item.unitPrice * item.quantity;
  const originalLinePrice = item.originalPrice * item.quantity;

  return (
    <article className="grid grid-cols-[6.75rem_minmax(0,1fr)] gap-4 bg-[#f4f5f2] p-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6 sm:p-5 lg:grid-cols-[10rem_minmax(0,1fr)]">
      <Link href={`/product/${item.slug}`} className="relative aspect-[4/3] self-center overflow-hidden bg-white" aria-label={`${item.name} ${labels.viewProduct}`}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 108px, (max-width: 1024px) 144px, 160px"
          className="object-contain p-2"
        />
      </Link>

      <div className="grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <Link href={`/product/${item.slug}`} className="text-base font-medium leading-tight hover:text-primary sm:text-lg">
            {item.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{item.category[locale]}</p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground sm:text-sm">
            {item.color[locale]} <span aria-hidden="true">/</span> {labels.size} {item.size}
          </p>

          <div className="mt-4 inline-flex h-10 items-center border border-border bg-white" aria-label={labels.quantity}>
            <button
              type="button"
              className="grid size-10 place-items-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={`${item.name} ${labels.decreaseQuantity}`}
              disabled={item.quantity === 1}
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-8 text-center text-sm font-medium" aria-live="polite">{item.quantity}</span>
            <button
              type="button"
              className="grid size-10 place-items-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={`${item.name} ${labels.increaseQuantity}`}
              disabled={item.quantity === 10}
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <p className="mt-3 text-xs text-success">{labels.campaignApplied}</p>
        </div>

        <div className="flex items-end justify-between gap-4 sm:min-w-36 sm:flex-col sm:items-end">
          <div className="text-left sm:text-right">
            {originalLinePrice > linePrice ? <p className="text-xs text-muted-foreground line-through sm:text-sm">{formatCurrency(originalLinePrice)}</p> : null}
            <p className="text-sm font-semibold sm:text-base">{formatCurrency(linePrice)}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 py-1 text-xs text-muted-foreground hover:text-danger"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="size-3.5" />
            {labels.remove}
          </button>
        </div>
      </div>
    </article>
  );
}
