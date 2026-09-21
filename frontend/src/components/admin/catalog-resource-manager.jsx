'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Archive, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import AdminPageHeader from './page-header';

const codePattern = /^[a-z0-9][a-z0-9_-]{1,99}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const schema = z.object({
  code: z.string().trim().toLowerCase().regex(codePattern, 'Küçük harf, rakam, tire veya alt çizgi kullanın.'),
  name: z.string().trim().min(2, 'En az 2 karakter girin.').max(160),
  slug: z.string().trim().toLowerCase().optional(),
  enName: z.string().trim().max(160).optional(),
  enSlug: z.string().trim().toLowerCase().optional(),
  status: z.enum(['active', 'inactive', 'draft', 'archived']),
  sortOrder: z.coerce.number().int().min(0).max(100000),
  parentId: z.string().optional(),
  groupId: z.string().optional(),
  scope: z.enum(['product', 'variant']).optional(),
  selectionMode: z.enum(['single', 'multiple']).optional(),
  swatchValue: z.string().trim().max(40).optional(),
}).superRefine((values, context) => {
  if (values.slug && !slugPattern.test(values.slug)) context.addIssue({ code: 'custom', path: ['slug'], message: 'Küçük harf, rakam ve tire kullanın.' });
  if (values.enSlug && !slugPattern.test(values.enSlug)) context.addIssue({ code: 'custom', path: ['enSlug'], message: 'Küçük harf, rakam ve tire kullanın.' });
});

const defaults = {
  code: '', name: '', slug: '', enName: '', enSlug: '', status: 'active', sortOrder: 0,
  parentId: '', groupId: '', scope: 'product', selectionMode: 'multiple', swatchValue: '',
};

function getTranslation(record, locale) {
  return record.translations?.find((translation) => translation.locale === locale);
}

async function fetchResourceData(resource) {
  const [recordsResponse, overviewResponse] = await Promise.all([
    fetch(`/api/admin/catalog/${resource}`, { cache: 'no-store' }),
    fetch('/api/admin/catalog', { cache: 'no-store' }),
  ]);
  const recordsPayload = await recordsResponse.json();
  const overviewPayload = await overviewResponse.json();
  if (!recordsResponse.ok) throw new Error(recordsPayload.message || 'Kayıtlar alınamadı.');
  return { records: recordsPayload.data?.records || [], overview: overviewResponse.ok ? overviewPayload.data : null };
}

