'use client';

import { AlertCircle, UserRound, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Link } from '@/i18n/navigation';
import { siteButtonVariants } from '@/components/site/ui/button';
import { cn } from '@/lib/utils';

export default function GuestCheckoutDialog({ open, onOpenChange, labels }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[#172536]/45 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <DialogPrimitive.Content className="fixed bottom-0 left-1/2 z-[71] w-full -translate-x-1/2 rounded-t-2xl border border-b-0 border-[#d8ddd7] bg-white p-5 text-[#172536] shadow-[0_-18px_55px_rgba(23,37,54,0.16)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in sm:bottom-auto sm:top-1/2 sm:w-[min(calc(100vw-2rem),30rem)] sm:-translate-y-1/2 sm:rounded-none sm:border sm:p-6 sm:shadow-[0_26px_80px_rgba(23,37,54,0.18)]">
          <DialogPrimitive.Close className="absolute right-2 top-2 grid size-10 place-items-center text-[#68736f] transition-colors hover:bg-[#f1f3f0] hover:text-[#172536]" aria-label={labels.guestClose}>
            <X className="size-4" />
          </DialogPrimitive.Close>
          <span className="grid size-10 place-items-center bg-[#f3f5f2] text-[#172536]"><AlertCircle className="size-5" /></span>
          <DialogPrimitive.Title className="mt-4 pr-10 text-lg font-medium tracking-[-0.02em]">{labels.guestTitle}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-[#68736f]">{labels.guestDescription}</DialogPrimitive.Description>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link href="/checkout" className={cn(siteButtonVariants({ variant: 'secondary', size: 'wide' }), 'rounded-none px-3 text-xs sm:text-sm')}>
              {labels.continueAsGuest}
            </Link>
            <Link href="/login?next=%2Fcheckout" className={cn(siteButtonVariants({ size: 'wide' }), 'rounded-none px-3 text-xs sm:text-sm')}>
              <UserRound className="size-4" />{labels.signInOrRegister}
            </Link>
          </div>
          <p className="mt-4 text-center text-[0.7rem] leading-5 text-[#7b8580]">{labels.guestPrivacy}</p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
