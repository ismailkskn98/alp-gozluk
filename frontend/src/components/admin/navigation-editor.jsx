'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { GripVertical, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { AdminButton } from '@/components/admin/ui/button';
import ConfirmActionDialog from '@/components/admin/ui/confirm-action-dialog';
import { adminInputClass, AdminFormField } from '@/components/admin/ui/form-field';
import { AdminSelect } from '@/components/admin/ui/select';

const optionalPath = z.union([z.literal(''), z.string().regex(/^\/(?!\/)[^\s]{0,499}$/, 'Site içi / ile başlayan bir yol girin.')]);
const itemSchema = z.object({
  code: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{1,99}$/, 'Geçerli ve benzersiz bir kod girin.'),
  parentCode: z.string(),
  itemType: z.enum(['link', 'group', 'promo']),
  columnPosition: z.coerce.number().int().min(1).max(4),
  sortOrder: z.coerce.number().int().min(0).max(100000),
  status: z.enum(['active', 'inactive']),
  trLabel: z.string().trim().min(2).max(160),
  trHref: optionalPath,
  enLabel: z.string().trim().min(2).max(160),
  enHref: optionalPath,
});
const schema = z.object({ items: z.array(itemSchema).min(1).max(100) }).superRefine(({ items }, context) => {
  const codes = new Set();
  items.forEach((item, index) => {
    if (codes.has(item.code)) context.addIssue({ code: 'custom', path: ['items', index, 'code'], message: 'Bu kod daha önce kullanılmış.' });
    codes.add(item.code);
  });
  items.forEach((item, index) => {
    if (item.parentCode && !codes.has(item.parentCode)) context.addIssue({ code: 'custom', path: ['items', index, 'parentCode'], message: 'Üst öğe bulunamadı.' });
    if (item.parentCode === item.code) context.addIssue({ code: 'custom', path: ['items', index, 'parentCode'], message: 'Bir öğe kendisinin altında olamaz.' });
  });
  const parentByCode = new Map(items.map((item) => [item.code, item.parentCode]));
  items.forEach((item, index) => {
    const visited = new Set([item.code]);
    let parentCode = item.parentCode;
    while (parentCode) {
      if (visited.has(parentCode)) {
        context.addIssue({ code: 'custom', path: ['items', index, 'parentCode'], message: 'Döngüsel üst menü ilişkisi kullanılamaz.' });
        break;
      }
      visited.add(parentCode);
      parentCode = parentByCode.get(parentCode);
    }
  });
});

function flattenItems(items, parentCode = '') {
  return items.flatMap((item) => {
    const translations = item.translations || [];
    const tr = translations.find((translation) => translation.locale === 'tr');
    const en = translations.find((translation) => translation.locale === 'en');
    const current = {
      code: item.code,
      parentCode,
      itemType: item.itemType || 'link',
      columnPosition: item.columnPosition || 1,
      sortOrder: item.sortOrder || 0,
      status: item.status || 'active',
      trLabel: tr?.label || item.label || item.code,
      trHref: tr?.href || item.href || '',
      enLabel: en?.label || tr?.label || item.label || item.code,
      enHref: en?.href || tr?.href || item.href || '',
    };
    return [current, ...flattenItems(item.children || [], item.code)];
  });
}

