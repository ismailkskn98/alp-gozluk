'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminSelect } from '@/components/admin/ui/select';
import ProductMediaManager from '@/components/admin/product-media';
import ProductVariantEditor, { emptyVariant } from '@/components/admin/product-variant-editor';

const optionalMeasurement = z.preprocess(
  (value) => value === '' || value === undefined || value === null ? undefined : Number(value),
  z.number().positive().max(300).optional(),
);

const requiredMoney = z.preprocess(
  (value) => value === '' || value === undefined || value === null ? undefined : Number(value),
  z.number().min(0),
);

const requiredStock = z.preprocess(
  (value) => value === '' || value === undefined || value === null ? undefined : Number(value),
  z.number().int().min(0),
);

const variantSchema = z.object({
  variantId: z.number().int().positive().optional(),
  sku: z.string().trim().min(2).max(100),
  colorCode: z.string().trim().max(64).optional(),
  frameSize: z.string().trim().max(64).optional(),
  lensType: z.string().trim().max(80).optional(),
  lensCategory: z.string().trim().max(20).optional(),
  uvProtection: z.string().trim().max(40).optional(),
  lensWidthMm: optionalMeasurement,
  bridgeWidthMm: optionalMeasurement,
  templeLengthMm: optionalMeasurement,
  price: requiredMoney,
  compareAtPrice: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  stockQuantity: requiredStock,
  lowStockThreshold: requiredStock,
  attributeValueIds: z.array(z.number().int().positive()).optional(),
});

const schema = z.object({
  code: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9_-]+$/, 'Yalnız harf, rakam, tire ve alt çizgi kullanın.'),
  name: z.string().trim().min(2).max(190),
  slug: z.string().trim().min(2).max(190).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Küçük harf, rakam ve tire kullanın.'),
  enName: z.string().trim().max(190).optional(),
  enSlug: z.union([z.literal(''), z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Küçük harf, rakam ve tire kullanın.')]).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  originCountryCode: z.union([
    z.literal(''),
    z.string().trim().regex(/^[A-Za-z]{2}$/, 'ISO ülke kodu 2 harf olmalı.'),
  ]).optional(),
  variants: z.array(variantSchema).min(1, 'En az bir varyant ekleyin.'),
  brandId: z.string().optional(),
  audienceIds: z.array(z.string()).min(1, 'En az bir hedef kitle seçin.'),
  categoryIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  featured: z.boolean(),
  taxRate: z.preprocess((value) => Number(value), z.number().min(0).max(100)),
  enShortDescription: z.string().trim().max(500).optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

function getEditValues(product) {
  const translations = new Map((product.translations || []).map((translation) => [translation.locale, translation]));
  const turkish = translations.get('tr') || {};
  const english = translations.get('en') || {};
  return {
    code: product.code || '',
    brandId: product.brandId ? String(product.brandId) : '',
    name: turkish.name || product.code || '',
    slug: turkish.slug || '',
    enName: english.name || turkish.name || '',
    enSlug: english.slug || turkish.slug || '',
    shortDescription: turkish.shortDescription || '',
    enShortDescription: english.shortDescription || '',
    originCountryCode: product.originCountryCode || '',
    audienceIds: (product.audienceIds || []).map(String),
    categoryIds: (product.categoryIds || []).map(String),
    collectionIds: (product.collectionIds || []).map(String),
    featured: Boolean(product.featured),
    taxRate: Number(product.taxRate ?? 20),
    status: product.status || 'draft',
    variants: (product.variants || []).map((variant) => ({
      variantId: Number(variant.id),
      sku: variant.sku || '',
      price: Number(variant.price),
      compareAtPrice: variant.compareAtPrice ?? '',
      stockQuantity: Number(variant.stockQuantity),
      lowStockThreshold: Number(variant.lowStockThreshold),
      colorCode: variant.colorCode || '',
      frameSize: variant.frameSize || '',
      lensType: variant.lensType || '',
      lensCategory: variant.lensCategory || '',
      uvProtection: variant.uvProtection || '',
      lensWidthMm: variant.lensWidthMm ?? '',
      bridgeWidthMm: variant.bridgeWidthMm ?? '',
      templeLengthMm: variant.templeLengthMm ?? '',
      attributeValueIds: variant.attributeValueIds || [],
    })),
  };
}

