import AdminSkeleton from '@/components/admin/ui/skeleton';

export default function AdminPanelLoading() {
  return <div aria-label="Yönetim ekranı yükleniyor" className="space-y-6"><div className="space-y-3"><AdminSkeleton className="h-3 w-24" /><AdminSkeleton className="h-8 w-64" /><AdminSkeleton className="h-4 w-[min(28rem,80%)]" /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <AdminSkeleton key={index} className="h-36 rounded-2xl" />)}</div><div className="grid gap-5 xl:grid-cols-[1.55fr_0.65fr]"><AdminSkeleton className="h-[26rem] rounded-2xl" /><AdminSkeleton className="h-[26rem] rounded-2xl" /></div></div>;
}