export default function NavigationEditor() {
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);
  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { items: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const currentItems = useWatch({ control, name: 'items' }) || [];

  useEffect(() => {
    let active = true;
    fetch('/api/admin/navigation', { cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
      .then(({ ok, payload }) => {
        if (!active) return;
        if (!ok) throw new Error(payload.message || 'Navigasyon alınamadı.');
        reset({ items: flattenItems(payload.data?.menu?.items || []) });
      })
      .catch((error) => { if (active) setFeedback({ type: 'error', message: error.message }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reset]);

  async function onSubmit(values) {
    setFeedback({ type: '', message: '' });
    const payload = {
      items: values.items.map((item) => ({
        code: item.code,
        parentCode: item.parentCode || null,
        itemType: item.itemType,
        columnPosition: item.columnPosition,
        sortOrder: item.sortOrder,
        status: item.status,
        customUrl: null,
        translations: [
          { locale: 'tr', label: item.trLabel, href: item.trHref || null },
          { locale: 'en', label: item.enLabel, href: item.enHref || item.trHref || null },
        ],
      })),
    };
    const response = await fetch('/api/admin/navigation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    setFeedback(response.ok ? { type: 'success', message: 'Mega menü kaydedildi.' } : { type: 'error', message: result.message || 'Mega menü kaydedilemedi.' });
  }

  const roots = (currentItems || []).filter((item) => !item.parentCode);

  if (loading) return <div className="rounded-xl border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">Navigasyon yükleniyor…</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <section key={field.id} className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(16,35,61,0.03)] sm:p-5">
              <input type="hidden" {...register(`items.${index}.status`)} />
              <div className="mb-5 flex items-center gap-2 border-b border-border pb-4"><GripVertical className="size-4 text-muted-foreground" /><span className="text-sm font-semibold">{currentItems?.[index]?.trLabel || `Öğe ${index + 1}`}</span><button type="button" onClick={() => setRemoveTarget({ index, name: currentItems?.[index]?.trLabel || currentItems?.[index]?.code || `Öğe ${index + 1}` })} className="ml-auto grid size-9 place-items-center rounded-lg text-danger transition hover:bg-danger/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25" aria-label="Öğeyi kaldır"><Trash2 className="size-4" /></button></div>
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <AdminFormField label="Kod" error={errors.items?.[index]?.code?.message}><input className={adminInputClass} {...register(`items.${index}.code`)} aria-invalid={Boolean(errors.items?.[index]?.code)} /></AdminFormField>
                <AdminFormField label="Üst öğe" error={errors.items?.[index]?.parentCode?.message}><Controller control={control} name={`items.${index}.parentCode`} render={({ field: selectField }) => <AdminSelect value={selectField.value || ''} onValueChange={selectField.onChange} ariaLabel="Üst öğe" options={[{ value: '', label: 'Ana menü' }, ...(currentItems || []).filter((item, itemIndex) => itemIndex !== index && item.code).map((item) => ({ value: item.code, label: item.trLabel || item.code }))]} />} /></AdminFormField>
                <AdminFormField label="Tür"><Controller control={control} name={`items.${index}.itemType`} render={({ field: selectField }) => <AdminSelect value={selectField.value} onValueChange={selectField.onChange} ariaLabel="Menü öğesi türü" options={[{ value: 'link', label: 'Bağlantı' }, { value: 'group', label: 'Grup' }, { value: 'promo', label: 'Tanıtım' }]} />} /></AdminFormField>
                <div className="grid grid-cols-2 gap-3"><AdminFormField label="Sütun"><input type="number" min="1" max="4" className={adminInputClass} {...register(`items.${index}.columnPosition`)} /></AdminFormField><AdminFormField label="Sıra"><input type="number" min="0" className={adminInputClass} {...register(`items.${index}.sortOrder`)} /></AdminFormField></div>
                <AdminFormField label="Türkçe etiket" error={errors.items?.[index]?.trLabel?.message}><input className={adminInputClass} {...register(`items.${index}.trLabel`)} aria-invalid={Boolean(errors.items?.[index]?.trLabel)} /></AdminFormField>
                <AdminFormField label="Türkçe yol" error={errors.items?.[index]?.trHref?.message}><input className={adminInputClass} placeholder="/shop/kadin" {...register(`items.${index}.trHref`)} aria-invalid={Boolean(errors.items?.[index]?.trHref)} /></AdminFormField>
                <AdminFormField label="İngilizce etiket" error={errors.items?.[index]?.enLabel?.message}><input className={adminInputClass} {...register(`items.${index}.enLabel`)} aria-invalid={Boolean(errors.items?.[index]?.enLabel)} /></AdminFormField>
                <AdminFormField label="İngilizce yol" error={errors.items?.[index]?.enHref?.message}><input className={adminInputClass} placeholder="/shop/women" {...register(`items.${index}.enHref`)} aria-invalid={Boolean(errors.items?.[index]?.enHref)} /></AdminFormField>
              </div>
            </section>
          ))}
          <AdminButton type="button" variant="secondary" onClick={() => append({ code: `menu-link-${fields.length + 1}`, parentCode: '', itemType: 'link', columnPosition: 1, sortOrder: (fields.length + 1) * 10, status: 'active', trLabel: 'Yeni bağlantı', trHref: '/shop', enLabel: 'New link', enHref: '/shop' })}><Plus className="size-4" />Öğe ekle</AdminButton>
        </div>

        <aside className="self-start rounded-xl border border-border border-t-2 border-t-primary bg-card p-5 2xl:sticky 2xl:top-24">
          <p className="text-xs font-medium text-muted-foreground">Masaüstü önizleme</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-b border-border pb-4 text-sm">{roots.map((item) => <span key={item.code}>{item.trLabel || item.code}</span>)}</div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Ana öğeler header’da görünür. Alt öğeler, seçilen üst öğe ve sütun sırasına göre mega menüde gruplanır.</p>
          {feedback.message ? <p role="status" className={`mt-4 p-3 text-sm ${feedback.type === 'error' ? 'bg-danger/8 text-danger' : 'bg-success/8 text-success'}`}>{feedback.message}</p> : null}
          <AdminButton type="submit" disabled={isSubmitting} className="mt-5 w-full"><Save className="size-4" />{isSubmitting ? 'Kaydediliyor…' : 'Mega menüyü kaydet'}</AdminButton>
        </aside>
      </div>
      <ConfirmActionDialog open={Boolean(removeTarget)} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }} title="Menü öğesini kaldır" description="Bu öğe formdan ve kaydettiğinizde mega menüden kaldırılacak. Alt öğelerin üst menü ilişkisini yeniden kontrol etmeniz gerekebilir." itemName={removeTarget?.name} confirmLabel="Öğeyi kaldır" onConfirm={() => { if (removeTarget) remove(removeTarget.index); setRemoveTarget(null); }} />
    </form>
  );
}
