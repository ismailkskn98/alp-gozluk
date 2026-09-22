import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from '@/lib/utils';

const siteInputClassName =
  'h-11 w-full min-w-0 rounded-[0.625rem] border border-[#cfd5d1] bg-white px-3.5 text-sm text-[#172536] outline-none transition-[border-color,background-color] duration-200 placeholder:text-[#929c97] hover:border-[#aeb7b2] focus:border-[#65746e] disabled:cursor-not-allowed disabled:bg-[#f3f5f2] disabled:text-[#7b8580] aria-invalid:border-[#bd3434]';

function SiteInput({ className, ...props }) {
  return <InputPrimitive data-slot="site-input" className={cn(siteInputClassName, className)} {...props} />;
}

export { SiteInput, siteInputClassName };
