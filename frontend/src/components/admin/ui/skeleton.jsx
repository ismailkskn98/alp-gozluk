import { cn } from '@/lib/utils';

export default function AdminSkeleton({ className }) {
  return <div aria-hidden className={cn('admin-skeleton-shimmer rounded-lg', className)} />;
}
