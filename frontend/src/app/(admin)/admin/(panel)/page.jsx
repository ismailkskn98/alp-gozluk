import { ArrowDownRight, ArrowUpRight, Package, ShoppingBag, Users, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AdminPageHeader from '@/components/admin/page-header';

const stats = [
  ['Toplam ciro', '₺0,00', '+0%', WalletCards, true],
  ['Sipariş', '0', '+0%', ShoppingBag, true],
  ['Müşteri', '0', '+0%', Users, true],
  ['Kritik stok', '0', '0', Package, false],
];

export default function AdminDashboardPage() {
  return <><AdminPageHeader eyebrow="19 Eylül 2026" title="Genel bakış" description="Mağazanın satış, sipariş ve stok durumunu tek ekranda izleyin." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, trend, Icon, positive]) => <article key={label} className="rounded-lg border border-border bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="size-4 text-muted-foreground" /></div><p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p><p className={`mt-2 flex items-center gap-1 text-xs ${positive ? 'text-success' : 'text-muted-foreground'}`}>{positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{trend} önceki döneme göre</p></article>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]"><section className="rounded-lg border border-border bg-white"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">Son siparişler</h2><p className="mt-1 text-xs text-muted-foreground">En güncel mağaza hareketleri</p></div><Badge variant="secondary">Canlı</Badge></div><div className="grid min-h-64 place-items-center p-6 text-center"><div><ShoppingBag className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Sipariş henüz yok</p><p className="mt-1 text-xs text-muted-foreground">Yeni siparişler burada görünecek.</p></div></div></section><section className="rounded-lg border border-border bg-white p-5"><h2 className="font-semibold">Sistem durumu</h2><div className="mt-5 space-y-4 text-sm">{[['API', 'Kontrol bekliyor'], ['MariaDB', 'Kontrol bekliyor'], ['Redis', 'Kontrol bekliyor'], ['Storage', 'Local / S3']].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-border pb-3 last:border-0"><span>{label}</span><span className="text-xs text-muted-foreground">{value}</span></div>)}</div></section></div></>;
}
