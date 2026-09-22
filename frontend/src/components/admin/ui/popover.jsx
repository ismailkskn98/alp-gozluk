'use client';

import { Popover as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;

export function PopoverContent({ className, align = 'center', sideOffset = 8, ...props }) {
  return <Primitive.Portal><Primitive.Content data-admin-overlay align={align} sideOffset={sideOffset} className={cn('z-[80] w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in', className)} {...props} /></Primitive.Portal>;
}
