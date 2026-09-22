import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  info: [Info, 'border-primary/20 bg-primary/6 text-primary'],
  success: [CheckCircle2, 'border-success/20 bg-success/6 text-success'],
  warning: [TriangleAlert, 'border-warning/20 bg-warning/6 text-warning'],
  danger: [AlertCircle, 'border-danger/20 bg-danger/6 text-danger'],
};

export default function AdminAlert({ title, children, variant = 'info', className }) {
  const [Icon, style] = variants[variant];
  return <div role={variant === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border p-3.5', style, className)}><Icon className="mt-0.5 size-4 shrink-0" /><div><p className="text-sm font-semibold">{title}</p>{children ? <div className="mt-1 text-xs leading-5 text-current/75">{children}</div> : null}</div></div>;
}
