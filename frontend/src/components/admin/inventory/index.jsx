'use client';

import { RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/page-header';
import AdminAlert from '@/components/admin/ui/alert';
import { AdminButton } from '@/components/admin/ui/button';
import { adminInputClass } from '@/components/admin/ui/form-field';
import { AdminSelect } from '@/components/admin/ui/select';
import InventoryDialog from './inventory-dialog';
import InventoryTable from './inventory-table';

const statusOptions = [
  { value: 'all', label: 'Tüm stok durumları' },
  { value: 'in_stock', label: 'Normal stok' },
  { value: 'low_stock', label: 'Düşük stok' },
  { value: 'out_of_stock', label: 'Tükenenler' },
];

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestInventory = useCallback(async (page) => {
    const query = new URLSearchParams({ page: String(page), limit: '25', status, locale: 'tr' });
    if (search) query.set('search', search);
    const response = await fetch(`/api/admin/inventory?${query}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Stok listesi alınamadı.');
    return payload.data || { items: [], pagination: { page, limit: 25, total: 0 } };
  }, [search, status]);

  const load = useCallback(async (page) => {
    try {
      const result = await requestInventory(page);
      setItems(result.items || []);
      setPagination(result.pagination || { page, limit: 25, total: 0 });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [requestInventory]);

  useEffect(() => {
    let active = true;
    requestInventory(1)
      .then((result) => {
        if (!active) return;
        setItems(result.items || []);
        setPagination(result.pagination || { page: 1, limit: 25, total: 0 });
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestInventory]);

  function submitSearch(event) {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    setLoading(true);
    setError('');
    if (nextSearch === search) load(1);
    else setSearch(nextSearch);
  }

  async function handleSaved(successMessage) {
    setMessage(successMessage || 'Stok bilgisi güncellendi.');
    setSelectedItem(null);
    setLoading(true);
    await load(pagination.page);
  }

  const lastPage = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Ürün operasyonları" title="Varyant stokları" description="Kullanılabilir stok satışa açıktır; ayrılmış stok 20 dakikalık aktif checkout rezervasyonlarından hesaplanır." actions={<AdminButton variant="secondary" onClick={() => { setLoading(true); setError(''); load(pagination.page); }} disabled={loading}><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />Yenile</AdminButton>} />

      {message ? <AdminAlert title={message} variant="success" /> : null}
      {error ? <AdminAlert title="Stok listesi yüklenemedi" variant="danger">{error}</AdminAlert> : null}

      <section className="rounded-xl border border-border bg-card p-4">
        <form onSubmit={submitSearch} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_15rem_auto]">
          <label className="relative"><span className="sr-only">Ürün, SKU veya kod ara</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className={`${adminInputClass} pl-10`} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} placeholder="Ürün adı, kod veya SKU ara" /></label>
          <AdminSelect value={status} onValueChange={(value) => { setLoading(true); setError(''); setStatus(value); }} ariaLabel="Stok durumu" options={statusOptions} />
          <AdminButton type="submit">Ara</AdminButton>
        </form>
      </section>

      {loading ? <div className="h-72 animate-pulse rounded-xl bg-muted" /> : <InventoryTable items={items} onSelect={setSelectedItem} />}

      {!loading && pagination.total > pagination.limit ? (
        <nav className="flex items-center justify-between gap-3" aria-label="Stok sayfaları">
          <p className="text-xs text-muted-foreground">{pagination.total} varyant · Sayfa {pagination.page}/{lastPage}</p>
          <div className="flex gap-2"><AdminButton variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => { setLoading(true); load(pagination.page - 1); }}>Önceki</AdminButton><AdminButton variant="secondary" size="sm" disabled={pagination.page >= lastPage} onClick={() => { setLoading(true); load(pagination.page + 1); }}>Sonraki</AdminButton></div>
        </nav>
      ) : null}

      <InventoryDialog key={selectedItem?.variantId || 'closed'} item={selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }} onSaved={handleSaved} />
    </div>
  );
}
