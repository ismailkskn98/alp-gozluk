"use client";

import { AlertTriangle, Archive, LoaderCircle, Trash2 } from "lucide-react";
import { ActionSwapButton } from "@/components/motion/action-swap";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";

const icons = {
  archive: Archive,
  delete: Trash2,
};

export default function ConfirmActionDialog({ open, onOpenChange, onConfirm, title, description, itemName, itemLabel = "Seçili kayıt", confirmLabel = "Sil", pending = false, variant = "delete" }) {
  const ActionIcon = icons[variant] || AlertTriangle;
  const actionItems = [
    { id: "idle", label: confirmLabel, icon: <ActionIcon className="size-4" strokeWidth={1.7} /> },
    { id: "pending", label: "İşleniyor…", icon: <LoaderCircle className="size-4 animate-spin" /> },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showClose={!pending}
        className="bottom-0 top-auto max-h-[88svh] w-full max-w-none -translate-x-1/2 translate-y-0 rounded-b-none rounded-t-[1.25rem] border-x-0 border-b-0 p-0 shadow-[0_-18px_48px_rgba(23,37,54,0.14)] sm:bottom-auto sm:top-1/2 sm:w-[min(calc(100vw-2rem),27rem)] sm:-translate-y-1/2 sm:rounded-[1.25rem] sm:border sm:shadow-[0_24px_70px_rgba(23,37,54,0.16)]"
      >
        <div className="">
          <DialogHeader className="flex-row items-start gap-3.5 space-y-0 pr-9 text-left">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
              <ActionIcon className="size-[1.05rem]" strokeWidth={1.7} aria-hidden="true" />
            </span>
            <span className="min-w-0 pt-0.5">
              <DialogTitle className="text-[1.05rem] mt-1.5 font-medium leading-6 tracking-[-0.015em]">{title}</DialogTitle>
              <DialogDescription className="mt-1.5 text-[0.8125rem] leading-[1.55]">{description}</DialogDescription>
            </span>
          </DialogHeader>
          {itemName ? (
            <dl className="mt-5 border-y border-border py-3.5">
              <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3">
                <dt className="text-xs text-muted-foreground">{itemLabel}</dt>
                <dd className="break-words text-right text-sm font-medium text-foreground">{itemName}</dd>
              </div>
            </dl>
          ) : null}
          {variant === "delete" ? (
            <p className="mt-3.5 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
              <AlertTriangle className="size-3.5 shrink-0 text-warning" strokeWidth={1.7} aria-hidden="true" />
              Bu işlem geri alınamaz.
            </p>
          ) : null}
          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-border pt-4">
            <button
              type="button"
              disabled={pending}
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
            >
              Vazgeç
            </button>
            <ActionSwapButton
              items={actionItems}
              value={pending ? "pending" : "idle"}
              cycle={false}
              variant="danger"
              size="md"
              animation="blur"
              disabled={pending}
              onClick={onConfirm}
              className="min-h-11 w-full px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
