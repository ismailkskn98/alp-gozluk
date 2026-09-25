'use client';

import { History, SlidersHorizontal } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/button';
import StatusBadge from '@/components/admin/ui/status-badge';

const stockLabels = {
  in_stock: ['Stokta', 'success'],
  low_stock: ['Düşük stok', 'warning'],
  out_of_stock: ['Tükendi', 'danger'],
};

function statusBadge(item) {
  const [label, tone] = stockLabels[item.stockStatus] || ['Bilinmiyor', 'neutral'];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

export default function InventoryTable({ items, onSelect }) {
  if (!items.length) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <History className="mx-auto size-6 text-muted-foreground" />
        <h2 className="mt-4 text-sm font-semibold">Bu filtrede varyant bulunamadı</h2>
        <p className="mt-1 text-sm text-muted-foreground">Arama metnini veya stok filtresini değiştirin.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted/35 text-xs font-medium text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Ürün / varyant</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3 text-right">Kullanılabilir</th>
              <th className="px-4 py-3 text-right">Ayrılmış</th>
              <th className="px-4 py-3 text-right">Fiziksel</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right"><span className="sr-only">İşlem</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.variantId} className="transition-colors hover:bg-muted/25">
                <td className="max-w-[22rem] px-4 py-4">
                  <p className="font-medium text-foreground">{item.productName}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.options.length ? item.options.join(' · ') : 'Tek satış seçeneği'}</p>
                </td>
                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{item.sku}</td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums">{item.availableQuantity}</td>
                <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">{item.reservedQuantity}</td>
                <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">{item.physicalQuantity}</td>
                <td className="px-4 py-4">{statusBadge(item)}<p className="mt-1.5 text-[0.68rem] text-muted-foreground">Eşik: {item.lowStockThreshold}</p></td>
                <td className="px-4 py-4 text-right"><AdminButton size="sm" variant="secondary" onClick={() => onSelect(item)}><SlidersHorizontal className="size-3.5" />Yönet</AdminButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {items.map((item) => (
          <article key={item.variantId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h2 className="truncate text-sm font-semibold">{item.productName}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">{item.sku}</p></div>
              {statusBadge(item)}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.options.length ? item.options.join(' · ') : 'Tek satış seçeneği'}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/45 p-3 text-center">
              <div><dt className="text-[0.65rem] text-muted-foreground">Kullanılabilir</dt><dd className="mt-1 font-semibold tabular-nums">{item.availableQuantity}</dd></div>
              <div><dt className="text-[0.65rem] text-muted-foreground">Ayrılmış</dt><dd className="mt-1 font-semibold tabular-nums">{item.reservedQuantity}</dd></div>
              <div><dt className="text-[0.65rem] text-muted-foreground">Fiziksel</dt><dd className="mt-1 font-semibold tabular-nums">{item.physicalQuantity}</dd></div>
            </dl>
            <AdminButton className="mt-4 w-full" size="sm" variant="secondary" onClick={() => onSelect(item)}><SlidersHorizontal className="size-3.5" />Stoğu yönet</AdminButton>
          </article>
        ))}
      </div>
    </section>
  );
}
