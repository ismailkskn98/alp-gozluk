'use client';

import { ContextMenu as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const ContextMenu = Primitive.Root;
export const ContextMenuTrigger = Primitive.Trigger;

export function ContextMenuContent({ className, ...props }) {
  return <Primitive.Portal><Primitive.Content data-admin-overlay className={cn('z-[90] min-w-44 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl', className)} {...props} /></Primitive.Portal>;
}

export function ContextMenuItem({ className, ...props }) {
  return <Primitive.Item className={cn('flex min-h-9 cursor-default select-none items-center gap-2 rounded-lg px-2.5 text-sm outline-none focus:bg-muted data-[disabled]:opacity-50', className)} {...props} />;
}

export function ContextMenuSeparator({ className, ...props }) {
  return <Primitive.Separator className={cn('my-1 h-px bg-border', className)} {...props} />;
}
