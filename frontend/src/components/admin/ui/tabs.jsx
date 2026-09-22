'use client';

import { Tabs as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Tabs = Primitive.Root;

export function TabsList({ className, ...props }) {
  return <Primitive.List className={cn('inline-flex min-h-9 items-center gap-1 rounded-xl border border-border bg-muted/55 p-1', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }) {
  return <Primitive.Trigger className={cn('rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm', className)} {...props} />;
}

export function TabsContent({ className, ...props }) {
  return <Primitive.Content className={cn('mt-5 outline-none', className)} {...props} />;
}