export default function CatalogResourceManager({ resource, title, description, compact = false }) {
  const [records, setRecords] = useState([]);
  const [overview, setOverview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: defaults });

  const usesTranslations = resource !== 'brands';
  const usesSlug = !['brands', 'attribute-groups'].includes(resource);
  const options = useMemo(() => ({
    parents: (overview?.categories || []).filter((record) => record.id !== editingId),
    groups: overview?.attributeGroups || [],
  }), [overview, editingId]);

  async function load() {
    setLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const result = await fetchResourceData(resource);
      setRecords(result.records);
      if (result.overview) setOverview(result.overview);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchResourceData(resource)
      .then((result) => {
        if (!active) return;
        setRecords(result.records);
        if (result.overview) setOverview(result.overview);
      })
      .catch((error) => { if (active) setFeedback({ type: 'error', message: error.message }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resource]);

  function startEdit(record) {
    const tr = getTranslation(record, 'tr');
    const en = getTranslation(record, 'en');
    setEditingId(record.id);
    reset({
      ...defaults,
      code: record.code,
      name: resource === 'brands' ? record.name : tr?.name || record.name,
      slug: resource === 'brands' ? record.slug : tr?.slug || record.slug || '',
      enName: en?.name || '',
      enSlug: en?.slug || '',
      status: record.status,
      sortOrder: record.sortOrder,
      parentId: record.parentId ? String(record.parentId) : '',
      groupId: record.groupId ? String(record.groupId) : '',
      scope: record.scope || 'product',
      selectionMode: record.selectionMode || 'multiple',
      swatchValue: record.swatchValue || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    reset(defaults);
  }

  async function onSubmit(values) {
    setFeedback({ type: '', message: '' });
    if (usesSlug && !slugPattern.test(values.slug || '')) {
      setFeedback({ type: 'error', message: 'Geçerli bir Türkçe URL adı girin.' });
      return;
    }
    if (resource === 'attribute-values' && !values.groupId) {
      setFeedback({ type: 'error', message: 'Bir özellik grubu seçin.' });
      return;
    }
    const translations = usesTranslations ? [
      { locale: 'tr', name: values.name, ...(usesSlug ? { slug: values.slug } : {}) },
      { locale: 'en', name: values.enName || values.name, ...(usesSlug ? { slug: values.enSlug || values.slug } : {}) },
    ] : undefined;
    const payload = {
      code: values.code,
      name: values.name,
      slug: values.slug,
      status: values.status,
      sortOrder: values.sortOrder,
      translations,
      parentId: values.parentId ? Number(values.parentId) : null,
      groupId: values.groupId ? Number(values.groupId) : undefined,
      scope: values.scope,
      selectionMode: values.selectionMode,
      filterable: true,
      swatchValue: values.swatchValue || null,
    };
    const response = await fetch(`/api/admin/catalog/${resource}${editingId ? `/${editingId}` : ''}`, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setFeedback({ type: 'error', message: result.message || 'Kayıt kaydedilemedi.' });
      return;
    }
    setFeedback({ type: 'success', message: editingId ? 'Kayıt güncellendi.' : 'Kayıt oluşturuldu.' });
    cancelEdit();
    await load();
  }

  async function archiveRecord(record) {
    if (!window.confirm(`${record.name || record.code} kaydını arşivlemek istediğinize emin misiniz?`)) return;
    const response = await fetch(`/api/admin/catalog/${resource}/${record.id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) setFeedback({ type: 'error', message: result.message || 'Kayıt arşivlenemedi.' });
    else await load();
  }

  const inputClass = 'h-10 w-full border border-input bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';
  const errorFor = (name) => errors[name] ? <p className="mt-1 text-xs text-danger">{errors[name].message}</p> : null;

  return (
    <section className={compact ? 'border-t border-border pt-8 first:border-0 first:pt-0' : ''}>
      {!compact ? <AdminPageHeader title={title} description={description} /> : <div className="mb-5"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
        <div className="min-w-0 border border-border bg-white">
          <div className="grid grid-cols-[minmax(0,1fr)_7rem_5rem] gap-4 border-b border-border bg-muted/55 px-4 py-3 text-xs font-medium text-muted-foreground">
            <span>Kayıt</span><span>Durum</span><span className="text-right">İşlem</span>
          </div>
          {loading ? <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin" />Yükleniyor</div> : null}
          {!loading && records.length === 0 ? <div className="px-5 py-14 text-center"><p className="font-medium">Henüz kayıt bulunmuyor</p><p className="mt-2 text-sm text-muted-foreground">Sağdaki formdan ilk kaydı ekleyin.</p></div> : null}
          {!loading ? records.map((record) => (
            <div key={record.id} className="grid grid-cols-[minmax(0,1fr)_7rem_5rem] items-center gap-4 border-b border-border px-4 py-3 last:border-0">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{record.name || getTranslation(record, 'tr')?.name || record.code}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{record.code}</p></div>
              <span className="w-fit bg-muted px-2 py-1 text-xs text-foreground/75">{record.status}</span>
              <div className="flex justify-end gap-1">
                <button type="button" onClick={() => startEdit(record)} className="grid size-8 place-items-center hover:bg-muted" aria-label="Düzenle"><Pencil className="size-3.5" /></button>
                <button type="button" onClick={() => archiveRecord(record)} className="grid size-8 place-items-center text-danger hover:bg-danger/8" aria-label="Arşivle"><Archive className="size-3.5" /></button>
              </div>
            </div>
          )) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="self-start border-t-2 border-primary bg-white px-5 py-5 shadow-[0_12px_32px_rgba(16,35,61,0.06)]" noValidate>
          <div className="mb-5 flex items-center justify-between"><h3 className="font-semibold">{editingId ? 'Kaydı düzenle' : 'Yeni kayıt'}</h3>{editingId ? <button type="button" onClick={cancelEdit} className="grid size-8 place-items-center hover:bg-muted" aria-label="Düzenlemeyi kapat"><X className="size-4" /></button> : <Plus className="size-4 text-primary" />}</div>
          <div className="space-y-4">
            <label className="block text-sm font-medium">Kod<input className={`${inputClass} mt-1.5`} {...register('code')} />{errorFor('code')}</label>
            <label className="block text-sm font-medium">Türkçe ad<input className={`${inputClass} mt-1.5`} {...register('name')} />{errorFor('name')}</label>
            {usesSlug ? <label className="block text-sm font-medium">Türkçe URL adı<input className={`${inputClass} mt-1.5`} {...register('slug')} />{errorFor('slug')}</label> : null}
            {usesTranslations ? <label className="block text-sm font-medium">İngilizce ad<input className={`${inputClass} mt-1.5`} {...register('enName')} /></label> : null}
            {usesTranslations && usesSlug ? <label className="block text-sm font-medium">İngilizce URL adı<input className={`${inputClass} mt-1.5`} {...register('enSlug')} />{errorFor('enSlug')}</label> : null}
            {resource === 'categories' ? <label className="block text-sm font-medium">Üst kategori<select className={`${inputClass} mt-1.5`} {...register('parentId')}><option value="">Üst kategori yok</option>{options.parents.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label> : null}
            {resource === 'attribute-values' ? <label className="block text-sm font-medium">Özellik grubu<select className={`${inputClass} mt-1.5`} {...register('groupId')}><option value="">Grup seçin</option>{options.groups.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label> : null}
            {resource === 'attribute-values' ? <label className="block text-sm font-medium">Renk / swatch değeri<input className={`${inputClass} mt-1.5`} placeholder="#171717" {...register('swatchValue')} /></label> : null}
            {resource === 'attribute-groups' ? <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Kapsam<select className={`${inputClass} mt-1.5`} {...register('scope')}><option value="product">Ürün</option><option value="variant">Varyant</option></select></label><label className="block text-sm font-medium">Seçim<select className={`${inputClass} mt-1.5`} {...register('selectionMode')}><option value="single">Tekli</option><option value="multiple">Çoklu</option></select></label></div> : null}
            <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Durum<select className={`${inputClass} mt-1.5`} {...register('status')}><option value="active">Aktif</option><option value="inactive">Pasif</option><option value="draft">Taslak</option></select></label><label className="block text-sm font-medium">Sıra<input type="number" min="0" className={`${inputClass} mt-1.5`} {...register('sortOrder')} /></label></div>
          </div>
          {feedback.message ? <p role="status" className={`mt-4 px-3 py-2 text-sm ${feedback.type === 'error' ? 'bg-danger/8 text-danger' : 'bg-success/8 text-success'}`}>{feedback.message}</p> : null}
          <button type="submit" disabled={isSubmitting} className="mt-5 h-10 w-full bg-primary px-4 text-sm font-medium text-white disabled:opacity-60">{isSubmitting ? 'Kaydediliyor…' : editingId ? 'Değişiklikleri kaydet' : 'Kayıt oluştur'}</button>
        </form>
      </div>
    </section>
  );
}
