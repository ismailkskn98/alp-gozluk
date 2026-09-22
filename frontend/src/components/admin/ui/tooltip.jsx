'use client';

import { Tooltip as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export default function Tooltip({ children, content, side = 'bottom' }) {
  return (
    <Primitive.Provider delayDuration={250}>
      <Primitive.Root>
        <Primitive.Trigger asChild>{children}</Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content data-admin-overlay side={side} sideOffset={7} className={cn('z-[80] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg data-[state=delayed-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=delayed-open]:fade-in')}>
            {content}
            <Primitive.Arrow className="fill-popover" />
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  );
}
