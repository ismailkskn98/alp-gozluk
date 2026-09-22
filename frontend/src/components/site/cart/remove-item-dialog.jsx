'use client';

import { Trash2, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { SiteButton } from '@/components/site/ui/button';

export default function RemoveItemDialog({ open, onOpenChange, item, labels, onConfirm }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[#172536]/40 backdrop-blur-[1.5px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <DialogPrimitive.Content className="fixed bottom-0 left-1/2 z-[71] max-h-[88svh] w-full -translate-x-1/2 rounded-t-[1.25rem] border border-b-0 border-[#d8ddd7] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-[#172536] shadow-[0_-18px_48px_rgba(23,37,54,0.14)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in sm:bottom-auto sm:top-1/2 sm:w-[min(calc(100vw-2rem),27rem)] sm:-translate-y-1/2 sm:rounded-[1.25rem] sm:border sm:p-6 sm:shadow-[0_24px_70px_rgba(23,37,54,0.16)]">
          <DialogPrimitive.Close
            className="absolute right-2 top-2 grid size-10 place-items-center rounded-full text-[#68736f] transition-colors hover:bg-[#f1f3f0] hover:text-[#172536]"
            aria-label={labels.closeRemoveDialog}
          >
            <X className="size-4" strokeWidth={1.6} />
          </DialogPrimitive.Close>

          <span className="grid size-9 place-items-center rounded-full bg-[#fff0f0] text-[#b42318]">
            <Trash2 className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </span>
          <DialogPrimitive.Title className="mt-4 pr-8 text-lg font-medium tracking-[-0.015em]">
            {labels.removeTitle}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 max-w-sm text-sm leading-6 text-[#68736f]">
            {labels.removeDescription}
          </DialogPrimitive.Description>

          {item ? (
            <div className="mt-5 border-y border-[#d8ddd7] py-3.5">
              <p className="text-xs text-[#68736f]">{labels.product}</p>
              <p className="mt-1 text-sm font-medium text-[#172536]">{item.name}</p>
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <SiteButton type="button" variant="secondary" onClick={() => onOpenChange(false)}>{labels.cancel}</SiteButton>
            <SiteButton type="button" variant="destructive" onClick={onConfirm}>
              <Trash2 className="size-4" aria-hidden="true" />
              {labels.removeConfirm}
            </SiteButton>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
