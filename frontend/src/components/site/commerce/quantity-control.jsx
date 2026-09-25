'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function QuantityControl({
  value,
  min = 1,
  max = 10,
  disabled = false,
  removeAtMinimum = false,
  onValueChange,
  decreaseLabel,
  increaseLabel,
  quantityLabel,
  className,
  buttonClassName,
  valueClassName,
}) {
  const reduceMotion = useReducedMotion();
  const numericValue = Number(value) || min;
  const atMinimum = numericValue <= min;
  const atMaximum = numericValue >= max;

  function decrease() {
    if (disabled || (atMinimum && !removeAtMinimum)) return;
    onValueChange(atMinimum ? 0 : numericValue - 1);
  }

  function increase() {
    if (disabled || atMaximum) return;
    onValueChange(numericValue + 1);
  }

  return (
    <div
      className={cn('flex h-11 w-full min-w-0 items-stretch border border-[#172536] bg-white text-[#172536]', className)}
      role="group"
      aria-label={quantityLabel}
    >
      <motion.button
        type="button"
        onClick={decrease}
        disabled={disabled || (atMinimum && !removeAtMinimum)}
        whileTap={reduceMotion || disabled ? undefined : { scale: 0.9 }}
        className={cn(
          'grid w-11 shrink-0 place-items-center border-r border-[#172536]/15 transition-colors hover:bg-[#edf1f4] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172536]/30 disabled:cursor-not-allowed disabled:opacity-35',
          buttonClassName,
        )}
        aria-label={decreaseLabel}
      >
        {atMinimum && removeAtMinimum
          ? <Trash2 className="size-4" strokeWidth={1.7} />
          : <Minus className="size-4" strokeWidth={1.7} />}
      </motion.button>

      <output
        className={cn('relative flex min-w-12 flex-1 items-center justify-center overflow-hidden px-3 text-sm font-semibold tabular-nums', valueClassName)}
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={numericValue}
            initial={reduceMotion ? false : { y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: -8, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {numericValue}
          </motion.span>
        </AnimatePresence>
      </output>

      <motion.button
        type="button"
        onClick={increase}
        disabled={disabled || atMaximum}
        whileTap={reduceMotion || disabled ? undefined : { scale: 0.9 }}
        className={cn(
          'grid w-11 shrink-0 place-items-center border-l border-[#172536]/15 transition-colors hover:bg-[#edf1f4] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172536]/30 disabled:cursor-not-allowed disabled:opacity-35',
          buttonClassName,
        )}
        aria-label={increaseLabel}
      >
        <Plus className="size-4" strokeWidth={1.7} />
      </motion.button>
    </div>
  );
}
