'use client';

import { ImageIcon, LoaderCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { AdminButton } from '@/components/admin/ui/button';
import AdminDropzone from '@/components/admin/ui/dropzone';

export default function HomepageImageField({ title, description, altText, mediaAssetId, imageUrl, fallbackUrl, disabled, onChanged }) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [dropzoneKey, setDropzoneKey] = useState(0);
  const previewUrl = imageUrl || fallbackUrl;

  async function upload(files) {
    const file = files[0];
    if (!file || pending) return;
    setPending(true);
    setFeedback({ type: '', message: '' });
    try {
      if (mediaAssetId) {
        const replacement = new FormData();
        replacement.append('image', file);
        const response = await fetch(`/api/admin/media/${mediaAssetId}/replace`, { method: 'PUT', body: replacement });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Görsel değiştirilemedi.');
        onChanged({ mediaAssetId, imageUrl: payload.data?.record?.url || imageUrl });
        setFeedback({ type: 'success', message: 'Görsel değiştirildi ve yayındaki alana yansıtıldı.' });
      } else {
        const formData = new FormData();
        formData.append('entityType', 'content');
        formData.append('entityId', '1');
        formData.append('mediaRole', 'editorial');
        formData.append('altText', altText);
        formData.append('sortOrder', '0');
        formData.append('isFeatured', 'true');
        formData.append('images', file);
        const response = await fetch('/api/admin/media', { method: 'POST', body: formData });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Görsel yüklenemedi.');
        const record = payload.data?.records?.[0];
        if (!record) throw new Error('Yüklenen görsel bilgisi alınamadı.');
        onChanged({ mediaAssetId: record.id, imageUrl: record.url });
        setFeedback({ type: 'success', message: 'Görsel yüklendi. Anasayfaya bağlamak için içerikleri kaydedin.' });
      }
      setDropzoneKey((current) => current + 1);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setPending(false);
    }
  }

  async function removeImage() {
    if (!mediaAssetId || pending) return;
    setPending(true);
    setFeedback({ type: '', message: '' });
    try {
      const response = await fetch(`/api/admin/media/${mediaAssetId}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Görsel kaldırılamadı.');
      onChanged({ mediaAssetId: null, imageUrl: '' });
      setFeedback({ type: 'success', message: 'Özel görsel kaldırıldı; varsayılan görsel kullanılacak.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-b border-border py-6 first:pt-0 last:border-0 last:pb-0">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">{description}</p></div>
            {mediaAssetId ? <AdminButton type="button" size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={removeImage} disabled={pending || disabled}><Trash2 className="size-3.5" />Kaldır</AdminButton> : null}
          </div>
          <div className="mt-4">
            <AdminDropzone key={dropzoneKey} maxFiles={1} onChange={upload} className={pending || disabled ? 'pointer-events-none opacity-60' : ''} />
          </div>
          {pending ? <p role="status" className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" />Görsel işleniyor…</p> : null}
          {feedback.message ? <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`mt-3 text-xs ${feedback.type === 'error' ? 'text-danger' : 'text-success'}`}>{feedback.message}</p> : null}
        </div>
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
            {previewUrl ? <Image src={previewUrl} alt={altText} fill sizes="14rem" className="object-cover" /> : <ImageIcon className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />}
          </div>
          <p className="mt-2 text-center text-[0.68rem] text-muted-foreground">{mediaAssetId ? 'Yüklenen görsel' : 'Varsayılan görsel'}</p>
        </div>
      </div>
    </section>
  );
}
