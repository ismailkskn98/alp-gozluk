'use client';

import { ChevronDown } from 'lucide-react';
import { Accordion as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Accordion = Primitive.Root;

export function AccordionItem({ className, ...props }) {
  return <Primitive.Item className={cn('border-b border-border last:border-b-0', className)} {...props} />;
}

export function AccordionTrigger({ children, className, ...props }) {
  return <Primitive.Header><Primitive.Trigger className={cn('group flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left text-sm font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/30', className)} {...props}>{children}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" /></Primitive.Trigger></Primitive.Header>;
}

export function AccordionContent({ children, className, ...props }) {
  return <Primitive.Content className="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" {...props}><div className={cn('pb-4 leading-6', className)}>{children}</div></Primitive.Content>;
}
