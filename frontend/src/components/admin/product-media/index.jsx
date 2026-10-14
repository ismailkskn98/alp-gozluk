'use client';

import { ImagePlus, Images, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MediaCard from '@/components/admin/media/media-card';
import MediaDialog from '@/components/admin/media/media-dialog';
import { AdminButton } from '@/components/admin/ui/button';
import ConfirmActionDialog from '@/components/admin/ui/confirm-action-dialog';

const mediaGroups = [
  { role: 'gallery', title: 'Ürün galerisi', description: 'Ürün kartında ve detay sayfasının ana galerisinde kullanılır.' },
  { role: 'on_model', title: 'Model üzerinde', description: 'Ürün detayında ve uygun olduğunda anasayfa model alanlarında kullanılır.' },
  { role: 'editorial', title: 'Editoryal', description: 'Ürün hikâyesi, kampanya ve geniş görsel alanları için kullanılır.' },
];

export default function ProductMediaManager({ productId, productName, productCode }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [dialogState, setDialogState] = useState({ open: false, media: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const product = useMemo(() => ({ id: productId, name: productName, code: productCode }), [productCode, productId, productName]);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ entityType: 'product', entityId: String(productId), limit: '100' });
      const response = await fetch(`/api/admin/media?${query}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Ürün görselleri alınamadı.');
      setRecords(payload.data?.records || []);
      setFeedback((current) => current.type === 'success' ? current : { type: '', message: '' });
    } catch (error) {
      setRecords([]);
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ entityType: 'product', entityId: String(productId), limit: '100' });
    fetch(`/api/admin/media?${query}`, { cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
      .then(({ ok, payload }) => {
        if (!active) return;
        if (!ok) throw new Error(payload.message || 'Ürün görselleri alınamadı.');
        setRecords(payload.data?.records || []);
      })
      .catch((error) => {
        if (!active) return;
        setRecords([]);
        setFeedback({ type: 'error', message: error.message });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId]);

  async function handleSaved() {
    setFeedback({ type: 'success', message: dialogState.media ? 'Görsel güncellendi.' : 'Görseller ürüne eklendi.' });
    await loadMedia();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/media/${deleteTarget.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Görsel silinemedi.');
      setDeleteTarget(null);
      setFeedback({ type: 'success', message: 'Görsel üründen ve storage alanından silindi.' });
      await loadMedia();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section id="product-images" className="scroll-mt-24 border-x border-b border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">Ürün görselleri</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Bu ürüne ait galeri, model ve editoryal görselleri buradan ekleyin, önizleyin, değiştirin veya silin.</p>
        </div>
        <div className="flex gap-2">
          <AdminButton type="button" variant="secondary" aria-label="Ürün görsellerini yenile" onClick={loadMedia} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />Yenile
          </AdminButton>
          <AdminButton type="button" onClick={() => setDialogState({ open: true, media: null })}>
            <ImagePlus className="size-4" />Görsel ekle
          </AdminButton>
        </div>
      </div>

      {feedback.message ? (
        <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-lg px-3 py-2 text-sm ${feedback.type === 'error' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
          {feedback.message}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Ürün görselleri yükleniyor">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-xl border border-border bg-muted" />)}
        </div>
      ) : records.length === 0 ? (
        <div className="mt-6 grid min-h-52 place-items-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
          <div className="max-w-md px-6 py-10">
            <Images className="mx-auto size-8 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="mt-3 text-sm font-medium">Bu ürüne henüz görsel eklenmemiş</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">İlk görseli eklediğinizde kullanım alanına göre ürün kartı, detay ve anasayfa bölümlerine otomatik bağlanır.</p>
          </div>
        </div>
      ) : (
        <div className="mt-7 space-y-8">
          {mediaGroups.map((group) => {
            const groupRecords = records.filter((record) => record.mediaRole === group.role);
            if (groupRecords.length === 0) return null;
            return (
              <section key={group.role} aria-labelledby={`product-media-${group.role}`}>
                <div className="mb-3 flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
                  <div><h3 id={`product-media-${group.role}`} className="text-sm font-semibold">{group.title}</h3><p className="mt-1 text-xs text-muted-foreground">{group.description}</p></div>
                  <span className="text-xs tabular-nums text-muted-foreground">{groupRecords.length} görsel</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {groupRecords.map((media) => <MediaCard key={media.id} media={media} product={product} onEdit={(selectedMedia) => setDialogState({ open: true, media: selectedMedia })} onDelete={setDeleteTarget} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {dialogState.open ? (
        <MediaDialog
          key={dialogState.media?.id || 'new'}
          open
          onOpenChange={(open) => setDialogState((current) => ({ ...current, open }))}
          productId={productId}
          productLabel={[productName, productCode].filter(Boolean).join(' · ')}
          media={dialogState.media}
          onSaved={handleSaved}
        />
      ) : null}

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Ürün görselini sil"
        description="Görsel bu üründen kaldırılacak ve bağlı storage dosyası kalıcı olarak silinecek."
        itemLabel="Görsel"
        itemName={deleteTarget ? `${productName || productCode || `Ürün #${productId}`} · ${deleteTarget.modelName || 'Model adı yok'}` : ''}
        pending={deleting}
      />
    </section>
  );
}
