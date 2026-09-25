'use client';

import { Trash2 } from 'lucide-react';
import { useController } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const emptyVariant = () => ({
  sku: '',
  price: '',
  compareAtPrice: '',
  stockQuantity: 0,
  lowStockThreshold: 5,
  colorCode: '',
  frameSize: '',
  lensType: '',
  lensCategory: '',
  uvProtection: '',
  lensWidthMm: '',
  bridgeWidthMm: '',
  templeLengthMm: '',
  attributeValueIds: [],
});

function FieldError({ error }) {
  return error ? <p className="text-xs text-danger">{error.message}</p> : null;
}

export default function ProductVariantEditor({
  index,
  register,
  control,
  errors,
  groups,
  removable,
  onRemove,
}) {
  const attributeField = useController({
    control,
    name: `variants.${index}.attributeValueIds`,
    defaultValue: [],
  }).field;
  const selectedIds = attributeField.value || [];

  function toggleAttribute(group, valueId) {
    if (group.selectionMode === 'single') {
      const groupIds = new Set(group.values.map((value) => value.id));
      const withoutGroup = selectedIds.filter((id) => !groupIds.has(id));
      attributeField.onChange(selectedIds.includes(valueId) ? withoutGroup : [...withoutGroup, valueId]);
      return;
    }
    attributeField.onChange(
      selectedIds.includes(valueId)
        ? selectedIds.filter((id) => id !== valueId)
        : [...selectedIds, valueId],
    );
  }

  return (
    <article className="rounded-xl border border-border bg-muted/15 p-4 sm:p-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">Varyant {index + 1}</h3>
            {index === 0 ? <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[0.68rem] font-medium text-primary">İlk gösterilen</span> : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Renk, ölçü, fiyat ve stok bu satış seçeneğine özeldir.</p>
        </div>
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-danger/40 hover:text-danger"
            aria-label={`Varyant ${index + 1}'i kaldır`}
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </header>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2"><Label htmlFor={`variant-${index}-sku`}>SKU</Label><Input id={`variant-${index}-sku`} placeholder="ALP-ATLAS-BLK" aria-invalid={Boolean(errors?.sku)} {...register(`variants.${index}.sku`)} /><FieldError error={errors?.sku} /></div>
        <div className="space-y-2"><Label htmlFor={`variant-${index}-price`}>Satış fiyatı (TRY)</Label><Input id={`variant-${index}-price`} type="number" step="0.01" min="0" placeholder="3490" aria-invalid={Boolean(errors?.price)} {...register(`variants.${index}.price`)} /><FieldError error={errors?.price} /></div>
        <div className="space-y-2"><Label htmlFor={`variant-${index}-compare`}>Eski fiyat</Label><Input id={`variant-${index}-compare`} type="number" step="0.01" min="0" placeholder="3990" aria-invalid={Boolean(errors?.compareAtPrice)} {...register(`variants.${index}.compareAtPrice`)} /><FieldError error={errors?.compareAtPrice} /></div>
        <div className="space-y-2"><Label htmlFor={`variant-${index}-stock`}>Stok</Label><Input id={`variant-${index}-stock`} type="number" min="0" placeholder="0" aria-invalid={Boolean(errors?.stockQuantity)} {...register(`variants.${index}.stockQuantity`)} /><FieldError error={errors?.stockQuantity} /></div>
        <div className="space-y-2"><Label htmlFor={`variant-${index}-threshold`}>Düşük stok eşiği</Label><Input id={`variant-${index}-threshold`} type="number" min="0" placeholder="5" aria-invalid={Boolean(errors?.lowStockThreshold)} {...register(`variants.${index}.lowStockThreshold`)} /><FieldError error={errors?.lowStockThreshold} /></div>
      </div>

      {groups.length ? (
        <div className="mt-6 border-t border-border pt-5">
          <h4 className="text-sm font-semibold">Müşterinin seçebileceği özellikler</h4>
          <p className="mt-1 text-xs text-muted-foreground">Yalnızca bu varyantı diğerlerinden ayıran renk, ölçü ve cam özelliklerini işaretleyin.</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <fieldset key={group.id}>
                <legend className="text-xs font-medium text-muted-foreground">{group.name}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const selected = selectedIds.includes(value.id);
                    return (
                      <button
                        key={value.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleAttribute(group, value.id)}
                        className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${selected ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-card hover:border-border-strong'}`}
                      >
                        {value.swatchValue ? <span className="size-3.5 rounded-full border border-black/10" style={{ backgroundColor: value.swatchValue }} aria-hidden="true" /> : null}
                        {value.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      ) : null}

      <details className="mt-6 border-t border-border pt-4">
        <summary className="cursor-pointer text-sm font-medium text-primary">Teknik ölçüleri ve üretici kodlarını ekle</summary>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2"><Label htmlFor={`variant-${index}-color-code`}>Üretici renk kodu</Label><Input id={`variant-${index}-color-code`} placeholder="F002/6G" {...register(`variants.${index}.colorCode`)} /></div>
          <div className="space-y-2"><Label htmlFor={`variant-${index}-frame-size`}>Gösterim ölçüsü</Label><Input id={`variant-${index}-frame-size`} placeholder="51□21 - 145" {...register(`variants.${index}.frameSize`)} /></div>
          <div className="space-y-2"><Label htmlFor={`variant-${index}-lens-width`}>Lens genişliği (mm)</Label><Input id={`variant-${index}-lens-width`} type="number" step="0.01" {...register(`variants.${index}.lensWidthMm`)} /></div>
          <div className="space-y-2"><Label htmlFor={`variant-${index}-bridge-width`}>Köprü genişliği (mm)</Label><Input id={`variant-${index}-bridge-width`} type="number" step="0.01" {...register(`variants.${index}.bridgeWidthMm`)} /></div>
          <div className="space-y-2"><Label htmlFor={`variant-${index}-temple-length`}>Sap uzunluğu (mm)</Label><Input id={`variant-${index}-temple-length`} type="number" step="0.01" {...register(`variants.${index}.templeLengthMm`)} /></div>
          <div className="space-y-2"><Label htmlFor={`variant-${index}-lens-type`}>Cam tipi</Label><Input id={`variant-${index}-lens-type`} placeholder="Polarize / degrade" {...register(`variants.${index}.lensType`)} /></div>
          <div className="space-y-2"><Label htmlFor={`variant-${index}-lens-category`}>Cam kategorisi</Label><Input id={`variant-${index}-lens-category`} placeholder="3N" {...register(`variants.${index}.lensCategory`)} /></div>
          <div className="space-y-2"><Label htmlFor={`variant-${index}-uv`}>UV koruması</Label><Input id={`variant-${index}-uv`} placeholder="UV400" {...register(`variants.${index}.uvProtection`)} /></div>
        </div>
      </details>
    </article>
  );
}
