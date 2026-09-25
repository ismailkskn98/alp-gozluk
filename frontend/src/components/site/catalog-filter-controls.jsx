'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useRef, useState, useTransition } from 'react';
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

function selectedGroupSummary(group, draft, tr) {
  if (group.queryKey === 'price') {
    const values = [draft.priceMin, draft.priceMax].filter(Boolean);
    if (values.length === 0) return '';
    if (values.length === 1) return values[0];
    return `${values[0]}–${values[1]}`;
  }
  const selectedCodes = draft[group.queryKey] || [];
  if (selectedCodes.length === 0) return '';
  if (selectedCodes.length > 1) return `${selectedCodes.length} ${tr ? 'seçili' : 'selected'}`;
  return group.values.find((value) => value.code === selectedCodes[0])?.name || selectedCodes[0];
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
              'inline-flex min-h-9 items-center gap-2 border px-3 text-left text-xs transition-colors',
              active ? 'border-[#172536] bg-[#172536] text-white' : 'border-black/12 bg-white hover:border-black/35',
              colorGroup && 'w-full',
            )}
          >
            {value.swatchValue ? <span className="size-3.5 shrink-0 border border-black/15" style={{ backgroundColor: value.swatchValue }} aria-hidden="true" /> : null}
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
  const [openGroupIds, setOpenGroupIds] = useState([]);
  const manuallyClosedGroupIds = useRef(new Set());

  const activeCount = managedKeys.reduce((total, key) => {
    const value = applied[key];
    return total + (Array.isArray(value) ? value.length : Number(Boolean(value)));
  }, 0);
  const draftActiveCount = managedKeys.reduce((total, key) => {
    const value = draft[key];
    return total + (Array.isArray(value) ? value.length : Number(Boolean(value)));
  }, 0);
  const filterGroups = (facets.attributeGroups || [])
    .filter((group) => group.filterable && attributeQueryKeys[group.code] && group.values?.length)
    .map((group) => ({ ...group, id: String(group.id), queryKey: attributeQueryKeys[group.code] }));
  const brandGroup = facets.brands?.length ? {
    id: 'brands', code: 'brand', name: tr ? 'Marka' : 'Brand', queryKey: 'brand', values: facets.brands,
  } : null;
  const groups = [brandGroup, ...filterGroups].filter(Boolean);
  if (Number(facets.priceRange?.max) > Number(facets.priceRange?.min)) {
    groups.push({ id: 'price', code: 'price', name: tr ? 'Fiyat' : 'Price', queryKey: 'price', values: [] });
  }

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
    if (nextOpen) {
      const nextDraft = valuesFromParams(new URLSearchParams(serializedParams));
      setDraft(nextDraft);
      setOpenGroupIds(groups
        .filter((group) => selectedGroupSummary(group, nextDraft, tr) && !manuallyClosedGroupIds.current.has(group.id))
        .map((group) => group.id));
    }
    setOpen(nextOpen);
  }

  function changeGroupOpen(groupId, value) {
    setOpenGroupIds((current) => {
      if (value) {
        manuallyClosedGroupIds.current.delete(groupId);
        return current.includes(groupId) ? current : [...current, groupId];
      }
      manuallyClosedGroupIds.current.add(groupId);
      return current.filter((id) => id !== groupId);
    });
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
    setOpenGroupIds([]);
    manuallyClosedGroupIds.current.clear();
    navigate(next, true);
  }

  function changeSort(value) {
    const next = new URLSearchParams(serializedParams);
    if (value === 'featured') next.delete('sort');
    else next.set('sort', value);
    next.delete('page');
    navigate(next);
  }

  function groupDescription(group) {
    if (group.queryKey === 'price') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[0.7rem] text-muted-foreground">{tr ? 'En az' : 'Minimum'}<input type="number" min={facets.priceRange.min} max={facets.priceRange.max} value={draft.priceMin} onChange={(event) => setDraft((current) => ({ ...current, priceMin: event.target.value }))} placeholder={String(Math.floor(facets.priceRange.min))} className="mt-2 h-10 w-full border border-black/15 bg-white px-3 text-xs text-foreground outline-none focus:border-[#172536]" /></label>
          <label className="text-[0.7rem] text-muted-foreground">{tr ? 'En çok' : 'Maximum'}<input type="number" min={facets.priceRange.min} max={facets.priceRange.max} value={draft.priceMax} onChange={(event) => setDraft((current) => ({ ...current, priceMax: event.target.value }))} placeholder={String(Math.ceil(facets.priceRange.max))} className="mt-2 h-10 w-full border border-black/15 bg-white px-3 text-xs text-foreground outline-none focus:border-[#172536]" /></label>
        </div>
      );
    }
    return (
      <FilterChoices
        group={group}
        selected={draft[group.queryKey] || []}
        onToggle={(code) => toggle(group.queryKey, code, group.selectionMode === 'single' && group.queryKey === 'type')}
      />
    );
  }

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
        <button type="button" onClick={() => changeOpen(true)} className="inline-flex h-10 items-center gap-2 border border-[#172536] bg-[#172536] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#24364a]" aria-label={tr ? 'Ürün filtrelerini aç' : 'Open product filters'}>
          <SlidersHorizontal className="size-3.5" />
          {tr ? 'Filtreler' : 'Filters'}
          {activeCount ? <span className="grid size-5 place-items-center rounded-full bg-white text-[0.62rem] font-semibold text-[#172536] tabular-nums">{activeCount}</span> : null}
        </button>
        <Select value={searchParams.get('sort') || 'featured'} onValueChange={changeSort} radius={0}>
          <SelectTrigger className="h-10 min-w-36 rounded-none border-black/15 bg-white px-3 text-xs"><SelectValue placeholder={tr ? 'Sırala' : 'Sort'} /></SelectTrigger>
          <SelectContent className="z-40 rounded-none">
            <SelectItem value="featured" className="rounded-none text-xs">{tr ? 'Öne çıkanlar' : 'Featured'}</SelectItem>
            <SelectItem value="newest" className="rounded-none text-xs">{tr ? 'En yeniler' : 'Newest'}</SelectItem>
            <SelectItem value="price-asc" className="rounded-none text-xs">{tr ? 'Fiyat: artan' : 'Price: low to high'}</SelectItem>
            <SelectItem value="price-desc" className="rounded-none text-xs">{tr ? 'Fiyat: azalan' : 'Price: high to low'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Drawer open={open} onOpenChange={changeOpen} side="left" ariaLabel={tr ? 'Ürün filtreleri' : 'Product filters'} className="w-[min(30rem,100vw)] max-w-full">
        <header className="flex min-h-20 items-center justify-between border-b border-border px-5 sm:px-7">
          <div><h2 className="text-lg font-medium tracking-[-0.02em]">{tr ? 'Filtreler' : 'Filters'}</h2>{draftActiveCount ? <p className="mt-1 text-[0.7rem] text-muted-foreground">{draftActiveCount} {tr ? 'filtre seçili' : 'filters selected'}</p> : null}</div>
          <button type="button" onClick={() => changeOpen(false)} className="grid size-10 place-items-center transition-colors hover:bg-muted" aria-label={tr ? 'Filtreleri kapat' : 'Close filters'}><X className="size-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f5f5] p-3 sm:p-4">
          <div className="space-y-1.5">
            {groups.map((group) => {
              const summary = selectedGroupSummary(group, draft, tr);
              const isOpen = openGroupIds.includes(group.id);
              return (
                <BouncyAccordion
                  key={group.id}
                  value={isOpen ? group.id : null}
                  onValueChange={(value) => changeGroupOpen(group.id, value)}
                  items={[{
                    id: group.id,
                    title: (
                      <span className="flex min-w-0 items-center justify-between gap-3">
                        <span className="truncate">{group.name}</span>
                        {summary ? <span className="max-w-[45%] truncate text-[0.68rem] font-normal text-muted-foreground">{summary}</span> : null}
                      </span>
                    ),
                    description: groupDescription(group),
                  }]}
                  classNames={{ item: 'bg-white', trigger: 'min-h-12 px-4', title: 'text-sm', description: 'px-0 text-foreground', content: 'text-xs' }}
                />
              );
            })}
          </div>
        </div>
        <footer className="grid grid-cols-2 gap-2 border-t border-border bg-white p-4 sm:p-5">
          <button type="button" onClick={clearFilters} disabled={pending || draftActiveCount === 0} className="h-11 border border-black/15 bg-white px-4 text-xs font-medium disabled:opacity-40">{tr ? 'Temizle' : 'Clear'}</button>
          <button type="button" onClick={applyFilters} disabled={pending} className="h-11 bg-[#172536] px-4 text-xs font-medium text-white disabled:opacity-55">{pending ? (tr ? 'Uygulanıyor…' : 'Applying…') : (tr ? 'Sonuçları göster' : 'Show results')}</button>
        </footer>
      </Drawer>
    </>
  );
}
