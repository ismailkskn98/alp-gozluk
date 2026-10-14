import AdminPageHeader from '@/components/admin/page-header';
import ProductForm from '@/components/admin/product-form';

export default function NewProductPage() {
  return <><AdminPageHeader eyebrow="Katalog / Ürünler" title="Yeni ürün" description="Ürün ve varyant bilgilerini oluşturun; kayıttan sonra görselleri aynı düzenleme ekranından ekleyin." /><ProductForm /></>;
}
