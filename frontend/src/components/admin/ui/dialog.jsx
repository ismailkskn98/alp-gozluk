'use client';

import { X } from 'lucide-react';
import { Dialog as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

export function DialogContent({ children, className, showClose = true, ...props }) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
      <Primitive.Content data-admin-overlay className={cn('fixed left-1/2 top-1/2 z-[71] max-h-[min(85svh,48rem)] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-6', className)} {...props}>
        {children}
        {showClose ? <Primitive.Close className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Kapat"><X className="size-4" /></Primitive.Close> : null}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function DialogHeader({ className, ...props }) { return <div className={cn('space-y-1.5 pr-8', className)} {...props} />; }
export function DialogTitle({ className, ...props }) { return <Primitive.Title className={cn('text-lg font-semibold tracking-[-0.02em]', className)} {...props} />; }
export function DialogDescription({ className, ...props }) { return <Primitive.Description className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />; }
export function DialogFooter({ className, ...props }) { return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />; }
