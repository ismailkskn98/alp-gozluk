'use client';

import { ImagePlus, Images, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '@/components/admin/page-header';
import { AdminButton } from '@/components/admin/ui/button';
import ConfirmActionDialog from '@/components/admin/ui/confirm-action-dialog';
import { adminInputClass } from '@/components/admin/ui/form-field';
import { AdminSelect } from '@/components/admin/ui/select';
import MediaCard from './media-card';
import MediaDialog from './media-dialog';

const roleOptions = [
  { value: '', label: 'Tüm kullanım alanları' },
  { value: 'gallery', label: 'Ürün galerisi' },
  { value: 'on_model', label: 'Model üzerinde' },
  { value: 'editorial', label: 'Editoryal' },
];

export default function MediaLibrary() {
  const [products, setProducts] = useState([]);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0 });
  const [filters, setFilters] = useState({ entityId: '', mediaRole: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialogState, setDialogState] = useState({ open: false, media: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const productsById = useMemo(
    () => new Map(products.map((product) => [Number(product.id), product])),
    [products],
  );

  const fetchMedia = useCallback(async (requestedPage) => {
    const query = new URLSearchParams({ page: String(requestedPage), limit: String(pagination.limit), entityType: 'product' });
    if (filters.entityId) query.set('entityId', filters.entityId);
    if (filters.mediaRole) query.set('mediaRole', filters.mediaRole);
    if (filters.search) query.set('search', filters.search);
    const response = await fetch(`/api/admin/media?${query}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Medya kayıtları alınamadı.');
    return payload.data || {};
  }, [filters, pagination.limit]);

  const loadMedia = useCallback(async (requestedPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchMedia(requestedPage);
      setRecords(result.records || []);
      setPagination((current) => ({ ...current, ...(result.pagination || {}), page: requestedPage }));
    } catch (loadError) {
      setRecords([]);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [fetchMedia]);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/products', { cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
      .then(({ ok, payload }) => {
        if (!active) return;
        if (!ok) throw new Error(payload.message || 'Ürünler alınamadı.');
        setProducts(payload.data?.products || []);
      })
      .catch((productError) => { if (active) setError(productError.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetchMedia(1)
      .then((result) => {
        if (!active) return;
        setRecords(result.records || []);
        setPagination((current) => ({ ...current, ...(result.pagination || {}), page: 1 }));
        setError('');
      })
      .catch((loadError) => {
        if (!active) return;
        setRecords([]);
        setError(loadError.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchMedia]);

  function updateFilter(field, value) {
    setLoading(true);
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function submitSearch(event) {
    event.preventDefault();
    updateFilter('search', searchInput.trim());
  }

  async function handleSaved() {
    setNotice(dialogState.media ? 'Medya kaydı güncellendi.' : 'Görseller ürüne bağlandı.');
    await loadMedia(dialogState.media ? pagination.page : 1);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/media/${deleteTarget.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Medya silinemedi.');
      setDeleteTarget(null);
      setNotice('Medya kaydı ve storage dosyası silindi.');
      await loadMedia(records.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <>
      <AdminPageHeader
        eyebrow="İçerik"
        title="Medya kütüphanesi"
        description="Ürün galerisi, model ve editoryal görsellerini storage üzerinden yönetin."
        actions={<AdminButton onClick={() => setDialogState({ open: true, media: null })}><ImagePlus className="size-4" />Görsel yükle</AdminButton>}
      />

      <div className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-3 md:grid-cols-[minmax(15rem,1fr)_minmax(12rem,0.7fr)_minmax(12rem,0.7fr)_auto]">
        <form className="relative" onSubmit={submitSearch}>
          <label htmlFor="media-search" className="sr-only">Model veya alternatif metin ara</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="media-search" className={`${adminInputClass} pl-10 pr-16`} value={searchInput} maxLength={120} onChange={(event) => setSearchInput(event.target.value)} placeholder="Model veya alt metin ara" />
          <button type="submit" className="absolute right-1.5 top-1/2 min-h-8 -translate-y-1/2 rounded-lg px-2 text-xs font-medium text-primary hover:bg-muted">Ara</button>
        </form>
        <AdminSelect
          value={filters.entityId}
          onValueChange={(value) => updateFilter('entityId', value)}
          ariaLabel="Ürün filtresi"
          options={[{ value: '', label: 'Tüm ürünler' }, ...products.map((product) => ({ value: String(product.id), label: `${product.name} · ${product.code}` }))]}
        />
        <AdminSelect value={filters.mediaRole} onValueChange={(value) => updateFilter('mediaRole', value)} ariaLabel="Kullanım alanı filtresi" options={roleOptions} />
        <AdminButton variant="secondary" aria-label="Medya listesini yenile" onClick={() => loadMedia(pagination.page)} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />Yenile
        </AdminButton>
      </div>

      {notice ? <div role="status" className="mb-5 flex items-center justify-between rounded-xl border border-success/25 bg-success/8 px-4 py-3 text-sm text-success"><span>{notice}</span><button type="button" className="text-xs font-medium" onClick={() => setNotice('')}>Kapat</button></div> : null}
      {error ? <div role="alert" className="mb-5 rounded-xl border border-danger/25 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</div> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Medya yükleniyor">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-xl border border-border bg-muted" />)}
        </div>
      ) : records.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {records.map((media) => (
            <MediaCard
              key={media.id}
              media={media}
              product={productsById.get(Number(media.entityId))}
              onEdit={(selectedMedia) => setDialogState({ open: true, media: selectedMedia })}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-card text-center">
          <div className="max-w-sm px-6 py-12">
            <Images className="mx-auto size-9 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="mt-4 font-medium">Bu filtrelerde görsel yok</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Yeni bir görsel yükleyin veya ürün ve kullanım alanı filtrelerini temizleyin.</p>
          </div>
        </div>
      )}

      {!loading && pagination.total > pagination.limit ? (
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">{pagination.total} kayıt · {pagination.page}/{totalPages}. sayfa</p>
          <div className="flex gap-2">
            <AdminButton variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => loadMedia(pagination.page - 1)}>Önceki</AdminButton>
            <AdminButton variant="secondary" size="sm" disabled={pagination.page >= totalPages} onClick={() => loadMedia(pagination.page + 1)}>Sonraki</AdminButton>
          </div>
        </div>
      ) : null}

      {dialogState.open ? (
        <MediaDialog
          key={dialogState.media?.id || 'new'}
          open
          onOpenChange={(open) => setDialogState((current) => ({ ...current, open }))}
          products={products}
          media={dialogState.media}
          onSaved={handleSaved}
        />
      ) : null}
      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Görseli silmek istiyor musunuz?"
        description="Medya kaydı ve bağlı storage dosyası kalıcı olarak silinecek."
        itemLabel="Görsel"
        itemName={deleteTarget ? `${productsById.get(Number(deleteTarget.entityId))?.name || `Ürün #${deleteTarget.entityId}`} · ${deleteTarget.modelName || 'Model adı yok'}` : ''}
        pending={deleting}
      />
    </>
  );
}