export default function ProductForm({ productId }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState(null);
  const [serverError, setServerError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [loading, setLoading] = useState(Boolean(productId));
  const [productAttributeIds, setProductAttributeIds] = useState([]);
  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'draft',
      variants: [emptyVariant()],
      audienceIds: [],
      categoryIds: [],
      collectionIds: [],
      enSlug: '',
      enShortDescription: '',
      originCountryCode: '',
      featured: false,
      taxRate: 20,
    },
  });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' });
  const productName = useWatch({ control, name: 'name' });
  const productCode = useWatch({ control, name: 'code' });

  useEffect(() => {
    let active = true;
    const catalogRequest = fetch('/api/admin/catalog', { cache: 'no-store' });
    const productRequest = productId
      ? fetch(`/api/admin/products/${encodeURIComponent(productId)}`, { cache: 'no-store' })
      : Promise.resolve(null);
    Promise.all([catalogRequest, productRequest])
      .then(async ([catalogResponse, productResponse]) => {
        const [catalogPayload, productPayload] = await Promise.all([
          catalogResponse.json(),
          productResponse ? productResponse.json() : Promise.resolve(null),
        ]);
        return { catalogResponse, catalogPayload, productResponse, productPayload };
      })
      .then(({ catalogResponse, catalogPayload, productResponse, productPayload }) => {
        if (!active) return;
        if (!catalogResponse.ok) throw new Error(catalogPayload.message || 'Katalog seçenekleri alınamadı.');
        if (productResponse && !productResponse.ok) throw new Error(productPayload.message || 'Ürün bilgileri alınamadı.');
        setCatalog(catalogPayload.data);
        if (productPayload?.data?.product) {
          reset(getEditValues(productPayload.data.product));
          setProductAttributeIds(productPayload.data.product.productAttributeValueIds || []);
        }
      })
      .catch((error) => { if (active) setCatalogError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId, reset]);

  const productGroups = useMemo(() => (catalog?.attributeGroups || []).filter((group) => group.scope === 'product'), [catalog]);
  const variantGroups = useMemo(() => (catalog?.attributeGroups || []).filter((group) => group.scope === 'variant'), [catalog]);

  function toggleAttribute(group, valueId) {
    setProductAttributeIds((current) => {
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
      { locale: 'en', name: values.enName || values.name, slug: values.enSlug || values.slug, shortDescription: values.enShortDescription || values.shortDescription },
    ];
    const response = await fetch(productId ? `/api/admin/products/${encodeURIComponent(productId)}` : '/api/admin/products', {
      method: productId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: values.code,
        brand: brand?.name || 'ALP Gözlük',
        brandId: values.brandId ? Number(values.brandId) : undefined,
        status: values.status,
        featured: values.featured,
        taxRate: values.taxRate,
        originCountryCode: values.originCountryCode || undefined,
        translations,
        audienceIds: values.audienceIds.map(Number),
        categoryIds: (values.categoryIds || []).map(Number),
        collectionIds: (values.collectionIds || []).map(Number),
        productAttributeValueIds: productAttributeIds,
        variants: values.variants.map((variant) => ({
          ...(variant.variantId ? { id: variant.variantId } : {}),
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice === '' ? undefined : variant.compareAtPrice,
          stockQuantity: variant.stockQuantity,
          lowStockThreshold: variant.lowStockThreshold,
          colorCode: variant.colorCode || undefined,
          frameSize: variant.frameSize || undefined,
          lensType: variant.lensType || undefined,
          lensCategory: variant.lensCategory || undefined,
          uvProtection: variant.uvProtection || undefined,
          lensWidthMm: variant.lensWidthMm,
          bridgeWidthMm: variant.bridgeWidthMm,
          templeLengthMm: variant.templeLengthMm,
          attributeValueIds: variant.attributeValueIds || [],
        })),
      }),
    });
    const payload = await response.json();
    if (!response.ok) { setServerError(payload.message || (productId ? 'Ürün güncellenemedi.' : 'Ürün oluşturulamadı.')); return; }
    const savedProductId = productId || payload.data?.id;
    router.push(productId ? '/admin/products' : `/admin/products/${savedProductId}/edit#product-images`);
    router.refresh();
  }

  const checkClass = 'size-4 rounded-none border-border-strong text-primary focus:ring-primary';

  if (loading) {
    return <div className="max-w-5xl space-y-4" aria-label="Ürün bilgileri yükleniyor">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-xl border border-border bg-muted" />)}</div>;
  }

  if (productId && catalogError && !catalog) {
    return <div role="alert" className="max-w-3xl rounded-xl border border-danger/25 bg-danger/8 p-5"><h2 className="font-medium text-danger">Ürün düzenleme ekranı açılamadı</h2><p className="mt-2 text-sm text-muted-foreground">{catalogError}</p><button type="button" onClick={() => router.push('/admin/products')} className="mt-5 h-10 rounded-lg border border-border-strong bg-card px-4 text-sm font-medium">Ürünlere dön</button></div>;
  }

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
          <div className="space-y-2"><Label htmlFor="originCountryCode">Menşei ülke kodu</Label><Input id="originCountryCode" placeholder="TR" maxLength={2} aria-invalid={Boolean(errors.originCountryCode)} {...register('originCountryCode')} />{errors.originCountryCode ? <p className="text-xs text-danger">{errors.originCountryCode.message}</p> : null}</div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="shortDescription">Türkçe kısa açıklama</Label><textarea id="shortDescription" rows={4} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" {...register('shortDescription')} /></div><div className="space-y-2"><Label htmlFor="enShortDescription">İngilizce kısa açıklama</Label><textarea id="enShortDescription" rows={4} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" {...register('enShortDescription')} /></div></div>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Varyantlar, fiyat ve stok</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Her ürün en az bir satış varyantına sahiptir. Tek varyantlı üründe müşteri seçim yapmak zorunda kalmaz; seçenek otomatik kullanılır.</p>
          </div>
          <button type="button" onClick={() => appendVariant(emptyVariant())} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border-strong bg-card px-4 text-sm font-medium transition-colors hover:bg-muted">
            <Plus className="size-4" /> Varyant ekle
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {variantFields.map((field, index) => (
            <ProductVariantEditor
              key={field.id}
              index={index}
              register={register}
              control={control}
              errors={errors.variants?.[index]}
              groups={variantGroups}
              stockReadOnly={Boolean(productId && field.variantId)}
              removable={variantFields.length > 1}
              onRemove={() => removeVariant(index)}
            />
          ))}
        </div>
        {errors.variants?.root ? <p className="mt-3 text-xs text-danger">{errors.variants.root.message}</p> : null}
      </section>

      {productId ? (
        <ProductMediaManager productId={productId} productName={productName} productCode={productCode} />
      ) : (
        <section id="product-images" className="border-x border-b border-border bg-card p-5 sm:p-6">
          <h2 className="font-semibold">Ürün görselleri</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Önce ürün ve varyant bilgilerini kaydedin. Kayıttan sonra aynı düzenleme ekranında galeri, model ve editoryal görselleri ekleyebileceğiniz bu alan otomatik açılır.</p>
        </section>
      )}

      <section className="rounded-b-xl border-x border-b border-border bg-card p-5 sm:p-6"><h2 className="font-semibold">Yayın ve fiyatlandırma ayarları</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><div><Label>Yayın durumu</Label><div className="mt-2"><Controller control={control} name="status" render={({ field }) => <AdminSelect value={field.value} onValueChange={field.onChange} ariaLabel="Yayın durumu" options={[{ value: 'draft', label: 'Taslak' }, { value: 'published', label: 'Yayında' }, { value: 'archived', label: 'Arşivlendi' }]} />} /></div></div><div className="space-y-2"><Label htmlFor="taxRate">KDV oranı (%)</Label><Input id="taxRate" type="number" min="0" max="100" step="0.01" aria-invalid={Boolean(errors.taxRate)} {...register('taxRate')} /></div></div><label className="mt-5 flex min-h-11 items-center gap-3 border-t border-border pt-5 text-sm"><Controller control={control} name="featured" render={({ field }) => <input type="checkbox" className={checkClass} checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />} />Öne çıkan ürün olarak göster</label><p className="mt-3 text-xs text-muted-foreground">Yayındaki ürün public katalog API’sinde ve uygun hedef kitle sayfalarında görünür.</p></section>
      {serverError ? <p role="alert" className="bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p> : null}
      <div className="flex justify-end gap-2"><button type="button" onClick={() => router.back()} className="h-10 rounded-lg border border-border-strong bg-card px-4 text-sm font-medium">Vazgeç</button><button type="submit" disabled={isSubmitting || !catalog} className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">{isSubmitting ? 'Kaydediliyor…' : productId ? 'Değişiklikleri kaydet' : 'Ürünü kaydet'}</button></div>
    </form>
  );
}
