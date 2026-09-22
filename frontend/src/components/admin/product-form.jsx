'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminSelect } from '@/components/admin/ui/select';

const schema = z.object({
  code: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9_-]+$/, 'Yalnız harf, rakam, tire ve alt çizgi kullanın.'),
  name: z.string().trim().min(2).max(190),
  slug: z.string().trim().min(2).max(190).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Küçük harf, rakam ve tire kullanın.'),
  enName: z.string().trim().max(190).optional(),
  enSlug: z.union([z.literal(''), z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Küçük harf, rakam ve tire kullanın.')]).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  sku: z.string().trim().min(2).max(100),
  price: z.coerce.number().min(0),
  compareAtPrice: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  stockQuantity: z.coerce.number().int().min(0),
  brandId: z.string().optional(),
  audienceIds: z.array(z.string()).min(1, 'En az bir hedef kitle seçin.'),
  categoryIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']),
});

export default function ProductForm() {
  const router = useRouter();
  const [catalog, setCatalog] = useState(null);
  const [serverError, setServerError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [productAttributeIds, setProductAttributeIds] = useState([]);
  const [variantAttributeIds, setVariantAttributeIds] = useState([]);
  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft', stockQuantity: 0, audienceIds: [], categoryIds: [], collectionIds: [], enSlug: '', compareAtPrice: '' },
  });

  useEffect(() => {
    let active = true;
    fetch('/api/admin/catalog', { cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
      .then(({ ok, payload }) => {
        if (!active) return;
        if (!ok) throw new Error(payload.message || 'Katalog seçenekleri alınamadı.');
        setCatalog(payload.data);
      })
      .catch((error) => { if (active) setCatalogError(error.message); });
    return () => { active = false; };
  }, []);

  const productGroups = useMemo(() => (catalog?.attributeGroups || []).filter((group) => group.scope === 'product'), [catalog]);
  const variantGroups = useMemo(() => (catalog?.attributeGroups || []).filter((group) => group.scope === 'variant'), [catalog]);

  function toggleAttribute(group, valueId, variant = false) {
    const setter = variant ? setVariantAttributeIds : setProductAttributeIds;
    setter((current) => {
      if (group.selectionMode === 'single') {
        const groupIds = new Set(group.values.map((value) => value.id));
        const withoutGroup = current.filter((id) => !groupIds.has(id));
        return current.includes(valueId) ? withoutGroup : [...withoutGroup, valueId];
      }
      return current.includes(valueId) ? current.filter((id) => id !== valueId) : [...current, valueId];
    });
  }

  async function onSubmit(values) {
    setServerError('');
    const brand = catalog?.brands?.find((item) => String(item.id) === values.brandId);
    const translations = [
      { locale: 'tr', name: values.name, slug: values.slug, shortDescription: values.shortDescription },
      { locale: 'en', name: values.enName || values.name, slug: values.enSlug || values.slug, shortDescription: values.shortDescription },
    ];
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: values.code,
        brand: brand?.name || 'ALP Gözlük',
        brandId: values.brandId ? Number(values.brandId) : undefined,
        status: values.status,
        featured: false,
        taxRate: 20,
        translations,
        audienceIds: values.audienceIds.map(Number),
        categoryIds: (values.categoryIds || []).map(Number),
        collectionIds: (values.collectionIds || []).map(Number),
        productAttributeValueIds: productAttributeIds,
        variants: [{
          sku: values.sku,
          price: values.price,
          compareAtPrice: values.compareAtPrice === '' ? undefined : values.compareAtPrice,
          stockQuantity: values.stockQuantity,
          lowStockThreshold: 5,
          attributeValueIds: variantAttributeIds,
        }],
      }),
    });
    const payload = await response.json();
    if (!response.ok) { setServerError(payload.message || 'Ürün oluşturulamadı.'); return; }
    router.push('/admin/products');
    router.refresh();
  }

  const checkClass = 'size-4 rounded-none border-border-strong text-primary focus:ring-primary';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl space-y-8" noValidate>
      <section className="rounded-t-xl border border-border border-t-2 border-t-primary bg-card p-5 sm:p-6">
        <h2 className="font-semibold">Temel bilgiler ve çeviriler</h2>
        <p className="mt-1 text-sm text-muted-foreground">Kod ve URL adları değişmeden kalması gereken katalog kimlikleridir.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="code">Ürün kodu</Label><Input id="code" placeholder="ALP-ATLAS-01" aria-invalid={Boolean(errors.code)} {...register('code')} />{errors.code ? <p className="text-xs text-danger">{errors.code.message}</p> : null}</div>
          <div className="space-y-2"><Label>Marka</Label><Controller control={control} name="brandId" render={({ field }) => <AdminSelect value={field.value || ''} onValueChange={field.onChange} ariaLabel="Marka" options={[{ value: '', label: 'ALP Gözlük (varsayılan)' }, ...(catalog?.brands || []).map((brand) => ({ value: brand.id, label: brand.name }))]} />} /></div>
          <div className="space-y-2"><Label htmlFor="name">Türkçe ürün adı</Label><Input id="name" placeholder="Atlas 01" aria-invalid={Boolean(errors.name)} {...register('name')} /></div>
          <div className="space-y-2"><Label htmlFor="slug">Türkçe URL adı</Label><Input id="slug" placeholder="atlas-01" aria-invalid={Boolean(errors.slug)} {...register('slug')} /></div>
          <div className="space-y-2"><Label htmlFor="enName">İngilizce ürün adı</Label><Input id="enName" placeholder="Atlas 01" {...register('enName')} /></div>
          <div className="space-y-2"><Label htmlFor="enSlug">İngilizce URL adı</Label><Input id="enSlug" placeholder="atlas-01" aria-invalid={Boolean(errors.enSlug)} {...register('enSlug')} /></div>
        </div>
        <div className="mt-5 space-y-2"><Label htmlFor="shortDescription">Kısa açıklama</Label><textarea id="shortDescription" rows={4} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" {...register('shortDescription')} /></div>
      </section>

      <section className="border-x border-b border-border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">Hedef kitle ve katalog konumu</h2>
        <p className="mt-1 text-sm text-muted-foreground">Unisex seçilen ürünler kadın ve erkek kataloglarında otomatik olarak görünür.</p>
        {catalogError ? <p className="mt-4 bg-danger/8 p-3 text-sm text-danger">{catalogError}</p> : null}
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <fieldset><legend className="text-sm font-medium">Hedef kitle</legend><div className="mt-3 space-y-2">{catalog?.audiences?.map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" value={item.id} className={checkClass} {...register('audienceIds')} />{item.name}</label>)}</div>{errors.audienceIds ? <p className="mt-2 text-xs text-danger">{errors.audienceIds.message}</p> : null}</fieldset>
          <fieldset><legend className="text-sm font-medium">Kategoriler</legend><div className="mt-3 space-y-2">{catalog?.categories?.map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" value={item.id} className={checkClass} {...register('categoryIds')} />{item.name}</label>)}</div></fieldset>
          <fieldset><legend className="text-sm font-medium">Koleksiyonlar</legend><div className="mt-3 space-y-2">{catalog?.collections?.map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" value={item.id} className={checkClass} {...register('collectionIds')} />{item.name}</label>)}</div></fieldset>
        </div>
      </section>

      <section className="border-x border-b border-border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">Ürün özellikleri</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{productGroups.map((group) => <fieldset key={group.id}><legend className="text-sm font-medium">{group.name}</legend><div className="mt-3 flex flex-wrap gap-2">{group.values.map((value) => { const selected = productAttributeIds.includes(value.id); return <button key={value.id} type="button" aria-pressed={selected} onClick={() => toggleAttribute(group, value.id)} className={`rounded-lg border px-3 py-2 text-sm ${selected ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-card hover:border-border-strong'}`}>{value.name}</button>; })}</div></fieldset>)}</div>
      </section>

      <section className="border-x border-b border-border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">İlk varyant, fiyat ve stok</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" placeholder="ALP-ATLAS-01-BLK" {...register('sku')} /></div>
          <div className="space-y-2"><Label htmlFor="price">Satış fiyatı (TRY)</Label><Input id="price" type="number" step="0.01" placeholder="3490" {...register('price')} /></div>
          <div className="space-y-2"><Label htmlFor="compareAtPrice">Eski fiyat (opsiyonel)</Label><Input id="compareAtPrice" type="number" step="0.01" placeholder="3990" {...register('compareAtPrice')} /></div>
          <div className="space-y-2"><Label htmlFor="stockQuantity">Başlangıç stoğu</Label><Input id="stockQuantity" type="number" placeholder="0" {...register('stockQuantity')} /></div>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{variantGroups.map((group) => <fieldset key={group.id}><legend className="text-sm font-medium">{group.name}</legend><div className="mt-3 flex flex-wrap gap-2">{group.values.map((value) => { const selected = variantAttributeIds.includes(value.id); return <button key={value.id} type="button" aria-pressed={selected} onClick={() => toggleAttribute(group, value.id, true)} className={`rounded-lg border px-3 py-2 text-sm ${selected ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-card hover:border-border-strong'}`}>{value.name}</button>; })}</div></fieldset>)}</div>
      </section>

      <section className="rounded-b-xl border-x border-b border-border bg-card p-5 sm:p-6"><Label>Yayın durumu</Label><div className="mt-2 max-w-md"><Controller control={control} name="status" render={({ field }) => <AdminSelect value={field.value} onValueChange={field.onChange} ariaLabel="Yayın durumu" options={[{ value: 'draft', label: 'Taslak' }, { value: 'published', label: 'Yayında' }]} />} /></div><p className="mt-2 text-xs text-muted-foreground">Yayındaki ürün public katalog API’sinde ve uygun hedef kitle sayfalarında görünür.</p></section>
      {serverError ? <p role="alert" className="bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p> : null}
      <div className="flex justify-end gap-2"><button type="button" onClick={() => router.back()} className="h-10 rounded-lg border border-border-strong bg-card px-4 text-sm font-medium">Vazgeç</button><button type="submit" disabled={isSubmitting || !catalog} className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">{isSubmitting ? 'Kaydediliyor…' : 'Ürünü kaydet'}</button></div>
    </form>
  );
}
