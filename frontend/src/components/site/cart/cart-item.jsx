import Image from "next/image";
import { AlertTriangle, Heart, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SiteCheckbox } from "@/components/site/ui/checkbox";
import { cn } from "@/lib/utils";

export default function CartItem({ item, labels, locale, formatCurrency, selected, pending, onSelectedChange, onQuantityChange, onRemove, onMoveToFavorites }) {
  const linePrice = item.unitPrice * item.quantity;
  const originalLinePrice = item.originalPrice * item.quantity;
  const category = typeof item.category === "string" ? item.category : item.category?.[locale] || item.category?.tr || item.category?.en || "";
  const color = typeof item.color === "string" ? item.color : item.color?.[locale] || item.color?.tr || item.color?.en || "";

  return (
    <article className={cn(
      "grid grid-cols-[1.25rem_5.75rem_minmax(0,1fr)] gap-3 border border-black/10 p-3 transition-[background-color,opacity] sm:grid-cols-[1.25rem_9rem_minmax(0,1fr)] sm:gap-5 sm:p-5 lg:grid-cols-[1.25rem_10rem_minmax(0,1fr)]",
      selected ? "bg-white" : "bg-[#f7f8f5]",
    )}>
      <SiteCheckbox
        checked={selected}
        disabled={pending || !item.available}
        onCheckedChange={(checked) => onSelectedChange(item.id, checked)}
        aria-label={`${item.name} ${selected ? labels.excludeItem : labels.includeItem}`}
        className="self-center"
      />
      <Link href={`/product/${item.slug}`} className="relative aspect-[4/3] self-center overflow-hidden bg-white" aria-label={`${item.name} ${labels.viewProduct}`}>
        {item.image ? <Image src={item.image} alt={item.imageAlt || item.name} fill sizes="(max-width: 640px) 108px, (max-width: 1024px) 144px, 160px" className="object-contain p-2" /> : null}
      </Link>

      <div className={cn("grid min-w-0 gap-5 transition-opacity sm:grid-cols-[minmax(0,1fr)_auto]", !selected && "opacity-65")}>
        <div className="min-w-0">
          <Link href={`/product/${item.slug}`} className="text-base font-medium leading-tight hover:text-primary sm:text-lg">
            {item.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{category}</p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground sm:text-sm">
            {color} <span aria-hidden="true">/</span> {labels.size} {item.size}
          </p>

          <div className="mt-4 inline-flex h-10 items-center border border-border bg-white" aria-label={labels.quantity}>
            <button
              type="button"
              className="grid size-10 place-items-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={`${item.name} ${labels.decreaseQuantity}`}
              disabled={pending || item.quantity === 1 || !item.available}
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-8 text-center text-sm font-medium" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              className="grid size-10 place-items-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={`${item.name} ${labels.increaseQuantity}`}
              disabled={pending || item.quantity >= Math.min(item.stockQuantity || 10, 10) || !item.available}
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          {item.available ? <p className="mt-3 text-xs text-success">{labels.campaignApplied}</p> : (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-danger"><AlertTriangle className="size-3.5" />{labels.unavailable}</p>
          )}
          {item.warnings.map((warning) => {
            const warningLabels = { price_changed: labels.priceChanged, unavailable: labels.unavailable, out_of_stock: labels.outOfStock, insufficient_stock: labels.insufficientStock };
            return <p key={String(warning)} className="mt-2 text-xs text-[#9a5b00]">{warningLabels[warning] || labels.unavailable}</p>;
          })}
          {!selected ? <p className="mt-2 text-xs text-[#68736f]">{labels.excludedFromTotal}</p> : null}
        </div>

        <div className="flex items-end justify-between gap-4 sm:min-w-36 sm:flex-col sm:items-end">
          <div className="text-left sm:text-right">
            {originalLinePrice > linePrice ? <p className="text-xs text-muted-foreground line-through sm:text-sm">{formatCurrency(originalLinePrice)}</p> : null}
            <p className="text-sm font-semibold sm:text-base">{formatCurrency(linePrice)}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-3">
            <button type="button" disabled={pending || !item.productId} className="inline-flex min-h-10 items-center gap-1.5 px-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-45" onClick={() => onMoveToFavorites(item)}>
              <Heart className="size-3.5" />{labels.moveToFavorites}
            </button>
            <button type="button" disabled={pending} className="inline-flex min-h-10 items-center gap-1.5 px-1 text-xs text-muted-foreground hover:text-danger disabled:opacity-45" onClick={() => onRemove(item)}>
              <Trash2 className="size-3.5" />{labels.remove}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
