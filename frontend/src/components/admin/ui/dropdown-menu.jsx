'use client';

import { Check, ChevronRight } from 'lucide-react';
import { DropdownMenu as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuGroup = Primitive.Group;
export const DropdownMenuSub = Primitive.Sub;
export const DropdownMenuPortal = Primitive.Portal;

export function DropdownMenuContent({ className, sideOffset = 8, ...props }) {
  return <Primitive.Portal><Primitive.Content data-admin-overlay sideOffset={sideOffset} className={cn('z-[80] min-w-48 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in data-[side=bottom]:slide-in-from-top-1', className)} {...props} /></Primitive.Portal>;
}

export function DropdownMenuItem({ className, inset, ...props }) {
  return <Primitive.Item className={cn('flex min-h-9 cursor-default select-none items-center gap-2 rounded-lg px-2.5 text-sm outline-none transition-colors focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50', inset && 'pl-8', className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }) {
  return <Primitive.Label className={cn('px-2.5 py-2 text-xs font-semibold text-muted-foreground', className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }) {
  return <Primitive.Separator className={cn('-mx-1.5 my-1.5 h-px bg-border', className)} {...props} />;
}

export function DropdownMenuCheckboxItem({ children, checked, className, ...props }) {
  return <Primitive.CheckboxItem checked={checked} className={cn('relative flex min-h-9 cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2.5 text-sm outline-none focus:bg-muted', className)} {...props}><span className="absolute left-2.5"><Primitive.ItemIndicator><Check className="size-3.5" /></Primitive.ItemIndicator></span>{children}</Primitive.CheckboxItem>;
}

export function DropdownMenuSubTrigger({ children, className, ...props }) {
  return <Primitive.SubTrigger className={cn('flex min-h-9 items-center rounded-lg px-2.5 text-sm outline-none focus:bg-muted data-[state=open]:bg-muted', className)} {...props}>{children}<ChevronRight className="ml-auto size-3.5" /></Primitive.SubTrigger>;
}

export function DropdownMenuSubContent({ className, ...props }) {
  return <Primitive.SubContent data-admin-overlay className={cn('z-[90] min-w-40 rounded-xl border border-border bg-popover p-1.5 shadow-xl', className)} {...props} />;
}
