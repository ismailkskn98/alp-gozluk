'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Select as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export function AdminSelect({ value, defaultValue, onValueChange, placeholder = 'Seçin', options, disabled, name, ariaLabel, className }) {
  const encodeValue = (currentValue) => currentValue === '' ? '__admin_empty__' : String(currentValue);
  return (
    <Primitive.Root value={value === undefined ? undefined : encodeValue(value)} defaultValue={defaultValue === undefined ? undefined : encodeValue(defaultValue)} onValueChange={(nextValue) => onValueChange?.(nextValue === '__admin_empty__' ? '' : nextValue)} disabled={disabled} name={name}>
      <Primitive.Trigger
        aria-label={ariaLabel}
        className={cn('flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-input bg-card px-3 text-left text-sm text-foreground outline-none transition hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-65 data-[placeholder]:text-muted-foreground', className)}
      >
        <Primitive.Value placeholder={placeholder} />
        <Primitive.Icon asChild><ChevronDown className="size-4 shrink-0 text-muted-foreground" /></Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content position="popper" sideOffset={6} className="z-[90] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in">
          <Primitive.Viewport>
            {options.map((option) => (
              <Primitive.Item key={option.value || '__empty__'} value={encodeValue(option.value)} disabled={option.disabled} className="relative flex min-h-9 cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-muted data-[disabled]:opacity-45">
                <span className="absolute left-2.5 grid size-4 place-items-center"><Primitive.ItemIndicator><Check className="size-3.5" /></Primitive.ItemIndicator></span>
                <Primitive.ItemText>{option.label}</Primitive.ItemText>
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
