'use client';

import { formatTurkishPhone, normalizeTurkishPhone } from '@/features/checkout/phone';
import { cn } from '@/lib/utils';

export default function TurkeyPhoneInput({ value, onChange, onBlur, name, inputRef, className, ...props }) {
  return (
    <div className={cn('flex min-w-0', className)}>
      <span className="grid h-11 w-16 shrink-0 place-items-center border border-r-0 border-[#cfd5d1] bg-[#f3f5f2] text-sm text-[#52605a]">
        +90
      </span>
      <input
        {...props}
        ref={inputRef}
        name={name}
        value={formatTurkishPhone(value)}
        onBlur={onBlur}
        onChange={(event) => onChange(normalizeTurkishPhone(event.target.value))}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={15}
        placeholder="(5__) ___ __ __"
        className="h-11 min-w-0 flex-1 rounded-none border border-[#cfd5d1] bg-white px-3.5 text-sm text-[#172536] outline-none transition-colors placeholder:text-[#929c97] hover:border-[#aeb7b2] focus:border-[#65746e] aria-invalid:border-[#bd3434]"
      />
    </div>
  );
}
