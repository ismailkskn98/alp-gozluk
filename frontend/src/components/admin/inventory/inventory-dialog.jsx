'use client';

import { ArrowDown, ArrowUp, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminButton } from '@/components/admin/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { AdminFormField, adminInputClass } from '@/components/admin/ui/form-field';
import { AdminSelect } from '@/components/admin/ui/select';

const reasonOptions = [
  { value: 'stock_receipt', label: 'Yeni stok girişi', directions: ['increase'] },
  { value: 'manual_correction', label: 'Sayım / manuel düzeltme', directions: ['increase', 'decrease'] },
  { value: 'damage', label: 'Hasar veya kayıp', directions: ['decrease'] },
  { value: 'customer_return', label: 'Müşteri iadesi', directions: ['increase'] },
  { value: 'other', label: 'Diğer', directions: ['increase', 'decrease'] },
];

const movementLabels = {
  initial_stock: 'Başlangıç stoğu',
  stock_receipt: 'Yeni stok girişi',
  manual_correction: 'Manuel düzeltme',
  damage: 'Hasar veya kayıp',
  customer_return: 'Müşteri iadesi',
  other: 'Diğer',
  reservation_hold: 'Checkout rezervasyonu',
  reservation_release: 'Rezervasyon iadesi',
};

export default function InventoryDialog({ item, onOpenChange, onSaved }) {
  const [direction, setDirection] = useState('increase');
  const [quantity, setQuantity] = useState('');
  const [reasonCode, setReasonCode] = useState('stock_receipt');
  const [note, setNote] = useState('');
  const [threshold, setThreshold] = useState(String(item?.lowStockThreshold ?? 5));
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(Boolean(item));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!item) return undefined;
    let active = true;
    fetch(`/api/admin/inventory/${item.variantId}/movements?limit=12`, { cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
      .then(({ ok, payload }) => {
        if (!active) return;
        if (!ok) throw new Error(payload.message || 'Stok hareketleri alınamadı.');
        setMovements(payload.data?.movements || []);
      })
      .catch((error) => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setLoadingMovements(false); });
    return () => { active = false; };
  }, [item]);

  async function submitAdjustment(event) {
    event.preventDefault();
    setMessage('');
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setMessage('Miktar pozitif bir tam sayı olmalı.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/inventory/${item.variantId}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, quantity: parsedQuantity, reasonCode, note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Stok güncellenemedi.');
      await onSaved(payload.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateThreshold() {
    setMessage('');
    const parsedThreshold = Number(threshold);
    if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0) {
      setMessage('Düşük stok eşiği sıfır veya pozitif bir tam sayı olmalı.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/inventory/${item.variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lowStockThreshold: parsedThreshold }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Eşik güncellenemedi.');
      await onSaved(payload.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!item) return null;

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,46rem)]">
        <DialogHeader>
          <DialogTitle>{item.productName} stok yönetimi</DialogTitle>
          <DialogDescription>{item.sku} · Kullanılabilir {item.availableQuantity}, ayrılmış {item.reservedQuantity}, fiziksel {item.physicalQuantity}</DialogDescription>
        </DialogHeader>

        {message ? <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">{message}</p> : null}

        <form onSubmit={submitAdjustment} className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold">Stok hareketi ekle</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Her değişiklik hareket ve audit kaydına yazılır. Azaltma kullanılabilir stoğu eksiye düşüremez.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <AdminFormField label="İşlem yönü" required><AdminSelect value={direction} onValueChange={(value) => { setDirection(value); setReasonCode(value === 'increase' ? 'stock_receipt' : 'manual_correction'); }} options={[{ value: 'increase', label: 'Stoğu artır' }, { value: 'decrease', label: 'Stoğu azalt' }]} /></AdminFormField>
            <AdminFormField label="Miktar" required><input className={adminInputClass} type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="1" /></AdminFormField>
            <AdminFormField label="Neden" required><AdminSelect value={reasonCode} onValueChange={setReasonCode} options={reasonOptions.filter((option) => option.directions.includes(direction))} /></AdminFormField>
            <AdminFormField label="Açıklama" hint="İsteğe bağlı"><input className={adminInputClass} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Sayım notu veya belge bilgisi" /></AdminFormField>
          </div>
          <div className="mt-4 flex justify-end"><AdminButton type="submit" disabled={submitting}>{direction === 'increase' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}{submitting ? 'Kaydediliyor…' : 'Hareketi kaydet'}</AdminButton></div>
        </form>

        <div className="mt-4 rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold">Düşük stok uyarısı</h3>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <AdminFormField className="flex-1" label="Uyarı eşiği" hint="0 değeri uyarıyı kapatır"><input className={adminInputClass} type="number" min="0" step="1" value={threshold} onChange={(event) => setThreshold(event.target.value)} /></AdminFormField>
            <AdminButton type="button" variant="secondary" disabled={submitting} onClick={updateThreshold}>Eşiği güncelle</AdminButton>
          </div>
        </div>

        <section className="mt-5">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Son stok hareketleri</h3><span className="text-xs text-muted-foreground">En yeni önce</span></div>
          {loadingMovements ? <div className="mt-3 h-20 animate-pulse rounded-lg bg-muted" /> : movements.length ? (
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-start gap-3 px-3 py-3 text-sm">
                  <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${movement.quantity > 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{movement.quantity > 0 ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}</span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-medium">{movementLabels[movement.movementType] || movement.movementType}</p><p className="font-semibold tabular-nums">{movement.quantity > 0 ? '+' : ''}{movement.quantity} → {movement.balanceAfter}</p></div><p className="mt-1 text-xs text-muted-foreground">{movement.note || movement.createdBy || 'Sistem hareketi'}</p><p className="mt-1 flex items-center gap-1 text-[0.68rem] text-muted-foreground"><Clock3 className="size-3" />{new Date(movement.createdAt).toLocaleString('tr-TR')}</p></div>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">Bu varyant için stok hareketi bulunmuyor.</p>}
        </section>

        <DialogFooter><AdminButton type="button" variant="secondary" onClick={() => onOpenChange(false)}>Kapat</AdminButton></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
