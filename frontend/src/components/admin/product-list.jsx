'use client';

import { useEffect, useState } from 'react';

export default function ProductList() {
  const [state, setState] = useState({ loading: true, products: [], error: '' });
  useEffect(() => {
    let active = true;
    fetch('/api/admin/products', { cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
      .then(({ ok, payload }) => {
        if (!active) return;
        if (!ok) throw new Error(payload.message || 'Ürünler alınamadı.');
        setState({ loading: false, products: payload.data?.products || [], error: '' });
      })
      .catch((error) => { if (active) setState({ loading: false, products: [], error: error.message }); });
    return () => { active = false; };
  }, []);

  return (
    <div className="overflow-x-auto border border-border bg-white">
      <div className="grid min-w-[48rem] grid-cols-[minmax(14rem,1.6fr)_1fr_8rem_8rem_6rem] gap-4 border-b border-border bg-muted/55 px-4 py-3 text-xs font-medium text-muted-foreground"><span>Ürün</span><span>Hedef kitle</span><span>Durum</span><span>Stok</span><span className="text-right">Fiyat</span></div>
      {state.loading ? <div className="px-5 py-14 text-center text-sm text-muted-foreground">Ürünler yükleniyor…</div> : null}
      {state.error ? <div className="px-5 py-14 text-center"><p className="font-medium text-danger">Ürünler alınamadı</p><p className="mt-2 text-sm text-muted-foreground">{state.error}</p></div> : null}
      {!state.loading && !state.error && state.products.length === 0 ? <div className="px-5 py-14 text-center"><p className="font-medium">Henüz ürün bulunmuyor</p><p className="mt-2 text-sm text-muted-foreground">İlk ürününüzü ekleyerek kataloğu oluşturmaya başlayın.</p></div> : null}
      {state.products.map((product) => (
        <div key={product.id} className="grid min-w-[48rem] grid-cols-[minmax(14rem,1.6fr)_1fr_8rem_8rem_6rem] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0">
          <div className="min-w-0"><p className="truncate font-medium">{product.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{product.code} · {product.brand}</p></div>
          <span className="truncate text-muted-foreground">{product.audiences || '—'}</span>
          <span className="w-fit bg-muted px-2 py-1 text-xs">{product.status}</span>
          <span className="tabular-nums">{product.stockQuantity ?? 0}</span>
          <span className="text-right tabular-nums">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(product.price || 0))}</span>
        </div>
      ))}
    </div>
  );
}
