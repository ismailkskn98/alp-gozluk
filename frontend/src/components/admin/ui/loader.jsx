import { cn } from '@/lib/utils';

// loading.daniasyrofi.com'daki katmanlı hareket yaklaşımı sade bir durum göstergesine uyarlandı.
export default function AdminLoader({ className, label = 'Yükleniyor' }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <span aria-hidden className="relative size-4">
        <span className="absolute inset-0 rounded-full border-2 border-current opacity-15" />
        <span className="admin-loader-orbit absolute inset-0 rounded-full border-2 border-transparent border-t-current" />
      </span>
      <span>{label}</span>
    </span>
  );
}
