import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="grid-container py-16" aria-label="İçerik yükleniyor">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-5 h-14 max-w-xl" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-80 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}
