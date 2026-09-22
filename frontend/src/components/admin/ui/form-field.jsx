import { cn } from '@/lib/utils';

export function AdminFormField({ label, hint, error, required, children, className, htmlFor }) {
  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium">{label}{required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}</label>
        {hint ? <span className="text-right text-[0.7rem] leading-4 text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p role="alert" className="flex items-center gap-1.5 text-xs text-danger"><span className="size-1 rounded-full bg-current" />{error}</p> : null}
    </div>
  );
}

export const adminInputClass = 'block min-h-11 min-w-0 max-w-full w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground shadow-[0_1px_0_rgba(16,35,61,0.02)] outline-none transition placeholder:text-muted-foreground/70 hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-65 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger/15';
