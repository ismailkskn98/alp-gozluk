'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { GripVertical, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

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

  const inputClass = 'h-9 w-full border border-input bg-white px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
  const roots = (currentItems || []).filter((item) => !item.parentCode);

  if (loading) return <div className="border border-border bg-white px-6 py-16 text-center text-sm text-muted-foreground">Navigasyon yükleniyor…</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <section key={field.id} className="border border-border bg-white p-4">
              <input type="hidden" {...register(`items.${index}.status`)} />
              <div className="mb-4 flex items-center gap-2"><GripVertical className="size-4 text-muted-foreground" /><span className="text-sm font-medium">{currentItems?.[index]?.trLabel || `Öğe ${index + 1}`}</span><button type="button" onClick={() => remove(index)} className="ml-auto grid size-8 place-items-center text-danger hover:bg-danger/8" aria-label="Öğeyi kaldır"><Trash2 className="size-4" /></button></div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-xs font-medium text-muted-foreground">Kod<input className={`${inputClass} mt-1`} {...register(`items.${index}.code`)} /></label>
                <label className="text-xs font-medium text-muted-foreground">Üst öğe<select className={`${inputClass} mt-1`} {...register(`items.${index}.parentCode`)}><option value="">Ana menü</option>{(currentItems || []).filter((item, itemIndex) => itemIndex !== index).map((item) => <option key={`${item.code}-${index}`} value={item.code}>{item.trLabel || item.code}</option>)}</select></label>
                <label className="text-xs font-medium text-muted-foreground">Tür<select className={`${inputClass} mt-1`} {...register(`items.${index}.itemType`)}><option value="link">Bağlantı</option><option value="group">Grup</option><option value="promo">Tanıtım</option></select></label>
                <div className="grid grid-cols-2 gap-2"><label className="text-xs font-medium text-muted-foreground">Sütun<input type="number" min="1" max="4" className={`${inputClass} mt-1`} {...register(`items.${index}.columnPosition`)} /></label><label className="text-xs font-medium text-muted-foreground">Sıra<input type="number" min="0" className={`${inputClass} mt-1`} {...register(`items.${index}.sortOrder`)} /></label></div>
                <label className="text-xs font-medium text-muted-foreground">Türkçe etiket<input className={`${inputClass} mt-1`} {...register(`items.${index}.trLabel`)} /></label>
                <label className="text-xs font-medium text-muted-foreground">Türkçe yol<input className={`${inputClass} mt-1`} placeholder="/shop/kadin" {...register(`items.${index}.trHref`)} /></label>
                <label className="text-xs font-medium text-muted-foreground">İngilizce etiket<input className={`${inputClass} mt-1`} {...register(`items.${index}.enLabel`)} /></label>
                <label className="text-xs font-medium text-muted-foreground">İngilizce yol<input className={`${inputClass} mt-1`} placeholder="/shop/women" {...register(`items.${index}.enHref`)} /></label>
              </div>
              {errors.items?.[index] ? <p className="mt-3 text-xs text-danger">Bu satırdaki alanları ve üst öğe ilişkisini kontrol edin.</p> : null}
            </section>
          ))}
          <button type="button" onClick={() => append({ code: `menu-link-${fields.length + 1}`, parentCode: '', itemType: 'link', columnPosition: 1, sortOrder: (fields.length + 1) * 10, status: 'active', trLabel: 'Yeni bağlantı', trHref: '/shop', enLabel: 'New link', enHref: '/shop' })} className="inline-flex h-10 items-center gap-2 border border-border-strong bg-white px-4 text-sm font-medium hover:bg-muted"><Plus className="size-4" />Öğe ekle</button>
        </div>

        <aside className="self-start border-t-2 border-primary bg-white p-5 2xl:sticky 2xl:top-24">
          <p className="text-xs font-medium text-muted-foreground">Masaüstü önizleme</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-b border-border pb-4 text-sm">{roots.map((item) => <span key={item.code}>{item.trLabel || item.code}</span>)}</div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Ana öğeler header’da görünür. Alt öğeler, seçilen üst öğe ve sütun sırasına göre mega menüde gruplanır.</p>
          {feedback.message ? <p role="status" className={`mt-4 p-3 text-sm ${feedback.type === 'error' ? 'bg-danger/8 text-danger' : 'bg-success/8 text-success'}`}>{feedback.message}</p> : null}
          <button type="submit" disabled={isSubmitting} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 bg-primary px-4 text-sm font-medium text-white disabled:opacity-60"><Save className="size-4" />{isSubmitting ? 'Kaydediliyor…' : 'Mega menüyü kaydet'}</button>
        </aside>
      </div>
    </form>
  );
}
