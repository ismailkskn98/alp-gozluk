'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/motion/select';
import { cn } from '@/lib/utils';

function SiteSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  name,
  className,
  triggerClassName,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled} className={className}>
      {name ? <input type="hidden" name={name} value={value ?? ''} /> : null}
      <SelectTrigger
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'h-11 rounded-[0.625rem] border-[#cfd5d1] bg-white px-3.5 text-sm text-[#172536] shadow-none hover:border-[#aeb7b2] focus-visible:border-[#65746e] focus-visible:ring-0',
          'aria-invalid:border-[#bd3434]',
          triggerClassName,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-50 max-h-64 overflow-y-auto rounded-[0.625rem] border-[#cfd5d1] bg-white shadow-[0_16px_45px_rgba(23,37,54,0.12)]">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="min-h-10 rounded-lg px-3 text-[#46534e] hover:bg-[#f1f3f0] hover:text-[#172536] focus-visible:bg-[#f1f3f0] data-[selected=true]:bg-[#eef1ed]"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { SiteSelect };
