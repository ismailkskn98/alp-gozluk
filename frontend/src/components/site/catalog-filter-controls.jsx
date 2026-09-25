'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { BouncyAccordion } from '@/components/motion/bouncy-accordion';
import { Drawer } from '@/components/motion/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/motion/select';
import { cn } from '@/lib/utils';

const attributeQueryKeys = {
  product_type: 'type',
  frame_material: 'material',
  frame_shape: 'shape',
  frame_type: 'frameType',
  lens_feature: 'feature',
  frame_color: 'frameColor',
  lens_color: 'lensColor',
  frame_size: 'size',
};

const listKeys = ['brand', ...new Set(Object.values(attributeQueryKeys))];
const managedKeys = [...listKeys, 'priceMin', 'priceMax'];

function valuesFromParams(params) {
  return Object.fromEntries(managedKeys.map((key) => [key, key.startsWith('price')
    ? params.get(key) || ''
    : (params.get(key) || '').split(',').filter(Boolean)]));
}

function FilterChoices({ group, selected, onToggle }) {
  const colorGroup = ['frame_color', 'lens_color'].includes(group.code);
  return (
    <div className={cn('flex flex-wrap gap-2', colorGroup && 'grid grid-cols-2 sm:grid-cols-3')}>
      {group.values.map((value) => {
        const active = selected.includes(value.code);
        return (
          <button
            key={value.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(value.code)}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 border px-3 text-left text-sm transition-colors',
              active ? 'border-[#172536] bg-[#172536] text-white' : 'border-black/12 bg-white hover:border-black/35',
              colorGroup && 'w-full',
            )}
          >
            {value.swatchValue ? <span className="size-4 shrink-0 rounded-full border border-black/15" style={{ backgroundColor: value.swatchValue }} aria-hidden="true" /> : null}
            <span className="truncate">{value.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function CatalogFilterControls({ locale, facets }) {
  const tr = locale === 'tr';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const serializedParams = searchParams.toString();
  const applied = useMemo(() => valuesFromParams(new URLSearchParams(serializedParams)), [serializedParams]);
  const [draft, setDraft] = useState(applied);

  const activeCount = managedKeys.reduce((total, key) => {
    const value = applied[key];
    return total + (Array.isArray(value) ? value.length : Number(Boolean(value)));
  }, 0);
  const filterGroups = (facets.attributeGroups || [])
    .filter((group) => group.filterable && attributeQueryKeys[group.code] && group.values?.length)
    .map((group) => ({ ...group, queryKey: attributeQueryKeys[group.code] }));
  const brandGroup = facets.brands?.length ? {
    id: 'brands', code: 'brand', name: tr ? 'Marka' : 'Brand', queryKey: 'brand', values: facets.brands,
  } : null;

  function toggle(queryKey, code, single = false) {
    setDraft((current) => {
      const selected = current[queryKey] || [];
      return {
        ...current,
        [queryKey]: single
          ? (selected.includes(code) ? [] : [code])
          : selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code],
      };
    });
  }

  function changeOpen(nextOpen) {
    if (nextOpen) setDraft(valuesFromParams(new URLSearchParams(serializedParams)));
    setOpen(nextOpen);
  }

  function navigate(nextParams, close = false) {
    startTransition(() => {
      router.replace(`${pathname}${nextParams.toString() ? `?${nextParams}` : ''}`, { scroll: false });
      if (close) setOpen(false);
    });
  }

  function applyFilters() {
    const next = new URLSearchParams(serializedParams);
    for (const key of managedKeys) {
      const value = draft[key];
      if (Array.isArray(value) ? value.length : value !== '') next.set(key, Array.isArray(value) ? value.join(',') : value);
      else next.delete(key);
    }
    next.delete('page');
    navigate(next, true);
  }

  function clearFilters() {
    const next = new URLSearchParams(serializedParams);
    managedKeys.forEach((key) => next.delete(key));
    next.delete('page');
    setDraft(valuesFromParams(next));
    navigate(next, true);
  }

  function changeSort(value) {
    const next = new URLSearchParams(serializedParams);
    if (value === 'featured') next.delete('sort');
    else next.set('sort', value);
    next.delete('page');
    navigate(next);
  }

  const accordionItems = [brandGroup, ...filterGroups].filter(Boolean).map((group) => ({
    id: String(group.id),
    title: group.name,
    description: (
      <FilterChoices
        group={group}
        selected={draft[group.queryKey] || []}
        onToggle={(code) => toggle(group.queryKey, code, group.selectionMode === 'single' && group.queryKey === 'type')}
      />
    ),
  }));

  if (Number(facets.priceRange?.max) > Number(facets.priceRange?.min)) {
    accordionItems.push({
      id: 'price',
      title: tr ? 'Fiyat' : 'Price',
      description: (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground">{tr ? 'En az' : 'Minimum'}<input type="number" min={facets.priceRange.min} max={facets.priceRange.max} value={draft.priceMin} onChange={(event) => setDraft((current) => ({ ...current, priceMin: event.target.value }))} placeholder={String(Math.floor(facets.priceRange.min))} className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm text-foreground outline-none focus:border-[#172536]" /></label>
          <label className="text-xs text-muted-foreground">{tr ? 'En çok' : 'Maximum'}<input type="number" min={facets.priceRange.min} max={facets.priceRange.max} value={draft.priceMax} onChange={(event) => setDraft((current) => ({ ...current, priceMax: event.target.value }))} placeholder={String(Math.ceil(facets.priceRange.max))} className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm text-foreground outline-none focus:border-[#172536]" /></label>
        </div>
      ),
    });
  }

  return (
    <>
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <button type="button" onClick={() => changeOpen(true)} className="inline-flex h-11 items-center gap-2 border border-black/15 bg-white px-4 text-sm font-medium transition-colors hover:border-black/40" aria-label={tr ? 'Ürün filtrelerini aç' : 'Open product filters'}>
          <SlidersHorizontal className="size-4" />
          {tr ? 'Filtreler' : 'Filters'}
          {activeCount ? <span className="grid size-5 place-items-center rounded-full bg-[#172536] text-[0.65rem] text-white tabular-nums">{activeCount}</span> : null}
        </button>
        <Select value={searchParams.get('sort') || 'featured'} onValueChange={changeSort}>
          <SelectTrigger className="h-11 min-w-40 rounded-none border-black/15 bg-white"><SelectValue placeholder={tr ? 'Sırala' : 'Sort'} /></SelectTrigger>
          <SelectContent className="z-40">
            <SelectItem value="featured">{tr ? 'Öne çıkanlar' : 'Featured'}</SelectItem>
            <SelectItem value="newest">{tr ? 'En yeniler' : 'Newest'}</SelectItem>
            <SelectItem value="price-asc">{tr ? 'Fiyat: artan' : 'Price: low to high'}</SelectItem>
            <SelectItem value="price-desc">{tr ? 'Fiyat: azalan' : 'Price: high to low'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Drawer open={open} onOpenChange={changeOpen} side="left" ariaLabel={tr ? 'Ürün filtreleri' : 'Product filters'} className="w-[min(30rem,100vw)] max-w-full">
        <header className="flex min-h-20 items-center justify-between border-b border-border px-5 sm:px-7">
          <div><h2 className="text-xl font-medium tracking-[-0.025em]">{tr ? 'Filtreler' : 'Filters'}</h2>{activeCount ? <p className="mt-1 text-xs text-muted-foreground">{activeCount} {tr ? 'filtre etkin' : 'filters active'}</p> : null}</div>
          <button type="button" onClick={() => changeOpen(false)} className="grid size-10 place-items-center rounded-full transition-colors hover:bg-muted" aria-label={tr ? 'Filtreleri kapat' : 'Close filters'}><X className="size-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f5f5] p-3 sm:p-4">
          <BouncyAccordion items={accordionItems} classNames={{ item: 'bg-white', description: 'text-foreground' }} />
        </div>
        <footer className="grid grid-cols-2 gap-2 border-t border-border bg-white p-4 sm:p-5">
          <button type="button" onClick={clearFilters} disabled={pending || activeCount === 0} className="h-12 border border-black/15 bg-white px-4 text-sm font-medium disabled:opacity-40">{tr ? 'Temizle' : 'Clear'}</button>
          <button type="button" onClick={applyFilters} disabled={pending} className="h-12 bg-[#172536] px-4 text-sm font-medium text-white disabled:opacity-55">{pending ? (tr ? 'Uygulanıyor…' : 'Applying…') : (tr ? 'Sonuçları göster' : 'Show results')}</button>
        </footer>
      </Drawer>
    </>
  );
}
