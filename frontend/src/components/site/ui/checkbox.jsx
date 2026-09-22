'use client';

import { Checkbox } from '@/components/motion/checkbox';
import { cn } from '@/lib/utils';

function SiteCheckbox({ label, description, className, ...props }) {
  return (
    <Checkbox
      {...props}
      className={cn('min-h-11 gap-3 text-[#263630]', className)}
      indicatorClassName="size-[1.125rem] rounded-[0.3rem] border border-[#9da8a2] bg-white text-white data-[state=checked]:border-[#172536] data-[state=checked]:bg-[#172536] data-[state=indeterminate]:border-[#172536] data-[state=indeterminate]:bg-[#172536] focus-visible:ring-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#65746e]"
      label={
        description ? (
          <span>
            <span className="block text-sm text-[#263630]">{label}</span>
            <span className="mt-0.5 block text-xs leading-5 text-[#68736f]">{description}</span>
          </span>
        ) : label
      }
      labelClassName="text-sm text-[#263630]"
    />
  );
}

export { SiteCheckbox };
