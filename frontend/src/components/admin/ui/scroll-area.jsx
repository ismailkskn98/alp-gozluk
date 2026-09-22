'use client';

import { ScrollArea as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export default function ScrollArea({ children, className, viewportClassName }) {
  return (
    <Primitive.Root className={cn('relative overflow-hidden', className)}>
      <Primitive.Viewport className={cn('size-full rounded-[inherit]', viewportClassName)}>{children}</Primitive.Viewport>
      <Primitive.Scrollbar orientation="vertical" className="flex w-2.5 touch-none select-none p-0.5"><Primitive.Thumb className="relative flex-1 rounded-full bg-border-strong" /></Primitive.Scrollbar>
      <Primitive.Corner />
    </Primitive.Root>
  );
}
