'use client';

import { ImageIcon, LoaderCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import AdminDropzone from '@/components/admin/ui/dropzone';
import { AdminButton } from '@/components/admin/ui/button';

export default function NavigationItemImage({ itemId, mediaAssetId, imageUrl, label, disabled, onChanged }) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [dropzoneKey, setDropzoneKey] = useState(0);

  async function upload(files) {
    const file = files[0];
    if (!file || pending || !itemId) return;
    setPending(true);
    setFeedback({ type: '', message: '' });
    try {
      if (mediaAssetId) {
        const replacement = new FormData();
        replacement.append('image', file);
        const response = await fetch(`/api/admin/media/${mediaAssetId}/replace`, { method: 'PUT', body: replacement });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Menü görseli değiştirilemedi.');
        onChanged({ mediaAssetId, imageUrl: payload.data?.record?.url || imageUrl });
        setFeedback({ type: 'success', message: 'Görsel değiştirildi.' });
      } else {
        const formData = new FormData();
        formData.append('entityType', 'navigation');
        formData.append('entityId', String(itemId));
        formData.append('mediaRole', 'editorial');
        formData.append('altText', label || 'Mega menü tanıtım görseli');
        formData.append('sortOrder', '0');
        formData.append('isFeatured', 'true');
        formData.append('images', file);
        const response = await fetch('/api/admin/media', { method: 'POST', body: formData });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Menü görseli yüklenemedi.');
        const record = payload.data?.records?.[0];
        if (!record) throw new Error('Yüklenen görsel bilgisi alınamadı.');
        onChanged({ mediaAssetId: record.id, imageUrl: record.url });
        setFeedback({ type: 'success', message: 'Görsel yüklendi. Menüyle ilişkilendirmek için ana kaydet düğmesini kullanın.' });
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
      if (!response.ok) throw new Error(payload.message || 'Menü görseli silinemedi.');
      onChanged({ mediaAssetId: null, imageUrl: '' });
      setFeedback({ type: 'success', message: 'Görsel kaldırıldı.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 border-t border-border pt-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div><h3 className="text-sm font-medium">Mega menü tanıtım görseli</h3><p className="mt-1 text-xs text-muted-foreground">Bu ana menü açıldığında sağdaki geniş alanda gösterilir.</p></div>
        {mediaAssetId ? <AdminButton type="button" size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={removeImage} disabled={pending || disabled}><Trash2 className="size-3.5" />Kaldır</AdminButton> : null}
      </div>

      {imageUrl ? (
        <div className="mb-3 grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
            <Image src={imageUrl} alt={label || ''} fill sizes="12rem" className="object-cover" />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Yeni bir dosya seçerseniz mevcut görsel güvenli biçimde değiştirilir. Menü metinleri ve bağlantıları etkilenmez.</p>
        </div>
      ) : itemId ? null : (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground"><ImageIcon className="size-4 shrink-0" />Yeni menü öğesine görsel eklemek için önce menüyü bir kez kaydedin.</div>
      )}

      {itemId ? <AdminDropzone key={dropzoneKey} maxFiles={1} onChange={upload} className={pending || disabled ? 'pointer-events-none opacity-60' : ''} /> : null}
      {pending ? <p role="status" className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" />Görsel işleniyor…</p> : null}
      {feedback.message ? <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`mt-3 text-xs ${feedback.type === 'error' ? 'text-danger' : 'text-success'}`}>{feedback.message}</p> : null}
    </div>
  );
}
