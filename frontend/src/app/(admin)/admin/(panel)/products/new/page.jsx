import AdminPageHeader from '@/components/admin/page-header';
import ProductForm from '@/components/admin/product-form';

export default function NewProductPage() {
  return <><AdminPageHeader eyebrow="Katalog / Ürünler" title="Yeni ürün" description="İlk ürün ve varyant bilgilerini oluşturun. Görseller medya modülünden ilişkilendirilecektir." /><ProductForm /></>;
}
