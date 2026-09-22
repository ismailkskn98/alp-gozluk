'use client';

import { AlertTriangle, Archive, LoaderCircle, Trash2 } from 'lucide-react';
import { AdminButton } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';

const icons = {
  archive: Archive,
  delete: Trash2,
};

export default function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  confirmLabel = 'Sil',
  pending = false,
  variant = 'delete',
}) {
  const ActionIcon = icons[variant] || AlertTriangle;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!pending) onOpenChange(nextOpen); }}>
      <DialogContent
        showClose={!pending}
        className="bottom-0 top-auto max-h-[88svh] w-full max-w-none -translate-x-1/2 translate-y-0 rounded-b-none rounded-t-2xl p-0 sm:bottom-auto sm:top-1/2 sm:w-[min(92vw,30rem)] sm:-translate-y-1/2 sm:rounded-2xl"
      >
        <div className="p-5 sm:p-6">
          <div className="mb-5 grid size-11 place-items-center rounded-xl border border-danger/20 bg-danger/8 text-danger">
            <ActionIcon className="size-5" aria-hidden="true" />
          </div>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {itemName ? (
            <div className="mt-4 rounded-xl border border-border bg-muted/45 px-4 py-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Etkilenecek kayıt</p>
              <p className="mt-1 break-words text-sm font-medium text-foreground">{itemName}</p>
            </div>
          ) : null}
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/8 px-4 py-3 text-xs leading-5 text-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            İşlemi onaylamadan önce doğru kaydı seçtiğinizden emin olun.
          </div>
          <DialogFooter className="mt-5">
            <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => onOpenChange(false)}>Vazgeç</AdminButton>
            <AdminButton type="button" variant="danger" disabled={pending} onClick={onConfirm}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ActionIcon className="size-4" />}
              {pending ? 'İşleniyor…' : confirmLabel}
            </AdminButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
