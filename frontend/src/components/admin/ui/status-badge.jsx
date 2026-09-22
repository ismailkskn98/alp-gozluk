import { cn } from '@/lib/utils';

const tones = {
  neutral: 'border-border bg-muted/60 text-muted-foreground',
  info: 'border-primary/20 bg-primary/10 text-primary',
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/20 bg-warning/10 text-warning',
  danger: 'border-danger/20 bg-danger/10 text-danger',
};

export default function StatusBadge({ children, tone = 'neutral', dot = true, className }) {
  return <span className={cn('inline-flex min-h-6 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[0.69rem] font-semibold leading-none', tones[tone], className)}>{dot ? <span className="size-1.5 rounded-full bg-current opacity-70" /> : null}{children}</span>;
}
