import { Plus } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/page-header';
import ProductList from '@/components/admin/product-list';

export default function Page() {
  return <><AdminPageHeader title="Ürünler" description="Ürün, hedef kitle, varyant, fiyat ve yayın durumlarını yönetin." actions={<Link href="/admin/products/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"><Plus className="size-4" />Ürün ekle</Link>} /><ProductList /></>;
}
