'use client';

// Kobra Input OTP bileşeninin slot ve motion yaklaşımı JavaScript yapısına uyarlandı.
import { createContext, useContext } from 'react';
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatusContext = createContext({ status: 'idle' });

export function InputOTP({ status = 'idle', className, containerClassName, children, ...props }) {
  return (
    <StatusContext.Provider value={{ status }}>
      <OTPInput
        data-slot="input-otp"
        aria-invalid={status === 'error'}
        data-success={status === 'success' || undefined}
        inputMode="numeric"
        pattern={REGEXP_ONLY_DIGITS}
        spellCheck={false}
        containerClassName={cn('flex max-w-full items-center gap-2.5', containerClassName)}
        className={cn('disabled:cursor-not-allowed', className)}
        {...props}
      >
        {children}
      </OTPInput>
    </StatusContext.Provider>
  );
}

export function InputOTPGroup({ className, ...props }) {
  return <div className={cn('flex min-w-0 items-center gap-2.5', className)} {...props} />;
}

export function InputOTPSlot({ index, className, ...props }) {
  const context = useContext(OTPInputContext);
  const { status } = useContext(StatusContext);
  const { char, isActive } = context?.slots[index] ?? {};
  const reduceMotion = useReducedMotion();
  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn('relative grid aspect-square min-h-11 w-[clamp(2.55rem,12vw,3.25rem)] place-items-center rounded-xl border bg-foreground/[0.035] text-xl font-semibold tabular-nums outline-none transition-[background-color,border-color,box-shadow] data-[active=true]:border-ring data-[active=true]:bg-foreground/[0.065] data-[active=true]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_15%,transparent)]', status === 'error' && 'border-danger/60 text-danger', status === 'success' && 'border-success/60 text-success', className)}
      {...props}
    >
      <span aria-hidden className={cn('col-start-1 row-start-1 text-foreground/15 transition-opacity', char && 'opacity-0')}>0</span>
      <AnimatePresence initial={false}>
        {char ? <motion.span key={`${index}-${char}`} initial={reduceMotion ? false : { opacity: 0, y: 6, rotateX: -30 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -3 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.28, bounce: 0.2 }} className="col-start-1 row-start-1">{char}</motion.span> : null}
      </AnimatePresence>
    </div>
  );
}

export function InputOTPSeparator() {
  return <div role="separator" className="flex shrink-0 items-center text-muted-foreground"><Minus className="size-4" /></div>;
}
