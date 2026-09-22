import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const siteButtonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium transition-[background-color,border-color,color,opacity] duration-200 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'border border-[#172536] bg-[#172536] text-white hover:border-[#24364a] hover:bg-[#24364a]',
        secondary: 'border border-[#cfd5d1] bg-white text-[#263630] hover:border-[#8b9691] hover:bg-[#f7f8f5]',
        subtle: 'border border-transparent bg-[#eef1ed] text-[#263630] hover:bg-[#e4e8e3]',
        destructive: 'border border-[#bd3434] bg-[#bd3434] text-white hover:border-[#a42b2b] hover:bg-[#a42b2b]',
        text: 'min-h-0 rounded-none border-0 bg-transparent px-0 text-[#172536] underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-11 px-5',
        compact: 'min-h-10 px-4',
        wide: 'min-h-12 w-full px-6',
        icon: 'size-10 min-h-10 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

function SiteButton({ className, variant, size, ...props }) {
  return (
    <ButtonPrimitive
      data-slot="site-button"
      className={cn(siteButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { SiteButton, siteButtonVariants };
