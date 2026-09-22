'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Archive, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import AdminPageHeader from './page-header';
import ConfirmActionDialog from './ui/confirm-action-dialog';
import { adminInputClass, AdminFormField } from './ui/form-field';
import { AdminSelect } from './ui/select';

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
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: defaults });

  const usesTranslations = resource !== 'brands';
  const usesSlug = !['brands', 'attribute-groups'].includes(resource);
  const options = useMemo(() => ({
    parents: (overview?.categories || []).filter((record) => record.id !== editingId),
    groups: overview?.attributeGroups || [],
  }), [overview, editingId]);

  async function load({ clearFeedback = true } = {}) {
    setLoading(true);
    if (clearFeedback) setFeedback({ type: '', message: '' });
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
    await load({ clearFeedback: false });
  }

  async function archiveRecord(record) {
    setArchiving(true);
    try {
      const response = await fetch(`/api/admin/catalog/${resource}/${record.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) setFeedback({ type: 'error', message: result.message || 'Kayıt arşivlenemedi.' });
      else {
        setFeedback({ type: 'success', message: 'Kayıt arşivlendi.' });
        setArchiveTarget(null);
        await load({ clearFeedback: false });
      }
    } finally {
      setArchiving(false);
    }
  }

  return (
    <section className={compact ? 'border-t border-border pt-8 first:border-0 first:pt-0' : ''}>
      {!compact ? <AdminPageHeader title={title} description={description} /> : <div className="mb-5"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
        <div className="min-w-0 rounded-xl border border-border bg-card">
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
                <button type="button" onClick={() => setArchiveTarget(record)} className="grid size-8 place-items-center rounded-lg text-danger hover:bg-danger/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25" aria-label={`${record.name || record.code} kaydını arşivle`}><Archive className="size-3.5" /></button>
              </div>
            </div>
          )) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="self-start rounded-xl border border-border border-t-2 border-t-primary bg-card px-5 py-5 shadow-[0_12px_32px_rgba(16,35,61,0.06)]" noValidate>
          <div className="mb-5 flex items-center justify-between"><h3 className="font-semibold">{editingId ? 'Kaydı düzenle' : 'Yeni kayıt'}</h3>{editingId ? <button type="button" onClick={cancelEdit} className="grid size-8 place-items-center hover:bg-muted" aria-label="Düzenlemeyi kapat"><X className="size-4" /></button> : <Plus className="size-4 text-primary" />}</div>
          <div className="space-y-4">
            <AdminFormField label="Kod" error={errors.code?.message}><input className={adminInputClass} {...register('code')} aria-invalid={Boolean(errors.code)} /></AdminFormField>
            <AdminFormField label="Türkçe ad" error={errors.name?.message}><input className={adminInputClass} {...register('name')} aria-invalid={Boolean(errors.name)} /></AdminFormField>
            {usesSlug ? <AdminFormField label="Türkçe URL adı" error={errors.slug?.message}><input className={adminInputClass} {...register('slug')} aria-invalid={Boolean(errors.slug)} /></AdminFormField> : null}
            {usesTranslations ? <AdminFormField label="İngilizce ad"><input className={adminInputClass} {...register('enName')} /></AdminFormField> : null}
            {usesTranslations && usesSlug ? <AdminFormField label="İngilizce URL adı" error={errors.enSlug?.message}><input className={adminInputClass} {...register('enSlug')} aria-invalid={Boolean(errors.enSlug)} /></AdminFormField> : null}
            {resource === 'categories' ? <AdminFormField label="Üst kategori"><Controller control={control} name="parentId" render={({ field }) => <AdminSelect value={field.value || ''} onValueChange={field.onChange} options={[{ value: '', label: 'Üst kategori yok' }, ...options.parents.map((option) => ({ value: option.id, label: option.name }))]} />} /></AdminFormField> : null}
            {resource === 'attribute-values' ? <AdminFormField label="Özellik grubu"><Controller control={control} name="groupId" render={({ field }) => <AdminSelect value={field.value || ''} onValueChange={field.onChange} options={[{ value: '', label: 'Grup seçin' }, ...options.groups.map((option) => ({ value: option.id, label: option.name }))]} />} /></AdminFormField> : null}
            {resource === 'attribute-values' ? <AdminFormField label="Renk / swatch değeri"><input className={adminInputClass} placeholder="#171717" {...register('swatchValue')} /></AdminFormField> : null}
            {resource === 'attribute-groups' ? <div className="grid gap-4 sm:grid-cols-2"><AdminFormField label="Kapsam"><Controller control={control} name="scope" render={({ field }) => <AdminSelect value={field.value} onValueChange={field.onChange} options={[{ value: 'product', label: 'Ürün' }, { value: 'variant', label: 'Varyant' }]} />} /></AdminFormField><AdminFormField label="Seçim"><Controller control={control} name="selectionMode" render={({ field }) => <AdminSelect value={field.value} onValueChange={field.onChange} options={[{ value: 'single', label: 'Tekli' }, { value: 'multiple', label: 'Çoklu' }]} />} /></AdminFormField></div> : null}
            <div className="grid gap-4 sm:grid-cols-2"><AdminFormField label="Durum"><Controller control={control} name="status" render={({ field }) => <AdminSelect value={field.value} onValueChange={field.onChange} options={[{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Pasif' }, { value: 'draft', label: 'Taslak' }]} />} /></AdminFormField><AdminFormField label="Sıra"><input type="number" min="0" className={adminInputClass} {...register('sortOrder')} /></AdminFormField></div>
          </div>
          {feedback.message ? <p role="status" className={`mt-4 px-3 py-2 text-sm ${feedback.type === 'error' ? 'bg-danger/8 text-danger' : 'bg-success/8 text-success'}`}>{feedback.message}</p> : null}
          <button type="submit" disabled={isSubmitting} className="mt-5 min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">{isSubmitting ? 'Kaydediliyor…' : editingId ? 'Değişiklikleri kaydet' : 'Kayıt oluştur'}</button>
        </form>
      </div>
      <ConfirmActionDialog open={Boolean(archiveTarget)} onOpenChange={(open) => { if (!open) setArchiveTarget(null); }} title="Kaydı arşivle" description="Kayıt aktif listelerden kaldırılacak. İlişkili ürünlerde kullanılmaya devam ediyorsa görünürlüğü etkilenebilir." itemName={archiveTarget ? (archiveTarget.name || getTranslation(archiveTarget, 'tr')?.name || archiveTarget.code) : ''} confirmLabel="Arşivle" variant="archive" pending={archiving} onConfirm={() => archiveTarget && archiveRecord(archiveTarget)} />
    </section>
  );
}
