import { Plus } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/page-header';

export default function Page() {
  return <><AdminPageHeader title="Ürünler" description="Ürün, varyant, fiyat ve yayın durumlarını yönetin." actions={<Link href="/admin/products/new" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-white"><Plus className="size-4" />Ürün ekle</Link>} /><div className="rounded-lg border border-border bg-white"><div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-4 border-b border-border bg-muted/60 px-4 py-3 text-xs font-medium text-muted-foreground"><span>Ürün</span><span>Durum</span><span>Stok</span><span>İşlem</span></div><div className="px-5 py-14 text-center"><p className="font-medium">Admin liste endpointi sonraki katalog adımında bağlanacak</p><p className="mt-2 text-sm text-muted-foreground">Yeni ürün formu ve public katalog akışı kullanıma hazır.</p></div></div></>;
}
