import { cn } from '@/lib/utils';

export function AdminFormField({ label, hint, error, required, children, className, htmlFor }) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium">{label}{required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}</label>
        {hint ? <span className="text-[0.68rem] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p role="alert" className="flex items-center gap-1.5 text-xs text-danger"><span className="size-1 rounded-full bg-current" />{error}</p> : null}
    </div>
  );
}

export const adminInputClass = 'block min-h-10 min-w-0 max-w-full w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/75 hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15';
