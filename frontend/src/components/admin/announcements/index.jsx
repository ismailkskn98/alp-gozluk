'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Megaphone, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import AdminAlert from '@/components/admin/ui/alert';
import { AdminButton } from '@/components/admin/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { AdminFormField, adminInputClass } from '@/components/admin/ui/form-field';
import SortableAnnouncementRow from './sortable-row';

const hexColor = /^#[0-9a-f]{6}$/i;
const linkIsSafe = (value) => !value || (value.startsWith('/') && !value.startsWith('//')) || /^https:\/\/[^\s]+$/i.test(value);
const luminance = (hex) => {
  const channels = hex.slice(1).match(/.{2}/g).map((part) => Number.parseInt(part, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
};
const hasReadableContrast = (background, foreground) => {
  if (!hexColor.test(background) || !hexColor.test(foreground)) return false;
  const values = [luminance(background), luminance(foreground)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05) >= 4.5;
};

const schema = z.object({
  messageTr: z.string().trim().min(2, 'En az 2 karakter girin.').max(240, 'En fazla 240 karakter girin.'),
  messageEn: z.string().trim().max(240, 'En fazla 240 karakter girin.').optional(),
  linkLabelTr: z.string().trim().max(80, 'En fazla 80 karakter girin.').optional(),
  linkLabelEn: z.string().trim().max(80, 'En fazla 80 karakter girin.').optional(),
  linkUrl: z.string().trim().max(500, 'Bağlantı çok uzun.').refine(linkIsSafe, 'Site içi / ile başlayan veya güvenli https bağlantısı girin.').optional(),
  linkUnderline: z.boolean(),
  backgroundColor: z.string().regex(hexColor, '#E5E5DC biçiminde bir renk girin.'),
  textColor: z.string().regex(hexColor, '#17191D biçiminde bir renk girin.'),
  durationSeconds: z.coerce.number().int().min(3, 'En az 3 saniye.').max(60, 'En fazla 60 saniye.'),
  sortOrder: z.coerce.number().int().min(0).max(100000),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean(),
}).superRefine((values, context) => {
  if (values.startsAt && values.endsAt && values.startsAt >= values.endsAt) {
    context.addIssue({ code: 'custom', path: ['endsAt'], message: 'Bitiş zamanı başlangıçtan sonra olmalı.' });
  }
  if (!hasReadableContrast(values.backgroundColor, values.textColor)) {
    context.addIssue({ code: 'custom', path: ['textColor'], message: 'Yazı ve arka plan kontrastı en az 4.5:1 olmalı.' });
  }
});

const defaults = {
  messageTr: '', messageEn: '', linkLabelTr: 'Detaylar', linkLabelEn: 'Details', linkUrl: '',
  backgroundColor: '#E5E5DC', textColor: '#17191D', durationSeconds: 5, sortOrder: 0,
  startsAt: '', endsAt: '', isActive: true, linkUnderline: true,
};

const toLocalDateTime = (value) => value ? new Date(value).toISOString().slice(0, 16) : '';

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [reordering, setReordering] = useState(false);
  const { control, register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: defaults });
  const preview = useWatch({ control });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/announcements', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Duyurular alınamadı.');
      setAnnouncements(payload.data?.announcements || []);
    } catch (error) {
      setFeedback({ variant: 'danger', title: 'Duyurular yüklenemedi', message: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/announcements', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Duyurular alınamadı.');
        if (active) setAnnouncements(payload.data?.announcements || []);
      })
      .catch((error) => {
        if (active) setFeedback({ variant: 'danger', title: 'Duyurular yüklenemedi', message: error.message });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function startEdit(item) {
    setEditingId(item.id);
    setFeedback(null);
    reset({
      messageTr: item.messageTr || '', messageEn: item.messageEn || '',
      linkLabelTr: item.linkLabelTr || '', linkLabelEn: item.linkLabelEn || '', linkUrl: item.linkUrl || '',
      linkUnderline: item.linkUnderline !== false,
      backgroundColor: item.backgroundColor, textColor: item.textColor,
      durationSeconds: item.durationSeconds, sortOrder: item.sortOrder,
      startsAt: toLocalDateTime(item.startsAt), endsAt: toLocalDateTime(item.endsAt), isActive: item.isActive,
    });
    document.getElementById('announcement-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearForm() {
    setEditingId(null);
    reset(defaults);
  }

  async function onSubmit(values) {
    setFeedback(null);
    const response = await fetch(`/api/admin/announcements${editingId ? `/${editingId}` : ''}`, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, sortOrder: editingId ? values.sortOrder : announcements.length, startsAt: values.startsAt || null, endsAt: values.endsAt || null }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback({ variant: 'danger', title: 'Duyuru kaydedilemedi', message: payload.message });
      return;
    }
    setFeedback({ variant: 'success', title: editingId ? 'Duyuru güncellendi' : 'Duyuru oluşturuldu', message: 'Public header önbelleği temizlendi.' });
    clearForm();
    await loadAnnouncements();
  }

  async function persistOrder(nextAnnouncements, previousAnnouncements) {
    setAnnouncements(nextAnnouncements.map((item, index) => ({ ...item, sortOrder: index })));
    setReordering(true);
    try {
      const response = await fetch('/api/admin/announcements/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: nextAnnouncements.map((item) => item.id) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Sıralama kaydedilemedi.');
      const editingIndex = nextAnnouncements.findIndex((item) => item.id === editingId);
      if (editingIndex >= 0) setValue('sortOrder', editingIndex);
      setFeedback({ variant: 'success', title: 'Sıralama güncellendi', message: 'Yeni sıra header alanına hemen yansıtılacak.' });
    } catch (error) {
      setAnnouncements(previousAnnouncements);
      setFeedback({ variant: 'danger', title: 'Sıralama kaydedilemedi', message: error.message });
    } finally {
      setReordering(false);
    }
  }

  function moveAnnouncement(fromIndex, toIndex) {
    if (reordering || toIndex < 0 || toIndex >= announcements.length) return;
    persistOrder(arrayMove(announcements, fromIndex, toIndex), announcements);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id || reordering) return;
    const fromIndex = announcements.findIndex((item) => item.id === active.id);
    const toIndex = announcements.findIndex((item) => item.id === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    persistOrder(arrayMove(announcements, fromIndex, toIndex), announcements);
  }

  async function deleteAnnouncement() {
    if (!deleteTarget) return;
    const response = await fetch(`/api/admin/announcements/${deleteTarget.id}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback({ variant: 'danger', title: 'Duyuru silinemedi', message: payload.message });
    } else {
      setFeedback({ variant: 'success', title: 'Duyuru silindi', message: 'Değişiklik header alanına yansıtılacak.' });
      if (editingId === deleteTarget.id) clearForm();
      await loadAnnouncements();
    }
    setDeleteTarget(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
      <section className="min-w-0 space-y-4" aria-label="Duyuru listesi">
        {feedback ? <AdminAlert variant={feedback.variant} title={feedback.title}>{feedback.message}</AdminAlert> : null}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div><h2 className="text-sm font-semibold">Kayıtlı duyurular</h2><p className="mt-0.5 text-xs text-muted-foreground">Tutamacı sürükleyerek veya okları kullanarak gösterim sırasını değiştirin.</p></div>
            <AdminButton size="sm" variant="secondary" onClick={loadAnnouncements} disabled={loading}><RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />Yenile</AdminButton>
          </div>
          {loading ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin" />Yükleniyor</div> : null}
          {!loading && announcements.length === 0 ? <div className="grid min-h-52 place-items-center px-6 text-center"><div><Megaphone className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Henüz duyuru yok</p><p className="mt-1 text-xs text-muted-foreground">İlk duyuruyu sağdaki formdan oluşturun.</p></div></div> : null}
          {!loading ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={announcements.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                {announcements.map((item, index) => <SortableAnnouncementRow key={item.id} item={item} index={index} total={announcements.length} disabled={reordering} onEdit={startEdit} onDelete={setDeleteTarget} onMove={moveAnnouncement} />)}
              </SortableContext>
            </DndContext>
          ) : null}
        </div>
      </section>

      <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} className="self-start rounded-xl border border-border border-t-2 border-t-primary bg-card p-5 shadow-[0_12px_32px_rgba(16,35,61,0.06)]" noValidate>
        <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-semibold">{editingId ? 'Duyuruyu düzenle' : 'Yeni duyuru'}</h2><p className="mt-1 text-xs text-muted-foreground">Kısa ve tek satırda anlaşılır bir mesaj kullanın.</p></div>{editingId ? <AdminButton size="sm" variant="ghost" type="button" onClick={clearForm}>Vazgeç</AdminButton> : <Plus className="mt-1 size-4 text-primary" />}</div>

        <div className="mb-5 overflow-hidden rounded-lg border border-black/10" style={{ backgroundColor: hexColor.test(preview.backgroundColor || '') ? preview.backgroundColor : '#E5E5DC', color: hexColor.test(preview.textColor || '') ? preview.textColor : '#17191D' }}>
          <p className="truncate px-4 py-2 text-center text-xs font-medium">{preview.messageTr || 'Duyuru önizlemesi'}{preview.linkUrl && preview.linkLabelTr ? <span className={`ml-1.5 ${preview.linkUnderline ? 'border-b border-current' : ''}`}>{preview.linkLabelTr}</span> : null}</p>
        </div>

        <div className="space-y-4">
          <AdminFormField label="Türkçe mesaj" htmlFor="messageTr" required hint="Maks. 240" error={errors.messageTr?.message}><input id="messageTr" className={adminInputClass} {...register('messageTr')} aria-invalid={Boolean(errors.messageTr)} /></AdminFormField>
          <AdminFormField label="İngilizce mesaj" htmlFor="messageEn" hint="Boşsa Türkçe gösterilir" error={errors.messageEn?.message}><input id="messageEn" className={adminInputClass} {...register('messageEn')} aria-invalid={Boolean(errors.messageEn)} /></AdminFormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFormField label="Link yazısı (TR)" htmlFor="linkLabelTr" error={errors.linkLabelTr?.message}><input id="linkLabelTr" className={adminInputClass} {...register('linkLabelTr')} /></AdminFormField>
            <AdminFormField label="Link yazısı (EN)" htmlFor="linkLabelEn" error={errors.linkLabelEn?.message}><input id="linkLabelEn" className={adminInputClass} {...register('linkLabelEn')} /></AdminFormField>
          </div>
          <AdminFormField label="Bağlantı" htmlFor="linkUrl" hint="İsteğe bağlı" error={errors.linkUrl?.message}><input id="linkUrl" className={adminInputClass} placeholder="/kampanyalar veya https://…" {...register('linkUrl')} aria-invalid={Boolean(errors.linkUrl)} /></AdminFormField>
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm"><input type="checkbox" className="size-4 accent-primary" {...register('linkUnderline')} /><span><span className="font-medium">Linkin altını çiz</span><span className="ml-2 text-xs text-muted-foreground">Varsayılan olarak açık</span></span></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField label="Arka plan" name="backgroundColor" register={register} setValue={setValue} error={errors.backgroundColor?.message} value={preview.backgroundColor} />
            <ColorField label="Yazı" name="textColor" register={register} setValue={setValue} error={errors.textColor?.message} value={preview.textColor} />
          </div>
          <AdminFormField label="Duyuru değişim hızı" htmlFor="durationSeconds" hint="Birden fazla aktif duyuru varsa" error={errors.durationSeconds?.message}><select id="durationSeconds" className={adminInputClass} {...register('durationSeconds')} aria-invalid={Boolean(errors.durationSeconds)}><option value="5">Hızlı — 5 saniyede değişir</option><option value="8">Dengeli — 8 saniyede değişir</option><option value="12">Yavaş — 12 saniyede değişir</option></select></AdminFormField>
          <details className="rounded-lg border border-border p-3"><summary className="text-sm font-medium">Zamanlama (isteğe bağlı)</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><AdminFormField label="Başlangıç" htmlFor="startsAt"><input id="startsAt" type="datetime-local" className={adminInputClass} {...register('startsAt')} /></AdminFormField><AdminFormField label="Bitiş" htmlFor="endsAt" error={errors.endsAt?.message}><input id="endsAt" type="datetime-local" className={adminInputClass} {...register('endsAt')} /></AdminFormField></div></details>
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm"><input type="checkbox" className="size-4 accent-primary" {...register('isActive')} /><span><span className="font-medium">Aktif</span><span className="ml-2 text-xs text-muted-foreground">Public header’da göster</span></span></label>
        </div>
        <AdminButton type="submit" className="mt-5 w-full" disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor…' : editingId ? 'Değişiklikleri kaydet' : 'Duyuru oluştur'}</AdminButton>
      </form>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Duyuruyu sil</DialogTitle><DialogDescription>“{deleteTarget?.messageTr}” kalıcı olarak silinecek. Bu işlem geri alınamaz.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><AdminButton variant="secondary">Vazgeç</AdminButton></DialogClose><AdminButton variant="danger" onClick={deleteAnnouncement}><Trash2 className="size-4" />Sil</AdminButton></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColorField({ label, name, register, setValue, error, value }) {
  return (
    <AdminFormField label={label} htmlFor={name} error={error}>
      <div className="relative"><input id={name} className={`${adminInputClass} pr-12 uppercase`} {...register(name)} aria-invalid={Boolean(error)} /><input type="color" aria-label={`${label} renk seçici`} className="absolute right-1 top-1 size-8 cursor-pointer rounded border-0 bg-transparent p-0" value={hexColor.test(value || '') ? value : '#000000'} onChange={(event) => setValue(name, event.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true })} /></div>
    </AdminFormField>
  );
}
