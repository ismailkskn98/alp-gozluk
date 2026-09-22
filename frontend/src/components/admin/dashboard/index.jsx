import Link from 'next/link';
import { ArrowRight, Box, Database, Package, ShoppingBag, Users, WalletCards, Zap } from 'lucide-react';
import AdminPageHeader from '../page-header';
import AdminAlert from '../ui/alert';
import StatusBadge from '../ui/status-badge';
import DashboardDateFilter from './date-filter';
import RevenueChart from './revenue-chart';

const stats = [
  { label: 'Net satış', value: '₺0,00', note: 'Tamamlanan siparişler', icon: WalletCards },
  { label: 'Sipariş', value: '0', note: 'İşlem bekleyen 0', icon: ShoppingBag },
  { label: 'Müşteri', value: '0', note: 'Yeni müşteri 0', icon: Users },
  { label: 'Kritik stok', value: '0', note: 'Kontrol gereken varyant', icon: Package },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-[clamp(1rem,2vw,1.5rem)]">
      <AdminPageHeader eyebrow="21 Eylül 2026" title="Genel bakış" description="Satış, katalog ve altyapı sinyallerini tek çalışma alanında izleyin." actions={<DashboardDateFilter />} />
      <AdminAlert title="Kurulum sağlıklı ilerliyor" variant="info">Dashboard gerçek sipariş ve rapor endpoint’leri bağlanana kadar yalnız doğrulanabilen sıfır durumlarını gösterir.</AdminAlert>

      <section aria-label="Temel mağaza metrikleri" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <article key={label} className="admin-panel p-[clamp(1rem,2vw,1.25rem)]">
            <div className="flex items-start justify-between gap-4"><p className="text-sm font-medium text-muted-foreground">{label}</p><span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></span></div>
            <p className="mt-5 text-[clamp(1.55rem,2.5vw,2rem)] font-semibold tracking-[-0.04em] tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,.7fr)]">
        <section className="admin-panel min-w-0 p-[clamp(1rem,2vw,1.5rem)]">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Satış ritmi</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">Son 7 gün</h2></div><StatusBadge tone="neutral">Canlı veri bekleniyor</StatusBadge></div>
          <RevenueChart />
        </section>

        <section className="admin-panel p-[clamp(1rem,2vw,1.5rem)]">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Altyapı</p><h2 className="mt-1 text-lg font-semibold">Servis durumu</h2></div><Zap className="size-4 text-success" /></div>
          <div className="mt-5 divide-y divide-border">
            {[['API', 'İzleniyor', 'success', Zap], ['MariaDB', 'Bağlantı ayarlı', 'success', Database], ['Redis', 'WSL aktif', 'success', Box], ['Storage', 'Local / S3', 'info', Package]].map(([label, value, tone, Icon]) => <div key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><Icon className="size-4 text-muted-foreground" /><span className="flex-1 text-sm font-medium">{label}</span><StatusBadge tone={tone}>{value}</StatusBadge></div>)}
          </div>
        </section>
      </div>

      <section className="admin-panel overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border px-[clamp(1rem,2vw,1.5rem)] py-4"><div><h2 className="font-semibold">Son siparişler</h2><p className="mt-1 text-xs text-muted-foreground">En güncel mağaza hareketleri</p></div><Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">Tümünü gör <ArrowRight className="size-3.5" /></Link></div>
        <div className="grid min-h-52 place-items-center p-6 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-xl bg-muted"><ShoppingBag className="size-5 text-muted-foreground" /></span><p className="mt-4 text-sm font-semibold">Sipariş henüz yok</p><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Ödeme doğrulanmış ilk sipariş geldiğinde müşteri, tutar ve durum bilgileri burada listelenecek.</p></div></div>
      </section>
    </div>
  );
}
