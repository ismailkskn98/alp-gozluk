import { cn } from '@/lib/utils';

const variants = {
  primary: 'border-primary bg-primary text-primary-foreground hover:brightness-95',
  secondary: 'border-border-strong bg-card text-foreground hover:bg-muted',
  ghost: 'border-transparent bg-transparent text-foreground hover:bg-muted',
  danger: 'border-danger bg-danger text-white hover:brightness-95',
};

export function AdminButton({ as: Component = 'button', className, variant = 'primary', size = 'md', ...props }) {
  return (
    <Component
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-medium outline-none transition disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/35',
        size === 'sm' ? 'min-h-9 px-3 text-xs' : 'min-h-10 px-4 text-sm',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
